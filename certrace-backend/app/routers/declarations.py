"""Declaration draft API routes."""

from fastapi import APIRouter, HTTPException, Request

from app.models.calculation import DeclarationInput
from app.services.errors import CalculationError
from app.services.mrv_engine import calculate_mrv

router = APIRouter(prefix="/api/v1/declarations", tags=["declarations"])


@router.post("", status_code=201)
async def create_declaration(
    request: DeclarationInput, http_request: Request
) -> dict[str, object]:
    database = http_request.app.state.database
    try:
        calculation = calculate_mrv(
            request.calculation,
            database.lookup_default_factor if database is not None else None,
        )
    except CalculationError as exc:
        raise HTTPException(
            status_code=422, detail={"code": exc.code, "message": exc.message}
        ) from exc
    if database is not None:
        return database.create_declaration(request, calculation)
    declaration_id = f"decl_{len(http_request.app.state.declarations) + 1:06d}"
    record = {
        "id": declaration_id,
        "declarantName": request.declarant_name,
        "cnCode": request.cn_code,
        "reportingYear": request.reporting_year,
        "status": "DRAFT_CALCULATION_PREVIEW",
        "calculation": calculation,
    }
    http_request.app.state.declarations[declaration_id] = record
    return record


@router.get("")
async def list_declarations(request: Request) -> dict[str, object]:
    database = request.app.state.database
    return {
        "declarations": database.list_declarations()
        if database is not None
        else list(request.app.state.declarations.values())
    }


@router.get("/{declaration_id}")
async def get_declaration(declaration_id: str, request: Request) -> dict[str, object]:
    database = request.app.state.database
    record = (
        database.get_declaration(declaration_id)
        if database is not None
        else request.app.state.declarations.get(declaration_id)
    )
    if record is None:
        raise HTTPException(status_code=404, detail={"code": "DECLARATION_NOT_FOUND"})
    return record
