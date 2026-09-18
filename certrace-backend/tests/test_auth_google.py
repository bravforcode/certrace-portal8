"""Sign in with Google — POST /api/auth/google.

The tests sign their own ID tokens with a throwaway RSA key and hand the app a
resolver for it, so nothing here reaches Google. What is under test is every
check the endpoint makes on a token, and the three account cases: new, already
linked, and an existing password account being linked.
"""

from __future__ import annotations

import datetime
import itertools
import secrets

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.main import create_app

CLIENT_ID = "certrace-test.apps.googleusercontent.com"
_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_counter = itertools.count()


def _client(client_id: str | None = CLIENT_ID) -> TestClient:
    return TestClient(
        create_app(
            google_client_id=client_id,
            google_key_resolver=lambda _token: _KEY.public_key(),
        ),
        raise_server_exceptions=False,
    )


def _fresh_email() -> str:
    return f"google-{next(_counter)}@certrace-tests.co"


def _id_token(email: str, *, nonce: str, key=_KEY, **overrides) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": f"sub-{email}",
        "email": email,
        "email_verified": True,
        "given_name": "Fern",
        "family_name": "Boontub",
        "nonce": nonce,
        "iat": now,
        "exp": now + datetime.timedelta(minutes=5),
    }
    claims.update(overrides)
    return jwt.encode(claims, key, algorithm="RS256")


def _sign_in(client: TestClient, email: str, **overrides):
    nonce = overrides.pop("nonce", None) or secrets.token_urlsafe(24)
    sent_nonce = overrides.pop("sent_nonce", nonce)
    token = _id_token(email, nonce=nonce, **overrides)
    return client.post("/api/auth/google", json={"idToken": token, "nonce": sent_nonce})


def test_unconfigured_server_answers_503() -> None:
    response = _sign_in(_client(client_id=None), _fresh_email())

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "GOOGLE_NOT_CONFIGURED"


def test_first_sign_in_creates_an_unonboarded_account() -> None:
    email = _fresh_email()

    response = _sign_in(_client(), email)

    assert response.status_code == 200
    body = response.json()
    assert body["accessToken"] and body["refreshToken"]
    assert body["user"]["email"] == email
    assert body["user"]["onboarded"] is False
    assert body["user"]["firstName"] == "Fern"


def test_signing_in_again_opens_the_same_account() -> None:
    client = _client()
    email = _fresh_email()

    first = _sign_in(client, email).json()["user"]["id"]
    second = _sign_in(client, email).json()["user"]["id"]

    assert first == second


def test_existing_password_account_is_linked_and_its_password_retired() -> None:
    client = _client()
    email = _fresh_email()
    registered = client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    ).json()

    response = _sign_in(client, email)

    assert response.status_code == 200
    assert response.json()["user"]["id"] == registered["user"]["id"]
    # Whoever set that password may not have owned the mailbox: it no longer
    # opens the account, and the session it minted is dead.
    login = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    assert login.status_code == 401
    refresh = client.post(
        "/api/auth/refresh", json={"refreshToken": registered["refreshToken"]}
    )
    assert refresh.status_code == 401


def test_email_linked_to_another_google_account_is_refused() -> None:
    client = _client()
    email = _fresh_email()
    assert _sign_in(client, email).status_code == 200

    response = _sign_in(client, email, sub="someone-else")

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "GOOGLE_ACCOUNT_CONFLICT"


@pytest.mark.parametrize(
    "overrides",
    [
        pytest.param({"aud": "another-site.apps.googleusercontent.com"}, id="audience"),
        pytest.param({"iss": "https://evil.example"}, id="issuer"),
        pytest.param({"email_verified": False}, id="unverified-email"),
        pytest.param({"sent_nonce": "a-nonce-from-another-attempt"}, id="nonce"),
        pytest.param({"key": _OTHER_KEY}, id="signature"),
        pytest.param(
            {
                "exp": datetime.datetime.now(datetime.timezone.utc)
                - datetime.timedelta(minutes=1)
            },
            id="expired",
        ),
    ],
)
def test_a_token_failing_any_check_is_refused(overrides: dict) -> None:
    response = _sign_in(_client(), _fresh_email(), **overrides)

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_GOOGLE_TOKEN"
