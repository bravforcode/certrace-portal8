"""Per-account declaration storage -- section 2 of docs/API-CONTRACT.md.

Built without a database, like the auth suite: the in-memory store on
``app.state.portal_declarations`` is under test, and the scoping rule it must
uphold is the same one the SQL path gets from its (user_id, id) primary key.
The account store is module state shared across the suite, so every test
signs up its own addresses.
"""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()


def _fresh_email() -> str:
    return f"declarant-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _signed_in(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={"email": _fresh_email(), "password": "a-good-password-1"},
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def _doc(declaration_id: str = "decl-11111111", **extra: object) -> dict[str, object]:
    return {
        "id": declaration_id,
        "name": "Q2 2026 CBAM report",
        "period": "Q2 2026",
        "step": "collect",
        "suppliers": [],
        **extra,
    }


def test_every_route_requires_a_token() -> None:
    client = _client()

    assert client.get("/api/v1/declarations").status_code == 401
    assert client.post("/api/v1/declarations", json=_doc()).status_code == 401
    assert client.get("/api/v1/declarations/decl-x").status_code == 401
    assert client.put("/api/v1/declarations/decl-x", json=_doc()).status_code == 401
    assert client.delete("/api/v1/declarations/decl-x").status_code == 401


def test_create_read_update_delete_roundtrip() -> None:
    client = _client()
    headers = _signed_in(client)

    created = client.post("/api/v1/declarations", json=_doc(), headers=headers)
    assert created.status_code == 201
    body = created.json()
    # The client-minted id survives, and the server stamps the sort key.
    assert body["id"] == "decl-11111111"
    assert isinstance(body["updatedAt"], int)

    listed = client.get("/api/v1/declarations", headers=headers).json()
    assert [d["id"] for d in listed["declarations"]] == ["decl-11111111"]

    fetched = client.get("/api/v1/declarations/decl-11111111", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Q2 2026 CBAM report"

    updated = client.put(
        "/api/v1/declarations/decl-11111111",
        json=_doc(name="Q2 2026 CBAM report (rev 2)"),
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Q2 2026 CBAM report (rev 2)"

    deleted = client.delete("/api/v1/declarations/decl-11111111", headers=headers)
    assert deleted.status_code == 204
    assert (
        client.get("/api/v1/declarations/decl-11111111", headers=headers).status_code
        == 404
    )


def test_missing_declaration_answers_the_contract_code() -> None:
    client = _client()
    headers = _signed_in(client)

    response = client.get("/api/v1/declarations/decl-none", headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "DECLARATION_NOT_FOUND"


def test_put_writes_the_path_id_not_the_body_id() -> None:
    client = _client()
    headers = _signed_in(client)

    response = client.put(
        "/api/v1/declarations/decl-path",
        json=_doc("decl-body"),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == "decl-path"
    assert (
        client.get("/api/v1/declarations/decl-body", headers=headers).status_code == 404
    )


def test_documents_without_a_usable_id_are_refused() -> None:
    client = _client()
    headers = _signed_in(client)

    for body in (["not", "an", "object"], {"name": "no id"}, {"id": "  "}):
        response = client.post("/api/v1/declarations", json=body, headers=headers)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "INVALID_DECLARATION"


def test_accounts_never_see_each_other() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)

    assert (
        client.post("/api/v1/declarations", json=_doc(), headers=owner).status_code
        == 201
    )

    # The stranger's world is empty, and the owner's id resolves to nothing.
    assert client.get("/api/v1/declarations", headers=stranger).json() == {
        "declarations": []
    }
    assert (
        client.get("/api/v1/declarations/decl-11111111", headers=stranger).status_code
        == 404
    )

    # A stranger's PUT lands in their own scope; a stranger's DELETE answers
    # 204 (idempotent within their empty scope) and removes nothing else.
    client.put(
        "/api/v1/declarations/decl-11111111",
        json=_doc(name="hijacked"),
        headers=stranger,
    )
    client.delete("/api/v1/declarations/decl-11111111", headers=stranger)

    kept = client.get("/api/v1/declarations/decl-11111111", headers=owner)
    assert kept.status_code == 200
    assert kept.json()["name"] == "Q2 2026 CBAM report"
