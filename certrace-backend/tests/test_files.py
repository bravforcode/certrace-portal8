"""Evidence upload and retrieval -- PROJECT_STATUS.md R5.

Built without a database, like the smart-link suite: the in-memory stores on
``app.state.uploaded_files`` and ``app.state.file_store`` keep the same dict
shape the SQL repository returns, so the handlers exercised here are the ones
production runs.

The interesting assertions are not "a file round-trips". They are the four
ways an evidence store stops being evidence:

  * it accepts something it cannot show a verifier, or something that is not
    what it says it is;
  * it accepts something big enough to take the service down with it;
  * it lets a smart-link holder read a document that is not theirs;
  * it hands a browser a document that renders in our own origin.
"""

from __future__ import annotations

import itertools

from fastapi.testclient import TestClient

from app.main import create_app
from app.services.file_store import safe_filename, validate, FileRejected

import pytest

_counter = itertools.count()

PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def _client() -> TestClient:
    return TestClient(create_app(), raise_server_exceptions=False)


def _signed_in(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/register",
        json={
            # Its own prefix, not the "exporter-N" the smart-link suite uses.
            # Accounts live in one in-process store for the whole session when
            # there is no database, so two files counting from zero hand each
            # other a 409 on whichever runs second - and the failure surfaces
            # in the other file, which is a bad afternoon.
            "email": f"evidence-{next(_counter)}@certrace-tests.co",
            "password": "a-good-password-1",
            "companyName": "Siam Steel Export Co.",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def _declaration(client: TestClient, headers: dict[str, str], decl_id="decl-ev") -> str:
    doc = {
        "id": decl_id,
        "name": "Q2 2026 CBAM report",
        "regulation": "cbam",
        "origin": "TH",
        "market": "EU",
        "period": "Q2 2026",
        "periodEnd": "2026-06-30",
        "due": "31 Aug 2026",
        "dueInDays": 45,
        "kind": "cbam",
        "step": "collect",
        "suppliers": [{"id": "d1", "name": "Siam Yamato Steel"}],
        "requests": [],
    }
    assert (
        client.post("/api/v1/declarations", json=doc, headers=headers).status_code
        == 201
    )
    return decl_id


def _link(client: TestClient, headers: dict[str, str], decl_id: str) -> str:
    response = client.post(
        f"/api/v1/declarations/{decl_id}/links",
        json={"supplierId": "d1"},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["token"]


def _upload(
    client, decl_id, headers, data=PDF, content_type="application/pdf", **query
):
    params = {"filename": "mill-cert.pdf", **query}
    return client.post(
        f"/api/v1/declarations/{decl_id}/files",
        params=params,
        content=data,
        headers={**headers, "Content-Type": content_type},
    )


# ── It actually holds the bytes ───────────────────────────────────────────


def test_a_certificate_survives_the_round_trip(client=None) -> None:
    """The whole point of R5. Before this, a file over ~1.5 MB reached the
    exporter as a filename and a size."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    big = b"%PDF-1.7\n" + b"E" * (3 * 1024 * 1024)
    created = _upload(client, decl, headers, data=big)
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["sizeBytes"] == len(big)
    assert body["uploadedBySupplier"] is False

    fetched = client.get(f"/api/v1/files/{body['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.content == big, "the bytes that came back are not the bytes sent"


def test_the_hash_is_computed_from_the_bytes_that_arrived(client=None) -> None:
    """The portal used to hash in the browser, which proved only what the
    browser chose to say. A document swapped after sign-off has to change
    this, so it is computed where the bytes land."""

    import hashlib

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    body = _upload(client, decl, headers).json()
    assert body["sha256"] == hashlib.sha256(PDF).hexdigest()


def test_the_declaration_lists_what_was_uploaded_to_it(client=None) -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    _upload(client, decl, headers, filename="a.pdf")
    _upload(client, decl, headers, data=PNG, content_type="image/png", filename="b.png")

    listing = client.get(f"/api/v1/declarations/{decl}/files", headers=headers)
    assert listing.status_code == 200
    names = sorted(f["filename"] for f in listing.json()["files"])
    assert names == ["a.pdf", "b.png"]
    # The storage key is ours, not the client's: it is the address of the
    # object, and a client that learns it will eventually try to use it.
    assert all("storageKey" not in f for f in listing.json()["files"])


# ── What it refuses ───────────────────────────────────────────────────────


def test_a_type_we_cannot_show_a_verifier_is_refused() -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    response = _upload(
        client,
        decl,
        headers,
        data=b"#!/bin/sh\nrm -rf /\n",
        content_type="application/x-sh",
        filename="run.sh",
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "FILE_TYPE_NOT_ALLOWED"


def test_a_file_that_is_not_what_it_claims_is_refused() -> None:
    """An allowed content type is a claim by the uploader. A ZIP announced as
    a PDF would be stored, listed as a certificate, and handed back to a
    verifier's PDF reader as something it cannot open."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    response = _upload(client, decl, headers, data=b"PK\x03\x04not-a-pdf")
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "FILE_CONTENT_MISMATCH"


def test_a_body_past_the_limit_is_refused_by_size_not_by_content() -> None:
    """Order matters: something oversized should be turned away for being
    oversized, whatever is in it."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    oversized = b"x" * (16 * 1024 * 1024)
    response = _upload(client, decl, headers, data=oversized)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"


def test_an_empty_upload_says_so_rather_than_storing_nothing() -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)

    response = _upload(client, decl, headers, data=b"")
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "FILE_EMPTY"


def test_the_limits_are_published_before_a_file_is_picked() -> None:
    """So the portal can refuse a 40 MB scan in the file picker rather than
    after the upload. Unauthenticated, because a supplier filling in a smart
    link has no account and needs the same answer."""

    body = _client().get("/api/v1/uploads/limits").json()
    assert body["maxBytes"] == 15 * 1024 * 1024
    assert "application/pdf" in body["allowedContentTypes"]


# ── Who may read what ─────────────────────────────────────────────────────


def test_another_account_cannot_read_a_file_and_cannot_tell_it_exists() -> None:
    client = _client()
    owner = _signed_in(client)
    decl = _declaration(client, owner)
    file_id = _upload(client, decl, owner).json()["id"]

    stranger = _signed_in(client)
    response = client.get(f"/api/v1/files/{file_id}", headers=stranger)
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "FILE_NOT_FOUND", (
        "a 403 would confirm the id exists, which is the one bit worth not leaking"
    )


def test_a_supplier_uploads_through_a_live_link_and_reads_it_back() -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    token = _link(client, headers, decl)

    created = client.post(
        f"/api/v1/links/{token}/files",
        params={"filename": "supplier-cert.pdf", "docId": "iso-14064"},
        content=PDF,
        headers={"Content-Type": "application/pdf"},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["uploadedBySupplier"] is True
    assert body["docId"] == "iso-14064"

    back = client.get(f"/api/v1/links/{token}/files/{body['id']}")
    assert back.status_code == 200
    assert back.content == PDF

    # And the exporter sees it on the declaration, which is the point.
    listing = client.get(f"/api/v1/declarations/{decl}/files", headers=headers)
    assert [f["filename"] for f in listing.json()["files"]] == ["supplier-cert.pdf"]


def test_a_link_holder_cannot_read_the_exporters_own_evidence() -> None:
    """The token is not an account. It buys this supplier's own uploads on one
    declaration and nothing else on it."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    token = _link(client, headers, decl)
    exporter_file = _upload(client, decl, headers).json()["id"]

    response = client.get(f"/api/v1/links/{token}/files/{exporter_file}")
    assert response.status_code == 404

    listing = client.get(f"/api/v1/links/{token}/files")
    assert listing.json()["files"] == []


def test_a_revoked_link_can_no_longer_upload() -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    token = _link(client, headers, decl)

    client.app.state.smart_links[token]["revokedAt"] = 1

    response = client.post(
        f"/api/v1/links/{token}/files",
        params={"filename": "late.pdf"},
        content=PDF,
        headers={"Content-Type": "application/pdf"},
    )
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "TOKEN_REVOKED"


def test_revoking_a_link_does_not_take_the_evidence_with_it() -> None:
    """The supplier already did the work. A closed link is a closed door, not
    a reason to lose the certificate behind it -- which is why the FK is
    SET NULL rather than CASCADE."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    token = _link(client, headers, decl)
    client.post(
        f"/api/v1/links/{token}/files",
        params={"filename": "supplier-cert.pdf"},
        content=PDF,
        headers={"Content-Type": "application/pdf"},
    )

    client.app.state.smart_links[token]["revokedAt"] = 1

    listing = client.get(f"/api/v1/declarations/{decl}/files", headers=headers)
    assert [f["filename"] for f in listing.json()["files"]] == ["supplier-cert.pdf"]


# ── How it hands a file back ──────────────────────────────────────────────


def test_a_download_cannot_render_in_our_own_origin() -> None:
    """Evidence is somebody else's document. Served inline, an HTML-ish PDF or
    an SVG runs script on the API's origin against the caller's session."""

    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    file_id = _upload(client, decl, headers).json()["id"]

    response = client.get(f"/api/v1/files/{file_id}", headers=headers)
    assert response.headers["content-disposition"].startswith("attachment;")
    assert response.headers["x-content-type-options"] == "nosniff"
    # From SecurityHeadersMiddleware, which covers every response. Asserted
    # here because this is the route where it matters most.
    assert response.headers["cache-control"] == "no-store"


def test_a_deleted_file_is_gone_from_both_the_listing_and_the_store() -> None:
    client = _client()
    headers = _signed_in(client)
    decl = _declaration(client, headers)
    body = _upload(client, decl, headers).json()

    assert (
        client.delete(f"/api/v1/files/{body['id']}", headers=headers).status_code == 204
    )
    assert client.get(f"/api/v1/files/{body['id']}", headers=headers).status_code == 404
    assert (
        client.get(f"/api/v1/declarations/{decl}/files", headers=headers).json()[
            "files"
        ]
        == []
    )
    assert client.app.state.file_store.get(body.get("storageKey", "")) is None


def test_uploading_to_someone_elses_declaration_is_not_found() -> None:
    client = _client()
    owner = _signed_in(client)
    decl = _declaration(client, owner)

    stranger = _signed_in(client)
    response = _upload(client, decl, stranger)
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "DECLARATION_NOT_FOUND"


# ── Filenames ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        # A name carrying separators IS a path, so the last component is the
        # filename - the reading every operating system takes.
        ("../../etc/passwd", "passwd"),
        ("C:\\Windows\\system32\\cmd.exe", "cmd.exe"),
        # Pathological, and it degrades to something safe rather than to
        # something clever.
        ('report";rm -rf /.pdf', "pdf"),
        ("", "upload"),
        ("....", "upload"),
    ],
)
def test_a_filename_cannot_traverse_or_inject(given: str, expected: str) -> None:
    """Stored names reach a Content-Disposition header and, one day, a bucket
    path. Neither is a place to discover that a name was a path."""

    assert safe_filename(given) == expected


def test_a_very_long_filename_keeps_its_extension() -> None:
    """Truncation that drops the extension turns a PDF into a file nothing
    will open."""

    trimmed = safe_filename("a" * 400 + ".pdf")
    assert len(trimmed) <= 120
    assert trimmed.endswith(".pdf")


def test_validate_returns_the_bare_media_type() -> None:
    """A browser sends `text/csv; charset=utf-8`. The charset is not part of
    what is allowed, and storing it would make the stored type not match the
    allow-list it was checked against."""

    assert validate("text/csv; charset=utf-8", b"a,b\n1,2\n") == "text/csv"


def test_a_binary_file_labelled_as_csv_is_refused() -> None:
    with pytest.raises(FileRejected) as raised:
        validate("text/csv", b"\x00\x01\x02binary")
    assert raised.value.code == "FILE_CONTENT_MISMATCH"
