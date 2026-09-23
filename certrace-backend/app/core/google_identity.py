"""Verify a Google ID token — the one credential Sign in with Google hands us.

The portal sends the browser to Google, Google sends it back with an ID token
(a JWT Google signed), and the portal forwards that token here. Nothing the
browser says about who it is counts; only what this module can prove from
Google's signature does.

Every check is load-bearing:

* signature against Google's published keys (RS256 only — never "none", never
  a symmetric algorithm a forger could satisfy with the public key);
* ``aud`` is OUR client id — a token minted for some other site that uses
  Google sign-in must not open a Certrace account;
* ``iss`` is Google;
* ``exp`` / ``iat`` — PyJWT enforces them;
* ``nonce`` matches the one the portal generated for this very attempt, so a
  token lifted from elsewhere cannot be replayed into a fresh sign-in;
* ``email_verified`` — linking accounts by email is only safe when Google
  vouches that the holder owns the address.
"""

from __future__ import annotations

import hmac
from collections.abc import Callable
from dataclasses import dataclass

import jwt

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")


class GoogleTokenError(Exception):
    """The token did not prove a Google identity we can accept."""


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    given_name: str | None
    family_name: str | None


# (raw token) -> signing key. Injected in tests so the suite never reaches
# Google; the default fetches and caches Google's rotating public keys.
KeyResolver = Callable[[str], object]

_jwks_client: jwt.PyJWKClient | None = None


def _google_signing_key(token: str) -> object:
    global _jwks_client
    if _jwks_client is None:
        # Keys are cached for the life of the process and refetched when a
        # token names a kid we have not seen — which is how Google rotates.
        _jwks_client = jwt.PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True)
    try:
        return _jwks_client.get_signing_key_from_jwt(token).key
    except jwt.PyJWKClientError as exc:
        raise GoogleTokenError(str(exc)) from exc


def verify_google_id_token(
    token: str,
    *,
    client_id: str,
    nonce: str,
    key_resolver: KeyResolver = _google_signing_key,
) -> GoogleIdentity:
    try:
        claims = jwt.decode(
            token,
            key_resolver(token),
            algorithms=["RS256"],
            audience=client_id,
            issuer=GOOGLE_ISSUERS,
            options={"require": ["exp", "iat", "sub", "aud", "iss"]},
        )
    except jwt.PyJWTError as exc:
        raise GoogleTokenError(str(exc)) from exc

    token_nonce = claims.get("nonce")
    if not isinstance(token_nonce, str) or not hmac.compare_digest(token_nonce, nonce):
        raise GoogleTokenError("nonce mismatch")

    email = claims.get("email")
    # Google sends a real boolean today; the string form appeared in older
    # tokens, and accepting it costs nothing.
    if not isinstance(email, str) or claims.get("email_verified") not in (
        True,
        "true",
    ):
        raise GoogleTokenError("email not verified")

    return GoogleIdentity(
        sub=str(claims["sub"]),
        email=email.strip().lower(),
        given_name=claims.get("given_name"),
        family_name=claims.get("family_name"),
    )
