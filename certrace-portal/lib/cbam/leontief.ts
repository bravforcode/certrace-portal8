/* ════════════════════════════════════════════════════════════
   THE PRECURSOR SOLVE — how the EU workbook actually does it

   Reverse-engineered from "CBAM Communication template for installations"
   v2.1.1 (13 Dec 2024), hidden sheet `InputOutput`. Three formulas carry the
   whole model, and every one of them is worth stating literally because the
   obvious implementation gets a different answer:

     InputOutput!E7   a(i,j) = (precursor j consumed by process i)
                               ÷ (total production of process i)
     InputOutput!E39  (I − A), diagonal 1, off-diagonal −a(i,j)
     InputOutput!E71  MINVERSE(I − A)
     InputOutput!AK71 MMULT((I−A)⁻¹, SE_direct)   → SEE_direct
     InputOutput!AM71 MMULT((I−A)⁻¹, SE_indirect) → SEE_indirect
     InputOutput!AO71 MMULT((I−A)⁻¹, elec)        → embedded electricity
     F_Tools!V101     MMULT((I−A)⁻¹, cpPaid)      → carbon price carried in
     F_Tools!W101     MMULT((I−A)⁻¹, rebate)      → rebate carried in

   ONE OPERATOR, FIVE VECTORS. That is the design: the same inverse propagates
   emissions, electricity and money up the chain, which is why they can never
   disagree about how much of a precursor went into a tonne of output.

   ── Why a matrix and not a tree ──────────────────────────────

   Expanded, the system says:

     SEE(i) = SE(i) + Σ_j a(i,j) · SEE(j)

   — a process's embedded emissions are ITS OWN specific emissions PLUS the
   embedded emissions of everything it consumed, weighted per tonne. Two
   consequences, both of which a depth-first tree walk gets wrong:

   1. AN INTERMEDIATE TIER KEEPS ITS OWN EMISSIONS. lib/cbam/precursor-tree.ts
      resolves an internal node as `Σ children (qty × SEE(child))` and drops
      SE(i) entirely, so a billet caster that melts its own purchased pig iron
      contributes the pig iron's emissions and none of its own furnace's. That
      understates the finished good by the whole of every middle tier.

   2. THE GRAPH MAY HAVE CYCLES, AND THAT IS NOT AN ERROR. A mill that returns
      its own crop ends and off-cuts to the furnace genuinely has a → b → a.
      The tree walk throws PrecursorTreeError("CYCLE"). The matrix converges on
      it, because the Neumann series I + A + A² + … terminates whenever the
      chain loses mass at each pass, which any real process does.

   ── Solving it ────────────────────────────────────────────────

   The workbook forms the explicit inverse (MINVERSE) and multiplies. We solve
   (I − A)·x = b directly by LU with partial pivoting, once, reusing the
   factorisation across all five vectors. Same answer, better conditioned, and
   it lets a singular system be REPORTED rather than silently returning the
   1e17-scale garbage Excel produces from a near-singular MINVERSE.

   A singular (I − A) means the bill of materials claims a closed loop that
   creates its own mass — 1 t of billet from 1 t of billet. That is a data
   error, and it has to surface as one.
   ════════════════════════════════════════════════════════════ */

/** One node in the solve — a production process or a purchased precursor.
    The workbook has exactly 10 of the former and 20 of the latter; we do not
    impose that limit, because it is a spreadsheet layout constraint rather
    than anything in the regulation. */
export type SolveNode = {
  id: string;
  name: string;
  /** "process" = made here (D_Processes) · "precursor" = bought in (E_PurchPrec) */
  kind: "process" | "precursor";
  /** total output of this node in the period, in its own unit (t, or MWh for
      electricity). The denominator of every coefficient in its row. */
  totalProduction: number;
  /** the node's OWN attributed direct emissions for the period, tCO₂e —
      excluding everything embedded in what it consumed */
  ownDirectTCO2e: number;
  /** the node's OWN attributed indirect (electricity) emissions, tCO₂e */
  ownIndirectTCO2e: number;
  /** electricity drawn by this node's own process, MWh */
  ownElectricityMWh: number;
  /** carbon price actually paid on this node's own emissions, in the reporting
      currency, for the period (F_Tools §2 column T) */
  ownCarbonPricePaid: number;
  /** rebate received against that price, same currency (column U) */
  ownCarbonPriceRebate: number;
};

