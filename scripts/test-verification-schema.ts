/** All database work is confined to a new disposable container. No app DATABASE_URL is read. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
const temp = await mkdtemp(`${tmpdir()}/certrace-compact-`);
const container = `certrace-compact-test-${Date.now()}`;
const image =
  process.env.CERTRACE_MIGRATION_TEST_IMAGE ?? "certrace-migrate:latest";
const migration = "202610270001_compact_reports";
const owner = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const nullOwner = "00000000-0000-4000-8000-000000000003";
const quote = (s: string) => "'" + s.replaceAll("'", "''") + "'";
let started = false;
let db: any;
async function run(
  args: string[],
  input?: string,
  expected = true,
  env = process.env,
  cwd = root,
) {
  const p = Bun.spawn(args, {
    cwd,
    env,
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  if (expected && code !== 0)
    throw Error(`${args.slice(0, 3).join(" ")} failed\n${out}\n${err}`);
  return { out: out.trim(), err, code };
}
async function sql(query: string, expected = true) {
  return run(
    [
      "docker",
      "exec",
      "-i",
      container,
      "psql",
      "-X",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "rehearsal",
    ],
    query,
    expected,
  );
}
async function prisma(args: string[]) {
  return run([
    "docker",
    "run",
    "--rm",
    "--network",
    `container:${container}`,
    "-e",
    "DATABASE_URL=postgresql://postgres:compact-test-only@localhost:5432/rehearsal",
    "-v",
    `${temp}/prisma:/app/prisma:ro`,
    "--entrypoint",
    "node_modules/.bin/prisma",
    image,
    ...args,
  ]);
}
async function untouched() {
  // Include every account/auth/shared-master row, excluding records deliberately migrated.
  const tables = JSON.parse(
    (
      await sql(
        `SELECT json_agg(format('%I.%I',schemaname,tablename) ORDER BY schemaname,tablename) FROM pg_tables WHERE schemaname IN ('public','masterdata') AND tablename NOT IN ('_prisma_migrations','account_records','team_invitations','email_deliveries','cookie_consents','workbooks','item_links','preverifications')`,
      )
    ).out,
  );
  return Promise.all(
    tables.map(async (name: string) => [
      name,
      (
        await sql(
          // Compare every pre-existing file field; the added location starts null.
          `SELECT coalesce(jsonb_agg(j ORDER BY j::text),'[]') FROM (SELECT to_jsonb(t)${["public.account_files", "public.uploaded_files"].includes(name) ? " - 'object_key'" : name === "public.users" ? " - 'ready' - 'is_admin' - 'approved_at' - 'locale' - 'preverify_credits'" : ""} j FROM ${name} t) x`,
        )
      ).out,
    ]),
  );
}
function sample(s: any): any {
  if (s.kind === "object")
    return Object.fromEntries(
      Object.entries(s.fields).map(([k, v]) => [k, sample(v)]),
    );
  if (s.kind === "array") return [sample(s.item), sample(s.item)];
  if (s.kind === "map") return { "fixture-scope": sample(s.item) };
  if (s.nullable) return null;
  return (
    s.enum?.[0] ??
    (s.kind === "number" ? 0 : s.kind === "boolean" ? false : "ไทย preserved")
  );
}
try {
  await cp(`${root}/certrace-backend/prisma`, `${temp}/prisma`, {
    recursive: true,
  });
  const laterMigrations = (await readdir(`${temp}/prisma/migrations`)).filter(
    (name) => /^\d/.test(name) && name >= migration,
  );
  for (const name of laterMigrations)
    await rm(`${temp}/prisma/migrations/${name}`, { recursive: true });
  await run([
    "docker",
    "run",
    "--detach",
    "--rm",
    "--name",
    container,
    "-p",
    "127.0.0.1::5432",
    "--tmpfs",
    "/var/lib/postgresql",
    "-e",
    "POSTGRES_PASSWORD=compact-test-only",
    "-e",
    "POSTGRES_DB=rehearsal",
    "postgres:18-alpine",
  ]);
  started = true;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (
      (
        await run(
          ["docker", "exec", container, "pg_isready", "-U", "postgres"],
          undefined,
          false,
        )
      ).code === 0
    ) {
      ready = true;
      break;
    }
    await Bun.sleep(250);
  }
  assert(ready);
  await prisma(["migrate", "deploy"]);
  const binding = (await run(["docker", "port", container, "5432/tcp"])).out;
  assert.match(binding, /^127\.0\.0\.1:\d+$/);
  const port = binding.split(":").at(-1)!;
  const testDatabaseUrl = `postgresql://postgres:compact-test-only@127.0.0.1:${port}/rehearsal`;
  await sql(`COMMENT ON DATABASE rehearsal IS ${quote(container)}`);
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.CERTRACE_JWT_SECRET = "disposable-compact-schema-test-secret";
  process.env.CERTRACE_SHEET_WEBHOOK_URL = "";
  process.env.CERTRACE_EMAIL_DELIVERY = "off";
  process.env.CERTRACE_SUPPLIER_EMAILS = "0";
  process.env.COOKIE_SECURE = "false";
  process.env.CERTRACE_APP_BASE_URL = "http://localhost:3000";
  process.env.CERTRACE_CORS_ALLOWED_ORIGINS = "http://localhost:3000";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.RESEND_API_KEY;
  const testEnv = {
    PATH: process.env.PATH!,
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: "test",
    CERTRACE_JWT_SECRET: "disposable-compact-schema-test-secret",
    CERTRACE_APP_BASE_URL: "http://localhost:3000",
    CERTRACE_CORS_ALLOWED_ORIGINS: "http://localhost:3000",
    CERTRACE_SHEET_WEBHOOK_URL: "",
    CERTRACE_EMAIL_DELIVERY: "off",
    CERTRACE_SUPPLIER_EMAILS: "0",
    COOKIE_SECURE: "false",
  };
  let fixture = await readFile(
    `${root}/certrace-backend/test/fixtures/verification-preservation.sql`,
    "utf8",
  );
  fixture = fixture.replace(
    "synthetic-password-hash",
    await Bun.password.hash("preserved-password", {
      algorithm: "bcrypt",
      cost: 4,
    }),
  );
  await sql(fixture);
  // Old browser profiles also contained session projections. Preserve their raw
  // values, but do not let them override authentication or block questionnaire edits.
  await sql(
    `UPDATE public.account_records SET value=value||'{"id":"old-session-id","email":"stale@example.test","googleLinked":false,"planId":"old-plan","trialStartedAt":"old-date"}'::jsonb WHERE user_id='${other}' AND key='certrace:profile'`,
  );
  // Null root, empty/absent collections and an ordinary account setting must survive too.
  await sql(`INSERT INTO public.account_records(user_id,key,value) VALUES('${other}','certrace:preferences','{"language":"th"}');
    INSERT INTO public.users(id,email,password_hash) VALUES('${nullOwner}','null-profile@example.test','synthetic');
    INSERT INTO reporting.records(user_id,key,revision,is_null,sealed) VALUES('${nullOwner}','certrace:profile',1,true,true);
    INSERT INTO reporting.record_heads VALUES('${nullOwner}','certrace:profile',1);
    INSERT INTO reporting.records(user_id,key,revision) VALUES('${owner}','certrace:carbon-price',1);
    INSERT INTO reporting.record_heads VALUES('${owner}','certrace:carbon-price',1);`);
  await sql(`BEGIN;SET LOCAL certrace.user_id='${owner}';
    INSERT INTO reporting.records(id,user_id,key,revision) VALUES('30000000-0000-4000-8000-000000000003','${owner}','certrace:profile',3);
    INSERT INTO reporting.account_profile(_id,_parent_id,_slot,_operator_version_id) VALUES('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003','root','20000000-0000-4000-8000-000000000001');
    INSERT INTO reporting.profile_goalachieve(_parent_id,_slot) VALUES('40000000-0000-4000-8000-000000000003','goalAchieve');
    INSERT INTO reporting.profile_currentmanagement(_parent_id,_slot,_null) VALUES('40000000-0000-4000-8000-000000000003','currentManagement',true);
    UPDATE reporting.records SET sealed=true WHERE id='30000000-0000-4000-8000-000000000003';COMMIT;`);
  db = (await import("../certrace-backend/src/lib/db")).db;
  const identity = await db.$queryRawUnsafe(
    "SELECT current_database() AS name, shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()",
  );
  assert.deepEqual(identity, [{ name: "rehearsal", marker: container }]);
  const { readTrees } = await import(
    "../certrace-backend/test/fixtures/legacy-report-storage-v006"
  );
  const { profileSpec } = await import(
    "../certrace-backend/src/modules/master-data/profile-contract"
  );
  // The v006 compact tables predate the onboarding profile fields.
  const onboardingFields = new Set([
    "taxId",
    "website",
    "country",
    "employeeBand",
    "exportMarkets",
    "productionModel",
    "energySources",
    "boilerCount",
    "furnaceCount",
    "annualProductionBand",
  ]);
  const legacyProfileSpec = {
    ...profileSpec,
    fields: Object.fromEntries(
      Object.entries(profileSpec.fields!).filter(
        ([key]) => !onboardingFields.has(key),
      ),
    ),
  };
  const profiles = await db.$queryRawUnsafe(
    "SELECT * FROM reporting.records WHERE key='certrace:profile' ORDER BY id",
  );
  const expected = await db.$transaction(async (tx: any) => {
    const decoded = await readTrees(
      tx,
      legacyProfileSpec,
      profiles.map((r: any) => r.id),
    );
    return profiles.map((r: any) => ({
      id: r.id,
      revision: r.revision,
      updated_at: r.updated_at,
      value: r.is_null ? null : decoded.get(r.id)?.[0]?.value,
    }));
  });
  const before = await untouched();
  const oldHeads = (
    await sql(
      "SELECT jsonb_agg(to_jsonb(h) ORDER BY user_id) FROM reporting.record_heads h WHERE key='certrace:profile'",
    )
  ).out;
  const legacy = await db.account_records.findMany({
    where: { key: "certrace:profile" },
    orderBy: { user_id: "asc" },
  });
  const migrationSQL = await readFile(
    `${root}/certrace-backend/prisma/migrations/${migration}/migration.sql`,
    "utf8",
  );
  await sql(
    `INSERT INTO reporting.records(user_id,key,revision) VALUES('${other}','certrace:profile',77);`,
  );
  const rejected = await sql(migrationSQL, false);
  assert.notEqual(rejected.code, 0);
  assert.match(rejected.err, /has 0 roots/);
  assert.equal(
    (await sql("SELECT to_regclass('reporting.profile_sources') IS NULL")).out,
    "t",
  );
  assert.deepEqual(await untouched(), before);
  await sql(
    `DELETE FROM reporting.records WHERE user_id='${other}' AND key='certrace:profile' AND revision=77;`,
  );
  console.log(
    "PASS malformed onboarding aborts the entire migration before any deletion",
  );
  // psql exposes the original SQL error if Prisma's transactional error is less specific.
  await sql(migrationSQL.replace(/COMMIT;\s*$/, "ROLLBACK;"));
  for (const name of laterMigrations)
    await cp(
      `${root}/certrace-backend/prisma/migrations/${name}`,
      `${temp}/prisma/migrations/${name}`,
      { recursive: true },
    );
  await prisma(["migrate", "deploy"]);
  await prisma(["migrate", "deploy"]);
  assert.equal(
    (await sql("SELECT count(*) FROM public.users WHERE ready=true")).out,
    "0",
  );
  assert.equal(
    (await sql("SELECT count(*) FROM public.users WHERE is_admin=true")).out,
    "0",
  );
  assert.equal(
    (
      await sql(
        "SELECT (SELECT count(*) FROM public.account_files WHERE object_key IS NOT NULL) + (SELECT count(*) FROM public.uploaded_files WHERE object_key IS NOT NULL)",
      )
    ).out,
    "0",
  );
  assert.deepEqual(await untouched(), before);
  const after = await db.$queryRawUnsafe(
    "SELECT id,revision,updated_at,value FROM reporting.records WHERE key='certrace:profile' ORDER BY id",
  );
  assert.deepEqual(
    after.filter((r: any) => expected.some((e: any) => e.id === r.id)),
    expected,
  );
  assert.equal(after.length, expected.length + 1);
  assert.deepEqual(
    (
      await db.account_records.findUniqueOrThrow({
        where: { user_id_key: { user_id: other, key: "certrace:preferences" } },
      })
    ).value,
    { language: "th" },
  );
  const legacyOnly = after.find(
    (r: any) => !expected.some((e: any) => e.id === r.id),
  );
  assert.deepEqual(
    legacyOnly.value,
    legacy.find((r: any) => r.user_id === other).value,
  );
  assert.equal(
    (
      await sql(
        `SELECT jsonb_agg(to_jsonb(h) ORDER BY user_id) FROM reporting.record_heads h WHERE key='certrace:profile' AND user_id<>'${other}'`,
      )
    ).out,
    oldHeads,
  );
  for (const row of legacy) {
    const source = await db.profile_sources.findUniqueOrThrow({
      where: {
        user_id_source_revision: {
          user_id: row.user_id,
          source: "legacy",
          revision: row.revision,
        },
      },
    });
    assert.deepEqual(source.value, row.value);
    assert.deepEqual(source.updated_at, row.updated_at);
  }
  assert.equal(
    (
      await sql(
        "SELECT count(*) FROM reporting.records WHERE key<>'certrace:profile'",
      )
    ).out,
    "0",
  );
  assert.equal(
    (
      await sql(
        "SELECT count(*) FROM pg_tables WHERE schemaname IN ('public','masterdata','reporting') AND tablename<>'_prisma_migrations'",
      )
    ).out,
    "43",
  );
  assert.equal(
    (await sql("SELECT count(*) FROM masterdata.team_invitations")).out,
    "0",
    "migration never emails or promotes existing contacts",
  );
  console.log(
    "PASS users, credentials, consent, account settings and every onboarding revision preserved; obsolete form tables removed",
  );
  const { listReports, saveReport } = await import(
    "../certrace-backend/src/modules/reporting/service"
  );
  const incomplete = (await listReports(other)).find(
    (r) => r.key === "certrace:profile",
  )!;
  assert.deepEqual(incomplete.value, {
    firstName: "Incomplete",
    goalAchieve: [],
    lineId: "",
  });
  await saveReport(
    other,
    "certrace:profile",
    { ...(incomplete.value as object), phone: "+66 000" },
    incomplete.revision,
  );
  const restored = (await listReports(owner)).find(
    (r) => r.key === "certrace:profile",
  )!;
  assert.equal((restored.value as any).companyName, "Pinned company");
  assert.equal((restored.value as any).onboarded, false);
  assert.equal((restored.value as any).cbamProductCount, "10+");
  assert.deepEqual((restored.value as any).goalAchieve, [
    "Custom | ไทย",
    "Custom | ไทย",
  ]);
  const saved = await saveReport(
    owner,
    "certrace:profile",
    { ...(restored.value as object), jobTitle: "After migration" },
    restored.revision,
  );
  assert.equal(
    saved.revision,
    4,
    "Saving an older selected head must not overwrite retained history",
  );
  const { app } = await import("../certrace-backend/src/app");
  const login = await app.handle(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "preserve@example.test",
        password: "preserved-password",
      }),
    }),
  );
  assert.equal(login.status, 200, await login.text());
  console.log(
    "PASS existing password login and onboarding read/edit work with the new backend storage",
  );
  const contracts = JSON.parse(
    await readFile(
      `${root}/certrace-backend/test/fixtures/verification-contracts.json`,
      "utf8",
    ),
  ).contracts;
  for (const [kind, c] of Object.entries(contracts) as [string, any][]) {
    const value = sample(c.reference.shape),
      key = `reference:${kind}`;
    await sql(
      `BEGIN;SET LOCAL ROLE certrace_reporting;SET LOCAL certrace.user_id='${owner}';INSERT INTO reporting.records(user_id,key,revision,value,sealed) VALUES('${owner}',${quote(key)},1,${quote(JSON.stringify(value))}::jsonb,true);COMMIT;`,
    );
    const actual = JSON.parse(
      (await sql(`SELECT value FROM reporting.records WHERE key=${quote(key)}`))
        .out,
    );
    assert.deepEqual(actual, value);
  }
  const forbidden = await sql(
    `BEGIN;SET LOCAL ROLE certrace_reporting;SET LOCAL certrace.user_id='${other}';INSERT INTO reporting.records(user_id,key,value,sealed) VALUES('${owner}','attack','{}',true);COMMIT;`,
    false,
  );
  assert.notEqual(forbidden.code, 0);
  assert.match(forbidden.err, /row-level security/);
  const sealed = await sql(
    `UPDATE reporting.records SET value='{}' WHERE key='reference:month'`,
    false,
  );
  assert.notEqual(sealed.code, 0);
  assert.match(sealed.err, /immutable/);
  console.log(
    `PASS all ${Object.keys(contracts).length} reference contracts round-trip through JSONB; account isolation and immutable revisions enforced`,
  );
  await prisma([
    "migrate",
    "diff",
    "--from-config-datasource",
    "--to-schema",
    "prisma/schema.prisma",
    "--exit-code",
  ]);
  console.log("PASS actual migrated database agrees with the Prisma schema");
  await db.$disconnect();
  db = undefined;
  const suite = await run(
    ["bun", "--no-env-file", "test", "test"],
    undefined,
    true,
    testEnv,
    `${root}/certrace-backend`,
  );
  console.log(suite.out);
  console.log(suite.err);
} finally {
  await db?.$disconnect();
  if (started) await run(["docker", "rm", "-f", container], undefined, false);
  await rm(temp, { recursive: true, force: true });
}
