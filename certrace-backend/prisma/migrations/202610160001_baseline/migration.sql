BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 001

create extension if not exists pgcrypto;

CREATE TABLE default_emission_factors (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    cn_code VARCHAR(8) NOT NULL, 
    reporting_year INTEGER NOT NULL, 
    sector TEXT NOT NULL, 
    route TEXT, 
    specific_embedded_emissions NUMERIC(24, 12) NOT NULL, 
    unit TEXT DEFAULT 'TCO2E_PER_TNE' NOT NULL, 
    source_reference TEXT NOT NULL, 
    regulatory_data_version TEXT NOT NULL, 
    effective_from DATE NOT NULL, 
    effective_to DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT default_factors_cn_code_check CHECK (cn_code ~ '^[0-9]{8}$'), 
    CONSTRAINT default_factors_year_check CHECK (reporting_year between 2024 and 2030), 
    CONSTRAINT default_factors_sector_check CHECK (sector in ('IRON_STEEL', 'ALUMINIUM')), 
    CONSTRAINT default_factors_emissions_check CHECK (specific_embedded_emissions >= 0), 
    CONSTRAINT default_factors_unit_check CHECK (unit = 'TCO2E_PER_TNE'), 
    CONSTRAINT default_factors_cn_year_route_key UNIQUE (cn_code, reporting_year, route)
);

CREATE TABLE declarations (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    declarant_name TEXT NOT NULL, 
    cn_code VARCHAR(8) NOT NULL, 
    reporting_year INTEGER NOT NULL, 
    status TEXT DEFAULT 'DRAFT_CALCULATION_PREVIEW' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT declarations_cn_code_check CHECK (cn_code ~ '^[0-9]{8}$'), 
    CONSTRAINT declarations_year_check CHECK (reporting_year between 2024 and 2030), 
    CONSTRAINT declarations_status_check CHECK (status in ('DRAFT_CALCULATION_PREVIEW', 'READY_FOR_REVIEW', 'SUBMITTED', 'VERIFIED', 'REJECTED'))
);

CREATE TABLE calculation_runs (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    declaration_id UUID NOT NULL, 
    trace_id TEXT NOT NULL, 
    request_payload JSONB NOT NULL, 
    result_payload JSONB NOT NULL, 
    regulatory_data_version TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(declaration_id) REFERENCES declarations (id) ON DELETE CASCADE
);

CREATE TABLE declaration_audit_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    declaration_id UUID NOT NULL, 
    event_type TEXT NOT NULL, 
    actor TEXT, 
    payload JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(declaration_id) REFERENCES declarations (id) ON DELETE CASCADE
);

CREATE INDEX default_emission_factors_lookup_idx ON default_emission_factors (cn_code, reporting_year);

CREATE INDEX declarations_reporting_idx ON declarations (reporting_year, cn_code, status);

CREATE INDEX calculation_runs_declaration_idx ON calculation_runs (declaration_id, created_at desc);

create or replace function touch_updated_at()
        returns trigger language plpgsql as $$
        begin new.updated_at = now(); return new; end;
        $$;
        create trigger declarations_touch_updated_at before update on declarations
        for each row execute function touch_updated_at();;

INSERT INTO alembic_version (version_num) VALUES ('001') RETURNING alembic_version.version_num;

-- Running upgrade 001 -> 002

ALTER TABLE default_emission_factors ADD COLUMN country_of_origin TEXT DEFAULT 'UNSPECIFIED' NOT NULL;

ALTER TABLE default_emission_factors DROP CONSTRAINT default_factors_cn_year_route_key;

ALTER TABLE default_emission_factors ADD CONSTRAINT default_factors_cn_year_route_country_key UNIQUE (cn_code, reporting_year, route, country_of_origin);

DROP INDEX default_emission_factors_lookup_idx;

CREATE INDEX default_emission_factors_lookup_idx ON default_emission_factors (cn_code, reporting_year, country_of_origin);

UPDATE alembic_version SET version_num='002' WHERE alembic_version.version_num = '001';

-- Running upgrade 002 -> 003

CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    email TEXT NOT NULL, 
    password_hash TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT users_email_shape_check CHECK (position('@' in email) > 1)
);

CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE password_resets (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    email TEXT NOT NULL, 
    token TEXT NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    used BOOLEAN DEFAULT false NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX password_resets_email_created_idx ON password_resets (lower(email), created_at DESC);

UPDATE alembic_version SET version_num='003' WHERE alembic_version.version_num = '002';

-- Running upgrade 003 -> 004

alter table public.alembic_version enable row level security;

alter table public.default_emission_factors enable row level security;

alter table public.declarations enable row level security;

alter table public.calculation_runs enable row level security;

alter table public.declaration_audit_events enable row level security;

alter table public.users enable row level security;

alter table public.password_resets enable row level security;

create or replace function public.touch_updated_at()
        returns trigger
        language plpgsql
        set search_path = ''
        as $$
        begin
            new.updated_at = pg_catalog.now();
            return new;
        end;
        $$;

create or replace trigger declarations_touch_updated_at before update on public.declarations for each row execute function public.touch_updated_at();

UPDATE alembic_version SET version_num='004' WHERE alembic_version.version_num = '003';

-- Running upgrade 004 -> 005

ALTER TABLE users ADD COLUMN first_name TEXT;

ALTER TABLE users ADD COLUMN last_name TEXT;

ALTER TABLE users ADD COLUMN company_name TEXT;

ALTER TABLE users ADD COLUMN onboarded BOOLEAN DEFAULT true NOT NULL;

ALTER TABLE users ALTER COLUMN onboarded SET DEFAULT false;

UPDATE alembic_version SET version_num='005' WHERE alembic_version.version_num = '004';

-- Running upgrade 005 -> 006

CREATE TABLE portal_declarations (
    user_id UUID NOT NULL, 
    id TEXT NOT NULL, 
    name TEXT, 
    period TEXT, 
    step TEXT, 
    doc JSONB NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (user_id, id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

alter table public.portal_declarations enable row level security;

create or replace trigger portal_declarations_touch_updated_at before update on public.portal_declarations for each row execute function public.touch_updated_at();

UPDATE alembic_version SET version_num='006' WHERE alembic_version.version_num = '005';

-- Running upgrade 006 -> 007

ALTER TABLE password_resets ADD COLUMN attempts INTEGER DEFAULT 0 NOT NULL;

UPDATE alembic_version SET version_num='007' WHERE alembic_version.version_num = '006';

-- Running upgrade 007 -> 008

CREATE TABLE refresh_tokens (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    user_id UUID NOT NULL, 
    token_hash TEXT NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    used BOOLEAN DEFAULT false NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON refresh_tokens (token_hash);

alter table public.refresh_tokens enable row level security;

UPDATE alembic_version SET version_num='008' WHERE alembic_version.version_num = '007';

-- Running upgrade 008 -> 009

CREATE TABLE smart_links (
    token TEXT NOT NULL, 
    user_id UUID NOT NULL, 
    declaration_id TEXT NOT NULL, 
    supplier_id TEXT NOT NULL, 
    month TEXT, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    revoked_at TIMESTAMP WITH TIME ZONE, 
    state JSONB, 
    status TEXT GENERATED ALWAYS AS (state->>'status') STORED, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (token), 
    FOREIGN KEY(user_id, declaration_id) REFERENCES portal_declarations (user_id, id) ON DELETE CASCADE
);

CREATE INDEX smart_links_declaration_idx ON smart_links (user_id, declaration_id);

alter table public.smart_links enable row level security;

create or replace trigger smart_links_touch_updated_at before update on public.smart_links for each row execute function public.touch_updated_at();

UPDATE alembic_version SET version_num='009' WHERE alembic_version.version_num = '008';

-- Running upgrade 009 -> 010

CREATE TABLE notification_deliveries (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    subject_id TEXT NOT NULL, 
    occasion TEXT NOT NULL, 
    notification_key TEXT NOT NULL, 
    recipient TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT notification_deliveries_subject_occasion_key UNIQUE (subject_id, occasion)
);

alter table public.notification_deliveries enable row level security;

UPDATE alembic_version SET version_num='010' WHERE alembic_version.version_num = '009';

-- Running upgrade 010 -> 011

CREATE TABLE uploaded_files (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    user_id UUID NOT NULL, 
    declaration_id TEXT NOT NULL, 
    doc_id TEXT, 
    uploaded_via_token TEXT, 
    filename TEXT NOT NULL, 
    content_type TEXT NOT NULL, 
    size_bytes BIGINT NOT NULL, 
    sha256 VARCHAR(64) NOT NULL, 
    storage_key TEXT NOT NULL, 
    data BYTEA, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id, declaration_id) REFERENCES portal_declarations (user_id, id) ON DELETE CASCADE, 
    FOREIGN KEY(uploaded_via_token) REFERENCES smart_links (token) ON DELETE SET NULL, 
    CONSTRAINT uploaded_files_size_positive CHECK (size_bytes > 0), 
    UNIQUE (storage_key)
);

CREATE INDEX uploaded_files_declaration_idx ON uploaded_files (user_id, declaration_id);

CREATE INDEX uploaded_files_token_idx ON uploaded_files (uploaded_via_token) WHERE uploaded_via_token is not null;

alter table public.uploaded_files enable row level security;

UPDATE alembic_version SET version_num='011' WHERE alembic_version.version_num = '010';

-- Running upgrade 011 -> 012

CREATE TABLE reminder_subjects (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    user_id UUID NOT NULL, 
    subject_key TEXT NOT NULL, 
    recipient TEXT NOT NULL, 
    supplier_name TEXT NOT NULL, 
    period_label TEXT NOT NULL, 
    due_date DATE NOT NULL, 
    link_url TEXT NOT NULL, 
    locale TEXT, 
    account_locked BOOLEAN DEFAULT false NOT NULL, 
    sent_at TIMESTAMP WITH TIME ZONE, 
    resend_count INTEGER DEFAULT 0 NOT NULL, 
    answered_at TIMESTAMP WITH TIME ZONE, 
    cancelled_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT reminder_subjects_key_unique UNIQUE (user_id, subject_key), 
    CONSTRAINT reminder_subjects_resend_positive CHECK (resend_count >= 0), 
    CONSTRAINT reminder_subjects_recipient_shape CHECK (position('@' in recipient) > 1)
);

CREATE INDEX reminder_subjects_open_idx ON reminder_subjects (due_date) WHERE answered_at is null and cancelled_at is null and sent_at is not null;

alter table public.reminder_subjects enable row level security;

create or replace trigger reminder_subjects_touch_updated_at before update on public.reminder_subjects for each row execute function public.touch_updated_at();

UPDATE alembic_version SET version_num='012' WHERE alembic_version.version_num = '011';

-- Running upgrade 012 -> 013

ALTER TABLE default_emission_factors DROP CONSTRAINT default_factors_cn_code_check;

ALTER TABLE default_emission_factors ADD CONSTRAINT default_factors_cn_code_check CHECK (cn_code ~ '^([0-9]{4}|[0-9]{6}|[0-9]{8})$');

UPDATE alembic_version SET version_num='013' WHERE alembic_version.version_num = '012';

-- Running upgrade 013 -> 014

ALTER TABLE users ADD COLUMN google_sub TEXT;

CREATE UNIQUE INDEX users_google_sub_key ON users (google_sub);

UPDATE alembic_version SET version_num='014' WHERE alembic_version.version_num = '013';

-- Running upgrade 014 -> 015

ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE' NOT NULL;

ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ADD COLUMN suspension_reason TEXT;

ALTER TABLE users ADD CONSTRAINT users_status_check CHECK ((status = 'ACTIVE' AND suspended_at IS NULL) OR (status = 'SUSPENDED' AND suspended_at IS NOT NULL));

UPDATE alembic_version SET version_num='015' WHERE alembic_version.version_num = '014';

-- Running upgrade 015 -> 016

ALTER TABLE users ADD COLUMN anonymised_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users DROP CONSTRAINT users_status_check;

ALTER TABLE users ADD CONSTRAINT users_status_check CHECK ((status = 'ACTIVE' AND suspended_at IS NULL AND anonymised_at IS NULL) OR (status = 'SUSPENDED' AND suspended_at IS NOT NULL AND anonymised_at IS NULL) OR (status = 'ANONYMISED' AND anonymised_at IS NOT NULL));

CREATE TABLE account_audit_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    user_id UUID, 
    event TEXT NOT NULL, 
    actor TEXT NOT NULL, 
    reason TEXT, 
    details JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    CONSTRAINT account_audit_events_event_check CHECK (event in ('SUSPENDED', 'RESTORED', 'ANONYMISED')), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX account_audit_events_user_id_created_at_idx ON account_audit_events (user_id, created_at DESC);

alter table public.account_audit_events enable row level security;

UPDATE alembic_version SET version_num='016' WHERE alembic_version.version_num = '015';

COMMIT;

