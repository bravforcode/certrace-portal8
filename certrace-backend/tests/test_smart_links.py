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


def _signed_in(
    client: TestClient, company: str | None = "Siam Steel Export Co."
) -> dict[str, str]:
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
        "regulation": "cbam",
        "origin": "TH",
        "market": "EU",
        "period": "Q2 2026",
        "periodEnd": "2026-06-30",
        "due": "31 Aug 2026",
        "dueInDays": 45,
        "kind": "cbam",
        "includedFieldIds": ["carbon-price"],
        "notesToSuppliers": "Report at installation level.",
        "step": "collect",
        # d1's own emissions figure sits on the row and must NOT reach them --
        # the form is where they report it, not read a prior one back.
        "suppliers": [
            {
                "id": "d1",
                "name": "Siam Yamato Steel",
                "ref": "#0418",
                "country": "TH",
                "material": "Hot-rolled coil",
                "critical": True,
                "emissions": 1.84,
            },
            {
                "id": "d2",
                "name": "Thai Metal Pro",
                "ref": "#0231",
                "country": "TH",
                "material": "Steel billet",
                "critical": True,
                "emissions": 2.9,
            },
        ],
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

    # The declaration context the guided form is built from -- shared, not secret.
    assert body["declaration"]["regulation"] == "cbam"
    assert body["declaration"]["period"] == "Q2 2026"
    assert body["declaration"]["periodEnd"] == "2026-06-30"
    assert body["declaration"]["dueInDays"] == 45
    assert body["declaration"]["kind"] == "cbam"
    assert body["declaration"]["includedFieldIds"] == ["carbon-price"]
    assert body["declaration"]["note"] == "Report at installation level."

    # Only d1's own identity -- d2's row, and EVERYONE's emissions figure, stay
    # server-side. The token holder is not our customer; they see only theirs.
    assert body["supplier"]["name"] == "Siam Yamato Steel"
    assert body["supplier"]["ref"] == "#0418"
    assert body["supplier"]["critical"] is True
    assert "emissions" not in body["supplier"]
    assert "Thai Metal Pro" not in resolved.text
    assert "1.84" not in resolved.text

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


# ── Save / submit (docs/API-CONTRACT.md §4) ───────────────────────
# The supplier has no account: these routes carry no Authorization header, and
# the server owns the fields a verifier trusts.


def _new_token(client: TestClient) -> str:
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    return _mint(client, headers, declaration_id)["token"]


def test_save_persists_and_resolve_reads_it_back() -> None:
    client = _client()
    token = _new_token(client)

    saved = client.put(
        f"/api/v1/links/{token}/state",
        json={"state": {"status": "draft", "values": {"hrc.qty": "200"}}},
    )
    assert saved.status_code == 200, saved.text
    body = saved.json()
    # The blob comes back with the server's own token and timestamp stamped on.
    assert body["status"] == "draft"
    assert body["values"] == {"hrc.qty": "200"}
    assert body["token"] == token
    assert isinstance(body["updatedAt"], int)

    # The autosave survives: resolving the link now returns the saved state,
    # not the empty one.
    resolved = client.get(f"/api/v1/links/{token}").json()
    assert resolved["state"]["status"] == "draft"
    assert resolved["state"]["values"] == {"hrc.qty": "200"}


def test_save_ignores_a_blob_that_lies_about_its_token() -> None:
    client = _client()
    token = _new_token(client)

    body = client.put(
        f"/api/v1/links/{token}/state",
        json={"state": {"token": "some-other-link", "status": "draft"}},
    ).json()

    # The path owns the token; a blob cannot claim to belong to another link.
    assert body["token"] == token


def test_save_takes_no_bearer_token() -> None:
    client = _client()
    token = _new_token(client)
    # A stranger's session in this browser must never reach a public route.
    intruder = _signed_in(client)

    saved = client.put(
        f"/api/v1/links/{token}/state",
        json={"state": {"status": "draft"}},
        headers=intruder,
    )
    assert saved.status_code == 200


