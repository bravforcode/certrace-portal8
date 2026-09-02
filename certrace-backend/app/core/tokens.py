"""Issue and verify the bearer tokens the portal signs requests with.

PyJWT rather than a hand-rolled HS256, which is a deliberate departure from how
``core/security.py`` reaches for hashlib and ``services/email.py`` for urllib.
Signing a JWT really is two lines of hmac; it is the *verifying* side that has
the sharp edges -- rejecting `alg: none`, refusing an RS256 token presented to
an HS256 key, comparing signatures without leaking timing, applying `exp` and
`nbf` with a clock skew. Every one of those has shipped as a real CVE in
somebody's homemade twenty lines. This is the place to spend a dependency.

There is no revocation. The contract says so plainly: a stateless token has
nothing on the server to take back, so `logout` is a client-side erase and a
stolen token stays valid until it expires. That is what makes the lifetime a
security decision rather than a comfort one.
"""

from __future__ import annotations

import datetime

import jwt

from app.config import JWT_ALGORITHM, JWT_ISSUER, JWT_TTL_HOURS


class TokenError(Exception):
    """Raised when a presented token is missing, malformed, or expired."""


def issue_access_token(secret: str, *, user_id: str, email: str) -> str:
    """Mint a token naming the account it belongs to.

    The payload carries an identifier and nothing that can go stale. A name or
    an `onboarded` flag copied in here would keep answering with the value it
    had at sign-in, for as long as the token lives -- which is why /me reads
    the user back from the database instead of unpacking it from the token.
    """

    issued_at = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iss": JWT_ISSUER,
        "iat": issued_at,
        "exp": issued_at + datetime.timedelta(hours=JWT_TTL_HOURS),
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def read_access_token(secret: str, token: str) -> str:
    """Return the user id a valid token names, or raise ``TokenError``.

    ``algorithms`` is pinned to one entry on purpose: passing the list the
    token itself asks for is the algorithm-confusion bug, where an attacker
    re-signs a token with the public key as an HMAC secret.
    """

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={"require": ["exp", "iat", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise TokenError("Token carries no subject.")
    return subject
