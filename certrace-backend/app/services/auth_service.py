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
import hashlib
import secrets
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import REFRESH_TOKEN_TTL_DAYS
from app.core.google_identity import GoogleIdentity
from app.core.security import generate_reset_token, hash_password, verify_password
from app.services.errors import AccountStoreUnavailable

if TYPE_CHECKING:
    from app.repositories.database import DatabaseRepository


@dataclass(frozen=True)
class Account:
    """One account, as both stores hand it back and the router renders it."""

    id: str
    email: str
    onboarded: bool
    first_name: str | None = None
    last_name: str | None = None
    company_name: str | None = None


class EmailAlreadyRegistered(Exception):
    """Raised when a signup names an address that already has an account."""


# Demo accounts for the no-database mode only. Nothing reads these once a
# DATABASE_URL is set, which is why production must set one -- see
# CERTRACE_REQUIRE_DATABASE. The ids are fixed so a page reloaded against a
# restarted dev server does not find itself holding a token for a stranger.
_MEMORY_USERS: dict[str, dict[str, object]] = {
    "wasawat@siamsteel.co.th": {
        "id": "00000000-0000-4000-8000-000000000001",
        "password_hash": hash_password("demo-password"),
        "onboarded": True,
        "first_name": "Wasawat",
        "last_name": "Siamsteel",
        "company_name": "Siam Steel",
    },
    "demo@certrace.com": {
        "id": "00000000-0000-4000-8000-000000000002",
        "password_hash": hash_password("demo-password"),
        "onboarded": True,
        "first_name": None,
        "last_name": None,
        "company_name": None,
    },
}

# Structure: {email: {"token": str, "expires_at": datetime, "used": bool,
# "attempts": int}}. One entry per address — issuing overwrites, which is the
# in-memory form of the invalidation the SQL path does explicitly.
_MEMORY_RESET_TOKENS: dict[str, dict[str, object]] = {}

RESET_TOKEN_TTL_MINUTES = 15

# A 6-digit code holds 900k possibilities; what makes that safe is that a code
# dies after this many wrong guesses, and issuing a new code retires the old
# one — so an attacker gets a handful of tries per email, ever, not a keyspace
# to walk.
MAX_RESET_ATTEMPTS = 5

# The one answer /forgot-password gives, whether or not the address is ours.
# Anything that varies with existence turns the endpoint into a membership
# oracle: an attacker with a list of addresses learns which are customers.
GENERIC_RESET_MESSAGE = (
    "If an account exists for that email, a reset code is on its way."
)

# Said for a wrong password and for an address with no account alike, so the
# endpoint cannot be used to enumerate customers either.
INVALID_CREDENTIALS_MESSAGE = "Current password is incorrect."


# No-database mode's refresh tokens: {token: {user_id, expires_at, used}}.
# Plaintext keys are fine here — the dict dies with the process.
_MEMORY_REFRESH_TOKENS: dict[str, dict[str, object]] = {}


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

    record = _MEMORY_USERS.get(email_clean)
    if record is None:
        record = _memory_record(email_clean, hash_password(current_password))
        _MEMORY_USERS[email_clean] = record

    if not verify_password(current_password, str(record["password_hash"])):
        return False, INVALID_CREDENTIALS_MESSAGE

    record["password_hash"] = new_hash
    return True, "Password updated successfully."


def _memory_record(
    email_clean: str,
    password_hash: str,
    *,
    onboarded: bool = True,
    first_name: str | None = None,
    last_name: str | None = None,
    company_name: str | None = None,
) -> dict[str, object]:
    return {
        "id": str(uuid.uuid4()),
        "password_hash": password_hash,
        "onboarded": onboarded,
        "first_name": first_name,
        "last_name": last_name,
        "company_name": company_name,
    }


def _account_from_memory(email_clean: str, record: dict[str, object]) -> Account:
    return Account(
        id=str(record["id"]),
        email=email_clean,
        onboarded=bool(record["onboarded"]),
        first_name=record["first_name"],  # type: ignore[arg-type]
        last_name=record["last_name"],  # type: ignore[arg-type]
        company_name=record["company_name"],  # type: ignore[arg-type]
    )


_ACCOUNT_COLUMNS = (
    "id, email, onboarded, first_name, last_name, company_name, password_hash"
)


def _account_from_row(row: object) -> Account:
    return Account(
        id=str(row[0]),  # type: ignore[index]
        email=row[1],  # type: ignore[index]
        onboarded=bool(row[2]),  # type: ignore[index]
        first_name=row[3],  # type: ignore[index]
        last_name=row[4],  # type: ignore[index]
        company_name=row[5],  # type: ignore[index]
    )


