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
import hashlib
import json
import secrets
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import SMART_LINK_TTL_DAYS
from app.routers.auth import current_account
from app.routers.declarations import WORKSPACE_KIND
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
    # YYYY-MM, and a real month -- 2026-13 / 2026-00 are not links worth minting.
    month: str | None = Field(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    expires_in_days: int = Field(
        default=SMART_LINK_TTL_DAYS, ge=1, le=365, alias="expiresInDays"
    )

    model_config = {"populate_by_name": True}


class SaveStateRequest(BaseModel):
    # The supplier's answer blob is opaque here, like the declaration document:
    # the portal owns its shape (certrace-portal/lib/supplier-store.ts), the
    # server stores it last-write-wins. A dict is the only guarantee -- except
    # for the fields in _SERVER_OWNED, which the server keeps (_guarded_state).
    state: dict[str, object]


class SubmitRequest(BaseModel):
    state: dict[str, object]
    # Who stood behind the numbers. The server reads signer name/role from here
    # into the version it stamps -- a browser-chosen signedBy is not evidence.
    attestation: dict[str, object]
    # The quality check the portal ran; null when it was skipped. Score and
    # warning count are copied into the version for the verifier to read.
    check: dict[str, object] | None = None


class RevisionRequest(BaseModel):
    # Why it is going back, and exactly which values and docs the supplier may
    # touch again -- everything else stays locked at what they submitted.
    note: str = Field(default="", max_length=4000)
    unlocked: list[str] = Field(default_factory=list)
    unlockedDocs: list[str] = Field(default_factory=list)


def _now_ms() -> int:
    return int(time.time() * 1000)


# ── What the token holder may and may not write ──────────────────────────
#
# The token is the whole credential and it travels by email, so whoever holds
# it is trusted with the ANSWERS, not with the record of them. These fields are
# that record -- written only by submit and by the exporter's revision -- and a
# save or submit never takes them from the blob it was sent:
#
#   versions      what was submitted, when, signed by whom
#   attestation   the signature the current version stands on
#   unlocked*     what the exporter reopened -- the lock itself
#   revisionNote  what the exporter asked for
_SERVER_OWNED = ("versions", "attestation", "unlocked", "unlockedDocs", "revisionNote")

# The statuses a browser may move between on its own. "submitted" is reached
# only through submit, and "revision_requested" only through the exporter.
_CLIENT_STATUSES = frozenset({"new", "draft", "in_check"})
_LOCKED_STATUSES = frozenset({"submitted", "revision_requested"})

# Trail events only the server writes. A browser can append its own ("file
# attached", "check run"), but not one that claims a submit or a revision.
_SERVER_EVENT_KINDS = frozenset({"submit", "revision_requested"})
_MAX_EVENTS = 1000

# Same ceiling as a declaration document (routers/declarations.py): generous
# for a form's answers, and evidence bytes never ride in the blob.
MAX_STATE_BYTES = 512 * 1024

# Bookkeeping, not answers -- left out of the content hash a version carries.
_NOT_CONTENT = frozenset(
    {*_SERVER_OWNED, "token", "status", "events", "updatedAt", "lastCheck"}
)

_STATE_TOO_LARGE = HTTPException(
    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    detail={
        "code": "STATE_TOO_LARGE",
        "message": "That is more than a supplier form can hold. Attach large "
        "documents as files instead.",
    },
)

_LINK_SUBMITTED = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail={
        "code": "LINK_SUBMITTED",
        "message": "This was already submitted. Ask the exporter to send it "
        "back if something needs to change.",
    },
)


def _check_size(*parts: object) -> None:
    size = sum(len(json.dumps(part, ensure_ascii=False)) for part in parts)
    if size > MAX_STATE_BYTES:
        raise _STATE_TOO_LARGE


def _stored_state(link: dict[str, object], token: str) -> dict[str, object]:
    """What the server holds for this link, with every field present."""

    stored = link["state"] if isinstance(link["state"], dict) else {}
    return {**_empty_state(token), **stored}


