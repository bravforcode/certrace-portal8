"""Evidence upload and retrieval (PROJECT_STATUS.md R5).

Two audiences, the same two rules the smart-link router already works to:

* the EXPORTER, authenticated, who may upload to and read from a declaration
  they own, and delete from it;
* the SUPPLIER, who has no account. A live token is the whole credential, so
  it buys exactly one thing: uploading against that link's declaration, and
  reading back the files uploaded through that same link. Never anyone
  else's, and never the exporter's own.

Bodies arrive raw rather than as multipart. A browser sends a ``File`` as the
body of a ``fetch`` with one header, so multipart would add a parser, a
dependency, and a second place for a filename to disagree with itself - for
nothing this needs.

Uploads are refused before they are stored, never repaired: a wrong content
type, a file that is not what it claims, a body past the limit. An evidence
store that quietly fixes what it was given is one a verifier cannot trust.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from app.routers.auth import current_account
from app.routers.links import live_link
from app.services.auth_service import Account
from app.services.file_store import (
    ALLOWED_CONTENT_TYPES,
    MAX_BYTES_PER_LINK,
    MAX_FILES_PER_LINK,
    FileRejected,
    max_upload_bytes,
    object_key,
    safe_filename,
    sha256,
    validate,
)

router = APIRouter(prefix="/api/v1", tags=["files"])

_FILE_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={"code": "FILE_NOT_FOUND", "message": "That file is not here."},
)

_DECLARATION_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={
        "code": "DECLARATION_NOT_FOUND",
        "message": "That declaration is not here.",
    },
)


def _rejected(error: FileRejected) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": error.code, "message": error.message},
    )


async def _read_body(request: Request) -> bytes:
    """The request body, refusing an oversized one as early as it can be seen.

    Content-Length is checked first so a 200 MB upload is turned away before a
    byte of it is read. It is a claim by the client, though, so the stream is
    also cut off at the limit - a chunked body carries no length at all, and
    reading it to the end to find out how big it is defeats the point of
    having a limit.
    """

    limit = max_upload_bytes()
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > limit:
        raise _rejected(
            FileRejected(
                "FILE_TOO_LARGE",
                f"That file is {int(declared):,} bytes and the limit is "
                f"{limit:,}. Split it, or send it another way and note the "
                "reference on the declaration.",
            )
        )

    chunks: list[bytes] = []
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > limit:
            raise _rejected(
                FileRejected(
                    "FILE_TOO_LARGE",
                    f"That upload passed the {limit:,} byte limit. Split it, or "
                    "send it another way and note the reference on the "
                    "declaration.",
                )
            )
        chunks.append(chunk)
    return b"".join(chunks)


def _store(request: Request):
    return request.app.state.file_store


def _file_metadata(row: dict[str, object]) -> dict[str, object]:
    """What a client is told about a file. Not the storage key: that is ours."""

    return {
        "id": row["id"],
        "declarationId": row["declId"],
        "docId": row["docId"],
        "filename": row["filename"],
        "contentType": row["contentType"],
        "sizeBytes": row["sizeBytes"],
        "sha256": row["sha256"],
        "uploadedAt": row["createdAt"],
        "uploadedBySupplier": row["uploadedViaToken"] is not None,
    }


def _declaration_exists(request: Request, user_id: str, declaration_id: str) -> bool:
    database = request.app.state.database
    if database is not None:
        return (
            database.get_portal_declaration(uuid.UUID(user_id), declaration_id)
            is not None
        )
    return declaration_id in request.app.state.portal_declarations.get(user_id, {})


def _record(
    request: Request,
    *,
    user_id: str,
    declaration_id: str,
    doc_id: str | None,
    token: str | None,
    filename: str,
    content_type: str,
    data: bytes,
) -> dict[str, object]:
    """Write one file to whichever store is configured, and return its row."""

    key = object_key(declaration_id, filename)
    digest = sha256(data)
    database = request.app.state.database
    if database is not None:
        row = database.create_uploaded_file(
            user_id=uuid.UUID(user_id),
            declaration_id=declaration_id,
            doc_id=doc_id,
            uploaded_via_token=token,
            filename=safe_filename(filename),
            content_type=content_type,
            size_bytes=len(data),
            sha256=digest,
            storage_key=key,
            data=data,
        )
        return row

    row = {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "declId": declaration_id,
        "docId": doc_id,
        "uploadedViaToken": token,
        "filename": safe_filename(filename),
        "contentType": content_type,
        "sizeBytes": len(data),
        "sha256": digest,
        "storageKey": key,
        "createdAt": None,
    }
    request.app.state.uploaded_files[row["id"]] = row
    _store(request).put(key, data, content_type)
    return row


def _lookup(request: Request, file_id: str) -> dict[str, object] | None:
    database = request.app.state.database
    if database is not None:
        try:
            return database.get_uploaded_file(uuid.UUID(file_id))
        except ValueError:
            # Not a UUID at all: the same not-there answer as a real miss, so
            # a malformed id cannot be told apart from an id that is not yours.
            return None
    return request.app.state.uploaded_files.get(file_id)


def _bytes_for(request: Request, row: dict[str, object]) -> bytes:
    data = _store(request).get(str(row["storageKey"]))
    if data is None:
        # Metadata without bytes: the row survived something the object did.
        # Better to say so than to hand back an empty file that looks valid.
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={
                "code": "FILE_CONTENT_MISSING",
                "message": "That file's contents are no longer stored. Ask for it to be uploaded again.",
            },
        )
    return bytes(data)


def _download(row: dict[str, object], data: bytes) -> Response:
    return Response(
        content=data,
        media_type=str(row["contentType"]),
        headers={
            # attachment, always: this is somebody else's document, and an
            # inline PDF or image renders in our origin.
            #
            # nosniff, no-store and the deny-everything CSP are not repeated
            # here - SecurityHeadersMiddleware puts them on every response, and
            # a second copy on this route would be the one that goes stale.
            "Content-Disposition": f'attachment; filename="{row["filename"]}"',
            "Content-Length": str(len(data)),
        },
    )


# ── Exporter ──────────────────────────────────────────────────────────────


@router.get("/uploads/limits")
def upload_limits() -> dict[str, object]:
    """What will be accepted, so the portal can say so before a file is picked.

    Public and unauthenticated: it is the same answer for everyone, and a
    supplier filling in a smart link has to be able to read it too.
    """

    return {
        "maxBytes": max_upload_bytes(),
        "allowedContentTypes": sorted(ALLOWED_CONTENT_TYPES),
        "allowedExtensions": sorted(set(ALLOWED_CONTENT_TYPES.values())),
    }


@router.post("/declarations/{declaration_id}/files", status_code=201)
async def upload_for_declaration(
    declaration_id: str,
    request: Request,
    filename: str = Query(..., min_length=1, max_length=255),
    doc_id: str | None = Query(default=None, max_length=200, alias="docId"),
    account: Account = Depends(current_account),
) -> dict[str, object]:
    if not _declaration_exists(request, account.id, declaration_id):
        raise _DECLARATION_NOT_FOUND
    data = await _read_body(request)
    try:
        content_type = validate(request.headers.get("content-type"), data)
    except FileRejected as error:
        raise _rejected(error) from error
    row = _record(
        request,
        user_id=account.id,
        declaration_id=declaration_id,
        doc_id=doc_id,
        token=None,
        filename=filename,
        content_type=content_type,
        data=data,
    )
    return _file_metadata(row)


@router.get("/declarations/{declaration_id}/files")
def list_for_declaration(
    declaration_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    if not _declaration_exists(request, account.id, declaration_id):
        raise _DECLARATION_NOT_FOUND
    database = request.app.state.database
    if database is not None:
        rows = database.list_uploaded_files(uuid.UUID(account.id), declaration_id)
    else:
        rows = [
            row
            for row in request.app.state.uploaded_files.values()
            if row["userId"] == account.id and row["declId"] == declaration_id
        ]
    return {"files": [_file_metadata(row) for row in rows]}


@router.get("/files/{file_id}")
def download(
    file_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> Response:
    row = _lookup(request, file_id)
    # Somebody else's file answers exactly as a missing one does. A 403 here
    # would confirm the id exists, which is the one bit worth not leaking.
    if row is None or row["userId"] != account.id:
        raise _FILE_NOT_FOUND
    return _download(row, _bytes_for(request, row))


@router.delete("/files/{file_id}", status_code=204)
def delete(
    file_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> Response:
    row = _lookup(request, file_id)
    if row is None or row["userId"] != account.id:
        raise _FILE_NOT_FOUND
    database = request.app.state.database
    if database is not None:
        database.delete_uploaded_file(uuid.UUID(file_id))
    else:
        request.app.state.uploaded_files.pop(file_id, None)
        _store(request).delete(str(row["storageKey"]))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Supplier, holding a live link and nothing else ────────────────────────


def _link_usage(request: Request, token: str) -> tuple[int, int]:
    database = request.app.state.database
    if database is not None:
        return database.link_upload_usage(token)
    mine = [
        row
        for row in request.app.state.uploaded_files.values()
        if row["uploadedViaToken"] == token
    ]
    return len(mine), sum(int(row["sizeBytes"]) for row in mine)


def _link_quota_reached(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": "LINK_FILE_QUOTA", "message": message},
    )


@router.post("/links/{token}/files", status_code=201)
async def upload_for_link(
    token: str,
    request: Request,
    filename: str = Query(..., min_length=1, max_length=255),
    doc_id: str | None = Query(default=None, max_length=200, alias="docId"),
) -> dict[str, object]:
    # Revoked, expired, unknown and declaration-deleted all answer identically
    # here, exactly as they do on every other supplier-facing route.
    link, _doc, _database = live_link(request, token)
    # Counted before the body is read, so a link at its limit costs nothing
    # more than this query; the byte total is checked once the size is known.
    files, used = _link_usage(request, token)
    if files >= MAX_FILES_PER_LINK:
        raise _link_quota_reached(
            f"This link already holds {MAX_FILES_PER_LINK} files, which is as "
            "many as one link can. Ask the exporter for help with the rest."
        )
    data = await _read_body(request)
    if used + len(data) > MAX_BYTES_PER_LINK:
        raise _link_quota_reached(
            "This link has no room left for that file. Ask the exporter for "
            "help with the rest."
        )
    try:
        content_type = validate(request.headers.get("content-type"), data)
    except FileRejected as error:
        raise _rejected(error) from error
    row = _record(
        request,
        user_id=str(link["userId"]),
        declaration_id=str(link["declId"]),
        doc_id=doc_id,
        token=token,
        filename=filename,
        content_type=content_type,
        data=data,
    )
    return _file_metadata(row)


@router.get("/links/{token}/files")
def list_for_link(token: str, request: Request) -> dict[str, object]:
    link, _doc, database = live_link(request, token)
    if database is not None:
        rows = database.list_uploaded_files(
            uuid.UUID(str(link["userId"])), str(link["declId"])
        )
    else:
        rows = list(request.app.state.uploaded_files.values())
    # Only what came in through this link. The declaration's other evidence -
    # the exporter's own, and every other supplier's - is not this holder's to
    # see, and the token is not an account.
    mine = [row for row in rows if row["uploadedViaToken"] == token]
    return {"files": [_file_metadata(row) for row in mine]}


@router.get("/links/{token}/files/{file_id}")
def download_for_link(token: str, file_id: str, request: Request) -> Response:
    live_link(request, token)
    row = _lookup(request, file_id)
    if row is None or row["uploadedViaToken"] != token:
        raise _FILE_NOT_FOUND
    return _download(row, _bytes_for(request, row))