def register_user(
    db: DatabaseRepository | None,
    email: str,
    password: str,
    *,
    first_name: str | None = None,
    last_name: str | None = None,
    company_name: str | None = None,
) -> Account:
    """Create an account, or raise ``EmailAlreadyRegistered``.

    New accounts start un-onboarded: the portal reads that to send a fresh
    signup through the wizard once, and only once.
    """

    email_clean = _normalize(email)
    password_hash = hash_password(password)

    if db is None:
        if email_clean in _MEMORY_USERS:
            raise EmailAlreadyRegistered(email_clean)
        record = _memory_record(
            email_clean,
            password_hash,
            onboarded=False,
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
        )
        _MEMORY_USERS[email_clean] = record
        return _account_from_memory(email_clean, record)

    with _account_session(db) as session:
        # No read-then-write: two signups racing on the same address would both
        # see it free. The unique index on lower(email) is the one arbiter, and
        # ON CONFLICT lets it decide without raising through the driver.
        row = session.execute(
            text(
                "INSERT INTO public.users "
                "(email, password_hash, first_name, last_name, company_name, onboarded) "
                "VALUES (:email, :password_hash, :first_name, :last_name, "
                ":company_name, false) "
                "ON CONFLICT DO NOTHING "
                f"RETURNING {_ACCOUNT_COLUMNS}"
            ),
            {
                "email": email_clean,
                "password_hash": password_hash,
                "first_name": first_name,
                "last_name": last_name,
                "company_name": company_name,
            },
        ).first()
        if row is None:
            raise EmailAlreadyRegistered(email_clean)
        session.commit()
    return _account_from_row(row)


def authenticate_user(
    db: DatabaseRepository | None, email: str, password: str
) -> Account | None:
    """The account these credentials open, or ``None``.

    One return value for "no such address" and "wrong password" on purpose:
    anything that distinguishes them turns sign-in into a way to test whether
    an address is a customer.
    """

    email_clean = _normalize(email)

    if db is None:
        record = _MEMORY_USERS.get(email_clean)
        if record is None or not verify_password(
            password, str(record["password_hash"])
        ):
            return None
        return _account_from_memory(email_clean, record)

    with _account_session(db) as session:
        row = session.execute(
            text(
                f"SELECT {_ACCOUNT_COLUMNS} FROM public.users "
                "WHERE LOWER(email) = :email"
            ),
            {"email": email_clean},
        ).first()
    if row is None or not verify_password(password, row[6]):
        return None
    return _account_from_row(row)


# ── Sign in with Google ──────────────────────────────────────


class GoogleAccountConflict(Exception):
    """The address belongs to an account already tied to a DIFFERENT Google
    account. Linking again would let whoever holds that address on Google
    today walk into an account someone else opened with it yesterday."""


def _unusable_password_hash() -> str:
    """A real hash of a secret nobody is ever told. ``password_hash`` is NOT
    NULL, and a hash no password matches is the honest value for an account
    that signs in with Google: the password form simply never opens it, and
    forgot-password (which proves the mailbox) can still give it one."""

    return hash_password(secrets.token_urlsafe(32))


def sign_in_with_google(
    db: DatabaseRepository | None, identity: GoogleIdentity
) -> Account:
    """The account a verified Google identity opens — found, linked or created.

    Three cases, in order:

    1. Google's subject id is already on an account: that account.
    2. No account has it, but one holds the (Google-verified) email: link it.
       This is the moment that needs care. Signup has never proved mailbox
       ownership, so that account's password may have been set by someone who
       registered the address before its owner arrived. Linking retires the
       password and every live session; the owner keeps the account and its
       data, and can set a password again through forgot-password, which does
       prove the mailbox.
    3. Nothing: a new account, un-onboarded, named from the Google profile.
    """

    if db is None:
        return _sign_in_with_google_in_memory(identity)

    with _account_session(db) as session:
        row = session.execute(
            text(
                f"SELECT {_ACCOUNT_COLUMNS} FROM public.users WHERE google_sub = :sub"
            ),
            {"sub": identity.sub},
        ).first()
        if row is not None:
            return _account_from_row(row)

        existing = session.execute(
            text(
                f"SELECT {_ACCOUNT_COLUMNS}, google_sub FROM public.users "
                "WHERE LOWER(email) = :email FOR UPDATE"
            ),
            {"email": identity.email},
        ).first()
        if existing is not None:
            if existing[7] is not None:
                raise GoogleAccountConflict(identity.email)
            session.execute(
                text(
                    "UPDATE public.users SET google_sub = :sub, "
                    "password_hash = :unusable, updated_at = now() WHERE id = :id"
                ),
                {
                    "sub": identity.sub,
                    "unusable": _unusable_password_hash(),
                    "id": existing[0],
                },
            )
            session.execute(
                text(
                    "UPDATE public.refresh_tokens SET used = TRUE WHERE user_id = :id"
                ),
                {"id": existing[0]},
            )
            session.commit()
            return _account_from_row(existing)

        created = session.execute(
            text(
                "INSERT INTO public.users "
                "(email, password_hash, first_name, last_name, onboarded, google_sub) "
                "VALUES (:email, :password_hash, :first_name, :last_name, false, :sub) "
                "ON CONFLICT DO NOTHING "
                f"RETURNING {_ACCOUNT_COLUMNS}"
            ),
            {
                "email": identity.email,
                "password_hash": _unusable_password_hash(),
                "first_name": identity.given_name,
                "last_name": identity.family_name,
                "sub": identity.sub,
            },
        ).first()
        session.commit()
    if created is None:
        # Lost a race with a signup or a second tab on the same address. The
        # row exists now, so going round once more takes case 1 or 2.
        return sign_in_with_google(db, identity)
    return _account_from_row(created)