def _merged_events(
    stored: dict[str, object], incoming: dict[str, object]
) -> list[object]:
    """The stored trail, plus whatever new events the browser added.

    Append-only: nothing already on the trail can be dropped or rewritten, and
    a browser cannot add an event of a kind only the server writes.
    """

    kept = list(stored["events"]) if isinstance(stored["events"], list) else []
    seen = {event.get("id") for event in kept if isinstance(event, dict)}
    offered = incoming.get("events")
    for event in offered if isinstance(offered, list) else []:
        if len(kept) >= _MAX_EVENTS:
            break
        if (
            not isinstance(event, dict)
            or not isinstance(event.get("id"), str)
            or event["id"] in seen
            or event.get("kind") in _SERVER_EVENT_KINDS
        ):
            continue
        kept.append(event)
        seen.add(event["id"])
    return kept


def _as_dict(value: object) -> dict[str, object]:
    return dict(value) if isinstance(value, dict) else {}


def _revision_answers(
    stored: dict[str, object], incoming: dict[str, object]
) -> tuple[dict[str, object], dict[str, object]]:
    """``values`` and ``docs`` as a revision lets them change.

    The server's copy of the portal's own rule (components/supplier/context.tsx,
    canEditField / canEditDoc), which until now was the only enforcement:

      * a value is editable if the exporter unlocked it -- or if they unlocked
        no values at all, which reopens every one;
      * a document is editable if the exporter unlocked it, or if it was never
        uploaded in the first place.

    Everything else keeps what was submitted, whatever the blob says.
    """

    old_values, new_values = (
        _as_dict(stored["values"]),
        _as_dict(incoming.get("values")),
    )
    unlocked = [key for key in stored["unlocked"] or [] if isinstance(key, str)]
    if unlocked:
        values = {k: v for k, v in old_values.items() if k not in unlocked}
        values.update({k: new_values[k] for k in unlocked if k in new_values})
    else:
        values = new_values

    old_docs, new_docs = _as_dict(stored["docs"]), _as_dict(incoming.get("docs"))
    unlocked_docs = {d for d in stored["unlockedDocs"] or [] if isinstance(d, str)}

    def editable(doc_id: str) -> bool:
        return (
            doc_id in unlocked_docs
            or _as_dict(old_docs.get(doc_id)).get("status") != "uploaded"
        )

    docs = {k: v for k, v in old_docs.items() if not editable(k)}
    docs.update({k: v for k, v in new_docs.items() if editable(k)})
    return values, docs


def _guarded_state(
    stored: dict[str, object], incoming: dict[str, object], *, workspace: bool
) -> dict[str, object]:
    """The blob a save or submit may actually store.

    The browser's answers, with the server's record put back over them: the
    _SERVER_OWNED fields, a status it may not jump, an append-only trail, and --
    on a declaration link under revision -- answers outside what the exporter
    reopened.

    A workspace's monthly link (/w/) is not answer-locked here. Its form is an
    opaque slice of the portal's stores, and its "please reopen this month"
    request travels inside that slice after the month is submitted
    (lib/month-submission.ts), so refusing the save would cut that off. What
    it gets instead is the content hash every version carries (_content_sha256):
    a change after submission no longer matches the version it claims to be.
    """

    state = dict(incoming)
    for field in _SERVER_OWNED:
        state[field] = stored[field]

    stored_status = stored["status"] or "new"
    asked = incoming.get("status")
    if stored_status in _LOCKED_STATUSES:
        state["status"] = stored_status
    else:
        state["status"] = asked if asked in _CLIENT_STATUSES else stored_status

    state["events"] = _merged_events(stored, incoming)

    if not workspace and stored_status == "revision_requested":
        state["values"], state["docs"] = _revision_answers(stored, incoming)
    return state


