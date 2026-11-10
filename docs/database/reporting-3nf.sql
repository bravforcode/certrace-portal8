-- PROPOSED DESIGN ONLY. Not a production migration; do not run against the app database.
-- PostgreSQL 18. Existing authentication users remain in public.users(id uuid).
-- All operational report values are typed relational columns. See DESIGN.md.
CREATE SCHEMA reporting;
SET search_path = reporting, public;

CREATE DOMAIN code2 AS text CHECK (VALUE ~ '^[A-Z]{2}$');
CREATE DOMAIN cn8 AS text CHECK (VALUE ~ '^[0-9]{8}$');
CREATE DOMAIN nonnegative AS numeric(28,12) CHECK (VALUE >= 0);
CREATE DOMAIN percentage AS numeric(15,10) CHECK (VALUE BETWEEN 0 AND 100);
CREATE DOMAIN fraction AS numeric(15,12) CHECK (VALUE BETWEEN 0 AND 1);
CREATE DOMAIN month_start AS date CHECK (EXTRACT(DAY FROM VALUE) = 1);

-- Ownership is stored at entity roots, not copied into every descendant.
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE account_members (
  account_id uuid NOT NULL REFERENCES accounts, user_id uuid NOT NULL REFERENCES public.users,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer','verifier')),
  PRIMARY KEY (account_id, user_id)
);
CREATE TABLE countries (code code2 PRIMARY KEY, name text NOT NULL);
CREATE TABLE units (
  code text PRIMARY KEY, symbol text NOT NULL, quantity_kind text NOT NULL
);
CREATE TABLE cn_codes (code cn8 PRIMARY KEY, description text NOT NULL);
CREATE TABLE production_routes (code text PRIMARY KEY, name text NOT NULL);
CREATE TABLE fuel_types (code text PRIMARY KEY, name text NOT NULL);
CREATE TABLE materials (code text PRIMARY KEY, name text NOT NULL);
CREATE TABLE greenhouse_gases (code text PRIMARY KEY, name text NOT NULL);
CREATE TABLE regulatory_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), version text NOT NULL UNIQUE,
  source_reference text NOT NULL, published_on date NOT NULL
);
CREATE TABLE gwp_values (
  release_id uuid NOT NULL REFERENCES regulatory_releases,
  gas_code text NOT NULL REFERENCES greenhouse_gases, value nonnegative NOT NULL,
  PRIMARY KEY (release_id, gas_code)
);
CREATE TABLE regulatory_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), release_id uuid NOT NULL REFERENCES regulatory_releases,
  factor_code text NOT NULL, value numeric(28,12) NOT NULL, unit_code text NOT NULL REFERENCES units,
  source_reference text NOT NULL, effective_from date NOT NULL, effective_to date,
  UNIQUE (release_id, factor_code), CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Stable identities and immutable versions let older reports keep their original facts.
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts,
  external_reference text, UNIQUE (account_id, external_reference)
);
CREATE TABLE organization_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations,
  version_no integer NOT NULL CHECK (version_no > 0), legal_name text,
  registration_number text, legal_address_english text, country_code code2 REFERENCES countries,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, version_no)
);
CREATE TABLE organization_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_version_id uuid NOT NULL REFERENCES organization_versions,
  name text, email text, telephone text,
  contact_role text NOT NULL CHECK (contact_role IN ('primary','representative','monitoring','other'))
);
CREATE UNIQUE INDEX organization_primary_contact ON organization_contacts(organization_version_id) WHERE contact_role = 'primary';
CREATE TABLE monitoring_responsibilities (
  contact_id uuid PRIMARY KEY REFERENCES organization_contacts,
  job_title text, responsibilities text
);
CREATE TABLE organization_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), from_version_id uuid NOT NULL REFERENCES organization_versions,
  to_version_id uuid NOT NULL REFERENCES organization_versions,
  relationship_type text NOT NULL CHECK (relationship_type IN ('exporter_operator','supplier_producer','other')),
  explanation text
);
CREATE TABLE installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts,
  reference text NOT NULL, UNIQUE (account_id, reference)
);
CREATE TABLE installation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), installation_id uuid NOT NULL REFERENCES installations,
  version_no integer NOT NULL CHECK (version_no > 0), operator_version_id uuid NOT NULL REFERENCES organization_versions,
  name_english text, name_local text, street text, postcode text, po_box text, city text,
  country_code code2 REFERENCES countries, unlocode text, timezone_name text NOT NULL DEFAULT 'UTC',
  latitude numeric(10,7) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK (longitude BETWEEN -180 AND 180),
  economic_activity text, representative_contact_id uuid REFERENCES organization_contacts,
  registry_installation_id text, operator_relationship_basis text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (installation_id, version_no)
);
CREATE TABLE installation_other_goods (
  installation_version_id uuid NOT NULL REFERENCES installation_versions,
  good_key text NOT NULL, name text, description text,
  PRIMARY KEY (installation_version_id, good_key)
);
CREATE TABLE annual_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), installation_id uuid NOT NULL REFERENCES installations,
  reporting_year integer NOT NULL CHECK (reporting_year BETWEEN 2000 AND 2200),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (installation_id, reporting_year)
);
CREATE TABLE report_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid NOT NULL REFERENCES annual_reports,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  installation_version_id uuid NOT NULL REFERENCES installation_versions,
  monitoring_start date, monitoring_end date, operated boolean, is_new_installation boolean,
  operation_start date, actual_monitoring_months integer CHECK (actual_monitoring_months BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','verified','superseded')),
  correction_reason text, supersedes_revision_id uuid REFERENCES report_revisions,
  edit_version integer NOT NULL DEFAULT 1 CHECK (edit_version > 0),
  created_by uuid NOT NULL REFERENCES public.users, created_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz, UNIQUE (report_id, revision_no),
  CHECK (monitoring_end IS NULL OR monitoring_start IS NULL OR monitoring_end >= monitoring_start),
  CHECK (supersedes_revision_id IS NULL OR supersedes_revision_id <> id),
  CHECK ((status = 'draft') = (locked_at IS NULL))
);
CREATE UNIQUE INDEX one_draft_per_report ON report_revisions(report_id) WHERE status = 'draft';
CREATE TABLE report_participants (
  revision_id uuid NOT NULL REFERENCES report_revisions, participant_key text NOT NULL,
  name text, job_title text, email text, user_id uuid REFERENCES public.users,
  PRIMARY KEY (revision_id, participant_key)
);
CREATE TABLE operator_confirmations (
  revision_id uuid PRIMARY KEY REFERENCES report_revisions,
  participant_key text NOT NULL, confirmed_at timestamptz NOT NULL,
  UNIQUE (revision_id, participant_key), -- Explicit composite uniqueness for Prisma's 1:1 relation.
  FOREIGN KEY (revision_id, participant_key) REFERENCES report_participants
);

