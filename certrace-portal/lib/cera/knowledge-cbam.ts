/* ════════════════════════════════════════════════════════════
   WHAT CERA KNOWS ABOUT CBAM

   Written from the EU rules Certrace is built on — the basic CBAM law and its
   2025 simplification, and the four implementing rules for verification,
   calculation, benchmarks and default values — and from the Thai industry
   briefing on the default-value gap. It is written as ANSWERS, not as extracts:
   in plain words, with no article numbers and no "according to", because a person
   asking how a carbon border works wants the answer, not a footnote.

   Where the rules leave a number open (the certificate penalty, the cross-sector
   correction factor, default carbon prices before 2027) the answer says so rather
   than guess.
   ════════════════════════════════════════════════════════════ */

import { entry, type Entry } from "./knowledge-types";

const c = (id: string, title: string, keys: string[], answer: string, related?: string[]) => entry("cbam", id, title, keys, answer, related);

export const CBAM_KNOWLEDGE: Entry[] = [
  /* ── The basics ─────────────────────────────────────────────── */
  c(
    "what-is-cbam",
    "What CBAM is",
    ["what is cbam", "cbam mean", "carbon border adjustment", "explain cbam", "cbam overview", "cbam stand for", "cbam in simple terms", "tell me about cbam", "carbon border"],
    `CBAM is the EU's Carbon Border Adjustment Mechanism. It puts a carbon price on certain goods when they are imported into the EU, so imports pay roughly what EU producers pay under the EU emissions trading system.

It covers cement, fertilisers, iron and steel, aluminium, hydrogen and electricity. The importer in the EU buys CBAM certificates — one per tonne of CO₂e — for the emissions embedded in the goods, less any carbon price already paid abroad and less the free allowances EU producers still receive.

The definitive regime started on 1 January 2026. The first declaration and certificate surrender is due on 30 September 2027, for 2026 imports.

For an exporter the key question is how many emissions are attached to each tonne you ship: either your own verified figure, or the EU's default value, which is deliberately high.`,
    ["Who pays for CBAM certificates?", "What is a default value?", "What are the key CBAM dates?"],
  ),
  c(
    "why-thailand",
    "Why CBAM matters to Thai exporters",
    ["why does cbam matter", "thai exporters", "thailand cbam impact", "cbam thailand", "steel exporters thailand", "impact on thailand", "is cbam a problem for thailand", "thai industry"],
    `CBAM turns the carbon intensity of what you ship into a cost your EU buyer will want to pass back. Thai goods in scope are mainly steel and aluminium products, plus some fertiliser and cement.

If you give no verified data, the EU uses a default value for Thailand, with a mark-up on top (10% in 2026, 20% in 2027, 30% from 2028). Thailand's default for steel is built on the scrap and electric-arc-furnace route, so it is not low — and the free-allowance offset for that route is small. In one industry worked example (steel screws, CN 7318 12 90, 2026, a €90 certificate price) the net cost per tonne came out near €233 for Thailand against roughly €113–151 for China, Taiwan and Vietnam.

The practical answer is verified actual emissions: measure the plant, get it verified, and report your real figure instead of the default. That is what Certrace is built to help with.`,
    ["What is a default value?", "Should I use default or actual values?", "How much will CBAM cost me?"],
  ),
  c(
    "roles",
    "Who does what in CBAM",
    ["who is the declarant", "operator", "importer", "verifier", "roles", "who does what", "authorised declarant", "indirect customs representative", "who is who", "parties"],
    `Four parties matter:

• The importer / authorised CBAM declarant — in the EU. Must be authorised before importing covered goods, files the annual declaration and buys and surrenders the certificates. A non-EU importer acts through an indirect customs representative who is itself an authorised declarant.
• The operator — you, the producer. The person that runs or controls the installation abroad (a parent company that controls it counts). You work out the embedded emissions, keep the evidence, get actual figures verified, and pass the data to your EU buyer. You can also register yourself and the installation in the CBAM Registry.
• The verifier — an independent body accredited by a national accreditation body, which checks your reported emissions.
• The authorities — the competent authority in the importer's EU country and the Commission, who review declarations and run the Registry.`,
    ["Am I the declarant?", "Do I need a verifier?", "What is the CBAM Registry?"],
  ),
  c(
    "am-i-declarant",
    "Is a Thai exporter the declarant?",
    ["am i the declarant", "exporter declarant", "do i need to register", "do i need to buy certificates", "who buys certificates", "exporter obligation", "what must an exporter do", "exporter responsibilities", "who pays cbam"],
    `No. The declarant is the EU importer (or their indirect customs representative). They pay: they buy the certificates and surrender them. As a Thai exporter you are the operator.

What falls to you:
• work out the emissions embedded in each good you ship, per tonne;
• keep the monitoring records and evidence;
• have your actual figures verified by an accredited verifier if you want them used instead of defaults;
• give your buyer the report so they can declare correctly.

Registering yourself and your installation in the CBAM Registry is optional but lets you share verified data with your buyers directly. In practice your buyer will ask for the data, because a default value costs them more.`,
    ["What is the operator's emissions report?", "What is a default value?", "Do I need a verifier?"],
  ),

  /* ── Dates ───────────────────────────────────────────────────── */
  c(
    "timeline",
    "The CBAM timeline",
    ["timeline", "key dates", "deadlines", "when does cbam start", "definitive period", "transitional period", "important dates", "cbam dates", "when does cbam begin", "schedule"],
    `• 1 Oct 2023 – 31 Dec 2025: transitional period — reporting only, no payment.
• 1 Jan 2026: the definitive regime starts. Only authorised declarants may import covered goods. Default values carry a 10% mark-up.
• 1 Sep 2026: verifiers can start registering in the CBAM Registry.
• 1 Jan 2027: mark-up rises to 20%, and the quarterly certificate-holding rule applies.
• 1 Feb 2027: EU countries start selling CBAM certificates.
• 30 Jun each year: deadline for official alternative data (such as an alternative grid factor) for that import year.
• 30 Sep 2027: first CBAM declaration and surrender of certificates, for 2026 imports. The same date every year after.
• 31 Oct / 1 Nov each year: repurchase requests and cancellation of surplus certificates.
• By December 2027: the Commission reviews default values and mark-ups.
• 2034: the EU's free allowances are fully phased out, so CBAM applies to the full embedded emissions.`,
    ["When is the first CBAM declaration?", "What is the 50 tonne rule?", "How does the free allocation phase out?"],
  ),
  c(
    "first-declaration",
    "The first declaration and surrender",
    ["first declaration", "30 september", "declaration deadline", "when do certificates need to be surrendered", "surrender", "annual declaration", "cbam declaration"],
    `The first CBAM declaration is due on 30 September 2027, covering goods imported in 2026. Each year after, it is due on 30 September for the previous calendar year. Certificates covering the embedded emissions must be surrendered by the same date.

The declaration states the quantity of each type of good, the total embedded emissions, the number of certificates to surrender (embedded emissions less any carbon price paid abroad and less the free-allocation adjustment) and, where actual values were used, the verification reports. It is the importer's filing — but your data is what it is built from.`,
    ["When can certificates be bought?", "What happens if the declarant is late?", "What is in the operator's report?"],
  ),
  c(
    "certificate-sales",
    "Certificates: sale and price",
    ["certificate price", "when can certificates be bought", "buy certificates", "certificate sale", "cbam certificate", "price of certificate", "what is a certificate", "certificate cost"],
    `One CBAM certificate equals one tonne of CO₂e. EU countries start selling them on 1 February 2027 on a common central platform.

The price follows the EU emissions trading system's auction prices. For goods imported in 2026 it is the average of the quarter's auction closing prices; after that it is the weekly average, published on the first working day of the following week.

Certificates are bought by the declarant, not the exporter. Surplus certificates can be repurchased on request by 31 October each year, within a cap, and what remains is cancelled on 1 November.`,
    ["What is the quarterly holding rule?", "How much will CBAM cost me?"],
  ),
  c(
    "quarterly-holding",
    "The quarterly holding rule",
    ["quarterly holding", "50 percent", "hold certificates", "quarter end", "holding requirement", "certificates in account"],
    `From 2027 an authorised declarant must hold, at the end of every quarter, certificates covering at least half of the embedded emissions of the goods imported so far that year. That estimate uses default values without the mark-up, or last year's surrendered number if the same goods and origins are imported.

It is about cash planning for your buyer: they must have bought certificates well before the 30 September surrender. It is another reason EU buyers care about verified lower figures early in the year.`,
    ["When can certificates be bought?", "What is a default value?"],
  ),
  c(
    "fifty-tonne-rule",
    "The 50-tonne threshold",
    ["50 tonne", "50 tonnes", "threshold", "de minimis", "exemption", "small importer", "150 euro", "below threshold", "fifty tonne", "minimum quantity"],
    `An importer is exempt if the total net mass of covered goods they import in a calendar year is 50 tonnes or less, counted across all CN codes together (iron and steel, aluminium, fertilisers and cement — electricity and hydrogen are not counted). It replaced the old €150-per-consignment exemption.

If the importer goes above 50 tonnes, the obligation applies to all their covered imports of that year, not just the part above the line. Splitting imports to stay under the threshold is treated as a serious infringement.

The threshold is set so that about 99% of emissions stay in scope, and the Commission rechecks it every year. For you as an exporter it matters mainly because small EU buyers may be exempt while larger ones will want your emissions data.`,
    ["Which goods are covered?", "Am I the declarant?"],
  ),

  /* ── Scope ───────────────────────────────────────────────────── */
  c(
    "scope-goods",
    "Which goods CBAM covers",
    ["scope", "which goods", "what goods", "products covered", "sectors covered", "covered goods", "what products", "which products", "goods in scope", "which sectors"],
    `Six sectors, each defined by CN codes:

• Cement — clinker, Portland and other hydraulic cements, and calcined kaolinic clay (non-calcined is out).
• Electricity.
• Fertilisers — nitric acid, ammonia, potassium nitrate, nitrogenous and mixed fertilisers.
• Iron and steel — most of chapter 72, plus agglomerated iron ore and many steel articles such as screws, bolts, wire, tubes and structures. Scrap and some ferro-alloys are not covered.
• Aluminium — unwrought aluminium and many products (sheet, foil, bars, profiles, tubes, structures); aluminium scrap is not covered.
• Hydrogen.

The emissions counted are mostly CO₂; fertilisers also count nitrous oxide, and aluminium counts the two perfluorocarbons. Goods from Iceland, Liechtenstein, Norway and Switzerland, and a few special territories, are excluded.`,
    ["Is my CN code in scope?", "Which goods count indirect emissions?"],
  ),
  c(
    "cn-scope",
    "Checking a CN code",
    ["cn code", "is my product in scope", "hs code", "tariff code", "how many cn codes", "check cn", "which cn codes", "cn codes covered", "8 digit"],
    `Scope is decided by the 8-digit CN code on your customs declaration. Certrace's catalogue has all 570 CN8 codes that are in scope, each with its sector, the EU default value for your country and the free-allocation benchmark.

Tell me a code — for example "7318 12 90" — and I'll give you the default value and what is chargeable. If a code isn't in the catalogue it isn't covered by CBAM, but check the exact CN code on your declaration, because the same goods can sit under a covered or an uncovered code depending on the detail.`,
    ["What is the default value for CN 7318 12 90?", "Which goods are covered?"],
  ),
  c(
    "exclusions",
    "What is excluded",
    ["excluded", "exempt countries", "norway", "switzerland", "iceland", "liechtenstein", "not covered", "scrap in scope", "ferro alloys", "excluded goods", "what is not covered"],
    `Excluded from CBAM:
• goods originating in Iceland, Liechtenstein, Norway and Switzerland, and a few special territories (such as Büsingen, Heligoland, Livigno, Ceuta and Melilla) that are already inside the EU's carbon market;
• military goods;
• electricity generated on the EU's offshore areas;
• scrap — iron and steel scrap and aluminium scrap are not covered goods, and a precursor made of scrap carries zero embedded emissions;
• some ferro-alloys: only ferro-manganese, ferro-chromium and ferro-nickel are in scope.

Origin here means non-preferential origin — where the goods were last substantially transformed — not where they were shipped from.`,
    ["Which goods are covered?", "What is the 50 tonne rule?"],
  ),
  c(
    "direct-indirect",
    "Direct and indirect emissions",
    ["direct emissions", "indirect emissions", "difference direct indirect", "direct vs indirect", "direct versus indirect", "which goods count indirect", "annex ii", "indirect counted", "direct only", "do indirect emissions count"],
    `Direct emissions come from the production process itself: fuel burned, the chemistry of the materials, and heat used in the process wherever it is made. Indirect emissions come from the electricity consumed to make the good.

Which count depends on the good:
• Iron and steel (except agglomerated iron ore), aluminium, hydrogen and electricity: only direct emissions are counted. Indirect are still reported but not charged.
• Cement and fertilisers, and agglomerated iron ore: direct and indirect are both counted.
• A precursor that is not in the direct-only group has its indirect emissions counted even inside a steel or aluminium product.

That is why electricity readings are collected for every good, but only some goods price them.`,
    ["How is electricity emissions calculated?", "What is a precursor?"],
  ),

  /* ── Embedded emissions ─────────────────────────────────────── */
  c(
    "see",
    "Embedded emissions and SEE",
    ["embedded emissions", "see", "specific embedded emissions", "how is embedded emissions calculated", "emission intensity", "formula", "specific emissions", "per tonne emissions", "how do i calculate embedded emissions"],
    `Specific embedded emissions (SEE) are the tonnes of CO₂e attached to one tonne of a good — or one functional unit.

For a simple good: SEE = attributed emissions of the production process ÷ the amount produced. The attributed emissions are the direct emissions (plus indirect, where they count) of that process.

For a complex good made from precursors: SEE = its own emissions per tonne + Σ (tonnes of each precursor per tonne of good × that precursor's SEE). Only precursors that are covered goods and come from outside the EU or the exempt countries count; EU and exempt-origin precursors count as zero.

Emissions are added up over the whole reporting year first and divided once at the end — never an average of monthly figures. SEE is reported to at most five decimals; annual emissions are in whole tonnes of CO₂e.`,
    ["What is a precursor?", "How do I calculate fuel emissions?", "What is direct vs indirect?"],
  ),
  c(
    "simple-complex",
    "Simple and complex goods",
    ["simple good", "complex good", "precursor", "what is a precursor", "precursors", "simple vs complex", "what is a complex good"],
    `A simple good is made only from materials and fuels with zero embedded emissions — for example steel made from scrap in an electric arc furnace using no other covered inputs. A complex good is made from other covered goods, called precursors — billet into rebar, anodes into aluminium, hot-rolled coil into screws or tubes.

A complex good carries its precursors' emissions with it. So to report a screw's embedded emissions you need the emissions of the wire rod (and further upstream the billet) that went into it, either the actual figure from whoever made it or the EU default. This repeats up the chain for as long as there are covered precursors.`,
    ["How do I handle precursors?", "What if I don't know the precursor's origin?"],
  ),
  c(
    "precursors-how",
    "Handling precursors",
    ["precursor emissions", "do i need precursor data", "supplier data", "billet", "how to treat precursors", "inputs", "bought in material", "purchased material", "supplier emissions", "wire rod", "precursor default or actual"],
    `For each covered precursor you buy in, you choose between:

• The default value — the EU's figure for that CN code and the producing country. No data needed, but it carries the mark-up and is usually higher than reality.
• An actual value — the precursor producer's own verified emissions, given with a verification report that covers the period. You can use actual for some precursors and default for others.

If the producer's country can't be identified, the default is the highest country default for that CN code. If the precursor comes from the EU or an exempt country, it counts as zero. If you buy the same CN code from several installations, you use a weighted average (or the specific installation if you can evidence it).

In Certrace, the Precursors tab of each product report walks you through this and asks the producer for the data through a link.`,
    ["What if I don't know the origin?", "What is a default value?", "How do I add a precursor in Certrace?"],
  ),
  c(
    "functional-unit",
    "Functional units",
    ["functional unit", "unit of measure", "kg nitrogen", "tonnes of clinker", "what unit", "per tonne of what", "kwh unit"],
    `Embedded emissions are stated per functional unit. The default is one tonne of the good per CN code. The exceptions: electricity is per kWh; some fertilisers (nitric acid, ammonia and mixed fertilisers) are per kilogram of nitrogen contained; cement is per tonne of clinker it contains. Where a good's content varies, there are set composition ranges so that SEE can be scaled by the content.`,
    ["What are embedded emissions?"],
  ),
  c(
    "boundaries",
    "System boundaries and production routes",
    ["boundary", "system boundary", "what is included", "cradle to gate", "production process", "production route", "what is a production process", "process boundary", "which routes"],
    `CBAM counts emissions from the start of the good's production to the factory gate — cradle to gate — including the production of its precursors. Each aggregated goods category has a defined boundary. For example:
• crude steel includes the furnace and casting, and primary hot rolling into semi-finished products;
• iron and steel products include reheating, remelting, casting, rolling, forging, annealing, coating, galvanising, wire drawing and pickling, but not plating, cutting, welding or finishing;
• primary aluminium includes electrodes, fuels, flue-gas treatment and the perfluorocarbons from anode effects.

A production process is a set of activities making one kind of good. Goods that share a functional unit but are made by different routes in one installation are treated as one process and averaged. Don't split an installation just to move emissions around — it needs a genuine commercial reason.`,
    ["How are emissions shared between goods?", "What is a precursor?"],
  ),
  c(
    "attribution",
    "Sharing emissions between goods",
    ["attribution", "multiple products", "co-products", "allocation of emissions", "several goods one process", "split emissions", "shared furnace", "attributed emissions"],
    `When one process makes several goods, emissions have to be shared between them. The rules apply in this order:

1. Heat flows — emissions go with measurable heat that is imported or exported.
2. Waste gases — the same, using a fixed credit for exported gases.
3. Everything else — by the goods' functional units (tonnes), or by molar ratio for chemicals and fertilisers.

Where each production process has its own meters, use them. If instruments of different quality add up to something different from the whole installation, a single correction factor is applied to scale them to the installation total.`,
    ["How is heat treated?", "What is embedded emissions?"],
  ),

  /* ── Calculating ─────────────────────────────────────────────── */
  c(
    "fuel-emissions",
    "Fuel emissions",
    ["fuel emissions", "combustion", "emission factor", "net calorific value", "ncv", "how do i calculate fuel emissions", "calculate combustion", "fuel co2", "fuel calculation"],
    `For each fuel: emissions = quantity burned × net calorific value × emission factor × oxidation factor.

• Quantity — what the meter or invoice says for the period.
• Net calorific value (NCV) — energy per unit of fuel, from a spec sheet, lab analysis or the EU's standard table.
• Emission factor — tonnes of CO₂ per gigajoule (not per m³ or litre; a volume factor is about 25 times out).
• Oxidation factor — usually 1, which the rules always allow.

For biomass, the factor is zero only if the sustainability criteria are met and evidenced. Standard values exist for every common fuel and are used only where you have no better figure — a lab result or supplier certificate ranks above the EU standard value.`,
    ["What is an oxidation factor?", "How do process emissions work?", "Can I use biomass as zero?"],
  ),
  c(
    "process-emissions",
    "Process emissions",
    ["process emissions", "carbonate", "limestone", "electrodes", "mass balance", "flux", "how do process emissions work", "chemical emissions", "decomposition"],
    `Process emissions are CO₂ released by chemistry rather than by burning fuel: carbonates breaking down (limestone, dolomite, soda ash), electrode consumption in an electric arc furnace, carbon in reducing agents, flue-gas cleaning.

There are two methods:
• Standard method — quantity of the material × its factor (for example 0.44 tCO₂ per tonne of limestone) × a conversion factor that is 1 unless only part of the material converts.
• Mass balance — carbon in minus carbon out, times 3.664. Outputs count negative.

The EU publishes factors for nine carbonates, three oxides and nine steel-related materials, such as DRI, electrodes, charge carbon, petroleum coke, pig iron and scrap. If a month has no process emissions, leave the section empty — that is a correct answer.`,
    ["How do I calculate fuel emissions?", "What is a mass balance?"],
  ),
  c(
    "oxidation-factor",
    "The oxidation factor",
    ["oxidation factor", "oxidation", "unburned carbon", "carbon in ash"],
    `The oxidation factor says how much of the fuel's carbon actually burns. The rules always allow you to take it as 1 — assume everything burns — which saves you tracking the carbon left in ash and dust, and is conservative.

If you do measure it, the factor is 1 minus (carbon in ash and flue-gas dust ÷ total carbon in the fuel), from laboratory results. It can only lower reported emissions, so it must be backed by evidence.`,
    ["How do I calculate fuel emissions?"],
  ),
  c(
    "electricity-emissions",
    "Electricity emissions",
    ["electricity emissions", "grid factor", "ppa", "power purchase agreement", "indirect electricity", "self generated electricity", "grid emission factor", "electricity factor", "direct technical link", "actual electricity factor", "how is electricity counted"],
    `Indirect emissions = electricity consumed × an emission factor, using active power only.

For the electricity used to make a good the default factor is the five-year average grid factor of the producing country. If you draw from several sources the default is the consumption-weighted average, and you can use a single source or subset if you evidence it.

Actual (own) factors are allowed only with proof: a direct technical link to a generator, or a power purchase agreement together with hourly smart metering. Self-generated electricity gets a factor worked out from the fuel burned to make it divided by the power produced — and that fuel must not also be counted as direct emissions twice.

Where a plant runs its own generation, report the fuel in the fuel list and tick the box that it was used for electricity; don't also enter the generated MWh as purchased.`,
    ["Which goods count indirect emissions?", "How do I record electricity in Certrace?"],
  ),
  c(
    "biomass",
    "Biomass and biofuels",
    ["biomass", "biofuel", "zero rated", "sustainability criteria", "can i use biomass as zero", "rice husk", "wood", "biomass fraction", "renewable fuel"],
    `The emission factor of biomass is treated as zero — but only if the biomass meets the EU's sustainability criteria for bioenergy and you can evidence it. If you can't, the whole stream counts as fossil.

For mixed fuels (such as waste or co-fired solids), the formula is: emission factor = the all-fossil factor × (1 − biomass fraction). The biomass fraction is a number from 0 to 1, not a percentage, and zero is the legal default when it is unknown.`,
    ["How do I calculate fuel emissions?"],
  ),
  c(
    "co2-transfer",
    "CO₂ capture and transfers",
    ["co2 transfer", "carbon capture", "ccs", "stored co2", "geological storage", "co2 sent on", "captured co2", "co2 received"],
    `CO₂ is counted as not emitted only if it is used within the installation or sent to a body that stores it long-term underground, captures it, or binds it permanently in a product — and only to the extent you can evidence the whole chain, from your gate to the storage site or product.

You report both the CO₂ you received from other installations and the CO₂ you sent on. Quantities sent between installations must be measured; CO₂ bound in products is calculated, preferably by mass balance. The identity and contact of the responsible person at the other end must be in your monitoring plan.`,
    ["What goes in the monitoring plan?"],
  ),
  c(
    "measurement-based",
    "Continuous measurement and other gases",
    ["cems", "continuous measurement", "n2o", "pfc", "measurement based", "global warming potential", "gwp", "nitrous oxide", "perfluorocarbon", "cf4", "stack measurement"],
    `Instead of calculating from fuel and materials you can measure emissions from a stack with a continuous emissions measurement system. For nitrous oxide — as in nitric acid — measurement is mandatory; for CO₂ it is allowed where it is shown to be more accurate. Measured emissions from each source are added to the calculated ones.

Non-CO₂ gases are converted to CO₂ equivalent with fixed factors: N₂O × 265, CF₄ × 6,630, C₂F₆ × 11,100. Carbon monoxide emitted is counted as its molar equivalent in CO₂. Measurement results should be backed by a cross-check calculation.`,
    ["How do I calculate fuel emissions?"],
  ),
  c(
    "heat-waste-gas",
    "Heat and waste gases",
    ["heat", "waste gas", "measurable heat", "blast furnace gas", "chp", "cogeneration", "heat balance", "imported heat", "exported heat"],
    `Measurable heat is the net heat carried by a flow — what goes out minus what comes back (the default return condensate is 90 °C). Heat made by a non-combustion exothermic process, as in ammonia or nitric acid plants, counts as zero emissions.

Heat imported from another installation brings its emissions with it; heat exported takes them away. For combined heat and power the emissions are split by attribution factors. Waste gases such as blast-furnace or coke-oven gas used in a different process are corrected with a fixed credit based on the natural-gas factor.

You report, per production process, what heat, waste gas and electricity came in, was made, was used and went out.`,
    ["How are emissions shared between goods?"],
  ),
  c(
    "activity-level",
    "What counts as production",
    ["activity level", "what counts as production", "scrap production", "by-products", "saleable output", "off spec", "how much did i produce", "count production"],
    `The activity level of a production process is the total mass of goods leaving it in the period — only goods that can be sold or used directly as a precursor somewhere else. Off-spec products, by-products, waste and scrap don't count, whether or not they go back into the process, and they carry zero embedded emissions when they re-enter a process.

Where a process also makes a precursor, count only the final goods of the process so nothing is counted twice. A month with no output is 0, not blank, because a missing month makes the annual figure incomplete.`,
    ["What is embedded emissions?"],
  ),
  c(
    "rounding",
    "Rounding and decimals",
    ["rounding", "decimals", "decimal places", "precision", "significant digits"],
    `Annual emissions are reported in whole tonnes of CO₂e. Specific embedded emissions are given in tonnes of CO₂e per functional unit with at most five decimals. Every other parameter keeps all its significant digits, and any rounding is done once, at the end.`,
  ),

  /* ── Default values ─────────────────────────────────────────── */
  c(
    "default-values",
    "Default values",
    ["default value", "what is a default value", "how are defaults set", "why default so high", "default emissions", "default values mean", "default embedded emissions"],
    `A default value is the emissions per tonne the EU assumes for a good when no verified figure is used. It is set per country and per CN code at that country's average emission intensity plus a mark-up; where there is no reliable country data it is based on the average of the ten worst exporting countries.

The mark-up is 10% in 2026, 20% in 2027 and 30% from 2028 — and only 1% for fertilisers in every year. The published tables already show each year's value with the mark-up included. Every default also names the production route it was built on, which decides the free-allocation benchmark that is deducted.

Defaults need no verification. They are the fallback — meant to be high enough that producing real data pays off.`,
    ["What is the mark-up?", "Should I use default or actual values?", "What is the default for CN 7208?"],
  ),
  c(
    "mark-up",
    "The default-value mark-up",
    ["mark-up", "markup", "10 percent", "20 percent", "30 percent", "phase in", "mark up", "mark-up schedule"],
    `The mark-up on default values is phased in: +10% for goods imported in 2026, +20% in 2027, and +30% from 2028 onwards. Fertilisers carry just +1% in every year.

The Commission is due to review default values and mark-ups by December 2027, so these figures can still change. For the quarterly holding estimate, defaults are used without the mark-up.`,
    ["What is a default value?"],
  ),
  c(
    "default-vs-actual",
    "Default or actual?",
    ["default or actual", "when to use actual", "should i use default", "actual vs default", "verified data benefit", "is it worth verifying", "default versus actual", "which is better default or actual"],
    `Use an actual value when it is lower than the default and you can prove it — which, for Thai steel and aluminium, is common, because the default carries a mark-up and is built on an average route.

Actual needs: monitoring of the plant's emissions, a monitoring plan, an accredited verifier's report for the reporting period, and the evidence kept for at least six years. Default needs nothing, but you give up any gain.

For precursors you can mix: actual for the ones you have data on (usually the big ones), default for the rest. If a precursor's actual data is incomplete or its verification doesn't cover the period, the default is used for it.`,
    ["What does verification involve?", "What is the mark-up?", "How do I handle precursors?"],
  ),
  c(
    "unknown-origin",
    "When the origin is unknown",
    ["unknown origin", "country not known", "cannot identify country", "highest default", "unknown country precursor", "origin cannot be identified", "dont know the country", "do not know the origin"],
    `If you can't identify the country where a precursor was produced, you can't use an actual value for it — and the default is automatically the highest country default for that CN code, with the same mark-up phase-in. It is the conservative choice, so it is always at least as high as any country's value.

If you later learn the country, you can switch to that country's default — or to an actual value, if the producer gives you verified data. In Certrace, tick "The country of production cannot be identified" when you add the precursor and it uses the highest default and blocks the actual option.`,
    ["What is a default value?", "How do I add a precursor in Certrace?"],
  ),
  c(
    "other-countries",
    "Countries without their own row",
    ["other countries and territories", "country not listed", "no default for my country", "country not in the table", "unlisted country"],
    `The EU's default tables name 115 countries. A country that isn't listed — or is listed with a dash for a particular good — uses the "Other countries and territories" row for that good. Certrace does this automatically, so every country in the picker has a default value for every covered CN code.`,
    ["What is a default value?"],
  ),
  c(
    "thai-defaults",
    "Thailand's default values",
    ["thailand default", "thai default values", "default for thailand", "scrap eaf", "thai steel default", "thailand route", "why is the thai default high", "thai pain point", "default value gap"],
    `Thailand's default values for steel are built on the scrap and electric-arc-furnace route (and the low-alloy version of it); for aluminium they are built on the secondary route. Examples for 2026: steel screws (CN 7318 12 90) 2.649 tCO₂e/t, hot-rolled flat steel (CN 7208) 2.111, aluminium plates (CN 7606) 1.903, unwrought aluminium (CN 7601) 0.396.

The Thai concern is that the free-allowance offset for the scrap route is small, so the net cost does not fall much even though Thailand's route is cleaner than blast-furnace steel; competitors with higher defaults but bigger offsets end up paying less per tonne. Industry is pressing for adjusted defaults, but the dependable answer today is verified actual data.`,
    ["What is the default for CN 7208?", "How is free allocation deducted?"],
  ),

  /* ── Cost ────────────────────────────────────────────────────── */
  c(
    "benchmarks-free-allocation",
    "Benchmarks and free allocation",
    ["benchmark", "free allocation", "free allowances", "cbam factor", "phase out", "allocation phase out", "free allowance phase out", "how free allocation phases out", "cbam benchmark", "offset"],
    `EU producers still receive some free emission allowances, which CBAM must not double-charge. So the bill is reduced by a benchmark — the free allocation an EU producer of that good gets per tonne — multiplied by a phase-out factor. The share deducted is 97.5% in 2026, 95% in 2027, 90% in 2028, 77.5% in 2029, 51.5% in 2030, 39% in 2031, 26.5% in 2032, 14% in 2033 and 0 from 2034. As it falls, CBAM covers more of the emissions.

The benchmark depends on the good and the production route (for steel: blast furnace, direct reduction, scrap and so on). For default values the route is the one the EU used for your country. There is also a cross-sector correction factor that the Commission publishes separately; Certrace does not apply it yet, so cost figures are slightly high.`,
    ["How much will CBAM cost me?", "What is a default value?"],
  ),
  c(
    "cbam-cost",
    "How much CBAM costs",
    ["cost", "how much will cbam cost", "certificates needed", "calculate cbam cost", "cost per tonne", "example", "cbam bill", "how many certificates", "calculate certificates"],
    `Per tonne of product:

certificates needed = SEE − carbon price already paid (per tonne) − (free-allocation factor × benchmark)
cost = certificates needed × certificate price

For a default value, SEE is the default for your country and CN code. For an actual value, it is your verified figure.

Worked example from the industry briefing: screws CN 7318 12 90, Thailand, 2026. Default 2.649 tCO₂e/t, benchmark 0.066, factor 97.5%, certificate price €90: about 2.585 tCO₂ per tonne to cover, roughly €232.6 per tonne of screws. If the same plant verified an actual figure of 1.5, it would be nearer €129.

Certrace's Carbon & Cost page does this for your own CN codes. It shows default-value exposure — what the buyer pays if no actual data is supplied — not a filing.`,
    ["What is a default value?", "How is free allocation deducted?", "Can I deduct a carbon tax?"],
  ),
  c(
    "carbon-price",
    "Carbon price paid abroad",
    ["carbon price paid", "carbon tax", "deduct carbon price", "thai carbon tax", "carbon price deduction", "carbon pricing abroad", "excise carbon tax"],
    `The certificates a declarant must surrender can be reduced by a carbon price effectively paid in a third country — the country where the goods are made or another. Conditions: it must really have been paid, net of any rebate; the evidence must be certified by an independent person; and records are kept for years.

It is available with actual values. For default values, a reduction is possible only through default carbon prices that the EU may publish per country from 2027 — so don't plan on a deduction for 2026 imports made on defaults.

Precursors already covered by the EU emissions trading system or a linked system carry no embedded emissions.`,
    ["What is Thailand's carbon price?", "How much will CBAM cost me?"],
  ),
  c(
    "thai-carbon-price",
    "Thailand's carbon price",
    ["thailand carbon price", "thai carbon price", "carbon price in thailand", "how much is the carbon tax in thailand", "thai carbon tax rate", "thailand carbon tax", "current carbon price thailand", "latest carbon price thailand", "thb 200", "200 baht carbon", "thailand climate change act", "thai climate change act", "thailand ets", "th-ets", "thailand emissions trading", "is the thai carbon price up to date"],
    `Thailand's carbon price is THB 200 per tonne of CO₂e, and it is built into the excise on oil products rather than charged as a separate tax. The Cabinet approved it in January 2025 and the Excise Department's notice was published in the Government Gazette on 22 April 2025. It covers petrol and gasohol, kerosene, jet fuel, diesel and biodiesel, LPG and fuel oil. Pump prices did not change, because the carbon part sits inside the existing excise. Raising it above THB 200 needs Cabinet approval, and no change had been announced when Certrace last checked, on 26 October 2026.

The Climate Change Act, which would add a carbon tax on listed goods and a mandatory emissions trading system, is still a draft: the Cabinet approved it on 2 December 2025, the Council of State began reviewing it on 5 May 2026, and it has not been passed or published. Enactment is expected around 2027 and an emissions-trading pilot not before about 2029.

For CBAM, whether the EU accepts the Thai excise as a carbon price paid has not been confirmed — and in 2026 only an actual value can use a deduction at all. Certrace records it as a claim and never subtracts it; budget as though it will not be accepted.`,
    ["Can I deduct a carbon tax?", "How much will CBAM cost me?"],
  ),

  /* ── Verification & records ─────────────────────────────────── */
  c(
    "verification",
    "Verification",
    ["verification", "verifier", "who verifies", "do i need a verifier", "accredited verifier", "what does verification involve", "verify emissions", "verification report", "what is verified"],
    `Verification applies to actual values only — default values need none. An accredited, independent verifier checks your emissions report and gives reasonable assurance that it has no material misstatement and follows your monitoring plan.

They work risk-based and sceptically: review the plan and the data, trace figures to meters and invoices, cross-check them, and visit the installation. The result is a verification report that goes to the Commission's e-template through the CBAM Registry, together with your operator's report and summary.

Verifiers are accredited by a national accreditation body and can register in the Registry from 1 September 2026. A report from a verifier whose accreditation is not valid at issue, or that doesn't cover the production period, can't support an actual value.`,
    ["What is materiality?", "What about site visits?", "What goes in the monitoring plan?"],
  ),
  c(
    "materiality",
    "Materiality",
    ["materiality", "5 percent", "misstatement", "non conformity", "material misstatement", "five percent"],
    `The verifier's materiality threshold is 5% — of the total embedded emissions per tonne of each CN-coded good, and of the specific embedded free allocation. A misstatement is an omission, error or misrepresentation; a non-conformity is a breach of your monitoring plan; a material non-conformity is one that causes a material misstatement. Below the threshold the verifier uses expert judgement.`,
    ["What does verification involve?"],
  ),
  c(
    "site-visits",
    "Verifier site visits",
    ["site visit", "virtual visit", "physical visit", "audit", "will the verifier visit", "verifier visit", "waive site visit"],
    `In the first verified year the verifier always makes a physical visit. Later they may visit virtually or waive the visit — but only if there was a physical visit in the previous period, they understand the installation well, risk and complexity are low, they have remote access to everything, and nothing significant has changed (new or closed processes or routes, a change in energy supply, precursors or methodology). A physical visit is still needed at least every two years. In extraordinary, unforeseeable circumstances a virtual visit is allowed.`,
    ["What does verification involve?"],
  ),
  c(
    "monitoring-plan",
    "The monitoring plan",
    ["monitoring plan", "methodology document", "mmd", "what goes in a monitoring plan", "monitoring methodology", "what is a monitoring plan"],
    `The monitoring plan is the written method for how you will measure and calculate emissions. It is in English and describes: the installation and its processes; the goods by CN code and unit; the source streams and emission sources; whether you calculate or measure each one; sampling and analysis; precursors and suppliers; zero-rated fuels; flows of heat, waste gas and CO₂; and your control system — instrument checks, risk assessment, IT quality assurance, separation of duties, internal review and corrective action.

It follows principles of completeness, consistency, transparency, accuracy, integrity and cost-effectiveness. It must be kept up to date, and a change in the installation means updating it. Certrace builds it from the installation's Overview and each month's methodology step.`,
    ["How long must I keep records?", "What does verification involve?"],
  ),
  c(
    "records",
    "Keeping records",
    ["records", "retention", "how long keep", "evidence retention", "keep documents", "record keeping"],
    `Keep everything that supports your reported emissions — meter data, invoices, calibration certificates, lab analyses, the monitoring plan and the verification report — for at least six years after the reporting period. The basic law says four, the calculation rules say six; use six. Keep carbon-price evidence for as long as the declarant has to.`,
    ["What goes in the monitoring plan?"],
  ),
  c(
    "reports",
    "The operator's reports",
    ["operator report", "emissions report", "summary report", "declarant addendum", "report to buyer", "what report does the buyer need", "operator's emissions report", "what reports do i produce", "report set", "35 items", "how many reports", "which reports do i send", "what do i send to the verifier", "what goes to the verifier", "reports for the verifier", "what documents does the verifier need"],
    `You write three reports, plus an optional fourth, all in English:

• The monitoring plan — what you monitor and how, element by element as the template lists them: the installation and its goods, the methods per production process, the instruments and where they sit, the sampling plan, the precursors, fuels, heat, electricity, waste gases and CO₂, and the control system that keeps the data right.
• The operator's emissions report — the full 35-item template: operator and installation, monitoring plan summary, direct emissions, electricity, goods and their SEE, precursors, attribution and sector parameters. This is what the verifier verifies.
• The operator's summary emissions report — a shortened version (16 items) passed on to the declarant.
• A declarant-specific addendum, only for electricity imported into the EU — one per authorised declarant.

Two more things travel with them, but you don't write them: the verification reports of the installations that made the precursors you used on actual values, and the supporting evidence — the bills, logs and certificates behind your figures. The verifier's own verification report is theirs to write, not yours.

If you are registered in the CBAM Registry they are sent through it. In Certrace they are built per installation and year, and download together as one package.`,
    ["What does the package include in Certrace?", "What goes in the monitoring plan?"],
  ),
  c(
    "penalties",
    "Penalties",
    ["penalty", "penalties", "fine", "non compliance", "what if i fail", "what if declarant is late", "consequences", "sanction"],
    `Penalties fall on the importer or declarant, not the exporter. Failing to surrender enough certificates by 30 September is penalised per missing certificate at the EU emissions-trading excess-emissions rate (indexed each year — I don't quote the figure), and the duty to surrender remains. Importing without authorisation costs three to five times that per certificate. Wrong data supplied by a third party such as an operator or verifier can reduce the penalty. Importers who pass 50 tonnes without authorisation pay on the whole year's embedded emissions.

For an exporter the real exposure is commercial: a buyer who can't get reliable data pays the high default — or buys elsewhere.`,
    ["What is the 50 tonne rule?", "What is a default value?"],
  ),
  c(
    "uk-cbam",
    "The UK's CBAM",
    ["uk cbam", "united kingdom", "britain", "uk carbon border", "uk"],
    `The UK starts its own CBAM on 1 January 2027, covering aluminium, cement, fertiliser, hydrogen, and iron and steel. Importers register above £50,000 of covered imports a year, using verified actual data or UK defaults. Registration is due by 31 January 2028, with the first return and payment on 31 May 2028; indirect emissions come in 2029 at the earliest. The details were still in consultation early in 2026 and can change. Data you collect for the EU is a strong base for the UK too.`,
    ["What are the key CBAM dates?"],
  ),
  c(
    "alternative-data",
    "Alternative values and reviews",
    ["alternative values", "alternative default", "30 june", "review of defaults", "change default", "alternative grid factor", "can defaults change", "adapt default values"],
    `Defaults are not fixed forever. A country can submit official data by 30 June of the import year for an alternative electricity emission factor, or for a region-specific adaptation of default values. The Commission then amends the values by 30 June of the following year. And the Commission reviews default values and mark-ups by December 2027, with a report before 1 January 2028 and every two years after.`,
    ["What is the mark-up?"],
  ),
  c(
    "data-gaps",
    "Data gaps and estimates",
    ["data gap", "missing data", "estimates", "what if meter broke", "estimate emissions", "meter failure", "gaps in data", "missing reading"],
    `Missing data happens — a meter fails, a delivery slip is lost. Estimate it conservatively, record what the gap was, how long it lasted and how you estimated it so that a verifier could redo it, and have a named person review it. Use the most accurate substitute available. The report lists data gaps and estimates as a separate item, and the amounts estimated are totalled.`,
    ["What does verification involve?"],
  ),
  c(
    "reporting-period",
    "The reporting period",
    ["reporting period", "which year", "calendar year", "period for precursors", "what year do i report", "which period"],
    `The reporting period is the calendar year. Goods imported in 2026 use 2026 data. For another year, the year of import is used unless there is evidence of the actual production period. For a precursor, the default period is the year the complex good was produced; actual precursor data must come from a verification report that covers the production period. A good can also be reported over a different 12-month period if it matches the production.`,
    ["What does verification involve?"],
  ),
  c(
    "registry",
    "The CBAM Registry",
    ["cbam registry", "register operator", "register installation", "registry", "register in the registry", "how to register installation"],
    `The CBAM Registry is the Commission's system where declarants hold their accounts and declarations. Producers can register themselves as operators and their installations there, valid for five years. You enter the operator's name, address and registration number, the controlling parent if any, and the installation's location with six-decimal coordinates and main activity. Once registered you receive a unique installation identifier that goes into your reports, and you can share verified data with declarants through the Registry. Only a few details — names, addresses, contact and location — are public; you can opt out of publishing them.`,
    ["What is the operator's emissions report?"],
  ),
  c(
    "eori",
    "The EORI number",
    ["eori", "eori number", "what is eori", "what is the eori number", "customs registration number", "importer id", "buyer eori"],
    `An EORI number is the EU customs registration number a business needs to import goods into the EU. Your EU buyer — the declarant — has one and uses it in the CBAM Registry. As an exporter outside the EU you don't need an EORI for CBAM, but your buyer may ask you to quote theirs on shipment records so their declaration can be matched to your data.`,
    ["Am I the declarant?", "What is the CBAM Registry?"],
  ),
  c(
    "language-format",
    "Language and format",
    ["language of report", "english", "thai language", "write in english", "report language"],
    `The monitoring plan and the operator's emissions report must be in English. Numbers and dates stay as they are. Coordinates are given with six decimals, the location with its UN/LOCODE, and the installation's address is written in English (with a local-language name where it helps).`,
  ),

  /* ── Sectors ─────────────────────────────────────────────────── */
  c(
    "sector-steel",
    "Iron and steel",
    ["iron and steel", "steel sector", "steel routes", "blast furnace", "electric arc furnace", "eaf", "bof", "direct reduced iron", "dri", "steel emissions", "how are steel emissions counted", "steel cbam", "scrap route"],
    `Steel's embedded emissions depend on the route: blast furnace with basic oxygen furnace (the highest), direct reduction with an electric arc furnace, or scrap melted in an electric arc furnace (the lowest). Only direct emissions are charged for iron and steel (except agglomerated iron ore); indirect emissions from electricity are reported but not priced.

Crude steel covers the furnace and casting; iron and steel products add rolling, forging, annealing, coating, galvanising, wire drawing and pickling. Alloy content (manganese, chromium, nickel), the share of scrap and its pre-consumer share are reported as sector parameters. Scrap itself is not a covered good and carries zero emissions.

Thailand's defaults for steel are built on the scrap/electric-arc-furnace route.`,
    ["What are direct vs indirect emissions?", "Thailand's default values"],
  ),
  c(
    "sector-aluminium",
    "Aluminium",
    ["aluminium sector", "aluminum sector", "primary aluminium", "secondary aluminium", "aluminium emissions", "smelter", "anode effect", "aluminium cbam", "aluminum cbam", "aluminium scrap", "aluminum scrap"],
    `Primary aluminium is smelted from alumina and is dominated by electricity and by the perfluorocarbons (CF₄ and C₂F₆) released in anode effects, which are counted as CO₂ equivalent (×6,630 and ×11,100). Secondary aluminium is melted from scrap and is far lower. Only direct emissions are charged for aluminium; scrap added to a secondary process is not a covered good, but unwrought aluminium bought in as a precursor is.

Thailand's defaults for aluminium are built on the secondary route. Sector parameters reported: scrap used per tonne, the pre-consumer share, and any other element above 1%.`,
    ["What is a precursor?"],
  ),
  c(
    "sector-cement",
    "Cement and clinker",
    ["cement", "clinker", "what is clinker", "cement sector", "cement emissions", "calcined clay", "portland", "kiln", "calcination"],
    `Clinker is the main ingredient of cement: limestone heated in a kiln until it decomposes, which releases most of cement's CO₂ as process emissions on top of the fuel burned. CBAM covers clinker, Portland and other hydraulic cements and calcined kaolinic clay.

Both direct and indirect (electricity) emissions are counted for cement. Cement's functional unit is tonnes of clinker contained, so the clinker-to-cement ratio is a reported parameter. Typical kiln fuels — petroleum coke, coal, lignite, tyres, biomass — are all in the fuel list.`,
    ["How do process emissions work?", "What are functional units?"],
  ),
  c(
    "sector-fertilisers",
    "Fertilisers",
    ["fertiliser", "fertilizer", "fertilisers", "ammonia", "urea", "nitric acid", "nitrate", "fertiliser emissions", "fertilizer emissions", "nitrogen fertiliser"],
    `Fertilisers covered: nitric acid, ammonia, potassium nitrate, urea and other nitrogenous and mixed fertilisers (the potassium-phosphate type is out). Emissions: CO₂ for ammonia; CO₂ plus nitrous oxide for the rest — nitric acid requires N₂O to be measured. Both direct and indirect emissions are counted. Several fertilisers use kilograms of nitrogen as the functional unit, with composition ranges for the different forms of nitrogen.

The default-value mark-up for fertilisers is only 1% in every year, not the 10/20/30% phase-in of other goods.`,
    ["What is the mark-up?", "What are functional units?"],
  ),
  c(
    "sector-hydrogen",
    "Hydrogen and electricity",
    ["hydrogen", "hydrogen sector", "electricity imports", "imported electricity", "electricity cbam", "electricity addendum"],
    `Hydrogen is covered for CO₂, with only direct emissions charged. Electricity imported into the EU is covered too, with its own rules: the default is the producing country's emission factor, and an actual value is allowed only with a power purchase agreement, a direct connection or no congestion, a factor under 550 g CO₂/kWh, firm nomination matched within an hour, and verifier certification with monthly interim reports. A declarant-specific addendum is produced for each declarant for imported electricity.`,
    ["What goes in the operator's report?"],
  ),

  c(
    "certificate-price-2026",
    "The 2026 certificate prices so far",
    ["cbam certificate price", "current certificate price", "latest certificate price", "certificate price now", "certificate price today", "q3 2026 price", "q4 2026 price", "quarterly certificate price", "how much is a cbam certificate", "price of a cbam certificate"],
    `The Commission publishes one CBAM certificate price per quarter in 2026, in the first week after the quarter ends. So far: €75.36 for the first quarter (published 7 April 2026), €75.28 for the second (6 July) and €82.32 for the third (5 October, up about 9%). The fourth is due on 4 January 2027. Each is the weighted average of the EU emissions-trading auction prices and applies to goods imported in that quarter.

From 2027 the price is calculated and published weekly, and certificates go on sale on 1 February 2027. This is the position as of 25 October 2026 — the Commission's own page has the figure for the latest quarter.`,
    ["How much will CBAM cost me?", "When is the first CBAM declaration?"],
  ),
  c(
    "verifiers-accredited",
    "Which verifiers are accredited?",
    ["which verifiers are accredited", "accredited verifiers", "list of accredited verifiers", "new verifiers", "first accredited verifier", "who are the verifiers", "verifier list", "find a verifier", "verifier in thailand", "thai verifier", "verifier for thai exporters", "can a thai verifier be accredited"],
    `As of 25 October 2026 the Commission has not yet published its official list of accredited CBAM verifiers — its verification page says the list "will be published" there. National accreditation bodies have started naming verifiers, and these have been announced:

• EmiCert (Greece), accredited by ESYD — announced 23 September 2026.
• Bureau Veritas Italia, RINA Services and SGS ICS Italia (Italy), accredited by Accredia — decision of 28 September, announced 6 October 2026.
• Intertek Certification AB (Sweden), accredited by Swedac — 13 October 2026.

Verifiers could register in the CBAM Registry from 1 September 2026, and the first verification reports can be issued from January 2027. A verifier based outside the EU, including in Thailand, applies to any national accreditation body that offers CBAM accreditation; the Commission keeps a state-of-play table of these bodies, last dated 21 October 2026. None based outside the EU had been documented as accredited yet. Check each accreditation's scope, and the Commission's list once it is out, before you hire one.`,
    ["Do I need a verifier?", "What does verification involve?"],
  ),
  c(
    "downstream-extension",
    "The extension to downstream goods",
    ["downstream", "downstream goods", "downstream extension", "extension of scope", "scope extension", "will cbam be extended", "cbam expansion", "more products in cbam", "anti circumvention", "anti-circumvention", "resource shuffling", "trilogue"],
    `Not yet. On 17 December 2025 the Commission proposed bringing about 180 steel- and aluminium-intensive downstream goods — screws, bolts, wire, tubes — into CBAM, with new rules against circumvention. The Council agreed its position on 12 June 2026 (about 200 products) and the European Parliament on 15 September 2026 (a much wider list). The first negotiation between the three, the trilogue, on 20 October 2026 ended without agreement; the next is provisionally set for 30 November 2026.

It is still a proposal, so nothing changes in what you report today. If your goods end up on the final list, you would be asked for embedded emissions the way steel and aluminium exporters are now.`,
    ["Which goods CBAM covers", "How much will CBAM cost me?"],
  ),

  c(
    "first-steps",
    "Where to start",
    ["where do i start", "what should i do first", "getting ready", "cbam checklist", "how do i prepare", "readiness checklist", "prepare for cbam", "next steps", "start with cbam"],
    `A sensible order for an exporter:

1. Find out which of your products are in scope (check the CN codes) and which of your EU buyers import them.
2. Register your installation: name, address, UN/LOCODE, coordinates, and the monitoring plan summary.
3. Set up monthly data collection from the plant — production, fuels, electricity, process materials — with the documents behind them.
4. List the precursors you buy in and decide default or actual for each.
5. Compare the default-value exposure with your likely actual figure to see whether verification pays.
6. Bring in an accredited verifier for the reporting year, and keep the evidence for six years.

Certrace is organised in this order: installation first, then a product report per good, monthly data, precursors, then the report package.`,
    ["How do I add an installation in Certrace?", "How much will CBAM cost me?"],
  ),
];
