import { Declaration, ORG } from "./data";
import { ReviewSubmission } from "./exporter-review";
import { valueKey } from "./supplier";

export type XmlValidationError = {
  supplierId: string;
  supplierName: string;
  issue: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  isValid: boolean;
  errors: XmlValidationError[];
};

/**
 * Pre-flight validation against CBAM Definitive Period requirements.
 * Ensures the data is registry-ready before XML generation.
 */
export function validateForRegistry(decl: Declaration, submissions: ReviewSubmission[]): ValidationResult {
  const errors: XmlValidationError[] = [];

  for (const sub of submissions) {
    if (!sub.submitted) continue;

    // Check Installation Data
    const instName = sub.values[valueKey("inst-name")];
    const unlocode = sub.values[valueKey("inst-unlocode")];
    const coords = sub.values[valueKey("inst-coords")];
    const address = sub.values[valueKey("inst-address")];

    if (!instName || instName.trim() === "") {
      errors.push({
        supplierId: sub.supplier.id,
        supplierName: sub.supplier.name,
        issue: "Missing Installation Name.",
        severity: "error",
      });
    }

    if (!unlocode || unlocode.trim() === "") {
      errors.push({
        supplierId: sub.supplier.id,
        supplierName: sub.supplier.name,
        issue: "Missing UN/LOCODE.",
        severity: "error",
      });
    }

    if (!coords || coords.trim() === "") {
      errors.push({
        supplierId: sub.supplier.id,
        supplierName: sub.supplier.name,
        issue: "Missing Geographic Coordinates.",
        severity: "error",
      });
    }

    if (!address || address.trim() === "") {
      errors.push({
        supplierId: sub.supplier.id,
        supplierName: sub.supplier.name,
        issue: "Missing Installation Address.",
        severity: "error",
      });
    }

    // Check Goods & Emissions Data
    for (const rp of sub.request.products) {
      const pid = rp.product.id;
      const method = sub.values[valueKey("method", pid)];
      const totalEmissions = sub.values[valueKey("total-emissions", pid)];

      // Definitive period rule: no default values allowed for total emissions
      if (method === "default") {
        errors.push({
          supplierId: sub.supplier.id,
          supplierName: sub.supplier.name,
          issue: `Default emission method used for product ${rp.product.name}. This is not permitted in the definitive period.`,
          severity: "error",
        });
      }

      if (!totalEmissions || Number(totalEmissions) < 0) {
        errors.push({
          supplierId: sub.supplier.id,
          supplierName: sub.supplier.name,
          issue: `Invalid or missing total emissions for product ${rp.product.name}.`,
          severity: "error",
        });
      }
    }
  }

  return {
    isValid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
  };
}

/**
 * Builds a formatted XML string mapping the certrace state to the CBAM Registry structure.
 */
export function buildCbamXml(decl: Declaration, submissions: ReviewSubmission[]): string {
  // We use string building instead of a heavy DOM parser to keep the bundle small for edge deployments.
  const escapeXml = (unsafe: string) =>
    (unsafe || "").replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<CBAMDeclaration xmlns="urn:eu:taxud:cbam:v1">\n`;
  xml += `  <DeclarationHeader>\n`;
  xml += `    <DeclarationID>${escapeXml(decl.id)}</DeclarationID>\n`;
  xml += `    <ReportingPeriod>${escapeXml(decl.period)}</ReportingPeriod>\n`;
  xml += `    <Declarant>\n`;
  xml += `      <Name>${escapeXml(ORG.name)}</Name>\n`;
  xml += `      <CountryCode>${escapeXml(ORG.origin)}</CountryCode>\n`;
  xml += `    </Declarant>\n`;
  xml += `  </DeclarationHeader>\n`;

  xml += `  <GoodsImported>\n`;
  for (const sub of submissions) {
    if (!sub.submitted) continue;

    for (const rp of sub.request.products) {
      const pid = rp.product.id;
      const cnCode = rp.product.cnCode;
      const quantity = rp.totalTonnes;
      const direct = sub.values[valueKey("direct-emissions", pid)] || "0";
      const indirect = sub.values[valueKey("indirect-emissions", pid)] || "0";
      const method = sub.values[valueKey("method", pid)] || "actual";
      
      const instName = sub.values[valueKey("inst-name")];
      const instCountry = sub.values[valueKey("inst-country")];
      const instUnlocode = sub.values[valueKey("inst-unlocode")];
      const instCoords = sub.values[valueKey("inst-coords")];
      const instAddress = sub.values[valueKey("inst-address")];
      const carbonPrice = sub.values[valueKey("carbon-price")];
      const carbonPriceForm = sub.values[valueKey("carbon-price-form")];
      const verification = sub.values[valueKey("verification")];
      const precursors = sub.values[valueKey("precursors", pid)];
      const precursorRoute = sub.values[valueKey("precursor-route", pid)];

      xml += `    <GoodItem>\n`;
      xml += `      <CNCode>${escapeXml(cnCode)}</CNCode>\n`;
      xml += `      <Quantity unit="tonnes">${quantity}</Quantity>\n`;
      xml += `      <Installation>\n`;
      xml += `        <Name>${escapeXml(instName)}</Name>\n`;
      xml += `        <Address>${escapeXml(instAddress)}</Address>\n`;
      xml += `        <CountryCode>${escapeXml(instCountry === "Thailand" ? "TH" : instCountry)}</CountryCode>\n`;
      xml += `        <UNLOCODE>${escapeXml(instUnlocode)}</UNLOCODE>\n`;
      xml += `        <Coordinates>${escapeXml(instCoords)}</Coordinates>\n`;
      xml += `      </Installation>\n`;
      xml += `      <Emissions>\n`;
      xml += `        <DirectEmissions>${escapeXml(String(direct))}</DirectEmissions>\n`;
      xml += `        <IndirectEmissions>${escapeXml(String(indirect))}</IndirectEmissions>\n`;
      xml += `        <DeterminationMethod>${escapeXml(method)}</DeterminationMethod>\n`;
      xml += `      </Emissions>\n`;
      
      if (precursors && precursors.trim() !== "") {
        xml += `      <Precursors>\n`;
        xml += `        <Description>${escapeXml(precursors)}</Description>\n`;
        if (precursorRoute) {
          xml += `        <ProductionRoute>${escapeXml(precursorRoute)}</ProductionRoute>\n`;
        }
        xml += `      </Precursors>\n`;
      }

      if (carbonPrice && carbonPrice !== "0") {
        xml += `      <CarbonPriceDue>\n`;
        xml += `        <AmountPaid>${escapeXml(carbonPrice)}</AmountPaid>\n`;
        if (carbonPriceForm) {
          xml += `        <LegalForm>${escapeXml(carbonPriceForm)}</LegalForm>\n`;
        }
        xml += `      </CarbonPriceDue>\n`;
      }

      if (verification && verification.trim() !== "") {
        xml += `      <Verification>\n`;
        xml += `        <VerifierDetails>${escapeXml(verification)}</VerifierDetails>\n`;
        xml += `      </Verification>\n`;
      }
      xml += `    </GoodItem>\n`;
    }
  }
  xml += `  </GoodsImported>\n`;
  xml += `</CBAMDeclaration>\n`;

  return xml;
}
