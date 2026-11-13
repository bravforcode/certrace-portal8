// Integration checks use only a uniquely named disposable Compose project.
import { strict as assert } from "node:assert";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const temp = await mkdtemp(`${tmpdir()}/certrace-migrations-`);
const project = `certrace-migration-test-${Date.now()}`;
const prebuiltImage = process.env.CERTRACE_MIGRATION_TEST_IMAGE;
const image = prebuiltImage ?? `${project}:latest`;
const override = `${temp}/compose.yaml`;
const prisma = `${temp}/prisma`;
const composeFile = Bun.argv[2] ?? "compose.yaml";
const dc = [
  "docker",
  "compose",
  "-p",
  project,
  "-f",
  resolve(root, composeFile),
  "-f",
  override,
];
async function run(args: string[], ok = true, input?: string) {
  const p = Bun.spawn(args, {
    cwd: root,
    env: {
      ...process.env,
      POSTGRES_PASSWORD: "migration-test",
      CERTRACE_JWT_SECRET: "migration-test-only",
      APP_BASE_URL: "http://localhost:3000",
      COMPOSE_PROFILES: "",
    },
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  if ((code === 0) !== ok)
    throw new Error(
      `${args.slice(0, 3).join(" ")} exited ${code}\n${out}\n${err}`,
    );
  return out + err;
}
async function sql(query: string, database = "upgrade") {
  return (
    await run([
      ...dc,
      "exec",
      "-T",
      "database",
      "psql",
      "-U",
      "certrace",
      "-d",
      database,
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      query,
    ])
  ).trim();
}
async function migrate(ok = true, extra: string[] = []) {
  return run(
    [
      "docker",
      "run",
      "--rm",
      "--network",
      `${project}_default`,
      "-e",
      "DATABASE_URL=postgresql://certrace:migration-test@database:5432/upgrade",
      "-v",
      `${prisma}:/app/prisma:ro`,
      ...extra,
      image,
    ],
    ok,
  );
}
const snapshotSQL = `SELECT jsonb_build_object(
  'users', (SELECT jsonb_agg(to_jsonb(t) - 'deployment_probe' - 'ready' - 'is_admin' - 'approved_at' - 'locale' - 'preverify_credits') FROM public.users t),
  'records', (SELECT jsonb_agg(to_jsonb(t)) FROM public.account_records t WHERE key NOT IN ('certrace:profile','certrace:report-inputs:v1')),
  'files', (SELECT jsonb_agg(to_jsonb(t) - 'object_key') FROM public.account_files t))::text`;
try {
  await writeFile(
    override,
    `services:
  database:
    ports: !reset []
  migrate:
    image: ${image}
  backend:
    image: postgres:18-alpine
    entrypoint: ["sh", "-c", "sleep 600"]
    ports: !reset []
    healthcheck:
      test: ["CMD", "true"]
      interval: 1s
  frontend:
    image: postgres:18-alpine
    entrypoint: ["sh", "-c", "sleep 600"]
    ports: !reset []
`,
  );
  await cp(`${root}/certrace-backend/prisma`, prisma, { recursive: true });
  const migrationCount = (
    await readdir(`${prisma}/migrations`, { withFileTypes: true })
  ).filter((entry) => entry.isDirectory()).length;
  if (!prebuiltImage)
    await run([
      "docker",
      "build",
      "--target",
      "migrate",
      "-t",
      image,
      "-f",
      "certrace-backend/Dockerfile",
      ".",
    ]);
  const config = JSON.parse(await run([...dc, "config", "--format", "json"]));
  if (composeFile === "docker-compose-prod.yml") {
    for (const service of Object.values(config.services) as Record<
      string,
      unknown
    >[])
      assert.equal(
        service.build,
        undefined,
        "VPS must use published images without a build context",
      );
  }
  for (const app of ["backend", "frontend"])
    assert.equal(
      config.services[app].depends_on.migrate.condition,
      "service_completed_successfully",
    );
  assert.equal(config.services.migrate.restart, "no");
  await run([
    ...dc,
    "up",
    "-d",
    "--no-build",
    "--wait",
    "--wait-timeout",
    "120",
    "backend",
    "frontend",
  ]);
  console.log(
    "PASS: fresh database, all migrations, successful Compose startup gate",
  );

  await sql("CREATE DATABASE upgrade", "certrace");
  const old = `${temp}/old-migrations`;
  await mkdir(old);
  for (const entry of await readdir(`${prisma}/migrations`))
    if (entry === "migration_lock.toml" || entry < "202610160005")
      await cp(`${prisma}/migrations/${entry}`, `${old}/${entry}`, {
        recursive: true,
      });
  // Build a pre-report-storage database using its committed historical SQL.
  await run([
    "docker",
    "run",
    "--rm",
    "--network",
    `${project}_default`,
    "-e",
    "DATABASE_URL=postgresql://certrace:migration-test@database:5432/upgrade",
    "-v",
    `${old}:/app/prisma/migrations:ro`,
    "--entrypoint",
    "node_modules/.bin/prisma",
    image,
    "migrate",
    "deploy",
  ]);
  await sql(`INSERT INTO public.users(id,email,password_hash) VALUES('00000000-0000-4000-8000-000000000001','migration@example.test','synthetic');
    INSERT INTO public.account_records(user_id,key,value,revision) VALUES
      ('00000000-0000-4000-8000-000000000001','certrace:profile','{"firstName":"Keep me","companyName":"Preserved company"}',3),
      ('00000000-0000-4000-8000-000000000001','certrace:report-inputs:v1','{"version":1,"records":[]}',7);
    INSERT INTO public.account_files(user_id,id,filename,content_type,data,sha256) VALUES
      ('00000000-0000-4000-8000-000000000001','file','original.bin','application/octet-stream',decode('0001ff','hex'),repeat('a',64));`);
  const before = await sql(snapshotSQL);
  const profileBefore = await sql(
    "SELECT jsonb_build_object('value',value,'revision',revision,'updated_at',updated_at) FROM public.account_records WHERE key='certrace:profile'",
  );
  await migrate();
  assert.equal(await sql(snapshotSQL), before);
  assert.equal(
    await sql(
      "SELECT ready FROM public.users WHERE email='migration@example.test'",
    ),
    "f",
  );
  assert.equal(
    await sql(
      "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ready'",
    ),
    "false",
  );
  assert.equal(
    await sql(
      "SELECT is_admin FROM public.users WHERE email='migration@example.test'",
    ),
    "f",
  );
  assert.equal(
    await sql(
      "SELECT locale || ':' || coalesce(approved_at::text,'null') FROM public.users WHERE email='migration@example.test'",
    ),
    "en:null",
  );
  // Existing users start with no admin-granted pre-verification credits.
  assert.equal(
    await sql(
      "SELECT preverify_credits FROM public.users WHERE email='migration@example.test'",
    ),
    "0",
  );
  assert.equal(
    await sql(
      "SELECT count(*) FROM public.account_files WHERE object_key IS NOT NULL",
    ),
    "0",
  );
  const profileSQL =
    "SELECT jsonb_build_object('value',r.value,'revision',r.revision,'updated_at',r.updated_at) FROM reporting.records r JOIN reporting.record_heads h USING(user_id,key,revision) WHERE r.key='certrace:profile'";
  assert.equal(await sql(profileSQL), profileBefore);
  assert.equal(
    await sql(
      "SELECT count(*) FROM public.account_records WHERE key='certrace:report-inputs:v1'",
    ),
    "0",
  );
  await migrate();
  assert.equal(await sql(snapshotSQL), before);
  assert.equal(await sql(profileSQL), profileBefore);
  assert.equal(
    await sql(
      "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL",
    ),
    String(migrationCount),
  );
  console.log(
    "PASS: populated upgrade/retry preserve accounts, onboarding and file bytes; old report data resets",
  );

  const added = `${prisma}/migrations/209901010001_test_additive`;
  await mkdir(added);
  await writeFile(
    `${added}/migration.sql`,
    "BEGIN; ALTER TABLE public.users ADD COLUMN deployment_probe text; COMMIT;\n",
  );
  await migrate();
  assert.equal(await sql(snapshotSQL), before);
  console.log(
    "PASS: additive migration deploys without losing existing values",
  );

  const failing = `${prisma}/migrations/209901010002_test_failure`;
  await mkdir(failing);
  await writeFile(
    `${failing}/migration.sql`,
    "BEGIN; DELETE FROM public.account_files; SELECT 1/0; COMMIT;\n",
  );
  await migrate(false);
  assert.equal(await sql(snapshotSQL), before);
  await migrate(false);
  console.log(
    "PASS: failed transactional migration rolls back data and blocks retries pending recovery",
  );

  await run([...dc, "stop", "frontend", "backend"]);
  await writeFile(
    override,
    (await readFile(override, "utf8")).replace(
      `image: ${image}`,
      `image: ${image}\n    environment:\n      DATABASE_URL: postgresql://certrace:migration-test@database:5432/upgrade\n    volumes:\n      - ${prisma}:/app/prisma:ro`,
    ),
  );
  await run([...dc, "up", "-d", "--no-build", "backend", "frontend"], false);
  const state = await run([...dc, "ps", "--status", "running", "--services"]);
  assert(!state.split("\n").some((s) => s === "backend" || s === "frontend"));
  console.log(
    "PASS: failed migration prevents both application containers from starting",
  );
} finally {
  // These names are generated by this test; never run down -v on the real stack.
  if (!project.startsWith("certrace-migration-test-"))
    throw new Error("Invalid test project");
  await run([...dc, "down", "-v", "--remove-orphans"]);
  if (!prebuiltImage) await run(["docker", "image", "rm", image]);
  await rm(temp, { recursive: true, force: true });
}
