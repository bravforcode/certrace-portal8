"""Register, sign in, and who-am-I -- section 1 of docs/API-CONTRACT.md.

Every app here is built without a database, so the in-process account store is
the one under test. That store is module state shared by the whole suite, so
each test signs up its own address rather than reusing one.
"""

from __future__ import annotations

import itertools

import pytest
from fastapi.testclient import TestClient

from app.core.tokens import issue_access_token
import app.main as app_main
from app.main import create_app

_counter = itertools.count()


def _fresh_email() -> str:
    return f"signup-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _register(client: TestClient, email: str, password: str = "a-good-password-1"):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "firstName": "Fern",
            "lastName": "Boontub",
            "companyName": "Certrace",
        },
    )


def test_register_returns_a_session_in_the_contract_shape() -> None:
    client = _client()
    email = _fresh_email()

    response = _register(client, email)

    assert response.status_code == 201
    body = response.json()
    assert body["accessToken"]
    assert body["user"]["email"] == email
    assert body["user"]["id"]
    # The portal branches on this to send a new signup through /onboarding.
    assert body["user"]["onboarded"] is False
    assert body["user"]["firstName"] == "Fern"
    assert body["user"]["companyName"] == "Certrace"


def test_register_rejects_an_address_that_already_has_an_account() -> None:
    client = _client()
    email = _fresh_email()
    assert _register(client, email).status_code == 201

    response = _register(client, email)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "EMAIL_TAKEN"


def test_register_rejects_a_short_password() -> None:
    client = _client()
    response = client.post(
        "/api/auth/register",
        json={"email": _fresh_email(), "password": "short"},
    )
    assert response.status_code == 422


def test_login_returns_a_working_session() -> None:
    client = _client()
    email = _fresh_email()
    _register(client, email)

    response = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == email

    token = response.json()["accessToken"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["user"]["email"] == email


def test_login_is_case_insensitive_about_the_address() -> None:
    client = _client()
    email = _fresh_email()
    _register(client, email)

    response = client.post(
        "/api/auth/login",
        json={"email": email.upper(), "password": "a-good-password-1"},
    )

    assert response.status_code == 200


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "nobody-here@certrace-tests.co", "password": "a-good-password-1"},
        {"email": "known", "password": "not-the-password"},
    ],
    ids=["unknown address", "wrong password"],
)
def test_login_answers_the_same_way_for_both_kinds_of_failure(
    payload: dict[str, str],
) -> None:
    """A different answer for the two would say which addresses are customers."""

    client = _client()
    email = _fresh_email()
    _register(client, email)
    if payload["email"] == "known":
        payload = {**payload, "email": email}

    response = client.post("/api/auth/login", json=payload)

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"Authorization": "Bearer "},
        {"Authorization": "not-even-a-scheme"},
        {"Authorization": "Basic dXNlcjpwYXNz"},
        {"Authorization": "Bearer not.a.jwt"},
    ],
    ids=["absent", "empty", "no scheme", "wrong scheme", "malformed"],
)
def test_me_refuses_anything_that_is_not_a_valid_bearer(
    headers: dict[str, str],
) -> None:
    assert _client().get("/api/auth/me", headers=headers).status_code == 401


def test_me_refuses_a_token_signed_with_another_key() -> None:
    """The forged token is well-formed and unexpired; only the key is wrong."""

    client = _client()
    email = _fresh_email()
    user_id = _register(client, email).json()["user"]["id"]

    forged = issue_access_token(
        "not-the-servers-key-but-long-enough-for-hs256", user_id=user_id, email=email
    )

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401


def test_me_refuses_a_valid_token_for_an_account_that_is_gone() -> None:
    app = create_app()
    client = TestClient(app, raise_server_exceptions=False)
    token = issue_access_token(
        app.state.jwt_secret,
        user_id="00000000-0000-4000-8000-00000000dead",
        email="ghost@certrace-tests.co",
    )

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_me_reads_the_account_back_rather_than_trusting_the_token() -> None:
    """A token minted before onboarding must not keep reporting onboarded=False.

    The flag lives in the store, so /me reflects a change the token predates.
    """

    from app.services import auth_service

    client = _client()
    email = _fresh_email()
    token = _register(client, email).json()["accessToken"]

    auth_service._MEMORY_USERS[email]["onboarded"] = True

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["user"]["onboarded"] is True


def test_a_database_without_a_signing_key_refuses_to_start(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Signing with a per-process key would log everyone out on every restart.

    The lookup is stubbed rather than left to the environment: a developer with
    a real CERTRACE_JWT_SECRET in their .env would otherwise watch this pass
    while proving nothing.
    """

    monkeypatch.setattr(app_main, "load_env_file_value", lambda _name: None)

    with pytest.raises(RuntimeError, match="CERTRACE_JWT_SECRET"):
        create_app(database_url="postgresql://u:p@localhost:5432/postgres")