/** How much of `precursorId` node `consumerId` consumed over the period, in
    the precursor's own unit. The workbook's SUMIF over `PrecToGood_<j>_<i>`. */
export type Consumption = {
  consumerId: string;
  precursorId: string;
  /** absolute quantity for the whole period — NOT per tonne. The division by
      the consumer's output happens here, exactly once, the way E7 does it. */
  quantity: number;
};

export type SolveResult = {
  /** per node id — everything below is PER UNIT OF THAT NODE'S OUTPUT */
  see: Record<
    string,
    {
      /** SE(direct) — own only, before any precursor is carried in */
      specificDirect: number;
      /** SE(indirect) — own only */
      specificIndirect: number;
      /** SEE(direct) = (I−A)⁻¹ · SE(direct) */
      embeddedDirect: number;
      /** SEE(indirect) */
      embeddedIndirect: number;
      /** SEE(total) = direct + indirect — the figure the declarant receives */
      embeddedTotal: number;
      /** MWh per unit of output, own process only */
      specificElectricity: number;
      /** MWh per unit of output including everything carried in */
      embeddedElectricity: number;
      /** carbon price carried in per unit of output, reporting currency */
      carbonPricePaid: number;
      carbonPriceRebate: number;
      /** paid − rebate, floored at zero. F_Tools!N101 does not floor it; we do,
          and say so, because a rebate exceeding the price is a negative CBAM
          deduction, which is a data error rather than a refund. */
      effectiveCarbonPrice: number;
    }
  >;
  /** the coefficient matrix, kept so the report can print the workings */
  coefficients: { consumerId: string; precursorId: string; perUnit: number }[];
  /** raised when the system cannot be solved — never thrown, so a report can
      still render the inputs and name the problem */
  error: SolveError | null;
};

export type SolveError = {
  code: "SINGULAR" | "NO_OUTPUT";
  message: string;
  /** the node the problem was traced to, where one could be identified */
  nodeId?: string;
};

const EPSILON = 1e-12;

/* ── LU with partial pivoting ────────────────────────────────
   Written out rather than pulled from a library: it is thirty lines, it has
   to run in the browser inside a report render, and a dependency that changes
   its pivoting strategy in a minor release would silently change filed
   numbers. */
type Factorisation = { lu: number[][]; perm: number[]; n: number };

function factorise(m: number[][]): Factorisation | null {
  const n = m.length;
  const lu = m.map((row) => [...row]);
  const perm = Array.from({ length: n }, (_, i) => i);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(lu[r][col]) > Math.abs(lu[pivot][col])) pivot = r;
    }
    if (Math.abs(lu[pivot][col]) < EPSILON) return null; // singular
    if (pivot !== col) {
      [lu[pivot], lu[col]] = [lu[col], lu[pivot]];
      [perm[pivot], perm[col]] = [perm[col], perm[pivot]];
    }
    for (let r = col + 1; r < n; r++) {
      const factor = lu[r][col] / lu[col][col];
      lu[r][col] = factor;
      for (let c = col + 1; c < n; c++) lu[r][c] -= factor * lu[col][c];
    }
  }
  return { lu, perm, n };
}

function solveWith({ lu, perm, n }: Factorisation, b: number[]): number[] {
  // Forward substitution through L (unit diagonal), applying the permutation.
  const y = new Array<number>(n).fill(0);
  for (let r = 0; r < n; r++) {
    let sum = b[perm[r]];
    for (let c = 0; c < r; c++) sum -= lu[r][c] * y[c];
    y[r] = sum;
  }
  // Back substitution through U.
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = y[r];
    for (let c = r + 1; c < n; c++) sum -= lu[r][c] * x[c];
    x[r] = sum / lu[r][r];
  }
  return x;
}

