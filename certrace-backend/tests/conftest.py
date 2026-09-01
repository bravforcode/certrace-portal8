"""Shared test doubles.

The suite never touches Resend. Every app built here is handed a transport
that keeps what it was given, so a test can assert on the message a customer
would actually receive -- subject, both bodies, and the code inside them.
"""

from __future__ import annotations

from collections.abc import Callable

from app.services.email import EmailMessage


class RecordingTransport:
    """An ``EmailTransport`` that files messages instead of sending them."""

    def __init__(self) -> None:
        self.sent: list[EmailMessage] = []

    def send(self, message: EmailMessage) -> str:
        self.sent.append(message)
        return f"recorded-{len(self.sent)}"

    @property
    def last(self) -> EmailMessage:
        assert self.sent, "expected an email to have been sent"
        return self.sent[-1]


class ExplodingTransport:
    """Fails every send, to prove a delivery problem never breaks a request."""

    def __init__(self, error: Exception) -> None:
        self._error = error
        self.attempts = 0

    def send(self, message: EmailMessage) -> str:
        self.attempts += 1
        raise self._error


def settings(**values: str) -> Callable[[str], str | None]:
    """A stand-in for ``load_env_file_value`` backed by a plain dict."""

    return lambda name: values.get(name)
