"""Where the nightly run gets its work (PROJECT_STATUS.md R4).

``NullSource`` was the honest answer while every input lived in a browser: the
workspace held the month and the deadline, ``supplier-companies`` held the
address to write to, and ``month-dispatch`` held whether anyone had asked yet.
A job with none of those can only run green and send nothing.

``DatabaseReminderSource`` is the adapter the job's own docstring promised -
one class, no change to the ladder, the claim or the copy. It reads the
``reminder_subjects`` rows the portal registers when it sends, which are
already written for a reader.

Trial reminders are still empty and that is not an oversight either: plans and
billing are not modelled server-side at all. There is no table to read, and a
trial date invented here would start emailing people about an expiry the
product does not actually enforce. It stays empty until billing is real.
"""

from __future__ import annotations

import datetime
from collections.abc import Sequence

from app.services.reminders import SupplierRequest, TrialAccount


class DatabaseReminderSource:
    """Outstanding asks, straight from ``reminder_subjects``."""

    def __init__(self, repository) -> None:
        self._repository = repository

    def open_supplier_requests(self, today: datetime.date) -> Sequence[SupplierRequest]:
        """Every registered ask that is still open.

        ``today`` is not used to filter. The ladder in
        app/services/reminder_schedule.py decides which rung is due from the
        due date, and it is the only place that decision belongs - a source
        that also filtered by date would silently move the schedule, and the
        two would drift apart without either being wrong on its own.
        """

        requests: list[SupplierRequest] = []
        for row in self._repository.open_reminder_subjects():
            requests.append(
                SupplierRequest(
                    subject_id=str(row["subjectKey"]),
                    recipient=str(row["recipient"]),
                    supplier_name=str(row["supplierName"]),
                    exporter_name=str(row["exporterName"]),
                    period_label=str(row["periodLabel"]),
                    due_date=datetime.date.fromisoformat(str(row["dueDate"])),
                    link_url=str(row["linkUrl"]),
                    locale=row["locale"] if row["locale"] else None,
                    account_locked=bool(row["accountLocked"]),
                )
            )
        return requests

    def trial_accounts(self, today: datetime.date) -> Sequence[TrialAccount]:
        """Empty until plans exist server-side. See the module docstring."""

        return ()
