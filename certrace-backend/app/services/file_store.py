"""Evidence files: what may be stored, and where the bytes actually go.

Until now a certificate lived as a base64 data URL inside the supplier's
answer blob in the browser's localStorage, and anything over ~1.5 MB kept its
name and size and lost its contents (certrace-portal/lib/cbam/evidence.ts).
Most real mill certificates are larger than that, so the file a verifier would
ask for was exactly the file the portal threw away.

This module holds the two things that decision needs:

  VALIDATION  what a file has to be before it is stored at all - a size the
              service can hold, a type we can show a verifier, and a declared
              content type that matches the bytes actually sent.
  STORAGE     an object store behind one small interface, so the bytes can
              move to a bucket later without any route changing.

On the storage choice, stated plainly because it is a real trade-off: bytes go
into PostgreSQL today. A bucket with signed URLs is the destination, and
``ObjectStore`` exists so that is a new class rather than a new API. But there
is no bucket provisioned, the backend itself is not deployed yet, and a
design partner who cannot attach a 4 MB certificate is blocked now. A row in
a table they already pay for is worth more today than a bucket next month,
and it is one class away from the bucket when there is one.

What that costs, so nobody discovers it later: a 15 MB file is 15 MB of
database, of every backup, and of any dump someone takes. At a few hundred
certificates that is fine. At tens of thousands it is not, and the move to a
bucket becomes the point of a sprint rather than a nice-to-have.
"""

from __future__ import annotations

import hashlib
import io
import re
import unicodedata
import uuid
import zipfile
from typing import Protocol

from app.config import load_positive_int

# The one content type whose ZIP magic is not enough on its own -- see
# ``_looks_like_xlsx`` and its use in ``validate``.
_OOXML_SPREADSHEET = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

# Cloud Run caps an HTTP/1 request body at 32 MiB and the service runs with
# 512 MiB of memory at a concurrency of 8, so the ceiling here is memory, not
# the platform: eight concurrent uploads at the limit have to fit alongside
# everything else. 15 MB covers the certificates seen so far with room over.
MAX_UPLOAD_BYTES_ENV = "CERTRACE_MAX_UPLOAD_BYTES"
MAX_UPLOAD_BYTES_DEFAULT = 15 * 1024 * 1024


def max_upload_bytes() -> int:
    return load_positive_int(MAX_UPLOAD_BYTES_ENV, MAX_UPLOAD_BYTES_DEFAULT)


# What a verifier can actually be shown. Deliberately short: every entry here
# is a format someone reviewing a declaration can open without our help, and
# adding one is a decision about what we are willing to serve back out.
ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "text/csv": ".csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}

