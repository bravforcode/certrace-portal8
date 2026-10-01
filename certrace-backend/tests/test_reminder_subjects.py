"""Registering what may be chased, and the source that reads it back.

PROJECT_STATUS.md R4. The ladder, the claim and the copy were already built and
tested (test_reminders.py); what was missing was anything to chase. These tests
cover the two halves of the seam that closes it:

  * the routes the portal calls when it sends an ask, whose job is to keep
    "registered" and "actually sent" apart - a supplier who has heard from
    nobody must never receive a reminder;
  * ``DatabaseReminderSource``, which turns those rows into the
    ``SupplierRequest`` the run already knows what to do with.

The repository is faked rather than run against PostgreSQL: what is under test
is the routing, the ownership and the mapping, and the SQL underneath is
exercised by the same session factory every other repository method uses.
"""

from __future__ import annotations

import datetime
import itertools

import pytest
from conftest import RecordingTransport
from fastapi.testclient import TestClient

from app.main import create_app
from app.services.reminder_source import DatabaseReminderSource

_counter = itertools.count()

TODAY = datetime.date(2026, 4, 1)


class FakeRepository:
    """The reminder-subject methods of DatabaseRepository, in a dict.

    Keyed the way the real unique constraint is - (user, subject key) - so a
    second registration of the same ask updates rather than duplicating, which
    is the property that keeps a supplier from being chased twice a night.
    """

    def __init__(self) -> None:
        self.rows: dict[tuple[str, str], dict[str, object]] = {}
        self.exporter_name = "Siam Steel Export Co."

    def upsert_reminder_subject(
        self,
        user_id,
        subject_key,
        recipient,
        supplier_name,
        period_label,
        due_date,
        link_url,
        locale,
        account_locked,
    ):
        key = (str(user_id), subject_key)
        row = self.rows.get(key) or {
            "id": f"rs-{len(self.rows)}",
            "userId": str(user_id),
            "subjectKey": subject_key,
            "sentAt": None,
            "resendCount": 0,
            "answeredAt": None,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
        }
        row.update(
            {
                "recipient": recipient,
                "supplierName": supplier_name,
                "periodLabel": period_label,
                "dueDate": due_date.isoformat(),
                "linkUrl": link_url,
                "locale": locale,
                "accountLocked": account_locked,
                "cancelledAt": None,
            }
        )
        self.rows[key] = row
        return row

    def _touch(self, user_id, subject_key, apply):
        row = self.rows.get((str(user_id), subject_key))
        if row is None:
            return None
        apply(row)
        return row

    def mark_reminder_subject_sent(self, user_id, subject_key, when):
        def apply(row):
            if row["sentAt"] is None:
                row["sentAt"] = int(when.timestamp() * 1000)
            else:
                row["resendCount"] = int(row["resendCount"]) + 1

        return self._touch(user_id, subject_key, apply)

    def mark_reminder_subject_answered(self, user_id, subject_key, when):
        return self._touch(
            user_id,
            subject_key,
            lambda row: row.update({"answeredAt": int(when.timestamp() * 1000)}),
        )

    def cancel_reminder_subject(self, user_id, subject_key, when):
        return self._touch(
            user_id,
            subject_key,
            lambda row: row.update({"cancelledAt": int(when.timestamp() * 1000)}),
        )

    def reminder_subject_exists(self, user_id, subject_key):
        return (str(user_id), subject_key) in self.rows

    def count_reminder_subjects_created_since(self, user_id, since):
        return sum(
            1
            for key, row in self.rows.items()
            if key[0] == str(user_id) and row["createdAt"] >= since
        )

    def list_reminder_subjects(self, user_id):
        return [row for key, row in self.rows.items() if key[0] == str(user_id)]

    def open_reminder_subjects(self):
        return [
            {**row, "exporterName": self.exporter_name}
            for row in self.rows.values()
            if row["answeredAt"] is None
            and row["cancelledAt"] is None
            and row["sentAt"] is not None
        ]


