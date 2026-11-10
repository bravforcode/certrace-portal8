# Implemented report columns

> Historical typed-storage reference. Migration `202610270001_compact_reports` replaces the generated form tables with JSONB revision documents. Use [the compact schema guide](CERTRACE-V2-SCHEMA.md) for the active database. These mappings remain useful for historical migration checks and current document validation.


Generated from the executable input catalogue. Input rows are in `reporting`; shared identities and immutable profiles are in `masterdata`. `f_*` holds a report-specific value; `p_*` distinguishes an absent field from an explicitly provided value. Parent foreign keys identify the account revision, workspace/scope and repeated row.

| Input path | Table.column | Value type |
|---|---|---|
| certrace:workspaces[].id | workspace_profiles.f_id | string |
| certrace:workspaces[].installationId | masterdata.installations.external_reference (identity projection) (via workspace_profiles._installation_version_id) | string |
| certrace:workspaces[].installationName | masterdata.installation_versions.name (via workspace_profiles._installation_version_id) | string |
| certrace:workspaces[].productId | masterdata.products.external_reference (identity projection) (via workspace_profiles._product_version_id) | string |
| certrace:workspaces[].productName | masterdata.product_versions.name (via workspace_profiles._product_version_id) | string |
| certrace:workspaces[].cnCode | masterdata.product_versions.cn_code (via workspace_profiles._product_version_id) | string |
| certrace:workspaces[].productionRoute | workspace_profiles.f_productionRoute | string |
| certrace:workspaces[].year | masterdata.annual_reports.reporting_year (via workspace identity) | numeric |
| certrace:workspaces[].periodStart | workspace_profiles.f_periodStart | string |
| certrace:workspaces[].periodEnd | workspace_profiles.f_periodEnd | string |
| certrace:workspaces[].declarationIds[] | workspaces_rows_declaration_ids_rows.f__value | string |
| certrace:workspaces[].createdAt | workspace_profiles.f_createdAt | string |
| certrace:workspaces[].selfSupplied | masterdata.organizations.external_reference (identity projection) (via workspace_profiles._installation_version_id → operator_version_id) | boolean |
| certrace:workspaces[].supplierId | masterdata.organizations.external_reference (identity projection) (via workspace_profiles._installation_version_id → operator_version_id) | string |
| certrace:workspaces[].supplierName | masterdata.organization_versions.name (via workspace_profiles._installation_version_id → operator_version_id) | string |
| certrace:workspaces[].schedule.dueDay | workspaces_rows_schedule.f_dueDay | numeric |
| certrace:workspaces[].archivedAt | workspace_profiles.f_archivedAt | string |
| certrace:workspaces[].internalSignoff.name | workspaces_rows_internal_signoff.f_name | string |
| certrace:workspaces[].internalSignoff.role | workspaces_rows_internal_signoff.f_role | string |
| certrace:workspaces[].internalSignoff.at | workspaces_rows_internal_signoff.f_at | string |
| certrace:workspaces[].internalSignoff.note | workspaces_rows_internal_signoff.f_note | string |
| certrace:workspaces[].verifierSignoff.name | workspaces_rows_verifier_signoff.f_name | string |
| certrace:workspaces[].verifierSignoff.role | workspaces_rows_verifier_signoff.f_role | string |
| certrace:workspaces[].verifierSignoff.at | workspaces_rows_verifier_signoff.f_at | string |
| certrace:workspaces[].verifierSignoff.note | workspaces_rows_verifier_signoff.f_note | string |
| certrace:installations[].id | masterdata.installations.external_reference (identity projection) (via installation_profiles._installation_version_id) | string |
| certrace:installations[].name | masterdata.installation_versions.name (via installation_profiles._installation_version_id) | string |
| certrace:installations[].nameLocal | masterdata.installation_versions.name_local (via installation_profiles._installation_version_id) | string |
| certrace:installations[].self | masterdata.installations.external_reference (identity projection) (via installation_profiles._installation_version_id) | boolean |
| certrace:installations[].supplierId | masterdata.installations.external_reference (identity projection) (via installation_profiles._installation_version_id) | string |
| certrace:installations[].street | masterdata.installation_versions.street (via installation_profiles._installation_version_id) | string |
| certrace:installations[].economicActivity | masterdata.installation_versions.economic_activity (via installation_profiles._installation_version_id) | string |
| certrace:installations[].postcode | masterdata.installation_versions.postcode (via installation_profiles._installation_version_id) | string |
| certrace:installations[].poBox | masterdata.installation_versions.po_box (via installation_profiles._installation_version_id) | string |
| certrace:installations[].city | masterdata.installation_versions.city (via installation_profiles._installation_version_id) | string |
| certrace:installations[].country | masterdata.installation_versions.country (via installation_profiles._installation_version_id) | string |
| certrace:installations[].unlocode | masterdata.installation_versions.unlocode (via installation_profiles._installation_version_id) | string |
| certrace:installations[].lat | masterdata.installation_versions.latitude (via installation_profiles._installation_version_id) | string |
| certrace:installations[].lng | masterdata.installation_versions.longitude (via installation_profiles._installation_version_id) | string |
| certrace:installations[].contactName | masterdata.installation_versions.contact_name (via installation_profiles._installation_version_id) | string |
| certrace:installations[].contactEmail | masterdata.installation_versions.contact_email (via installation_profiles._installation_version_id) | string |
| certrace:installations[].contactPhone | masterdata.installation_versions.contact_phone (via installation_profiles._installation_version_id) | string |
| certrace:installations[].otherGoods[].name | installations_rows_other_goods_rows.f_name | string |
| certrace:installations[].otherGoods[].description | installations_rows_other_goods_rows.f_description | string |
| certrace:installations[].createdAt | installation_profiles.f_createdAt | string |
| certrace:supplier-companies[].id | masterdata.organizations.external_reference (identity projection) (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].name | masterdata.organization_versions.name (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].country | masterdata.organization_versions.country (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].contactName | masterdata.organization_versions.contact_name (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].contactEmail | masterdata.organization_versions.contact_email (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].contactPhone | masterdata.organization_versions.contact_phone (via supplier_company_profiles._operator_version_id) | string |
| certrace:supplier-companies[].createdAt | supplier_company_profiles.f_createdAt | string |
| certrace:workspace-drafts[].id | workspace_drafts_rows.f_id | string |
| certrace:workspace-drafts[].updatedAt | workspace_drafts_rows.f_updatedAt | numeric |
| certrace:workspace-drafts[].snapshot.installationId | workspace_drafts_rows_snapshot.f_installationId | string |
| certrace:workspace-drafts[].snapshot.installationName | workspace_drafts_rows_snapshot.f_installationName | string |
| certrace:workspace-drafts[].snapshot.isSelf | workspace_drafts_rows_snapshot.f_isSelf | boolean |
| certrace:workspace-drafts[].snapshot.supplierChoice | workspace_drafts_rows_snapshot.f_supplierChoice | string |
| certrace:workspace-drafts[].snapshot.supplierId | workspace_drafts_rows_snapshot.f_supplierId | string |
| certrace:workspace-drafts[].snapshot.productId | workspace_drafts_rows_snapshot.f_productId | string |
| certrace:workspace-drafts[].snapshot.route | workspace_drafts_rows_snapshot.f_route | string |
| certrace:workspace-drafts[].snapshot.year | workspace_drafts_rows_snapshot.f_year | numeric |
| certrace:workspace-drafts[].snapshot.dueDay | workspace_drafts_rows_snapshot.f_dueDay | numeric |
| certrace:workspace-drafts[].snapshot.requestDay | workspace_drafts_rows_snapshot.f_requestDay | numeric |
| certrace:workspace-drafts[].snapshot.dueAfterDays | workspace_drafts_rows_snapshot.f_dueAfterDays | numeric |
| certrace:workspace-drafts[].snapshot.step | workspace_drafts_rows_snapshot.f_step | numeric |
| certrace:workspace-drafts[].display.installationName | workspace_drafts_rows_display.f_installationName | string |
| certrace:workspace-drafts[].display.productName | workspace_drafts_rows_display.f_productName | string |
| certrace:workspace-drafts[].display.year | workspace_drafts_rows_display.f_year | numeric |
| certrace:workspace-drafts[].display.step | workspace_drafts_rows_display.f_step | numeric |
| certrace:workspace-drafts[].display.stepCount | workspace_drafts_rows_display.f_stepCount | numeric |
| certrace:workspace-mmd-draft[scope].inputPlan.operatorName | masterdata.organization_versions.name (via operator_reporting_plans._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.operatorRegistration | masterdata.organization_versions.registration (via operator_reporting_plans._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.operatorAddress | masterdata.organization_versions.address (via operator_reporting_plans._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.registryId | masterdata.installation_versions.registry_id (via operator_reporting_plans._installation_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.monitoringStart | operator_reporting_plans.f_monitoringStart | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].id | production_processes.f_id | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].name | production_processes.f_name | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].routes[] | process_routes.f__value | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].steps[] | process_steps.f__value | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].id | report_goods.f_id | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].name | masterdata.product_versions.name (via report_goods._product_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].cnCode | masterdata.product_versions.cn_code (via report_goods._product_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].description | masterdata.product_versions.description (via report_goods._product_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].unit | masterdata.product_versions.unit (via report_goods._product_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].products[].benchmark | masterdata.product_versions.benchmark (via report_goods._product_version_id) | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].precursorIds[] | workspace_mmd_draft_rows_input_plan_processes_row_efbfb89e.f__value | string |
| certrace:workspace-mmd-draft[scope].inputPlan.processes[].otherInputs[] | workspace_mmd_draft_rows_input_plan_processes_row_3c2afe84.f__value | string |
| certrace:workspace-mmd-draft[scope].inputPlan.additionalFlows[] | workspace_mmd_draft_rows_input_plan_additional_flows_rows.f__value | string |
| certrace:workspace-mmd-draft[scope].boundaryDescription | monitoring_plans.f_boundaryDescription | string |
| certrace:workspace-mmd-draft[scope].processesIncluded[] | workspace_mmd_draft_rows_processes_included_rows.f__value | string |
| certrace:workspace-mmd-draft[scope].exclusions[].id | workspace_mmd_draft_rows_exclusions_rows.f_id | string |
| certrace:workspace-mmd-draft[scope].exclusions[].process | workspace_mmd_draft_rows_exclusions_rows.f_process | string |
| certrace:workspace-mmd-draft[scope].exclusions[].ground | workspace_mmd_draft_rows_exclusions_rows.f_ground | string |
| certrace:workspace-mmd-draft[scope].exclusions[].groundOther | workspace_mmd_draft_rows_exclusions_rows.f_groundOther | string |
| certrace:workspace-mmd-draft[scope].exclusions[].note | workspace_mmd_draft_rows_exclusions_rows.f_note | string |
| certrace:workspace-mmd-draft[scope].periodStart | monitoring_plans.f_periodStart | string |
| certrace:workspace-mmd-draft[scope].periodEnd | monitoring_plans.f_periodEnd | string |
| certrace:workspace-mmd-draft[scope].directMethod | monitoring_plans.f_directMethod | string |
| certrace:workspace-mmd-draft[scope].fuelTypeIds[] | workspace_mmd_draft_rows_fuel_type_ids_rows.f__value | string |
| certrace:workspace-mmd-draft[scope].noCombustion | monitoring_plans.f_noCombustion | boolean |
| certrace:workspace-mmd-draft[scope].fuelTypesOther | monitoring_plans.f_fuelTypesOther | string |
| certrace:workspace-mmd-draft[scope].electricitySupply | monitoring_plans.f_electricitySupply | string |
| certrace:workspace-mmd-draft[scope].electricitySupplyOther | monitoring_plans.f_electricitySupplyOther | string |
| certrace:workspace-mmd-draft[scope].electricityMeteringPoint | monitoring_plans.f_electricityMeteringPoint | string |
| certrace:workspace-mmd-draft[scope].ownGenerationFuelDeclared | monitoring_plans.f_ownGenerationFuelDeclared | boolean |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].id | fuel_instruments.f_id | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].parameter | fuel_instruments.f_parameter | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].instrument | fuel_instruments.f_instrument | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].readingFrequency | fuel_instruments.f_readingFrequency | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].readingFrequencyOther | fuel_instruments.f_readingFrequencyOther | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].lastCalibration | fuel_instruments.f_lastCalibration | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].factorSource | fuel_instruments.f_factorSource | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].directMethod | fuel_instruments.f_directMethod | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].cemsCalibrationRef | fuel_instruments.f_cemsCalibrationRef | string |
| certrace:workspace-mmd-draft[scope].fuelInstruments[].measurementPointLocation | fuel_instruments.f_measurementPointLocation | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].id | electricity_instruments.f_id | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].parameter | electricity_instruments.f_parameter | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].instrument | electricity_instruments.f_instrument | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].readingFrequency | electricity_instruments.f_readingFrequency | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].readingFrequencyOther | electricity_instruments.f_readingFrequencyOther | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].lastCalibration | electricity_instruments.f_lastCalibration | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].factorSource | electricity_instruments.f_factorSource | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].directMethod | electricity_instruments.f_directMethod | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].cemsCalibrationRef | electricity_instruments.f_cemsCalibrationRef | string |
| certrace:workspace-mmd-draft[scope].electricityInstruments[].measurementPointLocation | electricity_instruments.f_measurementPointLocation | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].id | data_gaps.f_id | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].periodStart | data_gaps.f_periodStart | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].periodEnd | data_gaps.f_periodEnd | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].reason | data_gaps.f_reason | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].estimationMethod | data_gaps.f_estimationMethod | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].estimatedTCO2e | data_gaps.f_estimatedTCO2e | numeric |
| certrace:workspace-mmd-draft[scope].dataGaps[].reviewerName | data_gaps.f_reviewerName | string |
| certrace:workspace-mmd-draft[scope].dataGaps[].gapDate | data_gaps.f_gapDate | string |
| certrace:workspace-mmd-draft[scope].qualityAssurance | monitoring_plans.f_qualityAssurance | string |
| certrace:workspace-mmd-draft[scope].reviewerName | monitoring_plans.f_reviewerName | string |
| certrace:workspace-mmd-draft[scope].reviewFrequency | monitoring_plans.f_reviewFrequency | string |
| certrace:workspace-mmd-draft[scope].diagramFileName | monitoring_plans.f_diagramFileName | string |
| certrace:workspace-mmd-draft[scope].diagramFileId | monitoring_plans.f_diagramFileId | string |
| certrace:workspace-mmd-draft[scope].diagramDataUrl | monitoring_plans.f_diagramDataUrl | string |
| certrace:workspace-mmd-draft[scope].diagramCovers[] | workspace_mmd_draft_rows_diagram_covers_rows.f__value | number |
| certrace:workspace-mmd-draft[scope].sectorParameters.reducingAgent | steel_parameters.f_reducingAgent | string |
| certrace:workspace-mmd-draft[scope].sectorParameters.reducingAgentOther | steel_parameters.f_reducingAgentOther | string |
| certrace:workspace-mmd-draft[scope].sectorParameters.mnPct | steel_parameters.f_mnPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.crPct | steel_parameters.f_crPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.niPct | steel_parameters.f_niPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.otherAlloyingPct | steel_parameters.f_otherAlloyingPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.otherMaterialsPct | steel_parameters.f_otherMaterialsPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.steelMillId | steel_parameters.f_steelMillId | string |
| certrace:workspace-mmd-draft[scope].sectorParameters.carbonPct | steel_parameters.f_carbonPct | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.scrapTonnesPerTonneSteel | steel_parameters.f_scrapTonnesPerTonneSteel | numeric |
| certrace:workspace-mmd-draft[scope].sectorParameters.preConsumerScrapPct | steel_parameters.f_preConsumerScrapPct | numeric |
| certrace:workspace-mmd-versions[scope][].id | workspace_mmd_versions_rows_rows.f_id | string |
| certrace:workspace-mmd-versions[scope][].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:workspace-mmd-versions[scope][].n | workspace_mmd_versions_rows_rows.f_n | numeric |
| certrace:workspace-mmd-versions[scope][].finalisedAt | workspace_mmd_versions_rows_rows.f_finalisedAt | string |
| certrace:workspace-mmd-versions[scope][].author | workspace_mmd_versions_rows_rows.f_author | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.operatorName | masterdata.organization_versions.name (via workspace_mmd_versions_rows_rows_content_input_plan._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.operatorRegistration | masterdata.organization_versions.registration (via workspace_mmd_versions_rows_rows_content_input_plan._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.operatorAddress | masterdata.organization_versions.address (via workspace_mmd_versions_rows_rows_content_input_plan._installation_version_id → operator_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.registryId | masterdata.installation_versions.registry_id (via workspace_mmd_versions_rows_rows_content_input_plan._installation_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.monitoringStart | workspace_mmd_versions_rows_rows_content_input_plan.f_monitoringStart | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].id | workspace_mmd_versions_rows_rows_content_input_pl_2efa3d4f.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].name | workspace_mmd_versions_rows_rows_content_input_pl_2efa3d4f.f_name | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].routes[] | workspace_mmd_versions_rows_rows_content_input_pl_724fed64.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].steps[] | workspace_mmd_versions_rows_rows_content_input_pl_49b849be.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].id | workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].name | masterdata.product_versions.name (via workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb._product_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].cnCode | masterdata.product_versions.cn_code (via workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb._product_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].description | masterdata.product_versions.description (via workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb._product_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].unit | masterdata.product_versions.unit (via workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb._product_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].products[].benchmark | masterdata.product_versions.benchmark (via workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb._product_version_id) | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].precursorIds[] | workspace_mmd_versions_rows_rows_content_input_pl_5fd2b359.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.processes[].otherInputs[] | workspace_mmd_versions_rows_rows_content_input_pl_20877ba7.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.inputPlan.additionalFlows[] | workspace_mmd_versions_rows_rows_content_input_pl_638d945a.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.boundaryDescription | workspace_mmd_versions_rows_rows_content.f_boundaryDescription | string |
| certrace:workspace-mmd-versions[scope][].content.processesIncluded[] | workspace_mmd_versions_rows_rows_content_processe_bb0bb544.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.exclusions[].id | workspace_mmd_versions_rows_rows_content_exclusions_rows.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.exclusions[].process | workspace_mmd_versions_rows_rows_content_exclusions_rows.f_process | string |
| certrace:workspace-mmd-versions[scope][].content.exclusions[].ground | workspace_mmd_versions_rows_rows_content_exclusions_rows.f_ground | string |
| certrace:workspace-mmd-versions[scope][].content.exclusions[].groundOther | workspace_mmd_versions_rows_rows_content_exclusions_rows.f_groundOther | string |
| certrace:workspace-mmd-versions[scope][].content.exclusions[].note | workspace_mmd_versions_rows_rows_content_exclusions_rows.f_note | string |
| certrace:workspace-mmd-versions[scope][].content.periodStart | workspace_mmd_versions_rows_rows_content.f_periodStart | string |
| certrace:workspace-mmd-versions[scope][].content.periodEnd | workspace_mmd_versions_rows_rows_content.f_periodEnd | string |
| certrace:workspace-mmd-versions[scope][].content.directMethod | workspace_mmd_versions_rows_rows_content.f_directMethod | string |
| certrace:workspace-mmd-versions[scope][].content.fuelTypeIds[] | workspace_mmd_versions_rows_rows_content_fuel_typ_cd68406e.f__value | string |
| certrace:workspace-mmd-versions[scope][].content.noCombustion | workspace_mmd_versions_rows_rows_content.f_noCombustion | boolean |
| certrace:workspace-mmd-versions[scope][].content.fuelTypesOther | workspace_mmd_versions_rows_rows_content.f_fuelTypesOther | string |
| certrace:workspace-mmd-versions[scope][].content.electricitySupply | workspace_mmd_versions_rows_rows_content.f_electricitySupply | string |
| certrace:workspace-mmd-versions[scope][].content.electricitySupplyOther | workspace_mmd_versions_rows_rows_content.f_electricitySupplyOther | string |
| certrace:workspace-mmd-versions[scope][].content.electricityMeteringPoint | workspace_mmd_versions_rows_rows_content.f_electricityMeteringPoint | string |
| certrace:workspace-mmd-versions[scope][].content.ownGenerationFuelDeclared | workspace_mmd_versions_rows_rows_content.f_ownGenerationFuelDeclared | boolean |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].id | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].parameter | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_parameter | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].instrument | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_instrument | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].readingFrequency | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_readingFrequency | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].readingFrequencyOther | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_readingFrequencyOther | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].lastCalibration | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_lastCalibration | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].factorSource | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_factorSource | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].directMethod | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_directMethod | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].cemsCalibrationRef | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_cemsCalibrationRef | string |
| certrace:workspace-mmd-versions[scope][].content.fuelInstruments[].measurementPointLocation | workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6.f_measurementPointLocation | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].id | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].parameter | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_parameter | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].instrument | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_instrument | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].readingFrequency | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_readingFrequency | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].readingFrequencyOther | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_readingFrequencyOther | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].lastCalibration | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_lastCalibration | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].factorSource | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_factorSource | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].directMethod | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_directMethod | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].cemsCalibrationRef | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_cemsCalibrationRef | string |
| certrace:workspace-mmd-versions[scope][].content.electricityInstruments[].measurementPointLocation | workspace_mmd_versions_rows_rows_content_electric_900d1b50.f_measurementPointLocation | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].id | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_id | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].periodStart | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_periodStart | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].periodEnd | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_periodEnd | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].reason | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_reason | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].estimationMethod | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_estimationMethod | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].estimatedTCO2e | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_estimatedTCO2e | numeric |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].reviewerName | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_reviewerName | string |
| certrace:workspace-mmd-versions[scope][].content.dataGaps[].gapDate | workspace_mmd_versions_rows_rows_content_data_gaps_rows.f_gapDate | string |
| certrace:workspace-mmd-versions[scope][].content.qualityAssurance | workspace_mmd_versions_rows_rows_content.f_qualityAssurance | string |
| certrace:workspace-mmd-versions[scope][].content.reviewerName | workspace_mmd_versions_rows_rows_content.f_reviewerName | string |
| certrace:workspace-mmd-versions[scope][].content.reviewFrequency | workspace_mmd_versions_rows_rows_content.f_reviewFrequency | string |
| certrace:workspace-mmd-versions[scope][].content.diagramFileName | workspace_mmd_versions_rows_rows_content.f_diagramFileName | string |
| certrace:workspace-mmd-versions[scope][].content.diagramFileId | workspace_mmd_versions_rows_rows_content.f_diagramFileId | string |
| certrace:workspace-mmd-versions[scope][].content.diagramDataUrl | workspace_mmd_versions_rows_rows_content.f_diagramDataUrl | string |
| certrace:workspace-mmd-versions[scope][].content.diagramCovers[] | workspace_mmd_versions_rows_rows_content_diagram__3f492851.f__value | number |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.reducingAgent | workspace_mmd_versions_rows_rows_content_sector_parameters.f_reducingAgent | string |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.reducingAgentOther | workspace_mmd_versions_rows_rows_content_sector_parameters.f_reducingAgentOther | string |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.mnPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_mnPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.crPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_crPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.niPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_niPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.otherAlloyingPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_otherAlloyingPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.otherMaterialsPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_otherMaterialsPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.steelMillId | workspace_mmd_versions_rows_rows_content_sector_parameters.f_steelMillId | string |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.carbonPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_carbonPct | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.scrapTonnesPerTonneSteel | workspace_mmd_versions_rows_rows_content_sector_parameters.f_scrapTonnesPerTonneSteel | numeric |
| certrace:workspace-mmd-versions[scope][].content.sectorParameters.preConsumerScrapPct | workspace_mmd_versions_rows_rows_content_sector_parameters.f_preConsumerScrapPct | numeric |
| certrace:workspace-mmd-versions[scope][].periodStart | workspace_mmd_versions_rows_rows.f_periodStart | string |
| certrace:workspace-mmd-versions[scope][].periodEnd | workspace_mmd_versions_rows_rows.f_periodEnd | string |
| certrace:monthly-data[scope][].id | report_months.f_id | string |
| certrace:monthly-data[scope][].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:monthly-data[scope][].month | report_months.f_month | string |
| certrace:monthly-data[scope][].productionTonnes | report_months.f_productionTonnes | numeric |
| certrace:monthly-data[scope][].zeroProductionConfirmed | report_months.f_zeroProductionConfirmed | boolean |
| certrace:monthly-data[scope][].noElectricityConfirmed | report_months.f_noElectricityConfirmed | boolean |
| certrace:monthly-data[scope][].noFuelConfirmed | report_months.f_noFuelConfirmed | boolean |
| certrace:monthly-data[scope][].activityNote | report_months.f_activityNote | string |
| certrace:monthly-data[scope][].outputQuantities[].processId | production_outputs.f_processId | string |
| certrace:monthly-data[scope][].outputQuantities[].productId | production_outputs.f_productId | string |
| certrace:monthly-data[scope][].outputQuantities[].route | production_outputs.f_route | string |
| certrace:monthly-data[scope][].outputQuantities[].quantity | production_outputs.f_quantity | numeric |
| certrace:monthly-data[scope][].outputQuantities[].tonnes | production_outputs.f_tonnes | numeric |
| certrace:monthly-data[scope][].otherFlows[].id | transfer_readings.f_id | string |
| certrace:monthly-data[scope][].otherFlows[].kind | transfer_readings.f_kind | string |
| certrace:monthly-data[scope][].otherFlows[].processId | transfer_readings.f_processId | string |
| certrace:monthly-data[scope][].otherFlows[].quantity | transfer_readings.f_quantity | numeric |
| certrace:monthly-data[scope][].otherFlows[].unit | transfer_readings.f_unit | string |
| certrace:monthly-data[scope][].otherFlows[].counterpart | transfer_readings.f_counterpart | string |
| certrace:monthly-data[scope][].otherFlows[].basis | transfer_readings.f_basis | string |
| certrace:monthly-data[scope][].fuels[].id | fuel_readings.f_id | string |
| certrace:monthly-data[scope][].fuels[].fuelType | fuel_readings.f_fuelType | string |
| certrace:monthly-data[scope][].fuels[].fuelTypeOther | fuel_readings.f_fuelTypeOther | string |
| certrace:monthly-data[scope][].fuels[].quantity | fuel_readings.f_quantity | numeric |
| certrace:monthly-data[scope][].fuels[].deliveredQuantity | fuel_readings.f_deliveredQuantity | numeric |
| certrace:monthly-data[scope][].fuels[].unit | fuel_readings.f_unit | string |
| certrace:monthly-data[scope][].fuels[].ncvMjPerUnit | fuel_readings.f_ncvMjPerUnit | numeric |
| certrace:monthly-data[scope][].fuels[].efTco2PerGj | fuel_readings.f_efTco2PerGj | numeric |
| certrace:monthly-data[scope][].fuels[].oxidationFactor | fuel_readings.f_oxidationFactor | numeric |
| certrace:monthly-data[scope][].fuels[].oxidationFactorSource | fuel_readings.f_oxidationFactorSource | string |
| certrace:monthly-data[scope][].fuels[].cAsh | fuel_readings.f_cAsh | numeric |
| certrace:monthly-data[scope][].fuels[].cTotal | fuel_readings.f_cTotal | numeric |
| certrace:monthly-data[scope][].fuels[].biomassFraction | fuel_readings.f_biomassFraction | numeric |
| certrace:monthly-data[scope][].fuels[].biomassEvidenced | fuel_readings.f_biomassEvidenced | boolean |
| certrace:monthly-data[scope][].fuels[].factorSource | fuel_readings.f_factorSource | string |
| certrace:monthly-data[scope][].fuels[].usedForSelfGeneratedElectricity | fuel_readings.f_usedForSelfGeneratedElectricity | boolean |
| certrace:monthly-data[scope][].processEmissionsTco2 | report_months.f_processEmissionsTco2 | numeric |
| certrace:monthly-data[scope][].processEmissionsBasis | report_months.f_processEmissionsBasis | string |
| certrace:monthly-data[scope][].processEmissionEntries[].id | material_readings.f_id | string |
| certrace:monthly-data[scope][].processEmissionEntries[].method | material_readings.f_method | string |
| certrace:monthly-data[scope][].processEmissionEntries[].materialId | material_readings.f_materialId | string |
| certrace:monthly-data[scope][].processEmissionEntries[].quantityT | material_readings.f_quantityT | numeric |
| certrace:monthly-data[scope][].processEmissionEntries[].conversionFactor | material_readings.f_conversionFactor | numeric |
| certrace:monthly-data[scope][].processEmissionEntries[].note | material_readings.f_note | string |
| certrace:monthly-data[scope][].electricityMwh | report_months.f_electricityMwh | numeric |
| certrace:monthly-data[scope][].electricityFactorTco2PerMwh | report_months.f_electricityFactorTco2PerMwh | numeric |
| certrace:monthly-data[scope][].electricityFactorSource | report_months.f_electricityFactorSource | string |
| certrace:monthly-data[scope][].selfGeneratedSharePct | report_months.f_selfGeneratedSharePct | numeric |
| certrace:monthly-data[scope][].electricitySources[].id | electricity_readings.f_id | string |
| certrace:monthly-data[scope][].electricitySources[].sourceType | electricity_readings.f_sourceType | string |
| certrace:monthly-data[scope][].electricitySources[].mwh | electricity_readings.f_mwh | numeric |
| certrace:monthly-data[scope][].electricitySources[].factorTco2PerMwh | electricity_readings.f_factorTco2PerMwh | numeric |
| certrace:monthly-data[scope][].flueGasCleaningEmissionsTco2 | report_months.f_flueGasCleaningEmissionsTco2 | numeric |
| certrace:monthly-data[scope][].status | report_months.f_status | string |
| certrace:monthly-data[scope][].submittedAt | report_months.f_submittedAt | string |
| certrace:monthly-data[scope][].submittedBy | report_months.f_submittedBy | string |
| certrace:monthly-data[scope][].notes | report_months.f_notes | string |
| certrace:precursor-suppliers[scope][].id | precursor_sources.f_id | string |
| certrace:precursor-suppliers[scope][].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:precursor-suppliers[scope][].parentId | precursor_sources.f_parentId | string |
| certrace:precursor-suppliers[scope][].name | masterdata.organization_versions.name (via precursor_sources._producer_version_id) | string |
| certrace:precursor-suppliers[scope][].installationName | masterdata.installation_versions.name (via precursor_sources._producer_installation_version_id) | string |
| certrace:precursor-suppliers[scope][].country | masterdata.installation_versions.country (via precursor_sources._producer_installation_version_id) | string |
| certrace:precursor-suppliers[scope][].precursorName | masterdata.product_versions.name (via precursor_sources._precursor_product_version_id) | string |
| certrace:precursor-suppliers[scope][].cnCode | masterdata.product_versions.cn_code (via precursor_sources._precursor_product_version_id) | string |
| certrace:precursor-suppliers[scope][].catalogProductId | precursor_sources.f_catalogProductId | string |
| certrace:precursor-suppliers[scope][].productionRoute | precursor_sources.f_productionRoute | string |
| certrace:precursor-suppliers[scope][].isScrap | precursor_sources.f_isScrap | boolean |
| certrace:precursor-suppliers[scope][].seeTco2ePerT | precursor_sources.f_seeTco2ePerT | numeric |
| certrace:precursor-suppliers[scope][].specificEmbeddedDirectTco2PerT | precursor_sources.f_specificEmbeddedDirectTco2PerT | numeric |
| certrace:precursor-suppliers[scope][].specificEmbeddedIndirectTco2PerT | precursor_sources.f_specificEmbeddedIndirectTco2PerT | numeric |
| certrace:precursor-suppliers[scope][].dataOrigin | precursor_sources.f_dataOrigin | string |
| certrace:precursor-suppliers[scope][].monthlyQuantities[].month | precursor_suppliers_rows_rows_monthly_quantities_rows.f_month | string |
| certrace:precursor-suppliers[scope][].monthlyQuantities[].tonnes | precursor_suppliers_rows_rows_monthly_quantities_rows.f_tonnes | numeric |
| certrace:precursor-suppliers[scope][].monthlyQuantities[].basis | precursor_suppliers_rows_rows_monthly_quantities_rows.f_basis | string |
| certrace:precursor-suppliers[scope][].monthlyQuantities[].receivedTonnes | precursor_suppliers_rows_rows_monthly_quantities_rows.f_receivedTonnes | numeric |
| certrace:precursor-suppliers[scope][].monthlyQuantities[].processId | precursor_suppliers_rows_rows_monthly_quantities_rows.f_processId | string |
| certrace:precursor-suppliers[scope][].consumingProcessIds[] | precursor_suppliers_rows_rows_consuming_process_ids_rows.f__value | string |
| certrace:precursor-suppliers[scope][].consumingProductIds[] | precursor_suppliers_rows_rows_consuming_product_ids_rows.f__value | string |
| certrace:precursor-suppliers[scope][].autofillProvenance[].field | precursor_suppliers_rows_rows_autofill_provenance_rows.f_field | string |
| certrace:precursor-suppliers[scope][].autofillProvenance[].documentId | precursor_suppliers_rows_rows_autofill_provenance_rows.f_documentId | string |
| certrace:precursor-suppliers[scope][].autofillProvenance[].page | precursor_suppliers_rows_rows_autofill_provenance_rows.f_page | numeric |
| certrace:precursor-suppliers[scope][].autofillProvenance[].excerpt | precursor_suppliers_rows_rows_autofill_provenance_rows.f_excerpt | string |
| certrace:precursor-suppliers[scope][].emissionsInputPolicy | precursor_sources.f_emissionsInputPolicy | string |
| certrace:precursor-suppliers[scope][].supplierResponseReceived | precursor_sources.f_supplierResponseReceived | boolean |
| certrace:precursor-suppliers[scope][].defaultValueReference | precursor_sources.f_defaultValueReference | string |
| certrace:precursor-suppliers[scope][].defaultValueChecked | precursor_sources.f_defaultValueChecked | boolean |
| certrace:precursor-suppliers[scope][].defaultValueSourceId | precursor_sources.f_defaultValueSourceId | string |
| certrace:precursor-suppliers[scope][].defaultValueYear | precursor_sources.f_defaultValueYear | numeric |
| certrace:precursor-suppliers[scope][].verificationCoverageStart | precursor_sources.f_verificationCoverageStart | string |
| certrace:precursor-suppliers[scope][].verificationCoverageEnd | precursor_sources.f_verificationCoverageEnd | string |
| certrace:precursor-suppliers[scope][].smartLinkToken | precursor_sources.f_smartLinkToken | string |
| certrace:precursor-suppliers[scope][].smartLinkSentAt | precursor_sources.f_smartLinkSentAt | string |
| certrace:precursor-suppliers[scope][].smartLinkLastSentAt | precursor_sources.f_smartLinkLastSentAt | string |
| certrace:precursor-suppliers[scope][].smartLinkOpenedAt | precursor_sources.f_smartLinkOpenedAt | string |
| certrace:precursor-suppliers[scope][].smartLinkSubmittedAt | precursor_sources.f_smartLinkSubmittedAt | string |
| certrace:precursor-suppliers[scope][].addedBy | precursor_sources.f_addedBy | string |
| certrace:precursor-suppliers[scope][].isChainRoot | precursor_sources.f_isChainRoot | boolean |
| certrace:precursor-suppliers[scope][].pendingExporterConfirmation | precursor_sources.f_pendingExporterConfirmation | boolean |
| certrace:precursor-suppliers[scope][].qtyPerTonneOverride | precursor_sources.f_qtyPerTonneOverride | numeric |
| certrace:precursor-suppliers[scope][].quantityUsedT | precursor_sources.f_quantityUsedT | numeric |
| certrace:precursor-suppliers[scope][].origin | precursor_sources.f_origin | string |
| certrace:precursor-suppliers[scope][].supplierCompanyId | precursor_sources.f_supplierCompanyId | string |
| certrace:precursor-suppliers[scope][].contactName | masterdata.organization_versions.contact_name (via precursor_sources._producer_version_id) | string |
| certrace:precursor-suppliers[scope][].contactEmail | masterdata.organization_versions.contact_email (via precursor_sources._producer_version_id) | string |
| certrace:precursor-suppliers[scope][].contactPhone | masterdata.organization_versions.contact_phone (via precursor_sources._producer_version_id) | string |
| certrace:precursor-suppliers[scope][].sourceProcessId | precursor_sources.f_sourceProcessId | string |
| certrace:precursor-suppliers[scope][].latitude | masterdata.installation_versions.latitude (via precursor_sources._producer_installation_version_id) | numeric |
| certrace:precursor-suppliers[scope][].longitude | masterdata.installation_versions.longitude (via precursor_sources._producer_installation_version_id) | numeric |
| certrace:precursor-suppliers[scope][].installationUniqueId | precursor_sources.f_installationUniqueId | string |
| certrace:precursor-suppliers[scope][].unlocode | masterdata.installation_versions.unlocode (via precursor_sources._producer_installation_version_id) | string |
| certrace:precursor-suppliers[scope][].fullAddress | masterdata.installation_versions.full_address (via precursor_sources._producer_installation_version_id) | string |
| certrace:precursor-suppliers[scope][].reportingPeriodStart | precursor_sources.f_reportingPeriodStart | string |
| certrace:precursor-suppliers[scope][].reportingPeriodEnd | precursor_sources.f_reportingPeriodEnd | string |
| certrace:precursor-suppliers[scope][].verificationReportFileId | precursor_sources.f_verificationReportFileId | string |
| certrace:precursor-suppliers[scope][].verifierName | precursor_sources.f_verifierName | string |
| certrace:precursor-suppliers[scope][].verifierAccreditationNumber | precursor_sources.f_verifierAccreditationNumber | string |
| certrace:precursor-suppliers[scope][].verifierAccreditationIssuingCountry | precursor_sources.f_verifierAccreditationIssuingCountry | string |
| certrace:precursor-suppliers[scope][].verifierAccreditationExpiryDate | precursor_sources.f_verifierAccreditationExpiryDate | string |
| certrace:precursor-suppliers[scope][].verificationReportIssueDate | precursor_sources.f_verificationReportIssueDate | string |
| certrace:precursor-suppliers[scope][].verificationReportExpiresAt | precursor_sources.f_verificationReportExpiresAt | string |
| certrace:precursor-suppliers[scope][].verificationSectoralScope | precursor_sources.f_verificationSectoralScope | string |
| certrace:precursor-suppliers[scope][].verificationChecks.accreditationValid | precursor_suppliers_rows_rows_verification_checks.f_accreditationValid | boolean |
| certrace:precursor-suppliers[scope][].verificationChecks.sectoralScopeMatch | precursor_suppliers_rows_rows_verification_checks.f_sectoralScopeMatch | boolean |
| certrace:precursor-suppliers[scope][].verificationChecks.periodCovered | precursor_suppliers_rows_rows_verification_checks.f_periodCovered | boolean |
| certrace:precursor-suppliers[scope][].verificationChecks.fileIntact | precursor_suppliers_rows_rows_verification_checks.f_fileIntact | boolean |
| certrace:precursor-suppliers[scope][].verificationChecks.failedReasons[] | precursor_suppliers_rows_rows_verification_checks_d4531d84.f__value | string |
| certrace:precursor-suppliers[scope][].reducingAgent | precursor_sources.f_reducingAgent | string |
| certrace:precursor-suppliers[scope][].mnPct | precursor_sources.f_mnPct | numeric |
| certrace:precursor-suppliers[scope][].crPct | precursor_sources.f_crPct | numeric |
| certrace:precursor-suppliers[scope][].niPct | precursor_sources.f_niPct | numeric |
| certrace:precursor-suppliers[scope][].otherAlloyingPct | precursor_sources.f_otherAlloyingPct | numeric |
| certrace:precursor-suppliers[scope][].scrapRatioTPerT | precursor_sources.f_scrapRatioTPerT | numeric |
| certrace:precursor-suppliers[scope][].preConsumerScrapPct | precursor_sources.f_preConsumerScrapPct | numeric |
| certrace:precursor-suppliers[scope][].linkedWorkspaceId | precursor_sources.f_linkedWorkspaceId | string |
| certrace:workspace-evidence[scope][].id | evidence_items.f_id | string |
| certrace:workspace-evidence[scope][].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:workspace-evidence[scope][].month | evidence_items.f_month | string |
| certrace:workspace-evidence[scope][].fieldKeys[] | workspace_evidence_rows_rows_field_keys_rows.f__value | string |
| certrace:workspace-evidence[scope][].sourceType | evidence_items.f_sourceType | string |
| certrace:workspace-evidence[scope][].fileName | evidence_items.f_fileName | string |
| certrace:workspace-evidence[scope][].fileDataUrl | evidence_items.f_fileDataUrl | string |
| certrace:workspace-evidence[scope][].mimeType | evidence_items.f_mimeType | string |
| certrace:workspace-evidence[scope][].sizeBytes | evidence_items.f_sizeBytes | numeric |
| certrace:workspace-evidence[scope][].extraction.status | workspace_evidence_rows_rows_extraction.f_status | string |
| certrace:workspace-evidence[scope][].extraction.fields[].key | workspace_evidence_rows_rows_extraction_fields_rows.f_key | string |
| certrace:workspace-evidence[scope][].extraction.fields[].value | workspace_evidence_rows_rows_extraction_fields_rows.f_value | string |
| certrace:workspace-evidence[scope][].extraction.fields[].unit | workspace_evidence_rows_rows_extraction_fields_rows.f_unit | string |
| certrace:workspace-evidence[scope][].extraction.fields[].confidence | workspace_evidence_rows_rows_extraction_fields_rows.f_confidence | numeric |
| certrace:workspace-evidence[scope][].extraction.fields[].accepted | workspace_evidence_rows_rows_extraction_fields_rows.f_accepted | boolean |
| certrace:workspace-evidence[scope][].extraction.fields[].page | workspace_evidence_rows_rows_extraction_fields_rows.f_page | numeric |
| certrace:workspace-evidence[scope][].extraction.fields[].excerpt | workspace_evidence_rows_rows_extraction_fields_rows.f_excerpt | string |
| certrace:workspace-evidence[scope][].extraction.rawSummary | workspace_evidence_rows_rows_extraction.f_rawSummary | string |
| certrace:workspace-evidence[scope][].extraction.extractedAt | workspace_evidence_rows_rows_extraction.f_extractedAt | string |
| certrace:workspace-evidence[scope][].extraction.error | workspace_evidence_rows_rows_extraction.f_error | string |
| certrace:workspace-evidence[scope][].capturedAt | evidence_items.f_capturedAt | string |
| certrace:workspace-evidence[scope][].uploadedBy | evidence_items.f_uploadedBy | string |
| certrace:workspace-evidence[scope][].fileHash | evidence_items.f_fileHash | string |
| certrace:workspace-evidence[scope][].localFileId | evidence_items.f_localFileId | string |
| certrace:workspace-evidence[scope][].reviewedBy | evidence_items.f_reviewedBy | string |
| certrace:workspace-evidence[scope][].reviewedAt | evidence_items.f_reviewedAt | string |
| certrace:workspace-evidence[scope][].boundTo | evidence_items.f_boundTo | string |
| certrace:workspace-evidence[scope][].serverFileId | evidence_items.f_serverFileId | string |
| certrace:pack-signoff[scope].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:pack-signoff[scope].name | report_signoffs.f_name | string |
| certrace:pack-signoff[scope].jobTitle | report_signoffs.f_jobTitle | string |
| certrace:pack-signoff[scope].signedAt | report_signoffs.f_signedAt | string |
| certrace:pack-signoff[scope].fingerprint | report_signoffs.f_fingerprint | string |
| certrace:carbon-price[scope].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:carbon-price[scope].amountPerTonne | carbon_price_claims.f_amountPerTonne | numeric |
| certrace:carbon-price[scope].currency | carbon_price_claims.f_currency | string |
| certrace:carbon-price[scope].instrument | carbon_price_claims.f_instrument | string |
| certrace:carbon-price[scope].rebates | carbon_price_claims.f_rebates | string |
| certrace:carbon-price[scope].shareOfEmissionsCovered | carbon_price_claims.f_shareOfEmissionsCovered | numeric |
| certrace:carbon-price[scope].evidenceItemId | carbon_price_claims.f_evidenceItemId | string |
| certrace:carbon-price[scope].recorded | carbon_price_claims.f_recorded | boolean |
| certrace:carbon-price[scope].updatedAt | carbon_price_claims.f_updatedAt | string |
| certrace:reporting-periods[].installationId | reporting_periods_rows.f_installationId | string |
| certrace:reporting-periods[].year | reporting_periods_rows.f_year | numeric |
| certrace:reporting-periods[].createdAt | reporting_periods_rows.f_createdAt | string |
| certrace:annual-production[scope].declarationId | annual_production_rows.f_declarationId | string |
| certrace:annual-production[scope].tonnes | annual_production_rows.f_tonnes | numeric |
| certrace:annual-production[scope].provenance.source | annual_production_rows_provenance.f_source | string |
| certrace:annual-production[scope].provenance.reference | annual_production_rows_provenance.f_reference | string |
| certrace:annual-production[scope].provenance.evidenceFileId | annual_production_rows_provenance.f_evidenceFileId | string |
| certrace:annual-production[scope].provenance.enteredBy | annual_production_rows_provenance.f_enteredBy | string |
| certrace:annual-production[scope].provenance.enteredAt | annual_production_rows_provenance.f_enteredAt | string |
| certrace:annual-production[scope].confirmedAt | annual_production_rows.f_confirmedAt | numeric |
| certrace:annual-production[scope].confirmedAgainstShippedTonnes | annual_production_rows.f_confirmedAgainstShippedTonnes | numeric |
| certrace:annual-production[scope].updatedAt | annual_production_rows.f_updatedAt | numeric |
| certrace:monthly-requests[scope][].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:monthly-requests[scope][].declId | monthly_requests_rows_rows.f_declId | string |
| certrace:monthly-requests[scope][].supplierId | monthly_requests_rows_rows.f_supplierId | string |
| certrace:monthly-requests[scope][].supplierName | monthly_requests_rows_rows.f_supplierName | string |
| certrace:monthly-requests[scope][].month | monthly_requests_rows_rows.f_month | string |
| certrace:monthly-requests[scope][].token | monthly_requests_rows_rows.f_token | string |
| certrace:monthly-requests[scope][].sentAt | monthly_requests_rows_rows.f_sentAt | string |
| certrace:monthly-requests[scope][].resendCount | monthly_requests_rows_rows.f_resendCount | numeric |
| certrace:monthly-requests[scope][].createdAt | monthly_requests_rows_rows.f_createdAt | string |
| certrace:month-submissions[scope][scope].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:month-submissions[scope][scope].month | month_submissions_rows_rows.f_month | string |
| certrace:month-submissions[scope][scope].state | month_submissions_rows_rows.f_state | string |
| certrace:month-submissions[scope][scope].attestation.fullName | month_submissions_rows_rows_attestation.f_fullName | string |
| certrace:month-submissions[scope][scope].attestation.role | month_submissions_rows_rows_attestation.f_role | string |
| certrace:month-submissions[scope][scope].attestation.at | month_submissions_rows_rows_attestation.f_at | string |
| certrace:month-submissions[scope][scope].attestation.warningsAcknowledged | month_submissions_rows_rows_attestation.f_warningsAcknowledged | numeric |
| certrace:month-submissions[scope][scope].submittedAt | month_submissions_rows_rows.f_submittedAt | string |
| certrace:month-submissions[scope][scope].editedByExporter | month_submissions_rows_rows.f_editedByExporter | boolean |
| certrace:month-submissions[scope][scope].editedAt | month_submissions_rows_rows.f_editedAt | string |
| certrace:month-submissions[scope][scope].reviewerId | month_submissions_rows_rows.f_reviewerId | string |
| certrace:month-submissions[scope][scope].reviewerName | month_submissions_rows_rows.f_reviewerName | string |
| certrace:month-submissions[scope][scope].confirmedBy | month_submissions_rows_rows.f_confirmedBy | string |
| certrace:month-submissions[scope][scope].confirmedAt | month_submissions_rows_rows.f_confirmedAt | string |
| certrace:month-submissions[scope][scope].revisionNote | month_submissions_rows_rows.f_revisionNote | string |
| certrace:month-submissions[scope][scope].revisionAt | month_submissions_rows_rows.f_revisionAt | string |
| certrace:month-submissions[scope][scope].revisionCarriedEdits | month_submissions_rows_rows.f_revisionCarriedEdits | boolean |
| certrace:month-submissions[scope][scope].revisionAreas[] | month_submissions_rows_rows_revision_areas_rows.f__value | string |
| certrace:month-submissions[scope][scope].revisionRound | month_submissions_rows_rows.f_revisionRound | numeric |
| certrace:month-submissions[scope][scope].editRequest.at | month_submissions_rows_rows_edit_request.f_at | string |
| certrace:month-submissions[scope][scope].editRequest.reason | month_submissions_rows_rows_edit_request.f_reason | string |
| certrace:month-submissions[scope][scope].editRequest.state | month_submissions_rows_rows_edit_request.f_state | string |
| certrace:month-submissions[scope][scope].editRequest.decidedAt | month_submissions_rows_rows_edit_request.f_decidedAt | string |
| certrace:month-submissions[scope][scope].editRequest.decidedBy | month_submissions_rows_rows_edit_request.f_decidedBy | string |
| certrace:precursor-versions[scope][].version | precursor_versions_rows_rows.f_version | numeric |
| certrace:precursor-versions[scope][].savedAt | precursor_versions_rows_rows.f_savedAt | string |
| certrace:precursor-versions[scope][].changed[] | precursor_versions_rows_rows_changed_rows.f__value | string |
| certrace:precursor-versions[scope][].snapshot.id | precursor_versions_rows_rows_snapshot.f_id | string |
| certrace:precursor-versions[scope][].snapshot.name | masterdata.organization_versions.name (via precursor_versions_rows_rows_snapshot._producer_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.nameLocal | masterdata.installation_versions.name_local (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.self | masterdata.installations.external_reference (identity projection) (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | boolean |
| certrace:precursor-versions[scope][].snapshot.supplierId | masterdata.installations.external_reference (identity projection) (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.street | masterdata.installation_versions.street (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.economicActivity | masterdata.installation_versions.economic_activity (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.postcode | masterdata.installation_versions.postcode (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.poBox | masterdata.installation_versions.po_box (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.city | masterdata.installation_versions.city (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.country | masterdata.installation_versions.country (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.unlocode | masterdata.installation_versions.unlocode (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.lat | masterdata.installation_versions.latitude (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.lng | masterdata.installation_versions.longitude (via precursor_versions_rows_rows_snapshot._installation_history_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.contactName | masterdata.organization_versions.contact_name (via precursor_versions_rows_rows_snapshot._producer_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.contactEmail | masterdata.organization_versions.contact_email (via precursor_versions_rows_rows_snapshot._producer_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.contactPhone | masterdata.organization_versions.contact_phone (via precursor_versions_rows_rows_snapshot._producer_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.otherGoods[].name | precursor_versions_rows_rows_snapshot_other_goods_rows.f_name | string |
| certrace:precursor-versions[scope][].snapshot.otherGoods[].description | precursor_versions_rows_rows_snapshot_other_goods_rows.f_description | string |
| certrace:precursor-versions[scope][].snapshot.createdAt | precursor_versions_rows_rows_snapshot.f_createdAt | string |
| certrace:precursor-versions[scope][].snapshot.workspaceId | precursor_versions_rows_rows_snapshot.f_workspaceId | string |
| certrace:precursor-versions[scope][].snapshot.parentId | precursor_versions_rows_rows_snapshot.f_parentId | string |
| certrace:precursor-versions[scope][].snapshot.installationName | masterdata.installation_versions.name (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.precursorName | masterdata.product_versions.name (via precursor_versions_rows_rows_snapshot._precursor_product_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.cnCode | masterdata.product_versions.cn_code (via precursor_versions_rows_rows_snapshot._precursor_product_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.catalogProductId | precursor_versions_rows_rows_snapshot.f_catalogProductId | string |
| certrace:precursor-versions[scope][].snapshot.productionRoute | precursor_versions_rows_rows_snapshot.f_productionRoute | string |
| certrace:precursor-versions[scope][].snapshot.isScrap | precursor_versions_rows_rows_snapshot.f_isScrap | boolean |
| certrace:precursor-versions[scope][].snapshot.seeTco2ePerT | precursor_versions_rows_rows_snapshot.f_seeTco2ePerT | numeric |
| certrace:precursor-versions[scope][].snapshot.specificEmbeddedDirectTco2PerT | precursor_versions_rows_rows_snapshot.f_specificEmbeddedDirectTco2PerT | numeric |
| certrace:precursor-versions[scope][].snapshot.specificEmbeddedIndirectTco2PerT | precursor_versions_rows_rows_snapshot.f_specificEmbeddedIndirectTco2PerT | numeric |
| certrace:precursor-versions[scope][].snapshot.dataOrigin | precursor_versions_rows_rows_snapshot.f_dataOrigin | string |
| certrace:precursor-versions[scope][].snapshot.monthlyQuantities[].month | precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047.f_month | string |
| certrace:precursor-versions[scope][].snapshot.monthlyQuantities[].tonnes | precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047.f_tonnes | numeric |
| certrace:precursor-versions[scope][].snapshot.monthlyQuantities[].basis | precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047.f_basis | string |
| certrace:precursor-versions[scope][].snapshot.monthlyQuantities[].receivedTonnes | precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047.f_receivedTonnes | numeric |
| certrace:precursor-versions[scope][].snapshot.monthlyQuantities[].processId | precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047.f_processId | string |
| certrace:precursor-versions[scope][].snapshot.consumingProcessIds[] | precursor_versions_rows_rows_snapshot_consuming_p_8eb5526e.f__value | string |
| certrace:precursor-versions[scope][].snapshot.consumingProductIds[] | precursor_versions_rows_rows_snapshot_consuming_p_6a32fcd2.f__value | string |
| certrace:precursor-versions[scope][].snapshot.autofillProvenance[].field | precursor_versions_rows_rows_snapshot_autofill_pr_598874d4.f_field | string |
| certrace:precursor-versions[scope][].snapshot.autofillProvenance[].documentId | precursor_versions_rows_rows_snapshot_autofill_pr_598874d4.f_documentId | string |
| certrace:precursor-versions[scope][].snapshot.autofillProvenance[].page | precursor_versions_rows_rows_snapshot_autofill_pr_598874d4.f_page | numeric |
| certrace:precursor-versions[scope][].snapshot.autofillProvenance[].excerpt | precursor_versions_rows_rows_snapshot_autofill_pr_598874d4.f_excerpt | string |
| certrace:precursor-versions[scope][].snapshot.emissionsInputPolicy | precursor_versions_rows_rows_snapshot.f_emissionsInputPolicy | string |
| certrace:precursor-versions[scope][].snapshot.supplierResponseReceived | precursor_versions_rows_rows_snapshot.f_supplierResponseReceived | boolean |
| certrace:precursor-versions[scope][].snapshot.defaultValueReference | precursor_versions_rows_rows_snapshot.f_defaultValueReference | string |
| certrace:precursor-versions[scope][].snapshot.defaultValueChecked | precursor_versions_rows_rows_snapshot.f_defaultValueChecked | boolean |
| certrace:precursor-versions[scope][].snapshot.defaultValueSourceId | precursor_versions_rows_rows_snapshot.f_defaultValueSourceId | string |
| certrace:precursor-versions[scope][].snapshot.defaultValueYear | precursor_versions_rows_rows_snapshot.f_defaultValueYear | numeric |
| certrace:precursor-versions[scope][].snapshot.verificationCoverageStart | precursor_versions_rows_rows_snapshot.f_verificationCoverageStart | string |
| certrace:precursor-versions[scope][].snapshot.verificationCoverageEnd | precursor_versions_rows_rows_snapshot.f_verificationCoverageEnd | string |
| certrace:precursor-versions[scope][].snapshot.smartLinkToken | precursor_versions_rows_rows_snapshot.f_smartLinkToken | string |
| certrace:precursor-versions[scope][].snapshot.smartLinkSentAt | precursor_versions_rows_rows_snapshot.f_smartLinkSentAt | string |
| certrace:precursor-versions[scope][].snapshot.smartLinkLastSentAt | precursor_versions_rows_rows_snapshot.f_smartLinkLastSentAt | string |
| certrace:precursor-versions[scope][].snapshot.smartLinkOpenedAt | precursor_versions_rows_rows_snapshot.f_smartLinkOpenedAt | string |
| certrace:precursor-versions[scope][].snapshot.smartLinkSubmittedAt | precursor_versions_rows_rows_snapshot.f_smartLinkSubmittedAt | string |
| certrace:precursor-versions[scope][].snapshot.addedBy | precursor_versions_rows_rows_snapshot.f_addedBy | string |
| certrace:precursor-versions[scope][].snapshot.isChainRoot | precursor_versions_rows_rows_snapshot.f_isChainRoot | boolean |
| certrace:precursor-versions[scope][].snapshot.pendingExporterConfirmation | precursor_versions_rows_rows_snapshot.f_pendingExporterConfirmation | boolean |
| certrace:precursor-versions[scope][].snapshot.qtyPerTonneOverride | precursor_versions_rows_rows_snapshot.f_qtyPerTonneOverride | numeric |
| certrace:precursor-versions[scope][].snapshot.quantityUsedT | precursor_versions_rows_rows_snapshot.f_quantityUsedT | numeric |
| certrace:precursor-versions[scope][].snapshot.origin | precursor_versions_rows_rows_snapshot.f_origin | string |
| certrace:precursor-versions[scope][].snapshot.supplierCompanyId | precursor_versions_rows_rows_snapshot.f_supplierCompanyId | string |
| certrace:precursor-versions[scope][].snapshot.sourceProcessId | precursor_versions_rows_rows_snapshot.f_sourceProcessId | string |
| certrace:precursor-versions[scope][].snapshot.latitude | masterdata.installation_versions.latitude (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | numeric |
| certrace:precursor-versions[scope][].snapshot.longitude | masterdata.installation_versions.longitude (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | numeric |
| certrace:precursor-versions[scope][].snapshot.installationUniqueId | precursor_versions_rows_rows_snapshot.f_installationUniqueId | string |
| certrace:precursor-versions[scope][].snapshot.fullAddress | masterdata.installation_versions.full_address (via precursor_versions_rows_rows_snapshot._producer_installation_version_id) | string |
| certrace:precursor-versions[scope][].snapshot.reportingPeriodStart | precursor_versions_rows_rows_snapshot.f_reportingPeriodStart | string |
| certrace:precursor-versions[scope][].snapshot.reportingPeriodEnd | precursor_versions_rows_rows_snapshot.f_reportingPeriodEnd | string |
| certrace:precursor-versions[scope][].snapshot.verificationReportFileId | precursor_versions_rows_rows_snapshot.f_verificationReportFileId | string |
| certrace:precursor-versions[scope][].snapshot.verifierName | precursor_versions_rows_rows_snapshot.f_verifierName | string |
| certrace:precursor-versions[scope][].snapshot.verifierAccreditationNumber | precursor_versions_rows_rows_snapshot.f_verifierAccreditationNumber | string |
| certrace:precursor-versions[scope][].snapshot.verifierAccreditationIssuingCountry | precursor_versions_rows_rows_snapshot.f_verifierAccreditationIssuingCountry | string |
| certrace:precursor-versions[scope][].snapshot.verifierAccreditationExpiryDate | precursor_versions_rows_rows_snapshot.f_verifierAccreditationExpiryDate | string |
| certrace:precursor-versions[scope][].snapshot.verificationReportIssueDate | precursor_versions_rows_rows_snapshot.f_verificationReportIssueDate | string |
| certrace:precursor-versions[scope][].snapshot.verificationReportExpiresAt | precursor_versions_rows_rows_snapshot.f_verificationReportExpiresAt | string |
| certrace:precursor-versions[scope][].snapshot.verificationSectoralScope | precursor_versions_rows_rows_snapshot.f_verificationSectoralScope | string |
| certrace:precursor-versions[scope][].snapshot.verificationChecks.accreditationValid | precursor_versions_rows_rows_snapshot_verification_checks.f_accreditationValid | boolean |
| certrace:precursor-versions[scope][].snapshot.verificationChecks.sectoralScopeMatch | precursor_versions_rows_rows_snapshot_verification_checks.f_sectoralScopeMatch | boolean |
| certrace:precursor-versions[scope][].snapshot.verificationChecks.periodCovered | precursor_versions_rows_rows_snapshot_verification_checks.f_periodCovered | boolean |
| certrace:precursor-versions[scope][].snapshot.verificationChecks.fileIntact | precursor_versions_rows_rows_snapshot_verification_checks.f_fileIntact | boolean |
| certrace:precursor-versions[scope][].snapshot.verificationChecks.failedReasons[] | precursor_versions_rows_rows_snapshot_verificatio_675f13bd.f__value | string |
| certrace:precursor-versions[scope][].snapshot.reducingAgent | precursor_versions_rows_rows_snapshot.f_reducingAgent | string |
| certrace:precursor-versions[scope][].snapshot.mnPct | precursor_versions_rows_rows_snapshot.f_mnPct | numeric |
| certrace:precursor-versions[scope][].snapshot.crPct | precursor_versions_rows_rows_snapshot.f_crPct | numeric |
| certrace:precursor-versions[scope][].snapshot.niPct | precursor_versions_rows_rows_snapshot.f_niPct | numeric |
| certrace:precursor-versions[scope][].snapshot.otherAlloyingPct | precursor_versions_rows_rows_snapshot.f_otherAlloyingPct | numeric |
| certrace:precursor-versions[scope][].snapshot.scrapRatioTPerT | precursor_versions_rows_rows_snapshot.f_scrapRatioTPerT | numeric |
| certrace:precursor-versions[scope][].snapshot.preConsumerScrapPct | precursor_versions_rows_rows_snapshot.f_preConsumerScrapPct | numeric |
| certrace:precursor-versions[scope][].snapshot.linkedWorkspaceId | precursor_versions_rows_rows_snapshot.f_linkedWorkspaceId | string |
| certrace:final-report-snapshot[scope].workspaceId | enclosing workspace scope (foreign-key path) | string |
| certrace:final-report-snapshot[scope].fingerprint | final_report_snapshot_rows.f_fingerprint | string |
| certrace:final-report-snapshot[scope].signedAt | final_report_snapshot_rows.f_signedAt | string |
| certrace:final-report-snapshot[scope].doc | final_report_snapshot_rows.f_doc | bytea (frozen output) |
| certrace:report-snapshots:*[].version | report_snapshots_rows.f_version | numeric |
| certrace:report-snapshots:*[].createdAt | report_snapshots_rows.f_createdAt | string |
| certrace:report-snapshots:*[].reason | report_snapshots_rows.f_reason | string |
| certrace:report-snapshots:*[].fingerprint | report_snapshots_rows.f_fingerprint | string |
| certrace:report-snapshots:*[].dataset | report_snapshots_rows.f_dataset | bytea (frozen output) |
| certrace:report-inputs:v1[scope].0.4.applicability | report_inputs_v1_rows_0_4.f_applicability | string |
| certrace:report-inputs:v1[scope].0.4.reason | report_inputs_v1_rows_0_4.f_reason | string |
| certrace:report-inputs:v1[scope].0.4.updatedAt | report_inputs_v1_rows_0_4.f_updatedAt | string |
| certrace:report-inputs:v1[scope].0.4.rows[].id | report_inputs_v1_rows_0_4_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].0.4.rows[].values.country | masterdata.organization_versions.country (via report_inputs_v1_rows_0_4_rows_rows_values._operator_version_id) | string |
| certrace:report-inputs:v1[scope].0.5.applicability | report_inputs_v1_rows_0_5.f_applicability | string |
| certrace:report-inputs:v1[scope].0.5.reason | report_inputs_v1_rows_0_5.f_reason | string |
| certrace:report-inputs:v1[scope].0.5.updatedAt | report_inputs_v1_rows_0_5.f_updatedAt | string |
| certrace:report-inputs:v1[scope].0.5.rows[].id | report_inputs_v1_rows_0_5_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].0.5.rows[].values.name | masterdata.organization_versions.contact_name (via report_inputs_v1_rows_0_5_rows_rows_values._operator_version_id) | string |
| certrace:report-inputs:v1[scope].0.5.rows[].values.email | masterdata.organization_versions.contact_email (via report_inputs_v1_rows_0_5_rows_rows_values._operator_version_id) | string |
| certrace:report-inputs:v1[scope].0.5.rows[].values.phone | masterdata.organization_versions.contact_phone (via report_inputs_v1_rows_0_5_rows_rows_values._operator_version_id) | string |
| certrace:report-inputs:v1[scope].0.6.applicability | report_inputs_v1_rows_0_6.f_applicability | string |
| certrace:report-inputs:v1[scope].0.6.reason | report_inputs_v1_rows_0_6.f_reason | string |
| certrace:report-inputs:v1[scope].0.6.updatedAt | report_inputs_v1_rows_0_6.f_updatedAt | string |
| certrace:report-inputs:v1[scope].0.6.rows[].id | report_inputs_v1_rows_0_6_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].0.6.rows[].values.name | report_inputs_v1_rows_0_6_rows_rows_values.f_name | string |
| certrace:report-inputs:v1[scope].0.6.rows[].values.role | report_inputs_v1_rows_0_6_rows_rows_values.f_role | string |
| certrace:report-inputs:v1[scope].0.7.applicability | report_inputs_v1_rows_0_7.f_applicability | string |
| certrace:report-inputs:v1[scope].0.7.reason | report_inputs_v1_rows_0_7.f_reason | string |
| certrace:report-inputs:v1[scope].0.7.updatedAt | report_inputs_v1_rows_0_7.f_updatedAt | string |
| certrace:report-inputs:v1[scope].0.7.rows[].id | report_inputs_v1_rows_0_7_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].0.7.rows[].values.operator | masterdata.organization_versions.name (via report_inputs_v1_rows_0_7_rows_rows_values._operator_version_id) | string |
| certrace:report-inputs:v1[scope].0.7.rows[].values.exporter | masterdata.organization_versions.name (via report_inputs_v1_rows_0_7_rows_rows_values._exporter_version_id) | string |
| certrace:report-inputs:v1[scope].0.7.rows[].values.basis | report_inputs_v1_rows_0_7_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].1.19.applicability | report_inputs_v1_rows_1_19.f_applicability | string |
| certrace:report-inputs:v1[scope].1.19.reason | report_inputs_v1_rows_1_19.f_reason | string |
| certrace:report-inputs:v1[scope].1.19.updatedAt | report_inputs_v1_rows_1_19.f_updatedAt | string |
| certrace:report-inputs:v1[scope].1.19.rows[].id | report_inputs_v1_rows_1_19_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].1.19.rows[].values.operated | report_inputs_v1_rows_1_19_rows_rows_values.f_operated | string |
| certrace:report-inputs:v1[scope].1.20.applicability | report_inputs_v1_rows_1_20.f_applicability | string |
| certrace:report-inputs:v1[scope].1.20.reason | report_inputs_v1_rows_1_20.f_reason | string |
| certrace:report-inputs:v1[scope].1.20.updatedAt | report_inputs_v1_rows_1_20.f_updatedAt | string |
| certrace:report-inputs:v1[scope].1.20.rows[].id | report_inputs_v1_rows_1_20_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].1.20.rows[].values.start | report_inputs_v1_rows_1_20_rows_rows_values.f_start | string |
| certrace:report-inputs:v1[scope].1.20.rows[].values.months | report_inputs_v1_rows_1_20_rows_rows_values.f_months | numeric → form string |
| certrace:report-inputs:v1[scope].2.0.4.applicability | report_inputs_v1_rows_2_0_4.f_applicability | string |
| certrace:report-inputs:v1[scope].2.0.4.reason | report_inputs_v1_rows_2_0_4.f_reason | string |
| certrace:report-inputs:v1[scope].2.0.4.updatedAt | report_inputs_v1_rows_2_0_4.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.0.4.rows[].id | report_inputs_v1_rows_2_0_4_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.0.4.rows[].values.process | report_inputs_v1_rows_2_0_4_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.0.4.rows[].values.date | report_inputs_v1_rows_2_0_4_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.0.4.rows[].values.change | report_inputs_v1_rows_2_0_4_rows_rows_values.f_change | string |
| certrace:report-inputs:v1[scope].2.0.4.rows[].values.basis | report_inputs_v1_rows_2_0_4_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.0.5.applicability | report_inputs_v1_rows_2_0_5.f_applicability | string |
| certrace:report-inputs:v1[scope].2.0.5.reason | report_inputs_v1_rows_2_0_5.f_reason | string |
| certrace:report-inputs:v1[scope].2.0.5.updatedAt | report_inputs_v1_rows_2_0_5.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.0.5.rows[].id | report_inputs_v1_rows_2_0_5_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.0.5.rows[].values.date | report_inputs_v1_rows_2_0_5_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.0.5.rows[].values.change | report_inputs_v1_rows_2_0_5_rows_rows_values.f_change | string |
| certrace:report-inputs:v1[scope].2.0.5.rows[].values.basis | report_inputs_v1_rows_2_0_5_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.1.11.applicability | report_inputs_v1_rows_2_1_11.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.11.reason | report_inputs_v1_rows_2_1_11.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.11.updatedAt | report_inputs_v1_rows_2_1_11.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.11.rows[].id | report_inputs_v1_rows_2_1_11_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.11.rows[].values.process | report_inputs_v1_rows_2_1_11_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.1.11.rows[].values.classification | report_inputs_v1_rows_2_1_11_rows_rows_values.f_classification | string |
| certrace:report-inputs:v1[scope].2.1.12.applicability | report_inputs_v1_rows_2_1_12.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.12.reason | report_inputs_v1_rows_2_1_12.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.12.updatedAt | report_inputs_v1_rows_2_1_12.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].id | report_inputs_v1_rows_2_1_12_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].values.product | report_inputs_v1_rows_2_1_12_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].values.classification | report_inputs_v1_rows_2_1_12_rows_rows_values.f_classification | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].values.boundary | report_inputs_v1_rows_2_1_12_rows_rows_values.f_boundary | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].values.indirect | report_inputs_v1_rows_2_1_12_rows_rows_values.f_indirect | string |
| certrace:report-inputs:v1[scope].2.1.12.rows[].values.legalBasis | report_inputs_v1_rows_2_1_12_rows_rows_values.f_legalBasis | string |
| certrace:report-inputs:v1[scope].2.1.13.applicability | report_inputs_v1_rows_2_1_13.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.13.reason | report_inputs_v1_rows_2_1_13.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.13.updatedAt | report_inputs_v1_rows_2_1_13.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.13.rows[].id | report_inputs_v1_rows_2_1_13_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.13.rows[].values.product | report_inputs_v1_rows_2_1_13_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.1.13.rows[].values.route | report_inputs_v1_rows_2_1_13_rows_rows_values.f_route | string |
| certrace:report-inputs:v1[scope].2.1.13.rows[].values.equipment | report_inputs_v1_rows_2_1_13_rows_rows_values.f_equipment | string |
| certrace:report-inputs:v1[scope].2.1.14.applicability | report_inputs_v1_rows_2_1_14.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.14.reason | report_inputs_v1_rows_2_1_14.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.14.updatedAt | report_inputs_v1_rows_2_1_14.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.14.rows[].id | report_inputs_v1_rows_2_1_14_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.14.rows[].values.process | report_inputs_v1_rows_2_1_14_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.1.14.rows[].values.basis | report_inputs_v1_rows_2_1_14_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.1.14.rows[].values.evidence | report_inputs_v1_rows_2_1_14_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.1.25.applicability | report_inputs_v1_rows_2_1_25.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.25.reason | report_inputs_v1_rows_2_1_25.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.25.updatedAt | report_inputs_v1_rows_2_1_25.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].id | report_inputs_v1_rows_2_1_25_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.product | report_inputs_v1_rows_2_1_25_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.composition | report_inputs_v1_rows_2_1_25_rows_rows_values.f_composition | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.parameter | report_inputs_v1_rows_2_1_25_rows_rows_values.f_parameter | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.value | report_inputs_v1_rows_2_1_25_rows_rows_values.f_value | numeric → form string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.unit | report_inputs_v1_rows_2_1_25_rows_rows_values.f_unit | string |
| certrace:report-inputs:v1[scope].2.1.25.rows[].values.evidence | report_inputs_v1_rows_2_1_25_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.1.26.applicability | report_inputs_v1_rows_2_1_26.f_applicability | string |
| certrace:report-inputs:v1[scope].2.1.26.reason | report_inputs_v1_rows_2_1_26.f_reason | string |
| certrace:report-inputs:v1[scope].2.1.26.updatedAt | report_inputs_v1_rows_2_1_26.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].id | report_inputs_v1_rows_2_1_26_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.product | report_inputs_v1_rows_2_1_26_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.parameter | report_inputs_v1_rows_2_1_26_rows_rows_values.f_parameter | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.value | report_inputs_v1_rows_2_1_26_rows_rows_values.f_value | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.unit | report_inputs_v1_rows_2_1_26_rows_rows_values.f_unit | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.reference | report_inputs_v1_rows_2_1_26_rows_rows_values.f_reference | string |
| certrace:report-inputs:v1[scope].2.1.26.rows[].values.evidence | report_inputs_v1_rows_2_1_26_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.29.applicability | report_inputs_v1_rows_2_2_29.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.29.reason | report_inputs_v1_rows_2_2_29.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.29.updatedAt | report_inputs_v1_rows_2_2_29.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.29.rows[].id | report_inputs_v1_rows_2_2_29_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.29.rows[].values.version | report_inputs_v1_rows_2_2_29_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.2.29.rows[].values.date | report_inputs_v1_rows_2_2_29_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.2.29.rows[].values.evidence | report_inputs_v1_rows_2_2_29_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.30.applicability | report_inputs_v1_rows_2_2_30.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.30.reason | report_inputs_v1_rows_2_2_30.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.30.updatedAt | report_inputs_v1_rows_2_2_30.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.30.rows[].id | report_inputs_v1_rows_2_2_30_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.30.rows[].values.stream | report_inputs_v1_rows_2_2_30_rows_rows_values.f_stream | string |
| certrace:report-inputs:v1[scope].2.2.30.rows[].values.process | report_inputs_v1_rows_2_2_30_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.2.30.rows[].values.description | report_inputs_v1_rows_2_2_30_rows_rows_values.f_description | string |
| certrace:report-inputs:v1[scope].2.2.31.applicability | report_inputs_v1_rows_2_2_31.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.31.reason | report_inputs_v1_rows_2_2_31.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.31.updatedAt | report_inputs_v1_rows_2_2_31.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].id | report_inputs_v1_rows_2_2_31_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].values.stream | report_inputs_v1_rows_2_2_31_rows_rows_values.f_stream | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].values.formula | report_inputs_v1_rows_2_2_31_rows_rows_values.f_formula | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].values.factorSource | report_inputs_v1_rows_2_2_31_rows_rows_values.f_factorSource | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].values.sampling | report_inputs_v1_rows_2_2_31_rows_rows_values.f_sampling | string |
| certrace:report-inputs:v1[scope].2.2.31.rows[].values.evidence | report_inputs_v1_rows_2_2_31_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.32.applicability | report_inputs_v1_rows_2_2_32.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.32.reason | report_inputs_v1_rows_2_2_32.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.32.updatedAt | report_inputs_v1_rows_2_2_32.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].id | report_inputs_v1_rows_2_2_32_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].values.instrument | report_inputs_v1_rows_2_2_32_rows_rows_values.f_instrument | string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].values.uncertainty | report_inputs_v1_rows_2_2_32_rows_rows_values.f_uncertainty | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].values.calibrated | report_inputs_v1_rows_2_2_32_rows_rows_values.f_calibrated | string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].values.due | report_inputs_v1_rows_2_2_32_rows_rows_values.f_due | string |
| certrace:report-inputs:v1[scope].2.2.32.rows[].values.evidence | report_inputs_v1_rows_2_2_32_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.33.applicability | report_inputs_v1_rows_2_2_33.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.33.reason | report_inputs_v1_rows_2_2_33.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.33.updatedAt | report_inputs_v1_rows_2_2_33.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.33.rows[].id | report_inputs_v1_rows_2_2_33_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.33.rows[].values.process | report_inputs_v1_rows_2_2_33_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.2.33.rows[].values.source | report_inputs_v1_rows_2_2_33_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.2.33.rows[].values.gas | report_inputs_v1_rows_2_2_33_rows_rows_values.f_gas | string |
| certrace:report-inputs:v1[scope].2.2.33.rows[].values.basis | report_inputs_v1_rows_2_2_33_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.2.34.applicability | report_inputs_v1_rows_2_2_34.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.34.reason | report_inputs_v1_rows_2_2_34.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.34.updatedAt | report_inputs_v1_rows_2_2_34.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.34.rows[].id | report_inputs_v1_rows_2_2_34_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.34.rows[].values.stream | report_inputs_v1_rows_2_2_34_rows_rows_values.f_stream | string |
| certrace:report-inputs:v1[scope].2.2.34.rows[].values.basis | report_inputs_v1_rows_2_2_34_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.2.34.rows[].values.evidence | report_inputs_v1_rows_2_2_34_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.35.applicability | report_inputs_v1_rows_2_2_35.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.35.reason | report_inputs_v1_rows_2_2_35.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.35.updatedAt | report_inputs_v1_rows_2_2_35.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.35.rows[].id | report_inputs_v1_rows_2_2_35_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.35.rows[].values.process | report_inputs_v1_rows_2_2_35_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.2.35.rows[].values.flow | report_inputs_v1_rows_2_2_35_rows_rows_values.f_flow | string |
| certrace:report-inputs:v1[scope].2.2.35.rows[].values.basis | report_inputs_v1_rows_2_2_35_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.2.35.rows[].values.evidence | report_inputs_v1_rows_2_2_35_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.36.applicability | report_inputs_v1_rows_2_2_36.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.36.reason | report_inputs_v1_rows_2_2_36.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.36.updatedAt | report_inputs_v1_rows_2_2_36.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.36.rows[].id | report_inputs_v1_rows_2_2_36_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.36.rows[].values.source | report_inputs_v1_rows_2_2_36_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.2.36.rows[].values.basis | report_inputs_v1_rows_2_2_36_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.2.36.rows[].values.eligibility | report_inputs_v1_rows_2_2_36_rows_rows_values.f_eligibility | string |
| certrace:report-inputs:v1[scope].2.2.36.rows[].values.evidence | report_inputs_v1_rows_2_2_36_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.37.applicability | report_inputs_v1_rows_2_2_37.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.37.reason | report_inputs_v1_rows_2_2_37.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.37.updatedAt | report_inputs_v1_rows_2_2_37.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.37.rows[].id | report_inputs_v1_rows_2_2_37_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.37.rows[].values.process | report_inputs_v1_rows_2_2_37_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.2.37.rows[].values.generation | report_inputs_v1_rows_2_2_37_rows_rows_values.f_generation | string |
| certrace:report-inputs:v1[scope].2.2.37.rows[].values.fuel | report_inputs_v1_rows_2_2_37_rows_rows_values.f_fuel | string |
| certrace:report-inputs:v1[scope].2.2.38.applicability | report_inputs_v1_rows_2_2_38.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.38.reason | report_inputs_v1_rows_2_2_38.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.38.updatedAt | report_inputs_v1_rows_2_2_38.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].id | report_inputs_v1_rows_2_2_38_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.process | report_inputs_v1_rows_2_2_38_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.product | report_inputs_v1_rows_2_2_38_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.directShare | report_inputs_v1_rows_2_2_38_rows_rows_values.f_directShare | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.indirectShare | report_inputs_v1_rows_2_2_38_rows_rows_values.f_indirectShare | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.basis | report_inputs_v1_rows_2_2_38_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.2.38.rows[].values.evidence | report_inputs_v1_rows_2_2_38_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.2.39.applicability | report_inputs_v1_rows_2_2_39.f_applicability | string |
| certrace:report-inputs:v1[scope].2.2.39.reason | report_inputs_v1_rows_2_2_39.f_reason | string |
| certrace:report-inputs:v1[scope].2.2.39.updatedAt | report_inputs_v1_rows_2_2_39.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].id | report_inputs_v1_rows_2_2_39_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.product | report_inputs_v1_rows_2_2_39_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.method | report_inputs_v1_rows_2_2_39_rows_rows_values.f_method | string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.benchmark | report_inputs_v1_rows_2_2_39_rows_rows_values.f_benchmark | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.cbamFactor | report_inputs_v1_rows_2_2_39_rows_rows_values.f_cbamFactor | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.cscf | report_inputs_v1_rows_2_2_39_rows_rows_values.f_cscf | numeric → form string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.reference | report_inputs_v1_rows_2_2_39_rows_rows_values.f_reference | string |
| certrace:report-inputs:v1[scope].2.2.39.rows[].values.evidence | report_inputs_v1_rows_2_2_39_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.29.applicability | report_inputs_v1_rows_2_3_29.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.29.reason | report_inputs_v1_rows_2_3_29.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.29.updatedAt | report_inputs_v1_rows_2_3_29.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.29.rows[].id | report_inputs_v1_rows_2_3_29_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.29.rows[].values.process | report_inputs_v1_rows_2_3_29_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.29.rows[].values.name | report_inputs_v1_rows_2_3_29_rows_rows_values.f_name | string |
| certrace:report-inputs:v1[scope].2.3.29.rows[].values.cn | report_inputs_v1_rows_2_3_29_rows_rows_values.f_cn | string |
| certrace:report-inputs:v1[scope].2.3.29.rows[].values.tonnes | report_inputs_v1_rows_2_3_29_rows_rows_values.f_tonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.30.applicability | report_inputs_v1_rows_2_3_30.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.30.reason | report_inputs_v1_rows_2_3_30.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.30.updatedAt | report_inputs_v1_rows_2_3_30.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].id | report_inputs_v1_rows_2_3_30_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.process | report_inputs_v1_rows_2_3_30_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.product | report_inputs_v1_rows_2_3_30_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.route | report_inputs_v1_rows_2_3_30_rows_rows_values.f_route | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.composition | report_inputs_v1_rows_2_3_30_rows_rows_values.f_composition | string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.quantity | report_inputs_v1_rows_2_3_30_rows_rows_values.f_quantity | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.30.rows[].values.tonnes | report_inputs_v1_rows_2_3_30_rows_rows_values.f_tonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.31.applicability | report_inputs_v1_rows_2_3_31.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.31.reason | report_inputs_v1_rows_2_3_31.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.31.updatedAt | report_inputs_v1_rows_2_3_31.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.31.rows[].id | report_inputs_v1_rows_2_3_31_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.31.rows[].values.product | report_inputs_v1_rows_2_3_31_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.3.31.rows[].values.tonnes | report_inputs_v1_rows_2_3_31_rows_rows_values.f_tonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.31.rows[].values.factor | report_inputs_v1_rows_2_3_31_rows_rows_values.f_factor | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.31.rows[].values.evidence | report_inputs_v1_rows_2_3_31_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.32.applicability | report_inputs_v1_rows_2_3_32.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.32.reason | report_inputs_v1_rows_2_3_32.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.32.updatedAt | report_inputs_v1_rows_2_3_32.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].id | report_inputs_v1_rows_2_3_32_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.process | report_inputs_v1_rows_2_3_32_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.material | report_inputs_v1_rows_2_3_32_rows_rows_values.f_material | string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.opening | report_inputs_v1_rows_2_3_32_rows_rows_values.f_opening | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.receipts | report_inputs_v1_rows_2_3_32_rows_rows_values.f_receipts | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.returns | report_inputs_v1_rows_2_3_32_rows_rows_values.f_returns | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.closing | report_inputs_v1_rows_2_3_32_rows_rows_values.f_closing | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.waste | report_inputs_v1_rows_2_3_32_rows_rows_values.f_waste | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.offSpec | report_inputs_v1_rows_2_3_32_rows_rows_values.f_offSpec | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.32.rows[].values.evidence | report_inputs_v1_rows_2_3_32_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.33.applicability | report_inputs_v1_rows_2_3_33.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.33.reason | report_inputs_v1_rows_2_3_33.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.33.updatedAt | report_inputs_v1_rows_2_3_33.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.33.rows[].id | report_inputs_v1_rows_2_3_33_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.33.rows[].values.source | report_inputs_v1_rows_2_3_33_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.33.rows[].values.process | report_inputs_v1_rows_2_3_33_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.33.rows[].values.share | report_inputs_v1_rows_2_3_33_rows_rows_values.f_share | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.34.applicability | report_inputs_v1_rows_2_3_34.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.34.reason | report_inputs_v1_rows_2_3_34.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.34.updatedAt | report_inputs_v1_rows_2_3_34.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.34.rows[].id | report_inputs_v1_rows_2_3_34_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.34.rows[].values.source | report_inputs_v1_rows_2_3_34_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.34.rows[].values.carbon | report_inputs_v1_rows_2_3_34_rows_rows_values.f_carbon | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.34.rows[].values.oxidation | report_inputs_v1_rows_2_3_34_rows_rows_values.f_oxidation | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.34.rows[].values.evidence | report_inputs_v1_rows_2_3_34_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.35.applicability | report_inputs_v1_rows_2_3_35.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.35.reason | report_inputs_v1_rows_2_3_35.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.35.updatedAt | report_inputs_v1_rows_2_3_35.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].id | report_inputs_v1_rows_2_3_35_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.process | report_inputs_v1_rows_2_3_35_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.source | report_inputs_v1_rows_2_3_35_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.gas | report_inputs_v1_rows_2_3_35_rows_rows_values.f_gas | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.start | report_inputs_v1_rows_2_3_35_rows_rows_values.f_start | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.end | report_inputs_v1_rows_2_3_35_rows_rows_values.f_end | string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.flow | report_inputs_v1_rows_2_3_35_rows_rows_values.f_flow | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.concentration | report_inputs_v1_rows_2_3_35_rows_rows_values.f_concentration | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.gwp | report_inputs_v1_rows_2_3_35_rows_rows_values.f_gwp | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.35.rows[].values.evidence | report_inputs_v1_rows_2_3_35_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.36.applicability | report_inputs_v1_rows_2_3_36.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.36.reason | report_inputs_v1_rows_2_3_36.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.36.updatedAt | report_inputs_v1_rows_2_3_36.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.36.rows[].id | report_inputs_v1_rows_2_3_36_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.36.rows[].values.source | report_inputs_v1_rows_2_3_36_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.36.rows[].values.supplier | report_inputs_v1_rows_2_3_36_rows_rows_values.f_supplier | string |
| certrace:report-inputs:v1[scope].2.3.36.rows[].values.installation | report_inputs_v1_rows_2_3_36_rows_rows_values.f_installation | string |
| certrace:report-inputs:v1[scope].2.3.36.rows[].values.country | report_inputs_v1_rows_2_3_36_rows_rows_values.f_country | string |
| certrace:report-inputs:v1[scope].2.3.37.applicability | report_inputs_v1_rows_2_3_37.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.37.reason | report_inputs_v1_rows_2_3_37.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.37.updatedAt | report_inputs_v1_rows_2_3_37.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.37.rows[].id | report_inputs_v1_rows_2_3_37_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.37.rows[].values.source | report_inputs_v1_rows_2_3_37_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.37.rows[].values.process | report_inputs_v1_rows_2_3_37_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.37.rows[].values.product | report_inputs_v1_rows_2_3_37_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.3.37.rows[].values.mwh | report_inputs_v1_rows_2_3_37_rows_rows_values.f_mwh | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.38.applicability | report_inputs_v1_rows_2_3_38.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.38.reason | report_inputs_v1_rows_2_3_38.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.38.updatedAt | report_inputs_v1_rows_2_3_38.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.38.rows[].id | report_inputs_v1_rows_2_3_38_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.38.rows[].values.process | report_inputs_v1_rows_2_3_38_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.38.rows[].values.produced | report_inputs_v1_rows_2_3_38_rows_rows_values.f_produced | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.38.rows[].values.used | report_inputs_v1_rows_2_3_38_rows_rows_values.f_used | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.38.rows[].values.exported | report_inputs_v1_rows_2_3_38_rows_rows_values.f_exported | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.39.applicability | report_inputs_v1_rows_2_3_39.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.39.reason | report_inputs_v1_rows_2_3_39.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.39.updatedAt | report_inputs_v1_rows_2_3_39.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].id | report_inputs_v1_rows_2_3_39_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.process | report_inputs_v1_rows_2_3_39_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.gross | report_inputs_v1_rows_2_3_39_rows_rows_values.f_gross | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.ownUse | report_inputs_v1_rows_2_3_39_rows_rows_values.f_ownUse | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.fuelGj | report_inputs_v1_rows_2_3_39_rows_rows_values.f_fuelGj | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.heatGj | report_inputs_v1_rows_2_3_39_rows_rows_values.f_heatGj | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.39.rows[].values.evidence | report_inputs_v1_rows_2_3_39_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.40.applicability | report_inputs_v1_rows_2_3_40.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.40.reason | report_inputs_v1_rows_2_3_40.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.40.updatedAt | report_inputs_v1_rows_2_3_40.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].id | report_inputs_v1_rows_2_3_40_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].values.source | report_inputs_v1_rows_2_3_40_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].values.contract | report_inputs_v1_rows_2_3_40_rows_rows_values.f_contract | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].values.start | report_inputs_v1_rows_2_3_40_rows_rows_values.f_start | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].values.end | report_inputs_v1_rows_2_3_40_rows_rows_values.f_end | string |
| certrace:report-inputs:v1[scope].2.3.40.rows[].values.evidence | report_inputs_v1_rows_2_3_40_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.41.applicability | report_inputs_v1_rows_2_3_41.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.41.reason | report_inputs_v1_rows_2_3_41.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.41.updatedAt | report_inputs_v1_rows_2_3_41.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].id | report_inputs_v1_rows_2_3_41_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.process | report_inputs_v1_rows_2_3_41_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.kind | report_inputs_v1_rows_2_3_41_rows_rows_values.f_kind | string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.imported | report_inputs_v1_rows_2_3_41_rows_rows_values.f_imported | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.produced | report_inputs_v1_rows_2_3_41_rows_rows_values.f_produced | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.used | report_inputs_v1_rows_2_3_41_rows_rows_values.f_used | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.exported | report_inputs_v1_rows_2_3_41_rows_rows_values.f_exported | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.counterpart | report_inputs_v1_rows_2_3_41_rows_rows_values.f_counterpart | string |
| certrace:report-inputs:v1[scope].2.3.41.rows[].values.evidence | report_inputs_v1_rows_2_3_41_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.42.applicability | report_inputs_v1_rows_2_3_42.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.42.reason | report_inputs_v1_rows_2_3_42.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.42.updatedAt | report_inputs_v1_rows_2_3_42.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].id | report_inputs_v1_rows_2_3_42_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].values.process | report_inputs_v1_rows_2_3_42_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].values.kind | report_inputs_v1_rows_2_3_42_rows_rows_values.f_kind | string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].values.factor | report_inputs_v1_rows_2_3_42_rows_rows_values.f_factor | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].values.reference | report_inputs_v1_rows_2_3_42_rows_rows_values.f_reference | string |
| certrace:report-inputs:v1[scope].2.3.42.rows[].values.evidence | report_inputs_v1_rows_2_3_42_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.43.applicability | report_inputs_v1_rows_2_3_43.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.43.reason | report_inputs_v1_rows_2_3_43.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.43.updatedAt | report_inputs_v1_rows_2_3_43.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].id | report_inputs_v1_rows_2_3_43_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.process | report_inputs_v1_rows_2_3_43_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.direction | report_inputs_v1_rows_2_3_43_rows_rows_values.f_direction | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.tonnes | report_inputs_v1_rows_2_3_43_rows_rows_values.f_tonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.purpose | report_inputs_v1_rows_2_3_43_rows_rows_values.f_purpose | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.recipient | report_inputs_v1_rows_2_3_43_rows_rows_values.f_recipient | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.contact | report_inputs_v1_rows_2_3_43_rows_rows_values.f_contact | string |
| certrace:report-inputs:v1[scope].2.3.43.rows[].values.evidence | report_inputs_v1_rows_2_3_43_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.44.applicability | report_inputs_v1_rows_2_3_44.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.44.reason | report_inputs_v1_rows_2_3_44.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.44.updatedAt | report_inputs_v1_rows_2_3_44.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].id | report_inputs_v1_rows_2_3_44_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.source | report_inputs_v1_rows_2_3_44_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.start | report_inputs_v1_rows_2_3_44_rows_rows_values.f_start | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.end | report_inputs_v1_rows_2_3_44_rows_rows_values.f_end | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.replacement | report_inputs_v1_rows_2_3_44_rows_rows_values.f_replacement | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.basis | report_inputs_v1_rows_2_3_44_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.3.44.rows[].values.evidence | report_inputs_v1_rows_2_3_44_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.3.45.applicability | report_inputs_v1_rows_2_3_45.f_applicability | string |
| certrace:report-inputs:v1[scope].2.3.45.reason | report_inputs_v1_rows_2_3_45.f_reason | string |
| certrace:report-inputs:v1[scope].2.3.45.updatedAt | report_inputs_v1_rows_2_3_45.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].id | report_inputs_v1_rows_2_3_45_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.process | report_inputs_v1_rows_2_3_45_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.source | report_inputs_v1_rows_2_3_45_rows_rows_values.f_source | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.method | report_inputs_v1_rows_2_3_45_rows_rows_values.f_method | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.activity | report_inputs_v1_rows_2_3_45_rows_rows_values.f_activity | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.unit | report_inputs_v1_rows_2_3_45_rows_rows_values.f_unit | string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.factor | report_inputs_v1_rows_2_3_45_rows_rows_values.f_factor | numeric → form string |
| certrace:report-inputs:v1[scope].2.3.45.rows[].values.evidence | report_inputs_v1_rows_2_3_45_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.4.27.applicability | report_inputs_v1_rows_2_4_27.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.27.reason | report_inputs_v1_rows_2_4_27.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.27.updatedAt | report_inputs_v1_rows_2_4_27.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.27.rows[].id | report_inputs_v1_rows_2_4_27_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.27.rows[].values.origin | report_inputs_v1_rows_2_4_27_rows_rows_values.f_origin | string |
| certrace:report-inputs:v1[scope].2.4.27.rows[].values.producingProcess | report_inputs_v1_rows_2_4_27_rows_rows_values.f_producingProcess | string |
| certrace:report-inputs:v1[scope].2.4.28.applicability | report_inputs_v1_rows_2_4_28.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.28.reason | report_inputs_v1_rows_2_4_28.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.28.updatedAt | report_inputs_v1_rows_2_4_28.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].id | report_inputs_v1_rows_2_4_28_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.month | report_inputs_v1_rows_2_4_28_rows_rows_values.f_month | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.producingProcess | report_inputs_v1_rows_2_4_28_rows_rows_values.f_producingProcess | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.process | report_inputs_v1_rows_2_4_28_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.product | report_inputs_v1_rows_2_4_28_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.produced | report_inputs_v1_rows_2_4_28_rows_rows_values.f_produced | numeric → form string |
| certrace:report-inputs:v1[scope].2.4.28.rows[].values.used | report_inputs_v1_rows_2_4_28_rows_rows_values.f_used | numeric → form string |
| certrace:report-inputs:v1[scope].2.4.29.applicability | report_inputs_v1_rows_2_4_29.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.29.reason | report_inputs_v1_rows_2_4_29.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.29.updatedAt | report_inputs_v1_rows_2_4_29.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.29.rows[].id | report_inputs_v1_rows_2_4_29_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.29.rows[].values.process | report_inputs_v1_rows_2_4_29_rows_rows_values.f_process | string |
| certrace:report-inputs:v1[scope].2.4.29.rows[].values.basis | report_inputs_v1_rows_2_4_29_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.4.29.rows[].values.evidence | report_inputs_v1_rows_2_4_29_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.4.30.applicability | report_inputs_v1_rows_2_4_30.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.30.reason | report_inputs_v1_rows_2_4_30.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.30.updatedAt | report_inputs_v1_rows_2_4_30.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.30.rows[].id | report_inputs_v1_rows_2_4_30_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.30.rows[].values.basis | report_inputs_v1_rows_2_4_30_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.4.30.rows[].values.explanation | report_inputs_v1_rows_2_4_30_rows_rows_values.f_explanation | string |
| certrace:report-inputs:v1[scope].2.4.31.applicability | report_inputs_v1_rows_2_4_31.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.31.reason | report_inputs_v1_rows_2_4_31.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.31.updatedAt | report_inputs_v1_rows_2_4_31.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].id | report_inputs_v1_rows_2_4_31_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.method | report_inputs_v1_rows_2_4_31_rows_rows_values.f_method | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.group | report_inputs_v1_rows_2_4_31_rows_rows_values.f_group | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.start | report_inputs_v1_rows_2_4_31_rows_rows_values.f_start | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.end | report_inputs_v1_rows_2_4_31_rows_rows_values.f_end | string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.tonnes | report_inputs_v1_rows_2_4_31_rows_rows_values.f_tonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.4.31.rows[].values.evidence | report_inputs_v1_rows_2_4_31_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.4.32.applicability | report_inputs_v1_rows_2_4_32.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.32.reason | report_inputs_v1_rows_2_4_32.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.32.updatedAt | report_inputs_v1_rows_2_4_32.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].id | report_inputs_v1_rows_2_4_32_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].values.supplier | report_inputs_v1_rows_2_4_32_rows_rows_values.f_supplier | string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].values.location | report_inputs_v1_rows_2_4_32_rows_rows_values.f_location | string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].values.received | report_inputs_v1_rows_2_4_32_rows_rows_values.f_received | string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].values.receivedTonnes | report_inputs_v1_rows_2_4_32_rows_rows_values.f_receivedTonnes | numeric → form string |
| certrace:report-inputs:v1[scope].2.4.32.rows[].values.evidence | report_inputs_v1_rows_2_4_32_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.4.33.applicability | report_inputs_v1_rows_2_4_33.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.33.reason | report_inputs_v1_rows_2_4_33.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.33.updatedAt | report_inputs_v1_rows_2_4_33.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.33.rows[].id | report_inputs_v1_rows_2_4_33_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.33.rows[].values.category | report_inputs_v1_rows_2_4_33_rows_rows_values.f_category | string |
| certrace:report-inputs:v1[scope].2.4.33.rows[].values.classification | report_inputs_v1_rows_2_4_33_rows_rows_values.f_classification | string |
| certrace:report-inputs:v1[scope].2.4.34.applicability | report_inputs_v1_rows_2_4_34.f_applicability | string |
| certrace:report-inputs:v1[scope].2.4.34.reason | report_inputs_v1_rows_2_4_34.f_reason | string |
| certrace:report-inputs:v1[scope].2.4.34.updatedAt | report_inputs_v1_rows_2_4_34.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.4.34.rows[].id | report_inputs_v1_rows_2_4_34_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.4.34.rows[].values.reference | report_inputs_v1_rows_2_4_34_rows_rows_values.f_reference | string |
| certrace:report-inputs:v1[scope].2.4.34.rows[].values.page | report_inputs_v1_rows_2_4_34_rows_rows_values.f_page | string |
| certrace:report-inputs:v1[scope].2.4.34.rows[].values.evidence | report_inputs_v1_rows_2_4_34_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.7.applicability | report_inputs_v1_rows_2_5_7.f_applicability | string |
| certrace:report-inputs:v1[scope].2.5.7.reason | report_inputs_v1_rows_2_5_7.f_reason | string |
| certrace:report-inputs:v1[scope].2.5.7.updatedAt | report_inputs_v1_rows_2_5_7.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].id | report_inputs_v1_rows_2_5_7_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].values.evidence | report_inputs_v1_rows_2_5_7_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].values.owner | report_inputs_v1_rows_2_5_7_rows_rows_values.f_owner | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].values.issued | report_inputs_v1_rows_2_5_7_rows_rows_values.f_issued | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].values.version | report_inputs_v1_rows_2_5_7_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.5.7.rows[].values.expiry | report_inputs_v1_rows_2_5_7_rows_rows_values.f_expiry | string |
| certrace:report-inputs:v1[scope].2.5.8.applicability | report_inputs_v1_rows_2_5_8.f_applicability | string |
| certrace:report-inputs:v1[scope].2.5.8.reason | report_inputs_v1_rows_2_5_8.f_reason | string |
| certrace:report-inputs:v1[scope].2.5.8.updatedAt | report_inputs_v1_rows_2_5_8.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.5.8.rows[].id | report_inputs_v1_rows_2_5_8_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.5.8.rows[].values.evidence | report_inputs_v1_rows_2_5_8_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.8.rows[].values.access | report_inputs_v1_rows_2_5_8_rows_rows_values.f_access | string |
| certrace:report-inputs:v1[scope].2.5.8.rows[].values.basis | report_inputs_v1_rows_2_5_8_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.5.9.applicability | report_inputs_v1_rows_2_5_9.f_applicability | string |
| certrace:report-inputs:v1[scope].2.5.9.reason | report_inputs_v1_rows_2_5_9.f_reason | string |
| certrace:report-inputs:v1[scope].2.5.9.updatedAt | report_inputs_v1_rows_2_5_9.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.5.9.rows[].id | report_inputs_v1_rows_2_5_9_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.5.9.rows[].values.evidence | report_inputs_v1_rows_2_5_9_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.9.rows[].values.sent | report_inputs_v1_rows_2_5_9_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.5.9.rows[].values.recipient | report_inputs_v1_rows_2_5_9_rows_rows_values.f_recipient | string |
| certrace:report-inputs:v1[scope].2.5.9.rows[].values.version | report_inputs_v1_rows_2_5_9_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.5.10.applicability | report_inputs_v1_rows_2_5_10.f_applicability | string |
| certrace:report-inputs:v1[scope].2.5.10.reason | report_inputs_v1_rows_2_5_10.f_reason | string |
| certrace:report-inputs:v1[scope].2.5.10.updatedAt | report_inputs_v1_rows_2_5_10.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].id | report_inputs_v1_rows_2_5_10_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].values.decision | report_inputs_v1_rows_2_5_10_rows_rows_values.f_decision | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].values.reviewer | report_inputs_v1_rows_2_5_10_rows_rows_values.f_reviewer | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].values.date | report_inputs_v1_rows_2_5_10_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].values.basis | report_inputs_v1_rows_2_5_10_rows_rows_values.f_basis | string |
| certrace:report-inputs:v1[scope].2.5.10.rows[].values.evidence | report_inputs_v1_rows_2_5_10_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.11.applicability | report_inputs_v1_rows_2_5_11.f_applicability | string |
| certrace:report-inputs:v1[scope].2.5.11.reason | report_inputs_v1_rows_2_5_11.f_reason | string |
| certrace:report-inputs:v1[scope].2.5.11.updatedAt | report_inputs_v1_rows_2_5_11.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.5.11.rows[].id | report_inputs_v1_rows_2_5_11_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.5.11.rows[].values.evidence | report_inputs_v1_rows_2_5_11_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.5.11.rows[].values.version | report_inputs_v1_rows_2_5_11_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.7.3.applicability | report_inputs_v1_rows_2_7_3.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.3.reason | report_inputs_v1_rows_2_7_3.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.3.updatedAt | report_inputs_v1_rows_2_7_3.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.3.rows[].id | report_inputs_v1_rows_2_7_3_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.3.rows[].values.product | report_inputs_v1_rows_2_7_3_rows_rows_values.f_product | string |
| certrace:report-inputs:v1[scope].2.7.3.rows[].values.criteria | report_inputs_v1_rows_2_7_3_rows_rows_values.f_criteria | string |
| certrace:report-inputs:v1[scope].2.7.3.rows[].values.sent | report_inputs_v1_rows_2_7_3_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.7.3.rows[].values.evidence | report_inputs_v1_rows_2_7_3_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.7.4.applicability | report_inputs_v1_rows_2_7_4.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.4.reason | report_inputs_v1_rows_2_7_4.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.4.updatedAt | report_inputs_v1_rows_2_7_4.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.4.rows[].id | report_inputs_v1_rows_2_7_4_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.4.rows[].values.connection | report_inputs_v1_rows_2_7_4_rows_rows_values.f_connection | string |
| certrace:report-inputs:v1[scope].2.7.4.rows[].values.emissions | report_inputs_v1_rows_2_7_4_rows_rows_values.f_emissions | string |
| certrace:report-inputs:v1[scope].2.7.4.rows[].values.sent | report_inputs_v1_rows_2_7_4_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.7.4.rows[].values.evidence | report_inputs_v1_rows_2_7_4_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.7.5.applicability | report_inputs_v1_rows_2_7_5.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.5.reason | report_inputs_v1_rows_2_7_5.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.5.updatedAt | report_inputs_v1_rows_2_7_5.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.5.rows[].id | report_inputs_v1_rows_2_7_5_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.5.rows[].values.name | report_inputs_v1_rows_2_7_5_rows_rows_values.f_name | string |
| certrace:report-inputs:v1[scope].2.7.5.rows[].values.eori | report_inputs_v1_rows_2_7_5_rows_rows_values.f_eori | string |
| certrace:report-inputs:v1[scope].2.7.6.applicability | report_inputs_v1_rows_2_7_6.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.6.reason | report_inputs_v1_rows_2_7_6.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.6.updatedAt | report_inputs_v1_rows_2_7_6.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].id | report_inputs_v1_rows_2_7_6_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.eori | report_inputs_v1_rows_2_7_6_rows_rows_values.f_eori | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.ppa | report_inputs_v1_rows_2_7_6_rows_rows_values.f_ppa | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.nomination | report_inputs_v1_rows_2_7_6_rows_rows_values.f_nomination | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.congestion | report_inputs_v1_rows_2_7_6_rows_rows_values.f_congestion | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.sent | report_inputs_v1_rows_2_7_6_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.7.6.rows[].values.evidence | report_inputs_v1_rows_2_7_6_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.7.7.applicability | report_inputs_v1_rows_2_7_7.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.7.reason | report_inputs_v1_rows_2_7_7.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.7.updatedAt | report_inputs_v1_rows_2_7_7.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.7.rows[].id | report_inputs_v1_rows_2_7_7_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.7.rows[].values.eori | report_inputs_v1_rows_2_7_7_rows_rows_values.f_eori | string |
| certrace:report-inputs:v1[scope].2.7.7.rows[].values.mwh | report_inputs_v1_rows_2_7_7_rows_rows_values.f_mwh | numeric → form string |
| certrace:report-inputs:v1[scope].2.7.7.rows[].values.evidence | report_inputs_v1_rows_2_7_7_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.7.8.applicability | report_inputs_v1_rows_2_7_8.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.8.reason | report_inputs_v1_rows_2_7_8.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.8.updatedAt | report_inputs_v1_rows_2_7_8.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.8.rows[].id | report_inputs_v1_rows_2_7_8_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.8.rows[].values.eori | report_inputs_v1_rows_2_7_8_rows_rows_values.f_eori | string |
| certrace:report-inputs:v1[scope].2.7.8.rows[].values.version | report_inputs_v1_rows_2_7_8_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.7.8.rows[].values.sent | report_inputs_v1_rows_2_7_8_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.7.8.rows[].values.recipient | report_inputs_v1_rows_2_7_8_rows_rows_values.f_recipient | string |
| certrace:report-inputs:v1[scope].2.7.9.applicability | report_inputs_v1_rows_2_7_9.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.9.reason | report_inputs_v1_rows_2_7_9.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.9.updatedAt | report_inputs_v1_rows_2_7_9.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.9.rows[].id | report_inputs_v1_rows_2_7_9_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.9.rows[].values.reviewer | report_inputs_v1_rows_2_7_9_rows_rows_values.f_reviewer | string |
| certrace:report-inputs:v1[scope].2.7.9.rows[].values.date | report_inputs_v1_rows_2_7_9_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.7.9.rows[].values.version | report_inputs_v1_rows_2_7_9_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.7.9.rows[].values.reviewed | report_inputs_v1_rows_2_7_9_rows_rows_values.f_reviewed | string |
| certrace:report-inputs:v1[scope].2.7.10.applicability | report_inputs_v1_rows_2_7_10.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.10.reason | report_inputs_v1_rows_2_7_10.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.10.updatedAt | report_inputs_v1_rows_2_7_10.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].id | report_inputs_v1_rows_2_7_10_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].values.reviewer | report_inputs_v1_rows_2_7_10_rows_rows_values.f_reviewer | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].values.date | report_inputs_v1_rows_2_7_10_rows_rows_values.f_date | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].values.version | report_inputs_v1_rows_2_7_10_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].values.benchmarks | report_inputs_v1_rows_2_7_10_rows_rows_values.f_benchmarks | string |
| certrace:report-inputs:v1[scope].2.7.10.rows[].values.reviewed | report_inputs_v1_rows_2_7_10_rows_rows_values.f_reviewed | string |
| certrace:report-inputs:v1[scope].2.7.11.applicability | report_inputs_v1_rows_2_7_11.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.11.reason | report_inputs_v1_rows_2_7_11.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.11.updatedAt | report_inputs_v1_rows_2_7_11.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].id | report_inputs_v1_rows_2_7_11_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].values.evidence | report_inputs_v1_rows_2_7_11_rows_rows_values.f_evidence | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].values.verifier | report_inputs_v1_rows_2_7_11_rows_rows_values.f_verifier | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].values.finding | report_inputs_v1_rows_2_7_11_rows_rows_values.f_finding | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].values.status | report_inputs_v1_rows_2_7_11_rows_rows_values.f_status | string |
| certrace:report-inputs:v1[scope].2.7.11.rows[].values.response | report_inputs_v1_rows_2_7_11_rows_rows_values.f_response | string |
| certrace:report-inputs:v1[scope].2.7.12.applicability | report_inputs_v1_rows_2_7_12.f_applicability | string |
| certrace:report-inputs:v1[scope].2.7.12.reason | report_inputs_v1_rows_2_7_12.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.12.updatedAt | report_inputs_v1_rows_2_7_12.f_updatedAt | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].id | report_inputs_v1_rows_2_7_12_rows_rows.f_id | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].values.version | report_inputs_v1_rows_2_7_12_rows_rows_values.f_version | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].values.sent | report_inputs_v1_rows_2_7_12_rows_rows_values.f_sent | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].values.recipient | report_inputs_v1_rows_2_7_12_rows_rows_values.f_recipient | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].values.reason | report_inputs_v1_rows_2_7_12_rows_rows_values.f_reason | string |
| certrace:report-inputs:v1[scope].2.7.12.rows[].values.evidence | report_inputs_v1_rows_2_7_12_rows_rows_values.f_evidence | string |
| certrace:profile.firstName | account_profile.f_firstName | string |
| certrace:profile.lastName | account_profile.f_lastName | string |
| certrace:profile.jobTitle | account_profile.f_jobTitle | string |
| certrace:profile.companyName | masterdata.organization_versions.name (via account_profile._operator_version_id) | string |
| certrace:profile.sector | account_profile.f_sector | string |
| certrace:profile.installationId | account_profile.f_installationId | string |
| certrace:profile.jurisdiction | masterdata.organization_versions.country (via account_profile._operator_version_id) | string |
| certrace:profile.currency | account_profile.f_currency | string |
| certrace:profile.unit | account_profile.f_unit | string |
| certrace:profile.cbamProductCount | account_profile.f_cbamProductCount | string |
| certrace:profile.supplierCount | account_profile.f_supplierCount | string |
| certrace:profile.installationCount | account_profile.f_installationCount | string |
| certrace:profile.customerCount | account_profile.f_customerCount | string |
| certrace:profile.hearAbout | account_profile.f_hearAbout | string |
| certrace:profile.phone | account_profile.f_phone | string |
| certrace:profile.lineId | account_profile.f_lineId | string |
| certrace:profile.onboarded | account_profile.f_onboarded | boolean |
| certrace:profile.goalAchieve[] | profile_goalachieve_items.f__value | string |
| certrace:profile.currentManagement[] | profile_currentmanagement_items.f__value | string |
| certrace:profile.biggestChallenge[] | profile_biggestchallenge_items.f__value | string |
