"""Unit tests for the reminder ladder, the run, and the job entrypoint."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import date

import pytest
from conftest import RecordingTransport

from app.jobs import send_reminders
from app.services import notifications, reminder_schedule, reminders
from app.services.email import EmailDeliveryError

DUE = date(2026, 4, 10)
ENDS = date(2026, 9, 3)


def a_request(**overrides: object) -> reminders.SupplierRequest:
    fields: dict[str, object] = {
        "subject_id": "tok_9f2a",
        "recipient": "plant@xingdathai.com",
        "supplier_name": "Xingda Steel Cord (Thailand)",
        "exporter_name": "Siam Steel",
        "period_label": "March 2026",
        "due_date": DUE,
        "link_url": "https://app.certrace.co/s/tok_9f2a",
        "locale": "en",
    }
    fields.update(overrides)
    return reminders.SupplierRequest(**fields)  # type: ignore[arg-type]


def an_account(**overrides: object) -> reminders.TrialAccount:
    fields: dict[str, object] = {
        "subject_id": "org_siam",
        "recipient": "wasawat@siamsteel.co.th",
        "org_name": "Siam Steel",
        "trial_days": 30,
        "ends_on": ENDS,
        "billing_url": "https://app.certrace.co/billing",
        "locale": "en",
    }
    fields.update(overrides)
    return reminders.TrialAccount(**fields)  # type: ignore[arg-type]


class FakeSource:
    def __init__(
        self,
        requests: Sequence[reminders.SupplierRequest] = (),
        accounts: Sequence[reminders.TrialAccount] = (),
    ) -> None:
        self._requests = requests
        self._accounts = accounts

    def open_supplier_requests(
        self, today: date
    ) -> Sequence[reminders.SupplierRequest]:
        return self._requests

    def trial_accounts(self, today: date) -> Sequence[reminders.TrialAccount]:
        return self._accounts


class FlakyTransport:
    """Refuses the first message, accepts everything after it."""

    def __init__(self) -> None:
        self.attempts = 0

    def send(self, message: object) -> str:
        self.attempts += 1
        if self.attempts == 1:
            raise EmailDeliveryError("HTTP 429: too many requests")
        return f"flaky-{self.attempts}"


def step_on(day: date, sent: set[str] | None = None) -> str | None:
    step = reminder_schedule.due_step(
        reminder_schedule.SUPPLIER_LADDER,
        deadline=DUE,
        today=day,
        already_sent=sent or set(),
    )
    return step.occasion if step else None


# ── The ladder ────────────────────────────────────────────────


def test_nothing_fires_before_the_first_rung() -> None:
    assert step_on(date(2026, 4, 1)) is None  # 9 days out, first rung is 7


def test_each_rung_fires_on_its_day() -> None:
    assert step_on(date(2026, 4, 3)) == "supplier_submission_reminder@-7"
    assert step_on(date(2026, 4, 8)) == "supplier_submission_reminder@-2"
    assert step_on(date(2026, 4, 11)) == "supplier_submission_overdue@+1"
    assert step_on(date(2026, 4, 15)) == "supplier_submission_overdue@+5"
    assert step_on(date(2026, 4, 22)) == "supplier_submission_overdue@+12"


def test_a_rung_already_sent_does_not_fire_again() -> None:
    sent = {"supplier_submission_reminder@-7"}

    assert step_on(date(2026, 4, 3), sent) is None
    assert step_on(date(2026, 4, 4), sent) is None


def test_a_long_outage_sends_one_email_not_four() -> None:
    """Cron down for a fortnight. The catch-up run must not empty the ladder
    into one inbox -- that is how an address stops receiving anything."""

    # Nothing has ever been sent, and every rung up to +12 is now overdue.
    assert step_on(date(2026, 4, 22)) == "supplier_submission_overdue@+12"


def test_a_rung_whose_moment_passed_is_never_sent_late() -> None:
    """A "2 days left" email arriving a week after the deadline is worse than
    no email, because it is wrong."""

    late = date(2026, 4, 15)
    assert step_on(late) == "supplier_submission_overdue@+5"

    sent = {"supplier_submission_overdue@+5"}
    assert step_on(late, sent) is None
    # -7 and -2 were never sent, and stay unsent.
    assert step_on(date(2026, 4, 16), sent) is None


def test_the_ladder_stops() -> None:
    """Three overdue chases, then Certrace goes quiet."""

    exhausted = {step.occasion for step in reminder_schedule.SUPPLIER_LADDER}

    assert step_on(date(2026, 6, 30), exhausted) is None


def test_occasion_ids_are_unique_and_carry_an_explicit_sign() -> None:
    """They are written to the delivery log; a collision silently skips a rung,
    and an unsigned "7" cannot be told from "-7" in a grep."""

    every = reminders.occasions(
        (reminder_schedule.SUPPLIER_LADDER, reminder_schedule.TRIAL_LADDER)
    )

    assert len(every) == len(set(every))
    assert "supplier_submission_reminder@-7" in every
    assert "supplier_submission_overdue@+12" in every


def test_a_logged_occasion_reads_back_to_its_notification() -> None:
    found = reminders.notification_for("supplier_submission_overdue@+5")

    assert found is notifications.SUPPLIER_SUBMISSION_OVERDUE
    assert reminders.notification_for("nonsense@+1") is None


def test_the_trial_ladder_warns_twice_then_reports_the_lock() -> None:
    def trial_step(day: date) -> str | None:
        step = reminder_schedule.due_step(
            reminder_schedule.TRIAL_LADDER,
            deadline=ENDS,
            today=day,
            already_sent=set(),
        )
        return step.occasion if step else None

    assert trial_step(date(2026, 8, 20)) is None
    assert trial_step(date(2026, 8, 27)) == "trial_ending@-7"
    assert trial_step(date(2026, 9, 2)) == "trial_ending@-1"
    assert trial_step(date(2026, 9, 3)) == "trial_ended@+0"


# ── The run ───────────────────────────────────────────────────


def run(
    transport: object,
    source: object,
    *,
    today: date,
    log: reminders.DeliveryLog | None = None,
    **kwargs: object,
) -> reminders.RunSummary:
    return reminders.run(
        transport=transport,  # type: ignore[arg-type]
        source=source,  # type: ignore[arg-type]
        log=log or reminders.InMemoryDeliveryLog(),
        today=today,
        allow_unrecorded=True,
        **kwargs,  # type: ignore[arg-type]
    )


def test_a_due_reminder_is_sent_once_however_often_the_job_runs() -> None:
    transport = RecordingTransport()
    log = reminders.InMemoryDeliveryLog()
    source = FakeSource(requests=[a_request()])

    for _ in range(3):
        run(transport, source, today=date(2026, 4, 8), log=log)

    assert len(transport.sent) == 1
    assert "March 2026" in transport.last.subject


def test_a_locked_account_stops_the_chase() -> None:
    """portal lib/plan.ts: "an account that cannot be worked on must not keep
    sending a supplier reminders about a month nobody can accept"."""

    transport = RecordingTransport()
    source = FakeSource(requests=[a_request(account_locked=True)])

    summary = run(transport, source, today=date(2026, 4, 15))

    assert transport.sent == []
    assert summary.skipped_locked == 1
    assert summary.sent == 0


