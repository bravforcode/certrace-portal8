"""Brute-force fences: rate limits, the reset-code attempt cap, and code
invalidation on reissue.

Every test builds its own app because the limiter lives on ``app.state`` —
counters must not leak between tests. The account store is module state, so
tests that guess passwords use their own registered addresses.
"""

from __future__ import annotations

import itertools
import re

from conftest import RecordingTransport
from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()


def _fresh_email() -> str:
    return f"hardening-{next(_counter)}@certrace-tests.co"


def _app_with_mail() -> tuple[TestClient, RecordingTransport]:
    transport = RecordingTransport()
    return TestClient(create_app(email_transport=transport)), transport


def _code_from(transport: RecordingTransport) -> str:
    match = re.search(r"\b\d{6}\b", transport.last.text)
    assert match, f"no reset code in the email: {transport.last.text!r}"
    return match.group(0)


def test_login_rate_limit_answers_the_contract_code() -> None:
    client = TestClient(create_app())
    email = _fresh_email()
    client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    )

    wrong = {"email": email, "password": "not-the-password"}
    responses = [
        client.post("/api/auth/login", json=wrong).status_code for _ in range(10)
    ]
    assert set(responses) == {401}

    limited = client.post("/api/auth/login", json=wrong)
    assert limited.status_code == 429
    assert limited.json()["detail"]["code"] == "RATE_LIMITED"

    # The cap is on attempts, not failures: the right password is throttled
    # too, or the limiter itself would confirm a guess.
    correct = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    assert correct.status_code == 429


def test_forgot_password_stops_mail_bombing() -> None:
    client, transport = _app_with_mail()
    email = _fresh_email()
    client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    )
    sent_before = len(transport.sent)

    for _ in range(5):
        assert (
            client.post("/api/auth/forgot-password", json={"email": email}).status_code
            == 200
        )
    limited = client.post("/api/auth/forgot-password", json={"email": email})

    assert limited.status_code == 429
    assert limited.json()["detail"]["code"] == "RATE_LIMITED"
    assert len(transport.sent) == sent_before + 5


def test_a_new_reset_code_retires_the_old_one() -> None:
    client, transport = _app_with_mail()
    email = _fresh_email()
    client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    )

    client.post("/api/auth/forgot-password", json={"email": email})
    first_code = _code_from(transport)
    client.post("/api/auth/forgot-password", json={"email": email})
    second_code = _code_from(transport)

    stale = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_token": first_code,
            "new_password": "a-better-password-2",
        },
    )
    if first_code != second_code:
        assert stale.status_code == 400
        assert stale.json()["detail"]["code"] == "INVALID_RESET_TOKEN"

    fresh = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_token": second_code,
            "new_password": "a-better-password-2",
        },
    )
    assert fresh.status_code == 200


def test_wrong_guesses_burn_the_reset_code() -> None:
    client, transport = _app_with_mail()
    email = _fresh_email()
    client.post(
        "/api/auth/register", json={"email": email, "password": "a-good-password-1"}
    )
    client.post("/api/auth/forgot-password", json={"email": email})
    code = _code_from(transport)
    wrong = "000000" if code != "000000" else "111111"

    for _ in range(5):
        guess = client.post(
            "/api/auth/reset-password",
            json={
                "email": email,
                "reset_token": wrong,
                "new_password": "a-better-password-2",
            },
        )
        assert guess.status_code == 400

    # Five wrong guesses killed the code — the real one no longer redeems.
    real = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_token": code,
            "new_password": "a-better-password-2",
        },
    )
    assert real.status_code == 400
    assert real.json()["detail"]["code"] == "INVALID_RESET_TOKEN"


def test_reset_password_endpoint_is_rate_limited() -> None:
    client = TestClient(create_app())
    email = _fresh_email()

    for _ in range(10):
        client.post(
            "/api/auth/reset-password",
            json={
                "email": email,
                "reset_token": "123456",
                "new_password": "a-better-password-2",
            },
        )
    limited = client.post(
        "/api/auth/reset-password",
        json={
            "email": email,
            "reset_token": "123456",
            "new_password": "a-better-password-2",
        },
    )

    assert limited.status_code == 429
    assert limited.json()["detail"]["code"] == "RATE_LIMITED"


def test_limits_are_per_address_not_global() -> None:
    client = TestClient(create_app())
    crowded = _fresh_email()
    bystander = _fresh_email()
    client.post(
        "/api/auth/register",
        json={"email": bystander, "password": "a-good-password-1"},
    )

    for _ in range(10):
        client.post(
            "/api/auth/login", json={"email": crowded, "password": "whatever-1"}
        )

    unaffected = client.post(
        "/api/auth/login", json={"email": bystander, "password": "a-good-password-1"}
    )
    assert unaffected.status_code == 200
