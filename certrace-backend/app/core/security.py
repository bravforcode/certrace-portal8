"""Security utilities for password hashing and verification."""

from __future__ import annotations

import hashlib
import hmac
import secrets

# PBKDF2-HMAC-SHA256. A bare digest is the wrong tool for a password: it is
# built to be fast, which is exactly what a cracker wants. Stored as
# ``pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>`` so the work factor can
# be raised later without invalidating the hashes already written.
_ALGORITHM = "pbkdf2_sha256"
_ITERATIONS = 600_000
_SALT_BYTES = 16


def _derive(password: str, salt: bytes, iterations: int) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    ).hex()


def hash_password(password: str) -> str:
    """Hash a password with a fresh random salt."""
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = _derive(password, salt, _ITERATIONS)
    return f"{_ALGORITHM}${_ITERATIONS}${salt.hex()}${digest}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plain text password against a stored hash."""
    try:
        algorithm, raw_iterations, salt_hex, digest = password_hash.split("$", 3)
        if algorithm != _ALGORITHM:
            return False
        iterations = int(raw_iterations)
        salt = bytes.fromhex(salt_hex)
    except (AttributeError, ValueError):
        return False

    candidate = _derive(plain_password, salt, iterations)
    return hmac.compare_digest(candidate, digest)


def generate_reset_token() -> str:
    """Generate a secure 6-digit verification code for password reset."""
    return f"{secrets.randbelow(900000) + 100000}"