def _content_sha256(state: dict[str, object]) -> str:
    """A hash of the answers a version was signed over.

    Canonical JSON (sorted keys, no whitespace) of everything in the blob that
    is not bookkeeping. Stamped into the version at submit, so anyone holding
    the state later can tell whether the answers still are the ones that were
    signed.
    """

    content = {k: v for k, v in state.items() if k not in _NOT_CONTENT}
    canonical = json.dumps(
        content, sort_keys=True, ensure_ascii=False, separators=(",", ":")
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


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


def live_link(
    request: Request, token: str
) -> tuple[dict[str, object], dict[str, object], object]:
    """Resolve a token to its link and declaration, or raise the dead-link code.

    Public because the evidence routes need the same gate: see
    app/routers/files.py, where a supplier uploads against a live link.

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
    # A suspended exporter's links stop resolving with the account (Terms
    # §20.4: access withdrawn "in whole or in part"). Checked here rather than
    # by stamping revoked_at across their rows, because suspension is meant to
    # be lifted: a paid invoice restores every link as it was, instead of
    # leaving the exporter to re-send one to every supplier. The supplier sees
    # the ordinary revoked answer -- they are not our customer, and whose
    # invoice is unpaid is not theirs to learn.
    owner = get_account(database, str(link["userId"]))
    if owner is not None and not owner.is_active:
        raise _TOKEN_REVOKED
    # The declaration was deleted after the link was minted. The SQL FK cascades
    # the link row away, so DB mode never reaches here; the in-memory store does.
    doc = _declaration_doc(request, link["userId"], link["declId"])
    if doc is None:
        raise _TOKEN_NOT_FOUND
    return link, doc, database


def _owned_link(
    request: Request, account_id: str, declaration_id: str, token: str
) -> tuple[dict[str, object], object]:
    """The link for this token, but only if it is this account's and this
    declaration's -- otherwise the same not-there code as any bad token.

    The exporter's counterpart to ``live_link``: owner-scoped, and deliberately
    NOT gated on revoked/expired, so reviewing a submission and sending it back
    for changes both reach a link even after the exporter has closed it. Returns
    the link row and the database (or None).
    """

    database = request.app.state.database
    link = (
        database.get_smart_link(token)
        if database is not None
        else request.app.state.smart_links.get(token)
    )
    if link is None or link["userId"] != account_id or link["declId"] != declaration_id:
        raise _TOKEN_NOT_FOUND
    return link, database


def _links_for(
    request: Request, user_id: str, declaration_id: str
) -> list[dict[str, object]]:
    """Every link minted for one declaration, newest first, whichever store.

    The list and submissions endpoints both start here -- same rows, different
    projection -- so the DB-vs-memory branch is written once, not twice.
    """

    database = request.app.state.database
    if database is not None:
        return database.list_smart_links(uuid.UUID(user_id), declaration_id)
    # Dict insertion order is mint order; reversed = newest first without
    # tying on same-millisecond createdAt stamps.
    return [
        row
        for row in reversed(request.app.state.smart_links.values())
        if row["userId"] == user_id and row["declId"] == declaration_id
    ]


def _submission_summary(row: dict[str, object]) -> dict[str, object]:
    """One link's state boiled down to what the exporter's dashboard reads.

    Only the fields a "who has answered" glance needs -- status, the latest
    version number and its score, and when it last moved. The answer blob
    itself never leaves the server; this is a listing, not the answers.
    """

    state = row.get("state")
    state = state if isinstance(state, dict) else {}
    versions = state.get("versions")
    versions = versions if isinstance(versions, list) else []
    last = versions[-1] if versions and isinstance(versions[-1], dict) else {}
    n = last.get("n")
    score = last.get("score")
    updated = state.get("updatedAt")
    return {
        "supplierId": row["supplierId"],
        "token": row["token"],
        "status": state.get("status") or "new",
        "version": n if isinstance(n, int) else 0,
        "score": score if isinstance(score, (int, float)) else None,
        # Never saved: fall back to when the link was minted so the row still
        # sorts and renders rather than carrying a null date.
        "updatedAt": updated if isinstance(updated, int) else row.get("createdAt") or 0,
    }


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


@router.post(
    "/declarations/{declaration_id}/links", status_code=status.HTTP_201_CREATED
)
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

    rows = _links_for(request, account.id, declaration_id)

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


@router.get("/declarations/{declaration_id}/submissions")
def list_submissions(
    declaration_id: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """The exporter's at-a-glance "who has answered", per docs/API-CONTRACT.md §3.

    This is what the dashboard polls to watch a supplier's status change from
    across a submit -- so it stays small: one row per link with just the fields
    a status glance reads, never the answer blob. Owner-scoped like every
    exporter route: asking about a declaration that is not yours answers exactly
    like one that is not there.
    """

    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    rows = _links_for(request, account.id, declaration_id)
    return {"submissions": [_submission_summary(row) for row in rows]}


@router.get("/declarations/{declaration_id}/submissions/{token}")
def get_submission_state(
    declaration_id: str,
    token: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """One supplier's full answers, for the exporter's review pane.

    The submissions list is a status glance; this is the blob behind one row,
    fetched only when the exporter opens a submission to review it -- so a
    supplier who filled the Smart Link on their own machine is still reviewable
    here, not just visible as a status.

    Owner-scoped: the link must belong to this declaration and this account, or
    it answers like it is not there. Unlike the public resolve, this does NOT
    gate on revoked/expired -- an exporter reviews what was submitted even after
    they have closed the link.
    """

    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    link, _database = _owned_link(request, account.id, declaration_id, token)
    return {
        "token": token,
        "supplierId": link["supplierId"],
        "state": link["state"] or _empty_state(token),
    }


@router.post("/declarations/{declaration_id}/links/{token}/revision")
def request_revision(
    declaration_id: str,
    token: str,
    body: RevisionRequest,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """The exporter sends a submission back for changes, per docs/API-CONTRACT.md §3.

    The mirror of submit: submit set status "submitted", this sets it back to
    "revision_requested" and records the note plus exactly which values and docs
    the supplier may edit again. The supplier's next submit reads ``revisionNote``
    into the version it stamps, closing the loop. Owner-scoped like the review
    pane, and like it not gated on revoked/expired -- an exporter can reopen a
    submission they already closed.
    """

    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    link, database = _owned_link(request, account.id, declaration_id, token)

    # Start from what the supplier last saved, never null, so the fields the
    # server does not own (values, docs, versions) survive the round trip.
    state = dict(link["state"] or _empty_state(token))
    now = _now_ms()

    fields = len(body.unlocked)
    docs = len(body.unlockedDocs)
    events = state.get("events")
    events = list(events) if isinstance(events, list) else []
    events.append(
        {
            "id": uuid.uuid4().hex,
            "at": now,
            "kind": "revision_requested",
            "text": (
                f"Revision requested on {fields} field"
                f"{'' if fields == 1 else 's'}"
                + (f" and {docs} document{'' if docs == 1 else 's'}" if docs else "")
                + (f' -- "{body.note}"' if body.note else "")
            ),
        }
    )

    state["token"] = token
    state["status"] = "revision_requested"
    state["unlocked"] = list(body.unlocked)
    state["unlockedDocs"] = list(body.unlockedDocs)
    state["revisionNote"] = body.note
    state["events"] = events
    state["updatedAt"] = now
    return _persist_state(request, database, token, state)


@router.post("/declarations/{declaration_id}/links/{token}/revoke")
def revoke_link(
    declaration_id: str,
    token: str,
    request: Request,
    account: Account = Depends(current_account),
) -> dict[str, object]:
    """Kill one supplier's link early, before it expires.

    ``revoked_at`` has been in the schema since revision 009 and ``live_link``
    has always refused a link carrying it -- but nothing ever wrote it, so the
    column described a capability the product did not have. This is it: the
    wrong address was invited, a contact left the supplier, a month was sent
    to the wrong company.

    Owner-scoped like the rest of the exporter's link routes, and NOT gated on
    revoked or expired: revoking a link twice is the same answer as revoking
    it once. What the supplier already submitted stays -- the link is the way
    in, not the work.
    """

    if _declaration_doc(request, account.id, declaration_id) is None:
        raise _DECLARATION_NOT_FOUND

    link, database = _owned_link(request, account.id, declaration_id, token)

    if database is not None:
        revoked = database.revoke_smart_link(token)
        if revoked is None:
            # Lost the race to a declaration delete between check and write.
            raise _TOKEN_NOT_FOUND
        link = revoked
    elif link["revokedAt"] is None:
        link["revokedAt"] = _now_ms()

    return {"token": token, "revokedAt": link["revokedAt"]}


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

    link, doc, database = live_link(request, token)

    exporter = get_account(database, link["userId"])
    exporter_view = {"companyName": (exporter.company_name if exporter else None) or ""}

    if doc.get("kind") == WORKSPACE_KIND:
        # A workspace's monthly link. The whole document is already the
        # supplier's slice -- the portal builds it for exactly this reader
        # (one workspace is one supplier), so it goes out as written rather
        # than being picked apart like a declaration shared by many suppliers.
        view = doc.get("supplierView")
        return {
            "token": token,
            "kind": WORKSPACE_KIND,
            "declId": link["declId"],
            "supplierId": link["supplierId"],
            "month": link["month"],
            "expiresAt": link["expiresAt"],
            "exporter": exporter_view,
            "workspace": view if isinstance(view, dict) else {},
            "state": link["state"] or _empty_state(token),
        }

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
    row = (
        next(
            (
                entry
                for entry in (suppliers if isinstance(suppliers, list) else [])
                if isinstance(entry, dict) and entry.get("id") == link["supplierId"]
            ),
            None,
        )
        or {}
    )

    included = doc.get("includedFieldIds")
    due_in_days = doc.get("dueInDays")

    return {
        "token": token,
        "declId": link["declId"],
        "supplierId": link["supplierId"],
        "month": link["month"],
        "expiresAt": link["expiresAt"],
        "exporter": exporter_view,
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
    """Autosave while the supplier fills in. Last write wins on the answers.

    Public like resolve: the holder has no account, so this must work with no
    session and must never depend on one. The answers are stored as given; the
    record of them is not -- see _guarded_state for what the server keeps --
    and a submitted declaration link takes no more saves at all (the portal
    stops autosaving there; a revision from the exporter is what reopens it).
    """

    link, doc, database = live_link(request, token)
    _check_size(body.state)
    workspace = doc.get("kind") == WORKSPACE_KIND
    stored = _stored_state(link, token)
    if not workspace and stored["status"] == "submitted":
        raise _LINK_SUBMITTED

    state = _guarded_state(stored, body.state, workspace=workspace)
    state["token"] = token  # the token is the path's, not the blob's to claim
    state["updatedAt"] = _now_ms()  # server clock, so the client cannot lie
    return _persist_state(request, database, token, state)


@router.post("/links/{token}/submit")
def submit_link(token: str, body: SubmitRequest, request: Request) -> dict[str, object]:
    """The supplier signs and submits. Server owns the evidence fields.

    The blob arrives with the answers, but the version history, the new
    version's number and timestamp, the signer read off the attestation, the
    hash of what was signed and the status transition are all the server's --
    a verifier reads those, and a history the submitting browser sent is not
    evidence of anything. The answers go through the same guard as a save.
    """

    link, doc, database = live_link(request, token)
    _check_size(body.state, body.attestation, body.check)
    workspace = doc.get("kind") == WORKSPACE_KIND
    stored = _stored_state(link, token)
    # A declaration link is answered once per round: a second submit without
    # the exporter sending it back would be a new version nobody asked for.
    # The monthly link keeps its reopen flow in the portal (see _guarded_state).
    if not workspace and stored["status"] == "submitted":
        raise _LINK_SUBMITTED

    state = _guarded_state(stored, body.state, workspace=workspace)
    now = _now_ms()

    versions = list(stored["versions"]) if isinstance(stored["versions"], list) else []
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
        "contentSha256": _content_sha256(state),
    }
    # A resubmit after a revision carries the exporter's note into the version,
    # mirroring the portal's own submit (components/supplier/context.tsx). Read
    # from the stored record: the note is the exporter's words, not the blob's.
    if stored["status"] == "revision_requested" and stored["revisionNote"]:
        version["note"] = stored["revisionNote"]

    events = list(state["events"])
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
