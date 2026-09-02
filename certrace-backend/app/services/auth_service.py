"""Password changes and reset codes, over PostgreSQL or an in-process store.

There are exactly two modes, and which one is in play is decided once, by
whether the app was given a ``DATABASE_URL``:

* ``db is None``  -- no database configured. A dictionary of demo accounts
  backs the endpoints so the portal can be driven locally and in tests.
* ``db is not None`` -- PostgreSQL is the only account store. A failure to
  reach it raises :class:`AccountStoreUnavailable`; it never silently degrades
  to the dictionary.

That second rule is the point of this module. An earlier version wrapped every
statement in ``except SQLAlchemyError: pass`` and fell through to memory, so a
deployment whose ``users`` table did not exist answered "Password updated
successfully" to any address and any password, and kept reset codes in a
process that a restart or a second instance would take away.
"""

from __future__ import annotations

import datetime
from collections.abc import Iterator
from contextlib import contextmanager
from typing import TYPE_CHECKING

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.security import generate_reset_token, hash_password, verify_password
from app.services.errors import AccountStoreUnavailable

if TYPE_CHECKING:
    from app.repositories.database import DatabaseRepository

# Demo accounts for the no-database mode only. Nothing reads these once a
# DATABASE_URL is set, which is why production must set one -- see
# CERTRACE_REQUIRE_DATABASE.
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

# Said for a wrong password and for an address with no account alike, so the
# endpoint cannot be used to enumerate customers either.
INVALID_CREDENTIALS_MESSAGE = "Current password is incorrect."


def _normalize(email: str) -> str:
    return email.strip().lower()


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


@contextmanager
def _account_session(db: DatabaseRepository) -> Iterator[Session]:
    """Open a session, turning any database failure into a 503-shaped error."""

    try:
        with db.session_factory() as session:
            yield session
    except SQLAlchemyError as exc:
        raise AccountStoreUnavailable(str(exc)) from exc


def user_exists(db: DatabaseRepository | None, email: str) -> bool:
    """Whether we hold an account for this address.

    Callers use it to decide whether to *send* -- never to decide what to say
    back. Mailing a password-reset code to an address that never signed up is
    unsolicited mail sent on an attacker's behalf.
    """

    email_clean = _normalize(email)
    if db is None:
        return email_clean in _MEMORY_USERS

    with _account_session(db) as session:
        found = session.execute(
            text("SELECT 1 FROM public.users WHERE LOWER(email) = :email"),
            {"email": email_clean},
        ).first()
    return found is not None


def change_user_password(
    db: DatabaseRepository | None,
    email: str,
    current_password: str,
    new_password: str,
) -> tuple[bool, str]:
    """Change a password after verifying the current one."""

    email_clean = _normalize(email)
    new_hash = hash_password(new_password)

    if db is None:
        return _change_password_in_memory(email_clean, current_password, new_hash)

    with _account_session(db) as session:
        row = session.execute(
            text("SELECT password_hash FROM public.users WHERE LOWER(email) = :email"),
            {"email": email_clean},
        ).first()
        # An unknown address and a wrong password get the same answer.
        if row is None or not verify_password(current_password, row[0]):
            return False, INVALID_CREDENTIALS_MESSAGE

        session.execute(
            text(
                "UPDATE public.users SET password_hash = :new_hash, updated_at = now() "
                "WHERE LOWER(email) = :email"
            ),
            {"new_hash": new_hash, "email": email_clean},
        )
        session.commit()
    return True, "Password updated successfully."


def _change_password_in_memory(
    email_clean: str, current_password: str, new_hash: str
) -> tuple[bool, str]:
    """No-database mode: an unknown address is claimed on first use.

    Convenient for driving the portal against fixtures; harmless only because
    this branch is unreachable once a DATABASE_URL is configured.
    """

    stored_hash = _MEMORY_USERS.get(email_clean)
    if stored_hash is None:
        stored_hash = _MEMORY_USERS.setdefault(
            email_clean, hash_password(current_password)
        )

    if not verify_password(current_password, stored_hash):
        return False, INVALID_CREDENTIALS_MESSAGE

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

    email_clean = _normalize(email)
    if not user_exists(db, email_clean):
        return True, GENERIC_RESET_MESSAGE, None

    token = generate_reset_token()
    expires_at = _now() + datetime.timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

    if db is None:
        _MEMORY_RESET_TOKENS[email_clean] = {
            "token": token,
            "expires_at": expires_at,
            "used": False,
        }
        return True, GENERIC_RESET_MESSAGE, token

    # Written only to the database. Mirroring it into the dictionary as well
    # would make a code issued by one instance unredeemable on another.
    with _account_session(db) as session:
        session.execute(
            text(
                "INSERT INTO public.password_resets (email, token, expires_at) "
                "VALUES (:email, :token, :expires_at)"
            ),
            {"email": email_clean, "token": token, "expires_at": expires_at},
        )
        session.commit()
    return True, GENERIC_RESET_MESSAGE, token


def reset_user_password(
    db: DatabaseRepository | None,
    email: str,
    reset_token: str,
    new_password: str,
) -> tuple[bool, str]:
    """Redeem a reset code and set the new password."""

    email_clean = _normalize(email)
    token_clean = reset_token.strip()
    new_hash = hash_password(new_password)

    if db is None:
        return _reset_password_in_memory(email_clean, token_clean, new_hash)

    # Redeeming the code and writing the password share one transaction: a
    # code must not be burned by an update that then fails to land.
    with _account_session(db) as session:
        record = session.execute(
            text(
                "SELECT id FROM public.password_resets "
                "WHERE LOWER(email) = :email AND token = :token "
                "AND used = FALSE AND expires_at > :now "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"email": email_clean, "token": token_clean, "now": _now()},
        ).first()
        if record is None:
            return False, "Invalid or expired reset verification token."

        session.execute(
            text("UPDATE public.password_resets SET used = TRUE WHERE id = :id"),
            {"id": record[0]},
        )
        session.execute(
            text(
                "UPDATE public.users SET password_hash = :new_hash, updated_at = now() "
                "WHERE LOWER(email) = :email"
            ),
            {"new_hash": new_hash, "email": email_clean},
        )
        session.commit()
    return True, "Password has been successfully reset."


def _reset_password_in_memory(
    email_clean: str, token_clean: str, new_hash: str
) -> tuple[bool, str]:
    record = _MEMORY_RESET_TOKENS.get(email_clean)
    if (
        record is None
        or record["token"] != token_clean
        or record["used"]
        or record["expires_at"] <= _now()
    ):
        return False, "Invalid or expired reset verification token."

    record["used"] = True
    _MEMORY_USERS[email_clean] = new_hash
    return True, "Password has been successfully reset."
