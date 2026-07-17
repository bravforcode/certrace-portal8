# CBAM definitive-period readiness

Status: engineering and workflow basis for the 2026 steel/aluminium readiness increment. This is not legal advice, an accredited verification opinion, or evidence that Certrace can file with the CBAM Registry.

Research reviewed: 15 July 2026

## Authoritative sources

- [Regulation (EU) 2023/956 establishing CBAM](https://eur-lex.europa.eu/eli/reg/2023/956/oj)
- [Regulation (EU) 2025/2083 simplifying and strengthening CBAM](https://eur-lex.europa.eu/eli/reg/2025/2083/oj)
- [Implementing Regulation (EU) 2025/2546 on verification principles](https://eur-lex.europa.eu/eli/reg_impl/2025/2546/oj)
- [Implementing Regulation (EU) 2025/2547 on embedded-emissions calculation methods](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/oj)
- [Delegated Regulation (EU) 2025/2551 on verifier accreditation](https://eur-lex.europa.eu/eli/reg_del/2025/2551/oj)
- [Implementing Regulation (EU) 2025/2620 on the free-allocation adjustment](https://eur-lex.europa.eu/eli/reg_impl/2025/2620/oj)
- [Implementing Regulation (EU) 2025/2621 establishing default values](https://eur-lex.europa.eu/eli/reg_impl/2025/2621/oj)
- [Commission CBAM certificate prices](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en)
- [Commission CBAM Registry and O3CI guidance](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-registry-and-reporting_en)
- [Commission CBAM verification guidance](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-verification_en)

The regulation text controls where this note, Commission guidance, fixtures, or code comments differ.

## Real actor and reporting workflow

1. A non-EU installation operator defines installation boundaries and an annual monitoring plan, then records production processes/routes, activity levels, source streams or CEMS, energy and heat flows, precursor data, and aluminium PFC emissions where applicable.
2. A trader that did not produce the goods cannot manufacture installation data. It requests the data from the actual producer and preserves the producer/installation reference.
3. Actual embedded-emissions data is calculated for the applicable reporting period and verified under the definitive-period verification rules by an accredited verifier. A typed name, local approval, checksum, or AI check is not verification.
4. The operator can register and disclose installation/emissions information through the Commission's non-EU operator module (O3CI). The documented public workflow uses EU Login and Registry screens. Certrace has no approved public write API or XML schema for automating that action, so this increment provides only a manual-entry mapping/checklist.
5. The EU importer or indirect customs representative aggregates all relevant imports. The 50-tonne test is cumulative net mass per importer and calendar year across the mass-based sectors, not per supplier request, shipment, or Certrace declaration. Electricity and hydrogen are outside that mass-threshold treatment.
6. The authorised CBAM declarant submits an annual declaration and surrenders certificates. For goods imported in 2026, the first annual declaration is due 30 September 2027.

## Definitive-period decisions encoded by this increment

| Subject | Required treatment |
| --- | --- |
| Reporting period | Annual installation/operator data; no quarterly transitional workflow claim. |
| Product scope | Versioned steel/aluminium CN rules with effective dates and explicit qualifying parameters. An unmatched code remains unmatched. |
| Quantities | Commercial shipment/import quantity is separate from installation production activity used for allocation. |
| Precursors | An actual complex-good calculation may include precursors reported with verified actual values and one or more precursors using applicable defaults. The former transitional 20% cap is not applied. |
| Default values | Use the applicable country/product/route value from Regulation 2025/2621 and its effective year column. The published tables incorporate 10% for 2026, 20% for 2027, and 30% from 2028 for the applicable steel/aluminium rows; values are subject to regulatory revision. |
| Verification | `actual` is a calculation method; `verified` is a legal/readiness status gated by an in-scope accredited-verifier report. |
| Certificate prices | Effective-dated official values only. As reviewed, Q1 2026 is EUR 75.36 and Q2 2026 is EUR 75.28; unpublished quarters return unavailable, never EUR 82 or another proxy. |
| Plant MRV | The supplier workflow now collects method-specific calculation streams, mass-balance entries, CEMS, electricity, measurable heat, CHP, waste-gas allocations and primary-aluminium PFC inputs. Each product is assigned to an installation, monitoring plan and production process. |
| Calculations | Decimal strings, typed units, explicit formula/version/evidence traces, and deterministic validation. The active workflow assembles a structurally closed `MrvReportDraft`; AI output remains advisory only. |
| Outputs | Draft calculation/report previews and a manual handoff worksheet. A local checksum detects local changes but is not a trusted seal or signature. |

## Workflow gaps this increment deliberately exposes

The current repository has no authoritative identity, tenant authorization, database, notification service, private evidence store, malware scanner, immutable event store, trusted signing/timestamp service, official O3CI write integration, or accredited-verifier integration. Browser state therefore cannot support cross-device supplier links, prove delivery, preserve evidence, enforce retention, establish an audit chain, or prove legal filing. Traders can be identified and prevented from attesting an upstream operator's actual data, but a real upstream-forwarding workflow also remains backend-dependent.

These are production blockers, not user-training issues. The UI must keep the related actions unavailable or explicitly demo-only until the missing services exist.

## Review requirement

The deterministic tests demonstrate software behavior against independently written fixtures. They do not certify the regulatory interpretation or fixture values. Certrace's ESG Compliance Specialist must review the calculation fixtures and source mappings, and an accredited verifier must verify each real operator's actual-value package before any real output is labelled verified.
