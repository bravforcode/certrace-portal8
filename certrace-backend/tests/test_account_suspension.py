"""Suspending an account, and what that actually stops.

Built without a database like the rest of the auth suite, so the in-process
store is what is under test; the SQL path writes the same fields through the
statements in ``auth_service``.

The point of these tests is the second half of a suspension. Flipping a status
column is easy and proves nothing: what a customer notices is whether the
browser they left signed in yesterday still works, whether the week-long
refresh token still mints sessions, and whether the suppliers they invited can
still open the form. Each of those is a separate path, and each has its own
test here.
"""

from __future__ import annotations

import datetime
import itertools

import pytest
from fastapi.testclient import TestClient

from app.config import SUPPORT_EMAIL
from app.main import create_app
from app.services.auth_service import (
    _MEMORY_USERS,
    AccountNotEligible,
    account_history,
    anonymise_account,
    get_account,
    restore_account,
    suspend_account,
)

_counter = itertools.count()

_REASON = "invoice 2026-0412, 15 days past the §6.4 notice"


def _fresh_email() -> str:
    return f"suspend-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _register(client: TestClient, email: str, password: str = "a-good-password-1"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _declaration(
    client: TestClient, headers: dict[str, str], declaration_id: str
) -> str:
    doc = {
        "id": declaration_id,
        "name": "Q2 2026 CBAM report",
        "regulation": "cbam",
        "period": "Q2 2026",
        "step": "collect",
        "suppliers": [{"id": "d1", "name": "Siam Yamato Steel"}],
        "requests": [
            {"supplierId": "d1", "products": [{"productId": "hrc", "lots": []}]}
        ],
    }
    assert (
        client.post("/api/v1/declarations", json=doc, headers=headers).status_code
        == 201
    )
    return declaration_id


def test_a_suspended_account_cannot_use_a_token_it_already_holds() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    # The token works right up to the moment the account is suspended.
    assert client.get("/api/auth/me", headers=headers).status_code == 200

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get("/api/auth/me", headers=headers)
    # 403, not 401: the session is intact, the entitlement is gone. The portal
    # clears a session on 401, which would leave this customer at a sign-in
    # screen that refuses them with no reason given.
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "ACCOUNT_SUSPENDED"


def test_the_suspension_reason_stays_out_of_the_response() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get("/api/auth/me", headers=headers)
    # It is our record for a billing dispute. The person reading this screen
    # may not be the person who owes the invoice it names.
    assert "2026-0412" not in response.text
    # What it says instead: where to take it up.
    assert SUPPORT_EMAIL in response.json()["detail"]["message"]


def test_a_suspended_account_cannot_sign_in_again() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "ACCOUNT_SUSPENDED"


def test_a_wrong_password_on_a_suspended_account_still_says_nothing() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.post(
        "/api/auth/login", json={"email": email, "password": "not-the-password"}
    )

    # Suspension must not become a way to test whether an address is ours
    # without holding its password, so the credential check comes first.
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_suspension_burns_the_refresh_token_the_browser_is_holding() -> None:
    client = _client()
    session = _register(client, _fresh_email())

    result = suspend_account(None, session["user"]["id"], reason=_REASON)

    assert result is not None
    # The one minted at registration.
    assert result.refresh_tokens_revoked == 1
    response = client.post(
        "/api/auth/refresh", json={"refreshToken": session["refreshToken"]}
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_REFRESH_TOKEN"


def test_a_suspended_exporters_supplier_links_stop_resolving() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    declaration_id = _declaration(client, headers, "decl-suspend-1")
    minted = client.post(
        f"/api/v1/declarations/{declaration_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    ).json()
    token = minted["token"]
    assert client.get(f"/api/v1/links/{token}").status_code == 200

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get(f"/api/v1/links/{token}")
    # The supplier holds a live token for a declaration nobody may work on. They
    # get the ordinary revoked answer: whose invoice is unpaid is not theirs to
    # learn from an error code.
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "TOKEN_REVOKED"


def test_restoring_brings_back_sign_in_and_the_supplier_links() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    declaration_id = _declaration(client, headers, "decl-suspend-2")
    token = client.post(
        f"/api/v1/declarations/{declaration_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    ).json()["token"]
    suspend_account(None, session["user"]["id"], reason=_REASON)

    restored = restore_account(None, session["user"]["id"])

    assert restored is not None and restored.is_suspended is False
    # Signing in again is the cost of a suspension; re-inviting every supplier
    # would not be, which is why the links were never stamped revoked.
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
        ).status_code
        == 200
    )
    assert client.get(f"/api/v1/links/{token}").status_code == 200


def test_suspending_twice_keeps_the_first_date_and_takes_the_new_reason() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]

    first = suspend_account(None, user_id, reason=_REASON)
    second = suspend_account(None, user_id, reason="sanctions screening hit")

    assert first is not None and second is not None
    assert second.account.suspension_reason == "sanctions screening hit"
    # Nothing left to burn the second time.
    assert second.refresh_tokens_revoked == 0


