"""Registering what the nightly job may chase (PROJECT_STATUS.md R4).

The exporter's portal is still where a workspace, a supplier's contact details
and a monthly deadline live (D2). So rather than move that estate, the portal
tells the server the one thing the reminder job needs, at the moment it
matters: I have asked this supplier for this month, here is where to write and
by when.

Four verbs, and the split between them is the whole design:

  PUT    .../reminder-subjects/{key}            register or correct an ask
  POST   .../reminder-subjects/{key}/sent       it actually went out
  POST   .../reminder-subjects/{key}/answered   stop chasing, they replied
  DELETE .../reminder-subjects/{key}            stop chasing, we withdrew

Registering is not sending. An ask that was drafted and never sent must never
be chased, because the supplier has never heard from anyone - so ``sent_at``
is set by its own call, and the job reads nothing without it.

Nothing here deletes. Answered and cancelled are stamps, and "chased four
times before they answered" is the history that tells an exporter whether a
supplier is worth keeping.
"""

from __future__ import annotations

import datetime
import ipaddress
import uuid
from urllib.parse import urlsplit

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.routers.auth import current_account
from app.services import notifications
from app.services.auth_service import Account
from app.services.reminders import format_date


def _validated_link_url(raw: str) -> str:
    """The URL a reminder email turns into a clickable button.

    It arrives as free text from the authenticated exporter, so nothing about
    the caller being signed in makes it safe to drop into an ``<a href>`` in a
    Certrace-branded mail. ``html.escape`` in the templates stops it breaking
    out of the attribute, but it does not strip a scheme: without this check a
    ``javascript:``/``data:`` payload, or a plain-http phishing link, rides out
    under our name to a supplier who trusts the sender.

    The rule mirrors ``core/cors.py``: https everywhere, plain http only for
    localhost or a loopback address so local runs and tests still work. The
    portal composes this from ``window.location.origin`` (a different host from
    the API's own ``app_base_url``), so the scheme is the tightest gate that
    does not break the one URL this is supposed to carry.
    """

    value = raw.strip()
    if any(ch.isspace() for ch in value) or "\\" in value:
        raise ValueError("A reminder link cannot contain spaces or backslashes.")
    if any(ord(ch) < 32 or ord(ch) == 127 for ch in value):
        raise ValueError("A reminder link contains invalid characters.")
    try:
        parts = urlsplit(value)
    except ValueError as exc:
        raise ValueError("A reminder link must be a valid URL.") from exc
    scheme = parts.scheme.lower()
    if scheme not in {"http", "https"}:
        raise ValueError("A reminder link must use http or https.")
    if parts.username is not None or parts.password is not None:
        raise ValueError("A reminder link cannot embed credentials.")
    try:
        hostname = parts.hostname
    except ValueError as exc:
        raise ValueError("A reminder link has an invalid host.") from exc
    if not hostname:
        raise ValueError("A reminder link must include a host.")
    if scheme == "http":
        try:
            loopback = ipaddress.ip_address(hostname).is_loopback
        except ValueError:
            loopback = False
        if hostname.lower() != "localhost" and not loopback:
            raise ValueError("A reminder link over plain http is limited to localhost.")
    return value


router = APIRouter(prefix="/api/v1/reminder-subjects", tags=["reminders"])

_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={
        "code": "REMINDER_SUBJECT_NOT_FOUND",
        "message": "That request is not registered for reminders.",
    },
)

_NO_DATABASE = HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail={
        "code": "REMINDERS_UNAVAILABLE",
        "message": (
            "Reminders need a database. This deployment has none, so nothing "
            "would be chased and saying otherwise would be worse than failing."
        ),
    },
)


class RegisterSubject(BaseModel):
    """One ask, already written for a reader.

    ``period_label`` is "March 2026", not a date: the job would otherwise have
    to know the recipient's language to format one, and it does not.
    """

    model_config = {"populate_by_name": True}

    recipient: EmailStr
    supplier_name: str = Field(..., min_length=1, max_length=300, alias="supplierName")
    period_label: str = Field(..., min_length=1, max_length=100, alias="periodLabel")
    due_date: datetime.date = Field(..., alias="dueDate")
    link_url: str = Field(..., min_length=1, max_length=2000, alias="linkUrl")
    locale: str | None = Field(default=None, max_length=20)
    account_locked: bool = Field(default=False, alias="accountLocked")

    @field_validator("link_url")
    @classmethod
    def _check_link_url(cls, value: str) -> str:
        return _validated_link_url(value)