def _sign_in_with_google_in_memory(identity: GoogleIdentity) -> Account:
    for email_clean, record in _MEMORY_USERS.items():
        if record.get("google_sub") == identity.sub:
            return _account_from_memory(email_clean, record)

    record = _MEMORY_USERS.get(identity.email)
    if record is not None:
        if record.get("google_sub") is not None:
            raise GoogleAccountConflict(identity.email)
        record["google_sub"] = identity.sub
        record["password_hash"] = _unusable_password_hash()
        for token in _MEMORY_REFRESH_TOKENS.values():
            if token["user_id"] == record["id"]:
                token["used"] = True
        return _account_from_memory(identity.email, record)

    record = _memory_record(
        identity.email,
        _unusable_password_hash(),
        onboarded=False,
        first_name=identity.given_name,
        last_name=identity.family_name,
    )
    record["google_sub"] = identity.sub
    _MEMORY_USERS[identity.email] = record
    return _account_from_memory(identity.email, record)


def get_account(db: DatabaseRepository | None, user_id: str) -> Account | None:
    """The account a valid token names, read fresh rather than trusted from it."""

    if db is None:
        for email_clean, record in _MEMORY_USERS.items():
            if record["id"] == user_id:
                return _account_from_memory(email_clean, record)
        return None

    try:
        parsed_id = uuid.UUID(user_id)
    except ValueError:
        # A well-signed token whose subject is not an id we could have issued.
        return None

    with _account_session(db) as session:
        row = session.execute(
            text(f"SELECT {_ACCOUNT_COLUMNS} FROM public.users WHERE id = :id"),
            {"id": parsed_id},
        ).first()
    return None if row is None else _account_from_row(row)


def mark_onboarded(db: DatabaseRepository | None, user_id: str) -> None:
    """Record that this account finished the onboarding wizard.

    One-way by design: the portal uses the flag to decide whether sign-in
    lands on /onboarding/setup or straight on the dashboard, and nothing
    un-finishes a wizard.
    """

    if db is None:
        for record in _MEMORY_USERS.values():
            if str(record["id"]) == user_id:
                record["onboarded"] = True
        return

    with _account_session(db) as session:
        session.execute(
            text(
                "UPDATE public.users SET onboarded = TRUE, updated_at = now() "
                "WHERE id = :id"
            ),
            {"id": uuid.UUID(user_id)},
        )
        session.commit()


# ── Refresh tokens ───────────────────────────────────────────
# Opaque 256-bit secrets, not JWTs: their whole value is that the server can
# say no to one, and that needs a row to point at. Stored hashed — a database
# read must not hand out working credentials.


