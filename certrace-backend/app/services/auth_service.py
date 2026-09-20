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
import json
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
from app.core.security import generate_reset_token, hash_password, verify_password
from app.services.errors import AccountStoreUnavailable

if TYPE_CHECKING:
    from app.repositories.database import DatabaseRepository


# The three states an account can be in. ACTIVE and SUSPENDED (revision 013)
# are the two ends of Terms §20.4: access stops, the work stays, and a paid
# invoice puts it back. ANONYMISED (revision 014) is Privacy §11.2 -- the end
# of the relationship, and a one-way door: the identifying fields are gone, so
# there is nothing left to restore.
ACCOUNT_ACTIVE = "ACTIVE"
ACCOUNT_SUSPENDED = "SUSPENDED"
ACCOUNT_ANONYMISED = "ANONYMISED"

# Privacy §11.2 and Terms §9.5: Customer Data stays exportable for thirty days
# after termination, and only then may be deleted or anonymised. The clock
# runs from ``suspended_at``, which is the closest thing the server holds to a
# termination date -- billing lives outside it.
EXPORT_WINDOW_DAYS = 30

# Staff actions worth keeping forever (revision 014).
AUDIT_SUSPENDED = "SUSPENDED"
AUDIT_RESTORED = "RESTORED"
AUDIT_ANONYMISED = "ANONYMISED"


@dataclass(frozen=True)
class Account:
    """One account, as both stores hand it back and the router renders it."""

    id: str
    email: str
    onboarded: bool
    first_name: str | None = None
    last_name: str | None = None
    company_name: str | None = None
    status: str = ACCOUNT_ACTIVE
    # Why access was withdrawn, for our own record. The router never puts this
    # in a response: it is written for a billing dispute, not for the customer.
    suspension_reason: str | None = None
    # When access was withdrawn. The export window in §11.2 counts from here.
    suspended_at: datetime.datetime | None = None

    @property
    def is_suspended(self) -> bool:
        return self.status == ACCOUNT_SUSPENDED

    @property
    def is_anonymised(self) -> bool:
        return self.status == ACCOUNT_ANONYMISED

    @property
    def is_active(self) -> bool:
        """Whether this account may still use the product.

        Every gate reads this rather than testing one status, so a state added
        later is refused by default instead of quietly being let through.
        """

        return self.status == ACCOUNT_ACTIVE


@dataclass(frozen=True)
class SuspensionResult:
    """What one suspension actually did, for the operator running it.

    ``supplier_links_blocked`` counts links that were live at that moment and
    stop resolving from it. They are counted rather than stamped revoked: a
    suspension for non-payment is meant to be lifted, and revoking the rows
    would leave the exporter re-sending a link to every supplier after paying
    an invoice. See ``app/routers/links.py``, where resolution checks the
    owner's status.
    """

    account: Account
    refresh_tokens_revoked: int
    supplier_links_blocked: int


@dataclass(frozen=True)
class AnonymisationResult:
    """What came out, and what deliberately stayed.

    ``customer_data_purged`` is None when the declarations were left alone,
    which is the default: they are the exporter's compliance record, some of
    it sealed (Terms §12), and deleting them is a separate instruction rather
    than a consequence of scrubbing a name.
    """

    account_id: str
    refresh_tokens_deleted: int
    reset_codes_deleted: int
    supplier_links_revoked: int
    reminder_subjects_deleted: int
    customer_data_purged: int | None


class AccountNotEligible(Exception):
    """Raised when an account is not yet in a state that allows the action."""


@dataclass(frozen=True)
class AuditEvent:
    """One recorded staff action, as the history command prints it."""

    event: str
    actor: str
    reason: str | None
    details: dict[str, object]
    created_at: datetime.datetime


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

# No-database mode's audit log: [(user id, event)]. A list, not a table, and
# it dies with the process — which is exactly why the operator command refuses
# to run without a database. It exists so the recording path is the same code
# in tests as in production, not so anything depends on it.
_MEMORY_AUDIT: list[tuple[str, AuditEvent]] = []


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
        "status": ACCOUNT_ACTIVE,
        "suspended_at": None,
        "suspension_reason": None,
    }


