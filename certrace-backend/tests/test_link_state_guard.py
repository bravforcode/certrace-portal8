"""What a supplier-link token may write, and what it may not.

The token travels by email and can be forwarded, so whoever holds it is
trusted with the answers, not with the record of them. Until this suite, a
save stored the whole blob as sent: a holder could rewrite the version
history, flip the status to "submitted" without signing, erase the trail, or
change answers the exporter had locked. These tests pin the guard in
app/routers/links.py (``_guarded_state``) and the per-link file quota in
app/routers/files.py.

No database, like the smart-link suite.
"""

from __future__ import annotations

import hashlib
import itertools
import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.routers import files as files_router

_counter = itertools.count()

PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"

SIGN = {"signatoryName": "Niran T.", "signatoryRole": "Plant Manager"}


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _signed_in(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={
            # Own prefix: accounts share one in-process store across files.
            "email": f"guard-{next(_counter)}@certrace-tests.co",
            "password": "a-good-password-1",
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def _declaration_link(client: TestClient) -> tuple[dict[str, str], str, str]:
    headers = _signed_in(client)
    decl_id = f"decl-guard-{next(_counter)}"
    assert (
        client.post(
            "/api/v1/declarations",
            json={"id": decl_id, "name": "Q2", "suppliers": [{"id": "d1"}]},
            headers=headers,
        ).status_code
        == 201
    )
    minted = client.post(
        f"/api/v1/declarations/{decl_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    )
    assert minted.status_code == 201
    return headers, decl_id, minted.json()["token"]


def _workspace_link(client: TestClient) -> tuple[dict[str, str], str, str]:
    headers = _signed_in(client)
    doc_id = f"ws-guard-{next(_counter)}"
    assert (
        client.put(
            f"/api/v1/declarations/{doc_id}",
            json={"kind": "workspace", "supplierView": {}},
            headers=headers,
        ).status_code
        == 200
    )
    minted = client.post(
        f"/api/v1/declarations/{doc_id}/links",
        json={"supplierId": "ws", "month": "2026-03"},
        headers=headers,
    )
    assert minted.status_code == 201
    return headers, doc_id, minted.json()["token"]


def _save(client, token, state):
    return client.put(f"/api/v1/links/{token}/state", json={"state": state})


def _submit(client, token, state):
    return client.post(
        f"/api/v1/links/{token}/submit",
        json={"state": state, "attestation": SIGN, "check": {"score": 90}},
    )


def _state(client, token) -> dict[str, object]:
    return client.get(f"/api/v1/links/{token}").json()["state"]


def _revise(client, headers, decl_id, token, **body):
    response = client.post(
        f"/api/v1/declarations/{decl_id}/links/{token}/revision",
        json={"note": "Re-check the coil tonnage.", **body},
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


# ── The record is the server's ────────────────────────────────────────────


def test_a_save_cannot_write_the_version_history_or_the_signature() -> None:
    client = _client()
    headers, decl_id, token = _declaration_link(client)
    _submit(client, token, {"values": {"hrc.qty": "200"}})
    _revise(client, headers, decl_id, token, unlocked=["hrc.qty"])

    saved = _save(
        client,
        token,
        {
            "values": {"hrc.qty": "210"},
            "versions": [{"n": 1, "signedBy": "Somebody Else", "score": 100}],
            "attestation": {"signatoryName": "Somebody Else"},
            "unlocked": [],
            "unlockedDocs": ["everything"],
            "revisionNote": "",
        },
    ).json()

    assert saved["versions"][0]["signedBy"] == "Niran T."
    assert saved["versions"][0]["score"] == 90
    assert saved["attestation"]["signatoryName"] == "Niran T."
    assert saved["unlocked"] == ["hrc.qty"]
    assert saved["unlockedDocs"] == []
    assert saved["revisionNote"] == "Re-check the coil tonnage."
    assert saved["values"] == {"hrc.qty": "210"}, "the unlocked answer did change"


@pytest.mark.parametrize("forged", ["submitted", "revision_requested", "approved"])
def test_a_save_cannot_jump_to_a_status_only_the_server_sets(forged) -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)

    assert _save(client, token, {"status": forged}).json()["status"] == "new"


@pytest.mark.parametrize("status", ["draft", "in_check"])
def test_the_browsers_own_statuses_still_move(status) -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)

    assert _save(client, token, {"status": status}).json()["status"] == status


def test_the_trail_is_append_only() -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)
    first = {"id": "e1", "at": 1, "kind": "doc_upload", "text": "cert attached"}
    _save(client, token, {"events": [first]})

    later = _save(
        client,
        token,
        {
            # e1 dropped, e1 rewritten, and a forged submit appended.
            "events": [
                {"id": "e1", "at": 1, "kind": "doc_upload", "text": "nothing here"},
                {"id": "e2", "at": 2, "kind": "submit", "text": "Version 3 signed"},
                {"id": "e3", "at": 3, "kind": "check_run", "text": "check run"},
            ]
        },
    ).json()

    assert later["events"] == [
        first,
        {"id": "e3", "at": 3, "kind": "check_run", "text": "check run"},
    ]


# ── A submitted declaration link is closed until the exporter reopens it ──


def test_a_submitted_link_takes_no_more_saves_or_submits() -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)
    assert _submit(client, token, {"values": {"hrc.qty": "200"}}).status_code == 200

    for response in (
        _save(client, token, {"values": {"hrc.qty": "999"}}),
        _submit(client, token, {"values": {"hrc.qty": "999"}}),
    ):
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "LINK_SUBMITTED"
    assert _state(client, token)["values"] == {"hrc.qty": "200"}
    assert len(_state(client, token)["versions"]) == 1


