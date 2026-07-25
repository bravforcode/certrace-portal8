"""Liveness and readiness routes."""

from fastapi import APIRouter, HTTPException, Request

from app.config import REGULATORY_DATA_VERSION, SERVICE_NAME

router = APIRouter()


@router.get("/", include_in_schema=False)
async def service_status(request: Request) -> dict[str, object]:
    return {
        "service": SERVICE_NAME,
        "status": "ok",
        "ready": True,
        "databaseConfigured": request.app.state.database is not None,
        "regulatoryDataVersion": REGULATORY_DATA_VERSION,
    }


@router.get("/healthz")
async def health() -> dict[str, object]:
    return {"service": SERVICE_NAME, "status": "alive", "ready": True}


@router.get("/readyz")
async def readiness(request: Request) -> dict[str, object]:
    database = request.app.state.database
    if database is not None and not database.ping():
        raise HTTPException(status_code=503, detail={"code": "database_not_ready"})
    return {
        "service": SERVICE_NAME,
        "status": "ready",
        "ready": True,
        "databaseConfigured": database is not None,
    }
