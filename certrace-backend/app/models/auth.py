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


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        ..., min_length=8, description="Password (minimum 8 characters)"
    )
    first_name: str | None = Field(default=None, max_length=200, alias="firstName")
    last_name: str | None = Field(default=None, max_length=200, alias="lastName")
    company_name: str | None = Field(default=None, max_length=200, alias="companyName")

    # The portal sends camelCase for these three; the password endpoints that
    # predate the contract send snake_case. Accepting both by alias keeps one
    # model instead of two shapes for the same account.
    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class GoogleSignInRequest(BaseModel):
    """What the portal brings back from Google's redirect.

    ``nonce`` is the value the portal generated before sending the browser to
    Google; the token must carry the same one (see google_identity).
    """

    id_token: str = Field(..., min_length=20, max_length=8192, alias="idToken")
    nonce: str = Field(..., min_length=16, max_length=256)

    model_config = {"populate_by_name": True}


class AuthUser(BaseModel):
    """The account as the portal renders it.

    ``onboarded`` decides whether a signup lands on /onboarding, so it is read
    from storage on every /me rather than carried in the token, where it would
    keep reporting the value it had at sign-in until the token expired.
    """

    id: str
    email: EmailStr
    onboarded: bool
    first_name: str | None = Field(default=None, serialization_alias="firstName")
    last_name: str | None = Field(default=None, serialization_alias="lastName")
    company_name: str | None = Field(default=None, serialization_alias="companyName")
    google_linked: bool = Field(default=False, serialization_alias="googleLinked")


class SessionResponse(BaseModel):
    access_token: str = Field(..., serialization_alias="accessToken")
    refresh_token: str = Field(..., serialization_alias="refreshToken")
    user: AuthUser


class RefreshRequest(BaseModel):
    """Body for /refresh and /logout — the refresh token IS the credential."""

    refresh_token: str = Field(..., min_length=16, alias="refreshToken")

    model_config = {"populate_by_name": True}


class MeResponse(BaseModel):
    user: AuthUser


class AuthResponse(BaseModel):
    """Deliberately carries no reset token.

    The code goes to the mailbox and nowhere else. A field here would be read
    by whoever called the endpoint, which is the one party we have not yet
    proved owns the address.
    """

    success: bool
    message: str


class ChangePasswordResponse(AuthResponse):
    """A changed password ends every session the account had, including the
    one that asked. The caller already proved the current password, so it
    gets a fresh pair here instead of being signed out within the hour."""

    access_token: str = Field(..., serialization_alias="accessToken")
    refresh_token: str = Field(..., serialization_alias="refreshToken")
