"""Outbound email transports.

This module knows how to hand a finished message to a provider. It does not
know what any message says -- that lives in ``email_templates``, and which
message to send lives in ``notifications``. Keeping the three apart is what
lets the tests assert on rendered copy without a network, and lets a second
provider land later without touching a single template.

Three transports, chosen by ``CERTRACE_EMAIL_DELIVERY``:

``resend``   the real thing.
``console``  prints the whole message, body included. This is how you read a
             reset code on a laptop with no API key -- which is why it has to
             be asked for by name and never becomes a default.
``off``      drops the message and says so once. Tests and CI run here.

The default is ``resend`` when a key and sender are configured and ``off``
when they are not, so a fresh checkout starts silent rather than crashing on
the first password reset. But an explicit ``resend`` with no key is an error:
someone meant to send mail and would otherwise never find out they weren't.
"""

from __future__ import annotations

import json
import logging
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from typing import Protocol, TextIO

from app.config import (
    EMAIL_DELIVERY_ENV,
    EMAIL_REPLY_TO_ENV,
    EMAIL_SENDER_ENV,
    RESEND_API_KEY_ENV,
    load_env_file_value,
)

_LOGGER = logging.getLogger(__name__)

RESEND_ENDPOINT = "https://api.resend.com/emails"

# Resend gives up on a request long before this; the timeout is here so a
# hung socket cannot pin a worker thread indefinitely.
DEFAULT_TIMEOUT_SECONDS = 10.0
DEFAULT_MAX_ATTEMPTS = 3


class EmailDeliveryError(RuntimeError):
    """The provider did not accept the message."""


@dataclass(frozen=True)
class EmailMessage:
    """One message, already rendered in both parts.

    ``text`` is not optional. A code-carrying email that arrives as an empty
    body in a plain-text client is a support ticket, and some corporate
    gateways strip HTML outright.
    """

    to: str
    subject: str
    html: str
    text: str
    # Provider-side labels for filtering delivery logs. Resend restricts these
    # to ASCII letters, digits, underscores and dashes.
    tags: Mapping[str, str] = field(default_factory=dict)


class EmailTransport(Protocol):
    """Anything that can accept a message and name what it did with it."""

    def send(self, message: EmailMessage) -> str:
        """Deliver ``message``; return a provider id for the audit log."""


def _is_retryable(status: int) -> bool:
    """Rate limits and provider faults are worth a second try; 4xx is not.

    A 422 means the message itself is wrong -- a malformed sender, an
    unverified domain. Retrying that only makes the same mistake three times.
    """

    return status == 429 or status >= 500


class ResendTransport:
    """Posts to Resend's REST API over the standard library.

    ``urllib`` rather than ``httpx``/``requests`` on purpose: the backend's
    runtime dependency list is six lines long, the endpoints that send mail
    are synchronous, and this is one POST with a bearer token.
    """

    def __init__(
        self,
        api_key: str,
        sender: str,
        *,
        reply_to: str | None = None,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        max_attempts: int = DEFAULT_MAX_ATTEMPTS,
        opener: Callable[[urllib.request.Request, float], bytes] | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        if not api_key:
            raise ValueError("Resend requires an API key.")
        if not sender:
            raise ValueError("Resend requires a verified sender address.")
        self._api_key = api_key
        self._sender = sender
        self._reply_to = reply_to
        self._timeout_seconds = timeout_seconds
        self._max_attempts = max(1, max_attempts)
        self._opener = opener or _urlopen
        self._sleep = sleep

    def _payload(self, message: EmailMessage) -> dict[str, object]:
        payload: dict[str, object] = {
            "from": self._sender,
            "to": [message.to],
            "subject": message.subject,
            "html": message.html,
            "text": message.text,
        }
        if self._reply_to:
            payload["reply_to"] = self._reply_to
        if message.tags:
            payload["tags"] = [
                {"name": name, "value": value} for name, value in message.tags.items()
            ]
        return payload

    def send(self, message: EmailMessage) -> str:
        request = urllib.request.Request(
            RESEND_ENDPOINT,
            data=json.dumps(self._payload(message)).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Certrace-Backend/1.0",
            },
            method="POST",
        )

        last_error = "unknown error"
        for attempt in range(1, self._max_attempts + 1):
            try:
                body = self._opener(request, self._timeout_seconds)
            except urllib.error.HTTPError as error:
                # The body carries Resend's own diagnosis ("domain is not
                # verified"), which is the only thing that makes a 4xx here
                # actionable. It never contains the key we sent.
                detail = _read_error_body(error)
                last_error = f"HTTP {error.code}: {detail}"
                if not _is_retryable(error.code) or attempt == self._max_attempts:
                    raise EmailDeliveryError(last_error) from error
            except (urllib.error.URLError, TimeoutError, OSError) as error:
                last_error = f"transport failure: {error}"
                if attempt == self._max_attempts:
                    raise EmailDeliveryError(last_error) from error
            else:
                return _provider_id(body)

            # 0.5s, then 1s. Long enough to clear a burst limit, short enough
            # that a background task does not outlive the request that queued it.
            self._sleep(0.5 * (2 ** (attempt - 1)))

        raise EmailDeliveryError(last_error)


