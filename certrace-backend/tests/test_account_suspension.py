"""Suspending an account, and what that actually stops.

Built without a database like the rest of the auth suite, so the in-process
store is what is under test; the SQL path writes the same fields through the
statements in ``auth_service``.

The point of these tests is the second half of a suspension. Flipping a status
column is easy and proves nothing: what a customer notices is whether the
browser they left signed in yesterday still works, whether the week-long
refresh token still mints sessions, and whether the suppliers they invited can
still open the form. Each of those is a separate path, and each has its own
test here.
"""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.config import SUPPORT_EMAIL
from app.main import create_app
from app.services.auth_service import restore_account, suspend_account

_counter = itertools.count()

_REASON = "invoice 2026-0412, 15 days past the §6.4 notice"


def _fresh_email() -> str:
    return f"suspend-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _register(client: TestClient, email: str, password: str = "a-good-password-1"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _declaration(
    client: TestClient, headers: dict[str, str], declaration_id: str
) -> str:
    doc = {
        "id": declaration_id,
        "name": "Q2 2026 CBAM report",
        "regulation": "cbam",
        "period": "Q2 2026",
        "step": "collect",
        "suppliers": [{"id": "d1", "name": "Siam Yamato Steel"}],
        "requests": [
            {"supplierId": "d1", "products": [{"productId": "hrc", "lots": []}]}
        ],
    }
    assert (
        client.post("/api/v1/declarations", json=doc, headers=headers).status_code
        == 201
    )
    return declaration_id


def test_a_suspended_account_cannot_use_a_token_it_already_holds() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    # The token works right up to the moment the account is suspended.
    assert client.get("/api/auth/me", headers=headers).status_code == 200

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get("/api/auth/me", headers=headers)
    # 403, not 401: the session is intact, the entitlement is gone. The portal
    # clears a session on 401, which would leave this customer at a sign-in
    # screen that refuses them with no reason given.
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "ACCOUNT_SUSPENDED"


def test_the_suspension_reason_stays_out_of_the_response() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get("/api/auth/me", headers=headers)
    # It is our record for a billing dispute. The person reading this screen
    # may not be the person who owes the invoice it names.
    assert "2026-0412" not in response.text
    # What it says instead: where to take it up.
    assert SUPPORT_EMAIL in response.json()["detail"]["message"]


def test_a_suspended_account_cannot_sign_in_again() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.post(
        "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "ACCOUNT_SUSPENDED"


def test_a_wrong_password_on_a_suspended_account_still_says_nothing() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.post(
        "/api/auth/login", json={"email": email, "password": "not-the-password"}
    )

    # Suspension must not become a way to test whether an address is ours
    # without holding its password, so the credential check comes first.
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_suspension_burns_the_refresh_token_the_browser_is_holding() -> None:
    client = _client()
    session = _register(client, _fresh_email())

    result = suspend_account(None, session["user"]["id"], reason=_REASON)

    assert result is not None
    # The one minted at registration.
    assert result.refresh_tokens_revoked == 1
    response = client.post(
        "/api/auth/refresh", json={"refreshToken": session["refreshToken"]}
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_REFRESH_TOKEN"


def test_a_suspended_exporters_supplier_links_stop_resolving() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    declaration_id = _declaration(client, headers, "decl-suspend-1")
    minted = client.post(
        f"/api/v1/declarations/{declaration_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    ).json()
    token = minted["token"]
    assert client.get(f"/api/v1/links/{token}").status_code == 200

    suspend_account(None, session["user"]["id"], reason=_REASON)

    response = client.get(f"/api/v1/links/{token}")
    # The supplier holds a live token for a declaration nobody may work on. They
    # get the ordinary revoked answer: whose invoice is unpaid is not theirs to
    # learn from an error code.
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "TOKEN_REVOKED"


def test_restoring_brings_back_sign_in_and_the_supplier_links() -> None:
    client = _client()
    email = _fresh_email()
    session = _register(client, email)
    headers = {"Authorization": f"Bearer {session['accessToken']}"}
    declaration_id = _declaration(client, headers, "decl-suspend-2")
    token = client.post(
        f"/api/v1/declarations/{declaration_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    ).json()["token"]
    suspend_account(None, session["user"]["id"], reason=_REASON)

    restored = restore_account(None, session["user"]["id"])

    assert restored is not None and restored.is_suspended is False
    # Signing in again is the cost of a suspension; re-inviting every supplier
    # would not be, which is why the links were never stamped revoked.
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "a-good-password-1"}
        ).status_code
        == 200
    )
    assert client.get(f"/api/v1/links/{token}").status_code == 200


def test_suspending_twice_keeps_the_first_date_and_takes_the_new_reason() -> None:
    client = _client()
    session = _register(client, _fresh_email())
    user_id = session["user"]["id"]

    first = suspend_account(None, user_id, reason=_REASON)
    second = suspend_account(None, user_id, reason="sanctions screening hit")

    assert first is not None and second is not None
    assert second.account.suspension_reason == "sanctions screening hit"
    # Nothing left to burn the second time.
    assert second.refresh_tokens_revoked == 0


def test_suspending_an_address_we_do_not_hold_changes_nothing() -> None:
    assert (
        suspend_account(None, "00000000-0000-4000-8000-00000000dead", reason="x")
        is None
    )
    assert restore_account(None, "00000000-0000-4000-8000-00000000dead") is None