def test_a_revision_reopens_only_what_the_exporter_unlocked() -> None:
    client = _client()
    headers, decl_id, token = _declaration_link(client)
    _submit(
        client,
        token,
        {
            "values": {"hrc.qty": "200", "hrc.see": "1.84"},
            "docs": {
                "mill-cert": {"id": "mill-cert", "status": "uploaded"},
                "lab-report": {"id": "lab-report", "status": "uploaded"},
            },
        },
    )
    _revise(
        client,
        headers,
        decl_id,
        token,
        unlocked=["hrc.qty"],
        unlockedDocs=["mill-cert"],
    )

    tampered = {
        "values": {"hrc.qty": "210", "hrc.see": "0.10"},
        "docs": {
            "mill-cert": {"id": "mill-cert", "status": "uploaded", "v": 2},
            "lab-report": {"id": "lab-report", "status": "missing"},
            "new-doc": {"id": "new-doc", "status": "uploaded"},
        },
    }
    saved = _save(client, token, tampered).json()
    assert saved["values"] == {"hrc.qty": "210", "hrc.see": "1.84"}
    assert saved["docs"]["mill-cert"]["v"] == 2, "an unlocked doc can be replaced"
    assert saved["docs"]["lab-report"]["status"] == "uploaded", "a locked one cannot"
    assert "new-doc" in saved["docs"], "a doc never uploaded is still open"

    # The submit goes through the same lock, whatever the blob says.
    submitted = _submit(client, token, tampered).json()
    assert submitted["values"] == {"hrc.qty": "210", "hrc.see": "1.84"}
    assert submitted["docs"]["lab-report"]["status"] == "uploaded"
    assert submitted["versions"][-1]["n"] == 2
    assert submitted["versions"][-1]["note"] == "Re-check the coil tonnage."


def test_a_revision_that_unlocks_no_values_reopens_them_all() -> None:
    """The portal's rule (canEditField): an empty unlocked list is a full
    reopen, not a full lock."""

    client = _client()
    headers, decl_id, token = _declaration_link(client)
    _submit(client, token, {"values": {"a": "1", "b": "2"}})
    _revise(client, headers, decl_id, token, unlocked=[])

    saved = _save(client, token, {"values": {"a": "10", "b": "20"}}).json()
    assert saved["values"] == {"a": "10", "b": "20"}


