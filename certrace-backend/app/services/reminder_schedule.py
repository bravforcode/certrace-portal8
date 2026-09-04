"""When a reminder is due, and which one.

This module is the whole decision and none of the machinery: no database, no
transport, no clock of its own. Give it a due date, today's date and the set of
steps already sent, and it names the one step that is due now -- or nothing.
That is what makes a chase ladder something you can read and test rather than
something you find out about from a supplier's inbox.

── The ladder ──────────────────────────────────────────────────
Each step is an offset in whole days from the deadline. Negative is before it.

    supplier   -7  -2  |  +1  +5  +12        (reminder, then overdue)
    trial      -7  -1  |   0                 (ending, then ended)

── Catch-up without a pile-up ──────────────────────────────────
THE RULE: of every step whose day has passed, send only the LAST one, and only
if it has not been sent.

This is the property that matters when the job does not run. Cron is down for a
week, or the container is rescheduled, or someone disables the workflow while
debugging -- the run that finally happens finds four steps overdue. Sending all
four means a supplier gets four emails in one minute, which is how an address
gets marked as spam and every later reminder disappears silently. Sending the
last one says the true thing (you are twelve days late) exactly once.

It also means a step whose moment passed unsent is never sent late. That is
deliberate: a "2 days left" email that arrives five days after the deadline is
worse than no email, because it is wrong.

── Why offsets rather than "every N days" ──────────────────────
A fixed interval has no way to say that the mail before a deadline and the mail
after it are different messages with different asks. The ladder is short and
finite on purpose: three overdue chases, then Certrace stops. A system that
chases forever is one the recipient learns to filter.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.services import notifications
from app.services.notifications import NotificationType


@dataclass(frozen=True)
class Step:
    """One rung of a ladder: when it fires and what it sends."""

    # Whole days from the deadline. Negative is before, positive is after.
    offset_days: int
    notification: NotificationType

    @property
    def occasion(self) -> str:
        """A stable id for "this rung, for this subject".

        Written into the delivery log, so it has to stay stable across
        deployments: renaming an occasion re-sends every step that carried the
        old name. The sign is always explicit -- ``-7`` and ``+7`` are
        different rungs and must never collide in a log grep.
        """

        return f"{self.notification.key}@{self.offset_days:+d}"


# ── The ladders ───────────────────────────────────────────────

SUPPLIER_LADDER: tuple[Step, ...] = (
    Step(-7, notifications.SUPPLIER_SUBMISSION_REMINDER),
    Step(-2, notifications.SUPPLIER_SUBMISSION_REMINDER),
    Step(+1, notifications.SUPPLIER_SUBMISSION_OVERDUE),
    Step(+5, notifications.SUPPLIER_SUBMISSION_OVERDUE),
    Step(+12, notifications.SUPPLIER_SUBMISSION_OVERDUE),
)

# The trial ladder is shorter because its ending is not negotiable and the
# account holder can see the date on /billing. Two warnings and a receipt.
TRIAL_LADDER: tuple[Step, ...] = (
    Step(-7, notifications.TRIAL_ENDING),
    Step(-1, notifications.TRIAL_ENDING),
    Step(0, notifications.TRIAL_ENDED),
)


def due_step(
    ladder: tuple[Step, ...],
    *,
    deadline: date,
    today: date,
    already_sent: frozenset[str] | set[str],
) -> Step | None:
    """The one step to send today, or ``None``.

    ``already_sent`` holds occasion ids from the delivery log. Passing an empty
    set on a subject that has had reminders before would re-send the whole
    ladder, so a caller that cannot read the log must not call this.
    """

    elapsed = (today - deadline).days

    reached = [step for step in ladder if step.offset_days <= elapsed]
    if not reached:
        return None

    # Only the last rung reached is a candidate. Everything earlier had its
    # moment; see "Catch-up without a pile-up" above.
    latest = reached[-1]
    return None if latest.occasion in already_sent else latest


def days_between(deadline: date, today: date) -> int:
    """Whole days from ``today`` to ``deadline``. Negative once it has passed.

    The copy says "3" and means three days left, so the figure the template
    interpolates is this one, never the raw offset of the rung that fired: a
    run that catches up late must say how late it actually is.
    """

    return (deadline - today).days
