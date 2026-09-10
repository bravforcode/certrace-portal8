"""Parity against the shared golden fixture.

``docs/fixtures/golden-eaf-2026.json`` sits at the repo root and is read by
this file and by ``certrace-portal/lib/cbam/__tests__/parity-fixture.test.ts``.
Neither engine owns it. That is the whole design: today the portal computes
every number a customer sees, this engine computes none of them, and nobody
has ever checked that the two agree. Until they do, moving the calculation
across is a re-baseline dressed up as a refactor.

The fixture is a scrap-fed EAF steel installation, and as of 2026-09-10 this
engine expresses all four of its emission lines. The assertions come in three
kinds:

  COVERED     asserted as EXACT decimal equality against the shared
              expectations - not within a tolerance. Two engines that are to
              swap places have to agree completely, not nearly.
  TOLERANCE   the lines whose shared expectation is itself a rounded figure.
              319.7161 is the display form of 319.716144, so an engine that
              equalled it exactly would be the one that is wrong. These are
              held to the fixture's own `tolerance` block and nothing looser.
  REFUSALS    what the engine must still say no to. A calorific value it
              guessed, a chain that contains itself: each is a way to get a
              plausible number that nobody could re-derive, and each is
              pinned here so a later convenience cannot quietly allow it.
"""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.config import CORS_ALLOWED_ORIGINS_ENV
from app.main import create_app

FIXTURE_PATH = Path(__file__).parents[2] / "docs" / "fixtures" / "golden-eaf-2026.json"


def load_fixture() -> dict[str, Any]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


@pytest.fixture(name="fixture", scope="module")
def fixture_data() -> dict[str, Any]:
    assert FIXTURE_PATH.exists(), (
        f"The shared fixture is missing at {FIXTURE_PATH}. It lives at the repo "
        "root on purpose - see docs/fixtures/README.md."
    )
    return load_fixture()


@pytest.fixture(name="client")
def api_client(monkeypatch) -> TestClient:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    return TestClient(create_app())


def calculate(client: TestClient, request_body: dict[str, Any]):
    return client.post("/api/v1/calculate", json=request_body)


def exact(payload: dict[str, Any], field: str) -> Decimal:
    """Read a measured value, by dotted path for the nested ones."""

    node: Any = payload
    for part in field.split("."):
        node = node[part]
    return Decimal(node["value"])


def refused(response, code: str) -> None:
    """An engine-level refusal, named. A guard that only checked for 422 would
    stay green if the request became invalid for an unrelated reason, and the
    rule it is watching could be dropped unnoticed."""

    assert response.status_code == 422, response.text
    detail = response.json()["detail"]
    assert isinstance(detail, dict), (
        "A refusal by the engine carries {code, message}; a list here means "
        f"the request never reached it and failed validation instead: {detail}"
    )
    assert detail["code"] == code, detail


def assert_rejected(response, error_type: str, location: str) -> None:
    """A guard that only checks for 422 would stay green if the request became
    invalid for some unrelated reason, and the gap it is watching could close
    unnoticed. So each one names the field it expects to be refused and why."""

    assert response.status_code == 422, response.text
    reasons = {
        (error["type"], ".".join(str(part) for part in error["loc"]))
        for error in response.json()["detail"]
    }
    assert (error_type, location) in reasons, (
        f"expected {error_type} at {location}, got {sorted(reasons)}"
    )


# ── The mapping the fixture claims, audited ────────────────────────────────


