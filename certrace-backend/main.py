from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(
    title="Certrace Carbon Compliance API",
    description="Backend calculation and compliance engine for EU CBAM & sustainability regulations",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to exporter portal domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SupplierRow(BaseModel):
    id: str
    name: str
    material: str
    emissions: Optional[float] = None
    productionRoute: Optional[str] = "N/A"

class CalculationRequest(BaseModel):
    suppliers: List[SupplierRow]
    carbon_price_paid_thb: float = Field(default=0.0, description="Carbon price paid in Thailand in THB per tCO2e")
    cbam_certificate_price_eur: float = Field(default=80.0, description="Current market price of EU CBAM certificate in EUR")

class CalculationResponse(BaseModel):
    total_embedded_emissions: float
    carbon_price_deduction_eur: float
    deductible_certificates: float
    default_factors_count: int
    warnings: List[str]
    audit_ready: bool

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Certrace Compliance Engine"}

@app.post("/api/v1/calculate", response_model=CalculationResponse)
def calculate_emissions(req: CalculationRequest):
    total_emissions = 0.0
    default_count = 0
    warnings = []
    
    # Thailand to EUR exchange rate proxy (1 EUR = 38 THB)
    EXCHANGE_RATE = 38.0
    
    for supplier in req.suppliers:
        # Standard CBAM default factor proxy for steel products if actual data is missing
        if supplier.emissions is None:
            default_count += 1
            # Assigning a conservative default factor of 2.6 tCO2e/t
            supplier_emissions = 2.6
            warnings.append(f"Supplier '{supplier.name}' uses default factors for '{supplier.material}'. Actual data is required in 2026 definitive phase.")
        else:
            supplier_emissions = supplier.emissions
            
        total_emissions += supplier_emissions

    # Article 9 Carbon Price Deduction logic
    # Reduction = (Carbon price paid in origin EUR / CBAM certificate price EUR) * total_emissions
    carbon_price_paid_eur = req.carbon_price_paid_thb / EXCHANGE_RATE
    
    if carbon_price_paid_eur > 0:
        if carbon_price_paid_eur > req.cbam_certificate_price_eur:
            # Paid carbon price cannot deduct more than the certificate price itself
            effective_price = req.cbam_certificate_price_eur
        else:
            effective_price = carbon_price_paid_eur
            
        deductible_certificates = (effective_price / req.cbam_certificate_price_eur) * total_emissions
        carbon_price_deduction_eur = deductible_certificates * req.cbam_certificate_price_eur
    else:
        deductible_certificates = 0.0
        carbon_price_deduction_eur = 0.0
        
    # Check compliance rules
    # Audit ready is false if defaults are used for precursors (Steel billet/Pig iron) or if there are critical gaps
    audit_ready = (default_count == 0)

    if default_count > 0:
        warnings.append("Compliance Gap: Using default emission factors for critical precursors is restricted in the definitive phase.")

    return CalculationResponse(
        total_embedded_emissions=round(total_emissions, 2),
        carbon_price_deduction_eur=round(carbon_price_deduction_eur, 2),
        deductible_certificates=round(deductible_certificates, 2),
        default_factors_count=default_count,
        warnings=warnings,
        audit_ready=audit_ready
    )
