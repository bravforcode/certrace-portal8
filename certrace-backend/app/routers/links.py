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

_TOKEN_REVOKED = HTTPException(
    status_code=status.HTTP_410_GONE,
    detail={"code": "TOKEN_REVOKED", "message": "This link was revoked."},
)

_TOKEN_EXPIRED = HTTPException(
    status_code=status.HTTP_410_GONE,
    detail={"code": "TOKEN_EXPIRED", "message": "This link has expired."},
)


class CreateLinkRequest(BaseModel):
    supplier_id: str = Field(..., min_length=1, max_length=200, alias="supplierId")
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    expires_in_days: int = Field(
        default=SMART_LINK_TTL_DAYS, ge=1, le=365, alias="expiresInDays"
    )

    model_config = {"populate_by_name": True}


class SaveStateRequest(BaseModel):
    # The supplier's answer blob is opaque here, like the declaration document:
    # the portal owns its shape (certrace-portal/lib/supplier-store.ts), the
    # server stores it whole and last-write-wins. A dict is the only guarantee.
    state: dict[str, object]


class SubmitRequest(BaseModel):
    state: dict[str, object]
    # Who stood behind the numbers. The server reads signer name/role from here
    # into the version it stamps -- a browser-chosen signedBy is not evidence.
    attestation: dict[str, object]
    # The quality check the portal ran; null when it was skipped. Score and
    # warning count are copied into the version for the verifier to read.
    check: dict[str, object] | None = None


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


def _live_link(
    request: Request, token: str
) -> tuple[dict[str, object], dict[str, object], object]:
    """Resolve a token to its link and declaration, or raise the dead-link code.

    The one gate every supplier-facing route shares: the token is the whole
    credential, so not-found, revoked, expired and declaration-deleted must all
    answer identically no matter which route asked. Returns the link row, the
    declaration document it points at, and the database (or None).
    """

    database = request.app.state.database
    link = (
        database.get_smart_link(token)
        if database is not None
        else request.app.state.smart_links.get(token)
    )
    if link is None:
        raise _TOKEN_NOT_FOUND
    if link["revokedAt"] is not None:
        raise _TOKEN_REVOKED
    if _now_ms() >= link["expiresAt"]:
        raise _TOKEN_EXPIRED
    # The declaration was deleted after the link was minted. The SQL FK cascades
    # the link row away, so DB mode never reaches here; the in-memory store does.
    doc = _declaration_doc(request, link["userId"], link["declId"])
    if doc is None:
        raise _TOKEN_NOT_FOUND
    return link, doc, database


def _persist_state(
    request: Request, database: object, token: str, state: dict[str, object]
) -> dict[str, object]:
    """Write the whole state blob back onto the link, last write wins.

    Returns what was stored, which is what both save and submit hand back so the
    portal's local copy is exactly the server's.
    """

    if database is not None:
        updated = database.update_smart_link_state(token, state)
        if updated is None:
            # Lost the race to a declaration delete between check and write.
            raise _TOKEN_NOT_FOUND
        return updated["state"]
    request.app.state.smart_links[token]["state"] = state
    return state


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
    """The one public read endpoint: the token is the whole credential.

    The supplier has no account and no copy of the declaration, so the response
    carries everything their guided form is built from -- but only the parts
    that are theirs to see. That is a SLICE, deliberately:

      * declaration-level context the form needs (which regulation, the period,
        the deadline, the exporter's note) -- shared, not secret,
      * this one supplier's identity row (name, ref, country, criticality),
      * this one supplier's request spec (the products/lots asked of them),
      * their own saved state.

    Never another supplier's row, never anyone's emissions figure or price,
    never the whole declaration document. The portal rebuilds the questionnaire
    from this with its own bundled config (lib/supplier.ts::buildFromPayload).
    """

    link, doc, database = _live_link(request, token)

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

    # This supplier's own identity row -- pulled by id so no other supplier's
    # row can leak, and its emissions figure is dropped even from the match.
    suppliers = doc.get("suppliers")
    row = next(
        (
            entry
            for entry in (suppliers if isinstance(suppliers, list) else [])
            if isinstance(entry, dict) and entry.get("id") == link["supplierId"]
        ),
        None,
    ) or {}

    included = doc.get("includedFieldIds")
    due_in_days = doc.get("dueInDays")

    return {
        "token": token,
        "declId": link["declId"],
        "supplierId": link["supplierId"],
        "month": link["month"],
        "expiresAt": link["expiresAt"],
        "exporter": {
            "companyName": (exporter.company_name if exporter else None) or ""
        },
        # Shared context the form is built from -- coerced to the contract's
        # types because the source document is opaque and may not hold them.
        "declaration": {
            "name": doc.get("title") or doc.get("name") or "",
            "regulation": doc.get("regulation") or "cbam",
            "origin": doc.get("origin") or "",
            "market": doc.get("market") or "",
            "period": doc.get("period") or "",
            "periodEnd": doc.get("periodEnd") or "",
            "due": doc.get("due") or "",
            "dueInDays": due_in_days if isinstance(due_in_days, int) else 0,
            "kind": doc.get("kind") or "cbam",
            "includedFieldIds": included if isinstance(included, list) else None,
            "note": doc.get("notesToSuppliers") or "",
        },
        # Only this supplier's identity -- never their emissions figure.
        "supplier": {
            "name": row.get("name") or "",
            "ref": row.get("ref") or "",
            "country": row.get("country") or "",
            "material": row.get("material") or "",
            "critical": bool(row.get("critical")),
            "selfSupplied": bool(row.get("selfSupplied")),
        },
        "request": {"products": products if isinstance(products, list) else []},
        "state": link["state"] or _empty_state(token),
    }