/* ── The solve ───────────────────────────────────────────────── */
export function solveEmbedded(
  nodes: SolveNode[],
  consumption: Consumption[],
): SolveResult {
  const n = nodes.length;
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const empty: SolveResult = { see: {}, coefficients: [], error: null };
  if (n === 0) return empty;

  /* A node with no output cannot be divided by. The workbook's IFERROR turns
     that into a silent zero, which is the worst available answer: the process
     drops out of the chain and everything downstream of it reports emissions
     it did not receive. We name it instead. */
  const noOutput = nodes.find((node) => !(node.totalProduction > 0));
  if (noOutput) {
    return {
      ...empty,
      error: {
        code: "NO_OUTPUT",
        nodeId: noOutput.id,
        message: `"${noOutput.name || noOutput.id}" reports no output for the period, so nothing can be expressed per tonne of it. Enter its total production — if it genuinely produced nothing, remove it from the period instead of leaving it at zero.`,
      },
    };
  }

  /* A — consumption coefficients. a(i,j) is how much of j one unit of i
     needed. Built exactly as InputOutput!E7: absolute quantity over the
     consumer's own total output, so two deliveries of the same precursor
     accumulate rather than overwrite. */
  const A: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  const coefficients: SolveResult["coefficients"] = [];
  for (const c of consumption) {
    const i = index.get(c.consumerId);
    const j = index.get(c.precursorId);
    if (i === undefined || j === undefined) continue;
    // Self-consumption on the diagonal is legitimate (returned crop ends) and
    // the solve handles it; it is only unsolvable at a(i,i) ≥ 1, which the
    // singularity check below catches.
    A[i][j] += c.quantity / nodes[i].totalProduction;
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (A[i][j] !== 0)
        coefficients.push({
          consumerId: nodes[i].id,
          precursorId: nodes[j].id,
          perUnit: A[i][j],
        });
    }
  }

  // (I − A), InputOutput!E39.
  const IminusA = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - A[i][j]),
  );

  const lu = factorise(IminusA);
  if (!lu) {
    return {
      ...empty,
      coefficients,
      error: {
        code: "SINGULAR",
        message:
          "The precursor quantities describe a loop that produces itself — a tonne of output requiring a tonne of its own material, directly or around a cycle. Embedded emissions are undefined for that. Check the quantities on the rows that feed each other.",
      },
    };
  }

  // The five right-hand sides, each per unit of the node's own output.
  const seDirect = nodes.map(
    (node) => node.ownDirectTCO2e / node.totalProduction,
  );
  const seIndirect = nodes.map(
    (node) => node.ownIndirectTCO2e / node.totalProduction,
  );
  const seElectricity = nodes.map(
    (node) => node.ownElectricityMWh / node.totalProduction,
  );
  const cpPaid = nodes.map(
    (node) => node.ownCarbonPricePaid / node.totalProduction,
  );
  const cpRebate = nodes.map(
    (node) => node.ownCarbonPriceRebate / node.totalProduction,
  );

  const seeDirect = solveWith(lu, seDirect);
  const seeIndirect = solveWith(lu, seIndirect);
  const seeElectricity = solveWith(lu, seElectricity);
  const seeCpPaid = solveWith(lu, cpPaid);
  const seeCpRebate = solveWith(lu, cpRebate);

  const see: SolveResult["see"] = {};
  nodes.forEach((node, i) => {
    const paid = seeCpPaid[i];
    const rebate = seeCpRebate[i];
    see[node.id] = {
      specificDirect: seDirect[i],
      specificIndirect: seIndirect[i],
      embeddedDirect: seeDirect[i],
      embeddedIndirect: seeIndirect[i],
      embeddedTotal: seeDirect[i] + seeIndirect[i],
      specificElectricity: seElectricity[i],
      embeddedElectricity: seeElectricity[i],
      carbonPricePaid: paid,
      carbonPriceRebate: rebate,
      effectiveCarbonPrice: Math.max(0, paid - rebate),
    };
  });

  return { see, coefficients, error: null };
}
