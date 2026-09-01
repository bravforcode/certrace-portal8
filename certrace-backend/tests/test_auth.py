"""Unit tests for authentication and password management endpoints."""

from __future__ import annotations

import re

from conftest import ExplodingTransport, RecordingTransport
from fastapi.testclient import TestClient

from app.main import create_app
from app.services.email import EmailDeliveryError


def _app_with_mail() -> tuple[TestClient, RecordingTransport]:
    """A client whose outbound mail we can read, as the recipient would."""

    transport = RecordingTransport()
    return TestClient(create_app(email_transport=transport)), transport


def _code_from(transport: RecordingTransport) -> str:
    """Pull the reset code out of the delivered message.

    Reading it from the email rather than the response is the whole point of
    this round: the code exists nowhere an API caller can reach.
    """

    match = re.search(r"\b\d{6}\b", transport.last.text)
    assert match, f"no reset code in the email: {transport.last.text!r}"
    return match.group(0)


def test_change_password_success() -> None:
    app = create_app()
    client = TestClient(app)

    payload = {
        "email": "wasawat@siamsteel.co.th",
        "current_password": "demo-password",
        "new_password": "new-secure-password-123",
    }
    response = client.post("/api/auth/change-password", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Password updated" in data["message"]

    # Verify old password no longer works
    fail_response = client.post("/api/auth/change-password", json=payload)
    assert fail_response.status_code == 400
    detail = fail_response.json()["detail"]
    assert detail["code"] == "INVALID_CREDENTIALS"
    assert "incorrect" in detail["message"].lower()

    # Verify new password works
    new_payload = {
        "email": "wasawat@siamsteel.co.th",
        "current_password": "new-secure-password-123",
        "new_password": "demo-password",
    }
    restore_response = client.post("/api/auth/change-password", json=new_payload)
    assert restore_response.status_code == 200


def test_change_password_invalid_current() -> None:
    app = create_app()
    client = TestClient(app)

    payload = {
        "email": "wasawat@siamsteel.co.th",
        "current_password": "wrong-password",
        "new_password": "new-secure-password-123",
    }
    response = client.post("/api/auth/change-password", json=payload)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "INVALID_CREDENTIALS"
    assert "incorrect" in detail["message"].lower()


def test_forgot_and_reset_password_flow() -> None:
    client, transport = _app_with_mail()

    # 1. Request forgot password — the code arrives by email, not in the body.
    forgot_payload = {"email": "demo@certrace.com"}
    forgot_resp = client.post("/api/auth/forgot-password", json=forgot_payload)
    assert forgot_resp.status_code == 200
    assert "reset_token" not in forgot_resp.json()
    token = _code_from(transport)

    # 2. Reset password with valid token
    reset_payload = {
        "email": "demo@certrace.com",
        "reset_token": token,
        "new_password": "brand-new-password-999",
    }
    reset_resp = client.post("/api/auth/reset-password", json=reset_payload)
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # 3. Trying to reuse same reset token should fail
    reuse_resp = client.post("/api/auth/reset-password", json=reset_payload)
    assert reuse_resp.status_code == 400
    detail = reuse_resp.json()["detail"]
    assert detail["code"] == "INVALID_RESET_TOKEN"
    assert "invalid" in detail["message"].lower()


def test_forgot_password_says_the_same_thing_for_an_unknown_address() -> None:
    """The endpoint must not double as a "is this address a customer?" oracle
    -- and must not mail a reset code to someone who never signed up."""

    client, transport = _app_with_mail()

    known = client.post(
        "/api/auth/forgot-password", json={"email": "demo@certrace.com"}
    )
    unknown = client.post(
        "/api/auth/forgot-password", json={"email": "nobody@example.com"}
    )

    assert unknown.status_code == known.status_code == 200
    assert unknown.json() == known.json()
    assert [message.to for message in transport.sent] == ["demo@certrace.com"]


def test_reset_email_follows_the_requested_locale() -> None:
    client, transport = _app_with_mail()

    client.post(
        "/api/auth/forgot-password",
        json={"email": "demo@certrace.com", "locale": "th-TH"},
    )

    assert "รหัส" in transport.last.subject


def test_completing_a_reset_confirms_by_email() -> None:
    client, transport = _app_with_mail()

    client.post("/api/auth/forgot-password", json={"email": "demo@certrace.com"})
    code = _code_from(transport)

    response = client.post(
        "/api/auth/reset-password",
        json={
            "email": "demo@certrace.com",
            "reset_token": code,
            "new_password": "another-new-password-1",
        },
    )

    assert response.status_code == 200
    assert len(transport.sent) == 2
    assert transport.last.to == "demo@certrace.com"
    assert "changed" in transport.last.subject.lower()


def test_changing_a_password_sends_a_confirmation() -> None:
    client, transport = _app_with_mail()

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "wasawat@siamsteel.co.th",
            "current_password": "demo-password",
            "new_password": "temporary-password-42",
        },
    )
    assert response.status_code == 200
    assert transport.last.to == "wasawat@siamsteel.co.th"
    assert "changed" in transport.last.subject.lower()

    restore = client.post(
        "/api/auth/change-password",
        json={
            "email": "wasawat@siamsteel.co.th",
            "current_password": "temporary-password-42",
            "new_password": "demo-password",
        },
    )
    assert restore.status_code == 200


def test_change_password_for_an_unknown_address_sends_nothing() -> None:
    """change_user_password still registers an unknown address on the spot (a
    fixture that predates this router). The router must not turn that into a
    security notice mailed to a stranger."""

    client, transport = _app_with_mail()

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "stranger@example.com",
            "current_password": "anything-at-all",
            "new_password": "something-else-99",
        },
    )

    assert response.status_code == 200
    assert transport.sent == []


def test_a_delivery_failure_does_not_break_the_request() -> None:
    transport = ExplodingTransport(EmailDeliveryError("provider unreachable"))
    client = TestClient(create_app(email_transport=transport))

    response = client.post(
        "/api/auth/forgot-password", json={"email": "demo@certrace.com"}
    )

    assert response.status_code == 200
    assert transport.attempts == 1
