"""Calculation API routes."""

from fastapi import APIRouter, HTTPException, Request

from app.models.calculation import CalculationRequest
from app.services.errors import CalculationError
from app.services.mrv_engine import calculate_mrv

router = APIRouter(prefix="/api/v1", tags=["calculations"])


@router.post("/calculate")
async def calculate(request: CalculationRequest, http_request: Request) -> dict[str, object]:
    try:
        database = http_request.app.state.database
        return calculate_mrv(request, database.lookup_default_factor if database is not None else None)
    except CalculationError as exc:
        raise HTTPException(status_code=422, detail={"code": exc.code, "message": exc.message}) from exc
