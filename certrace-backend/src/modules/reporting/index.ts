import { visibleReports } from "../team/records";
import { Elysia } from "elysia";
import { companySession } from "../team/workspace";
import { ReportingModel, reportBatch } from "./model";
import { listReports, saveReport, saveReportBatch } from "./service";
export const reporting = new Elysia({ prefix: "/api/v1/reporting" })
  .use(companySession)
  .get("/records", async ({ company, account }) => ({
    records: visibleReports(
      await listReports(company.id),
      company.id === account.id,
    ),
  }))
  .post(
    "/records/batch",
    ({ company, account, body }) =>
      saveReportBatch(company.id, body.records, undefined, account.id),
    { body: reportBatch },
  )
  .put(
    "/records",
    ({ company, account, body }) =>
      saveReport(company.id, body.key, body.value, body.revision, account.id),
    { body: ReportingModel.write },
  );
