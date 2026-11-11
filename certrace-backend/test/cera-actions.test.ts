import { describe, expect, test } from "bun:test";
import catalogue from "../src/modules/links/cbam-item-fields.json";
import { MAX_CERA_ACTIONS, ceraTools, validateCeraActions } from "../src/modules/cera/actions";

const realKey = (catalogue.fields as { key: string }[])[0]!.key;

describe("Cera proposed actions", () => {
  test("drops unknown tools so the server never proposes an unlisted action", () => {
    expect(
      validateCeraActions([{ toolName: "delete_installation", input: { installationId: "TH-1" } }]),
    ).toEqual([]);
  });

  test("drops CBAM keys that are not in the catalogue and keeps valid ones with null", () => {
    const [action] = validateCeraActions([
      {
        toolName: "set_cbam_fields",
        input: {
          installationId: "TH-1",
          year: 2026,
          values: { [realKey]: "42", "not-a-field": "x", "a-i9": null },
        },
      },
    ]);
    expect(action).toEqual({
      tool: "set_cbam_fields",
      installationId: "TH-1",
      year: 2026,
      values: { [realKey]: "42", "a-i9": null },
    });
  });

  test("reads the tool's [{key, value}] fields list, the shape free models fill reliably", () => {
    const [action] = validateCeraActions([
      {
        toolName: "set_cbam_fields",
        input: {
          installationId: "TH-1",
          year: 2026,
          fields: [
            { key: "a-i22", value: "Manufacture of basic iron and steel" },
            { key: "not-a-field", value: "x" },
          ],
        },
      },
    ]);
    expect(action).toEqual({
      tool: "set_cbam_fields",
      installationId: "TH-1",
      year: 2026,
      values: { "a-i22": "Manufacture of basic iron and steel" },
    });
  });

  test("drops a CBAM proposal whose keys are all outside the catalogue", () => {
    expect(
      validateCeraActions([
        {
          toolName: "set_cbam_fields",
          input: { installationId: "TH-1", year: 2026, values: { bogus: "1" } },
        },
      ]),
    ).toEqual([]);
  });

  test("drops update_installation with only non-allowlisted keys", () => {
    expect(
      validateCeraActions([
        {
          toolName: "update_installation",
          input: { installationId: "TH-1", changes: { registryId: "X", passwordHash: "y" } },
        },
      ]),
    ).toEqual([]);
  });

  test("keeps the allowlisted installation keys and drops the rest", () => {
    const [action] = validateCeraActions([
      {
        toolName: "update_installation",
        input: { installationId: "TH-1", changes: { city: "Bangkok", registryId: "X" } },
      },
    ]);
    expect(action).toEqual({
      tool: "update_installation",
      installationId: "TH-1",
      changes: { city: "Bangkok" },
    });
  });

  test("rejects an installation id outside the allowed shape", () => {
    expect(
      validateCeraActions([
        { toolName: "update_installation", input: { installationId: "../x", changes: { city: "A" } } },
      ]),
    ).toEqual([]);
  });

  test("rejects an out-of-range year", () => {
    expect(
      validateCeraActions([
        { toolName: "set_cbam_fields", input: { installationId: "TH-1", year: 2041, values: { [realKey]: "1" } } },
      ]),
    ).toEqual([]);
  });

  test("open_page drops external and protocol-relative URLs", () => {
    expect(
      validateCeraActions([
        { toolName: "open_page", input: { path: "https://evil.com" } },
        { toolName: "open_page", input: { path: "//evil.com" } },
      ]),
    ).toEqual([]);
  });

  test("open_page keeps an allowed page with a query string", () => {
    expect(
      validateCeraActions([
        { toolName: "open_page", input: { path: "/convert/eu-cbam?installation=TH-1" } },
      ]),
    ).toEqual([{ tool: "open_page", path: "/convert/eu-cbam?installation=TH-1" }]);
  });

  test("open_page drops a page outside the list even with a query string", () => {
    expect(
      validateCeraActions([{ toolName: "open_page", input: { path: "/admin?x=1" } }]),
    ).toEqual([]);
  });

  test("request_upload is kept with a trimmed purpose", () => {
    expect(
      validateCeraActions([
        { tool: "request_upload", args: { purpose: "  Monitoring methodology  " } },
      ]),
    ).toEqual([{ tool: "request_upload", purpose: "Monitoring methodology" }]);
  });

  test("caps the result at five actions after dropping invalid items", () => {
    const bad = { toolName: "open_page", input: { path: "//evil.com" } };
    const good = { toolName: "open_page", input: { path: "/dashboard" } };
    const raw = [bad, bad, good, good, good, good, good, good, good];
    const out = validateCeraActions(raw);
    expect(out.length).toBe(MAX_CERA_ACTIONS);
    expect(out.every((a) => a.tool === "open_page")).toBe(true);
  });

  test("non-array input yields no actions", () => {
    expect(validateCeraActions({ toolName: "open_page" })).toEqual([]);
    expect(validateCeraActions(undefined)).toEqual([]);
  });

  test("the field list stays small for free-tier token limits yet a later process key is still accepted", () => {
    // 457 catalogue keys would blow the Groq free-tier TPM budget on every turn, so the
    // schema names only process/precursor 1 and states the row stride for the rest.
    const text = JSON.stringify(ceraTools.set_cbam_fields.inputSchema);
    expect(text).toContain("d-l16");
    expect(text).not.toContain("d-l146"); // process 3
    expect(text).not.toContain("e-l61"); // precursor 2
    expect(text.length).toBeLessThan(12000);
    const [action] = validateCeraActions([
      { toolName: "set_cbam_fields", input: { installationId: "TH-1", year: 2026, values: { "d-l81": "5" } } },
    ]);
    expect(action).toEqual({ tool: "set_cbam_fields", installationId: "TH-1", year: 2026, values: { "d-l81": "5" } });
  });

  test("same-named fields in different blocks carry their section, so the model can tell process P1 from precursor PP1", () => {
    // Live run: "set the name of process P1" picked a-l102 (precursor PP1) because both read only "Name".
    const text = JSON.stringify(ceraTools.set_cbam_fields.inputSchema);
    expect(text).toContain("a-l83 = Production process 1: Name");
    expect(text).toContain("a-l102 = Purchased precursor 1: Name");
  });

  test("tool definitions carry no execute function", () => {
    for (const def of Object.values(ceraTools)) {
      expect("execute" in def).toBe(false);
    }
  });
});
