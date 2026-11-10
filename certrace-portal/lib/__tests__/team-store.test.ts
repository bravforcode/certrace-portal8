import { test } from "node:test";
import assert from "node:assert/strict";
import { configureApi } from "../api/config";
import { saveSession, clearSession } from "../api/session";
import {
  accountStorage,
  hydrateAccount,
  flushAccount,
  resetAccount,
} from "../account-storage";
import { addTeamMember, loadTeam, removeTeamMember } from "../team-store";
import { seatCap } from "../plan";

Object.assign(globalThis, {
  window: {
    location: { origin: "http://localhost:3000", pathname: "/team" },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  },
});

test("reviewer contacts preserve assignments and onboarding without taking a company seat", async () => {
  resetAccount(true);
  clearSession();
  const user = {
    id: "owner",
    email: "owner@example.invalid",
    onboarded: true,
    ready: true,
    firstName: "Account",
    lastName: "Owner",
  };
  const profile = {
    firstName: "Saved",
    lastName: "Owner",
    goalAchieve: ["Keep", "Keep"],
    lineId: "@keep",
  };
  let saved: { key: string; value: unknown; revision: number } | undefined;
  const persisted = () => saved;
  let unavailable = false;
  configureApi({
    baseUrl: "http://localhost:8000",
    fetchImpl: (async (input, init) => {
      const path = new URL(String(input)).pathname;
      assert.match(path, /\/api\/v1\/account\/records/);
      if (!init?.method || init.method === "GET")
        return Response.json({
          team: {
            id: user.id,
            name: "Test company",
            isOwner: true,
            planId: "starter",
            trialStartedAt: new Date(0).toISOString(),
            members: [
              {
                id: user.id,
                name: "Account Owner",
                email: user.email,
                role: "Owner",
              },
            ],
            invitations: [],
            companies: [{ id: user.id, name: "Test company" }],
          },
          records: [
            { key: "certrace:profile", value: profile, revision: 1 },
            ...(saved ? [saved] : []),
          ],
        });
      if (unavailable)
        return Response.json(
          { detail: { code: "UNAVAILABLE", message: "Offline" } },
          { status: 503 },
        );
      const body = JSON.parse(String(init.body));
      saved = {
        key: decodeURIComponent(path.split("/").at(-1)!),
        value: body.value,
        revision: body.revision + 1,
      };
      return Response.json(saved);
    }) as typeof fetch,
  });
  saveSession({ accessToken: "cookie", user });
  await hydrateAccount(user.id);
  assert.deepEqual(
    loadTeam().map((m) => m.name),
    ["Saved Owner"],
  );
  assert.equal(
    seatCap().used,
    1,
    "the account owner occupies the same seat in every plan counter",
  );
  const contact = addTeamMember({
    name: "Reviewer",
    email: "reviewer@example.invalid",
  });
  assert.equal(
    contact.role,
    "Member",
    "new contacts display the Member position",
  );
  assert.equal(contact.dept, "Operations");
  unavailable = true;
  await assert.rejects(flushAccount(), /Offline/);
  assert.equal(
    persisted(),
    undefined,
    "a failed save cannot be treated as a persisted invitation",
  );
  assert.equal(
    addTeamMember({
      name: "Again",
      email: "REVIEWER@example.invalid",
    }).id,
    contact.id,
  );
  unavailable = false;
  await flushAccount();
  assert.equal(persisted()?.key, "certrace:team-members");
  assert.equal(
    (persisted()?.value as unknown[]).length,
    1,
    "the live owner is not copied into the stored contacts",
  );
  resetAccount();
  await hydrateAccount(user.id);
  assert.equal(loadTeam().find((m) => m.id === contact.id)?.role, "Member");
  assert.equal(
    seatCap().used,
    1,
    "a reviewer contact alone does not reserve a login seat",
  );
  removeTeamMember(contact.id);
  await flushAccount();
  assert.deepEqual(persisted()?.value, []);
  assert.deepEqual(
    JSON.parse(accountStorage.getItem("certrace:profile")!),
    profile,
  );
  assert.equal(loadTeam()[0]?.id, user.id);
  assert.equal(
    seatCap().used,
    1,
    "removing a reviewer preserves the owner seat",
  );
  accountStorage.setItem(
    "certrace:team-members",
    JSON.stringify([
      {
        id: "legacy-legal",
        name: "Existing reviewer",
        email: "legal@example.invalid",
        role: "Legal / compliance",
        dept: "Legal",
        kind: "internal",
      },
    ]),
  );
  assert.equal(
    loadTeam().find((m) => m.id === "legacy-legal")?.dept,
    "Legal",
    "removing the role choice must not discard saved reviewer contacts",
  );
});
