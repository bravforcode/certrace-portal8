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
import time
from dataclasses import replace

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status

from app.config import SUPPORT_EMAIL
from app.core.google_identity import GoogleTokenError, verify_google_id_token
from app.core.tokens import TokenError, issue_access_token, read_access_token
from app.models.auth import (
    AuthResponse,
    AuthUser,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleSignInRequest,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SessionResponse,
)
from app.services import notifications
from app.services.auth_service import (
    RESET_TOKEN_TTL_MINUTES,
    Account,
    EmailAlreadyRegistered,
    GoogleAccountConflict,
    authenticate_user,
    change_user_password,
    get_account,
    issue_refresh_token,
    mark_onboarded,
    register_user,
    request_password_reset,
    reset_user_password,
    revoke_refresh_token,
    rotate_refresh_token,
    sign_in_with_google,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# One window for every auth limit. Password guesses (login, change-password),
# code guesses (reset-password) and code issuance (forgot-password) all have
# to be counted, or capping one just funnels the attacker to another.
_RATE_WINDOW_SECONDS = 900  # 15 minutes


def _rate_limited(request: Request, key: str, limit: int) -> bool:
    """Record one hit for ``key``; True once it exceeds ``limit`` per window.

    ponytail: per-process fixed window on app.state. Dockerfile pins uvicorn
    --workers 1, so one dict is the whole limiter — move to Redis the day the
    API runs more than one instance. Keyed by email (the guess target), so it
    holds regardless of source IP and needs no proxy-header trust; the flip
    side, throttling a victim's own sign-in by hammering their address, is the
    accepted cost.
    """

    hits: dict[str, list[float]] | None = getattr(
        request.app.state, "auth_rate_hits", None
    )
    if hits is None:
        hits = {}
        request.app.state.auth_rate_hits = hits
    now = time.monotonic()
    # Drop keys that have aged out entirely so cycling through addresses
    # cannot grow the table without bound. O(active keys) per call — auth
    # traffic is small; swap for a TTL cache if that stops being true.
    for stale in [
        k for k, v in hits.items() if all(now - t >= _RATE_WINDOW_SECONDS for t in v)
    ]:
        del hits[stale]
    bucket = [t for t in hits.get(key, ()) if now - t < _RATE_WINDOW_SECONDS]
    hits[key] = bucket
    if len(bucket) >= limit:
        return True
    bucket.append(now)
    return False


def _rate_limit_or_429(request: Request, key: str, limit: int) -> None:
    if _rate_limited(request, key, limit):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": "Too many attempts. Please try again later.",
            },
        )


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


def _signing_secret(request: Request) -> str:
    secret = getattr(request.app.state, "jwt_secret", None)
    if not secret:
        # Reached only if the app was built without a secret, which
        # create_app refuses to do when a database is configured. Answering
        # 503 keeps an unsigned-token path from ever existing.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "AUTH_NOT_CONFIGURED",
                "message": "Token signing is not configured on this server.",
            },
        )
    return secret


def _session_response(request: Request, account: Account) -> SessionResponse:
    token = issue_access_token(
        _signing_secret(request), user_id=account.id, email=account.email
    )
    refresh = issue_refresh_token(
        getattr(request.app.state, "database", None), account.id
    )
    return SessionResponse(
        access_token=token, refresh_token=refresh, user=_as_auth_user(account)
    )


def _as_auth_user(account: Account) -> AuthUser:
    return AuthUser(
        id=account.id,
        email=account.email,
        onboarded=account.onboarded,
        first_name=account.first_name,
        last_name=account.last_name,
        company_name=account.company_name,
    )


def current_account(request: Request) -> Account:
    """Resolve the bearer token to an account, or answer 401.

    Every failure -- no header, wrong scheme, bad signature, expired, a subject
    naming an account that has since been deleted -- gives the same 401 and the
    same code. The portal's HTTP layer clears the stored session on any 401, so
    it needs one answer meaning "sign in again", not a taxonomy of reasons for
    a caller to probe.
    """

    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorized()

    try:
        user_id = read_access_token(_signing_secret(request), token.strip())
    except TokenError as exc:
        raise _unauthorized() from exc

    account = get_account(getattr(request.app.state, "database", None), user_id)
    if account is None:
        raise _unauthorized()
    return account


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_CREDENTIALS",
            "message": "Your session has expired. Please sign in again.",
        },
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/register", response_model=SessionResponse, status_code=201)
def register(payload: RegisterRequest, request: Request) -> SessionResponse:
    """Create an account and sign the caller straight in."""

    # Per-address cap: stops hammering one email. Mass registration across
    # many addresses needs a per-IP limit at the proxy — out of scope here.
    _rate_limit_or_429(request, f"rg:{payload.email.strip().lower()}", 5)
    try:
        account = register_user(
            getattr(request.app.state, "database", None),
            payload.email,
            payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            company_name=payload.company_name,
        )
    except EmailAlreadyRegistered as exc:
        # The contract gives signup its own code, so the form can point at the
        # email field. It does leak that the address is registered -- which the
        # signup form cannot avoid, since it has to say why it refused.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "EMAIL_TAKEN",
                "message": "An account already exists for that email.",
            },
        ) from exc
    return _session_response(request, account)


