"""The onboarded flag: what routes a sign-in past the setup wizard."""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()


def _fresh_email() -> str:
    return f"onboard-{next(_counter)}@certrace-tests.co"


def test_completing_onboarding_sticks_to_the_account() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)
    email = _fresh_email()
    session = client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    ).json()
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    assert session["user"]["onboarded"] is False

    done = client.post("/api/auth/onboarded", headers=headers)
    assert done.status_code == 200
    assert done.json()["user"]["onboarded"] is True

    # The next sign-in reads the flag from the account, not from the browser
    # that set it — this is what sends a returning user straight to /dashboard.
    again = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    assert again.json()["user"]["onboarded"] is True


def test_marking_onboarded_requires_a_token() -> None:
    client = TestClient(create_app(), raise_server_exceptions=False)

    assert client.post("/api/auth/onboarded").status_code == 401