def _store(request: Request):
    database = request.app.state.reminder_store
    if database is None:
        # No in-memory fallback here, unlike declarations and links. Those are
        # read back by the same browser that wrote them, so a process-lifetime
        # store is a working demo. A reminder is read by a job in another
        # process tomorrow - an in-memory one would accept every registration
        # and chase nobody, which is the failure this whole item exists to fix.
        raise _NO_DATABASE
    return database


def _key(subject_key: str) -> str:
    cleaned = subject_key.strip()
    if not cleaned or len(cleaned) > 200:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_SUBJECT_KEY",
                "message": "A subject key is 1 to 200 characters.",
            },
        )
    return cleaned


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


@router.get("")
def list_subjects(
    request: Request, account: Account = Depends(current_account)
) -> dict[str, object]:
    """Everything registered for this account, open or closed.

    Closed rows are included on purpose: the portal shows "chased 3 times,
    answered on 12 May" from exactly this, and a listing that hid them would
    make the exporter's own history invisible to them.
    """

    return {"subjects": _store(request).list_reminder_subjects(uuid.UUID(account.id))}


@router.put("/{subject_key}")
def register(
    subject_key: str,
    body: RegisterSubject,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    return _store(request).upsert_reminder_subject(
        user_id=uuid.UUID(account.id),
        subject_key=_key(subject_key),
        recipient=str(body.recipient),
        supplier_name=body.supplier_name,
        period_label=body.period_label,
        due_date=body.due_date,
        link_url=body.link_url,
        locale=body.locale,
        account_locked=body.account_locked,
    )


@router.post("/{subject_key}/sent")
def mark_sent(
    subject_key: str,
    request: Request,
    background_tasks: BackgroundTasks,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """The ask went out. The first call starts the clock; later ones count.

    The first call is also the moment Certrace writes to the supplier: the
    data-request email carrying their link. Before this, "sent" meant the
    exporter had copied the link and was trusted to pass it on -- the nightly
    ladder then chased a supplier who may never have been told anything.

    Only the first call mails. A later one is a re-send the portal counts
    (``resendCount``), and it is just as likely to be a retry after a dropped
    response as a deliberate nudge -- two identical requests in a row is the
    kind of thing that gets an address marked as spam. The ladder in
    app/services/reminder_schedule.py does the chasing from here.

    Only with CERTRACE_SUPPLIER_EMAILS=1 -- see app/config.py for why it is
    off until the monthly form the link opens can reach the exporter.
    """

    row = _store(request).mark_reminder_subject_sent(
        uuid.UUID(account.id), _key(subject_key), _now()
    )
    if row is None:
        raise _NOT_FOUND
    if (
        getattr(request.app.state, "supplier_emails_enabled", False)
        and int(row["resendCount"]) == 0
        and not row["accountLocked"]
    ):
        locale = row["locale"] or None
        due_date = datetime.date.fromisoformat(str(row["dueDate"]))
        background_tasks.add_task(
            notifications.send_quietly,
            request.app.state.email_transport,
            notifications.SUPPLIER_DATA_REQUEST,
            to=str(row["recipient"]),
            locale=locale,
            context={
                "exporter_name": account.company_name or account.email,
                "supplier_name": row["supplierName"],
                "period_label": row["periodLabel"],
                "due_date": format_date(due_date, locale),
                "link_url": row["linkUrl"],
            },
            logo_url=getattr(request.app.state, "email_logo_url", None),
        )
    return row


@router.post("/{subject_key}/answered")
def mark_answered(
    subject_key: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    row = _store(request).mark_reminder_subject_answered(
        uuid.UUID(account.id), _key(subject_key), _now()
    )
    if row is None:
        raise _NOT_FOUND
    return row


@router.delete("/{subject_key}")
def cancel(
    subject_key: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """Stop chasing without losing the record that we asked."""

    row = _store(request).cancel_reminder_subject(
        uuid.UUID(account.id), _key(subject_key), _now()
    )
    if row is None:
        raise _NOT_FOUND
    return row