def _refresh_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def issue_refresh_token(db: DatabaseRepository | None, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = _now() + datetime.timedelta(days=REFRESH_TOKEN_TTL_DAYS)

    if db is None:
        _MEMORY_REFRESH_TOKENS[token] = {
            "user_id": user_id,
            "expires_at": expires_at,
            "used": False,
        }
        return token

    with _account_session(db) as session:
        session.execute(
            text(
                "INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at) "
                "VALUES (:user_id, :token_hash, :expires_at)"
            ),
            {
                "user_id": uuid.UUID(user_id),
                "token_hash": _refresh_hash(token),
                "expires_at": expires_at,
            },
        )
        session.commit()
    return token


def rotate_refresh_token(
    db: DatabaseRepository | None, token: str
) -> tuple[str, str] | None:
    """Redeem a refresh token: ``(user_id, successor_token)`` or ``None``.

    Single-use. The presented token is burned and a successor issued in the
    same transaction, so a token that leaks yesterday is dead the moment its
    rightful holder refreshes — and a burned token presented again simply
    fails, the same as one that never existed.
    """

    token_clean = token.strip()
    if not token_clean:
        return None

    if db is None:
        record = _MEMORY_REFRESH_TOKENS.get(token_clean)
        if record is None or record["used"] or record["expires_at"] <= _now():
            return None
        record["used"] = True
        user_id = str(record["user_id"])
        return user_id, issue_refresh_token(None, user_id)

    successor = secrets.token_urlsafe(32)
    expires_at = _now() + datetime.timedelta(days=REFRESH_TOKEN_TTL_DAYS)
    with _account_session(db) as session:
        row = session.execute(
            text(
                "UPDATE public.refresh_tokens SET used = TRUE "
                "WHERE token_hash = :token_hash "
                "AND used = FALSE AND expires_at > :now "
                "RETURNING user_id"
            ),
            {"token_hash": _refresh_hash(token_clean), "now": _now()},
        ).first()
        if row is None:
            return None
        session.execute(
            text(
                "INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at) "
                "VALUES (:user_id, :token_hash, :expires_at)"
            ),
            {
                "user_id": row[0],
                "token_hash": _refresh_hash(successor),
                "expires_at": expires_at,
            },
        )
        session.commit()
    return str(row[0]), successor


def revoke_refresh_token(db: DatabaseRepository | None, token: str) -> None:
    """Logout's half of revocation. Silently ignores a token we never issued —
    the caller is leaving either way."""

    token_clean = token.strip()
    if not token_clean:
        return

    if db is None:
        record = _MEMORY_REFRESH_TOKENS.get(token_clean)
        if record is not None:
            record["used"] = True
        return

    with _account_session(db) as session:
        session.execute(
            text(
                "UPDATE public.refresh_tokens SET used = TRUE "
                "WHERE token_hash = :token_hash"
            ),
            {"token_hash": _refresh_hash(token_clean)},
        )
        session.commit()


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
            "attempts": 0,
        }
        return True, GENERIC_RESET_MESSAGE, token

    # Written only to the database. Mirroring it into the dictionary as well
    # would make a code issued by one instance unredeemable on another.
    with _account_session(db) as session:
        # A fresh code retires every code before it. Exactly one code is ever
        # redeemable per address, so asking again cannot stack concurrently
        # valid codes and multiply a guesser's odds.
        session.execute(
            text(
                "UPDATE public.password_resets SET used = TRUE "
                "WHERE LOWER(email) = :email AND used = FALSE"
            ),
            {"email": email_clean},
        )
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

    if db is None:
        return _reset_password_in_memory(email_clean, token_clean, new_password)

    # Redeeming the code and writing the password share one transaction: a
    # code must not be burned by an update that then fails to land.
    with _account_session(db) as session:
        # The newest active code is the only one consulted — issuance retired
        # the rest. Selecting it WITHOUT the token in the WHERE is what lets a
        # wrong guess be counted against it.
        record = session.execute(
            text(
                "SELECT id, token, attempts FROM public.password_resets "
                "WHERE LOWER(email) = :email "
                "AND used = FALSE AND expires_at > :now "
                "ORDER BY created_at DESC LIMIT 1"
            ),
            {"email": email_clean, "now": _now()},
        ).first()
        if record is None:
            return False, "Invalid or expired reset verification token."

        if not secrets.compare_digest(str(record[1]), token_clean):
            # A wrong guess burns one of the code's lives; the last one burns
            # the code. `used` rather than delete, so the row still tells the
            # "exhausted" story apart from "never issued".
            exhausted = int(record[2]) + 1 >= MAX_RESET_ATTEMPTS
            session.execute(
                text(
                    "UPDATE public.password_resets "
                    "SET attempts = attempts + 1, used = used OR :exhausted "
                    "WHERE id = :id"
                ),
                {"id": record[0], "exhausted": exhausted},
            )
            session.commit()
            return False, "Invalid or expired reset verification token."

        # Hashing (600k PBKDF2 rounds) waits until the code has proven itself:
        # done earlier it hands a guesser free CPU burn per attempt.
        new_hash = hash_password(new_password)
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
    email_clean: str, token_clean: str, new_password: str
) -> tuple[bool, str]:
    invalid = (False, "Invalid or expired reset verification token.")
    record = _MEMORY_RESET_TOKENS.get(email_clean)
    if record is None or record["used"] or record["expires_at"] <= _now():
        return invalid

    if not secrets.compare_digest(str(record["token"]), token_clean):
        record["attempts"] = int(record.get("attempts", 0)) + 1
        if record["attempts"] >= MAX_RESET_ATTEMPTS:
            record["used"] = True
        return invalid

    record["used"] = True
    account = _MEMORY_USERS.setdefault(email_clean, _memory_record(email_clean, ""))
    account["password_hash"] = hash_password(new_password)
    return True, "Password has been successfully reset."