def test_the_backend_request_really_is_the_shared_inputs(fixture) -> None:
    """The request block is a translation of `inputs`, not a second set of
    numbers. If it drifts, this suite would be proving parity against
    something the portal never computed."""

    inputs = fixture["inputs"]
    request_body = fixture["backend"]["request"]
    production = Decimal(str(inputs["production"]["value"]))

    assert Decimal(request_body["production"]["value"]) == production
    assert request_body["sector"] == fixture["sector"]
    assert request_body["route"] == fixture["route"]
    assert request_body["reporting_year"] == fixture["reportingYear"]

    fuel = inputs["fuels"][0]
    sent_fuel = request_body["source_streams"][0]
    assert Decimal(sent_fuel["activity"]["value"]) == Decimal(str(fuel["quantity"]))
    assert Decimal(sent_fuel["net_calorific_value"]["value"]) == Decimal(
        str(fuel["ncv"])
    )
    assert Decimal(sent_fuel["emission_factor"]["value"]) == Decimal(
        str(fuel["emissionFactor"])
    )
    # The metered quantity travels as metered. A caller that pre-multiplied it
    # into GJ would be doing the conversion this engine exists to record.
    assert sent_fuel["activity"]["unit"] == "MTQ", (
        "the gas row must stay in its metered unit, with the calorific value beside it"
    )

    process = inputs["processEmissions"][0]
    sent_process = request_body["process_emissions"][0]
    assert Decimal(sent_process["mass"]["value"]) == Decimal(str(process["massTonnes"]))
    assert Decimal(sent_process["carbon_content"]["value"]) == Decimal(
        str(process["carbonContent"])
    )
    # 3.664 is the engine's constant, not an input. If it ever appears in the
    # request the guard below has stopped meaning anything.
    assert "conversion_factor" not in sent_process

    electricity = inputs["electricity"][0]
    assert Decimal(request_body["electricity"]["electricity"]["value"]) == Decimal(
        str(electricity["mwhAbsolute"])
    )
    assert Decimal(request_body["electricity"]["emission_factor"]["value"]) == Decimal(
        str(electricity["emissionFactor"])
    )

    # Per tonne of output in the fixture, absolute tonnes on the wire.
    by_id = {row["id"]: row for row in inputs["precursors"]}
    assert len(request_body["precursors"]) == len(by_id)
    for sent in request_body["precursors"]:
        source = by_id[sent["id"]]
        assert (
            Decimal(sent["quantity"]["value"])
            == Decimal(str(source["qtyPerTonneOutput"])) * production
        ), f"{sent['id']}: absolute tonnes do not match qty per tonne x production"
        if source["isScrap"]:
            assert sent["method"] == "SCRAP"
        else:
            assert sent["method"] == "ACTUAL"
            assert Decimal(
                sent["actual_specific_embedded_emissions"]["value"]
            ) == Decimal(str(source["seeDeclared"]))


# ── Covered lines: exact agreement, no tolerance ───────────────────────────


def test_covered_lines_match_the_shared_expectations_exactly(client, fixture) -> None:
    response = calculate(client, fixture["backend"]["request"])
    assert response.status_code == 200, response.text
    payload = response.json()

    for field, expectation_key in fixture["backend"]["covered"].items():
        expected = Decimal(str(fixture["expected"][expectation_key]))
        assert exact(payload, field) == expected, (
            f"{field}: shared fixture says {expected}, engine says "
            f"{payload[field]['value']}"
        )

    # No route blocker should fire: EAF wants electricity and a metallic
    # input, and the fixture supplies both.
    blockers = [w for w in payload["warnings"] if w["severity"] == "BLOCKER"]
    assert blockers == [], blockers


def test_the_rounded_lines_match_inside_the_fixtures_own_tolerance(
    client, fixture
) -> None:
    """The shared expectations are stated for a reader, so the fuel line reads
    319.7161 where the arithmetic gives 319.716144. These are held to the
    fixture's tolerance block - the same band the portal suite uses - and the
    assertion says which band it used, so nobody widens one quietly."""

    payload = calculate(client, fixture["backend"]["request"]).json()
    tolerance = fixture["tolerance"]

    for field, expectation_key in fixture["backend"]["coveredWithinTolerance"].items():
        expected = Decimal(str(fixture["expected"][expectation_key]))
        band = Decimal(str(tolerance["mass" if expected > 1 else "ratio"]))
        difference = abs(exact(payload, field) - expected)
        assert difference <= band, (
            f"{field}: shared fixture says {expected}, engine says "
            f"{exact(payload, field)}, off by {difference} which is outside {band}"
        )


def test_the_direct_line_is_fuel_plus_process_and_nothing_else(client, fixture) -> None:
    """The split exists so the two can be checked against different records -
    gas invoices and procurement - and it has to add back up to the number
    that reaches the declaration."""

    payload = calculate(client, fixture["backend"]["request"]).json()
    components = payload["directEmissionsComponents"]

    assert Decimal(components["fuelCombustion"]["value"]) + Decimal(
        components["processEmissions"]["value"]
    ) + Decimal(components["aluminiumPfc"]["value"]) == exact(
        payload, "directEmissions"
    )
    # An EAF steel installation has no PFC line at all.
    assert Decimal(components["aluminiumPfc"]["value"]) == 0


