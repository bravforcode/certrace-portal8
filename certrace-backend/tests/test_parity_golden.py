"""Parity against the shared golden fixture.

``docs/fixtures/golden-eaf-2026.json`` sits at the repo root and is read by
this file and by ``certrace-portal/lib/cbam/__tests__/parity-fixture.test.ts``.
Neither engine owns it. That is the whole design: today the portal computes
every number a customer sees, this engine computes none of them, and nobody
has ever checked that the two agree. Until they do, moving the calculation
across is a re-baseline dressed up as a refactor.

The fixture is a scrap-fed EAF steel installation, and this engine can express
exactly two of its four emission lines. So the assertions come in three kinds:

  COVERED     the indirect and precursor lines, asserted as EXACT decimal
              equality against the shared expectations - not within a
              tolerance. Two engines that are to swap places have to agree
              completely, not nearly.
  PARTIAL     the totals, which are the fixture's totals minus the whole
              direct line. Pinned so that closing a gap visibly moves them.
  GUARDS      the gaps themselves, asserted to still be gaps. When someone
              teaches this engine about calorific values, the guard below goes
              red - and that is the notification to update the fixture's
              `unsupported` list, not a failure to route around.
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
    return Decimal(payload[field]["value"])


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


# ── Partial totals: pinned so a closed gap is visible ──────────────────────


def test_partial_totals_are_the_shared_totals_minus_the_direct_line(
    client, fixture
) -> None:
    payload = calculate(client, fixture["backend"]["request"]).json()
    partial = fixture["backend"]["expectedPartial"]

    for field, expected in partial.items():
        if field == "note":
            continue
        assert exact(payload, field) == Decimal(expected), (
            f"{field}: fixture pins {expected}, engine returned "
            f"{payload[field]['value']}"
        )

    # And they are genuinely short of the real answers, by exactly the direct
    # line this engine cannot express. If this ever comes out equal, the gap
    # closed and the fixture needs updating rather than this assertion.
    shortfall = Decimal(str(fixture["expected"]["chargeableSpecific"])) - exact(
        payload, "chargeableSpecificEmbeddedEmissions"
    )
    assert shortfall == Decimal(str(fixture["expected"]["directSpecific"])), (
        "The shortfall against the portal's chargeable figure should be the "
        "whole direct line and nothing else."
    )


# ── Guards: the gaps are still gaps ────────────────────────────────────────


def test_fuel_combustion_in_energy_units_is_still_rejected(client, fixture) -> None:
    """Gap `fuelTCO2`. The fixture's gas row is 148,800 m3 at 0.0383 GJ/m3 and
    0.0561 tCO2/GJ. There is no energy unit in the model, so it cannot be sent
    as anything but a lie about tonnes."""

    request_body = dict(fixture["backend"]["request"])
    request_body["source_streams"] = [
        {
            "id": "gas",
            "activity": {"value": "5699.04", "unit": "GJ"},
            "emission_factor": {"value": "0.0561", "unit": "TCO2E_PER_GJ"},
        }
    ]
    assert_rejected(
        calculate(client, request_body),
        "literal_error",
        "body.source_streams.0.activity.unit",
    )


def test_process_emissions_are_still_an_unknown_input(client, fixture) -> None:
    """Gap `processTCO2`. Mass balance over a carbon content has no input type
    here, and the request model forbids extra fields rather than dropping
    them silently."""

    request_body = dict(fixture["backend"]["request"])
    request_body["process_emissions"] = [
        {
            "id": "electrode",
            "mass": {"value": "22.05", "unit": "TNE"},
            "carbon_content": {"value": "1.0", "unit": "FRACTION"},
        }
    ]
    assert_rejected(
        calculate(client, request_body), "extra_forbidden", "body.process_emissions"
    )


def test_a_precursor_cannot_carry_its_own_precursors(client, fixture) -> None:
    """Gap `multi-tier precursors`. Real chains are two to four tiers; this
    model is one."""

    request_body = json.loads(json.dumps(fixture["backend"]["request"]))
    request_body["precursors"][1]["children"] = [
        {
            "id": "ore",
            "method": "ACTUAL",
            "quantity": {"value": "1.6", "unit": "TNE"},
            "actual_specific_embedded_emissions": {
                "value": "0.2",
                "unit": "TCO2E_PER_TNE",
            },
        }
    ]
    assert_rejected(
        calculate(client, request_body),
        "extra_forbidden",
        "body.precursors.1.children",
    )


def test_every_gap_names_how_it_gets_closed(fixture) -> None:
    """A gap register that only lists symptoms turns into a list nobody
    actions. Each entry that blocks parity has to say what closes it."""

    blocking = {"fuelTCO2", "processTCO2", "multi-tier precursors"}
    entries = {entry["line"]: entry for entry in fixture["backend"]["unsupported"]}

    assert blocking <= set(entries), (
        "A blocking gap disappeared from the register. If it was closed, this "
        "suite's guard for it should have gone red first - check which."
    )
    for line in blocking:
        assert entries[line].get("closedBy"), f"gap {line} has no route out"
        assert entries[line].get("guard"), f"gap {line} has no test holding it"
