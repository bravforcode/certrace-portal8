import { describe, expect, test } from "bun:test";
import { validateStore } from "../src/modules/reporting/storage";

// The site wizard saves the operator address in the parts the CBAM template asks for (A_InstData I38–I41).
// The account store rejects any field it does not know, so without these the whole installation record fails to save.
describe("certrace:installations store", () => {
  const installation = {
    id: "TH-CHECK-01",
    name: "Check Steel Co.",
    nameLocal: "",
    self: true,
    supplierId: "",
    street: "",
    economicActivity: "",
    postcode: "",
    poBox: "",
    city: "",
    country: "TH",
    unlocode: "",
    lat: "",
    lng: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    otherGoods: [],
    operatorName: "",
    operatorRegistrationNumber: "",
    operatorAddress: "",
    registryId: "",
    monitoring: {
      nonCbamProcesses: "",
      topFuels: "",
      topMaterials: "",
      cems: "",
      cemsDetail: "",
      zeroRatedFuels: "",
      zeroRatedDetail: "",
      heatTrade: "",
      heatDetail: "",
      electricityMixed: "",
      electricityDetail: "",
      onsiteElectricity: "",
      onsiteElectricityDetail: "",
      wasteGases: "",
      wasteGasDetail: "",
      co2Transfer: "",
      co2TransferDetail: "",
      electricityToEu: "",
    },
    createdAt: "2026-11-12T00:00:00.000Z",
  };

  test("accepts the split operator address", () => {
    const withAddress = {
      ...installation,
      operatorStreet: "99 Sukhumvit Rd",
      operatorCity: "Bangkok",
      operatorPostcode: "10110",
      operatorCountry: "TH",
    };
    expect(() =>
      validateStore("certrace:installations", [withAddress]),
    ).not.toThrow();
  });

  test("still accepts a record saved before the split fields existed", () => {
    expect(() =>
      validateStore("certrace:installations", [installation]),
    ).not.toThrow();
  });

  test("still rejects a field nobody declared", () => {
    expect(() =>
      validateStore("certrace:installations", [
        { ...installation, operatorFax: "x" },
      ]),
    ).toThrow();
  });
});
