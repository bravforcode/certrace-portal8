/* ════════════════════════════════════════════════════════════
   CBAM REGISTRY DATA EXPORT (XML)

   Pre-flight validation + XML generation for the exporter's data handoff.
   The structure mirrors the field set of the official CBAM communication
   template (Annex IV, Implementing Regulation (EU) 2023/1773) and the shape
   of the Registry's quarterly-report schema — one <ImportedGood> block per
   good with commodity code, installation, produced measure, emissions,
   carbon price, verification and supporting documents.

   ⚠️ The definitive-period XSD has not been published in final form; the
   namespace below is a Certrace placeholder and must be pinned to the
   official schema the moment the Commission publishes it. Everything else —
   field names, code lists, validation rules — follows the published rules.

   Validation encodes the REAL definitive-period rules (same rulebook as
   lib/compliance-engine.ts):
   • Default values ARE permitted — with a year-on-year markup — so they are
     a warning (cost), not an error, EXCEPT on complex goods where actual
     data must cover ≥80% of embedded emissions (the 20% cap). Our data
     model carries one method per product, so "default" on a complex good
     means 0% actual → hard error.
   • "Actual" methodology requires an accredited verification statement in
     the definitive period → missing verification on an actual claim = error.
   • Installation name / address / coordinates are required; UN/LOCODE is
     optional in the official template → warning only.
   ════════════════════════════════════════════════════════════ */

import { Declaration } from "./data";
import { ReviewSubmission } from "./exporter-review";
import { valueKey } from "./supplier";
import { isComplexGood, isElectrolysisGood } from "./config";
import { getOrgIdentity } from "./org";
import { parsePrecursors, precursorContribution } from "./precursors";

export type XmlValidationError = {
  supplierId: string;
  supplierName: string;
  issue: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  isValid: boolean; // no errors (warnings allowed)
  errors: XmlValidationError[];
};

/* Origin countries the app currently ships → ISO 3166-1 alpha-2. The supplier
   form stores the display name; the Registry wants the code. */
const COUNTRY_ISO: Record<string, string> = {
  Thailand: "TH",
  Vietnam: "VN",
  Indonesia: "ID",
  Malaysia: "MY",
  TH: "TH",
  VN: "VN",
  ID: "ID",
  MY: "MY",
};
const isoCountry = (nameOrCode: string): string => COUNTRY_ISO[nameOrCode] ?? nameOrCode.slice(0, 2).toUpperCase();

