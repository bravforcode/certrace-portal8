"""Supplier smart links -- section 3 of docs/API-CONTRACT.md.

Built without a database, like the declarations suite: the in-memory store on
``app.state.smart_links`` is under test, and it keeps the exact dict shape the
SQL repository returns, so the handlers exercised here are the ones production
runs. Expiry and revocation are tested by editing that store directly -- there
is deliberately no endpoint that ages or revokes a link yet.
"""

from __future__ import annotations

import itertools
import time

from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()

_DAY_MS = 24 * 60 * 60 * 1000


def _fresh_email() -> str:
    return f"exporter-{next(_counter)}@certrace-tests.co"


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _signed_in(client: TestClient, company: str | None = "Siam Steel Export Co.") -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={
            "email": _fresh_email(),
            "password": "a-good-password-1",
            "companyName": company,
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def _declaration(
    client: TestClient, headers: dict[str, str], declaration_id: str = "decl-wire4"
) -> str:
    doc = {
        "id": declaration_id,
        "name": "Q2 2026 CBAM report",
        "period": "Q2 2026",
        "step": "collect",
        "suppliers": [],
        "requests": [
            {
                "supplierId": "d1",
                "products": [
                    {
                        "productId": "hrc",
                        "lots": [
                            {
                                "qty": 200,
                                "unit": "tonnes (t)",
                                "from": "2026-04-01",
                                "to": "2026-05-31",
                                "notes": "",
                            }
                        ],
                    }
                ],
            },
            {"supplierId": "d2", "products": [{"productId": "billet", "lots": []}]},
        ],
    }
    assert (
        client.post("/api/v1/declarations", json=doc, headers=headers).status_code
        == 201
    )
    return declaration_id


def _mint(
    client: TestClient,
    headers: dict[str, str],
    declaration_id: str,
    **body: object,
) -> dict[str, object]:
    response = client.post(
        f"/api/v1/declarations/{declaration_id}/links",
        json={"supplierId": "d1", **body},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_minting_requires_a_token() -> None:
    client = _client()

    response = client.post(
        "/api/v1/declarations/decl-x/links", json={"supplierId": "d1"}
    )

    assert response.status_code == 401


def test_minting_needs_your_own_declaration() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)
    declaration_id = _declaration(client, owner)

    for headers, target in ((owner, "decl-none"), (stranger, declaration_id)):
        response = client.post(
            f"/api/v1/declarations/{target}/links",
            json={"supplierId": "d1"},
            headers=headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "DECLARATION_NOT_FOUND"


def test_mint_and_resolve_roundtrip() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)

    minted = _mint(client, headers, declaration_id, month="2026-03")
    token = minted["token"]
    # 32 random bytes of base64url; nothing derivable from the ids.
    assert len(token) >= 40
    assert minted["url"] == f"https://app.certrace.co/s/{token}"
    # Default lifetime: 60 days, epoch milliseconds.
    now_ms = int(time.time() * 1000)
    assert abs(minted["expiresAt"] - (now_ms + 60 * _DAY_MS)) < 60_000

    # The supplier resolves with no Authorization header at all.
    resolved = client.get(f"/api/v1/links/{token}")
    assert resolved.status_code == 200
    body = resolved.json()
    assert body["token"] == token
    assert body["declId"] == declaration_id
    assert body["supplierId"] == "d1"
    assert body["month"] == "2026-03"
    assert body["expiresAt"] == minted["expiresAt"]
    assert body["exporter"] == {"companyName": "Siam Steel Export Co."}

    # Exactly this supplier's slice of the request -- d2's spec must not leak.
    assert [p["productId"] for p in body["request"]["products"]] == ["hrc"]
    assert "billet" not in resolved.text

    # Nobody has saved yet: the empty state, never null.
    assert body["state"]["token"] == token
    assert body["state"]["status"] == "new"
    assert body["state"]["values"] == {}
    assert body["state"]["versions"] == []


def test_expiry_is_the_exporters_to_choose_within_bounds() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)

    minted = _mint(client, headers, declaration_id, expiresInDays=5)
    now_ms = int(time.time() * 1000)
    assert abs(minted["expiresAt"] - (now_ms + 5 * _DAY_MS)) < 60_000

    for bad_days in (0, -1, 366):
        response = client.post(
            f"/api/v1/declarations/{declaration_id}/links",
            json={"supplierId": "d1", "expiresInDays": bad_days},
            headers=headers,
        )
        assert response.status_code == 422


