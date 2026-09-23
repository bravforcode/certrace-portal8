"""Scheduled work, triggered over HTTP.

The nightly reminder run (``python -m app.jobs.send_reminders``) needs
something to start it. On the host we run on, a cron service and a shell are
both paid add-ons, and the free web instance sleeps -- so a timer inside this
process would sleep with it. What does run on schedule for free is GitHub
Actions, and the cheapest thing it can do is knock on this door once a day
(.github/workflows/reminders.yml). The knock also wakes the instance.

Doing it this way rather than running the job inside Actions keeps the
production database URL and the Resend key out of GitHub: the only secret
shared between the two is ``CERTRACE_JOBS_TOKEN``, and all it can do is ask
for a run that would happen anyway.

Unset token means the route does not exist (404), not that it is open. The
run itself is ``reminders.run`` -- the same ladder, claim and delivery log the
CLI uses, so a run started here and a run started by hand cannot double-send.
"""

from __future__ import annotations

import datetime
import hmac

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.services import reminders

router = APIRouter(prefix="/api/internal/jobs", tags=["jobs"], include_in_schema=False)


def _authorised(request: Request, authorization: str | None) -> None:
    expected = getattr(request.app.state, "jobs_token", None)
    if not expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(
        token.strip().encode(), expected.encode()
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@router.post("/send-reminders")
def send_reminders(
    request: Request,
    dry_run: bool = False,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    _authorised(request, authorization)

    # Every rung of the ladder links a supplier to the monthly form, which is
    # not server-backed yet (app/config.py, SUPPLIER_EMAILS_ENV). Until it is,
    # a scheduled run may rehearse but must not send.
    if not getattr(request.app.state, "supplier_emails_enabled", False):
        dry_run = True

    database = request.app.state.reminder_store
    if database is None:
        # Same refusal as the CLI: an in-memory delivery log forgets what it
        # sent, so a daily trigger would repeat every reminder every day.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "REMINDERS_UNAVAILABLE", "message": "No database."},
        )

    # Imported here, as in the CLI: they pull in SQLAlchemy, which a test app
    # with a fake store never needs.
    from app.repositories.delivery_log import DatabaseDeliveryLog
    from app.services.reminder_source import DatabaseReminderSource

    summary = reminders.run(
        transport=request.app.state.email_transport,
        source=DatabaseReminderSource(database),
        log=DatabaseDeliveryLog(database.session_factory),
        today=datetime.date.today(),
        logo_url=getattr(request.app.state, "email_logo_url", None),
        dry_run=dry_run,
    )
    return {
        "dryRun": dry_run,
        "considered": summary.considered,
        "sent": summary.sent,
        "failed": summary.failed,
        "skippedLocked": summary.skipped_locked,
    }
