"""Unit tests for authentication and password management endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


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
    assert "incorrect" in fail_response.json()["detail"].lower()

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
    assert "incorrect" in response.json()["detail"].lower()


def test_forgot_and_reset_password_flow() -> None:
    app = create_app()
    client = TestClient(app)

    # 1. Request forgot password
    forgot_payload = {"email": "demo@certrace.com"}
    forgot_resp = client.post("/api/auth/forgot-password", json=forgot_payload)
    assert forgot_resp.status_code == 200
    token = forgot_resp.json()["reset_token"]
    assert token is not None

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
    assert "invalid" in reuse_resp.json()["detail"].lower()
