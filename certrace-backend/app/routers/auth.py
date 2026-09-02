"""FastAPI router for authentication and password management endpoints.

Every endpoint here can produce a security email. They are queued as
background tasks rather than awaited: Resend is a third party, and a customer
who has just set a new password should not watch a spinner because someone
else's mail provider is slow. The response is the truth about what happened to
the password; the email is a notification about it.

Failures follow the contract's ``{"detail": {"code", "message"}}`` shape, so
the screens can branch on ``INVALID_CREDENTIALS`` (wrong current password) and
``INVALID_RESET_TOKEN`` (wrong or expired code) instead of pattern-matching
English prose that a translator will eventually change.
"""

from __future__ import annotations

import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status

from app.config import SUPPORT_EMAIL
from app.models.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services import notifications
from app.services.auth_service import (
    RESET_TOKEN_TTL_MINUTES,
    change_user_password,
    request_password_reset,
    reset_user_password,
    user_exists,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _queue_password_changed(
    background_tasks: BackgroundTasks,
    request: Request,
    email: str,
    locale: str | None,
) -> None:
    """Tell the account holder their password moved.

    This is the email that catches an account takeover, so it is sent on both
    paths that can change a password and cannot be switched off.
    """

    background_tasks.add_task(
        notifications.send_quietly,
        request.app.state.email_transport,
        notifications.PASSWORD_CHANGED,
        to=email,
        locale=locale,
        context={
            "email": email,
            "changed_at": _utc_stamp(),
            "support_email": SUPPORT_EMAIL,
        },
        logo_url=getattr(request.app.state, "email_logo_url", None),
    )


def _utc_stamp() -> str:
    """One timestamp format for both languages.

    A localised date would need a locale-aware calendar (Thai years run 543
    ahead), and getting that subtly wrong on a security notice is worse than
    an unambiguous UTC stamp that reads the same everywhere.
    """

    now = datetime.datetime.now(datetime.timezone.utc)
    return now.strftime("%d %b %Y, %H:%M UTC")


@router.post("/change-password", response_model=AuthResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> AuthResponse:
    """Endpoint for changing a user's password."""
    db = getattr(request.app.state, "database", None)
    # Read before the write: in the no-database mode change_user_password
    # claims an unknown address on first use. Without this check, posting a
    # made-up address would mail a "your password changed" notice to someone
    # who has no account here.
    known_account = user_exists(db, payload.email)
    success, message = change_user_password(
        db=db,
        email=payload.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CREDENTIALS", "message": message},
        )
    if known_account:
        _queue_password_changed(
            background_tasks, request, payload.email, payload.locale
        )
    return AuthResponse(success=True, message=message)


@router.post("/forgot-password", response_model=AuthResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> AuthResponse:
    """Endpoint for requesting a password reset verification code by email."""
    db = getattr(request.app.state, "database", None)
    _, message, token = request_password_reset(db=db, email=payload.email)
    # `token is None` means no such account. The response above is identical
    # either way -- only the mail differs, and only the mailbox owner sees it.
    if token is not None:
        background_tasks.add_task(
            notifications.send_quietly,
            request.app.state.email_transport,
            notifications.PASSWORD_RESET,
            to=payload.email,
            locale=payload.locale,
            context={
                "email": payload.email,
                "code": token,
                "expires_in_minutes": RESET_TOKEN_TTL_MINUTES,
            },
            logo_url=getattr(request.app.state, "email_logo_url", None),
        )
    return AuthResponse(success=True, message=message)


@router.post("/reset-password", response_model=AuthResponse)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> AuthResponse:
    """Endpoint for verifying the emailed code and setting a new password."""
    db = getattr(request.app.state, "database", None)
    success, message = reset_user_password(
        db=db,
        email=payload.email,
        reset_token=payload.reset_token,
        new_password=payload.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_RESET_TOKEN", "message": message},
        )
    _queue_password_changed(background_tasks, request, payload.email, payload.locale)
    return AuthResponse(success=True, message=message)
