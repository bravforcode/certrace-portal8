import { describe, expect, test } from "bun:test";
import { config } from "../src/lib/config";
import {
  REGISTRATION_SHEET_HEADERS,
  postRegistrationSheet,
  registrationQuestionsComplete,
  syncRegistrationSheet,
  type SheetFetch,
  type SheetUser,
} from "../src/lib/registration-sheet";
import type { ProfileValues } from "../src/modules/master-data/profile-contract";

const user: SheetUser = {
  id: "account-1",
  created_at: new Date("2026-10-22T08:00:00Z"),
  email: "owner@example.invalid",
  first_name: "Jane",
  last_name: "Doe",
  company_name: null,
};
const answers: ProfileValues = {
  firstName: "Jane",
  lastName: "Doe",
  companyName: "Steel Co",
  sector: "steel",
  jobTitle: "Director",
  goalAchieve: ["Simplify CBAM reporting", "Prepare for verification"],
  currentManagement: ["Excel or spreadsheets"],
  biggestChallenge: ["Collecting emissions data"],
  cbamProductCount: "1–5",
  supplierCount: "1–10",
  installationCount: "1",
  customerCount: "1–10",
  hearAbout: "Google Search",
  phone: "+66 38 123 456",
  lineId: "@steel",
};

describe("registration Sheet export", () => {
  test("sends a pending registration and then completed answers to the same Sheet tab", async () => {
    expect(registrationQuestionsComplete(answers)).toBe(true);
    expect(registrationQuestionsComplete({ ...answers, phone: "" })).toBe(
      false,
    );
    const statuses: string[] = [];
    const fetcher: SheetFetch = async (input, init) => {
      expect(input).toBe("https://example.invalid/exec");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      const body = init!.body as FormData;
      expect(body.get("sheet")).toBe("Registrations");
      expect([...body.keys()]).toEqual([
        "sheet",
        ...REGISTRATION_SHEET_HEADERS,
      ]);
      expect(body.get("user_id")).toBe("account-1");
      expect(body.get("registered_at")).toBe("2026-10-22T08:00:00.000Z");
      statuses.push(body.get("question_status") as string);
      if (statuses.length === 1) {
        expect(body.get("company_name")).toBe("");
        expect(body.get("goals")).toBe("");
      } else {
        expect(body.get("company_name")).toBe("Steel Co");
        expect(body.get("goals")).toBe(
          "Simplify CBAM reporting | Prepare for verification",
        );
        expect(body.get("line_id")).toBe("@steel");
      }
      return Response.json({
        ok: true,
        action: statuses.length === 1 ? "appended" : "merged",
        sheet: "Registrations",
      });
    };
    await postRegistrationSheet(
      "https://example.invalid/exec",
      user,
      null,
      fetcher,
    );
    await postRegistrationSheet(
      "https://example.invalid/exec",
      user,
      answers,
      fetcher,
    );
    expect(statuses).toEqual(["Pending", "Completed"]);
  });

  test("detects an Apps Script rejection even when HTTP status is 200", async () => {
    await expect(
      postRegistrationSheet(
        "https://example.invalid/exec",
        user,
        answers,
        async () => Response.json({ ok: false, error: "unknown sheet" }),
      ),
    ).rejects.toThrow("unknown sheet");
  });

  test("a quick completion cannot be overwritten by a slower pending write", async () => {
    const oldUrl = config.registrationSheetWebhookUrl;
    const oldFetch = globalThis.fetch;
    config.registrationSheetWebhookUrl = "https://example.invalid/exec";
    const statuses: string[] = [];
    let releaseFirst: (() => void) | undefined;
    globalThis.fetch = (async (_input, init) => {
      statuses.push((init?.body as FormData).get("question_status") as string);
      if (statuses.length === 1)
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      return Response.json({ ok: true, sheet: "Registrations" });
    }) as typeof fetch;
    try {
      const pending = syncRegistrationSheet(user);
      const completed = syncRegistrationSheet(user, answers);
      await Bun.sleep(0);
      expect(statuses).toEqual(["Pending"]);
      releaseFirst?.();
      await Promise.all([pending, completed]);
      expect(statuses).toEqual(["Pending", "Completed"]);
    } finally {
      globalThis.fetch = oldFetch;
      config.registrationSheetWebhookUrl = oldUrl;
    }
  });
});
