import { masterData } from "./modules/master-data";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { db } from "./lib/db";
import { config } from "./lib/config";
import { ApiError } from "./lib/errors";
import { cookieToken } from "./modules/auth/service";
import { auth } from "./modules/auth";
import { team } from "./modules/team";
import { admin } from "./modules/admin";
import { declarations } from "./modules/declarations";
import { links, publicLinks, itemLinks, publicItemLinks } from "./modules/links";
import { files, publicFiles } from "./modules/files";
import { reporting } from "./modules/reporting";
import { records } from "./modules/records";
import { reminders, jobs } from "./modules/reminders";
import { calculations } from "./modules/calculations";
import { evidence, publicEvidence } from "./modules/evidence";
import { reportAutofill } from "./modules/evidence/autofill";
import { cera } from "./modules/cera";
import { workbooks } from "./modules/workbooks";
import { consent } from "./modules/consent";
export const app = new Elysia({
  serve: { maxRequestBodySize: 20 * 1024 * 1024 },
})
  .use(
    cors({
      origin: config.origins,
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Certrace-Account",
        "X-Certrace-Company",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .onRequest(({ request, set }) => {
    set.headers["cache-control"] = "no-store";
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["referrer-policy"] = "no-referrer";
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (
        (origin && !config.origins.includes(origin)) ||
        (!origin && cookieToken(request))
      ) {
        set.status = 403;
        return {
          detail: {
            code: "CSRF_REJECTED",
            message: "Request origin is not allowed.",
          },
        };
      }
    }
  })
  .onError(({ error, code, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status;
      return { detail: { code: error.code, message: error.message } };
    }
    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 422;
      return {
        detail: {
          code: "VALIDATION_ERROR",
          message: "The request does not match the API schema.",
        },
      };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { detail: { code: "NOT_FOUND", message: "Not found." } };
    }
    console.error(error);
    set.status = 500;
    return {
      detail: {
        code: "INTERNAL_ERROR",
        message: "The server could not complete the request.",
      },
    };
  })
  .use(
    config.docs
      ? openapi({
          path: "/docs",
          documentation: { info: { title: "Certrace API", version: "1.0.0" } },
        })
      : new Elysia(),
  )
  .get("/", () => ({
    service: "certrace-backend",
    status: "ok",
    ready: true,
    databaseConfigured: true,
    regulatoryDataVersion: "EU-CBAM-2026.1",
    appBaseUrl: config.appUrl,
  }))
  .get("/healthz", () => ({
    service: "certrace-backend",
    status: "alive",
    ready: true,
  }))
  .get("/readyz", async () => {
    await db.$queryRaw`SELECT 1`;
    return {
      service: "certrace-backend",
      status: "ready",
      ready: true,
      databaseConfigured: true,
    };
  })
  .use(auth)
  .use(admin)
  .use(team)
  .use(declarations)
  .use(links)
  .use(publicLinks)
  .use(itemLinks)
  .use(publicItemLinks)
  .use(consent)
  .use(files)
  .use(workbooks)
  .use(publicFiles)
  .use(publicEvidence)
  .use(records)
  .use(reporting)
  .use(masterData)
  .use(reminders)
  .use(jobs)
  .use(calculations)
  .use(evidence)
  .use(reportAutofill)
  .use(cera);
export type App = typeof app;
