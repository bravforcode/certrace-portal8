"""SQLAlchemy repository for Certrace PostgreSQL persistence."""

from __future__ import annotations

import datetime
import logging
import uuid
from decimal import Decimal
from urllib.parse import quote, unquote, urlsplit, urlunsplit

from sqlalchemy import case, create_engine, delete, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.config import (
    DATABASE_MAX_OVERFLOW_ENV,
    DATABASE_POOL_SIZE_ENV,
    load_nonnegative_int,
    load_positive_int,
)
from app.models.database import (
    DefaultEmissionFactor,
    PortalDeclaration,
    ReminderSubject,
    SmartLink,
    UploadedFile,
    User,
)

_logger = logging.getLogger(__name__)


def _connection_failure_reason(exc: SQLAlchemyError) -> str:
    """The driver's own first line, without SQLAlchemy's trailing help link.

    ``exc.orig`` is the psycopg error, which names the actual cause -- password
    authentication failed, could not translate host name, connection timed out
    -- rather than the SQLAlchemy wrapper around it. It carries the host and
    port but never the password, which is why it is safe to log.
    """

    detail = str(getattr(exc, "orig", None) or exc).strip()
    first_line = detail.splitlines()[0] if detail else type(exc).__name__
    return first_line[:300]


def normalize_database_url(database_url: str) -> str:
    """Percent-encode credentials and select SQLAlchemy's psycopg driver."""

    parts = urlsplit(database_url)
    if parts.scheme not in {"postgres", "postgresql", "postgresql+psycopg"}:
        raise ValueError("DATABASE_URL must be a PostgreSQL connection URI.")
    username = quote(unquote(parts.username or ""), safe="")
    password = (
        f":{quote(unquote(parts.password), safe='')}"
        if parts.password is not None
        else ""
    )
    host = parts.hostname or ""
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    port = f":{parts.port}" if parts.port is not None else ""
    netloc = f"{username}{password}@{host}{port}" if username else host + port
    return urlunsplit(
        ("postgresql+psycopg", netloc, parts.path, parts.query, parts.fragment)
    )


def normalize_country_of_origin(value: str | None) -> str:
    if value is None:
        return "UNSPECIFIED"
    normalized = "_".join(value.strip().upper().replace("-", " ").split())
    return normalized or "UNSPECIFIED"


