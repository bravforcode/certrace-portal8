"""The durable half of the reminder scheduler's memory.

Implements ``app.services.reminders.DeliveryLog`` over PostgreSQL. The
interesting method is :meth:`claim`, and the interesting thing about it is that
it does not check before it writes.

── Why the check is the insert ─────────────────────────────────
"SELECT, and INSERT if absent" reads correctly and is wrong under concurrency:
two runs can both find the row missing before either writes, and both then send.
Overlapping runs are not exotic here -- a cron whose previous invocation ran
long, a container restarted mid-run, a manual run alongside the scheduled one.

So the claim is an unconditional INSERT, and the unique constraint on
(subject_id, occasion) decides the race. The loser sees IntegrityError, returns
False, and sends nothing. That makes "has this rung fired?" a question answered
by the database at write time rather than by the application at read time.
"""

from __future__ import annotations

import logging

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.models.database import NotificationDelivery
from app.services.reminders import notification_for

_LOGGER = logging.getLogger(__name__)


class DatabaseDeliveryLog:
    """A delivery log backed by ``public.notification_deliveries``."""

    def __init__(self, session_factory: sessionmaker) -> None:
        self._session_factory = session_factory

    def occasions_for(self, subject_id: str) -> set[str]:
        with self._session_factory() as session:
            rows = session.execute(
                select(NotificationDelivery.occasion).where(
                    NotificationDelivery.subject_id == subject_id
                )
            ).scalars()
            return set(rows)

    def claim(self, subject_id: str, occasion: str, recipient: str) -> bool:
        notification = notification_for(occasion)
        with self._session_factory() as session:
            session.add(
                NotificationDelivery(
                    subject_id=subject_id,
                    occasion=occasion,
                    notification_key=(
                        notification.key if notification else occasion
                    ),
                    recipient=recipient,
                )
            )
            try:
                session.commit()
            except IntegrityError:
                # Someone else holds this rung. Not an error: exactly one of us
                # was always going to send it.
                session.rollback()
                return False
        return True

    def release(self, subject_id: str, occasion: str) -> None:
        """Hand a claim back after the provider refused the message.

        A failure here leaves the rung claimed and unsent -- one reminder is
        lost and the ladder moves on, which is why it is logged rather than
        raised: the run has other recipients to get through.
        """

        try:
            with self._session_factory() as session:
                session.execute(
                    delete(NotificationDelivery).where(
                        NotificationDelivery.subject_id == subject_id,
                        NotificationDelivery.occasion == occasion,
                    )
                )
                session.commit()
        except SQLAlchemyError as error:
            _LOGGER.error(
                "Could not release the claim on %s for subject %s: %s. "
                "That rung will not be retried.",
                occasion,
                subject_id,
                error,
            )