@pytest.fixture(name="outbox")
def recording_transport() -> RecordingTransport:
    return RecordingTransport()


@pytest.fixture(name="client")
def api_client(outbox: RecordingTransport) -> TestClient:
    application = create_app(
        email_transport=outbox, cors_origins=[PORTAL, "http://localhost:3000"]
    )
    # Only the reminder store, not app.state.database: setting the latter would
    # also move the account store onto this fake, which knows nothing about
    # users - and every test here has to be able to register one.
    application.state.reminder_store = FakeRepository()
    # On here so the email tests below exercise the send; the default is off
    # (app/config.py), and test_supplier_email_is_off_unless_switched_on
    # covers that.
    application.state.supplier_emails_enabled = True
    return TestClient(application, raise_server_exceptions=False)


def _signed_in(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={
            "email": f"chaser-{next(_counter)}@certrace-tests.co",
            "password": "a-good-password-1",
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


SUBJECT = "w:ws-1:2026-03"

PORTAL = "https://portal.certrace.co"

ASK = {
    "recipient": "plant@xingdathai.com",
    "supplierName": "Xingda Steel Cord (Thailand)",
    "periodLabel": "March 2026",
    "dueDate": "2026-04-10",
    "linkUrl": "https://portal.certrace.co/w/tok_9f2a",
    "locale": "en",
}


def _mint_link(client, headers) -> tuple[str, str]:
    """A real monthly link for this account: (workspace doc id, token).

    A reminder may only carry a link the account itself minted, so every
    registration below starts from one, the way the portal does
    (lib/workspace-link-sync.ts)."""

    doc_id = f"ws-doc-{next(_counter)}"
    created = client.post(
        "/api/v1/declarations",
        json={"id": doc_id, "kind": "workspace"},
        headers=headers,
    )
    assert created.status_code == 201
    minted = client.post(
        f"/api/v1/declarations/{doc_id}/links",
        json={"supplierId": "ws-1", "month": "2026-03"},
        headers=headers,
    )
    assert minted.status_code == 201
    return doc_id, minted.json()["token"]


def _register(client, headers, key=SUBJECT, **over):
    body = {**ASK, **over}
    if "linkUrl" not in over:
        body["linkUrl"] = f"{PORTAL}/w/{_mint_link(client, headers)[1]}"
    return client.put(f"/api/v1/reminder-subjects/{key}", json=body, headers=headers)


# ── Registering is not sending ────────────────────────────────────────────


def test_a_registered_ask_is_not_chased_until_it_is_sent(client) -> None:
    """The distinction the whole table exists for. An ask drafted and never
    sent must not produce a reminder: the supplier has heard from nobody, and
    a chase would be the first they know of it."""

    headers = _signed_in(client)
    assert _register(client, headers).status_code == 200

    source = DatabaseReminderSource(client.app.state.reminder_store)
    assert source.open_supplier_requests(TODAY) == []

    assert (
        client.post(
            f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers
        ).status_code
        == 200
    )
    assert len(source.open_supplier_requests(TODAY)) == 1


def test_the_first_send_is_not_a_resend(client) -> None:
    """ "Sent once last week" and "chased three times and still nothing" are
    different conversations."""

    headers = _signed_in(client)
    _register(client, headers)

    first = client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)
    assert first.json()["resendCount"] == 0
    assert first.json()["sentAt"] is not None

    second = client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)
    assert second.json()["resendCount"] == 1
    assert second.json()["sentAt"] == first.json()["sentAt"], (
        "the clock starts once; a re-send must not reset when we first asked"
    )


def test_registering_the_same_ask_twice_updates_it(client) -> None:
    """A corrected deadline is a correction, not a second supplier to chase."""

    headers = _signed_in(client)
    _register(client, headers)
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    again = _register(client, headers, dueDate="2026-04-20")
    assert again.status_code == 200
    assert again.json()["dueDate"] == "2026-04-20"
    assert again.json()["sentAt"] is not None, "correcting an ask must not un-send it"
    assert (
        len(client.get("/api/v1/reminder-subjects", headers=headers).json()["subjects"])
        == 1
    )


