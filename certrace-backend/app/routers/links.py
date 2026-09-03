"""Supplier smart links, per docs/API-CONTRACT.md §3.

The portal's old token was base64url("declId|supplierId") — anyone who knew
two ids could mint a link. Here the server is the only issuer: the token is
32 random bytes tied to its (declaration, supplier, month) by a stored row,
it expires, and a stored ``revoked_at`` kills it early.

Two endpoints, two audiences:

* ``POST /api/v1/declarations/{id}/links`` — the exporter, authenticated,
  minting a link for a declaration they own.
* ``GET /api/v1/links/{token}`` — the supplier, who has no account. The token
  itself is the credential, so the response carries exactly one supplier's
  slice of one declaration and nothing else — the holder is not our customer.

Without a database, links live in ``app.state.smart_links`` keyed by token,
in the same dict shape ``DatabaseRepository`` returns, so the handlers never
care which store answered.
"""

from __future__ import annotations

import datetime
import secrets
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import SMART_LINK_TTL_DAYS
from app.routers.auth import current_account
from app.services.auth_service import Account, get_account

router = APIRouter(prefix="/api/v1", tags=["links"])

_TOKEN_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={"code": "TOKEN_NOT_FOUND", "message": "That link does not exist."},
)

_DECLARATION_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail={
        "code": "DECLARATION_NOT_FOUND",
        "message": "That declaration is not here.",
    },
)


class CreateLinkRequest(BaseModel):
    supplier_id: str = Field(..., min_length=1, max_length=200, alias="supplierId")
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    expires_in_days: int = Field(
        default=SMART_LINK_TTL_DAYS, ge=1, le=365, alias="expiresInDays"
    )

    model_config = {"populate_by_name": True}


def _now_ms() -> int:
    return int(time.time() * 1000)


def _empty_state(token: str) -> dict[str, object]:
    """The shape ``emptyState()`` builds in certrace-portal/lib/supplier-store.ts.

    Returned when nobody has saved yet, so the client never handles null.
    """

    return {
        "token": token,
        "status": "new",
        "values": {},
        "docs": {},
        "seats": [],
        "profile": None,
        "profileSaved": False,
        "versions": [],
        "lastCheck": None,
        "events": [],
        "unlocked": [],
        "unlockedDocs": [],
        "revisionNote": "",
        "carried": None,
        "attestation": None,
        "updatedAt": _now_ms(),
    }


def _declaration_doc(
    request: Request, user_id: str, declaration_id: str
) -> dict[str, object] | None:
    database = request.app.state.database
    if database is not None:
        return database.get_portal_declaration(uuid.UUID(user_id), declaration_id)
    return request.app.state.portal_declarations.get(user_id, {}).get(declaration_id)


@router.post("/declarations/{declaration_id}/links", status_code=status.HTTP_201_CREATED)
def create_link(
    declaration_id: str,
    body: CreateLinkRequest,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    # Ownership check and existence check are the same lookup: asking for a
    # declaration that is not yours answers exactly like one that is not there.
    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        days=body.expires_in_days
    )

    database = request.app.state.database
    if database is not None:
        link = database.create_smart_link(
            uuid.UUID(account.id),
            declaration_id,
            body.supplier_id,
            token,
            body.month,
            expires_at,
        )
    else:
        link = {
            "token": token,
            "userId": account.id,
            "declId": declaration_id,
            "supplierId": body.supplier_id,
            "month": body.month,
            "expiresAt": int(expires_at.timestamp() * 1000),
            "revokedAt": None,
            "createdAt": _now_ms(),
            "state": None,
        }
        request.app.state.smart_links[token] = link

    return {
        "token": token,
        "url": f"{request.app.state.app_base_url}/s/{token}",
        "expiresAt": link["expiresAt"],
    }


@router.get("/declarations/{declaration_id}/links")
def list_links(
    declaration_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """Every link ever minted for one declaration, newest first.

    This is how the exporter gets a token back after the mint response is
    gone — to re-copy the url, or to see what is still live. The supplier's
    ``state`` blob stays out: this is a listing, not the answers.
    """

    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    database = request.app.state.database
    if database is not None:
        rows = database.list_smart_links(uuid.UUID(account.id), declaration_id)
    else:
        # Dict insertion order is mint order; reversed = newest first without
        # tying on same-millisecond createdAt stamps.
        rows = [
            row
            for row in reversed(request.app.state.smart_links.values())
            if row["userId"] == account.id and row["declId"] == declaration_id
        ]

    base = request.app.state.app_base_url
    return {
        "links": [
            {
                "token": row["token"],
                "url": f"{base}/s/{row['token']}",
                "supplierId": row["supplierId"],
                "month": row["month"],
                "expiresAt": row["expiresAt"],
                "revokedAt": row["revokedAt"],
                "createdAt": row["createdAt"],
            }
            for row in rows
        ]
    }


@router.get("/links/{token}")
def resolve_link(token: str, request: Request) -> dict[str, object]:
    """The one public endpoint: the token is the whole credential."""

    database = request.app.state.database
    link = (
        database.get_smart_link(token)
        if database is not None
        else request.app.state.smart_links.get(token)
    )
    if link is None:
        raise _TOKEN_NOT_FOUND
    if link["revokedAt"] is not None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "TOKEN_REVOKED", "message": "This link was revoked."},
        )
    if _now_ms() >= link["expiresAt"]:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "TOKEN_EXPIRED", "message": "This link has expired."},
        )

    doc = _declaration_doc(request, link["userId"], link["declId"])
    if doc is None:
        # The declaration was deleted after the link was minted. The SQL FK
        # cascades the row away; the in-memory store reaches this branch.
        raise _TOKEN_NOT_FOUND

    exporter = get_account(database, link["userId"])
    requests = doc.get("requests")
    spec = next(
        (
            entry
            for entry in (requests if isinstance(requests, list) else [])
            if isinstance(entry, dict) and entry.get("supplierId") == link["supplierId"]
        ),
        None,
    )

    # The declaration document is opaque at write time, so even the matched
    # spec's fields cannot be trusted to hold the contract's types.
    products = (spec or {}).get("products")

    # Only this supplier's slice leaves the server: their request spec, the
    # exporter's name, their own saved state. Never the declaration document.
    return {
        "token": token,
        "declId": link["declId"],
        "supplierId": link["supplierId"],
        "month": link["month"],
        "expiresAt": link["expiresAt"],
        "exporter": {
            "companyName": (exporter.company_name if exporter else None) or ""
        },
        "request": {"products": products if isinstance(products, list) else []},
        "state": link["state"] or _empty_state(token),
    }