def test_submit_stamps_the_evidence_fields_the_server_owns() -> None:
    client = _client()
    token = _new_token(client)

    submitted = client.post(
        f"/api/v1/links/{token}/submit",
        json={
            # The browser's own status/versions are not trusted -- the server
            # sets them. Send a wrong version number to prove it is ignored.
            "state": {"status": "draft", "versions": [{"n": 7}], "values": {}},
            "attestation": {
                "signatoryName": "Niran T.",
                "signatoryRole": "Plant Manager",
                "signedAt": "2026-05-01",
                "statement": "I attest…",
            },
            "check": {"score": 88, "warnings": 2, "critical": 0, "passable": True},
        },
    )
    assert submitted.status_code == 200, submitted.text
    state = submitted.json()

    assert state["status"] == "submitted"
    # Version number follows the last one (7), not restarts; server-stamped.
    version = state["versions"][-1]
    assert version["n"] == 8
    assert version["score"] == 88
    assert version["warnings"] == 2
    assert version["signedBy"] == "Niran T."
    assert version["signedRole"] == "Plant Manager"
    assert isinstance(version["submittedAt"], int)
    # The attestation is kept verbatim, and a submit event is on the trail.
    assert state["attestation"]["signatoryName"] == "Niran T."
    assert any(event["kind"] == "submit" for event in state["events"])

    # The exporter side sees it: resolve now reports submitted.
    resolved = client.get(f"/api/v1/links/{token}").json()
    assert resolved["state"]["status"] == "submitted"


def test_submit_survives_a_missing_check() -> None:
    client = _client()
    token = _new_token(client)

    state = client.post(
        f"/api/v1/links/{token}/submit",
        json={
            "state": {"status": "draft"},
            "attestation": {"signatoryName": "A", "signatoryRole": "B"},
            "check": None,
        },
    ).json()

    version = state["versions"][-1]
    assert version["score"] == 0
    assert version["warnings"] == 0


def test_submissions_shows_the_exporter_who_answered() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    # Two links: d1 submits, d2 is minted but never opened.
    d1_token = _mint(client, headers, declaration_id)["token"]
    _mint(client, headers, declaration_id, supplierId="d2")

    endpoint = f"/api/v1/declarations/{declaration_id}/submissions"
    # Before anyone submits: both links show, both "new", no answers leaked.
    fresh = client.get(endpoint, headers=headers).json()["submissions"]
    assert {row["supplierId"] for row in fresh} == {"d1", "d2"}
    assert all(row["status"] == "new" and row["version"] == 0 for row in fresh)
    assert all("state" not in row and "values" not in row for row in fresh)

    client.post(
        f"/api/v1/links/{d1_token}/submit",
        json={
            "state": {"status": "draft"},
            "attestation": {"signatoryName": "Niran T.", "signatoryRole": "Plant Mgr"},
            "check": {"score": 92, "warnings": 0},
        },
    )

    # The dashboard's next poll sees d1 flip to submitted with its score; d2 has
    # not moved.
    rows = {r["supplierId"]: r for r in client.get(endpoint, headers=headers).json()["submissions"]}
    assert rows["d1"]["status"] == "submitted"
    assert rows["d1"]["token"] == d1_token
    assert rows["d1"]["version"] == 1
    assert rows["d1"]["score"] == 92
    assert isinstance(rows["d1"]["updatedAt"], int)
    assert rows["d2"]["status"] == "new"


def test_exporter_reads_one_submissions_full_answers() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    token = _mint(client, headers, declaration_id)["token"]

    client.post(
        f"/api/v1/links/{token}/submit",
        json={
            "state": {"status": "draft", "values": {"hrc.qty": "200"}},
            "attestation": {"signatoryName": "Niran T.", "signatoryRole": "Plant Mgr"},
            "check": {"score": 92, "warnings": 0},
        },
    )

    # The exporter opens the submission: the full answer blob, not just status.
    endpoint = f"/api/v1/declarations/{declaration_id}/submissions/{token}"
    body = client.get(endpoint, headers=headers).json()
    assert body["supplierId"] == "d1"
    assert body["state"]["status"] == "submitted"
    assert body["state"]["values"] == {"hrc.qty": "200"}
    assert body["state"]["versions"][-1]["score"] == 92

    # Never opened yet: an empty state, never null, so the pane never handles null.
    other = _mint(client, headers, declaration_id, supplierId="d2")["token"]
    empty = client.get(
        f"/api/v1/declarations/{declaration_id}/submissions/{other}", headers=headers
    ).json()
    assert empty["state"]["status"] == "new"

    # Still reviewable after the link is revoked — closing a link does not erase
    # what was already submitted through it.
    client.app.state.smart_links[token]["revokedAt"] = 1
    assert client.get(endpoint, headers=headers).status_code == 200


def test_reading_a_submission_is_owner_scoped() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)
    declaration_id = _declaration(client, owner)
    token = _mint(client, owner, declaration_id)["token"]

    endpoint = f"/api/v1/declarations/{declaration_id}/submissions/{token}"
    assert client.get(endpoint).status_code == 401
    # A stranger, and the right token asked under the wrong declaration, both 404.
    assert client.get(endpoint, headers=stranger).status_code == 404
    assert (
        client.get(
            f"/api/v1/declarations/decl-other/submissions/{token}", headers=owner
        ).status_code
        == 404
    )