@router.post("/login", response_model=SessionResponse)
def login(payload: LoginRequest, request: Request) -> SessionResponse:
    _rate_limit_or_429(request, f"lg:{payload.email.strip().lower()}", 10)
    account = authenticate_user(
        getattr(request.app.state, "database", None), payload.email, payload.password
    )
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Email or password is incorrect.",
            },
        )
    return _session_response(request, account)


@router.post("/google", response_model=SessionResponse)
def google_sign_in(payload: GoogleSignInRequest, request: Request) -> SessionResponse:
    """Sign in (or up) with a Google ID token.

    Finds, links or creates the account — see auth_service.sign_in_with_google
    for the three cases and why linking retires an old password. The session
    handed back is the same one /login hands back, so nothing downstream knows
    or cares how the person proved who they are.
    """

    client_id = getattr(request.app.state, "google_client_id", None)
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "GOOGLE_NOT_CONFIGURED",
                "message": "Sign in with Google is not configured on this server.",
            },
        )
    resolver = getattr(request.app.state, "google_key_resolver", None)
    try:
        identity = verify_google_id_token(
            payload.id_token,
            client_id=client_id,
            nonce=payload.nonce,
            **({"key_resolver": resolver} if resolver else {}),
        )
    except GoogleTokenError as exc:
        # One answer for every way a token can fail: the reason is for our
        # logs, not for whoever is presenting tokens to find out which check
        # they got past.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_GOOGLE_TOKEN",
                "message": "Google sign-in could not be verified. Please try again.",
            },
        ) from exc

    try:
        account = sign_in_with_google(
            getattr(request.app.state, "database", None), identity
        )
    except GoogleAccountConflict as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "GOOGLE_ACCOUNT_CONFLICT",
                "message": "This email is linked to a different Google account.",
            },
        ) from exc
    return _session_response(request, account)


@router.get("/me", response_model=MeResponse)
def me(account: Account = Depends(current_account)) -> MeResponse:
    return MeResponse(user=_as_auth_user(account))


@router.post("/onboarded", response_model=MeResponse)
def complete_onboarding(
    request: Request, account: Account = Depends(current_account)
) -> MeResponse:
    """Mark the signed-in account as having finished onboarding.

    The portal calls this when the wizard completes; from then on, signing in
    routes straight to the dashboard instead of back through setup. No body:
    the bearer token names the account, and the only thing this can say is
    "done".
    """

    mark_onboarded(getattr(request.app.state, "database", None), account.id)
    return MeResponse(user=_as_auth_user(replace(account, onboarded=True)))


@router.post("/refresh", response_model=SessionResponse)
def refresh_session(payload: RefreshRequest, request: Request) -> SessionResponse:
    """Trade a live refresh token for a fresh access token — and a successor.

    The presented token is burned in the same transaction (see
    rotate_refresh_token), so every session holds exactly one live refresh
    token at a time. No rate limit: the token is a 256-bit secret, and the
    failure answer carries nothing a guesser can climb on.
    """

    db = getattr(request.app.state, "database", None)
    rotated = rotate_refresh_token(db, payload.refresh_token)
    account = get_account(db, rotated[0]) if rotated else None
    if rotated is None or account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_REFRESH_TOKEN",
                "message": "Please sign in again.",
            },
        )
    token = issue_access_token(
        _signing_secret(request), user_id=account.id, email=account.email
    )
    return SessionResponse(
        access_token=token, refresh_token=rotated[1], user=_as_auth_user(account)
    )


@router.post("/logout", response_model=AuthResponse)
def logout(payload: RefreshRequest, request: Request) -> AuthResponse:
    """Revoke the session's refresh token.

    The access JWT cannot be recalled — it simply ages out within the hour —
    but this is what stops a signed-out browser's refresh token from quietly
    minting new ones for a week. Always succeeds: the caller is leaving, and
    "that token was already dead" is not something they can act on.
    """

    revoke_refresh_token(
        getattr(request.app.state, "database", None), payload.refresh_token
    )
    return AuthResponse(success=True, message="Signed out.")


@router.post("/change-password", response_model=AuthResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    account: Account = Depends(current_account),
) -> AuthResponse:
    """Change the signed-in account's password.

    The bearer token names WHOSE password moves — the email in the body is
    ignored. Unauthenticated, this endpoint was an unlimited credential
    oracle: email + password guess in, distinguishable yes/no out.
    """

    # The token proves a session, not the password. Still capped: a stolen
    # browser session must not get unlimited guesses at the one credential
    # it does not hold.
    _rate_limit_or_429(request, f"cp:{account.email}", 10)
    db = getattr(request.app.state, "database", None)
    success, message = change_user_password(
        db=db,
        email=account.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CREDENTIALS", "message": message},
        )
    _queue_password_changed(background_tasks, request, account.email, payload.locale)
    return AuthResponse(success=True, message=message)


@router.post("/forgot-password", response_model=AuthResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> AuthResponse:
    """Endpoint for requesting a password reset verification code by email."""
    # Caps both mail-bombing and "ask for a fresh code" cycling. Keyed on the
    # address alone, so a known and an unknown email are throttled identically
    # — no new existence oracle.
    _rate_limit_or_429(request, f"fp:{payload.email.strip().lower()}", 5)
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
    # First fence around the code; the second is per-code: MAX_RESET_ATTEMPTS
    # wrong guesses burn it (auth_service). Both are needed — this one slows
    # the firehose, that one caps total tries even across windows.
    _rate_limit_or_429(request, f"rp:{payload.email.strip().lower()}", 10)
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
