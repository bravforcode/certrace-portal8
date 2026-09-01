"""Pydantic models for authentication and password management."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# The portal knows which language the person is reading in; the backend does
# not store it. Accepted as free text rather than an enum so an unfamiliar tag
# ("th-TH", "en-GB") falls back to English instead of failing validation on
# what is only a presentation choice -- see email_templates.normalize_locale.
def _locale_field() -> object:
    return Field(
        default=None,
        max_length=16,
        description="Language for the notification email, e.g. 'en' or 'th'.",
    )


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    locale: str | None = _locale_field()
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(
        ..., min_length=8, description="New password (minimum 8 characters)"
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    locale: str | None = _locale_field()


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    locale: str | None = _locale_field()
    reset_token: str = Field(
        ..., min_length=4, description="Verification code received by email"
    )
    new_password: str = Field(
        ..., min_length=8, description="New password (minimum 8 characters)"
    )


class AuthResponse(BaseModel):
    """Deliberately carries no reset token.

    The code goes to the mailbox and nowhere else. A field here would be read
    by whoever called the endpoint, which is the one party we have not yet
    proved owns the address.
    """

    success: bool
    message: str