def test_the_process_line_is_traced_as_a_mass_balance(client, fixture) -> None:
    """Same number, different methodology, and a verifier tests the two
    differently: a mass balance over a carbon content is not a standard
    calculation over an emission factor. The constant has to name its source
    in the trace, because an installation cannot file against a private
    value of 44/12."""

    payload = calculate(client, fixture["backend"]["request"]).json()
    trace = next(t for t in payload["traces"] if t["id"] == "electrode")

    assert trace["method"] == "MASS_BALANCE"
    constant = next(i for i in trace["exactInputs"] if i["name"] == "CO2_PER_C")
    assert Decimal(constant["value"]) == Decimal("3.664")
    assert "2018/2066" in constant["sourceReference"]


def test_the_fuel_trace_carries_the_conversion_rather_than_hiding_it(
    client, fixture
) -> None:
    """The calorific value is the single most re-derived number in a fuel row.
    It has to be visible as an input to the row it converted, together with
    the evidence it came from."""

    payload = calculate(client, fixture["backend"]["request"]).json()
    trace = next(t for t in payload["traces"] if t["id"] == "gas")

    ncv = next(i for i in trace["exactInputs"] if i["name"] == "netCalorificValue")
    assert Decimal(ncv["value"]) == Decimal(str(fixture["inputs"]["fuels"][0]["ncv"]))
    assert "netCalorificValue" in trace["formula"]
    assert trace["evidenceReferences"] == ["12 monthly gas invoices 2026"]


def test_the_annex_ii_rule_agrees_with_the_shared_fixture(client, fixture) -> None:
    response = calculate(client, fixture["backend"]["request"])
    payload = response.json()

    assert (
        payload["indirectEmissionsChargeable"]
        == fixture["expected"]["indirectChargeable"]
    )
    # Reported keeps the electricity, chargeable drops it - and for this
    # fixture that is a real difference, not two names for one number.
    assert exact(payload, "reportedSpecificEmbeddedEmissions") - exact(
        payload, "chargeableSpecificEmbeddedEmissions"
    ) == exact(payload, "indirectSpecificEmissions")


def test_the_three_components_sum_to_the_reported_total(client, fixture) -> None:
    payload = calculate(client, fixture["backend"]["request"]).json()
    components = (
        exact(payload, "ownProcessSpecificEmissions")
        + exact(payload, "indirectSpecificEmissions")
        + exact(payload, "precursorSpecificEmissions")
    )
    assert components == exact(payload, "reportedSpecificEmbeddedEmissions")


# ── The totals are now the shared totals, not a shortfall ─────────────────


def test_the_totals_no_longer_fall_short_of_the_portals(client, fixture) -> None:
    """This assertion is the inverse of the one it replaces. The suite used to
    pin a shortfall of exactly the direct line, so that closing the gap would
    be visible. It closed on 2026-09-10, so what is pinned now is that the
    shortfall is gone and cannot come back unnoticed."""

    payload = calculate(client, fixture["backend"]["request"]).json()
    shortfall = Decimal(str(fixture["expected"]["chargeableSpecific"])) - exact(
        payload, "chargeableSpecificEmbeddedEmissions"
    )
    band = Decimal(str(fixture["tolerance"]["ratio"]))

    assert abs(shortfall) <= band, (
        "The engine is short of the portal's chargeable figure by "
        f"{shortfall}. Before 2026-09-10 the shortfall was the whole direct "
        "line; if it has reappeared, a direct-line input is being dropped "
        "rather than refused."
    )


# ── Refusals: the ways to get a number nobody can re-derive ───────────────