def test_a_refused_message_releases_its_claim_so_the_next_run_retries() -> None:
    """A rate limit must cost one attempt, not one rung of the ladder."""

    transport = FlakyTransport()
    log = reminders.InMemoryDeliveryLog()
    source = FakeSource(requests=[a_request()])

    first = run(transport, source, today=date(2026, 4, 8), log=log)
    assert first.failed == 1
    assert first.sent == 0
    assert log.occasions_for("tok_9f2a") == set()

    second = run(transport, source, today=date(2026, 4, 8), log=log)
    assert second.sent == 1
    assert log.occasions_for("tok_9f2a") == {"supplier_submission_reminder@-2"}


class RacedLog(reminders.InMemoryDeliveryLog):
    """Reports a rung as unsent, then loses the claim on it.

    This is the window the database's unique index closes: two runs both read
    an empty log, both decide to send, and the insert is what separates them.
    """

    def claim(self, subject_id: str, occasion: str, recipient: str) -> bool:
        return False


def test_a_rung_claimed_by_a_racing_run_is_not_sent_twice() -> None:
    transport = RecordingTransport()
    log = RacedLog()
    source = FakeSource(requests=[a_request()])

    summary = run(transport, source, today=date(2026, 4, 8), log=log)

    # The rung was due and the run tried for it -- the other side simply won.
    assert transport.sent == []
    assert summary.sent == 0
    assert summary.failed == 0


def test_a_dry_run_reports_without_claiming_or_sending() -> None:
    transport = RecordingTransport()
    log = reminders.InMemoryDeliveryLog()
    source = FakeSource(requests=[a_request()])

    summary = run(transport, source, today=date(2026, 4, 8), log=log, dry_run=True)

    assert summary.sent == 1
    assert transport.sent == []
    assert log.occasions_for("tok_9f2a") == set()


def test_sending_against_a_forgetful_log_is_refused() -> None:
    """An in-memory log starts empty at every restart, so an hourly cron would
    send the same overdue notice all day."""

    with pytest.raises(RuntimeError, match="in-memory delivery log"):
        reminders.run(
            transport=RecordingTransport(),
            source=FakeSource(requests=[a_request()]),
            log=reminders.InMemoryDeliveryLog(),
            today=date(2026, 4, 8),
        )


def test_a_late_catch_up_reports_the_real_number_of_days() -> None:
    """The figure comes from today, not from the rung that fired. A run that
    catches up on day 12 must not tell the supplier they are 5 days late."""

    transport = RecordingTransport()
    source = FakeSource(requests=[a_request()])

    run(transport, source, today=date(2026, 4, 25))

    # Rung +12 fired, but the deadline is 15 days behind.
    assert "15" in transport.last.text


def test_thai_recipients_get_thai_months_and_a_buddhist_year() -> None:
    """A Thai plant manager handed "10 April 2026" has to convert it twice."""

    assert reminders.format_date(DUE, "th") == "10 เมษายน 2569"
    assert reminders.format_date(DUE, "th-TH") == "10 เมษายน 2569"
    assert reminders.format_date(DUE, "en") == "10 April 2026"
    assert reminders.format_date(DUE, None) == "10 April 2026"


def test_a_trial_notice_goes_to_the_account_holder() -> None:
    transport = RecordingTransport()
    source = FakeSource(accounts=[an_account()])

    summary = run(transport, source, today=date(2026, 8, 27))

    assert summary.sent == 1
    assert transport.last.to == "wasawat@siamsteel.co.th"
    assert "7" in transport.last.subject


# ── The job ───────────────────────────────────────────────────


def test_the_job_runs_green_with_nothing_to_do() -> None:
    """NullSource until the portal's stores move server-side. A scheduler with
    no data must exit 0, not fail."""

    assert send_reminders.main(["--dry-run"]) == send_reminders.EXIT_OK


def test_a_malformed_date_is_a_configuration_error_not_a_crash() -> None:
    assert (
        send_reminders.main(["--today", "next tuesday", "--dry-run"])
        == send_reminders.EXIT_MISCONFIGURED
    )
