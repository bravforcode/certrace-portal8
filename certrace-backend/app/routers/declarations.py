"""Portal declaration storage, per docs/API-CONTRACT.md §2.

Every route is authenticated and answers only for the caller's own rows —
scoping is done by handing the account id to the repository, never by
trusting anything in the payload. The document itself is opaque: the portal
owns the Declaration shape (certrace-portal/lib/data.ts), the backend stores
it whole and reads back only ``id`` plus the columns listing sorts by.

Without a database the rows live in ``app.state.portal_declarations`` keyed
by account id — the same no-database mode the account store uses, so tests
and a laptop demo run without Postgres.
"""

from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status

from app.routers.auth import current_account
from app.services.auth_service import Account

router = APIRouter(prefix="/api/v1/declarations", tags=["declarations"])

# Generous for a declaration full of suppliers and requests, small enough that
# the endpoint cannot be used as free blob storage.
MAX_DOC_BYTES = 512 * 1024

# A document of this kind is not a declaration: it is the slice of one
# workspace that its supplier's monthly link (/w/<token>) opens -- the
# installation, the goods, the precursor chain, earlier months to start from.
# Stored here so the monthly link is an ordinary smart link: same token,
# expiry, revoke, autosave, submit, evidence upload and revision loop as a
# declaration's (app/routers/links.py). Hidden from the declarations list.
WORKSPACE_KIND = "workspace"

_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={
        "code": "DECLARATION_NOT_FOUND",
        "message": "That declaration is not here.",
    },
)


def _validated(doc: object, declaration_id: str | None = None) -> dict[str, object]:
    """The whole-document checks the jsonb column cannot do."""

    if not isinstance(doc, dict):
        raise _invalid("A declaration must be a JSON object.")
    if declaration_id is not None:
        # PUT: the path names the row; a divergent body id would silently
        # write one declaration over another.
        doc = {**doc, "id": declaration_id}
    doc_id = doc.get("id")
    if not isinstance(doc_id, str) or not doc_id.strip() or len(doc_id) > 200:
        raise _invalid("A declaration needs a string id.")
    if len(json.dumps(doc, ensure_ascii=False)) > MAX_DOC_BYTES:
        raise _invalid("That declaration is too large to store.")
    return doc


def _invalid(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"code": "INVALID_DECLARATION", "message": message},
    )


def _memory_store(request: Request, account: Account) -> dict[str, dict[str, object]]:
    return request.app.state.portal_declarations.setdefault(account.id, {})


def _save(
    request: Request, account: Account, doc: dict[str, object]
) -> dict[str, object]:
    database = request.app.state.database
    if database is not None:
        return database.save_portal_declaration(uuid.UUID(account.id), doc)
    saved = {**doc, "updatedAt": int(time.time() * 1000)}
    _memory_store(request, account)[str(doc["id"])] = saved
    return saved


@router.get("")
def list_declarations(
    request: Request, account: Account = Depends(current_account)
) -> dict[str, object]:
    """Every declaration the account holds -- and only declarations.

    A workspace's supplier snapshot shares this table (``kind: "workspace"``,
    see ``WORKSPACE_KIND``) so its monthly links can reuse the smart-link
    machinery, but it is not a declaration and must not show up as one. It is
    still readable and writable by id.
    """

    database = request.app.state.database
    if database is not None:
        rows = database.list_portal_declarations(uuid.UUID(account.id))
    else:
        rows = list(_memory_store(request, account).values())
        rows.sort(key=lambda row: row.get("updatedAt", 0), reverse=True)
    return {"declarations": [row for row in rows if row.get("kind") != WORKSPACE_KIND]}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_declaration(
    request: Request,
    body: object = Body(...),
    account: Account = Depends(current_account),
) -> dict[str, object]:
    return _save(request, account, _validated(body))


@router.get("/{declaration_id}")
def get_declaration(
    declaration_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    database = request.app.state.database
    record = (
        database.get_portal_declaration(uuid.UUID(account.id), declaration_id)
        if database is not None
        else _memory_store(request, account).get(declaration_id)
    )
    if record is None:
        raise _NOT_FOUND
    return record


@router.put("/{declaration_id}")
def put_declaration(
    declaration_id: str,
    request: Request,
    body: object = Body(...),
    account: Account = Depends(current_account),
) -> dict[str, object]:
    # Overwrite-or-create: the id is client-minted, so a PUT that arrives
    # before its POST (an offline retry, a second tab) must not be an error.
    return _save(request, account, _validated(body, declaration_id))


@router.delete("/{declaration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_declaration(
    declaration_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> Response:
    # Idempotent: deleting what is already gone is success, and within one
    # account's scope there is nothing a 404 here would protect.
    database = request.app.state.database
    if database is not None:
        database.delete_portal_declaration(uuid.UUID(account.id), declaration_id)
    else:
        _memory_store(request, account).pop(declaration_id, None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