# ── Stopping ──────────────────────────────────────────────────────────────


def test_an_answered_ask_stops_being_chased_but_stays_on_the_record(client) -> None:
    headers = _signed_in(client)
    _register(client, headers)
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    answered = client.post(
        f"/api/v1/reminder-subjects/{SUBJECT}/answered", headers=headers
    )
    assert answered.status_code == 200
    assert answered.json()["answeredAt"] is not None

    source = DatabaseReminderSource(client.app.state.reminder_store)
    assert source.open_supplier_requests(TODAY) == []
    # Still visible to the exporter: "chased twice, answered on the 12th" is
    # the history that tells them whether this supplier is worth keeping.
    listing = client.get("/api/v1/reminder-subjects", headers=headers).json()
    assert len(listing["subjects"]) == 1


def test_a_cancelled_ask_stops_being_chased(client) -> None:
    headers = _signed_in(client)
    _register(client, headers)
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    assert (
        client.delete(
            f"/api/v1/reminder-subjects/{SUBJECT}", headers=headers
        ).status_code
        == 200
    )
    assert (
        DatabaseReminderSource(client.app.state.reminder_store).open_supplier_requests(
            TODAY
        )
        == []
    )


def test_marking_an_unknown_ask_is_not_found(client) -> None:
    headers = _signed_in(client)
    response = client.post(
        "/api/v1/reminder-subjects/w:nope:2026-01/sent", headers=headers
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "REMINDER_SUBJECT_NOT_FOUND"


# ── Whose ask it is ───────────────────────────────────────────────────────


def test_another_account_cannot_see_or_touch_it(client) -> None:
    owner = _signed_in(client)
    _register(client, owner)

    stranger = _signed_in(client)
    assert (
        client.get("/api/v1/reminder-subjects", headers=stranger).json()["subjects"]
        == []
    )
    assert (
        client.post(
            f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=stranger
        ).status_code
        == 404
    )


def test_registering_needs_an_account(client) -> None:
    assert (
        client.put(f"/api/v1/reminder-subjects/{SUBJECT}", json=ASK).status_code == 401
    )


def test_an_address_that_cannot_be_written_to_is_refused(client) -> None:
    """The row exists to hold somewhere to send. A name is not one."""

    headers = _signed_in(client)
    response = _register(client, headers, recipient="the plant manager")
    assert response.status_code == 422


@pytest.mark.parametrize(
    "link_url",
    [
        "javascript:alert(1)",
        "data:text/html,<h1>x</h1>",
        "file:///etc/passwd",
        "ftp://mill.example/report",
        "http://phishing.example/steal",  # plain http, non-loopback host
        "https://user:pass@portal.certrace.co/w/tok",  # embedded credentials
        "https://portal.certrace.co/w/ tok",  # whitespace
    ],
)
def test_a_dangerous_link_is_refused(client, link_url) -> None:
    """The link becomes a clickable button in a Certrace-branded email, so a
    scheme other than https (bar http to localhost) or an embedded credential
    would let a signed-in exporter aim our own mail at a phishing target."""

    headers = _signed_in(client)
    response = _register(client, headers, linkUrl=link_url)
    assert response.status_code == 422


def test_a_localhost_http_link_is_allowed(client) -> None:
    """Plain http survives only for local runs and tests, mirroring cors.py."""

    headers = _signed_in(client)
    _doc, token = _mint_link(client, headers)
    response = _register(client, headers, linkUrl=f"http://localhost:3000/w/{token}")
    assert response.status_code == 200


# ── Without a database ────────────────────────────────────────────────────


def test_reminders_refuse_to_pretend_without_a_database() -> None:
    """Declarations and links keep an in-memory store so a laptop demo works,
    because the same browser reads them back. A reminder is read by a job in
    another process tomorrow: an in-memory one would accept every registration
    and chase nobody, which is the exact failure R4 exists to end."""

    client = TestClient(create_app(), raise_server_exceptions=False)
    headers = _signed_in(client)

    response = client.put(
        f"/api/v1/reminder-subjects/{SUBJECT}", json=ASK, headers=headers
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "REMINDERS_UNAVAILABLE"


# ── What the job actually receives ────────────────────────────────────────


def test_the_source_hands_the_run_what_it_needs_to_write_an_email(client) -> None:
    headers = _signed_in(client)
    link_url = _register(client, headers).json()["linkUrl"]
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    [request] = DatabaseReminderSource(
        client.app.state.reminder_store
    ).open_supplier_requests(TODAY)

    # subject_id is the delivery log's key, so it has to be the portal's own
    # stable id for the ask rather than anything minted here - a new id every
    # night would re-send the whole ladder every night.
    assert request.subject_id == SUBJECT
    assert request.recipient == "plant@xingdathai.com"
    assert request.supplier_name == "Xingda Steel Cord (Thailand)"
    assert request.exporter_name == "Siam Steel Export Co.", (
        "the email says who is asking, and that is the account, not the supplier"
    )
    # Already written for a reader: the job does not know the recipient's
    # language well enough to format a date in it.
    assert request.period_label == "March 2026"
    assert request.due_date == datetime.date(2026, 4, 10)
    assert request.link_url == link_url
    assert request.account_locked is False


def test_a_locked_account_is_passed_through_rather_than_hidden(client) -> None:
    """The ladder decides what a locked account gets told. The source's job is
    to report the fact, not to act on it - certrace-portal/lib/plan.ts stops
    chasing, and a server that also filtered would make that rule live twice."""

    headers = _signed_in(client)
    _register(client, headers, accountLocked=True)
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    [request] = DatabaseReminderSource(
        client.app.state.reminder_store
    ).open_supplier_requests(TODAY)
    assert request.account_locked is True


def test_the_source_does_not_second_guess_the_ladder(client) -> None:
    """Nothing is filtered by date here. The schedule in reminder_schedule.py
    is the only place that decides which rung is due; a source that also
    filtered would move the schedule silently and the two would drift."""

    headers = _signed_in(client)
    _register(client, headers, dueDate="2027-12-31")
    client.post(f"/api/v1/reminder-subjects/{SUBJECT}/sent", headers=headers)

    assert (
        len(
            DatabaseReminderSource(
                client.app.state.reminder_store
            ).open_supplier_requests(TODAY)
        )
        == 1
    )


def test_trial_reminders_stay_empty_until_billing_is_real(client) -> None:
    """Not an oversight: plans are not modelled server-side at all, and a
    trial date invented here would email people about an expiry the product
    does not enforce."""

    assert (
        DatabaseReminderSource(client.app.state.reminder_store).trial_accounts(TODAY)
        == ()
    )


# ── The first send is the data-request email ──────────────────────────────


def _sent(client, headers, key=SUBJECT):
    return client.post(f"/api/v1/reminder-subjects/{key}/sent", headers=headers)


def test_registering_alone_writes_to_nobody(client, outbox) -> None:
    headers = _signed_in(client)
    _register(client, headers)

    assert outbox.sent == []


def test_the_first_send_emails_the_supplier_their_link(client, outbox) -> None:
    headers = _signed_in(client)
    link_url = _register(client, headers).json()["linkUrl"]

    assert _sent(client, headers).status_code == 200

    assert len(outbox.sent) == 1
    message = outbox.last
    assert message.to == ASK["recipient"]
    # Named for the exporter who is asking, not for Certrace.
    assert "Siam Steel Export Co." in message.subject
    assert "March 2026" in message.subject
    assert link_url in message.html
    assert link_url in message.text


def test_a_second_send_does_not_mail_again(client, outbox) -> None:
    """A retry after a dropped response looks exactly like this. Two identical
    requests back to back is how a supplier's filter learns to hide us; the
    ladder does the chasing."""

    headers = _signed_in(client)
    _register(client, headers)
    _sent(client, headers)
    _sent(client, headers)

    assert len(outbox.sent) == 1


def test_a_locked_account_does_not_ask_for_data_it_cannot_accept(
    client, outbox
) -> None:
    headers = _signed_in(client)
    _register(client, headers, accountLocked=True)

    assert _sent(client, headers).status_code == 200
    assert outbox.sent == []


def test_the_request_is_written_in_the_suppliers_language(client, outbox) -> None:
    headers = _signed_in(client)
    _register(client, headers, locale="th", periodLabel="มีนาคม 2026")
    _sent(client, headers)

    assert "ขอข้อมูล" in outbox.last.subject


def test_supplier_email_is_off_unless_switched_on(client, outbox) -> None:
    """The monthly form the link opens is not server-backed yet, so by
    default Certrace records the send and writes to nobody."""

    client.app.state.supplier_emails_enabled = False
    headers = _signed_in(client)
    _register(client, headers)

    assert _sent(client, headers).status_code == 200
    assert outbox.sent == []


# ── Only the account's own live link, on the portal ───────────────────────


def _refused(response) -> None:
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "INVALID_REMINDER_LINK"


def test_a_link_off_the_portal_is_refused_even_with_a_real_token(client) -> None:
    """The phishing case: open signup, then contact@certrace.co mails a button
    to anywhere. A genuine token on someone else's host is still not ours."""

    headers = _signed_in(client)
    _doc, token = _mint_link(client, headers)
    _refused(_register(client, headers, linkUrl=f"https://evil.example/w/{token}"))


def test_a_token_we_never_minted_is_refused(client) -> None:
    headers = _signed_in(client)
    _refused(_register(client, headers, linkUrl=f"{PORTAL}/w/tok_9f2a"))


def test_another_accounts_link_is_refused(client) -> None:
    owner = _signed_in(client)
    _doc, token = _mint_link(client, owner)

    stranger = _signed_in(client)
    _refused(_register(client, stranger, linkUrl=f"{PORTAL}/w/{token}"))


def test_a_revoked_link_is_refused(client) -> None:
    headers = _signed_in(client)
    doc_id, token = _mint_link(client, headers)
    client.post(f"/api/v1/declarations/{doc_id}/links/{token}/revoke", headers=headers)
    _refused(_register(client, headers, linkUrl=f"{PORTAL}/w/{token}"))


@pytest.mark.parametrize(
    "shape",
    [
        "{portal}/w/{token}?next=https://evil.example",
        "{portal}/w/{token}#x",
        "{portal}/login/{token}",
        "{portal}/w/{token}/extra",
    ],
)
def test_only_the_bare_supplier_route_is_accepted(client, shape) -> None:
    headers = _signed_in(client)
    _doc, token = _mint_link(client, headers)
    _refused(
        _register(client, headers, linkUrl=shape.format(portal=PORTAL, token=token))
    )


# ── A ceiling on how many strangers one account can have us write to ──────


def test_new_asks_are_capped_per_day_but_corrections_are_not(client) -> None:
    client.app.state.reminder_subjects_per_day = 2
    headers = _signed_in(client)

    assert _register(client, headers, key="w:a:2026-03").status_code == 200
    assert _register(client, headers, key="w:b:2026-03").status_code == 200

    over = _register(client, headers, key="w:c:2026-03")
    assert over.status_code == 429
    assert over.json()["detail"]["code"] == "REMINDER_QUOTA_EXCEEDED"

    # A corrected deadline on an ask already registered is not a new stranger.
    again = _register(client, headers, key="w:a:2026-03", dueDate="2026-04-20")
    assert again.status_code == 200


def test_the_cap_is_per_account(client) -> None:
    client.app.state.reminder_subjects_per_day = 1
    first = _signed_in(client)
    assert _register(client, first, key="w:a:2026-03").status_code == 200

    second = _signed_in(client)
    assert _register(client, second, key="w:a:2026-03").status_code == 200