class ConsoleTransport:
    """Prints the message instead of sending it.

    On a machine with no Resend key this output *is* the inbox -- it is how
    you read a reset code locally -- so it goes to stdout rather than through
    ``logging``. Under ``uvicorn`` the logging config covers uvicorn's own
    loggers and leaves the root logger without a handler, which means an
    INFO record from this module is silently dropped and the transport looks
    broken. A dev aid whose whole job is to be seen cannot depend on the
    caller having configured logging first.

    Never selected implicitly -- see the module docstring.
    """

    def __init__(self, stream: TextIO | None = None) -> None:
        self._stream = stream
        self._counter = 0

    def send(self, message: EmailMessage) -> str:
        self._counter += 1
        # Resolved per call: pytest and uvicorn both replace sys.stdout, and a
        # reference captured in __init__ would write to the one that is gone.
        stream = self._stream or sys.stdout
        stream.write(
            f"\n--- email (console transport) ---\n"
            f"to: {message.to}\n"
            f"subject: {message.subject}\n\n"
            f"{message.text}\n"
            f"--- end ---\n\n"
        )
        stream.flush()
        return f"console-{self._counter}"


class NullTransport:
    """Drops the message. Warns once so a misconfigured deploy is visible."""

    def __init__(self, logger: logging.Logger | None = None) -> None:
        self._logger = logger or _LOGGER
        self._warned = False

    def send(self, message: EmailMessage) -> str:
        if not self._warned:
            # The three constants below are variable NAMES -- "RESEND_API_KEY",
            # not the key. Naming them is the whole point of the warning: an
            # operator reading it has to learn what to set.
            #
            # CodeQL reads it the other way. Its clear-text-logging query
            # classifies a source by the name of the constant carrying it, so
            # RESEND_API_KEY_ENV looks like the key whatever it holds, and the
            # finding is signed off in the TRIAGED list in .github/workflows/
            # ci.yml -- there is no comment that reaches that gate. Renaming the
            # constant would silence it and make config.py worse to read.
            self._logger.warning(
                "Email delivery is off (%s); messages are being discarded. "
                "Set %s and %s to send.",
                EMAIL_DELIVERY_ENV,
                RESEND_API_KEY_ENV,
                EMAIL_SENDER_ENV,
            )
            self._warned = True
        self._logger.debug("Discarded email to %s: %s", message.to, message.subject)
        return "discarded"


def transport_from_env(
    resolve: Callable[[str], str | None] = load_env_file_value,
) -> EmailTransport:
    """Build the transport this process should use. Raises on a bad config.

    ``resolve`` is the settings lookup, injectable so a test can describe a
    configuration without mutating the process environment -- and without
    quietly passing because the machine running it happens to have a real key
    in ``.env``.
    """

    api_key = resolve(RESEND_API_KEY_ENV)
    sender = resolve(EMAIL_SENDER_ENV)
    reply_to = resolve(EMAIL_REPLY_TO_ENV)

    configured = (resolve(EMAIL_DELIVERY_ENV) or "").strip().lower()
    mode = configured or ("resend" if api_key and sender else "off")

    if mode == "console":
        return ConsoleTransport()
    if mode in {"off", "none", "null"}:
        return NullTransport()
    if mode != "resend":
        raise ValueError(f"{EMAIL_DELIVERY_ENV} must be one of: resend, console, off.")
    if not api_key or not sender:
        raise ValueError(
            f"{EMAIL_DELIVERY_ENV}=resend requires {RESEND_API_KEY_ENV} and "
            f"{EMAIL_SENDER_ENV}."
        )
    return ResendTransport(api_key, sender, reply_to=reply_to)


def _urlopen(request: urllib.request.Request, timeout: float) -> bytes:
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def _read_error_body(error: urllib.error.HTTPError) -> str:
    try:
        return error.read().decode("utf-8", "replace")[:500]
    except Exception:  # noqa: BLE001 - a diagnostic must not raise
        return error.reason if isinstance(error.reason, str) else "no detail"


def _provider_id(body: bytes) -> str:
    """Resend answers ``{"id": "..."}``; a shape change must not lose the send."""

    try:
        parsed = json.loads(body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return "accepted"
    identifier = parsed.get("id") if isinstance(parsed, dict) else None
    return str(identifier) if identifier else "accepted"
