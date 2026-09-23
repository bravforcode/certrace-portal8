"""A workspace's monthly link, carried by the smart-link machinery.

The monthly supplier form (/w/<token>) used to keep everything in the
supplier's own browser, so an answer typed on their machine never reached the
exporter. Now the exporter stores the workspace's supplier slice as a
``kind: "workspace"`` document and mints an ordinary smart link against it.
These tests walk that loop end to end without a database, the same way
test_smart_links.py does for declarations.
"""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.main import create_app

_counter = itertools.count()

WORKSPACE_DOC_ID = "ws-9f2a"

SUPPLIER_VIEW = {
    "workspace": {
        "id": "9f2a",
        "name": "Wire rod — Rayong",
        "year": 2026,
        "supplierName": "Xingda Steel Cord (Thailand)",
    },
    "installation": {"name": "Rayong plant", "country": "TH"},
    "precursors": [{"id": "p1", "name": "Pig iron"}],
    "months": {"2026-02": {"fuels": [{"type": "natural_gas", "quantity": 120}]}},
}


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _signed_in(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={
            "email": f"ws-exporter-{next(_counter)}@certrace-tests.co",
            "password": "a-good-password-1",
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def _store_workspace(client: TestClient, headers: dict[str, str]) -> None:
    response = client.put(
        f"/api/v1/declarations/{WORKSPACE_DOC_ID}",
        json={"kind": "workspace", "supplierView": SUPPLIER_VIEW},
        headers=headers,
    )
    assert response.status_code == 200


def _mint(client: TestClient, headers: dict[str, str], month: str = "2026-03") -> str:
    response = client.post(
        f"/api/v1/declarations/{WORKSPACE_DOC_ID}/links",
        json={"supplierId": "9f2a", "month": month},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["token"]


def test_a_workspace_snapshot_is_not_listed_as_a_declaration() -> None:
    client = _client()
    headers = _signed_in(client)
    _store_workspace(client, headers)

    listed = client.get("/api/v1/declarations", headers=headers).json()["declarations"]

    assert listed == []
    # Still there by id -- hidden from the list, not from its owner.
    assert (
        client.get(
            f"/api/v1/declarations/{WORKSPACE_DOC_ID}", headers=headers
        ).status_code
        == 200
    )


def test_the_supplier_opens_the_workspace_slice_with_no_account() -> None:
    client = _client()
    headers = _signed_in(client)
    _store_workspace(client, headers)
    token = _mint(client, headers)

    response = client.get(f"/api/v1/links/{token}")

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "workspace"
    assert body["month"] == "2026-03"
    assert body["exporter"]["companyName"] == "Siam Steel Export Co."
    assert body["workspace"] == SUPPLIER_VIEW
    assert body["state"]["status"] == "new"
    # Nothing of the declaration shape leaks into a workspace answer.
    assert "declaration" not in body and "request" not in body


def test_answers_typed_on_the_suppliers_machine_reach_the_exporter() -> None:
    """The failure this whole change exists for."""

    client = _client()
    headers = _signed_in(client)
    _store_workspace(client, headers)
    token = _mint(client, headers)

    month = {"fuels": [{"type": "natural_gas", "quantity": 131}], "tonnes": 812}
    saved = client.put(
        f"/api/v1/links/{token}/state",
        json={"state": {"status": "in_progress", "month": month}},
    )
    assert saved.status_code == 200

    submitted = client.post(
        f"/api/v1/links/{token}/submit",
        json={
            "state": {"status": "in_progress", "month": month},
            "attestation": {
                "signatoryName": "Somchai",
                "signatoryRole": "Plant manager",
            },
            "check": {"score": 96, "warnings": 1},
        },
    )
    assert submitted.status_code == 200

    seen = client.get(
        f"/api/v1/declarations/{WORKSPACE_DOC_ID}/submissions/{token}", headers=headers
    )
    assert seen.status_code == 200
    state = seen.json()["state"]
    assert state["status"] == "submitted"
    assert state["month"] == month
    assert state["versions"][-1]["signedBy"] == "Somchai"


def test_each_month_is_its_own_link() -> None:
    client = _client()
    headers = _signed_in(client)
    _store_workspace(client, headers)
    march = _mint(client, headers, "2026-03")
    april = _mint(client, headers, "2026-04")

    client.put(f"/api/v1/links/{march}/state", json={"state": {"note": "march"}})

    assert march != april
    assert client.get(f"/api/v1/links/{april}").json()["state"].get("note") is None


def test_a_revoked_monthly_link_stops_opening() -> None:
    client = _client()
    headers = _signed_in(client)
    _store_workspace(client, headers)
    token = _mint(client, headers)

    revoked = client.post(
        f"/api/v1/declarations/{WORKSPACE_DOC_ID}/links/{token}/revoke", headers=headers
    )
    assert revoked.status_code == 200

    assert client.get(f"/api/v1/links/{token}").status_code == 410
