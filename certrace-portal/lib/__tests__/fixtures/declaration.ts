import type { Declaration } from "../../data";

export const DECLARATIONS: Declaration[] = [
  {
    id: "fixture-declaration",
    name: "CBAM reporting period",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Q2 2026 (Apr–Jun)",
    due: "31 Jul 2026",
    dueInDays: 17,
    step: "collect",
    suppliers: [
      {
        id: "supplier-1",
        name: "Fixture supplier",
        ref: "#0001",
        country: "TH",
        material: "Hot-rolled coil",
        progress: 100,
        status: "submitted",
        emissions: 1.84,
        updated: "2026-06-01",
        critical: true,
      },
    ],
    totalEmbedded: null,
    carbonPricePaid: 0,
  },
];