# First bytes of each format, for the ones that have them. A declared content
# type is a claim by whoever is uploading; this is the check that the claim
# matches what arrived. It is not a security boundary on its own - it is what
# stops a PDF viewer being handed a ZIP because a browser guessed wrong.
_MAGIC: dict[str, tuple[bytes, ...]] = {
    "application/pdf": (b"%PDF-",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
    # xlsx is a ZIP container; the two variants are an ordinary and an empty
    # archive respectively.
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (
        b"PK\x03\x04",
        b"PK\x05\x06",
    ),
}

_UNSAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


class FileRejected(ValueError):
    """A file the service will not store, with the reason the uploader sees."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def safe_filename(name: str) -> str:
    """A stored name that is still recognisable but cannot traverse anything.

    Everything reaching a filesystem path or a Content-Disposition header goes
    through here: separators and control characters out, unicode normalised so
    two visually identical names cannot differ in bytes, length capped so a
    pathological name cannot become the problem.
    """

    cleaned = unicodedata.normalize("NFKD", name or "").strip()
    cleaned = cleaned.replace("\\", "/").rsplit("/", 1)[-1]
    cleaned = _UNSAFE_NAME.sub("_", cleaned).strip("._-")
    if not cleaned:
        cleaned = "upload"
    if len(cleaned) > 120:
        stem, _, extension = cleaned.rpartition(".")
        if stem and len(extension) <= 8:
            cleaned = f"{stem[: 119 - len(extension)]}.{extension}"
        else:
            cleaned = cleaned[:120]
    return cleaned


def normalise_content_type(raw: str | None) -> str:
    """The bare media type, lowercased, with any charset or boundary dropped."""

    return (raw or "").split(";", 1)[0].strip().lower()


def _looks_like_xlsx(data: bytes) -> bool:
    """Whether a ZIP is actually an OOXML workbook, not just any ZIP.

    The PK magic bytes only say "this is a ZIP" -- a .docx, a .jar, an APK, or
    a zip bomb renamed .xlsx all start the same way and would otherwise be
    accepted as a spreadsheet a verifier is meant to trust. A real .xlsx
    carries ``[Content_Types].xml`` and an ``xl/`` part; reading the central
    directory to confirm that touches only the archive's index, not its
    (possibly hostile) compressed contents.
    """

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names = archive.namelist()
    except zipfile.BadZipFile:
        return False
    return "[Content_Types].xml" in names and any(
        name.startswith("xl/") for name in names
    )


def validate(content_type: str, data: bytes) -> str:
    """Refuse anything that cannot be stored, and return the accepted type.

    Order matters. Size is checked before content because a body over the
    limit should be refused for its size rather than for what it contains,
    and empty before magic bytes because "the upload never arrived" is a
    different problem from "this is not a PDF".
    """

    limit = max_upload_bytes()
    if len(data) > limit:
        raise FileRejected(
            "FILE_TOO_LARGE",
            f"That file is {len(data):,} bytes and the limit is {limit:,}. "
            "Split it, or send it another way and note the reference on the "
            "declaration.",
        )
    if not data:
        raise FileRejected(
            "FILE_EMPTY",
            "That upload had no content. It usually means the file was still "
            "being written, or the browser lost the connection part-way.",
        )

    media_type = normalise_content_type(content_type)
    if media_type not in ALLOWED_CONTENT_TYPES:
        allowed = ", ".join(sorted(ALLOWED_CONTENT_TYPES))
        raise FileRejected(
            "FILE_TYPE_NOT_ALLOWED",
            f"{media_type or 'That file type'} cannot be stored as evidence. "
            f"Accepted: {allowed}.",
        )

    signatures = _MAGIC.get(media_type)
    if signatures and not any(data.startswith(signature) for signature in signatures):
        raise FileRejected(
            "FILE_CONTENT_MISMATCH",
            f"The file was sent as {media_type} but its contents are not "
            f"{media_type}. Re-export it, or upload it under its real type.",
        )
    if media_type == _OOXML_SPREADSHEET and not _looks_like_xlsx(data):
        # The PK magic passed, so this is a ZIP -- but not every ZIP is a
        # workbook. Confirm the OOXML structure so a docx, an archive, or a
        # zip bomb cannot masquerade as the spreadsheet a verifier will open.
        raise FileRejected(
            "FILE_CONTENT_MISMATCH",
            "That file was sent as an Excel workbook but is not one. "
            "Re-export it from a spreadsheet, or upload it under its real type.",
        )
    if media_type == "text/csv" and b"\x00" in data[:8192]:
        # CSV has no signature to check, so the one thing worth asserting is
        # that it is text at all - a NUL early on means a binary file was
        # labelled as a spreadsheet export.
        #
        # Deliberately NOT rejected or altered here: a cell beginning = + - @
        # (spreadsheet formula injection). Refusing it would turn away
        # legitimate exports that happen to lead with those characters, and
        # rewriting the bytes would break the promise this module is built on
        # -- evidence is stored exactly as received (see the module docstring).
        # The residual risk is a verifier opening a hostile CSV in a
        # spreadsheet; it is contained by serving every download as an
        # attachment under a deny-all CSP (see routers/files.py), and is
        # accepted knowingly rather than papered over.
        raise FileRejected(
            "FILE_CONTENT_MISMATCH",
            "That file was sent as text/csv but contains binary data.",
        )
    return media_type


def sha256(data: bytes) -> str:
    """Content hash, so a document swapped after sign-off is detectable."""

    return hashlib.sha256(data).hexdigest()


def object_key(declaration_id: str, filename: str) -> str:
    """Where the bytes live, under the declaration they belong to.

    Already path-shaped because a bucket will want it that way, and carrying a
    random component means two uploads of the same filename never collide.
    """

    return f"declarations/{declaration_id}/{uuid.uuid4().hex}/{safe_filename(filename)}"


class ObjectStore(Protocol):
    """Where evidence bytes actually sit.

    Deliberately three methods. A bucket implementation replaces this class and
    nothing else: routes deal in keys and metadata, never in storage.
    """

    def put(self, key: str, data: bytes, content_type: str) -> None: ...

    def get(self, key: str) -> bytes | None: ...

    def delete(self, key: str) -> None: ...


class InMemoryObjectStore:
    """The store the no-database mode uses, and the one the tests use.

    Bytes live for the life of the process, which is exactly what a local demo
    needs and exactly what production must never run on - which is why the
    service refuses to start without a database when
    ``CERTRACE_REQUIRE_DATABASE`` is set.
    """

    def __init__(self) -> None:
        self._objects: dict[str, bytes] = {}

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self._objects[key] = data

    def get(self, key: str) -> bytes | None:
        return self._objects.get(key)

    def delete(self, key: str) -> None:
        self._objects.pop(key, None)


class DatabaseObjectStore:
    """Bytes in PostgreSQL, in the row that already carries the metadata.

    One round trip, one thing to back up, and no second system to provision
    before a design partner can attach a certificate. See the module docstring
    for what this costs at scale and when it stops being the right answer.
    """

    def __init__(self, repository) -> None:
        self._repository = repository

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self._repository.put_file_bytes(key, data)

    def get(self, key: str) -> bytes | None:
        return self._repository.get_file_bytes(key)

    def delete(self, key: str) -> None:
        self._repository.delete_file_bytes(key)