def test_a_metered_fuel_quantity_without_a_calorific_value_is_refused(
    client, fixture
) -> None:
    """The one refusal that matters most. Natural gas is about 0.0561 tCO2/GJ;
    read as tCO2/m3 it overstates the row roughly 25-fold. An engine that
    substituted a standard calorific value here would produce a plausible
    number with the assumption that moved it outside the audit trace."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    del request_body["source_streams"][0]["net_calorific_value"]

    response = calculate(client, request_body)
    refused(response, "CALORIFIC_VALUE_REQUIRED")
    # And it says what to do about it, naming the unit the value must be in.
    assert "GJ_PER_MTQ" in response.json()["detail"]["message"]


def test_energy_with_a_calorific_value_on_top_is_refused(client, fixture) -> None:
    """A quantity already in GJ plus an NCV is a double conversion: the
    quietest way to be off by a factor of the NCV itself."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["source_streams"][0]["activity"] = {"value": "5699.04", "unit": "GJ"}

    refused(calculate(client, request_body), "CALORIFIC_VALUE_NOT_APPLICABLE")


def test_an_energy_quantity_with_a_per_tonne_factor_is_refused(client, fixture) -> None:
    """Energy times a per-tonne factor is a unit error that yields a number
    rather than an error, which is precisely why it is checked."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["source_streams"][0]["activity"] = {"value": "5699.04", "unit": "GJ"}
    del request_body["source_streams"][0]["net_calorific_value"]
    request_body["source_streams"][0]["emission_factor"] = {
        "value": "0.0561",
        "unit": "TCO2E_PER_TNE",
    }

    refused(calculate(client, request_body), "UNIT_MISMATCH")


def test_the_conversion_constant_cannot_be_supplied_by_the_caller(
    client, fixture
) -> None:
    """3.664 is fixed by EU MRR (EU) 2018/2066. A request that could set it
    would let one installation file against 44/12 = 3.6667 and another
    against 3.664, and both would look equally traced."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["process_emissions"][0]["conversion_factor"] = {
        "value": "3.6667",
        "unit": "TCO2E_PER_TNE",
    }

    assert_rejected(
        calculate(client, request_body),
        "extra_forbidden",
        "body.process_emissions.0.conversion_factor",
    )


# ── Multi-tier precursors ─────────────────────────────────────────────────


def test_a_precursor_tree_resolves_depth_first(client, fixture) -> None:
    """A tier's own process plus everything it carried in, one tier at a time.

    Hand-checked: SEE(pigiron) = 0.2 + 1.5 x 0.5 = 0.95, so
    SEE(billet) = 0.3 + 1.2 x 0.95 = 1.44, and 525 t of billet into 10500 t of
    good contributes 525 / 10500 x 1.44 = 0.072 tCO2e per tonne. The scrap row
    is unchanged and still carries nothing.
    """

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"][1] = {
        "id": "billet",
        "method": "ACTUAL",
        "quantity": {"value": "525", "unit": "TNE"},
        "own_process_specific_emissions": {"value": "0.3", "unit": "TCO2E_PER_TNE"},
        "children": [
            {
                "id": "pigiron",
                "method": "ACTUAL",
                "quantity": {"value": "1.2", "unit": "TNE_PER_TNE"},
                "own_process_specific_emissions": {
                    "value": "0.2",
                    "unit": "TCO2E_PER_TNE",
                },
                "children": [
                    {
                        "id": "ore",
                        "method": "ACTUAL",
                        "quantity": {"value": "1.5", "unit": "TNE_PER_TNE"},
                        "actual_specific_embedded_emissions": {
                            "value": "0.5",
                            "unit": "TCO2E_PER_TNE",
                        },
                    }
                ],
            }
        ],
    }

    payload = calculate(client, request_body).json()
    assert exact(payload, "precursorSpecificEmissions") == Decimal("0.072")

    # Every tier is traced, and the internal ones say which method produced
    # them - a reader has to be able to tell a tier that transformed material
    # from one that only passed it through.
    methods = {t["id"]: t["method"] for t in payload["traces"]}
    assert methods["billet"] == "PRECURSOR_TREE"
    assert methods["pigiron"] == "PRECURSOR_TREE"
    assert methods["ore"] == "ACTUAL_PRECURSOR"