def test_unknown_token_answers_the_contract_code() -> None:
    client = _client()

    response = client.get("/api/v1/links/never-issued")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "TOKEN_NOT_FOUND"


def test_expired_token_is_gone() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    token = _mint(client, headers, declaration_id)["token"]

    client.app.state.smart_links[token]["expiresAt"] = 1

    response = client.get(f"/api/v1/links/{token}")
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "TOKEN_EXPIRED"


def test_revoked_token_is_gone_and_says_so() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    token = _mint(client, headers, declaration_id)["token"]

    client.app.state.smart_links[token]["revokedAt"] = 1

    response = client.get(f"/api/v1/links/{token}")
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "TOKEN_REVOKED"


def test_deleting_the_declaration_kills_its_links() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    token = _mint(client, headers, declaration_id)["token"]

    assert (
        client.delete(
            f"/api/v1/declarations/{declaration_id}", headers=headers
        ).status_code
        == 204
    )

    assert client.get(f"/api/v1/links/{token}").status_code == 404


def test_every_mint_is_a_fresh_secret() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)

    first = _mint(client, headers, declaration_id)["token"]
    second = _mint(client, headers, declaration_id)["token"]

    assert first != second
    # Both stay valid: reissuing a link must not cut off the copy already sent.
    assert client.get(f"/api/v1/links/{first}").status_code == 200
    assert client.get(f"/api/v1/links/{second}").status_code == 200


def test_listing_links_requires_your_own_declaration() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)
    declaration_id = _declaration(client, owner)

    assert client.get(f"/api/v1/declarations/{declaration_id}/links").status_code == 401

    response = client.get(
        f"/api/v1/declarations/{declaration_id}/links", headers=stranger
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "DECLARATION_NOT_FOUND"


def test_listing_gives_the_tokens_back_without_the_state() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)

    first = _mint(client, headers, declaration_id)["token"]
    second = _mint(client, headers, declaration_id, supplierId="d2", month="2026-04")[
        "token"
    ]
    client.app.state.smart_links[first]["revokedAt"] = 1

    listed = client.get(
        f"/api/v1/declarations/{declaration_id}/links", headers=headers
    ).json()["links"]

    # Newest first, both present — revocation shows, it does not hide the row.
    assert [row["token"] for row in listed] == [second, first]
    assert listed[0]["supplierId"] == "d2"
    assert listed[0]["month"] == "2026-04"
    assert listed[0]["url"] == f"https://app.certrace.co/s/{second}"
    assert listed[0]["revokedAt"] is None
    assert listed[1]["revokedAt"] == 1
    for row in listed:
        assert "state" not in row


def test_listing_shows_only_that_declarations_links() -> None:
    client = _client()
    headers = _signed_in(client)
    first_declaration = _declaration(client, headers, "decl-a")
    second_declaration = _declaration(client, headers, "decl-b")
    token = _mint(client, headers, first_declaration)["token"]
    _mint(client, headers, second_declaration)

    listed = client.get(
        f"/api/v1/declarations/{first_declaration}/links", headers=headers
    ).json()["links"]

    assert [row["token"] for row in listed] == [token]


def test_malformed_stored_products_never_reach_the_supplier() -> None:
    # The declaration doc is opaque at write time, so a spec whose products is
    # not a list can be stored; the public endpoint must still answer the
    # contract shape rather than serve the mistake verbatim.
    client = _client()
    headers = _signed_in(client)
    doc = {
        "id": "decl-mangled",
        "requests": [{"supplierId": "d1", "products": "oops"}],
    }
    assert (
        client.post("/api/v1/declarations", json=doc, headers=headers).status_code
        == 201
    )
    token = _mint(client, headers, "decl-mangled")["token"]

    body = client.get(f"/api/v1/links/{token}").json()
    assert body["request"] == {"products": []}


def test_supplier_without_a_request_spec_gets_an_empty_ask() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)

    token = _mint(client, headers, declaration_id, supplierId="d9")["token"]

    body = client.get(f"/api/v1/links/{token}").json()
    assert body["request"] == {"products": []}