-- Local keys are only unique inside a revision. All cross references carry that revision.
CREATE TABLE production_processes (
  revision_id uuid NOT NULL REFERENCES report_revisions, process_key text NOT NULL,
  name text, cbam_classification text CHECK (cbam_classification IN ('cbam','non_cbam')),
  boundary_status text CHECK (boundary_status IN ('included','excluded')),
  exclusion_ground text, exclusion_explanation text,
  PRIMARY KEY (revision_id, process_key)
);
CREATE TABLE process_routes (
  revision_id uuid NOT NULL, process_key text NOT NULL, route_code text NOT NULL REFERENCES production_routes,
  PRIMARY KEY (revision_id, process_key, route_code),
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE process_steps (
  revision_id uuid NOT NULL, process_key text NOT NULL, position integer NOT NULL CHECK (position > 0),
  description text NOT NULL, PRIMARY KEY (revision_id, process_key, position),
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE report_goods (
  revision_id uuid NOT NULL, good_key text NOT NULL, process_key text NOT NULL,
  name text, cn_code cn8 REFERENCES cn_codes, description text, output_unit text REFERENCES units,
  benchmark_method_reference text,
  complexity text CHECK (complexity IN ('simple','complex')), emissions_boundary text,
  requires_indirect boolean, indirect_legal_basis text,
  PRIMARY KEY (revision_id, good_key),
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE equipment (
  revision_id uuid NOT NULL REFERENCES report_revisions, equipment_key text NOT NULL,
  name text, tag text, PRIMARY KEY (revision_id, equipment_key)
);
CREATE TABLE good_routes (
  revision_id uuid NOT NULL, good_key text NOT NULL, route_code text NOT NULL REFERENCES production_routes,
  PRIMARY KEY (revision_id, good_key, route_code),
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods
);
CREATE TABLE good_equipment (
  revision_id uuid NOT NULL, good_key text NOT NULL, equipment_key text NOT NULL,
  PRIMARY KEY (revision_id, good_key, equipment_key),
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, equipment_key) REFERENCES equipment
);
CREATE TABLE good_compositions (
  revision_id uuid NOT NULL, composition_key text NOT NULL, good_key text NOT NULL, name text,
  PRIMARY KEY (revision_id, composition_key), FOREIGN KEY (revision_id, good_key) REFERENCES report_goods
);
CREATE TABLE steel_parameters (
  revision_id uuid NOT NULL, composition_key text NOT NULL,
  reducing_agent text, steel_mill_identifier text,
  manganese_pct percentage, chromium_pct percentage, nickel_pct percentage,
  other_alloys_pct percentage, other_materials_pct percentage, carbon_pct percentage,
  scrap_tonnes_per_tonne nonnegative, pre_consumer_scrap_pct percentage,
  PRIMARY KEY (revision_id, composition_key),
  FOREIGN KEY (revision_id, composition_key) REFERENCES good_compositions,
  CHECK (COALESCE(manganese_pct,0) + COALESCE(chromium_pct,0) + COALESCE(nickel_pct,0)
    + COALESCE(other_alloys_pct,0) + COALESCE(other_materials_pct,0) + COALESCE(carbon_pct,0) <= 100)
);
-- A controlled scientific parameter catalogue, not an arbitrary report-field key/value store.
CREATE TABLE sector_parameter_definitions (
  code text PRIMARY KEY, sector text NOT NULL, name text NOT NULL,
  value_kind text NOT NULL CHECK (value_kind IN ('numeric','text')), unit_code text REFERENCES units,
  legal_reference text NOT NULL
);
CREATE TABLE numeric_sector_observations (
  revision_id uuid NOT NULL, composition_key text NOT NULL,
  parameter_code text NOT NULL REFERENCES sector_parameter_definitions, value numeric(28,12),
  PRIMARY KEY (revision_id, composition_key, parameter_code),
  FOREIGN KEY (revision_id, composition_key) REFERENCES good_compositions
);
CREATE TABLE text_sector_observations (
  revision_id uuid NOT NULL, composition_key text NOT NULL,
  parameter_code text NOT NULL REFERENCES sector_parameter_definitions, value text,
  PRIMARY KEY (revision_id, composition_key, parameter_code),
  FOREIGN KEY (revision_id, composition_key) REFERENCES good_compositions
);

-- Originals are separate from document identity, versions, and report evidence bindings.
CREATE TABLE file_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts,
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'), content_type text NOT NULL,
  bytes bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (account_id, sha256),
  CHECK (sha256 = encode(sha256(bytes), 'hex'))
);
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts,
  owner_organization_id uuid REFERENCES organizations, document_type text NOT NULL
);
CREATE TABLE document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_id uuid NOT NULL REFERENCES documents,
  version_no integer NOT NULL CHECK (version_no > 0), original_filename text NOT NULL,
  file_object_id uuid NOT NULL REFERENCES file_objects, issued_on date, expires_on date,
  uploaded_by uuid REFERENCES public.users, uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_no), CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on)
);
CREATE TABLE evidence_items (
  revision_id uuid NOT NULL REFERENCES report_revisions, evidence_key text NOT NULL,
  document_version_id uuid NOT NULL REFERENCES document_versions, month month_start,
  reviewed_by text, reviewed_at timestamptz,
  PRIMARY KEY (revision_id, evidence_key),
  FOREIGN KEY (revision_id, reviewed_by) REFERENCES report_participants
);
CREATE TABLE evidence_checklist_bindings (
  revision_id uuid NOT NULL, evidence_key text NOT NULL, checklist_code text NOT NULL,
  PRIMARY KEY (revision_id, evidence_key, checklist_code),
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE composition_evidence (
  revision_id uuid NOT NULL, composition_key text NOT NULL, evidence_key text NOT NULL,
  PRIMARY KEY (revision_id, composition_key, evidence_key),
  FOREIGN KEY (revision_id, composition_key) REFERENCES good_compositions,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE extraction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_version_id uuid NOT NULL REFERENCES document_versions,
  engine_version text NOT NULL, status text NOT NULL CHECK (status IN ('pending','done','failed')),
  summary text, error_message text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE extraction_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), extraction_run_id uuid NOT NULL REFERENCES extraction_runs,
  input_reference text NOT NULL, field_name text NOT NULL, proposed_text text NOT NULL,
  proposed_unit text REFERENCES units, confidence fraction, page_number integer CHECK (page_number > 0),
  excerpt text, review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','accepted','rejected')),
  reviewed_by uuid REFERENCES public.users, reviewed_at timestamptz, replacement_confirmed boolean NOT NULL DEFAULT false
);

