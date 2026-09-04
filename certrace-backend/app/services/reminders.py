"""The reminder run: pull what is outstanding, decide, send, record.

``reminder_schedule`` decides WHICH step is due. This module is everything
around that decision -- where the outstanding work comes from, how a send is
kept from happening twice, and what a run reports when it finishes.

── The two ports ───────────────────────────────────────────────
``ReminderSource``  what is outstanding right now.
``DeliveryLog``     what has already gone out.

Both are protocols rather than concrete classes because the answer to the first
one does not exist on the server yet: supplier requests live in the portal's
``localStorage`` (``certrace-portal/lib/monthly-requests.ts``) and the trial
clock is a fixture in ``lib/data.ts``. Until those move behind the API there is
nothing for a query to read, so the job ships with ``NullSource`` and does
nothing -- which is the correct behaviour for a scheduler with no data, and a
great deal better than a scheduler that guesses.

── Claim before send, release on failure ───────────────────────
The log is written BEFORE the transport is called, and the write is what claims
the send: the table's unique index means two runs racing on the same rung leave
exactly one winner. If delivery then fails, the claim is released so the next
run can try again.

The alternative -- send first, record after -- loses the claim in the window
between them, and a crash there sends the same overdue notice twice. Claiming
first can, at worst, drop one reminder if the process dies between the claim
and the send; the ladder's next rung still fires. A duplicate is worse than a
gap here, because the gap is invisible to the recipient and the duplicate is
the thing that gets Certrace filtered.
"""

from __future__ import annotations

import logging
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from typing import Protocol

from app.services import email_templates, notifications, reminder_schedule
from app.services.email import EmailDeliveryError, EmailTransport
from app.services.notifications import NotificationType
from app.services.reminder_schedule import Step

_LOGGER = logging.getLogger(__name__)


# ── What the run works on ─────────────────────────────────────


@dataclass(frozen=True)
class SupplierRequest:
    """One month of data asked of one supplier, still unanswered."""

    # Stable across runs and unique per request -- the per-month Smart Link
    # token is exactly this, so an adapter should use it rather than mint one.
    subject_id: str
    recipient: str
    supplier_name: str
    exporter_name: str
    # Already written for a reader: "March 2026", "มีนาคม 2569".
    period_label: str
    due_date: date
    link_url: str
    locale: str | None = None
    # The exporter's trial has run out, so their account is a reading room and
    # cannot accept a submission. `certrace-portal/lib/plan.ts` stops chasing
    # at that moment; a server-side chase that kept running would walk a
    # supplier to a form their customer cannot receive.
    account_locked: bool = False


@dataclass(frozen=True)
class TrialAccount:
    """One account on the free tier, with the date it stops being writable."""

    subject_id: str
    recipient: str
    org_name: str
    trial_days: int
    ends_on: date
    billing_url: str
    locale: str | None = None


class ReminderSource(Protocol):
    """Where outstanding work comes from. Returns only what is still open."""

    def open_supplier_requests(self, today: date) -> Sequence[SupplierRequest]:
        """Requests with no submission yet. Answered months must not appear."""

    def trial_accounts(self, today: date) -> Sequence[TrialAccount]:
        """Accounts on the trial tier, including ones that just ended."""


class NullSource:
    """Finds nothing. The default until the portal's stores move server-side."""

    def open_supplier_requests(self, today: date) -> Sequence[SupplierRequest]:
        return ()

    def trial_accounts(self, today: date) -> Sequence[TrialAccount]:
        return ()


# ── What has already gone out ─────────────────────────────────


class DeliveryLog(Protocol):
    """The record that keeps a rung from firing twice."""

    def occasions_for(self, subject_id: str) -> set[str]:
        """Occasion ids already claimed for this subject."""

    def claim(self, subject_id: str, occasion: str, recipient: str) -> bool:
        """Reserve one send. ``False`` means someone else already has it."""

    def release(self, subject_id: str, occasion: str) -> None:
        """Give a claim back after the provider refused the message."""


class InMemoryDeliveryLog:
    """A log that lives as long as the process.

    Enough for a dry run, for the tests, and for a deployment with no database
    -- where it means every run starts with an empty memory and would re-send
    the current rung. That is why :func:`run` refuses to send with one of these
    unless it is told to; see ``allow_unrecorded``.
    """

    def __init__(self) -> None:
        self._claimed: set[tuple[str, str]] = set()

    def occasions_for(self, subject_id: str) -> set[str]:
        return {
            occasion
            for subject, occasion in self._claimed
            if subject == subject_id
        }

    def claim(self, subject_id: str, occasion: str, recipient: str) -> bool:
        key = (subject_id, occasion)
        if key in self._claimed:
            return False
        self._claimed.add(key)
        return True

    def release(self, subject_id: str, occasion: str) -> None:
        self._claimed.discard((subject_id, occasion))


# ── The run ───────────────────────────────────────────────────


@dataclass
class RunSummary:
    """What one pass did, for the job's exit line and for CI to assert on."""

    considered: int = 0
    sent: int = 0
    skipped_locked: int = 0
    failed: int = 0
    # (occasion, recipient) pairs, in the order they were sent. Recipients are
    # redacted; this goes into a log line.
    delivered: list[tuple[str, str]] = field(default_factory=list)

    def __str__(self) -> str:
        return (
            f"considered={self.considered} sent={self.sent} "
            f"failed={self.failed} skipped_locked={self.skipped_locked}"
        )


