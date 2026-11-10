# Numbered report inputs → proposed relational storage

> Implementation note: this is the original conceptual proposal. See [the implemented persistence model](IMPLEMENTATION.md) and [actual columns](IMPLEMENTED-COLUMNS.md) for the executable schema and its differences.

**Design only.** This maps all 218 references from `docs/CBAM-NUMBERED-INPUT-STRUCTURE.md` to the proposed `reporting` schema in [reporting-3nf.sql](reporting-3nf.sql). No tables have been added to the application database.

Tables below use the `reporting` schema unless explicitly qualified with `public`. Names after a table name refer to columns on that table. Arrows mean foreign-key joins. A repeated input has its own child row; it is never an array inside a report column. Report-owned keys are scoped by `revision_id`. Each revision belongs to exactly one installation/year report.

`NULL` means unanswered. Zero means a measured zero. Not applicable is recorded in the appropriate `*_topic_decisions` table with a reason. Those decision tables contain applicability only; the answers go into the domain tables below. Historical company/installation facts are pinned by version foreign keys.

| Input | Field/capability | Proposed table and column(s) |
|---|---|---|
| 0.1 | Operator legal name | organization_versions.legal_name |
| 0.2 | Operator registration number | organization_versions.registration_number |
| 0.3 | Operator legal address in English | organization_versions.legal_address_english |
| 0.4 | Country of establishment | organization_versions.country_code |
| 0.5 | Company contact name, email and phone | organization_contacts.name, email, telephone (primary contact) |
| 0.6 | Person responsible for monitoring/reporting | monitoring_responsibilities.contact_id, job_title, responsibilities → organization_contacts |
| 0.7 | Operator-to-installation and exporter-to-operator relationship | organization_relationships.from_version_id, to_version_id, relationship_type, explanation; installation_versions.operator_version_id, operator_relationship_basis |
| 1.1 | Installation name in English | installation_versions.name_english |
| 1.2 | Installation local name | installation_versions.name_local |
| 1.3 | Installation reference | installations.reference |
| 1.4 | Street and number | installation_versions.street |
| 1.5 | Post code | installation_versions.postcode |
| 1.6 | P.O. Box | installation_versions.po_box |
| 1.7 | City | installation_versions.city |
| 1.8 | Country | installation_versions.country_code |
| 1.9 | UN/LOCODE | installation_versions.unlocode |
| 1.10 | Main emissions source latitude | installation_versions.latitude |
| 1.11 | Main emissions source longitude | installation_versions.longitude |
| 1.12 | Economic activity | installation_versions.economic_activity |
| 1.13 | Authorised representative name | installation_versions.representative_contact_id → organization_contacts.name |
| 1.14 | Contact email | installation_versions.representative_contact_id → organization_contacts.email |
| 1.15 | Telephone | installation_versions.representative_contact_id → organization_contacts.telephone |
| 1.16 | Other goods: name | installation_other_goods.name |
| 1.17 | Other goods: description | installation_other_goods.description |
| 1.18 | CBAM Registry installation ID, if assigned | installation_versions.registry_installation_id |
| 1.19 | Whether the installation operated in the reporting year | report_revisions.operated |
| 1.20 | New-installation status and actual monitoring duration in months | report_revisions.is_new_installation, operation_start, actual_monitoring_months |
| 2.0.1 | Reporting year | annual_reports.reporting_year |
| 2.0.2 | Monitoring period start | report_revisions.monitoring_start |
| 2.0.3 | Monitoring period end | report_revisions.monitoring_end |
| 2.0.4 | Effective dates of process, route and boundary changes | process_changes.process_key, effective_on, description, explanation |
| 2.0.5 | Control-system changes and effective dates | control_system_changes.effective_on, description, explanation |
| 2.1.1 | Production process name | production_processes.name |
| 2.1.2 | Production routes / technology | process_routes.route_code → production_routes; good_routes.route_code |
| 2.1.3 | Production steps in order | process_steps.position, description |
| 2.1.4 | Product name | report_goods.name |
| 2.1.5 | Exact product CN code | report_goods.cn_code |
| 2.1.6 | Product description | report_goods.description |
| 2.1.7 | Product output / functional unit | report_goods.output_unit |
| 2.1.8 | Applicable benchmark / method reference | report_goods.benchmark_method_reference |
| 2.1.9 | Other inputs / source streams | monitored_sources.name, description; source_process_links |
| 2.1.10 | Additional monitored flow types | planned_additional_flows.flow_kind |
| 2.1.11 | CBAM or non-CBAM process classification | production_processes.cbam_classification |
| 2.1.12 | Product simple/complex classification and emissions boundary | report_goods.complexity, emissions_boundary, requires_indirect, indirect_legal_basis |
| 2.1.13 | Product-to-route and equipment links | good_routes; good_equipment → equipment |
| 2.1.14 | Same-process joint-production treatment | joint_production_rules.explanation, evidence_key |
| 2.1.15 | Main reducing agent | steel_parameters.reducing_agent |
| 2.1.16 | Steel mill identification number | steel_parameters.steel_mill_identifier |
| 2.1.17 | Manganese composition (%) | steel_parameters.manganese_pct |
| 2.1.18 | Chromium composition (%) | steel_parameters.chromium_pct |
| 2.1.19 | Nickel composition (%) | steel_parameters.nickel_pct |
| 2.1.20 | Other alloying elements (%) | steel_parameters.other_alloys_pct |
| 2.1.21 | Other materials (%) | steel_parameters.other_materials_pct |
| 2.1.22 | Carbon composition (%) | steel_parameters.carbon_pct |
| 2.1.23 | Tonnes scrap per tonne steel | steel_parameters.scrap_tonnes_per_tonne |
| 2.1.24 | Pre-consumer scrap (%) | steel_parameters.pre_consumer_scrap_pct |
| 2.1.25 | Sector parameters stored separately for every good/composition | good_compositions → steel_parameters / numeric_sector_observations / text_sector_observations; composition_evidence |
| 2.1.26 | Additional applicable Annex IV section 2 sector parameters | sector_parameter_definitions; numeric_sector_observations.value / text_sector_observations.value; composition_evidence |
| 2.2.1 | Boundary description | monitoring_plans.boundary_description |
| 2.2.2 | Processes inside the boundary, in order | production_processes.boundary_status; process_steps.position |
| 2.2.3 | Excluded process | production_processes.boundary_status (excluded) |
| 2.2.4 | Ground for exclusion | production_processes.exclusion_ground |
| 2.2.5 | Exclusion explanation | production_processes.exclusion_explanation |
| 2.2.6 | Direct emissions method | monitoring_plans.direct_method; source_stream_methods.calculation_formula |
| 2.2.7 | Fuel types / other fuel description | fuel_sources.fuel_type_code, other_description |
| 2.2.8 | Confirmation no fuel is burned inside the boundary | monitoring_plans.no_combustion |
| 2.2.9 | Electricity supply type / other supply description | electricity_sources.supply_type, other_description |
| 2.2.10 | Electricity metering point | electricity_sources.metering_point |
| 2.2.11 | Instrument parameter measured | instruments.parameter_measured |
| 2.2.12 | Instrument make, model and tag | instruments.make, model, tag |
| 2.2.13 | Reading frequency / other frequency description | instruments.reading_frequency, other_frequency |
| 2.2.14 | Last calibration date | instrument_calibrations.calibrated_on (latest is queried) |
| 2.2.15 | CEMS calibration reference | instrument_calibrations.reference |
| 2.2.16 | CEMS measurement point location | instruments.measurement_location |
| 2.2.17 | Confirmation own-generation fuel is included | monitoring_plans.own_generation_fuel_included |
| 2.2.18 | Data gap start | data_gaps.starts_at |
| 2.2.19 | Data gap end | data_gaps.ends_at |
| 2.2.20 | Data gap reason | data_gaps.reason |
| 2.2.21 | Estimation method | data_gaps.estimation_method |
| 2.2.22 | Estimated share | data_gaps.estimated_share |
| 2.2.23 | Gap reviewer | data_gaps.reviewer_key → report_participants |
| 2.2.24 | Gap review date | data_gaps.reviewed_on |
| 2.2.25 | Quality assurance method | monitoring_plans.quality_assurance_method |
| 2.2.26 | Quality assurance reviewer | monitoring_plans.qa_reviewer → report_participants |
| 2.2.27 | Quality assurance review frequency | monitoring_plans.qa_review_frequency |
| 2.2.28 | Installation diagram original file | monitoring_plans.diagram_evidence_key → evidence_items → document_versions → file_objects.bytes |
| 2.2.29 | Monitoring plan version/effective date record | monitoring_plan_changes.version_label, effective_on, evidence_key |
| 2.2.30 | Source streams linked to individual processes | monitored_sources; source_process_links |
| 2.2.31 | Calculation formula, factor provenance, sampling/lab method | source_stream_methods.calculation_formula, factor_provenance, sampling_method, laboratory_method, evidence_key |
| 2.2.32 | Instrument uncertainty and complete calibration history | instruments.uncertainty_pct; instrument_calibrations |
| 2.2.33 | CEMS greenhouse gases and monitored source identities | cems_source_gases.gas_code, monitoring_basis; monitored_sources; source_process_links |
| 2.2.34 | Zero-rated fuel qualification method | fuel_sources.zero_rating_qualification, qualification_evidence_key |
| 2.2.35 | Heat, waste-gas and CO2 transfer/allocation methods | transfer_methods.flow_kind, explanation, evidence_key |
| 2.2.36 | Indirect electricity actual/default method and eligibility basis | electricity_sources.method, eligibility_basis, eligibility_evidence_key |
| 2.2.37 | Own-generation CHP/separate and fossil/renewable classification | electricity_sources.generation_type, energy_type; source_process_links |
| 2.2.38 | Direct/indirect allocation method by process | good_allocation_rules.direct_share, indirect_share, method, evidence_key (process comes from report_goods) |
| 2.2.39 | Specific embedded free-allocation method by good | free_allocation_methods.method, benchmark_factor_id, cbam_factor_id, cscf_factor_id, evidence_key → regulatory_factors |
| 2.3.1 | Production quantity for the original product | production_outputs.quantity, physical_tonnes (one row for the original good) |
| 2.3.2 | Output quantity by process/product | production_outputs.good_key, quantity → report_goods.process_key |
| 2.3.3 | Production route for the output | production_outputs.route_code |
| 2.3.4 | Confirmation no output this month | report_months.no_production |
| 2.3.5 | Reason for zero production | report_months.no_production_reason |
| 2.3.6 | Confirmation no fuel burned | report_months.no_fuel |
| 2.3.7 | Confirmation no electricity consumed | report_months.no_electricity |
| 2.3.8 | Fuel type | source_readings.source_key → fuel_sources.fuel_type_code |
| 2.3.9 | Fuel quantity actually burned | fuel_readings.burned_quantity |
| 2.3.10 | Fuel quantity unit | fuel_readings.quantity_unit |
| 2.3.11 | Net calorific value | fuel_readings.net_calorific_value, ncv_unit |
| 2.3.12 | Fuel emission factor | fuel_readings.emission_factor OR regulatory_factor_id → regulatory_factors.value |
| 2.3.13 | Fuel factor source | fuel_readings.observed_factor_source OR regulatory_factor_id → regulatory_factors.source_reference |
| 2.3.14 | Biomass fraction | fuel_readings.biomass_fraction, biomass_qualification_evidence_key |
| 2.3.15 | Fuel used for own electricity generation | fuel_readings.used_for_own_generation |
| 2.3.16 | Electricity source type | source_readings.source_key → electricity_sources.supply_type |
| 2.3.17 | Electricity consumed per source (MWh) | electricity_readings.consumed_mwh |
| 2.3.18 | Electricity emission factor per source | electricity_readings.actual_emission_factor OR regulatory_factor_id → regulatory_factors.value; own-generation factor is calculated |
| 2.3.19 | Process-emissions method | material_readings.method |
| 2.3.20 | Process-emissions material | source_readings.source_key → material_sources.material_code |
| 2.3.21 | Process-emissions material quantity | material_readings.quantity_tonnes |
| 2.3.22 | Process-emissions conversion factor | material_readings.conversion_factor |
| 2.3.23 | Monthly notes | report_months.notes |
| 2.3.24 | Other monitored flow quantity | other_monitored_flows.quantity |
| 2.3.25 | Other monitored flow unit | other_monitored_flows.unit_code |
| 2.3.26 | Other monitored flow production process | other_monitored_flows.process_key |
| 2.3.27 | Other flow source / receiving installation | other_monitored_flows.counterpart_installation_version_id |
| 2.3.28 | Other flow measurement / calculation reference | other_monitored_flows.measurement_reference |
| 2.3.29 | Non-CBAM goods output per process | non_cbam_outputs.process_key, name, cn_code, tonnes |
| 2.3.30 | Output split across multiple routes for one good | production_outputs.good_key, route_code, composition_key, quantity, physical_tonnes |
| 2.3.31 | Physical tonnes and conversion to a different functional unit | production_outputs.physical_tonnes; functional_unit_conversions.units_per_tonne, evidence_key |
| 2.3.32 | Stock movements, receipts, returns, waste and off-spec output | material_balances.opening_tonnes, received_tonnes, returned_tonnes, closing_tonnes, waste_tonnes, off_spec_tonnes, evidence_key |
| 2.3.33 | Fuel/material source-stream and consuming-process links | source_process_allocations.reading_key, process_key, share |
| 2.3.34 | Variable carbon content and oxidation factor by stream | measured_carbon_factors.carbon_content, oxidation_factor, evidence_key |
| 2.3.35 | CEMS readings by source/gas, intervals, flow and concentration | cems_intervals.reading_key, gas_code, starts_at, ends_at, volumetric_flow, flow_unit, concentration, concentration_unit, gwp_release_id, evidence_key |
| 2.3.36 | Electricity supplier installation and country per source | electricity_sources.supplier_version_id, producer_installation_version_id → organization_versions / installation_versions.country_code |
| 2.3.37 | Electricity consumption by production process and relevant good | electricity_good_usage.reading_key, good_key, mwh (process derived from good) |
| 2.3.38 | On-site electricity produced, used and exported separately | generation_balances.used_mwh, exported_mwh; generation_performance.net_generation_mwh (produced) |
| 2.3.39 | Gross generation, own use, net generation and CHP efficiencies | generation_balances.gross_generation_mwh, auxiliary_use_mwh, fuel_input_gj, useful_heat_gj; generation_performance efficiencies |
| 2.3.40 | PPA identity, contract and factor evidence | power_purchase_agreements.contract_reference, starts_on, ends_on, evidence_key |
| 2.3.41 | Heat and waste-gas import/production/use/export separately per process | transfer_balances.month, process_key, flow_kind, imported, produced, used, exported, unit_code, counterpart_version_id, evidence_key |
| 2.3.42 | Heat factors and their sources | transfer_factors.factor, unit_code, source_reference, evidence_key |
| 2.3.43 | CO2 captured/received/transferred: quantity, purpose and recipient contact | co2_transfers.direction, tonnes, purpose, recipient_contact_id, evidence_key → organization_contacts / organization_versions |
| 2.3.44 | Data gaps linked to affected source readings | gap_reading_replacements.gap_key, reading_key, replacement_explanation, basis, evidence_key → data_gaps |
| 2.3.45 | Other-method emissions and supporting activity data | other_method_readings.method, activity_quantity, activity_unit, factor, factor_unit, evidence_key |
| 2.4.1 | CBAM precursor catalogue selection | precursor_products.id selected through the appropriate precursor source subtype |
| 2.4.2 | Precursor name | precursor_products.name (external sources); report_goods.name (internal sources) |
| 2.4.3 | Exact precursor CN code | precursor_products.cn_code (external); report_goods.cn_code (internal) |
| 2.4.4 | Country of production | producer_reports.installation_version_id OR default_precursor_sources / scrap_precursor_sources.producer_installation_version_id → installation_versions.country_code |
| 2.4.5 | Producer legal name | producing installation version → operator_version_id → organization_versions.legal_name |
| 2.4.6 | Producing installation | producing installation version → installation_versions.name_english |
| 2.4.7 | Producer Registry installation ID, if assigned | producing installation version → installation_versions.registry_installation_id |
| 2.4.8 | Producer production route / technology | producer_report_goods.route_code; default_precursor_sources.default_factor_id → public.default_emission_factors.route; internal source → process_routes |
| 2.4.9 | Producer reporting period start | producer_reports.period_start |
| 2.4.10 | Producer reporting period end | producer_reports.period_end |
| 2.4.11 | Products using this precursor, grouped by process | precursor_consuming_goods.good_key → report_goods.process_key |
| 2.4.12 | Emissions basis: producer report or official EU default | precursor_sources.source_kind; actual_precursor_sources / default_precursor_sources / internal_precursor_sources / scrap_precursor_sources |
| 2.4.13 | Published EU default and source reference | default_precursor_sources.default_factor_id → public.default_emission_factors |
| 2.4.14 | Producer verification report file | producer_reports.verification_report_id → verification_reports.document_version_id → file_objects |
| 2.4.15 | Verified direct specific emissions | producer_report_goods.direct_specific_emissions |
| 2.4.16 | Verified indirect specific emissions, if applicable | producer_report_goods.indirect_specific_emissions, indirect_applicable |
| 2.4.17 | Total specific emissions | producer_good_emissions.total_specific_emissions (derived) |
| 2.4.18 | Verification coverage start | verification_reports.coverage_start |
| 2.4.19 | Verification coverage end | verification_reports.coverage_end |
| 2.4.20 | Verifier name | verification_reports.accreditation_id → verifier_accreditations.verifier_version_id → organization_versions.legal_name |
| 2.4.21 | Accreditation number | verifier_accreditations.accreditation_number |
| 2.4.22 | Accreditation issuing country | verifier_accreditations.issuing_country |
| 2.4.23 | Verification sectoral scope | accreditation_scopes.sector_code |
| 2.4.24 | Verification report issue date | verification_reports.document_version_id → document_versions.issued_on |
| 2.4.25 | Accreditation expiry date | verifier_accreditations.expires_on |
| 2.4.26 | Tonnes actually used by month and consuming process | precursor_monthly_use.month, process_key, used_tonnes |
| 2.4.27 | Internal/external production status and internal producing process | precursor_sources.source_kind; internal_precursor_sources.producing_good_key → report_goods.process_key |
| 2.4.28 | Internal precursor produced/used by installation and consuming process | internal_precursor_output.produced_tonnes; internal_precursor_good_use.used_tonnes, month, good_key (process derived) |
| 2.4.29 | Same-process exclusion treatment | precursor_exclusions.process_key, explanation, evidence_key |
| 2.4.30 | Producer period basis: default period or actual production time | producer_reports.period_basis, period_explanation (two separate columns) |
| 2.4.31 | Source/period quantities and Article 14 combination/subset method | precursor_combination_groups.method, name, explanation; precursor_combination_members.source_key, period_start, period_end, tonnes, evidence_key |
| 2.4.32 | Supplier distinct from producer, source location and receipts | precursor_sources.supplier_version_id; precursor_receipts.supplier_version_id, location, received_on, received_tonnes, evidence_key |
| 2.4.33 | Precursor category / complex-good status | precursor_products.category, complexity; internal sources → report_goods.complexity |
| 2.4.34 | Upstream references retained from the producer report | precursor_report_references.reference, page_reference, evidence_key |
| 2.5.1 | Original document file; sample documents use the same review flow | file_objects.bytes; document_versions.original_filename, file_object_id |
| 2.5.2 | Document type | documents.document_type |
| 2.5.3 | Month covered / annual scope | evidence_items.month (NULL = annual) |
| 2.5.4 | Linked evidence checklist row | evidence_checklist_bindings.checklist_code |
| 2.5.5 | Review extracted values and units before accepting | extraction_candidates.proposed_text, proposed_unit, confidence, review_status, reviewed_by, reviewed_at |
| 2.5.6 | Confirm replacement of previously entered values | extraction_candidates.replacement_confirmed |
| 2.5.7 | Document owner, issue date, version and expiry controls | documents.owner_organization_id; document_versions.issued_on, version_no, expires_on |
| 2.5.8 | Document disclosure choice (server access enforcement not implemented) | evidence_disclosures.audience, explanation; evidence_access_grants for actual access |
| 2.5.9 | Evidence actually sent to the verifier, date and report version | evidence_deliveries.recipient_contact_id, sent_at; report revision through evidence_items |
| 2.5.10 | Precursor report accreditation/validity review decision | producer_report_reviews.decision, reviewer_key, reviewed_on, explanation, evidence_key |
| 2.5.11 | Stored original installation diagram linked to the monitoring plan | monitoring_plans.diagram_evidence_key; monitoring_plan_changes.version_label, evidence_key → document_versions → file_objects |
| 2.6.1 | Installation and individual-process direct emissions totals | calculation_process_results.direct_emissions; installation total is SUM by run |
| 2.6.2 | Applicable installation/process indirect emissions | calculation_process_results.indirect_emissions; installation total is SUM by run |
| 2.6.3 | Process activity levels and attributed emissions | calculation_process_results.activity_level, direct_emissions, indirect_emissions |
| 2.6.4 | Specific direct emissions per good, composition and functional unit | calculation_good_results.direct_specific_emissions; calculation_composition_results.direct_specific_emissions; unit from report_goods |
| 2.6.5 | Specific indirect emissions per applicable good | calculation_good_results.indirect_specific_emissions; calculation_composition_results.indirect_specific_emissions |
| 2.6.6 | Default-value share and actual/default indirect shares | calculation_good_results.default_share, actual_indirect_share; default indirect share derived |
| 2.6.7 | Combined electricity factor and actual/PPA factor result | calculation_source_results.combined_electricity_factor |
| 2.6.8 | Heat, waste-gas and electricity balances by process | Calculated from transfer_balances, generation_balances, electricity_good_usage; findings in calculation_findings |
| 2.6.9 | Combined precursor intensities across sources/periods | calculation_precursor_results.combined_direct_intensity, combined_indirect_intensity |
| 2.6.10 | Specific embedded free allocation per good | calculation_good_results.specific_embedded_free_allocation |
| 2.6.11 | Five largest goods, fuels, process materials and CEMS sources | Rank queries over production_outputs, fuel_readings, material_readings, cems_intervals / calculation_source_results; no duplicated top-five table |
| 2.6.12 | Allocation, route totals, units and double-counting checks | calculation_findings.input_reference, severity, code, message |
| 2.6.13 | Precursor use year and annual quantity derived from monthly use | annual_precursor_use.used_tonnes; year from annual_reports |
| 2.6.14 | Data-quality statement: fully monitored or default values used | Derived from confirmed methodology, source basis, measured/default contributions and calculation_findings; rendered in report_outputs |
| 2.7.1 | Operator sign-off name | report_signoffs.signer_key → report_participants.name |
| 2.7.2 | Operator sign-off job title | report_signoffs.signer_key → report_participants.job_title |
| 2.7.3 | Actual indirect-electricity criteria confirmation | indirect_electricity_confirmations.criteria_met, evidence_sent, evidence_key |
| 2.7.4 | Imported-electricity direct-connection / emissions criteria confirmation | imported_electricity_confirmations.direct_connection_met, emissions_criteria_met, evidence_sent, evidence_key |
| 2.7.5 | Declarant name and EORI, for the conditional electricity addendum | electricity_declarants.organization_version_id, eori → organization_versions.legal_name |
| 2.7.6 | Addendum actual-value criteria and evidence-submission confirmation | electricity_addenda.ppa_criteria_met, nomination_met, congestion_met, evidence_sent; addendum_evidence |
| 2.7.7 | Eligible electricity imported by that declarant from the installation | electricity_addenda.eligible_imported_mwh; addendum_evidence |
| 2.7.8 | Applicable addenda sent to the verifier | addendum_deliveries.sent_at, recipient_contact_id (version from revision_id) |
| 2.7.9 | OER final dataset/report review (review dataset; finished EU report layout not implemented) | annual_reviews (output_kind=oer).reviewer_key, reviewed_on, reviewed; report_outputs |
| 2.7.10 | OSER final dataset/report review, benchmark/method confirmation (review dataset; finished EU report layout not implemented) | annual_reviews (output_kind=oser).reviewer_key, reviewed_on, reviewed, benchmarks_confirmed; report_outputs |
| 2.7.11 | Dedicated verifier-report attachment and findings workflow | annual_verification_reports → verification_reports; verification_findings; finding_responses; finding_status_events |
| 2.7.12 | Annual submissions, correction history and report versions | report_revisions.revision_no, correction_reason, supersedes_revision_id; report_submissions; report_outputs |
| 2.7.13 | Carbon price paid per tonne CO2e (additional existing input) | carbon_price_claims.amount_per_tonne, currency |
| 2.7.14 | Carbon-price instrument (additional existing input) | carbon_price_claims.instrument |
| 2.7.15 | Share of emissions covered by carbon price (additional existing input) | carbon_price_claims.emissions_covered_pct |
| 2.7.16 | Rebates/free allocation against carbon-price claim (additional existing input) | carbon_price_adjustments.adjustment_kind, description, amount, unit_code |
| 2.7.17 | Carbon-price receipt (additional existing input) | carbon_price_evidence → evidence_items → document_versions → file_objects |

## How this differs from the current stores

- `account_records.value` is replaced by the tables above for operational report inputs.
- `certrace:report-inputs:v1` is split by meaning: for example, CEMS readings go to `cems_intervals`, contracts to `power_purchase_agreements`, and document deliveries to `evidence_deliveries`.
- `certrace:workspace-mmd-draft` becomes `monitoring_plans` and its related process, instrument, source, and gap tables.
- `certrace:monthly-data` becomes `report_months`, `production_outputs`, `source_readings`, and typed reading subtypes.
- `certrace:precursor-suppliers` becomes precursor sources/subtypes, reusable producer reports, source-to-good links, receipts, and monthly use.
- Section 2.6 remains calculated. Persisted run results refer to a frozen revision and record engine/regulatory versions. Draft calculations may be returned without persisting a run.
- JSON/PDF exports can be stored as immutable files through `report_outputs`; they do not become editable input storage.

The existing `2.4.30` form has two fields named `basis`. The implementation must split them into the period-basis choice and an explanation. The design uses `producer_reports.period_basis` and `producer_reports.period_explanation`.