/** Pre-flight validation against CBAM definitive-period rules. */
export function validateForRegistry(decl: Declaration, submissions: ReviewSubmission[]): ValidationResult {
  const errors: XmlValidationError[] = [];
  const push = (sub: ReviewSubmission, issue: string, severity: "error" | "warning") =>
    errors.push({ supplierId: sub.supplier.id, supplierName: sub.supplier.name, issue, severity });

  // Declaration-level: the communication must be addressable to a named EU
  // buyer whose declarant files it. Wizard-created CBAM declarations carry
  // this; legacy fixtures degrade to a warning so old demos keep working.
  if (decl.kind !== "buyer" && !decl.buyer?.eori?.trim()) {
    errors.push({
      supplierId: "",
      supplierName: "Declaration",
      issue: decl.buyer
        ? "EU buyer is missing an EORI number — the declarant cannot be matched in the Registry."
        : "No EU buyer / importer on this declaration — add the buyer (name, EORI, email) so the communication can reach their declarant.",
      severity: decl.requests ? "error" : "warning",
    });
  }

  for (const sub of submissions) {
    if (!sub.submitted) continue;

    // Installation identification (required by the communication template)
    if (!sub.values[valueKey("inst-name")]?.trim()) push(sub, "Missing installation name.", "error");
    if (!sub.values[valueKey("inst-address")]?.trim()) push(sub, "Missing installation address.", "error");
    if (!sub.values[valueKey("inst-coords")]?.trim()) push(sub, "Missing geographic coordinates of the main emission source.", "error");
    if (!sub.values[valueKey("inst-unlocode")]?.trim()) push(sub, "UN/LOCODE not provided (optional, but speeds up Registry matching).", "warning");

    const verification = (sub.values[valueKey("verification")] ?? "").trim();

    for (const rp of sub.request.products) {
      const pid = rp.product.id;
      const method = sub.values[valueKey("method", pid)];
      const total = Number(sub.values[valueKey("total-emissions", pid)]);
      const direct = Number(sub.values[valueKey("direct-emissions", pid)]);
      const indirect = Number(sub.values[valueKey("indirect-emissions", pid)]);

      if (!Number.isFinite(total) || total <= 0) {
        push(sub, `Missing or invalid total embedded emissions for ${rp.product.name}.`, "error");
      } else if (Number.isFinite(direct) && Number.isFinite(indirect)) {
        // total = own direct + own indirect + precursor contribution (complex goods)
        const prec = isComplexGood(rp.product) ? precursorContribution(sub.values[valueKey("precursors", pid)]) : 0;
        if (Math.abs(total - (direct + indirect + prec)) > 0.05) {
          push(sub, `Total embedded emissions ≠ own emissions + precursor contribution for ${rp.product.name}.`, "error");
        }
      }

      if (method === "default") {
        if (isComplexGood(rp.product)) {
          push(
            sub,
            `${rp.product.name} is a complex good reported entirely on default values — actual data must cover at least 80% of embedded emissions (the 20% default-value cap).`,
            "error",
          );
        } else {
          push(sub, `${rp.product.name} uses default values — permitted, but the current-year markup applies and raises the buyer's CBAM cost.`, "warning");
        }
      }

      if (method === "actual" && !verification) {
        push(sub, `${rp.product.name} claims actual-value methodology with no accredited verification statement — required in the definitive period.`, "error");
      }

      if (isComplexGood(rp.product)) {
        const rawPrec = sub.values[valueKey("precursors", pid)];
        if (!rawPrec?.trim()) {
          push(sub, `${rp.product.name} is a complex good but reports no precursor embedded emissions.`, method === "default" ? "warning" : "error");
        } else if (parsePrecursors(rawPrec) === null) {
          push(sub, `${rp.product.name}'s precursors are free text — restructure into quantity × embedded-emissions rows so the Registry can read them.`, "warning");
        }
      }

      // Aluminium goods must carry the electricity data that justifies the
      // indirect figure — collected as required fields, so absence is a gap.
      if (rp.product.category === "Aluminium") {
        if (!sub.values[valueKey("elec-consumed", pid)]?.trim()) push(sub, `${rp.product.name} is missing electricity consumption (MWh/t).`, "error");
        if (!sub.values[valueKey("elec-factor", pid)]?.trim()) push(sub, `${rp.product.name} is missing the electricity emission factor & source.`, "error");
      }
    }

    // Required evidence must actually be attached before the data goes out.
    for (const d of sub.request.documents) {
      if (d.required && sub.docs[d.id]?.status !== "uploaded") {
        push(sub, `Required document not attached: ${d.label}.`, "error");
      }
    }
  }

  return {
    isValid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
  };
}

const escapeXml = (unsafe: string) =>
  (unsafe || "").replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });

/** Registry wants CN codes without display spacing: "7208 39 00" → "72083900". */
const cnCompact = (cn: string) => cn.replace(/\s+/g, "");

/**
 * Builds the CBAM Registry data XML from the exporter's approved submissions.
 * One <ImportedGood> per supplier × product, numbered sequentially, mirroring
 * the communication-template field set.
 */
