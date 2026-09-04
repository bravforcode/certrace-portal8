"""Unit tests for authentication and password management endpoints."""

from __future__ import annotations

import re

from conftest import ExplodingTransport, RecordingTransport
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.tokens import issue_access_token
from app.main import create_app
from app.services.email import EmailDeliveryError


def _app_with_mail() -> tuple[TestClient, RecordingTransport]:
    """A client whose outbound mail we can read, as the recipient would."""

    transport = RecordingTransport()
    return TestClient(create_app(email_transport=transport)), transport


def _bearer(client: TestClient, email: str, password: str) -> dict[str, str]:
    """Sign in and shape the token as /change-password now requires it."""

    response = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


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
    headers = _bearer(client, "wasawat@siamsteel.co.th", "demo-password")

    payload = {
        "email": "wasawat@siamsteel.co.th",
        "current_password": "demo-password",
        "new_password": "new-secure-password-123",
    }
    response = client.post("/api/auth/change-password", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Password updated" in data["message"]

    # Verify old password no longer works
    fail_response = client.post(
        "/api/auth/change-password", json=payload, headers=headers
    )
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
    restore_response = client.post(
        "/api/auth/change-password", json=new_payload, headers=headers
    )
    assert restore_response.status_code == 200


def test_change_password_requires_a_token() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "wasawat@siamsteel.co.th",
            "current_password": "demo-password",
            "new_password": "new-secure-password-123",
        },
    )

    assert response.status_code == 401


def test_change_password_moves_the_callers_own_account_only() -> None:
    """The body's email is ignored: the token names whose password changes."""

    client = TestClient(create_app())
    headers = _bearer(client, "wasawat@siamsteel.co.th", "demo-password")

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "demo@certrace.com",  # somebody else
            "current_password": "demo-password",
            "new_password": "temporarily-different-1",
        },
        headers=headers,
    )
    assert response.status_code == 200

    # demo@certrace.com is untouched; the caller's own password moved.
    other = client.post(
        "/api/auth/login",
        json={"email": "demo@certrace.com", "password": "demo-password"},
    )
    assert other.status_code == 200
    restore = client.post(
        "/api/auth/change-password",
        json={
            "email": "wasawat@siamsteel.co.th",
            "current_password": "temporarily-different-1",
            "new_password": "demo-password",
        },
        headers=headers,
    )
    assert restore.status_code == 200


def test_change_password_invalid_current() -> None:
    app = create_app()
    client = TestClient(app)
    headers = _bearer(client, "wasawat@siamsteel.co.th", "demo-password")

    payload = {
        "email": "wasawat@siamsteel.co.th",
        "current_password": "wrong-password",
        "new_password": "new-secure-password-123",
    }
    response = client.post("/api/auth/change-password", json=payload, headers=headers)
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
    headers = _bearer(client, "wasawat@siamsteel.co.th", "demo-password")

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "wasawat@siamsteel.co.th",
            "current_password": "demo-password",
            "new_password": "temporary-password-42",
        },
        headers=headers,
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
        headers=headers,
    )
    assert restore.status_code == 200


def test_change_password_for_a_stranger_sends_nothing() -> None:
    """No token, no work: the unauthenticated probe that used to claim an
    unknown address in the no-database mode now stops at the door — and no
    security notice goes to anyone."""

    client, transport = _app_with_mail()

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "stranger@example.com",
            "current_password": "anything-at-all",
            "new_password": "something-else-99",
        },
    )

    assert response.status_code == 401
    assert transport.sent == []


class BrokenDatabase:
    """A configured account store that fails every statement.

    Stands in for the whole family of real failures -- the instance is down,
    the password was rotated, the `users` table was never migrated -- which
    all reach the service as a ``SQLAlchemyError``.
    """

    def session_factory(self) -> object:
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))


def _client_with_broken_database() -> TestClient:
    app = create_app()
    app.state.database = BrokenDatabase()
    return TestClient(app, raise_server_exceptions=False)


def test_change_password_reports_the_outage_instead_of_using_memory() -> None:
    """The demo accounts must not answer for a configured database.

    They are seeded with a known password, so falling back to them here would
    let anyone holding "demo-password" change a real account -- and would
    report success for a write that never reached PostgreSQL.
    """

    app = create_app()
    # A well-signed token for a real-shaped subject: the outage must surface
    # while resolving the bearer, not be mistaken for a bad credential.
    token = issue_access_token(
        app.state.jwt_secret,
        user_id="00000000-0000-4000-8000-000000000002",
        email="demo@certrace.com",
    )
    app.state.database = BrokenDatabase()
    client = TestClient(app, raise_server_exceptions=False)

    response = client.post(
        "/api/auth/change-password",
        json={
            "email": "demo@certrace.com",
            "current_password": "demo-password",
            "new_password": "new-secure-password-123",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ACCOUNT_STORE_UNAVAILABLE"


def test_reset_password_reports_the_outage_instead_of_using_memory() -> None:
    client = _client_with_broken_database()

    response = client.post(
        "/api/auth/reset-password",
        json={
            "email": "demo@certrace.com",
            "reset_token": "123456",
            "new_password": "new-secure-password-123",
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ACCOUNT_STORE_UNAVAILABLE"


def test_forgot_password_reports_the_outage_instead_of_using_memory() -> None:
    """Even the endpoint with a deliberately uninformative body must not lie.

    Its generic message means "we have handled this". Returning it while the
    account store is down would promise an email that no code was issued for.
    """

    client = _client_with_broken_database()

    response = client.post(
        "/api/auth/forgot-password", json={"email": "demo@certrace.com"}
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ACCOUNT_STORE_UNAVAILABLE"


def test_a_delivery_failure_does_not_break_the_request() -> None:
    transport = ExplodingTransport(EmailDeliveryError("provider unreachable"))
    client = TestClient(create_app(email_transport=transport))

    response = client.post(
        "/api/auth/forgot-password", json={"email": "demo@certrace.com"}
    )

    assert response.status_code == 200
    assert transport.attempts == 1
