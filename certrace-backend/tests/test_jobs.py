"""The door GitHub Actions knocks on once a day (app/routers/jobs.py).

What matters is who can open it: nobody when no token is configured, nobody
with the wrong token, and the run behind it is the same ``reminders.run`` the
CLI uses, so it is not re-tested here beyond "it ran and reported".
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.services.reminders import RunSummary

TOKEN = "jobs-token-for-tests"
URL = "/api/internal/jobs/send-reminders"


class _Store:
    session_factory = None


def _client(
    token: str | None = TOKEN, store: object | None = None, emails: bool = True
) -> TestClient:
    application = create_app()
    application.state.jobs_token = token
    application.state.supplier_emails_enabled = emails
    application.state.reminder_store = store
    return TestClient(application, raise_server_exceptions=False)


def test_with_no_token_configured_the_route_does_not_exist() -> None:
    response = _client(token=None).post(URL, headers={"Authorization": "Bearer x"})

    assert response.status_code == 404


@pytest.mark.parametrize(
    "header", [None, "Bearer wrong", f"Basic {TOKEN}", "Bearer", TOKEN]
)
def test_anything_but_the_exact_bearer_token_is_refused(header) -> None:
    headers = {"Authorization": header} if header is not None else {}

    response = _client(store=_Store()).post(URL, headers=headers)

    assert response.status_code == 401


def test_without_a_database_it_refuses_rather_than_repeating_every_day() -> None:
    response = _client(store=None).post(
        URL, headers={"Authorization": f"Bearer {TOKEN}"}
    )

    assert response.status_code == 503


def test_the_right_token_runs_the_ladder_and_reports(monkeypatch) -> None:
    seen: dict[str, object] = {}

    def fake_run(**kwargs):
        seen.update(kwargs)
        return RunSummary(considered=3, sent=1, skipped_locked=1)

    monkeypatch.setattr("app.services.reminders.run", fake_run)

    response = _client(store=_Store()).post(
        f"{URL}?dry_run=true", headers={"Authorization": f"Bearer {TOKEN}"}
    )

    assert response.status_code == 200
    assert response.json() == {
        "dryRun": True,
        "considered": 3,
        "sent": 1,
        "failed": 0,
        "skippedLocked": 1,
    }
    assert seen["dry_run"] is True


def test_with_supplier_email_off_a_run_can_only_rehearse(monkeypatch) -> None:
    seen: dict[str, object] = {}

    def fake_run(**kwargs):
        seen.update(kwargs)
        return RunSummary()

    monkeypatch.setattr("app.services.reminders.run", fake_run)

    response = _client(store=_Store(), emails=False).post(
        f"{URL}?dry_run=false", headers={"Authorization": f"Bearer {TOKEN}"}
    )

    assert response.status_code == 200
    assert response.json()["dryRun"] is True
    assert seen["dry_run"] is True