def test_suspending_an_address_we_do_not_hold_changes_nothing() -> None:
    assert (
        suspend_account(None, "00000000-0000-4000-8000-00000000dead", reason="x")
        is None
    )
    assert restore_account(None, "00000000-0000-4000-8000-00000000dead") is None


# ── The audit trail (revision 014) ───────────────────────────


def test_every_action_is_recorded_with_who_and_why() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]

    suspend_account(None, user_id, reason=_REASON, actor="fern@certrace.co")
    restore_account(None, user_id, actor="wasawat@certrace.co")

    history = account_history(None, user_id)
    # Newest first: the question this answers is "what happened to this
    # account", and the last thing to happen is the part being asked about.
    assert [event.event for event in history] == ["RESTORED", "SUSPENDED"]
    assert history[0].actor == "wasawat@certrace.co"
    assert history[1].actor == "fern@certrace.co"
    assert history[1].reason == _REASON
    assert history[1].details["refresh_tokens_revoked"] == 1
    # A restore has no reason to record -- the cause being resolved is the
    # reason, and §20.4 asks for the access back, not for an essay.
    assert history[0].reason is None


def test_the_audit_trail_names_no_email() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    user_id = session["user"]["id"]

    suspend_account(None, user_id, reason=_REASON, actor="fern@certrace.co")

    # It has to survive anonymisation; an address in it would hand back the
    # identity that anonymisation just removed.
    recorded = repr(account_history(None, user_id))
    assert email not in recorded


# ── Anonymisation (Privacy §11.2) ────────────────────────────


def _suspended_days_ago(user_id: str, days: int) -> None:
    """Backdate the suspension, so the export window can be tested at all."""

    for record in _MEMORY_USERS.values():
        if str(record["id"]) == user_id:
            record["suspended_at"] = datetime.datetime.now(
                datetime.timezone.utc
            ) - datetime.timedelta(days=days)
            return
    raise AssertionError("no such account")


def test_an_account_inside_the_export_window_is_not_anonymised() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]
    suspend_account(None, user_id, reason=_REASON)
    _suspended_days_ago(user_id, 29)

    with pytest.raises(AccountNotEligible) as refused:
        anonymise_account(None, user_id)

    # Terms §9.5 promises thirty days to export. Scrubbing on day 29 destroys
    # a record the customer was told they could still take.
    assert "29 days ago" in str(refused.value)
    assert "1 to go" in str(refused.value)


def test_a_live_account_is_not_anonymised_by_accident() -> None:
    client = _client()
    session = _register(client, _fresh_email())

    with pytest.raises(AccountNotEligible):
        anonymise_account(None, session["user"]["id"])


def test_the_window_can_be_waived_for_someone_who_asks_to_be_erased() -> None:
    client = _client()
    session = _register(client, _fresh_email())

    result = anonymise_account(None, session["user"]["id"], force=True)

    assert result is not None
    assert account_history(None, session["user"]["id"])[0].details["forced"] is True


def test_anonymising_takes_the_identity_out_and_leaves_the_id() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    user_id = session["user"]["id"]
    suspend_account(None, user_id, reason=_REASON)
    _suspended_days_ago(user_id, 31)

    result = anonymise_account(None, user_id, actor="fern@certrace.co")

    assert result is not None and result.refresh_tokens_deleted == 1
    account = get_account(None, user_id)
    # The row is still there -- everything keyed on the id still resolves --
    # but nothing on it names a person or a company.
    assert account is not None
    assert account.status == "ANONYMISED"
    assert email not in account.email
    assert account.first_name is None and account.company_name is None
    assert account.suspension_reason is None


def test_an_anonymised_account_cannot_be_signed_into_or_reset() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    anonymise_account(None, session["user"]["id"], force=True)

    signin = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    # The address is gone from the store, so this is the ordinary "no such
    # account" answer rather than anything that confirms they were ever here.
    assert signin.status_code == 401
    assert signin.json()["detail"]["code"] == "INVALID_CREDENTIALS"

    # And the token they were holding is no longer a way in either.
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {session['accessToken']}"},
    )
    assert me.status_code == 401


def test_an_anonymised_account_cannot_be_suspended_or_restored() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]
    anonymise_account(None, user_id, force=True)

    # One-way door: nothing puts an identity back, so nothing pretends to.
    for action in (
        lambda: suspend_account(None, user_id, reason=_REASON),
        lambda: restore_account(None, user_id),
    ):
        with pytest.raises(AccountNotEligible):
            action()


def test_anonymising_twice_is_not_an_error() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]
    anonymise_account(None, user_id, force=True)

    again = anonymise_account(None, user_id, force=True)

    # "Make sure this person is gone" has to be safe to run twice, and the
    # second run has nothing left to take.
    assert again is not None and again.refresh_tokens_deleted == 0
    assert [e.event for e in account_history(None, user_id)].count("ANONYMISED") == 1