# ── What was signed is pinned to the version ──────────────────────────────


def test_each_version_carries_the_hash_of_the_answers_it_signed() -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)
    state = _submit(client, token, {"values": {"hrc.qty": "200"}, "docs": {}}).json()

    content = {
        k: v
        for k, v in state.items()
        if k
        not in {
            "versions",
            "attestation",
            "unlocked",
            "unlockedDocs",
            "revisionNote",
            "token",
            "status",
            "events",
            "updatedAt",
            "lastCheck",
        }
    }
    expected = hashlib.sha256(
        json.dumps(
            content, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode()
    ).hexdigest()
    assert state["versions"][-1]["contentSha256"] == expected


def test_a_monthly_link_still_saves_after_submit_but_cannot_rewrite_the_record() -> (
    None
):
    """/w/ carries the supplier's "please reopen this month" inside its slice,
    after the month is submitted, so its saves stay open -- but the version it
    was submitted as, and the status, stay the server's."""

    client = _client()
    _headers, _doc, token = _workspace_link(client)
    _submit(client, token, {"slice": {"month": "March", "fuel": 131}})
    signed = _state(client, token)["versions"][0]

    after = _save(
        client,
        token,
        {
            "status": "draft",
            "slice": {"month": "March", "fuel": 131, "editRequest": "please reopen"},
            "versions": [],
        },
    )
    assert after.status_code == 200
    body = after.json()
    assert body["status"] == "submitted"
    assert body["versions"] == [signed]
    assert body["slice"]["editRequest"] == "please reopen"


# ── Size ──────────────────────────────────────────────────────────────────


def test_a_state_past_the_ceiling_is_refused() -> None:
    client = _client()
    _headers, _decl, token = _declaration_link(client)
    huge = {"values": {"note": "x" * (513 * 1024)}}

    for response in (_save(client, token, huge), _submit(client, token, huge)):
        assert response.status_code == 413
        assert response.json()["detail"]["code"] == "STATE_TOO_LARGE"


# ── Evidence through one link has a ceiling ──────────────────────────────


def _upload_via_link(client, token, data=PDF):
    return client.post(
        f"/api/v1/links/{token}/files",
        params={"filename": "cert.pdf"},
        content=data,
        headers={"Content-Type": "application/pdf"},
    )


def test_a_link_stops_taking_files_at_its_count(monkeypatch) -> None:
    monkeypatch.setattr(files_router, "MAX_FILES_PER_LINK", 2)
    client = _client()
    headers, decl_id, token = _declaration_link(client)

    assert _upload_via_link(client, token).status_code == 201
    assert _upload_via_link(client, token).status_code == 201
    third = _upload_via_link(client, token)
    assert third.status_code == 422
    assert third.json()["detail"]["code"] == "LINK_FILE_QUOTA"

    # The exporter's own uploads are not the link's, and are not counted.
    own = client.post(
        f"/api/v1/declarations/{decl_id}/files",
        params={"filename": "own.pdf"},
        content=PDF,
        headers={**headers, "Content-Type": "application/pdf"},
    )
    assert own.status_code == 201


def test_a_link_stops_taking_files_at_its_bytes(monkeypatch) -> None:
    monkeypatch.setattr(files_router, "MAX_BYTES_PER_LINK", len(PDF) * 2)
    client = _client()
    _headers, _decl, token = _declaration_link(client)

    assert _upload_via_link(client, token).status_code == 201
    assert _upload_via_link(client, token).status_code == 201
    over = _upload_via_link(client, token)
    assert over.status_code == 422
    assert over.json()["detail"]["code"] == "LINK_FILE_QUOTA"


def test_the_quota_is_per_link(monkeypatch) -> None:
    monkeypatch.setattr(files_router, "MAX_FILES_PER_LINK", 1)
    client = _client()
    _h1, _d1, first = _declaration_link(client)
    _h2, _d2, second = _declaration_link(client)

    assert _upload_via_link(client, first).status_code == 201
    assert _upload_via_link(client, second).status_code == 201
