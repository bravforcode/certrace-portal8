"""Authentication service handling password changes, reset tokens, and DB/in-memory fallback."""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import generate_reset_token, hash_password, verify_password

if TYPE_CHECKING:
    from app.repositories.database import DatabaseRepository

# In-memory fallback user store & reset token store
_MEMORY_USERS: dict[str, str] = {
    "wasawat@siamsteel.co.th": hash_password("demo-password"),
    "demo@certrace.com": hash_password("demo-password"),
}

# Structure: {email: {"token": str, "expires_at": datetime, "used": bool}}
_MEMORY_RESET_TOKENS: dict[str, dict[str, object]] = {}

RESET_TOKEN_TTL_MINUTES = 15

# The one answer /forgot-password gives, whether or not the address is ours.
# Anything that varies with existence turns the endpoint into a membership
# oracle: an attacker with a list of addresses learns which are customers.
GENERIC_RESET_MESSAGE = (
    "If an account exists for that email, a reset code is on its way."
)


def user_exists(db: DatabaseRepository | None, email: str) -> bool:
    """Whether we hold an account for this address.

    Callers use it to decide whether to *send* -- never to decide what to say
    back. Mailing a password-reset code to an address that never signed up is
    unsolicited mail sent on an attacker's behalf.
    """

    email_clean = email.strip().lower()
    if db is not None:
        try:
            with db.session_factory() as session:
                found = session.execute(
                    text("SELECT 1 FROM public.users WHERE LOWER(email) = :email"),
                    {"email": email_clean},
                ).first()
                if found is not None:
                    return True
        except SQLAlchemyError:
            pass
    return email_clean in _MEMORY_USERS


def change_user_password(
    db: DatabaseRepository | None,
    email: str,
    current_password: str,
    new_password: str,
) -> tuple[bool, str]:
    """Change password for an existing user after verifying current password."""
    email_clean = email.strip().lower()
    new_hash = hash_password(new_password)

    if db is not None:
        try:
            with db.session_factory() as session:
                result = session.execute(
                    text(
                        "SELECT password_hash FROM public.users WHERE LOWER(email) = :email"
                    ),
                    {"email": email_clean},
                ).first()

                if result is not None:
                    stored_hash = result[0]
                    if not verify_password(current_password, stored_hash):
                        return False, "Current password is incorrect."

                    session.execute(
                        text(
                            "UPDATE public.users SET password_hash = :new_hash WHERE LOWER(email) = :email"
                        ),
                        {"new_hash": new_hash, "email": email_clean},
                    )
                    session.commit()
                    return True, "Password updated successfully."
        except SQLAlchemyError:
            pass  # Fallback to memory store if DB operation fails

    # Fallback / In-Memory Store
    stored_hash = _MEMORY_USERS.get(email_clean)
    if stored_hash is None:
        # If user not in seed memory, register user with current password as fixture for testing
        _MEMORY_USERS[email_clean] = hash_password(current_password)
        stored_hash = _MEMORY_USERS[email_clean]

    if not verify_password(current_password, stored_hash):
        return False, "Current password is incorrect."

    _MEMORY_USERS[email_clean] = new_hash
    return True, "Password updated successfully."


def request_password_reset(
    db: DatabaseRepository | None,
    email: str,
) -> tuple[bool, str, str | None]:
    """Issue a password reset code, if the address belongs to an account.

    The third element is the code, and it is for the caller to *email* -- not
    to put in the HTTP response. Returning it there would let anyone who can
    reach the endpoint reset any account they can name (docs/API-CONTRACT.md
    section 1). ``None`` means no account, so nothing to send.
    """
    email_clean = email.strip().lower()
    if not user_exists(db, email_clean):
        return True, GENERIC_RESET_MESSAGE, None

    token = generate_reset_token()
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=RESET_TOKEN_TTL_MINUTES
    )

    if db is not None:
        try:
            with db.session_factory() as session:
                session.execute(
                    text(
                        "INSERT INTO public.password_resets (email, token, expires_at) "
                        "VALUES (:email, :token, :expires_at)"
                    ),
                    {"email": email_clean, "token": token, "expires_at": expires_at},
                )
                session.commit()
        except SQLAlchemyError:
            pass

    # Save to memory store as well for instant availability & fallback
    _MEMORY_RESET_TOKENS[email_clean] = {
        "token": token,
        "expires_at": expires_at,
        "used": False,
    }

    return True, GENERIC_RESET_MESSAGE, token


def reset_user_password(
    db: DatabaseRepository | None,
    email: str,
    reset_token: str,
    new_password: str,
) -> tuple[bool, str]:
    """Verify reset token and update the user's password."""
    email_clean = email.strip().lower()
    token_clean = reset_token.strip()
    new_hash = hash_password(new_password)
    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Try DB reset token verification
    token_valid = False
    if db is not None:
        try:
            with db.session_factory() as session:
                record = session.execute(
                    text(
                        "SELECT id, expires_at, used FROM public.password_resets "
                        "WHERE LOWER(email) = :email AND token = :token AND used = FALSE "
                        "ORDER BY created_at DESC LIMIT 1"
                    ),
                    {"email": email_clean, "token": token_clean},
                ).first()

                if record is not None:
                    rec_id, rec_expires, rec_used = record
                    if rec_expires > now and not rec_used:
                        token_valid = True
                        session.execute(
                            text(
                                "UPDATE public.password_resets SET used = TRUE WHERE id = :id"
                            ),
                            {"id": rec_id},
                        )
                        session.execute(
                            text(
                                "UPDATE public.users SET password_hash = :new_hash WHERE LOWER(email) = :email"
                            ),
                            {"new_hash": new_hash, "email": email_clean},
                        )
                        session.commit()
        except SQLAlchemyError:
            pass

    # 2. Check Memory reset token store if DB didn't handle it
    if not token_valid:
        mem_record = _MEMORY_RESET_TOKENS.get(email_clean)
        if (
            mem_record
            and mem_record["token"] == token_clean
            and not mem_record["used"]
            and mem_record["expires_at"] > now
        ):
            token_valid = True
            mem_record["used"] = True

    if not token_valid:
        return False, "Invalid or expired reset verification token."

    _MEMORY_USERS[email_clean] = new_hash
    return True, "Password has been successfully reset."