def test_submissions_is_owner_scoped() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)
    declaration_id = _declaration(client, owner)

    endpoint = f"/api/v1/declarations/{declaration_id}/submissions"
    assert client.get(endpoint).status_code == 401

    response = client.get(endpoint, headers=stranger)
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "DECLARATION_NOT_FOUND"


def test_revision_reopens_the_loop_the_supplier_reads() -> None:
    client = _client()
    headers = _signed_in(client)
    declaration_id = _declaration(client, headers)
    token = _mint(client, headers, declaration_id)["token"]

    # Supplier submits first, so there is something to send back.
    client.post(
        f"/api/v1/links/{token}/submit",
        json={
            "state": {"status": "draft", "values": {"hrc.qty": "200"}},
            "attestation": {"signatoryName": "Niran T.", "signatoryRole": "Plant Mgr"},
            "check": {"score": 60, "warnings": 3},
        },
    )

    revised = client.post(
        f"/api/v1/declarations/{declaration_id}/links/{token}/revision",
        json={"note": "Re-check the coil tonnage.", "unlocked": ["hrc.qty"], "unlockedDocs": ["mill-cert"]},
        headers=headers,
    )
    assert revised.status_code == 200, revised.text
    state = revised.json()

    # Status flips back, the three fields are recorded, submitted answers survive.
    assert state["status"] == "revision_requested"
    assert state["unlocked"] == ["hrc.qty"]
    assert state["unlockedDocs"] == ["mill-cert"]
    assert state["revisionNote"] == "Re-check the coil tonnage."
    assert state["values"] == {"hrc.qty": "200"}
    assert any(event["kind"] == "revision_requested" for event in state["events"])

    # The supplier's own /s/<token> read now shows the reopened loop.
    resolved = client.get(f"/api/v1/links/{token}").json()
    assert resolved["state"]["status"] == "revision_requested"
    assert resolved["state"]["revisionNote"] == "Re-check the coil tonnage."

    # A resubmit carries the note into the new version and closes the loop again.
    resubmitted = client.post(
        f"/api/v1/links/{token}/submit",
        json={
            "state": resolved["state"],
            "attestation": {"signatoryName": "Niran T.", "signatoryRole": "Plant Mgr"},
            "check": {"score": 95, "warnings": 0},
        },
    ).json()
    assert resubmitted["status"] == "submitted"
    assert resubmitted["unlocked"] == []
    assert resubmitted["revisionNote"] == ""
    assert resubmitted["versions"][-1]["note"] == "Re-check the coil tonnage."


def test_revision_is_owner_scoped() -> None:
    client = _client()
    owner = _signed_in(client)
    stranger = _signed_in(client)
    declaration_id = _declaration(client, owner)
    token = _mint(client, owner, declaration_id)["token"]

    endpoint = f"/api/v1/declarations/{declaration_id}/links/{token}/revision"
    body = {"note": "fix", "unlocked": [], "unlockedDocs": []}
    # No session, a stranger, and the right token under the wrong declaration.
    assert client.post(endpoint, json=body).status_code == 401
    assert client.post(endpoint, json=body, headers=stranger).status_code == 404
    assert (
        client.post(
            f"/api/v1/declarations/decl-other/links/{token}/revision",
            json=body,
            headers=owner,
        ).status_code
        == 404
    )


def test_dead_links_reject_save_and_submit() -> None:
    client = _client()
    good = _new_token(client)
    submit_body = {
        "state": {},
        "attestation": {"signatoryName": "A", "signatoryRole": "B"},
        "check": None,
    }

    # Unknown token: 404 on both.
    assert client.put("/api/v1/links/nope/state", json={"state": {}}).status_code == 404
    assert client.post("/api/v1/links/nope/submit", json=submit_body).status_code == 404

    # Expired: 410 TOKEN_EXPIRED.
    client.app.state.smart_links[good]["expiresAt"] = 1
    expired = client.put(f"/api/v1/links/{good}/state", json={"state": {}})
    assert expired.status_code == 410
    assert expired.json()["detail"]["code"] == "TOKEN_EXPIRED"

    # Revoked: 410 TOKEN_REVOKED (reset expiry so revocation is what bites).
    client.app.state.smart_links[good]["expiresAt"] = int(time.time() * 1000) + _DAY_MS
    client.app.state.smart_links[good]["revokedAt"] = 1
    revoked = client.post(f"/api/v1/links/{good}/submit", json=submit_body)
    assert revoked.status_code == 410
    assert revoked.json()["detail"]["code"] == "TOKEN_REVOKED"