@router.put("/links/{token}/state")
def save_link_state(
    token: str, body: SaveStateRequest, request: Request
) -> dict[str, object]:
    """Autosave while the supplier fills in. Whole blob, last write wins.

    Public like resolve: the holder has no account, so this must work with no
    session and must never depend on one. The blob is stored as given -- the
    server only overrides the two fields it, not the browser, is the source of:
    the token this state belongs to, and when it last moved.
    """

    _link, _doc, database = _live_link(request, token)

    state = dict(body.state)
    state["token"] = token  # the token is the path's, not the blob's to claim
    state["updatedAt"] = _now_ms()  # server clock, so the client cannot lie
    return _persist_state(request, database, token, state)


@router.post("/links/{token}/submit")
def submit_link(
    token: str, body: SubmitRequest, request: Request
) -> dict[str, object]:
    """The supplier signs and submits. Server owns the evidence fields.

    The blob arrives with the answers, but the version number, its timestamp,
    the signer read off the attestation, and the status transition are stamped
    here -- a verifier reads those, and a number the submitting browser chose is
    not evidence of anything. Everything else in the blob is stored as given.
    """

    _link, _doc, database = _live_link(request, token)

    state = dict(body.state)
    now = _now_ms()

    versions = state.get("versions")
    versions = list(versions) if isinstance(versions, list) else []
    last = versions[-1] if versions and isinstance(versions[-1], dict) else {}
    last_n = last.get("n", 0)
    check = body.check or {}
    version: dict[str, object] = {
        "n": (last_n if isinstance(last_n, int) else 0) + 1,
        "submittedAt": now,
        "score": check.get("score", 0),
        "warnings": check.get("warnings", 0),
        "signedBy": body.attestation.get("signatoryName", ""),
        "signedRole": body.attestation.get("signatoryRole", ""),
    }
    # A resubmit after a revision carries the exporter's note into the version,
    # mirroring the portal's own submit (components/supplier/context.tsx).
    if state.get("status") == "revision_requested" and state.get("revisionNote"):
        version["note"] = state["revisionNote"]

    events = state.get("events")
    events = list(events) if isinstance(events, list) else []
    events.append(
        {
            "id": uuid.uuid4().hex,
            "at": now,
            "kind": "submit",
            "text": (
                f"Version {version['n']} signed by {version['signedBy']} "
                f"({version['signedRole']}) and submitted -- score "
                f"{version['score']}, {version['warnings']} warning"
                f"{'' if version['warnings'] == 1 else 's'}"
            ),
        }
    )

    state["token"] = token
    state["status"] = "submitted"
    state["versions"] = versions + [version]
    state["attestation"] = body.attestation
    state["lastCheck"] = body.check
    state["events"] = events
    # A revision loop is now closed: nothing is unlocked and no note is pending.
    state["unlocked"] = []
    state["unlockedDocs"] = []
    state["revisionNote"] = ""
    state["updatedAt"] = now
    return _persist_state(request, database, token, state)