def _account_from_memory(email_clean: str, record: dict[str, object]) -> Account:
    return Account(
        id=str(record["id"]),
        email=email_clean,
        onboarded=bool(record["onboarded"]),
        first_name=record["first_name"],  # type: ignore[arg-type]
        last_name=record["last_name"],  # type: ignore[arg-type]
        company_name=record["company_name"],  # type: ignore[arg-type]
        # .get, not [..]: the demo accounts above are written by hand and
        # predate the column.
        status=str(record.get("status") or ACCOUNT_ACTIVE),
        suspension_reason=record.get("suspension_reason"),  # type: ignore[arg-type]
        suspended_at=record.get("suspended_at"),  # type: ignore[arg-type]
    )


# password_hash stays last so callers can read it as row[-1] without this list
# having to stay the same length as they grow.
_ACCOUNT_COLUMNS = (
    "id, email, onboarded, first_name, last_name, company_name, "
    "status, suspension_reason, suspended_at, password_hash"
)


def _account_from_row(row: object) -> Account:
    return Account(
        id=str(row[0]),  # type: ignore[index]
        email=row[1],  # type: ignore[index]
        onboarded=bool(row[2]),  # type: ignore[index]
        first_name=row[3],  # type: ignore[index]
        last_name=row[4],  # type: ignore[index]
        company_name=row[5],  # type: ignore[index]
        status=str(row[6] or ACCOUNT_ACTIVE),  # type: ignore[index]
        suspension_reason=row[7],  # type: ignore[index]
        suspended_at=row[8],  # type: ignore[index]
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
    if row is None or not verify_password(password, row[-1]):
        return None
    return _account_from_row(row)


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


def find_account_by_email(db: DatabaseRepository | None, email: str) -> Account | None:
    """The account for an address, without needing its password.

    Only the operator command uses this: a suspension is run from an invoice
    or an abuse report, which names a person by email and never by uuid. It is
    deliberately not reachable from any route — an endpoint that turns an
    address into an account is the membership oracle the sign-in and reset
    paths are written to avoid.
    """

    email_clean = _normalize(email)

    if db is None:
        record = _MEMORY_USERS.get(email_clean)
        return None if record is None else _account_from_memory(email_clean, record)

    with _account_session(db) as session:
        row = session.execute(
            text(
                f"SELECT {_ACCOUNT_COLUMNS} FROM public.users "
                "WHERE LOWER(email) = :email"
            ),
            {"email": email_clean},
        ).first()
    return None if row is None else _account_from_row(row)


# ── Audit (revision 014) ─────────────────────────────────────
# Every staff action against an account writes one row here, in the same
# transaction as the action itself. Recording it afterwards, from the command,
# would mean a crash between the two leaves an account suspended with nothing
# saying who did it -- which is the exact gap this table was added to close.


def _record_audit(
    session: Session,
    user_id: str,
    event: str,
    *,
    actor: str,
    reason: str | None,
    details: dict[str, object] | None = None,
) -> None:
    session.execute(
        text(
            "INSERT INTO public.account_audit_events "
            "(user_id, event, actor, reason, details) "
            "VALUES (:user_id, :event, :actor, :reason, "
            "CAST(:details AS jsonb))"
        ),
        {
            "user_id": uuid.UUID(user_id),
            "event": event,
            "actor": actor,
            "reason": reason,
            "details": json.dumps(details or {}),
        },
    )


def _record_memory_audit(
    user_id: str,
    event: str,
    *,
    actor: str,
    reason: str | None,
    details: dict[str, object] | None = None,
) -> None:
    _MEMORY_AUDIT.append(
        (
            user_id,
            AuditEvent(
                event=event,
                actor=actor,
                reason=reason,
                details=details or {},
                created_at=_now(),
            ),
        )
    )


def account_history(
    db: DatabaseRepository | None, user_id: str, limit: int = 50
) -> list[AuditEvent]:
    """Every recorded action against one account, newest first."""

    if db is None:
        events = [event for subject, event in _MEMORY_AUDIT if subject == user_id]
        return sorted(events, key=lambda e: e.created_at, reverse=True)[:limit]

    with _account_session(db) as session:
        rows = session.execute(
            text(
                "SELECT event, actor, reason, details, created_at "
                "FROM public.account_audit_events WHERE user_id = :id "
                "ORDER BY created_at DESC LIMIT :limit"
            ),
            {"id": uuid.UUID(user_id), "limit": limit},
        ).all()
    return [
        AuditEvent(
            event=row[0],
            actor=row[1],
            reason=row[2],
            details=row[3] or {},
            created_at=row[4],
        )
        for row in rows
    ]


# ── Suspension (Terms §6.4, §20.4) ───────────────────────────
# Withdrawing access is three separate things, and doing only the first is the
# mistake worth naming: flipping the status stops the next sign-in, but the
# browser already signed in holds an access token good for up to an hour and a
# refresh token good for a week. So the refresh tokens go with the status, in
# one transaction, and the access token's remaining minutes are the known,
# bounded gap — ``current_account`` re-reads the account on every request, so
# even that gap only lasts until the next call.


def suspend_account(
    db: DatabaseRepository | None,
    user_id: str,
    *,
    reason: str,
    actor: str = "unknown",
) -> SuspensionResult | None:
    """Withdraw an account's access. ``None`` if no such account.

    Idempotent: suspending an already-suspended account refreshes the reason
    and leaves ``suspended_at`` where it was, because the date that matters in
    a dispute is when access was first withdrawn.

    Refuses an anonymised account: there is no longer anyone to suspend, and
    the status is a one-way door.
    """

    if db is None:
        for email_clean, record in _MEMORY_USERS.items():
            if str(record["id"]) != user_id:
                continue
            if record.get("status") == ACCOUNT_ANONYMISED:
                raise AccountNotEligible("That account has been anonymised.")
            if record.get("status") != ACCOUNT_SUSPENDED:
                record["status"] = ACCOUNT_SUSPENDED
                record["suspended_at"] = _now()
            record["suspension_reason"] = reason
            burned = _revoke_memory_refresh_tokens(user_id)
            _record_memory_audit(
                user_id,
                AUDIT_SUSPENDED,
                actor=actor,
                reason=reason,
                details={"refresh_tokens_revoked": burned},
            )
            return SuspensionResult(
                account=_account_from_memory(email_clean, record),
                refresh_tokens_revoked=burned,
                supplier_links_blocked=0,
            )
        return None

    with _account_session(db) as session:
        # The WHERE clause is what refuses an anonymised account: a row in that
        # state simply does not match, so the check cannot be raced by a
        # concurrent anonymisation between a read and a write.
        row = session.execute(
            text(
                "UPDATE public.users SET status = :suspended, "
                "suspended_at = COALESCE(suspended_at, now()), "
                "suspension_reason = :reason, updated_at = now() "
                "WHERE id = :id AND status <> :anonymised "
                f"RETURNING {_ACCOUNT_COLUMNS}"
            ),
            {
                "suspended": ACCOUNT_SUSPENDED,
                "anonymised": ACCOUNT_ANONYMISED,
                "reason": reason,
                "id": uuid.UUID(user_id),
            },
        ).first()
        if row is None:
            if _status_of(session, user_id) == ACCOUNT_ANONYMISED:
                raise AccountNotEligible("That account has been anonymised.")
            return None
        revoked = session.execute(
            text(
                "UPDATE public.refresh_tokens SET used = TRUE "
                "WHERE user_id = :id AND used = FALSE AND expires_at > :now"
            ),
            {"id": uuid.UUID(user_id), "now": _now()},
        ).rowcount
        # Counted, not revoked -- see SuspensionResult. The rows stay live and
        # the resolve path refuses them for as long as the owner is suspended.
        blocked = session.execute(
            text(
                "SELECT count(*) FROM public.smart_links "
                "WHERE user_id = :id AND revoked_at IS NULL AND expires_at > :now"
            ),
            {"id": uuid.UUID(user_id), "now": _now()},
        ).scalar_one()
        _record_audit(
            session,
            user_id,
            AUDIT_SUSPENDED,
            actor=actor,
            reason=reason,
            details={
                "refresh_tokens_revoked": int(revoked or 0),
                "supplier_links_blocked": int(blocked or 0),
            },
        )
        session.commit()
    return SuspensionResult(
        account=_account_from_row(row),
        refresh_tokens_revoked=int(revoked or 0),
        supplier_links_blocked=int(blocked or 0),
    )


def _status_of(session: Session, user_id: str) -> str | None:
    """One account's status, for telling "no such row" from "wrong state"."""

    row = session.execute(
        text("SELECT status FROM public.users WHERE id = :id"),
        {"id": uuid.UUID(user_id)},
    ).first()
    return None if row is None else str(row[0])


def restore_account(
    db: DatabaseRepository | None, user_id: str, *, actor: str = "unknown"
) -> Account | None:
    """Put a suspended account back in service. ``None`` if no such account.

    §20.4 says access is restored promptly once the cause is resolved, so this
    clears the reason with the status rather than keeping a scarlet letter on
    the row; ``suspended_at`` goes too, because the check constraint in
    revision 013 will not hold an ACTIVE row with a suspension date on it.

    Nobody is signed back in by this: their refresh tokens were burned by the
    suspension and cannot be unburned. The customer signs in again, which is
    the same thing any password change asks of them.
    """

    if db is None:
        for email_clean, record in _MEMORY_USERS.items():
            if str(record["id"]) != user_id:
                continue
            if record.get("status") == ACCOUNT_ANONYMISED:
                raise AccountNotEligible("That account has been anonymised.")
            record["status"] = ACCOUNT_ACTIVE
            record["suspended_at"] = None
            record["suspension_reason"] = None
            _record_memory_audit(user_id, AUDIT_RESTORED, actor=actor, reason=None)
            return _account_from_memory(email_clean, record)
        return None

    with _account_session(db) as session:
        row = session.execute(
            text(
                "UPDATE public.users SET status = :active, suspended_at = NULL, "
                "suspension_reason = NULL, updated_at = now() "
                "WHERE id = :id AND status <> :anonymised "
                f"RETURNING {_ACCOUNT_COLUMNS}"
            ),
            {
                "active": ACCOUNT_ACTIVE,
                "anonymised": ACCOUNT_ANONYMISED,
                "id": uuid.UUID(user_id),
            },
        ).first()
        if row is None:
            if _status_of(session, user_id) == ACCOUNT_ANONYMISED:
                raise AccountNotEligible("That account has been anonymised.")
            return None
        _record_audit(session, user_id, AUDIT_RESTORED, actor=actor, reason=None)
        session.commit()
    return _account_from_row(row)


# ── Anonymisation (Privacy §11.2, Terms §9.5) ────────────────
# The end of the relationship, and the one operation here that cannot be
# undone. Three rules shape it:
#
#   · The ROW STAYS. Deleting it would cascade the declarations, the links and
#     every uploaded certificate away -- including sealed versions the
#     exporter may be legally required to keep (Terms §12.4, §4.5). What comes
#     out is what identifies a person, not what the product recorded.
#   · WHAT IDENTIFIES A PERSON GOES EVERYWHERE IT LIVES. The address is in
#     ``users``, and also in ``password_resets`` (a copy per code issued) and
#     in ``reminder_subjects`` (a supplier's address and the link sent to
#     them). Scrubbing one of the three and calling it anonymisation is how a
#     deletion request comes back six months later.
#   · THE THIRTY DAYS ARE REAL. §9.5 gives the customer that long to export
#     after termination. Running this early destroys a record they were
#     promised they could still take, so the window is enforced here and can
#     only be waived explicitly.


def _anonymised_email(user_id: str) -> str:
    """A tombstone that keeps the row's shape without naming anybody.

    Must still satisfy ``users_email_shape_check`` and the unique index on
    ``lower(email)``, so it carries an @ and the account's own id. ``.invalid``
    is reserved by RFC 2606 and can never be delivered to.
    """

    return f"anonymised-{user_id}@certrace.invalid"


# Nothing verifies against this: ``verify_password`` splits on "$" and returns
# False when the parts are not a known algorithm. It is deliberately not a
# hash of a random password, which would be a credential somebody could
# theoretically still present.
_UNUSABLE_PASSWORD = "!anonymised"


def anonymise_account(
    db: DatabaseRepository | None,
    user_id: str,
    *,
    actor: str = "unknown",
    reason: str | None = None,
    purge_customer_data: bool = False,
    force: bool = False,
    today: datetime.datetime | None = None,
) -> AnonymisationResult | None:
    """Scrub an account's identity. ``None`` if no such account.

    Raises :class:`AccountNotEligible` unless the account has been suspended
    for at least ``EXPORT_WINDOW_DAYS``, which is the export window §9.5
    promises; ``force`` waives it for the case the window exists for -- the
    customer who asks to be erased now and has nothing left to export.

    Already anonymised is not an error: it returns a result with zero counts,
    because "make sure this person is gone" should be safe to run twice.
    """

    now = today or _now()

    if db is None:
        for email_clean, record in list(_MEMORY_USERS.items()):
            if str(record["id"]) != user_id:
                continue
            if record.get("status") == ACCOUNT_ANONYMISED:
                return AnonymisationResult(user_id, 0, 0, 0, 0, None)
            _check_export_window(
                record.get("status"),  # type: ignore[arg-type]
                record.get("suspended_at"),  # type: ignore[arg-type]
                now=now,
                force=force,
            )
            tokens = sum(
                1
                for token in _MEMORY_REFRESH_TOKENS.values()
                if str(token["user_id"]) == user_id
            )
            for token in [
                key
                for key, value in _MEMORY_REFRESH_TOKENS.items()
                if str(value["user_id"]) == user_id
            ]:
                del _MEMORY_REFRESH_TOKENS[token]
            codes = 1 if _MEMORY_RESET_TOKENS.pop(email_clean, None) else 0
            del _MEMORY_USERS[email_clean]
            record["password_hash"] = _UNUSABLE_PASSWORD
            record["first_name"] = None
            record["last_name"] = None
            record["company_name"] = None
            record["status"] = ACCOUNT_ANONYMISED
            record["suspension_reason"] = None
            record["anonymised_at"] = now
            _MEMORY_USERS[_anonymised_email(user_id)] = record
            _record_memory_audit(
                user_id,
                AUDIT_ANONYMISED,
                actor=actor,
                reason=reason,
                details={"refresh_tokens_deleted": tokens, "forced": force},
            )
            # Smart links, reminders and declarations live on app.state in this
            # mode, out of reach from here. The operator command refuses to run
            # without a database precisely so that gap is never the real path.
            return AnonymisationResult(user_id, tokens, codes, 0, 0, None)
        return None

    with _account_session(db) as session:
        row = session.execute(
            text(
                "SELECT status, suspended_at, email FROM public.users "
                "WHERE id = :id FOR UPDATE"
            ),
            {"id": uuid.UUID(user_id)},
        ).first()
        if row is None:
            return None
        if str(row[0]) == ACCOUNT_ANONYMISED:
            return AnonymisationResult(user_id, 0, 0, 0, 0, None)
        _check_export_window(str(row[0]), row[1], now=now, force=force)
        email_clean = _normalize(str(row[2]))

        tokens = session.execute(
            text("DELETE FROM public.refresh_tokens WHERE user_id = :id"),
            {"id": uuid.UUID(user_id)},
        ).rowcount
        # Every code ever issued to that address carries the address.
        codes = session.execute(
            text("DELETE FROM public.password_resets WHERE LOWER(email) = :email"),
            {"email": email_clean},
        ).rowcount
        # Revoked for good here, unlike a suspension: there is no relationship
        # left to restore, and a live link would open a form in the name of a
        # company that no longer has an account.
        links = session.execute(
            text(
                "UPDATE public.smart_links SET revoked_at = now(), "
                "updated_at = now() WHERE user_id = :id AND revoked_at IS NULL"
            ),
            {"id": uuid.UUID(user_id)},
        ).rowcount
        # These hold a supplier's address and the link that was mailed to them.
        reminders = session.execute(
            text("DELETE FROM public.reminder_subjects WHERE user_id = :id"),
            {"id": uuid.UUID(user_id)},
        ).rowcount

        purged: int | None = None
        if purge_customer_data:
            # Cascades to smart_links and uploaded_files through the composite
            # foreign keys. This is the instruction in §11.2's second half, and
            # it is separate because §12.4's retention duty is the CUSTOMER's:
            # only they can say whether they still need what is in here.
            purged = session.execute(
                text("DELETE FROM public.portal_declarations WHERE user_id = :id"),
                {"id": uuid.UUID(user_id)},
            ).rowcount

        session.execute(
            text(
                "UPDATE public.users SET email = :email, "
                "password_hash = :password_hash, first_name = NULL, "
                "last_name = NULL, company_name = NULL, "
                "status = :anonymised, suspension_reason = NULL, "
                "anonymised_at = now(), updated_at = now() WHERE id = :id"
            ),
            {
                "email": _anonymised_email(user_id),
                "password_hash": _UNUSABLE_PASSWORD,
                "anonymised": ACCOUNT_ANONYMISED,
                "id": uuid.UUID(user_id),
            },
        )
        _record_audit(
            session,
            user_id,
            AUDIT_ANONYMISED,
            actor=actor,
            reason=reason,
            details={
                "refresh_tokens_deleted": int(tokens or 0),
                "reset_codes_deleted": int(codes or 0),
                "supplier_links_revoked": int(links or 0),
                "reminder_subjects_deleted": int(reminders or 0),
                "customer_data_purged": purged,
                "forced": force,
            },
        )
        session.commit()

    return AnonymisationResult(
        account_id=user_id,
        refresh_tokens_deleted=int(tokens or 0),
        reset_codes_deleted=int(codes or 0),
        supplier_links_revoked=int(links or 0),
        reminder_subjects_deleted=int(reminders or 0),
        customer_data_purged=purged,
    )


def _check_export_window(
    status: str | None,
    suspended_at: datetime.datetime | None,
    *,
    now: datetime.datetime,
    force: bool,
) -> None:
    """Refuse to scrub an account the customer can still export from."""

    if force:
        return
    if status != ACCOUNT_SUSPENDED or suspended_at is None:
        raise AccountNotEligible(
            "Only a suspended account can be anonymised: the export window in "
            "Terms §9.5 runs from the day access was withdrawn."
        )
    elapsed = now - suspended_at
    if elapsed < datetime.timedelta(days=EXPORT_WINDOW_DAYS):
        remaining = datetime.timedelta(days=EXPORT_WINDOW_DAYS) - elapsed
        raise AccountNotEligible(
            f"Suspended {elapsed.days} days ago. Terms §9.5 gives the customer "
            f"{EXPORT_WINDOW_DAYS} days to export; {remaining.days + 1} to go."
        )


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


def _revoke_memory_refresh_tokens(user_id: str) -> int:
    """Burn every live refresh token this account holds, in no-database mode."""

    burned = 0
    for record in _MEMORY_REFRESH_TOKENS.values():
        if str(record["user_id"]) == user_id and not record["used"]:
            record["used"] = True
            burned += 1
    return burned


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
