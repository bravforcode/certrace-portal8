"""Security utilities for password hashing and verification."""

from __future__ import annotations

import hashlib
import secrets


def hash_password(password: str) -> str:
    """Hash password using SHA-256 to match database user seed hashes."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plain text password against a stored SHA-256 hash."""
    return secrets.compare_digest(hash_password(plain_password), password_hash)


def generate_reset_token() -> str:
    """Generate a secure 6-digit verification code for password reset."""
    return f"{secrets.randbelow(900000) + 100000}"