def test_a_tier_with_children_does_not_also_count_its_declared_figure(
    client, fixture
) -> None:
    """The portal resolves an internal node from its children and ignores its
    declared value. The backend does the same - and says so, because a
    supplier who filled in both deserves to know which one was filed."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"][1]["children"] = [
        {
            "id": "ore",
            "method": "ACTUAL",
            "quantity": {"value": "2", "unit": "TNE_PER_TNE"},
            "actual_specific_embedded_emissions": {
                "value": "0.5",
                "unit": "TCO2E_PER_TNE",
            },
        }
    ]

    payload = calculate(client, request_body).json()
    # 525 / 10500 x (0 + 2 x 0.5) = 0.05, NOT the 0.095 the declared 1.9 gave.
    assert exact(payload, "precursorSpecificEmissions") == Decimal("0.05")
    assert any(
        w["code"] == "PRECURSOR_DECLARED_VALUE_SUPERSEDED:pigiron"
        for w in payload["warnings"]
    ), payload["warnings"]


def test_a_chain_that_contains_itself_is_refused(client, fixture) -> None:
    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"][1]["children"] = [
        {
            "id": "pigiron",
            "method": "ACTUAL",
            "quantity": {"value": "1.2", "unit": "TNE_PER_TNE"},
            "actual_specific_embedded_emissions": {
                "value": "1.9",
                "unit": "TCO2E_PER_TNE",
            },
        }
    ]

    refused(calculate(client, request_body), "PRECURSOR_CYCLE")


def test_a_chain_deeper_than_the_portal_allows_is_refused(client, fixture) -> None:
    """Ten tiers, the same cap as MAX_PRECURSOR_DEPTH in the portal. Real iron
    and steel chains are two to four; anything past ten is a typo that would
    otherwise recurse until something gave way."""

    node: dict[str, Any] = {
        "id": "tier12",
        "method": "ACTUAL",
        "quantity": {"value": "1", "unit": "TNE_PER_TNE"},
        "actual_specific_embedded_emissions": {"value": "1", "unit": "TCO2E_PER_TNE"},
    }
    for tier in range(11, 0, -1):
        node = {
            "id": f"tier{tier}",
            "method": "ACTUAL",
            "quantity": {
                "value": "1",
                "unit": "TNE_PER_TNE" if tier > 1 else "TNE",
            },
            "children": [node],
        }

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"] = [node]

    refused(calculate(client, request_body), "PRECURSOR_DEPTH_EXCEEDED")


def test_a_child_quantity_must_be_a_ratio_not_a_weight(client, fixture) -> None:
    """Top level is absolute tonnes for the period; below it, tonnes per tonne
    of the parent's output. Sending TNE inside a tree would silently multiply
    a whole period's consumption into a per-tonne figure."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"][1]["children"] = [
        {
            "id": "ore",
            "method": "ACTUAL",
            "quantity": {"value": "800", "unit": "TNE"},
            "actual_specific_embedded_emissions": {
                "value": "0.5",
                "unit": "TCO2E_PER_TNE",
            },
        }
    ]

    refused(calculate(client, request_body), "UNIT_MISMATCH")


# ── The register still describes reality ──────────────────────────────────


def test_the_closed_gaps_and_the_open_ones_do_not_overlap(fixture) -> None:
    """The register is the handover note between the two engines. A line that
    is both closed and unsupported means one of the two entries was never
    updated, and the next reader cannot tell which."""

    backend = fixture["backend"]
    closed = {entry["line"] for entry in backend["closed"]}
    open_lines = {entry["line"] for entry in backend["unsupported"]}

    assert closed == {"fuelTCO2", "processTCO2", "multi-tier precursors"}, (
        "A closed gap changed. If a line was re-opened, the covered "
        "assertions above should have gone red first - check which."
    )
    assert not (closed & open_lines), sorted(closed & open_lines)

    for entry in backend["closed"]:
        assert entry.get("how"), f"closed gap {entry['line']} does not say how"
        assert entry.get("guard"), f"closed gap {entry['line']} names no guard"
    for entry in backend["unsupported"]:
        assert len(entry["reason"]) > 40, (
            f"gap {entry['line']} needs a reason a reader can act on, not a label"
        )


def test_no_emission_line_is_left_in_the_unsupported_register(fixture) -> None:
    """What remains open is a different question (mass-balance yield), a
    commercial formula (exposure), or a deliberate difference in how an
    invalid input is handled. None of them is an emission line, which is the
    condition for this engine to be able to hold a filed figure."""

    open_lines = {entry["line"] for entry in fixture["backend"]["unsupported"]}
    emission_lines = {
        "fuelTCO2",
        "processTCO2",
        "indirectTCO2",
        "precursorSpecific",
        "directTCO2",
    }

    assert not (open_lines & emission_lines), sorted(open_lines & emission_lines)
