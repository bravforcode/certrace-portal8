-- Users for local/self-contained authentication
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    job_title TEXT,
    company_name TEXT,
    sector TEXT,
    installation_id TEXT,
    jurisdiction TEXT,
    currency TEXT,
    unit TEXT,
    onboarded BOOLEAN DEFAULT FALSE,
    goal_achieve TEXT,
    current_management TEXT,
    biggest_challenge TEXT,
    supplier_count INT DEFAULT 0,
    hear_about TEXT,
    shape_certrace TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations (optional, fallback to profiles.company_name if basic)
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'standard',
    plan_label TEXT DEFAULT 'Standard',
    origin TEXT DEFAULT 'TH',
    sector TEXT DEFAULT 'Steel & iron',
    installation_id TEXT,
    seats_used INT DEFAULT 1,
    seats_total INT DEFAULT 8,
    mrr DOUBLE PRECISION DEFAULT 0.0,
    health INT DEFAULT 100,
    renewal_risk INT DEFAULT 0,
    cs_owner_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    open_tickets INT DEFAULT 0,
    sectors TEXT[] DEFAULT '{}'
);

-- Declarations
CREATE TABLE IF NOT EXISTS public.declarations (
    id TEXT PRIMARY KEY,
    user_id UUID,
    name TEXT,
    regulation TEXT,
    origin TEXT,
    market TEXT,
    sector TEXT,
    period TEXT,
    due TEXT,
    due_in_days INT,
    step TEXT DEFAULT 'collect',
    total_embedded DOUBLE PRECISION,
    carbon_price_paid DOUBLE PRECISION,
    kind TEXT DEFAULT 'cbam',
    title TEXT,
    product_count INT DEFAULT 0,
    requests JSONB DEFAULT '[]'::jsonb,
    included_field_ids JSONB DEFAULT '[]'::jsonb,
    suppliers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Directory Suppliers
CREATE TABLE IF NOT EXISTS public.directory_suppliers (
    id TEXT PRIMARY KEY,
    user_id UUID,
    company TEXT,
    contact TEXT,
    email TEXT,
    country TEXT,
    material TEXT,
    readiness TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Smart Link Workspace State
CREATE TABLE IF NOT EXISTS public.supplier_states (
    token TEXT PRIMARY KEY,
    decl_id TEXT,
    supplier_id TEXT,
    status TEXT DEFAULT 'new',
    values JSONB DEFAULT '{}'::jsonb,
    docs JSONB DEFAULT '{}'::jsonb,
    seats JSONB DEFAULT '[]'::jsonb,
    profile JSONB DEFAULT '{}'::jsonb,
    profile_saved BOOLEAN DEFAULT FALSE,
    versions JSONB DEFAULT '[]'::jsonb,
    last_check JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    unlocked JSONB DEFAULT '[]'::jsonb,
    unlocked_docs JSONB DEFAULT '[]'::jsonb,
    revision_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members / Seats
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    user_id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    dept TEXT,
    kind TEXT DEFAULT 'internal',
    builtin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Exporter Review State (persisted per declaration)
CREATE TABLE IF NOT EXISTS public.exporter_decl_states (
    decl_id TEXT PRIMARY KEY,
    reviews JSONB DEFAULT '{}'::jsonb,
    summary_generated_at TIMESTAMPTZ,
    package_generated_at TIMESTAMPTZ,
    filed_at TIMESTAMPTZ,
    recipients JSONB DEFAULT '{}'::jsonb,
    dispatch JSONB DEFAULT '{}'::jsonb,
    signoffs JSONB DEFAULT '{}'::jsonb,
    reminders_sent JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Staff
CREATE TABLE IF NOT EXISTS public.admin_staff (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    role_id TEXT,
    status TEXT DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Verification Queue
CREATE TABLE IF NOT EXISTS public.admin_queue (
    id TEXT PRIMARY KEY,
    kind TEXT,
    org_id TEXT,
    decl_id TEXT,
    summary TEXT,
    detail TEXT,
    raised_at TIMESTAMPTZ DEFAULT now(),
    sla_hours INT,
    status TEXT DEFAULT 'open',
    assignee_id TEXT,
    resolution TEXT
);

-- Admin Regulatory Dataset Drafts
CREATE TABLE IF NOT EXISTS public.admin_regulatory_drafts (
    id TEXT PRIMARY KEY,
    dataset_id TEXT,
    title TEXT,
    diff JSONB,
    status TEXT DEFAULT 'draft',
    drafted_by_id TEXT,
    drafted_at TIMESTAMPTZ DEFAULT now(),
    approved_by_id TEXT,
    decided_at TIMESTAMPTZ,
    note TEXT
);

-- Admin Invoices
CREATE TABLE IF NOT EXISTS public.admin_invoices (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    amount DOUBLE PRECISION,
    period TEXT,
    status TEXT DEFAULT 'due',
    issued_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Support Tickets
CREATE TABLE IF NOT EXISTS public.admin_tickets (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    subject TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    routed_to TEXT,
    assignee_id TEXT,
    opened_at TIMESTAMPTZ DEFAULT now(),
    sla_due TIMESTAMPTZ,
    thread JSONB DEFAULT '[]'::jsonb
);

-- Feature Flags / Config
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    scope TEXT
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    audience TEXT,
    status TEXT DEFAULT 'draft',
    author_id TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- SEED MOCK EXPORTERS
INSERT INTO public.organizations (id, name, plan, plan_label, origin, sector, installation_id, seats_used, seats_total, mrr, health, renewal_risk) VALUES
('org-1', 'Siam Steel Export Co.', 'standard', 'Standard', 'TH', 'Steel & iron', 'TH-RYG-0418', 4, 8, 499.00, 94, 5),
('org-2', 'Bangkok Aluminium Co.', 'starter', 'Starter', 'TH', 'Aluminium', 'TH-BKK-0211', 2, 3, 149.00, 88, 12),
('org-3', 'Eastern Industrial Foundry', 'enterprise', 'Enterprise', 'TH', 'Steel & iron', 'TH-CHG-9902', 15, 30, 2450.00, 98, 0)
ON CONFLICT (id) DO NOTHING;

-- SEED DEFAULT USER (password: demo-password)
INSERT INTO public.users (id, email, password_hash) VALUES
('00000000-0000-0000-0000-000000000000', 'wasawat@siamsteel.co.th', '934a364177b856b3e85e49bbff4d207f2df29fe470ef718c8bfaef28bd3c2fe0')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, first_name, last_name, job_title, company_name, sector, installation_id, jurisdiction, currency, unit, onboarded) VALUES
('00000000-0000-0000-0000-000000000000', 'Wasawat', 'Kiakittiwong', 'Head of Export Ops', 'Siam Steel Export Co.', 'steel', 'TH-RYG-0418', 'TH', 'THB', 'tCO2e', true)
ON CONFLICT (id) DO NOTHING;

-- SEED DIRECTORY SUPPLIERS
INSERT INTO public.directory_suppliers (id, company, contact, email, country, material, readiness) VALUES
('d1', 'Siam Yamato Steel', 'Niran T.', 'exports@siamyamato.co.th', 'TH', 'Hot-rolled coil', 'returning'),
('d2', 'Thai Metal Pro', 'Ploy S.', 'carbon@thaimetalpro.com', 'TH', 'Steel billet', 'returning'),
('d3', 'G J Steel', 'Anan W.', 'esg@gjsteel.co.th', 'TH', 'Hot-rolled coil', 'missing_installation'),
('d4', 'Rayong Steel Co', 'Suda P.', 'quality@rayongsteel.co.th', 'TH', 'Rebar', 'returning'),
('d5', 'EEC Galvanizing Ltd', 'Korn M.', 'ops@eecgalv.co.th', 'TH', 'Galvanised sheet', 'returning'),
('d6', 'Chonburi Foundry', 'Wichai R.', 'sales@chonburifoundry.co.th', 'TH', 'Pig iron', 'new')
ON CONFLICT (id) DO NOTHING;

-- SEED ADMIN STAFF
INSERT INTO public.admin_staff (id, name, email, role_id, status) VALUES
('st-1', 'Nattapong P.', 'nattapong@certrace.co', 'role-super', 'active'),
('st-2', 'Chayanin S.', 'chayanin@certrace.co', 'role-cs-lead', 'active'),
('st-3', 'Prapas K.', 'prapas@certrace.co', 'role-compliance-auditor', 'active'),
('st-4', 'Saranya T.', 'saranya@certrace.co', 'role-support-tier1', 'active')
ON CONFLICT (id) DO NOTHING;