def run(
    *,
    transport: EmailTransport,
    source: ReminderSource,
    log: DeliveryLog,
    today: date,
    logo_url: str | None = None,
    dry_run: bool = False,
    allow_unrecorded: bool = False,
) -> RunSummary:
    """Send every reminder that is due today, once.

    ``dry_run`` decides and reports without claiming or sending, so a schedule
    change can be inspected against live data before it reaches anyone.

    ``allow_unrecorded`` is the guard on an in-memory log: without a durable
    record, "already sent" is forgotten at every restart and a cron running
    hourly would send the same overdue notice all day. Set it only for a test
    or a one-shot.
    """

    if (
        not dry_run
        and not allow_unrecorded
        and isinstance(log, InMemoryDeliveryLog)
    ):
        raise RuntimeError(
            "Refusing to send against an in-memory delivery log: it forgets "
            "every send at restart, so reminders would repeat. Configure a "
            "database, or pass allow_unrecorded=True if repeats are acceptable."
        )

    summary = RunSummary()

    for request in source.open_supplier_requests(today):
        summary.considered += 1
        if request.account_locked:
            # Not a failure and not a skip to retry -- the month cannot be
            # accepted, so there is nothing to chase toward.
            summary.skipped_locked += 1
            continue
        step = reminder_schedule.due_step(
            reminder_schedule.SUPPLIER_LADDER,
            deadline=request.due_date,
            today=today,
            already_sent=log.occasions_for(request.subject_id),
        )
        if step is not None:
            _deliver(
                transport,
                log,
                summary,
                step=step,
                subject_id=request.subject_id,
                recipient=request.recipient,
                locale=request.locale,
                context=_supplier_context(request, today),
                logo_url=logo_url,
                dry_run=dry_run,
            )

    for account in source.trial_accounts(today):
        summary.considered += 1
        step = reminder_schedule.due_step(
            reminder_schedule.TRIAL_LADDER,
            deadline=account.ends_on,
            today=today,
            already_sent=log.occasions_for(account.subject_id),
        )
        if step is not None:
            _deliver(
                transport,
                log,
                summary,
                step=step,
                subject_id=account.subject_id,
                recipient=account.recipient,
                locale=account.locale,
                context=_trial_context(account, today),
                logo_url=logo_url,
                dry_run=dry_run,
            )

    return summary


def _deliver(
    transport: EmailTransport,
    log: DeliveryLog,
    summary: RunSummary,
    *,
    step: Step,
    subject_id: str,
    recipient: str,
    locale: str | None,
    context: Mapping[str, object],
    logo_url: str | None,
    dry_run: bool,
) -> None:
    if dry_run:
        summary.sent += 1
        summary.delivered.append((step.occasion, notifications.redact_address(recipient)))
        return

    if not log.claim(subject_id, step.occasion, recipient):
        # Another run took this rung between our read of the log and now.
        return

    try:
        notifications.send(
            transport,
            step.notification,
            to=recipient,
            locale=locale,
            context=context,
            logo_url=logo_url,
        )
    except EmailDeliveryError as error:
        log.release(subject_id, step.occasion)
        summary.failed += 1
        _LOGGER.error(
            "Reminder %s for %s was not delivered: %s",
            step.occasion,
            notifications.redact_address(recipient),
            error,
        )
        return
    except Exception:  # noqa: BLE001 - one bad row must not end the run
        log.release(subject_id, step.occasion)
        summary.failed += 1
        _LOGGER.exception(
            "Unexpected failure sending %s to %s",
            step.occasion,
            notifications.redact_address(recipient),
        )
        return

    summary.sent += 1
    summary.delivered.append((step.occasion, notifications.redact_address(recipient)))


# ── Template context ──────────────────────────────────────────
# The figures are recomputed from today's date rather than taken from the rung
# that fired, so a run that catches up late reports the real number of days.


def _supplier_context(
    request: SupplierRequest, today: date
) -> dict[str, object]:
    remaining = reminder_schedule.days_between(request.due_date, today)
    return {
        "supplier_name": request.supplier_name,
        "exporter_name": request.exporter_name,
        "period_label": request.period_label,
        "due_date": format_date(request.due_date, request.locale),
        "link_url": request.link_url,
        "days_left": max(0, remaining),
        "days_overdue": max(0, -remaining),
    }


def _trial_context(account: TrialAccount, today: date) -> dict[str, object]:
    return {
        "org_name": account.org_name,
        "trial_days": account.trial_days,
        "ends_on": format_date(account.ends_on, account.locale),
        "days_left": max(0, reminder_schedule.days_between(account.ends_on, today)),
        "billing_url": account.billing_url,
    }


_THAI_MONTHS = (
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
)

_ENGLISH_MONTHS = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)


def format_date(value: date, locale: str | None) -> str:
    """A date a recipient reads without converting anything.

    Written out rather than numeric because 04/10/2026 is two different days
    depending on where it is opened, and the Thai form carries the Buddhist
    year: a Thai plant manager handed 2026 has to do the arithmetic, and a
    deadline is the wrong place to make someone do arithmetic.

    ``strftime`` is avoided on purpose -- its month names follow the process
    locale, which is C in most containers and would silently give every
    recipient English.
    """

    if email_templates.normalize_locale(locale) == "th":
        return f"{value.day} {_THAI_MONTHS[value.month - 1]} {value.year + 543}"
    return f"{value.day} {_ENGLISH_MONTHS[value.month - 1]} {value.year}"


def occasions(ladders: Iterable[tuple[Step, ...]]) -> list[str]:
    """Every occasion id a ladder can produce -- for a log query or a report."""

    return [step.occasion for ladder in ladders for step in ladder]


def notification_for(occasion: str) -> NotificationType | None:
    """Read a logged occasion back into the notification that produced it."""

    key, _, _ = occasion.rpartition("@")
    return notifications.CATALOG.get(key)
