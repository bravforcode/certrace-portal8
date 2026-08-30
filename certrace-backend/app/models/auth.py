"""Pydantic models for authentication and password management."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str = Field(..., min_length=4, description="Verification token received via email/system")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")


class AuthResponse(BaseModel):
    success: bool
    message: str
    reset_token: str | None = None
