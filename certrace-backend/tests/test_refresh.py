"""The refresh-token session chain: rotate, reuse, revoke.

No-database mode, like the rest of the auth suite; the in-memory token dict
is module state, so every test registers its own account.
"""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()


def _fresh_email() -> str:
    return f"refresh-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _session(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/auth/register",
        json={"email": _fresh_email(), "password": "a-good-password-1"},
    )
    assert response.status_code == 201
    return response.json()


def test_signing_in_hands_out_both_halves_of_the_session() -> None:
    body = _session(_client())

    assert body["accessToken"]
    assert body["refreshToken"]
    assert body["refreshToken"] != body["accessToken"]


def test_refresh_rotates_and_the_new_session_works() -> None:
    client = _client()
    first = _session(client)

    refreshed = client.post(
        "/api/auth/refresh", json={"refreshToken": first["refreshToken"]}
    )

    assert refreshed.status_code == 200
    body = refreshed.json()
    assert body["refreshToken"] != first["refreshToken"]
    assert body["user"]["email"] == first["user"]["email"]
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['accessToken']}"},
    )
    assert me.status_code == 200


def test_a_redeemed_refresh_token_is_dead() -> None:
    client = _client()
    first = _session(client)
    client.post("/api/auth/refresh", json={"refreshToken": first["refreshToken"]})

    replay = client.post(
        "/api/auth/refresh", json={"refreshToken": first["refreshToken"]}
    )

    assert replay.status_code == 401
    assert replay.json()["detail"]["code"] == "INVALID_REFRESH_TOKEN"


def test_a_token_we_never_issued_is_refused() -> None:
    response = _client().post("/api/auth/refresh", json={"refreshToken": "x" * 43})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_REFRESH_TOKEN"


def test_logout_revokes_the_refresh_token() -> None:
    client = _client()
    session = _session(client)

    out = client.post(
        "/api/auth/logout", json={"refreshToken": session["refreshToken"]}
    )
    assert out.status_code == 200

    after = client.post(
        "/api/auth/refresh", json={"refreshToken": session["refreshToken"]}
    )
    assert after.status_code == 401
