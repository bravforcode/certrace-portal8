import { sharedRecord, personalPrefix, visibleReports } from "../team/records";
import { directory } from "../team/service";
import { requireOwner } from "../team/workspace";
import { Elysia } from "elysia";
import { companySession } from "../team/workspace";
import { db } from "../../lib/db";
import { Prisma } from "../../generated/prisma/client";
import { RecordModel } from "./model";
import { save, validateRecord } from "./service";
import { isReportKey, listReports, importReports } from "../reporting/service";
export const records = new Elysia({ prefix: "/api/v1/account/records" })
  .use(companySession)
  .get("", async ({ account, company }) => {
    const reports = await listReports(company.id);
    const isOwner = account.id === company.id;
    const other = (
      await db.account_records.findMany({
        where: { user_id: company.id, key: { startsWith: "certrace:" } },
      })
    ).filter((r) => isOwner || sharedRecord(r.key));
    const prefix = personalPrefix(company.id);
    const personal = isOwner
      ? []
      : (
          await db.account_records.findMany({
            where: { user_id: account.id, key: { startsWith: prefix } },
          })
        ).map((r) => ({ ...r, key: r.key.slice(prefix.length) }));
    return {
      team: await directory(account, company),
      records: [
        ...[...other, ...personal].map((r) => ({
          key: r.key,
          value: r.value,
          revision: r.revision,
        })),
        ...visibleReports(reports, isOwner),
      ],
    };
  })
  .put(
    "/:key",
    async ({ account, company, params, body }) => {
      const personal =
        account.id !== company.id &&
        !isReportKey(params.key) &&
        !sharedRecord(params.key);
      const row = await save(
        personal ? account.id : company.id,
        params.key,
        body.value,
        body.revision,
        account.id,
        personal ? personalPrefix(company.id) : "",
      );
      return { key: params.key, value: row.value, revision: row.revision };
    },
    { params: RecordModel.params, body: RecordModel.write },
  )
  .post(
    "/import",
    async ({ account, company, body }) => {
      requireOwner(account.id, company.id);
      for (const r of body.records) validateRecord(r.key, r.value);
      const reportCount = await importReports(
        company.id,
        body.records.filter((r) => isReportKey(r.key)),
      );
      const result = await db.account_records.createMany({
        data: body.records
          .filter((r) => !isReportKey(r.key))
          .map((r) => ({
            user_id: company.id,
            key: r.key,
            value: r.value === null ? Prisma.JsonNull : r.value,
          })),
        skipDuplicates: true,
      });
      return { imported: result.count + reportCount };
    },
    { body: RecordModel.import },
  );