CREATE TABLE monitoring_plans (
  revision_id uuid PRIMARY KEY REFERENCES report_revisions, boundary_description text,
  direct_method text CHECK (direct_method IN ('calculation','measurement','mixed','other')),
  no_combustion boolean, own_generation_fuel_included boolean,
  quality_assurance_method text, qa_reviewer text, qa_review_frequency text,
  diagram_evidence_key text,
  UNIQUE (revision_id, qa_reviewer), UNIQUE (revision_id, diagram_evidence_key),
  FOREIGN KEY (revision_id, qa_reviewer) REFERENCES report_participants,
  FOREIGN KEY (revision_id, diagram_evidence_key) REFERENCES evidence_items
);
CREATE TABLE monitoring_plan_changes (
  revision_id uuid NOT NULL REFERENCES report_revisions, change_key text NOT NULL,
  version_label text, effective_on date, evidence_key text,
  PRIMARY KEY (revision_id, change_key), FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE process_changes (
  revision_id uuid NOT NULL, change_key text NOT NULL, process_key text NOT NULL,
  effective_on date, description text, explanation text,
  PRIMARY KEY (revision_id, change_key), FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE control_system_changes (
  revision_id uuid NOT NULL REFERENCES report_revisions, change_key text NOT NULL,
  effective_on date, description text, explanation text, PRIMARY KEY (revision_id, change_key)
);
CREATE TABLE joint_production_rules (
  revision_id uuid NOT NULL, process_key text NOT NULL, explanation text, evidence_key text,
  PRIMARY KEY (revision_id, process_key), FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE monitored_sources (
  revision_id uuid NOT NULL REFERENCES report_revisions, source_key text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('fuel','material','electricity','cems','other')),
  name text, description text, PRIMARY KEY (revision_id, source_key)
);
CREATE TABLE source_process_links (
  revision_id uuid NOT NULL, source_key text NOT NULL, process_key text NOT NULL,
  PRIMARY KEY (revision_id, source_key, process_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE source_stream_methods (
  revision_id uuid NOT NULL, source_key text NOT NULL, calculation_formula text,
  factor_provenance text, sampling_method text, laboratory_method text, evidence_key text,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE fuel_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, fuel_type_code text REFERENCES fuel_types,
  other_description text, zero_rating_qualification text, qualification_evidence_key text,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources,
  FOREIGN KEY (revision_id, qualification_evidence_key) REFERENCES evidence_items
);
CREATE TABLE material_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, material_code text REFERENCES materials,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources
);
CREATE TABLE electricity_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL,
  supply_type text CHECK (supply_type IN ('grid','ppa','own_generation','direct_connection','other')),
  other_description text, metering_point text, supplier_version_id uuid REFERENCES organization_versions,
  producer_installation_version_id uuid REFERENCES installation_versions,
  method text CHECK (method IN ('actual','default')), eligibility_basis text, eligibility_evidence_key text,
  generation_type text CHECK (generation_type IN ('separate','chp')),
  energy_type text CHECK (energy_type IN ('fossil','renewable','mixed')),
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources,
  FOREIGN KEY (revision_id, eligibility_evidence_key) REFERENCES evidence_items
);
CREATE TABLE instruments (
  revision_id uuid NOT NULL REFERENCES report_revisions, instrument_key text NOT NULL,
  parameter_measured text, make text, model text, tag text, reading_frequency text,
  other_frequency text, measurement_location text, uncertainty_pct percentage,
  PRIMARY KEY (revision_id, instrument_key)
);
CREATE TABLE instrument_sources (
  revision_id uuid NOT NULL, instrument_key text NOT NULL, source_key text NOT NULL,
  PRIMARY KEY (revision_id, instrument_key, source_key),
  FOREIGN KEY (revision_id, instrument_key) REFERENCES instruments,
  FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources
);
CREATE TABLE instrument_calibrations (
  revision_id uuid NOT NULL, calibration_key text NOT NULL, instrument_key text NOT NULL,
  calibrated_on date, due_on date, reference text, evidence_key text,
  PRIMARY KEY (revision_id, calibration_key), FOREIGN KEY (revision_id, instrument_key) REFERENCES instruments,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items,
  CHECK (due_on IS NULL OR calibrated_on IS NULL OR due_on >= calibrated_on)
);
CREATE TABLE cems_source_gases (
  revision_id uuid NOT NULL, source_key text NOT NULL, gas_code text NOT NULL REFERENCES greenhouse_gases,
  monitoring_basis text, PRIMARY KEY (revision_id, source_key, gas_code),
  FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources
);
CREATE TABLE transfer_methods (
  revision_id uuid NOT NULL, process_key text NOT NULL, flow_kind text NOT NULL
    CHECK (flow_kind IN ('heat','waste_gas','co2','electricity')),
  explanation text, evidence_key text, PRIMARY KEY (revision_id, process_key, flow_kind),
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE good_allocation_rules (
  revision_id uuid NOT NULL, good_key text NOT NULL, direct_share percentage, indirect_share percentage,
  method text, evidence_key text, PRIMARY KEY (revision_id, good_key),
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE free_allocation_methods (
  revision_id uuid NOT NULL, good_key text NOT NULL, method text,
  benchmark_factor_id uuid REFERENCES regulatory_factors, cbam_factor_id uuid REFERENCES regulatory_factors,
  cscf_factor_id uuid REFERENCES regulatory_factors, evidence_key text,
  PRIMARY KEY (revision_id, good_key), FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE planned_additional_flows (
  revision_id uuid NOT NULL REFERENCES report_revisions, flow_kind text NOT NULL,
  PRIMARY KEY (revision_id, flow_kind)
);

CREATE TABLE report_months (
  revision_id uuid NOT NULL REFERENCES report_revisions, month month_start NOT NULL,
  no_production boolean, no_production_reason text, no_fuel boolean, no_electricity boolean, notes text,
  PRIMARY KEY (revision_id, month)
);
CREATE TABLE production_outputs (
  revision_id uuid NOT NULL, output_key text NOT NULL, month month_start NOT NULL,
  good_key text NOT NULL, route_code text, composition_key text,
  quantity nonnegative, physical_tonnes nonnegative,
  PRIMARY KEY (revision_id, output_key), FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, good_key, route_code) REFERENCES good_routes,
  FOREIGN KEY (revision_id, composition_key) REFERENCES good_compositions
);
CREATE TABLE non_cbam_outputs (
  revision_id uuid NOT NULL, output_key text NOT NULL, month month_start NOT NULL,
  process_key text NOT NULL, name text, cn_code cn8 REFERENCES cn_codes, tonnes nonnegative,
  PRIMARY KEY (revision_id, output_key), FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE functional_unit_conversions (
  revision_id uuid NOT NULL, good_key text NOT NULL, month month_start NOT NULL,
  units_per_tonne nonnegative, evidence_key text, PRIMARY KEY (revision_id, good_key, month),
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE source_readings (
  revision_id uuid NOT NULL, reading_key text NOT NULL, month month_start NOT NULL, source_key text NOT NULL,
  PRIMARY KEY (revision_id, reading_key), UNIQUE (revision_id, month, source_key),
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, source_key) REFERENCES monitored_sources
);
CREATE TABLE fuel_readings (
  revision_id uuid NOT NULL, reading_key text NOT NULL, burned_quantity nonnegative,
  quantity_unit text REFERENCES units, net_calorific_value nonnegative, ncv_unit text REFERENCES units,
  emission_factor nonnegative, factor_unit text REFERENCES units,
  observed_factor_source text CHECK (observed_factor_source IN ('measured','supplier','other')),
  regulatory_factor_id uuid REFERENCES regulatory_factors,
  biomass_fraction fraction, biomass_qualification_evidence_key text,
  used_for_own_generation boolean, PRIMARY KEY (revision_id, reading_key),
  FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, biomass_qualification_evidence_key) REFERENCES evidence_items,
  CHECK (regulatory_factor_id IS NULL OR (emission_factor IS NULL AND factor_unit IS NULL AND observed_factor_source IS NULL))
);
CREATE TABLE material_readings (
  revision_id uuid NOT NULL, reading_key text NOT NULL,
  method text CHECK (method IN ('standard','mass_balance','other')),
  quantity_tonnes nonnegative, conversion_factor nonnegative,
  flow_direction text CHECK (flow_direction IN ('input','output')),
  PRIMARY KEY (revision_id, reading_key), FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings
);
CREATE TABLE electricity_readings (
  revision_id uuid NOT NULL, reading_key text NOT NULL, consumed_mwh nonnegative,
  actual_emission_factor nonnegative, regulatory_factor_id uuid REFERENCES regulatory_factors,
  PRIMARY KEY (revision_id, reading_key), FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  CHECK (actual_emission_factor IS NULL OR regulatory_factor_id IS NULL)
);
CREATE TABLE source_process_allocations (
  revision_id uuid NOT NULL, reading_key text NOT NULL, process_key text NOT NULL, share percentage,
  PRIMARY KEY (revision_id, reading_key, process_key),
  FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE measured_carbon_factors (
  revision_id uuid NOT NULL, reading_key text NOT NULL, carbon_content fraction, oxidation_factor fraction,
  evidence_key text, PRIMARY KEY (revision_id, reading_key),
  FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE reading_evidence (
  revision_id uuid NOT NULL, reading_key text NOT NULL, evidence_key text NOT NULL,
  PRIMARY KEY (revision_id, reading_key, evidence_key),
  FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE electricity_good_usage (
  revision_id uuid NOT NULL, reading_key text NOT NULL, good_key text NOT NULL, mwh nonnegative,
  PRIMARY KEY (revision_id, reading_key, good_key),
  FOREIGN KEY (revision_id, reading_key) REFERENCES electricity_readings,
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods
);
CREATE TABLE generation_balances (
  revision_id uuid NOT NULL, source_key text NOT NULL, month month_start NOT NULL,
  used_mwh nonnegative, exported_mwh nonnegative,
  gross_generation_mwh nonnegative, auxiliary_use_mwh nonnegative,
  fuel_input_gj nonnegative, useful_heat_gj nonnegative, evidence_key text,
  PRIMARY KEY (revision_id, source_key, month),
  FOREIGN KEY (revision_id, source_key) REFERENCES electricity_sources,
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE power_purchase_agreements (
  revision_id uuid NOT NULL, agreement_key text NOT NULL, source_key text NOT NULL,
  contract_reference text, starts_on date, ends_on date, evidence_key text,
  PRIMARY KEY (revision_id, agreement_key), FOREIGN KEY (revision_id, source_key) REFERENCES electricity_sources,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items,
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE TABLE cems_intervals (
  revision_id uuid NOT NULL, interval_key text NOT NULL, reading_key text NOT NULL,
  gas_code text NOT NULL REFERENCES greenhouse_gases, gwp_release_id uuid REFERENCES regulatory_releases,
  starts_at timestamptz, ends_at timestamptz, volumetric_flow nonnegative, flow_unit text REFERENCES units,
  concentration nonnegative, concentration_unit text REFERENCES units, evidence_key text,
  PRIMARY KEY (revision_id, interval_key), FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (gwp_release_id, gas_code) REFERENCES gwp_values,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE TABLE material_balances (
  revision_id uuid NOT NULL, month month_start NOT NULL, process_key text NOT NULL,
  material_code text NOT NULL REFERENCES materials, opening_tonnes nonnegative, received_tonnes nonnegative,
  returned_tonnes nonnegative, closing_tonnes nonnegative, waste_tonnes nonnegative, off_spec_tonnes nonnegative,
  evidence_key text, PRIMARY KEY (revision_id, month, process_key, material_code),
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE other_monitored_flows (
  revision_id uuid NOT NULL, flow_key text NOT NULL, month month_start NOT NULL, process_key text NOT NULL,
  flow_kind text NOT NULL, quantity numeric(28,12), unit_code text REFERENCES units,
  counterpart_installation_version_id uuid REFERENCES installation_versions, measurement_reference text,
  PRIMARY KEY (revision_id, flow_key), FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE transfer_balances (
  revision_id uuid NOT NULL, balance_key text NOT NULL, month month_start NOT NULL,
  process_key text NOT NULL, flow_kind text NOT NULL CHECK (flow_kind IN ('heat','waste_gas')),
  imported nonnegative, produced nonnegative, used nonnegative, exported nonnegative,
  unit_code text REFERENCES units, counterpart_version_id uuid REFERENCES organization_versions,
  evidence_key text, PRIMARY KEY (revision_id, balance_key),
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE transfer_factors (
  revision_id uuid NOT NULL, process_key text NOT NULL, month month_start NOT NULL,
  flow_kind text NOT NULL CHECK (flow_kind IN ('heat','waste_gas')),
  factor nonnegative, unit_code text REFERENCES units, source_reference text, evidence_key text,
  PRIMARY KEY (revision_id, process_key, month, flow_kind),
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE co2_transfers (
  revision_id uuid NOT NULL, transfer_key text NOT NULL, month month_start NOT NULL, process_key text NOT NULL,
  direction text CHECK (direction IN ('captured','received','transferred')), tonnes nonnegative, purpose text,
  recipient_contact_id uuid REFERENCES organization_contacts, evidence_key text,
  PRIMARY KEY (revision_id, transfer_key), FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE data_gaps (
  revision_id uuid NOT NULL REFERENCES report_revisions, gap_key text NOT NULL,
  starts_at timestamptz, ends_at timestamptz, reason text, estimation_method text, estimated_share percentage,
  reviewer_key text, reviewed_on date, PRIMARY KEY (revision_id, gap_key),
  FOREIGN KEY (revision_id, reviewer_key) REFERENCES report_participants,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE TABLE gap_reading_replacements (
  revision_id uuid NOT NULL, gap_key text NOT NULL, reading_key text NOT NULL,
  replacement_explanation text, basis text, evidence_key text,
  PRIMARY KEY (revision_id, gap_key, reading_key), FOREIGN KEY (revision_id, gap_key) REFERENCES data_gaps,
  FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE other_method_readings (
  revision_id uuid NOT NULL, reading_key text NOT NULL, method text, activity_quantity numeric(28,12),
  activity_unit text REFERENCES units, factor numeric(28,12), factor_unit text REFERENCES units, evidence_key text,
  PRIMARY KEY (revision_id, reading_key), FOREIGN KEY (revision_id, reading_key) REFERENCES source_readings,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);

-- Producer reports and accreditations are reusable external facts; a source points to them.
CREATE TABLE verifier_accreditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), verifier_version_id uuid NOT NULL REFERENCES organization_versions,
  accreditation_number text NOT NULL, issuing_country code2 REFERENCES countries, expires_on date
);
CREATE TABLE accreditation_scopes (
  accreditation_id uuid NOT NULL REFERENCES verifier_accreditations, sector_code text NOT NULL,
  PRIMARY KEY (accreditation_id, sector_code)
);
CREATE TABLE verification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_version_id uuid NOT NULL UNIQUE REFERENCES document_versions,
  accreditation_id uuid NOT NULL REFERENCES verifier_accreditations,
  coverage_start date, coverage_end date,
  CHECK (coverage_end IS NULL OR coverage_start IS NULL OR coverage_end >= coverage_start)
);
CREATE TABLE producer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), installation_version_id uuid NOT NULL REFERENCES installation_versions,
  period_start date, period_end date, period_basis text CHECK (period_basis IN ('default_period','actual_production_time')),
  period_explanation text, verification_report_id uuid REFERENCES verification_reports,
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);
CREATE TABLE precursor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts,
  name text, cn_code cn8 REFERENCES cn_codes, category text,
  complexity text CHECK (complexity IN ('simple','complex'))
);
CREATE TABLE producer_report_goods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), producer_report_id uuid NOT NULL REFERENCES producer_reports,
  precursor_product_id uuid NOT NULL REFERENCES precursor_products, route_code text REFERENCES production_routes,
  direct_specific_emissions nonnegative, indirect_specific_emissions nonnegative, indirect_applicable boolean,
  functional_unit text REFERENCES units
);
CREATE TABLE precursor_sources (
  revision_id uuid NOT NULL REFERENCES report_revisions, source_key text NOT NULL,
  display_label text, supplier_version_id uuid REFERENCES organization_versions,
  source_kind text NOT NULL CHECK (source_kind IN ('producer_report','official_default','internal','scrap')),
  PRIMARY KEY (revision_id, source_key)
);
CREATE TABLE actual_precursor_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, producer_good_id uuid NOT NULL REFERENCES producer_report_goods,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources
);
CREATE TABLE default_precursor_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, precursor_product_id uuid NOT NULL REFERENCES precursor_products,
  producer_installation_version_id uuid REFERENCES installation_versions,
  default_factor_id uuid REFERENCES public.default_emission_factors,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources
);
CREATE TABLE internal_precursor_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, producing_good_key text NOT NULL,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, producing_good_key) REFERENCES report_goods
);
CREATE TABLE scrap_precursor_sources (
  revision_id uuid NOT NULL, source_key text NOT NULL, precursor_product_id uuid NOT NULL REFERENCES precursor_products,
  producer_installation_version_id uuid REFERENCES installation_versions,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources
);
CREATE TABLE precursor_consuming_goods (
  revision_id uuid NOT NULL, source_key text NOT NULL, good_key text NOT NULL,
  PRIMARY KEY (revision_id, source_key, good_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods
);
CREATE TABLE precursor_monthly_use (
  revision_id uuid NOT NULL, source_key text NOT NULL, month month_start NOT NULL,
  process_key text NOT NULL, used_tonnes nonnegative,
  PRIMARY KEY (revision_id, source_key, month, process_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes
);
CREATE TABLE internal_precursor_output (
  revision_id uuid NOT NULL, source_key text NOT NULL, month month_start NOT NULL, produced_tonnes nonnegative,
  PRIMARY KEY (revision_id, source_key, month), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, month) REFERENCES report_months
);
CREATE TABLE internal_precursor_good_use (
  revision_id uuid NOT NULL, source_key text NOT NULL, month month_start NOT NULL,
  good_key text NOT NULL, used_tonnes nonnegative,
  PRIMARY KEY (revision_id, source_key, month, good_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  FOREIGN KEY (revision_id, good_key) REFERENCES report_goods
);
CREATE TABLE precursor_exclusions (
  revision_id uuid NOT NULL, source_key text NOT NULL, process_key text NOT NULL,
  explanation text, evidence_key text, PRIMARY KEY (revision_id, source_key, process_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, process_key) REFERENCES production_processes,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE precursor_combination_groups (
  revision_id uuid NOT NULL REFERENCES report_revisions, group_key text NOT NULL,
  name text, method text, explanation text, PRIMARY KEY (revision_id, group_key)
);
CREATE TABLE precursor_combination_members (
  revision_id uuid NOT NULL, group_key text NOT NULL, member_key text NOT NULL, source_key text NOT NULL,
  period_start date, period_end date, tonnes nonnegative, evidence_key text,
  PRIMARY KEY (revision_id, group_key, member_key),
  FOREIGN KEY (revision_id, group_key) REFERENCES precursor_combination_groups,
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items,
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);
CREATE TABLE precursor_receipts (
  revision_id uuid NOT NULL, receipt_key text NOT NULL, source_key text NOT NULL,
  supplier_version_id uuid REFERENCES organization_versions, location text,
  received_on date, received_tonnes nonnegative, evidence_key text,
  PRIMARY KEY (revision_id, receipt_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE precursor_report_references (
  revision_id uuid NOT NULL, source_key text NOT NULL, reference_key text NOT NULL,
  reference text, page_reference text, evidence_key text, PRIMARY KEY (revision_id, source_key, reference_key),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE producer_report_reviews (
  revision_id uuid NOT NULL, source_key text NOT NULL, decision text CHECK (decision IN ('accepted','rejected','pending')),
  reviewer_key text, reviewed_on date, explanation text, evidence_key text,
  PRIMARY KEY (revision_id, source_key), FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  FOREIGN KEY (revision_id, reviewer_key) REFERENCES report_participants,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);

CREATE TABLE evidence_disclosures (
  revision_id uuid NOT NULL, evidence_key text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('internal','verifier','declarant')),
  explanation text, PRIMARY KEY (revision_id, evidence_key, audience),
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE evidence_access_grants (
  revision_id uuid NOT NULL, evidence_key text NOT NULL, grantee_user_id uuid NOT NULL REFERENCES public.users,
  granted_by uuid NOT NULL REFERENCES public.users, granted_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
  PRIMARY KEY (revision_id, evidence_key, grantee_user_id),
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE evidence_deliveries (
  revision_id uuid NOT NULL, delivery_key text NOT NULL, evidence_key text NOT NULL,
  recipient_contact_id uuid NOT NULL REFERENCES organization_contacts, sent_at timestamptz,
  PRIMARY KEY (revision_id, delivery_key), FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE indirect_electricity_confirmations (
  revision_id uuid NOT NULL, good_key text NOT NULL, criteria_met boolean, evidence_sent boolean, evidence_key text,
  PRIMARY KEY (revision_id, good_key), FOREIGN KEY (revision_id, good_key) REFERENCES report_goods,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE imported_electricity_confirmations (
  revision_id uuid PRIMARY KEY REFERENCES report_revisions, direct_connection_met boolean,
  emissions_criteria_met boolean, evidence_sent boolean, evidence_key text,
  UNIQUE (revision_id, evidence_key),
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE electricity_declarants (
  revision_id uuid NOT NULL REFERENCES report_revisions, declarant_key text NOT NULL,
  organization_version_id uuid NOT NULL REFERENCES organization_versions, eori text NOT NULL,
  PRIMARY KEY (revision_id, declarant_key), UNIQUE (revision_id, eori)
);
CREATE TABLE electricity_addenda (
  revision_id uuid NOT NULL, declarant_key text NOT NULL,
  ppa_criteria_met boolean, nomination_met boolean, congestion_met boolean, evidence_sent boolean,
  eligible_imported_mwh nonnegative,
  PRIMARY KEY (revision_id, declarant_key), FOREIGN KEY (revision_id, declarant_key) REFERENCES electricity_declarants
);
CREATE TABLE addendum_evidence (
  revision_id uuid NOT NULL, declarant_key text NOT NULL, evidence_key text NOT NULL,
  PRIMARY KEY (revision_id, declarant_key, evidence_key),
  FOREIGN KEY (revision_id, declarant_key) REFERENCES electricity_addenda,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE addendum_deliveries (
  revision_id uuid NOT NULL, delivery_key text NOT NULL, declarant_key text NOT NULL,
  recipient_contact_id uuid NOT NULL REFERENCES organization_contacts, sent_at timestamptz,
  PRIMARY KEY (revision_id, delivery_key), FOREIGN KEY (revision_id, declarant_key) REFERENCES electricity_addenda
);
CREATE TABLE annual_reviews (
  revision_id uuid NOT NULL REFERENCES report_revisions, output_kind text NOT NULL CHECK (output_kind IN ('oer','oser')),
  reviewer_key text, reviewed_on date, reviewed boolean, benchmarks_confirmed boolean,
  PRIMARY KEY (revision_id, output_kind), FOREIGN KEY (revision_id, reviewer_key) REFERENCES report_participants
);
CREATE TABLE annual_verification_reports (
  revision_id uuid NOT NULL REFERENCES report_revisions, verification_report_id uuid NOT NULL REFERENCES verification_reports,
  PRIMARY KEY (revision_id, verification_report_id)
);
CREATE TABLE verification_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), verification_report_id uuid NOT NULL REFERENCES verification_reports,
  finding_reference text NOT NULL, description text NOT NULL, UNIQUE (verification_report_id, finding_reference)
);
CREATE TABLE finding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), finding_id uuid NOT NULL REFERENCES verification_findings,
  author_id uuid NOT NULL REFERENCES public.users, response text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE finding_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), finding_id uuid NOT NULL REFERENCES verification_findings,
  status text NOT NULL CHECK (status IN ('open','answered','resolved','reopened')),
  actor_id uuid NOT NULL REFERENCES public.users, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE report_signoffs (
  revision_id uuid NOT NULL, signer_key text NOT NULL,
  signoff_kind text NOT NULL CHECK (signoff_kind IN ('operator','internal','verifier')),
  signed_at timestamptz NOT NULL, PRIMARY KEY (revision_id, signer_key, signoff_kind),
  FOREIGN KEY (revision_id, signer_key) REFERENCES report_participants
);
CREATE TABLE report_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES report_revisions,
  recipient_contact_id uuid NOT NULL REFERENCES organization_contacts, submitted_at timestamptz NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.users, reason text, evidence_key text,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);
CREATE TABLE carbon_price_claims (
  revision_id uuid NOT NULL REFERENCES report_revisions, claim_key text NOT NULL,
  instrument text CHECK (instrument IN ('ets','tax','levy','excise_embedded','none')),
  amount_per_tonne nonnegative, currency char(3) CHECK (currency ~ '^[A-Z]{3}$'),
  emissions_covered_pct percentage, PRIMARY KEY (revision_id, claim_key)
);
CREATE TABLE carbon_price_adjustments (
  revision_id uuid NOT NULL, claim_key text NOT NULL, adjustment_key text NOT NULL,
  adjustment_kind text CHECK (adjustment_kind IN ('rebate','free_allocation','other')),
  description text, amount nonnegative, unit_code text REFERENCES units,
  PRIMARY KEY (revision_id, claim_key, adjustment_key),
  FOREIGN KEY (revision_id, claim_key) REFERENCES carbon_price_claims
);
CREATE TABLE carbon_price_evidence (
  revision_id uuid NOT NULL, claim_key text NOT NULL, evidence_key text NOT NULL,
  PRIMARY KEY (revision_id, claim_key, evidence_key),
  FOREIGN KEY (revision_id, claim_key) REFERENCES carbon_price_claims,
  FOREIGN KEY (revision_id, evidence_key) REFERENCES evidence_items
);

-- These tables record runs/outputs, not a second editable set of input totals.
CREATE TABLE calculation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES report_revisions,
  engine_version text NOT NULL, regulatory_release_id uuid NOT NULL REFERENCES regulatory_releases,
  input_digest text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revision_id, engine_version, regulatory_release_id, input_digest)
);
CREATE TABLE calculation_process_results (
  run_id uuid NOT NULL REFERENCES calculation_runs, process_key text NOT NULL,
  direct_emissions numeric(28,12), indirect_emissions numeric(28,12), activity_level nonnegative,
  PRIMARY KEY (run_id, process_key)
);
CREATE TABLE calculation_good_results (
  run_id uuid NOT NULL REFERENCES calculation_runs, good_key text NOT NULL,
  direct_specific_emissions numeric(28,12), indirect_specific_emissions numeric(28,12),
  specific_embedded_free_allocation numeric(28,12), default_share percentage, actual_indirect_share percentage,
  PRIMARY KEY (run_id, good_key)
);
CREATE TABLE calculation_composition_results (
  run_id uuid NOT NULL REFERENCES calculation_runs, composition_key text NOT NULL,
  direct_specific_emissions numeric(28,12), indirect_specific_emissions numeric(28,12),
  PRIMARY KEY (run_id, composition_key)
);
CREATE TABLE calculation_source_results (
  run_id uuid NOT NULL REFERENCES calculation_runs, source_key text NOT NULL,
  direct_emissions numeric(28,12), indirect_emissions numeric(28,12),
  combined_electricity_factor numeric(28,12), PRIMARY KEY (run_id, source_key)
);
CREATE TABLE calculation_precursor_results (
  run_id uuid NOT NULL REFERENCES calculation_runs, group_key text NOT NULL,
  combined_direct_intensity numeric(28,12), combined_indirect_intensity numeric(28,12),
  PRIMARY KEY (run_id, group_key)
);
CREATE TABLE calculation_findings (
  run_id uuid NOT NULL REFERENCES calculation_runs, finding_key text NOT NULL,
  input_reference text NOT NULL, severity text NOT NULL CHECK (severity IN ('info','warning','blocker')),
  code text NOT NULL, message text NOT NULL, PRIMARY KEY (run_id, finding_key)
);
CREATE TABLE report_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES calculation_runs,
  output_kind text NOT NULL CHECK (output_kind IN ('oer','oser','electricity_addendum','evidence_package','review_dataset')),
  format text NOT NULL CHECK (format IN ('json','pdf','xlsx','xml','zip')),
  template_version text NOT NULL, document_version_id uuid NOT NULL REFERENCES document_versions,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Applicability is a fact about a topic/scope, separate from the topic's typed rows.
-- No answer values or arbitrary report documents are stored here.
CREATE TABLE input_topics (code text PRIMARY KEY, title text NOT NULL);
CREATE TABLE operator_topic_decisions (
  organization_version_id uuid NOT NULL REFERENCES organization_versions,
  topic_code text NOT NULL REFERENCES input_topics CHECK (topic_code IN ('0.4','0.5','0.6','0.7')),
  applicable boolean, reason text,
  PRIMARY KEY (organization_version_id, topic_code),
  CHECK (applicable IS DISTINCT FROM false OR NULLIF(btrim(reason),'') IS NOT NULL)
);
CREATE TABLE annual_topic_decisions (
  revision_id uuid NOT NULL REFERENCES report_revisions, topic_code text NOT NULL REFERENCES input_topics,
  applicable boolean, reason text, PRIMARY KEY (revision_id, topic_code),
  CHECK (topic_code !~ '^(0\.|2\.3\.|2\.4\.)' AND topic_code <> '2.5.10'),
  CHECK (applicable IS DISTINCT FROM false OR NULLIF(btrim(reason),'') IS NOT NULL)
);
CREATE TABLE monthly_topic_decisions (
  revision_id uuid NOT NULL, month month_start NOT NULL,
  topic_code text NOT NULL REFERENCES input_topics CHECK (topic_code LIKE '2.3.%'),
  applicable boolean, reason text, PRIMARY KEY (revision_id, month, topic_code),
  FOREIGN KEY (revision_id, month) REFERENCES report_months,
  CHECK (applicable IS DISTINCT FROM false OR NULLIF(btrim(reason),'') IS NOT NULL)
);
CREATE TABLE precursor_topic_decisions (
  revision_id uuid NOT NULL, source_key text NOT NULL,
  topic_code text NOT NULL REFERENCES input_topics CHECK (topic_code LIKE '2.4.%' OR topic_code = '2.5.10'),
  applicable boolean, reason text, PRIMARY KEY (revision_id, source_key, topic_code),
  FOREIGN KEY (revision_id, source_key) REFERENCES precursor_sources,
  CHECK (applicable IS DISTINCT FROM false OR NULLIF(btrim(reason),'') IS NOT NULL)
);

-- Derived values: do not accept a separately editable total.
CREATE VIEW producer_good_emissions AS
SELECT g.*, CASE WHEN indirect_applicable = false THEN direct_specific_emissions
  WHEN direct_specific_emissions IS NULL OR indirect_specific_emissions IS NULL OR indirect_applicable IS NULL THEN NULL
  ELSE direct_specific_emissions + indirect_specific_emissions END AS total_specific_emissions
FROM producer_report_goods g;
CREATE VIEW annual_precursor_use AS
SELECT revision_id, source_key, sum(used_tonnes) AS used_tonnes
FROM precursor_monthly_use GROUP BY revision_id, source_key;
CREATE VIEW generation_performance AS
SELECT b.*, gross_generation_mwh - auxiliary_use_mwh AS net_generation_mwh,
  (gross_generation_mwh - auxiliary_use_mwh) * 3.6 / NULLIF(fuel_input_gj,0) AS electric_efficiency,
  useful_heat_gj / NULLIF(fuel_input_gj,0) AS heat_efficiency
FROM generation_balances b;

-- Efficient parent lookups for ownership, report loading, and file retrieval.
CREATE INDEX organizations_account ON organizations(account_id);
CREATE INDEX installations_account ON installations(account_id);
CREATE INDEX revisions_report ON report_revisions(report_id);
CREATE INDEX documents_account ON documents(account_id);
CREATE INDEX producer_reports_installation ON producer_reports(installation_version_id);
CREATE INDEX source_readings_source ON source_readings(revision_id, source_key);
CREATE INDEX source_readings_month ON source_readings(revision_id, month);
CREATE INDEX evidence_by_document ON evidence_items(document_version_id);
CREATE INDEX findings_report ON verification_findings(verification_report_id);

-- Further cross-entity integrity and immutable-revision triggers are defined below.
CREATE FUNCTION report_account(target_revision uuid) RETURNS uuid
LANGUAGE sql STABLE SET search_path = reporting, public AS $$
  SELECT i.account_id FROM report_revisions v JOIN annual_reports r ON r.id = v.report_id
    JOIN installations i ON i.id = r.installation_id WHERE v.id = target_revision
$$;

-- Resolve ownership by following foreign keys, without redundant account_id columns.
CREATE FUNCTION entity_account(entity text, target uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = reporting, public AS $$
DECLARE result uuid;
BEGIN
  CASE entity
    WHEN 'organization' THEN SELECT account_id INTO result FROM organizations WHERE id = target;
    WHEN 'organization_version' THEN
      SELECT o.account_id INTO result FROM organization_versions v JOIN organizations o ON o.id=v.organization_id WHERE v.id=target;
    WHEN 'installation_version' THEN
      SELECT i.account_id INTO result FROM installation_versions v JOIN installations i ON i.id=v.installation_id WHERE v.id=target;
    WHEN 'contact' THEN SELECT entity_account('organization_version', organization_version_id) INTO result FROM organization_contacts WHERE id=target;
    WHEN 'document' THEN SELECT account_id INTO result FROM documents WHERE id=target;
    WHEN 'document_version' THEN SELECT entity_account('document', document_id) INTO result FROM document_versions WHERE id=target;
    WHEN 'file' THEN SELECT account_id INTO result FROM file_objects WHERE id=target;
    WHEN 'precursor_product' THEN SELECT account_id INTO result FROM precursor_products WHERE id=target;
    WHEN 'producer_report' THEN SELECT entity_account('installation_version', installation_version_id) INTO result FROM producer_reports WHERE id=target;
    WHEN 'producer_good' THEN SELECT entity_account('producer_report', producer_report_id) INTO result FROM producer_report_goods WHERE id=target;
    WHEN 'accreditation' THEN SELECT entity_account('organization_version', verifier_version_id) INTO result FROM verifier_accreditations WHERE id=target;
    WHEN 'verification_report' THEN SELECT entity_account('document_version', document_version_id) INTO result FROM verification_reports WHERE id=target;
    ELSE RAISE EXCEPTION 'Unknown ownership entity %', entity;
  END CASE;
  RETURN result;
END $$;

CREATE FUNCTION guard_account_links() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE row_value jsonb := to_jsonb(NEW); owner_id uuid; related_owner uuid; field_name text; entity text;
BEGIN
  -- JSON here only inspects a trigger row; no operational JSON is persisted.
  IF row_value ? 'revision_id' THEN owner_id := report_account((row_value->>'revision_id')::uuid);
  ELSIF row_value ? 'account_id' THEN owner_id := (row_value->>'account_id')::uuid;
  ELSE
    CASE TG_TABLE_NAME
      WHEN 'installation_versions' THEN SELECT account_id INTO owner_id FROM installations WHERE id=NEW.installation_id;
      WHEN 'organization_relationships' THEN owner_id := entity_account('organization_version',NEW.from_version_id);
      WHEN 'organization_contacts' THEN owner_id := entity_account('organization_version',NEW.organization_version_id);
      WHEN 'document_versions' THEN owner_id := entity_account('document',NEW.document_id);
      WHEN 'producer_reports' THEN owner_id := entity_account('installation_version',NEW.installation_version_id);
      WHEN 'producer_report_goods' THEN owner_id := entity_account('producer_report',NEW.producer_report_id);
      WHEN 'verification_reports' THEN owner_id := entity_account('document_version',NEW.document_version_id);
      WHEN 'verifier_accreditations' THEN owner_id := entity_account('organization_version',NEW.verifier_version_id);
      WHEN 'report_outputs' THEN SELECT report_account(revision_id) INTO owner_id FROM calculation_runs WHERE id=NEW.run_id;
      ELSE RETURN NEW;
    END CASE;
  END IF;
  FOR field_name, entity IN SELECT * FROM (VALUES
    ('operator_version_id','organization_version'),('supplier_version_id','organization_version'),
    ('from_version_id','organization_version'),('to_version_id','organization_version'),
    ('organization_version_id','organization_version'),('verifier_version_id','organization_version'),
    ('counterpart_version_id','organization_version'),('installation_version_id','installation_version'),
    ('producer_installation_version_id','installation_version'),('counterpart_installation_version_id','installation_version'),
    ('recipient_contact_id','contact'),('representative_contact_id','contact'),
    ('file_object_id','file'),('document_version_id','document_version'),('owner_organization_id','organization'),
    ('precursor_product_id','precursor_product'),('producer_good_id','producer_good'),
    ('verification_report_id','verification_report'),('accreditation_id','accreditation')) AS refs(field_name,entity)
  LOOP
    IF row_value->>field_name IS NOT NULL THEN
      related_owner := entity_account(entity,(row_value->>field_name)::uuid);
      IF owner_id IS DISTINCT FROM related_owner AND related_owner IS NOT NULL THEN
        RAISE EXCEPTION 'Cross-account reference in %.%', TG_TABLE_NAME, field_name USING ERRCODE='23514';
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE FUNCTION guard_report_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE installation uuid; version_installation uuid; report_year integer; previous_report uuid;
BEGIN
  SELECT installation_id,reporting_year INTO installation,report_year FROM annual_reports WHERE id=NEW.report_id;
  SELECT installation_id INTO version_installation FROM installation_versions WHERE id=NEW.installation_version_id;
  IF installation IS DISTINCT FROM version_installation THEN
    RAISE EXCEPTION 'Installation version does not belong to this annual report' USING ERRCODE='23514';
  END IF;
  IF (NEW.monitoring_start IS NOT NULL AND EXTRACT(YEAR FROM NEW.monitoring_start) <> report_year)
    OR (NEW.monitoring_end IS NOT NULL AND EXTRACT(YEAR FROM NEW.monitoring_end) <> report_year) THEN
    RAISE EXCEPTION 'Monitoring dates must be in the reporting year' USING ERRCODE='23514';
  END IF;
  IF NEW.supersedes_revision_id IS NOT NULL THEN
    SELECT report_id INTO previous_report FROM report_revisions WHERE id=NEW.supersedes_revision_id;
    IF previous_report IS DISTINCT FROM NEW.report_id THEN
      RAISE EXCEPTION 'A correction must supersede a revision of the same report' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_OP='UPDATE' AND OLD.locked_at IS NOT NULL AND (to_jsonb(NEW)-'status') IS DISTINCT FROM (to_jsonb(OLD)-'status') THEN
    RAISE EXCEPTION 'Create a new revision to amend a locked report' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER report_revision_integrity BEFORE INSERT OR UPDATE ON report_revisions
FOR EACH ROW EXECUTE FUNCTION guard_report_revision();

CREATE FUNCTION guard_report_month() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE report_year integer;
BEGIN
  SELECT r.reporting_year INTO report_year FROM report_revisions v JOIN annual_reports r ON r.id=v.report_id WHERE v.id=NEW.revision_id;
  IF EXTRACT(YEAR FROM NEW.month) <> report_year THEN
    RAISE EXCEPTION 'Month is outside the reporting year' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER report_month_integrity BEFORE INSERT OR UPDATE ON report_months
FOR EACH ROW EXECUTE FUNCTION guard_report_month();
ALTER TABLE evidence_items ADD FOREIGN KEY (revision_id,month) REFERENCES report_months;

CREATE FUNCTION guard_good_composition() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
BEGIN
  IF NEW.composition_key IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM good_compositions c WHERE c.revision_id=NEW.revision_id AND c.composition_key=NEW.composition_key AND c.good_key=NEW.good_key
  ) THEN RAISE EXCEPTION 'Output composition belongs to another good' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER output_composition_integrity BEFORE INSERT OR UPDATE ON production_outputs
FOR EACH ROW EXECUTE FUNCTION guard_good_composition();

CREATE FUNCTION guard_good_route() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM report_goods g JOIN process_routes p
    ON p.revision_id=g.revision_id AND p.process_key=g.process_key
    WHERE g.revision_id=NEW.revision_id AND g.good_key=NEW.good_key AND p.route_code=NEW.route_code)
  THEN RAISE EXCEPTION 'Good route is not a route of its production process' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER good_route_integrity BEFORE INSERT OR UPDATE ON good_routes
FOR EACH ROW EXECUTE FUNCTION guard_good_route();

CREATE FUNCTION guard_subtype() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE actual text;
BEGIN
  IF TG_ARGV[0]='source' THEN
    SELECT source_kind INTO actual FROM monitored_sources WHERE revision_id=NEW.revision_id AND source_key=NEW.source_key;
  ELSIF TG_ARGV[0]='reading' THEN
    SELECT s.source_kind INTO actual FROM source_readings r JOIN monitored_sources s
      ON s.revision_id=r.revision_id AND s.source_key=r.source_key
      WHERE r.revision_id=NEW.revision_id AND r.reading_key=NEW.reading_key;
  ELSIF TG_ARGV[0]='precursor' THEN
    SELECT source_kind INTO actual FROM precursor_sources WHERE revision_id=NEW.revision_id AND source_key=NEW.source_key;
  ELSIF TG_ARGV[0]='parameter' THEN
    SELECT value_kind INTO actual FROM sector_parameter_definitions WHERE code=NEW.parameter_code;
  END IF;
  IF actual IS DISTINCT FROM TG_ARGV[1] THEN
    RAISE EXCEPTION 'Subtype mismatch for %: expected %, got %',TG_TABLE_NAME,TG_ARGV[1],actual USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION guard_result_scope() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE revision uuid; found boolean; row_value jsonb := to_jsonb(NEW);
BEGIN
  SELECT revision_id INTO revision FROM calculation_runs WHERE id=NEW.run_id;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM reporting.%I WHERE revision_id=$1 AND %I=$2)',TG_ARGV[0],TG_ARGV[1])
    INTO found USING revision,row_value->>TG_ARGV[1];
  IF NOT found THEN RAISE EXCEPTION 'Result points outside its calculation revision' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;

-- Draft writes lock the parent, so submission and an autosave cannot race.
CREATE FUNCTION guard_input_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
DECLARE revision uuid; frozen timestamptz;
BEGIN
  IF TG_OP='DELETE' THEN revision:=OLD.revision_id; ELSE revision:=NEW.revision_id; END IF;
  IF TG_OP='UPDATE' AND NEW.revision_id <> OLD.revision_id THEN
    RAISE EXCEPTION 'Clone rows when creating a revision; do not reparent inputs' USING ERRCODE='23514';
  END IF;
  SELECT locked_at INTO frozen FROM report_revisions WHERE id=revision FOR UPDATE;
  IF frozen IS NOT NULL THEN RAISE EXCEPTION 'Report inputs are locked; create a correction revision' USING ERRCODE='23514'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION guard_calculation_run() RETURNS trigger
LANGUAGE plpgsql SET search_path = reporting, public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM report_revisions WHERE id=NEW.revision_id AND locked_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Persisted calculation runs require a frozen input revision' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER calculation_frozen_inputs BEFORE INSERT OR UPDATE ON calculation_runs
FOR EACH ROW EXECUTE FUNCTION guard_calculation_run();

DO $$
DECLARE table_name text; spec text[];
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'installation_versions','organization_relationships','organization_contacts','documents','document_versions',
    'producer_reports','producer_report_goods','verifier_accreditations','verification_reports','report_outputs',
    'electricity_sources','other_monitored_flows','transfer_balances','co2_transfers','precursor_sources',
    'actual_precursor_sources','default_precursor_sources','scrap_precursor_sources','precursor_receipts',
    'evidence_items','evidence_deliveries','electricity_declarants','addendum_deliveries','annual_verification_reports','report_submissions'
  ] LOOP
    EXECUTE format('CREATE TRIGGER account_link_integrity BEFORE INSERT OR UPDATE ON reporting.%I FOR EACH ROW EXECUTE FUNCTION reporting.guard_account_links()',table_name);
  END LOOP;
  FOREACH spec SLICE 1 IN ARRAY ARRAY[
    ['fuel_sources','source','fuel'],['material_sources','source','material'],['electricity_sources','source','electricity'],
    ['cems_source_gases','source','cems'],['fuel_readings','reading','fuel'],['material_readings','reading','material'],
    ['electricity_readings','reading','electricity'],['cems_intervals','reading','cems'],['other_method_readings','reading','other'],
    ['actual_precursor_sources','precursor','producer_report'],['default_precursor_sources','precursor','official_default'],
    ['internal_precursor_sources','precursor','internal'],['scrap_precursor_sources','precursor','scrap'],
    ['numeric_sector_observations','parameter','numeric'],['text_sector_observations','parameter','text']
  ] LOOP
    EXECUTE format('CREATE TRIGGER subtype_integrity BEFORE INSERT OR UPDATE ON reporting.%I FOR EACH ROW EXECUTE FUNCTION reporting.guard_subtype(%L,%L)',spec[1],spec[2],spec[3]);
  END LOOP;
  FOREACH spec SLICE 1 IN ARRAY ARRAY[
    ['calculation_process_results','production_processes','process_key'],['calculation_good_results','report_goods','good_key'],
    ['calculation_composition_results','good_compositions','composition_key'],['calculation_source_results','monitored_sources','source_key'],
    ['calculation_precursor_results','precursor_combination_groups','group_key']
  ] LOOP
    EXECUTE format('CREATE TRIGGER result_scope_integrity BEFORE INSERT OR UPDATE ON reporting.%I FOR EACH ROW EXECUTE FUNCTION reporting.guard_result_scope(%L,%L)',spec[1],spec[2],spec[3]);
  END LOOP;
  FOR table_name IN SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING(table_catalog,table_schema,table_name)
    WHERE c.table_schema='reporting' AND c.column_name='revision_id' AND t.table_type='BASE TABLE'
    AND c.table_name NOT IN ('calculation_runs','report_submissions','annual_verification_reports',
      'evidence_access_grants','evidence_deliveries','addendum_deliveries')
  LOOP
    EXECUTE format('CREATE TRIGGER input_revision_lock BEFORE INSERT OR UPDATE OR DELETE ON reporting.%I FOR EACH ROW EXECUTE FUNCTION reporting.guard_input_revision()',table_name);
  END LOOP;
END $$;

-- Prevent changes to identities that would invalidate already checked descendant links.
CREATE FUNCTION guard_identity_parent() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF to_jsonb(NEW)->TG_ARGV[0] IS DISTINCT FROM to_jsonb(OLD)->TG_ARGV[0] THEN
    RAISE EXCEPTION 'Do not reparent %.%; create a new identity/version',TG_TABLE_NAME,TG_ARGV[0] USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER annual_report_year_immutable BEFORE UPDATE ON annual_reports
FOR EACH ROW EXECUTE FUNCTION guard_identity_parent('reporting_year');
DO $$
DECLARE spec text[];
BEGIN
  FOREACH spec SLICE 1 IN ARRAY ARRAY[
    ['organizations','account_id'],['installations','account_id'],['documents','account_id'],['file_objects','account_id'],
    ['precursor_products','account_id'],['organization_versions','organization_id'],['installation_versions','installation_id'],
    ['document_versions','document_id'],['organization_contacts','organization_version_id'],['annual_reports','installation_id'],
    ['report_revisions','report_id'],['monitored_sources','source_kind'],['precursor_sources','source_kind'],
    ['report_goods','process_key'],['good_compositions','good_key'],['source_readings','source_key'],
    ['calculation_runs','revision_id'],['sector_parameter_definitions','value_kind']
  ] LOOP
    EXECUTE format('CREATE TRIGGER identity_parent_immutable BEFORE UPDATE ON reporting.%I FOR EACH ROW EXECUTE FUNCTION reporting.guard_identity_parent(%L)',spec[1],spec[2]);
  END LOOP;
END $$;

-- Application grants, RLS, shared-profile sealing, and completeness validation are
-- implementation gates described in DESIGN.md; this file is a design prototype.

-- Catalogue of the existing UI reference labels.
INSERT INTO reporting.input_topics(code,title) VALUES
('0.1','Operator legal name'),
('0.2','Operator registration number'),
('0.3','Operator legal address in English'),
('0.4','Country of establishment'),
('0.5','Company contact name, email and phone'),
('0.6','Person responsible for monitoring/reporting'),
('0.7','Operator-to-installation and exporter-to-operator relationship'),
('1.1','Installation name in English'),
('1.2','Installation local name'),
('1.3','Installation reference'),
('1.4','Street and number'),
('1.5','Post code'),
('1.6','P.O. Box'),
('1.7','City'),
('1.8','Country'),
('1.9','UN/LOCODE'),
('1.10','Main emissions source latitude'),
('1.11','Main emissions source longitude'),
('1.12','Economic activity'),
('1.13','Authorised representative name'),
('1.14','Contact email'),
('1.15','Telephone'),
('1.16','Other goods: name'),
('1.17','Other goods: description'),
('1.18','CBAM Registry installation ID, if assigned'),
('1.19','Whether the installation operated in the reporting year'),
('1.20','New-installation status and actual monitoring duration in months'),
('2.0.1','Reporting year'),
('2.0.2','Monitoring period start'),
('2.0.3','Monitoring period end'),
('2.0.4','Effective dates of process, route and boundary changes'),
('2.0.5','Control-system changes and effective dates'),
('2.1.1','Production process name'),
('2.1.2','Production routes / technology'),
('2.1.3','Production steps in order'),
('2.1.4','Product name'),
('2.1.5','Exact product CN code'),
('2.1.6','Product description'),
('2.1.7','Product output / functional unit'),
('2.1.8','Applicable benchmark / method reference'),
('2.1.9','Other inputs / source streams'),
('2.1.10','Additional monitored flow types'),
('2.1.11','CBAM or non-CBAM process classification'),
('2.1.12','Product simple/complex classification and emissions boundary'),
('2.1.13','Product-to-route and equipment links'),
('2.1.14','Same-process joint-production treatment'),
('2.1.15','Main reducing agent'),
('2.1.16','Steel mill identification number'),
('2.1.17','Manganese composition (%)'),
('2.1.18','Chromium composition (%)'),
('2.1.19','Nickel composition (%)'),
('2.1.20','Other alloying elements (%)'),
('2.1.21','Other materials (%)'),
('2.1.22','Carbon composition (%)'),
('2.1.23','Tonnes scrap per tonne steel'),
('2.1.24','Pre-consumer scrap (%)'),
('2.1.25','Sector parameters stored separately for every good/composition'),
('2.1.26','Additional applicable Annex IV section 2 sector parameters'),
('2.2.1','Boundary description'),
('2.2.2','Processes inside the boundary, in order'),
('2.2.3','Excluded process'),
('2.2.4','Ground for exclusion'),
('2.2.5','Exclusion explanation'),
('2.2.6','Direct emissions method'),
('2.2.7','Fuel types / other fuel description'),
('2.2.8','Confirmation no fuel is burned inside the boundary'),
('2.2.9','Electricity supply type / other supply description'),
('2.2.10','Electricity metering point'),
('2.2.11','Instrument parameter measured'),
('2.2.12','Instrument make, model and tag'),
('2.2.13','Reading frequency / other frequency description'),
('2.2.14','Last calibration date'),
('2.2.15','CEMS calibration reference'),
('2.2.16','CEMS measurement point location'),
('2.2.17','Confirmation own-generation fuel is included'),
('2.2.18','Data gap start'),
('2.2.19','Data gap end'),
('2.2.20','Data gap reason'),
('2.2.21','Estimation method'),
('2.2.22','Estimated share'),
('2.2.23','Gap reviewer'),
('2.2.24','Gap review date'),
('2.2.25','Quality assurance method'),
('2.2.26','Quality assurance reviewer'),
('2.2.27','Quality assurance review frequency'),
('2.2.28','Installation diagram original file'),
('2.2.29','Monitoring plan version/effective date record'),
('2.2.30','Source streams linked to individual processes'),
('2.2.31','Calculation formula, factor provenance, sampling/lab method'),
('2.2.32','Instrument uncertainty and complete calibration history'),
('2.2.33','CEMS greenhouse gases and monitored source identities'),
('2.2.34','Zero-rated fuel qualification method'),
('2.2.35','Heat, waste-gas and CO2 transfer/allocation methods'),
('2.2.36','Indirect electricity actual/default method and eligibility basis'),
('2.2.37','Own-generation CHP/separate and fossil/renewable classification'),
('2.2.38','Direct/indirect allocation method by process'),
('2.2.39','Specific embedded free-allocation method by good'),
('2.3.1','Production quantity for the original product'),
('2.3.2','Output quantity by process/product'),
('2.3.3','Production route for the output'),
('2.3.4','Confirmation no output this month'),
('2.3.5','Reason for zero production'),
('2.3.6','Confirmation no fuel burned'),
('2.3.7','Confirmation no electricity consumed'),
('2.3.8','Fuel type'),
('2.3.9','Fuel quantity actually burned'),
('2.3.10','Fuel quantity unit'),
('2.3.11','Net calorific value'),
('2.3.12','Fuel emission factor'),
('2.3.13','Fuel factor source'),
('2.3.14','Biomass fraction'),
('2.3.15','Fuel used for own electricity generation'),
('2.3.16','Electricity source type'),
('2.3.17','Electricity consumed per source (MWh)'),
('2.3.18','Electricity emission factor per source'),
('2.3.19','Process-emissions method'),
('2.3.20','Process-emissions material'),
('2.3.21','Process-emissions material quantity'),
('2.3.22','Process-emissions conversion factor'),
('2.3.23','Monthly notes'),
('2.3.24','Other monitored flow quantity'),
('2.3.25','Other monitored flow unit'),
('2.3.26','Other monitored flow production process'),
('2.3.27','Other flow source / receiving installation'),
('2.3.28','Other flow measurement / calculation reference'),
('2.3.29','Non-CBAM goods output per process'),
('2.3.30','Output split across multiple routes for one good'),
('2.3.31','Physical tonnes and conversion to a different functional unit'),
('2.3.32','Stock movements, receipts, returns, waste and off-spec output'),
('2.3.33','Fuel/material source-stream and consuming-process links'),
('2.3.34','Variable carbon content and oxidation factor by stream'),
('2.3.35','CEMS readings by source/gas, intervals, flow and concentration'),
('2.3.36','Electricity supplier installation and country per source'),
('2.3.37','Electricity consumption by production process and relevant good'),
('2.3.38','On-site electricity produced, used and exported separately'),
('2.3.39','Gross generation, own use, net generation and CHP efficiencies'),
('2.3.40','PPA identity, contract and factor evidence'),
('2.3.41','Heat and waste-gas import/production/use/export separately per process'),
('2.3.42','Heat factors and their sources'),
('2.3.43','CO2 captured/received/transferred: quantity, purpose and recipient contact'),
('2.3.44','Data gaps linked to affected source readings'),
('2.3.45','Other-method emissions and supporting activity data'),
('2.4.1','CBAM precursor catalogue selection'),
('2.4.2','Precursor name'),
('2.4.3','Exact precursor CN code'),
('2.4.4','Country of production'),
('2.4.5','Producer legal name'),
('2.4.6','Producing installation'),
('2.4.7','Producer Registry installation ID, if assigned'),
('2.4.8','Producer production route / technology'),
('2.4.9','Producer reporting period start'),
('2.4.10','Producer reporting period end'),
('2.4.11','Products using this precursor, grouped by process'),
('2.4.12','Emissions basis: producer report or official EU default'),
('2.4.13','Published EU default and source reference'),
('2.4.14','Producer verification report file'),
('2.4.15','Verified direct specific emissions'),
('2.4.16','Verified indirect specific emissions, if applicable'),
('2.4.17','Total specific emissions'),
('2.4.18','Verification coverage start'),
('2.4.19','Verification coverage end'),
('2.4.20','Verifier name'),
('2.4.21','Accreditation number'),
('2.4.22','Accreditation issuing country'),
('2.4.23','Verification sectoral scope'),
('2.4.24','Verification report issue date'),
('2.4.25','Accreditation expiry date'),
('2.4.26','Tonnes actually used by month and consuming process'),
('2.4.27','Internal/external production status and internal producing process'),
('2.4.28','Internal precursor produced/used by installation and consuming process'),
('2.4.29','Same-process exclusion treatment'),
('2.4.30','Producer period basis: default period or actual production time'),
('2.4.31','Source/period quantities and Article 14 combination/subset method'),
('2.4.32','Supplier distinct from producer, source location and receipts'),
('2.4.33','Precursor category / complex-good status'),
('2.4.34','Upstream references retained from the producer report'),
('2.5.1','Original document file; sample documents use the same review flow'),
('2.5.2','Document type'),
('2.5.3','Month covered / annual scope'),
('2.5.4','Linked evidence checklist row'),
('2.5.5','Review extracted values and units before accepting'),
('2.5.6','Confirm replacement of previously entered values'),
('2.5.7','Document owner, issue date, version and expiry controls'),
('2.5.8','Document disclosure choice (server access enforcement not implemented)'),
('2.5.9','Evidence actually sent to the verifier, date and report version'),
('2.5.10','Precursor report accreditation/validity review decision'),
('2.5.11','Stored original installation diagram linked to the monitoring plan'),
('2.6.1','Installation and individual-process direct emissions totals'),
('2.6.2','Applicable installation/process indirect emissions'),
('2.6.3','Process activity levels and attributed emissions'),
('2.6.4','Specific direct emissions per good, composition and functional unit'),
('2.6.5','Specific indirect emissions per applicable good'),
('2.6.6','Default-value share and actual/default indirect shares'),
('2.6.7','Combined electricity factor and actual/PPA factor result'),
('2.6.8','Heat, waste-gas and electricity balances by process'),
('2.6.9','Combined precursor intensities across sources/periods'),
('2.6.10','Specific embedded free allocation per good'),
('2.6.11','Five largest goods, fuels, process materials and CEMS sources'),
('2.6.12','Allocation, route totals, units and double-counting checks'),
('2.6.13','Precursor use year and annual quantity derived from monthly use'),
('2.6.14','Data-quality statement: fully monitored or default values used'),
('2.7.1','Operator sign-off name'),
('2.7.2','Operator sign-off job title'),
('2.7.3','Actual indirect-electricity criteria confirmation'),
('2.7.4','Imported-electricity direct-connection / emissions criteria confirmation'),
('2.7.5','Declarant name and EORI, for the conditional electricity addendum'),
('2.7.6','Addendum actual-value criteria and evidence-submission confirmation'),
('2.7.7','Eligible electricity imported by that declarant from the installation'),
('2.7.8','Applicable addenda sent to the verifier'),
('2.7.9','OER final dataset/report review (review dataset; finished EU report layout not implemented)'),
('2.7.10','OSER final dataset/report review, benchmark/method confirmation (review dataset; finished EU report layout not implemented)'),
('2.7.11','Dedicated verifier-report attachment and findings workflow'),
('2.7.12','Annual submissions, correction history and report versions'),
('2.7.13','Carbon price paid per tonne CO2e (additional existing input)'),
('2.7.14','Carbon-price instrument (additional existing input)'),
('2.7.15','Share of emissions covered by carbon price (additional existing input)'),
('2.7.16','Rebates/free allocation against carbon-price claim (additional existing input)'),
('2.7.17','Carbon-price receipt (additional existing input)');