class DatabaseRepository:
    def __init__(self, database_url: str) -> None:
        self.engine = create_engine(
            normalize_database_url(database_url),
            pool_pre_ping=True,
            pool_size=load_positive_int(DATABASE_POOL_SIZE_ENV, 2),
            max_overflow=load_nonnegative_int(DATABASE_MAX_OVERFLOW_ENV, 0),
            pool_recycle=300,
        )
        self.session_factory = sessionmaker(self.engine, expire_on_commit=False)

    def ping(self) -> bool:
        """Whether the database answers. Logs why when it does not.

        /readyz reports this as a bare 503, which is the right answer to give
        a load balancer and a useless one to debug from: a wrong password, an
        unresolvable host and a firewall all look identical from outside. The
        reason belongs in the operator's log, where the URL is not echoed and
        only the driver's own message is kept.
        """

        try:
            with self.engine.connect() as connection:
                connection.execute(text("select 1"))
            return True
        except SQLAlchemyError as exc:
            _logger.warning("Database ping failed: %s", _connection_failure_reason(exc))
            return False

    def lookup_default_factor(
        self,
        cn_code: str | None,
        year: int | None,
        country_of_origin: str | None = None,
    ) -> Decimal | None:
        if cn_code is None or year is None:
            return None
        normalized_code = cn_code.replace(" ", "")
        # The Commission does not always publish a value at full CN8 - some
        # headings (e.g. 7601, unwrought aluminium) only ever carry one figure
        # for the whole 4- or 6-digit heading, because there is no finer
        # breakdown to publish (BACK-10). Try the code as given, then its
        # 6-digit and 4-digit prefixes, and prefer whichever match is most
        # specific.
        candidates = [normalized_code]
        if len(normalized_code) > 6:
            candidates.append(normalized_code[:6])
        if len(normalized_code) > 4:
            candidates.append(normalized_code[:4])

        exact_country = normalize_country_of_origin(country_of_origin)
        countries = [exact_country, "OTHER_COUNTRIES", "UNSPECIFIED"]
        with self.session_factory() as session:
            country_priority = case(
                (DefaultEmissionFactor.country_of_origin == exact_country, 0),
                (DefaultEmissionFactor.country_of_origin == "OTHER_COUNTRIES", 1),
                else_=2,
            )
            code_specificity = func.length(DefaultEmissionFactor.cn_code)
            statement = (
                select(DefaultEmissionFactor.specific_embedded_emissions)
                .where(
                    DefaultEmissionFactor.cn_code.in_(candidates),
                    DefaultEmissionFactor.reporting_year == year,
                    DefaultEmissionFactor.country_of_origin.in_(countries),
                )
                .order_by(
                    code_specificity.desc(),
                    country_priority,
                    DefaultEmissionFactor.route.nullsfirst(),
                )
                .limit(1)
            )
            return session.scalar(statement)

    # ── Portal declarations (docs/API-CONTRACT.md §2) ────────────
    # The document is the portal's; only the sort/filter columns are broken
    # out. Every method takes the owning user first — there is deliberately no
    # way to reach a row without saying whose it is.

    @staticmethod
    def _portal_doc(row: PortalDeclaration) -> dict[str, object]:
        # The contract wants epoch milliseconds; updatedAt is served from the
        # column so the client cannot lie about when a row last moved.
        return {
            **row.doc,
            "updatedAt": int(row.updated_at.timestamp() * 1000),
        }

    def list_portal_declarations(self, user_id: uuid.UUID) -> list[dict[str, object]]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(PortalDeclaration)
                .where(PortalDeclaration.user_id == user_id)
                .order_by(PortalDeclaration.updated_at.desc())
            ).all()
            return [self._portal_doc(row) for row in rows]

    def get_portal_declaration(
        self, user_id: uuid.UUID, declaration_id: str
    ) -> dict[str, object] | None:
        with self.session_factory() as session:
            row = session.get(PortalDeclaration, (user_id, declaration_id))
            return self._portal_doc(row) if row else None

    def save_portal_declaration(
        self, user_id: uuid.UUID, doc: dict[str, object]
    ) -> dict[str, object]:
        """Insert or overwrite one declaration document, whole.

        Serving POST and PUT alike: the id is client-minted, so a retried
        create and an edit are the same write, and merge() on the composite
        key keeps it idempotent.
        """

        now = datetime.datetime.now(datetime.timezone.utc)
        with self.session_factory.begin() as session:
            row = session.merge(
                PortalDeclaration(
                    user_id=user_id,
                    id=str(doc["id"]),
                    name=doc.get("name") if isinstance(doc.get("name"), str) else None,
                    period=doc.get("period")
                    if isinstance(doc.get("period"), str)
                    else None,
                    step=doc.get("step") if isinstance(doc.get("step"), str) else None,
                    doc=doc,
                    updated_at=now,
                )
            )
            return self._portal_doc(row)

    def delete_portal_declaration(
        self, user_id: uuid.UUID, declaration_id: str
    ) -> None:
        with self.session_factory.begin() as session:
            session.execute(
                delete(PortalDeclaration).where(
                    PortalDeclaration.user_id == user_id,
                    PortalDeclaration.id == declaration_id,
                )
            )

    # ── Smart links (docs/API-CONTRACT.md §3) ────────────────────
    # One dict shape for both stores: the no-database mode keeps rows in this
    # form on app.state, so the router never cares which store answered.

    @staticmethod
    def _smart_link_dict(row: SmartLink) -> dict[str, object]:
        return {
            "token": row.token,
            "userId": str(row.user_id),
            "declId": row.declaration_id,
            "supplierId": row.supplier_id,
            "month": row.month,
            "expiresAt": int(row.expires_at.timestamp() * 1000),
            "revokedAt": int(row.revoked_at.timestamp() * 1000)
            if row.revoked_at
            else None,
            # None only on the just-inserted row, where created_at is the
            # database's server_default and has not been read back.
            "createdAt": int(row.created_at.timestamp() * 1000)
            if row.created_at
            else None,
            "state": row.state,
        }

    def create_smart_link(
        self,
        user_id: uuid.UUID,
        declaration_id: str,
        supplier_id: str,
        token: str,
        month: str | None,
        expires_at: datetime.datetime,
    ) -> dict[str, object]:
        with self.session_factory.begin() as session:
            row = SmartLink(
                token=token,
                user_id=user_id,
                declaration_id=declaration_id,
                supplier_id=supplier_id,
                month=month,
                expires_at=expires_at,
            )
            session.add(row)
        return self._smart_link_dict(row)

    def get_smart_link(self, token: str) -> dict[str, object] | None:
        with self.session_factory() as session:
            row = session.get(SmartLink, token)
            return self._smart_link_dict(row) if row else None

    def update_smart_link_state(
        self, token: str, state: dict[str, object]
    ) -> dict[str, object] | None:
        """Overwrite one link's state blob whole, or None if it is gone.

        Save and submit both land here: the router computes the blob, the store
        just holds it. None on a missing row lets the caller answer the same
        dead-link code as a resolve -- a declaration deleted mid-flight cascades
        the link away, so the write finds nothing.
        """

        with self.session_factory.begin() as session:
            row = session.get(SmartLink, token)
            if row is None:
                return None
            row.state = state
            session.flush()
            return self._smart_link_dict(row)

    def revoke_smart_link(self, token: str) -> dict[str, object] | None:
        """Kill one link early, or None if it is gone.

        Idempotent: a link already revoked keeps its first ``revoked_at``. The
        date is evidence of when the supplier lost access, and a second click
        on the same button is not a new fact.
        """

        with self.session_factory.begin() as session:
            row = session.get(SmartLink, token)
            if row is None:
                return None
            if row.revoked_at is None:
                row.revoked_at = datetime.datetime.now(datetime.timezone.utc)
            session.flush()
            return self._smart_link_dict(row)

    def list_smart_links(
        self, user_id: uuid.UUID, declaration_id: str
    ) -> list[dict[str, object]]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(SmartLink)
                .where(
                    SmartLink.user_id == user_id,
                    SmartLink.declaration_id == declaration_id,
                )
                .order_by(SmartLink.created_at.desc())
            ).all()
            return [self._smart_link_dict(row) for row in rows]

    # ── Evidence files (PROJECT_STATUS.md R5) ────────────────────
    # Same shape from both stores, like smart links: the no-database mode keeps
    # these dicts on app.state so the routes never branch on which one answered.
    # Metadata and bytes are read separately on purpose - a listing must not
    # drag every certificate through memory to render a filename.

    @staticmethod
    def _uploaded_file_dict(row: UploadedFile) -> dict[str, object]:
        return {
            "id": str(row.id),
            "userId": str(row.user_id),
            "declId": row.declaration_id,
            "docId": row.doc_id,
            "uploadedViaToken": row.uploaded_via_token,
            "filename": row.filename,
            "contentType": row.content_type,
            "sizeBytes": int(row.size_bytes),
            "sha256": row.sha256,
            "storageKey": row.storage_key,
            "createdAt": int(row.created_at.timestamp() * 1000)
            if row.created_at
            else None,
        }

    def create_uploaded_file(
        self,
        user_id: uuid.UUID,
        declaration_id: str,
        doc_id: str | None,
        uploaded_via_token: str | None,
        filename: str,
        content_type: str,
        size_bytes: int,
        sha256: str,
        storage_key: str,
        data: bytes,
    ) -> dict[str, object]:
        with self.session_factory.begin() as session:
            row = UploadedFile(
                user_id=user_id,
                declaration_id=declaration_id,
                doc_id=doc_id,
                uploaded_via_token=uploaded_via_token,
                filename=filename,
                content_type=content_type,
                size_bytes=size_bytes,
                sha256=sha256,
                storage_key=storage_key,
                data=data,
            )
            session.add(row)
            session.flush()
            session.refresh(row)
            return self._uploaded_file_dict(row)

    def get_uploaded_file(self, file_id: uuid.UUID) -> dict[str, object] | None:
        with self.session_factory() as session:
            row = session.get(UploadedFile, file_id)
            return self._uploaded_file_dict(row) if row else None

    def list_uploaded_files(
        self, user_id: uuid.UUID, declaration_id: str
    ) -> list[dict[str, object]]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(UploadedFile)
                .where(
                    UploadedFile.user_id == user_id,
                    UploadedFile.declaration_id == declaration_id,
                )
                .order_by(UploadedFile.created_at.desc())
            ).all()
            return [self._uploaded_file_dict(row) for row in rows]

    def delete_uploaded_file(self, file_id: uuid.UUID) -> bool:
        with self.session_factory.begin() as session:
            row = session.get(UploadedFile, file_id)
            if row is None:
                return False
            session.delete(row)
            return True

    # The three ObjectStore operations, addressed by storage key rather than by
    # row id: that is the interface a bucket will implement, so nothing above
    # this line has to know which one is holding the bytes.

    def put_file_bytes(self, storage_key: str, data: bytes) -> None:
        with self.session_factory.begin() as session:
            row = session.scalars(
                select(UploadedFile).where(UploadedFile.storage_key == storage_key)
            ).one_or_none()
            if row is not None:
                row.data = data

    def get_file_bytes(self, storage_key: str) -> bytes | None:
        with self.session_factory() as session:
            row = session.scalars(
                select(UploadedFile).where(UploadedFile.storage_key == storage_key)
            ).one_or_none()
            return bytes(row.data) if row is not None and row.data is not None else None

    def delete_file_bytes(self, storage_key: str) -> None:
        with self.session_factory.begin() as session:
            row = session.scalars(
                select(UploadedFile).where(UploadedFile.storage_key == storage_key)
            ).one_or_none()
            if row is not None:
                row.data = None

    # ── Reminder subjects (PROJECT_STATUS.md R4) ─────────────────
    # What the nightly job is allowed to chase. Registered by the portal at the
    # moment it sends, because the portal is where the workspace, the supplier
    # contact and the deadline still live (D2).

    @staticmethod
    def _reminder_subject_dict(row: ReminderSubject) -> dict[str, object]:
        return {
            "id": str(row.id),
            "userId": str(row.user_id),
            "subjectKey": row.subject_key,
            "recipient": row.recipient,
            "supplierName": row.supplier_name,
            "periodLabel": row.period_label,
            "dueDate": row.due_date.isoformat(),
            "linkUrl": row.link_url,
            "locale": row.locale,
            "accountLocked": row.account_locked,
            "sentAt": int(row.sent_at.timestamp() * 1000) if row.sent_at else None,
            "resendCount": int(row.resend_count),
            "answeredAt": int(row.answered_at.timestamp() * 1000)
            if row.answered_at
            else None,
            "cancelledAt": int(row.cancelled_at.timestamp() * 1000)
            if row.cancelled_at
            else None,
        }

    def upsert_reminder_subject(
        self,
        user_id: uuid.UUID,
        subject_key: str,
        recipient: str,
        supplier_name: str,
        period_label: str,
        due_date: datetime.date,
        link_url: str,
        locale: str | None,
        account_locked: bool,
    ) -> dict[str, object]:
        """Register or refresh one ask.

        Deliberately does NOT touch sent_at, resend_count or answered_at: those
        are the history of what actually happened, and re-registering an ask
        after editing a deadline must not un-send it.
        """

        with self.session_factory.begin() as session:
            row = session.scalars(
                select(ReminderSubject).where(
                    ReminderSubject.user_id == user_id,
                    ReminderSubject.subject_key == subject_key,
                )
            ).one_or_none()
            if row is None:
                row = ReminderSubject(
                    user_id=user_id,
                    subject_key=subject_key,
                    recipient=recipient,
                    supplier_name=supplier_name,
                    period_label=period_label,
                    due_date=due_date,
                    link_url=link_url,
                    locale=locale,
                    account_locked=account_locked,
                )
                session.add(row)
            else:
                row.recipient = recipient
                row.supplier_name = supplier_name
                row.period_label = period_label
                row.due_date = due_date
                row.link_url = link_url
                row.locale = locale
                row.account_locked = account_locked
                # An ask that was cancelled and then registered again is a
                # live ask; anything else would need a second endpoint to undo.
                row.cancelled_at = None
            session.flush()
            session.refresh(row)
            return self._reminder_subject_dict(row)

    def _touch_reminder_subject(
        self, user_id: uuid.UUID, subject_key: str, apply
    ) -> dict[str, object] | None:
        with self.session_factory.begin() as session:
            row = session.scalars(
                select(ReminderSubject).where(
                    ReminderSubject.user_id == user_id,
                    ReminderSubject.subject_key == subject_key,
                )
            ).one_or_none()
            if row is None:
                return None
            apply(row)
            session.flush()
            session.refresh(row)
            return self._reminder_subject_dict(row)

    def mark_reminder_subject_sent(
        self, user_id: uuid.UUID, subject_key: str, when: datetime.datetime
    ) -> dict[str, object] | None:
        def apply(row: ReminderSubject) -> None:
            if row.sent_at is None:
                row.sent_at = when
            else:
                # The first send is not a re-send. "Sent once last week" and
                # "chased three times and still nothing" are different
                # conversations, and the count is what tells them apart.
                row.resend_count = int(row.resend_count) + 1

        return self._touch_reminder_subject(user_id, subject_key, apply)

    def mark_reminder_subject_answered(
        self, user_id: uuid.UUID, subject_key: str, when: datetime.datetime
    ) -> dict[str, object] | None:
        def apply(row: ReminderSubject) -> None:
            row.answered_at = when

        return self._touch_reminder_subject(user_id, subject_key, apply)

    def cancel_reminder_subject(
        self, user_id: uuid.UUID, subject_key: str, when: datetime.datetime
    ) -> dict[str, object] | None:
        def apply(row: ReminderSubject) -> None:
            row.cancelled_at = when

        return self._touch_reminder_subject(user_id, subject_key, apply)

    def list_reminder_subjects(self, user_id: uuid.UUID) -> list[dict[str, object]]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(ReminderSubject)
                .where(ReminderSubject.user_id == user_id)
                .order_by(ReminderSubject.due_date)
            ).all()
            return [self._reminder_subject_dict(row) for row in rows]

    def open_reminder_subjects(self) -> list[dict[str, object]]:
        """Every unanswered ask across every account, for the nightly job.

        Not scoped to one account on purpose - this is the one query in the
        repository whose caller is a scheduled process rather than a request,
        and it is the only place the exporter's own name is joined in, because
        the email says who is asking.

        Never sent means never chased: a supplier who has not heard from anyone
        must not receive a reminder about a request that does not exist yet.
        """

        with self.session_factory() as session:
            rows = session.execute(
                select(ReminderSubject, User.company_name, User.email)
                .join(User, User.id == ReminderSubject.user_id)
                .where(
                    ReminderSubject.answered_at.is_(None),
                    ReminderSubject.cancelled_at.is_(None),
                    ReminderSubject.sent_at.is_not(None),
                )
                .order_by(ReminderSubject.due_date)
            ).all()
            out: list[dict[str, object]] = []
            for row, company_name, email in rows:
                item = self._reminder_subject_dict(row)
                item["exporterName"] = company_name or email
                out.append(item)
            return out
