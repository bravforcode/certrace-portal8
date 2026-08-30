"""FastAPI router for authentication and password management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from app.models.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    change_user_password,
    request_password_reset,
    reset_user_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/change-password", response_model=AuthResponse)
def change_password(payload: ChangePasswordRequest, request: Request) -> AuthResponse:
    """Endpoint for changing a user's password."""
    db = getattr(request.app.state, "database", None)
    success, message = change_user_password(
        db=db,
        email=payload.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return AuthResponse(success=True, message=message)


@router.post("/forgot-password", response_model=AuthResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request) -> AuthResponse:
    """Endpoint for requesting a password reset verification token."""
    db = getattr(request.app.state, "database", None)
    success, message, token = request_password_reset(db=db, email=payload.email)
    return AuthResponse(success=True, message=message, reset_token=token)


@router.post("/reset-password", response_model=AuthResponse)
def reset_password(payload: ResetPasswordRequest, request: Request) -> AuthResponse:
    """Endpoint for verifying reset token and setting a new password."""
    db = getattr(request.app.state, "database", None)
    success, message = reset_user_password(
        db=db,
        email=payload.email,
        reset_token=payload.reset_token,
        new_password=payload.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return AuthResponse(success=True, message=message)
