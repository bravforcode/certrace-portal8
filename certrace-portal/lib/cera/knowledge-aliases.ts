/* Other ways people ask the same thing. Kept apart from the entries so the
   answers stay readable; merged into each entry's phrases when the knowledge
   loads (lib/cera/knowledge.ts). */

const BASE: Record<string, string[]> = {
  "monthly-data": [
    "report production",
    "enter production",
    "how do i report production",
    "production tonnes",
    "where do i enter fuel",
    "where do i enter electricity",
    "how do i enter readings",
  ],
  "electricity-emissions": [
    "solar",
    "solar power",
    "solar panels",
    "renewable electricity",
    "green electricity",
    "can i use solar power factor",
    "own electricity factor",
  ],
  "reporting-period": [
    "how many months",
    "twelve months",
    "full year of data",
    "months of data",
    "how much data do i need",
    "how long a period",
  ],
  "scope-goods": [
    "fertiliser in scope",
    "is steel in scope",
    "is aluminium in scope",
    "is cement in scope",
    "can cbam apply to my fertiliser",
    "what sectors",
  ],
  "month-review": [
    "fix a month after submitting",
    "change a submitted month",
    "edit after submit",
    "submitted by mistake",
    "mistake in submitted month",
    "correct a submitted month",
  ],
  "benchmarks-free-allocation": [
    "2034",
    "what happens in 2034",
    "full phase out",
    "free allocation ends",
    "when does free allocation end",
  ],
  exclusions: [
    "aluminium scrap",
    "aluminum scrap",
    "steel scrap",
    "scrap",
    "is scrap covered",
    "norway",
  ],
  "english-only": [
    "write in thai",
    "do i have to write in thai",
    "thai language",
    "in thai",
    "type in thai",
  ],
  "first-declaration": [
    "when is the declaration",
    "declaration due",
    "when do i declare",
  ],
  "default-values": [
    "why is my default so high",
    "why are defaults so high",
    "default is high",
  ],
  "cbam-cost": [
    "why is my cbam cost so high",
    "cost so high",
    "reduce my cbam cost",
    "reduce cost",
    "lower my cbam cost",
  ],
  "default-vs-actual": [
    "reduce cbam cost",
    "how can i lower my emissions figure",
    "how do i reduce my default value",
  ],
  verification: [
    "hire a verifier",
    "find a verifier",
    "choose a verifier",
    "verifier cost",
  ],
  "number-boxes": [
    "why is the box black",
    "what is the black box",
    "what is the white box",
    "dash box",
    "what is the dash",
  ],
  "package-disabled": [
    "download button greyed",
    "package button disabled",
    "button is grey",
    "can't export package",
    "cannot export package",
  ],
};

/* Added later, kept in their own block so an id is never written twice in one
   object — the second would silently replace the first. Merged below. */
const MORE: Record<string, string[]> = {
  team: [
    "add a colleague",
    "invite my team",
    "add someone to my account",
    "add a user to my account",
    "how do i add a colleague",
    "how do i invite my team",
  ],
  "report-package": [
    "how do i export the report",
    "export the report",
    "export the package",
    "download the package",
    "export button",
    "download the report",
  ],
  "package-disabled": [
    "why is export disabled",
    "export disabled",
    "why cant i export",
    "why can't i export",
    "export button is grey",
  ],
  "monitoring-plan": [
    "methodology step",
    "what is the methodology step",
    "mmd",
    "monitoring methodology",
    "methodology description",
  ],
  "number-boxes": [
    "annex iv",
    "what is annex iv",
    "what is the annex iv",
    "operator emissions report items",
  ],
  "month-cannot-submit": [
    "how do i know if a month is complete",
    "is my month complete",
    "what is missing in a month",
    "month checklist",
    "whats still needed",
    "what is still needed",
  ],
  "cbam-cost": [
    "how much will i pay",
    "how much does cbam cost me",
    "what will i pay",
  ],
  "first-declaration": [
    "when do i need to pay",
    "when is payment due",
    "when do certificates have to be surrendered",
    "when is the surrender",
  ],
  penalties: [
    "what happens if i dont report",
    "what happens if i don't report",
    "what if i dont report",
    "what if i dont give data",
    "what if i do not report",
  ],
  "scope-goods": [
    "does it cover aluminium",
    "does cbam cover aluminium",
    "does it cover steel screws",
    "does cbam cover steel screws",
    "does it cover cement",
    "does it cover hydrogen",
    "does it cover fertilisers",
    "what about electricity exports",
    "is electricity covered",
    "does cbam cover electricity",
  ],
  "am-i-declarant": [
    "who pays cbam",
    "who pays the cbam",
    "who has to pay cbam",
  ],
  "verification-page": ["what is a workspace", "workspace", "workspaces"],
  "add-installation": [
    "can i have two installations",
    "multiple installations",
    "more than one installation",
    "how many installations",
    "several plants",
    "two plants",
  ],
  "process-emissions": [
    "what is a standard method",
    "standard method",
    "mass balance method",
  ],
  "measurement-based": [
    "what is measured emissions",
    "measured emissions",
    "measured instead of calculated",
  ],
  "default-values": [
    "how are defaults calculated",
    "how are default values calculated",
    "where do default values come from",
    "who sets the default values",
  ],
  "alternative-data": [
    "can i negotiate my default",
    "can defaults be changed",
    "challenge the default value",
    "negotiate default values",
    "adjusted default",
  ],
  "default-vs-actual": [
    "what is an actual value",
    "what is actual value",
    "actual vs default",
    "actual or default",
  ],
  "certificate-sales": [
    "ets price",
    "what is the ets price",
    "emissions trading price",
    "eu ets price",
    "price of carbon in the eu",
  ],
  "carbon-price": [
    "how is carbon price deducted",
    "deduct carbon price",
    "carbon price deduction",
    "carbon price paid in thailand",
  ],
  readiness: [
    "what does ready mean",
    "what does readiness mean",
    "what is ready",
    "what is readiness",
  ],
};

export const ALIASES: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = { ...BASE };
  for (const [id, keys] of Object.entries(MORE))
    out[id] = [...(out[id] ?? []), ...keys];
  return out;
})();