export function buildCbamXml(decl: Declaration, submissions: ReviewSubmission[]): string {
  const now = new Date().toISOString();
  const submitted = submissions.filter((s) => s.submitted);
  const reportId = `CTR-${decl.id.toUpperCase()}`;

  const L: string[] = [];
  const line = (depth: number, s: string) => L.push(`${"  ".repeat(depth)}${s}`);

  const org = getOrgIdentity();

  line(0, `<?xml version="1.0" encoding="UTF-8"?>`);
  line(0, `<!-- Generated by Certrace. Field set mirrors the CBAM communication template`);
  line(0, `     (Annex IV, Implementing Regulation (EU) 2023/1773). Namespace is a placeholder`);
  line(0, `     until the Commission publishes the final definitive-period XSD. -->`);
  line(0, `<CBAMEmissionsCommunication xmlns="urn:certrace:cbam:communication:v2" generatedAt="${now}">`);

  /* ── Header ── */
  line(1, `<Header>`);
  line(2, `<ReportId>${escapeXml(reportId)}</ReportId>`);
  if (decl.periodStart && decl.periodEnd) {
    line(2, `<ReportingPeriod start="${escapeXml(decl.periodStart)}" end="${escapeXml(decl.periodEnd)}">${escapeXml(decl.period)}</ReportingPeriod>`);
  } else {
    line(2, `<ReportingPeriod>${escapeXml(decl.period)}</ReportingPeriod>`);
  }
  line(2, `<IssuedAt>${now}</IssuedAt>`);
  line(1, `</Header>`);

  /* ── Operator (the exporter communicating the data — NOT the declarant;
        only the EU importer's Authorised CBAM Declarant files the declaration).
        Identity comes from the live org profile, never a fixture. ── */
  line(1, `<Operator role="ThirdCountryOperator">`);
  line(2, `<Name>${escapeXml(org.name)}</Name>`);
  line(2, `<CountryCode>${escapeXml(isoCountry(org.origin))}</CountryCode>`);
  line(2, `<OperatorReference>${escapeXml(org.installationId)}</OperatorReference>`);
  line(1, `</Operator>`);

  /* ── The EU buyer whose Authorised CBAM Declarant files this data ── */
  if (decl.buyer) {
    line(1, `<Declarant role="EUImporter">`);
    line(2, `<Name>${escapeXml(decl.buyer.name)}</Name>`);
    line(2, `<EORI>${escapeXml(decl.buyer.eori)}</EORI>`);
    if (decl.buyer.email?.trim()) line(2, `<Contact>${escapeXml(decl.buyer.email)}</Contact>`);
    line(1, `</Declarant>`);
  }

  /* ── Goods ── */
  line(1, `<ImportedGoodsList>`);
  let item = 0;
  for (const sub of submitted) {
    const instName = sub.values[valueKey("inst-name")] ?? "";
    const instCountry = sub.values[valueKey("inst-country")] ?? "";
    const instAddress = sub.values[valueKey("inst-address")] ?? "";
    const instUnlocode = sub.values[valueKey("inst-unlocode")] ?? "";
    const instCoords = sub.values[valueKey("inst-coords")] ?? "";
    const carbonPrice = sub.values[valueKey("carbon-price")] ?? "0";
    const carbonPriceForm = sub.values[valueKey("carbon-price-form")] ?? "";
    const verification = sub.values[valueKey("verification")] ?? "";
    const latest = sub.versions[sub.versions.length - 1];

    for (const rp of sub.request.products) {
      const pid = rp.product.id;
      item++;
      const direct = sub.values[valueKey("direct-emissions", pid)] || "0";
      const indirect = sub.values[valueKey("indirect-emissions", pid)] || "0";
      const total = sub.values[valueKey("total-emissions", pid)] || String(Number(direct) + Number(indirect));
      const method = sub.values[valueKey("method", pid)] || "actual";
      const route = sub.values[valueKey("process-route", pid)] ?? "";
      const precursors = sub.values[valueKey("precursors", pid)] ?? "";
      const precursorRoute = sub.values[valueKey("precursor-route", pid)] ?? "";

      line(2, `<ImportedGood itemNumber="${item}">`);
      line(3, `<CommodityCode>`);
      line(4, `<CnCode>${escapeXml(cnCompact(rp.product.cnCode))}</CnCode>`);
      line(4, `<HsHeading>${escapeXml(rp.product.hsCode)}</HsHeading>`);
      line(4, `<Description>${escapeXml(rp.product.name)}</Description>`);
      line(4, `<AggregatedGoodsCategory>${escapeXml(`${rp.product.category} — ${rp.product.group}`)}</AggregatedGoodsCategory>`);
      line(3, `</CommodityCode>`);
      line(3, `<OriginCountry>${escapeXml(isoCountry(instCountry || sub.supplier.country))}</OriginCountry>`);
      line(3, `<ProducedMeasure unit="tonnes">${rp.totalTonnes}</ProducedMeasure>`);

      line(3, `<Installation>`);
      line(4, `<Name>${escapeXml(instName)}</Name>`);
      line(4, `<Address>${escapeXml(instAddress)}</Address>`);
      line(4, `<CountryCode>${escapeXml(isoCountry(instCountry || sub.supplier.country))}</CountryCode>`);
      if (instUnlocode.trim()) line(4, `<UnLocode>${escapeXml(instUnlocode)}</UnLocode>`);
      line(4, `<Coordinates>${escapeXml(instCoords)}</Coordinates>`);
      line(3, `</Installation>`);

      if (route.trim()) line(3, `<ProductionRoute>${escapeXml(route)}</ProductionRoute>`);

      line(3, `<GoodsEmissions>`);
      line(4, `<SpecificDirectEmissions unit="tCO2e/t" scope="ownProcess">${escapeXml(String(direct))}</SpecificDirectEmissions>`);
      line(4, `<SpecificIndirectEmissions unit="tCO2e/t" scope="ownProcess">${escapeXml(String(indirect))}</SpecificIndirectEmissions>`);
      line(4, `<SpecificTotalEmbeddedEmissions unit="tCO2e/t">${escapeXml(String(total))}</SpecificTotalEmbeddedEmissions>`);
      line(4, `<DeterminationMethod>${escapeXml(method === "default" ? "DefaultValues" : "ActualData")}</DeterminationMethod>`);
      line(3, `</GoodsEmissions>`);

      /* Electricity — justifies the indirect figure (required for aluminium). */
      const elecConsumed = sub.values[valueKey("elec-consumed", pid)] ?? "";
      const elecFactor = sub.values[valueKey("elec-factor", pid)] ?? "";
      const alProcess = sub.values[valueKey("al-process", pid)] ?? "";
      if (elecConsumed.trim() || elecFactor.trim() || alProcess.trim()) {
        line(3, `<Electricity>`);
        if (elecConsumed.trim()) line(4, `<Consumed unit="MWh/t">${escapeXml(elecConsumed)}</Consumed>`);
        if (elecFactor.trim()) line(4, `<EmissionFactorSource>${escapeXml(elecFactor)}</EmissionFactorSource>`);
        if (alProcess.trim() && isElectrolysisGood(rp.product)) line(4, `<ElectrolysisTechnology>${escapeXml(alProcess === "soderberg" ? "Soderberg" : "Prebake")}</ElectrolysisTechnology>`);
        line(3, `</Electricity>`);
      }

      /* Precursors — structured rows when available; legacy prose falls back
         to the description element so old submissions stay readable. */
      if (precursors.trim()) {
        const rows = parsePrecursors(precursors);
        line(3, `<Precursors>`);
        if (rows) {
          for (const r of rows) {
            if (!r.name.trim()) continue;
            line(4, `<Precursor>`);
            line(5, `<Name>${escapeXml(r.name)}</Name>`);
            if (r.cn.trim()) line(5, `<CnCode>${escapeXml(cnCompact(r.cn))}</CnCode>`);
            line(5, `<QuantityPerTonne unit="t/t">${escapeXml(r.qty || "0")}</QuantityPerTonne>`);
            line(5, `<SpecificEmbeddedEmissions unit="tCO2e/t">${escapeXml(r.see || "0")}</SpecificEmbeddedEmissions>`);
            if (r.route.trim()) line(5, `<ProductionRoute>${escapeXml(r.route)}</ProductionRoute>`);
            line(4, `</Precursor>`);
          }
        } else {
          line(4, `<EmbeddedEmissionsDescription>${escapeXml(precursors)}</EmbeddedEmissionsDescription>`);
        }
        if (precursorRoute.trim()) line(4, `<ProductionRoutes>${escapeXml(precursorRoute)}</ProductionRoutes>`);
        line(3, `</Precursors>`);
      }

      const cpCurrency = (sub.values[valueKey("carbon-price-currency")] || "THB").toUpperCase() === "EUR" ? "EUR" : "THB";
      line(3, `<CarbonPriceDue>`);
      line(4, `<CountryCode>${escapeXml(isoCountry(instCountry || sub.supplier.country))}</CountryCode>`);
      line(4, `<AmountPaid currency="${cpCurrency}" basis="per tCO2e">${escapeXml(carbonPrice || "0")}</AmountPaid>`);
      if (carbonPriceForm.trim()) line(4, `<TypeOfInstrument>${escapeXml(carbonPriceForm)}</TypeOfInstrument>`);
      line(3, `</CarbonPriceDue>`);

      if (verification.trim()) {
        line(3, `<Verification>`);
        line(4, `<VerifierDetails>${escapeXml(verification)}</VerifierDetails>`);
        line(3, `</Verification>`);
      }

      const uploaded = sub.request.documents.filter((d) => sub.docs[d.id]?.status === "uploaded");
      if (uploaded.length) {
        line(3, `<SupportingDocuments>`);
        for (const d of uploaded) {
          const files = sub.docs[d.id]?.files ?? [];
          line(4, `<Document type="${escapeXml(d.label)}">${escapeXml(files.map((f) => f.name).join("; ") || "attached")}</Document>`);
        }
        line(3, `</SupportingDocuments>`);
      }

      if (latest) {
        line(3, `<SubmissionSignature>`);
        line(4, `<SignedBy>${escapeXml(latest.signedBy ?? "")}</SignedBy>`);
        line(4, `<Role>${escapeXml(latest.signedRole ?? "")}</Role>`);
        line(4, `<SubmittedAt>${new Date(latest.submittedAt).toISOString()}</SubmittedAt>`);
        line(4, `<Version>${latest.n}</Version>`);
        line(3, `</SubmissionSignature>`);
      }

      line(2, `</ImportedGood>`);
    }
  }
  line(1, `</ImportedGoodsList>`);
  line(0, `</CBAMEmissionsCommunication>`);

  return L.join("\n") + "\n";
}
