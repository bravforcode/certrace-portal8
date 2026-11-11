// Generated from the concrete portal input types; regenerate with db:report-catalogue.
import type { Shape } from './shape';
import type { Json } from '../../lib/json';
export const reportSpecs: Record<string, Shape> = {
  "certrace:internal-precursors": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "id": {
            "kind": "string"
          },
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "sourceWorkspaceId": {
            "kind": "string"
          },
          "quantityUsedT": {
            "kind": "number",
            "optional": true,
            "min": 0
          }
        },
        "arrayElement": true,
        "table": "internal_precursors_rows_rows"
      },
      "scopeKey": true,
      "table": "internal_precursors_rows"
    },
    "table": "internal_precursors"
  },
  "certrace:unit-costs": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "priceThbPerTonne": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "pieceKg": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "electricityThbPerKwh": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "fuelThbPerUnit": {
          "kind": "map",
          "item": {
            "kind": "number",
            "min": 0,
            "table": "unit_costs_rows_fuel_thb_per_unit_rows"
          },
          "optional": true,
          "table": "unit_costs_rows_fuel_thb_per_unit"
        },
        "workspaceId": {
          "kind": "string",
          "derived": "workspace"
        },
        "updatedAt": {
          "kind": "string"
        }
      },
      "scopeKey": true,
      "table": "unit_costs_rows"
    },
    "table": "unit_costs"
  },
  "certrace:workspaces": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "id": {
          "kind": "string"
        },
        "installationId": {
          "kind": "string"
        },
        "installationName": {
          "kind": "string"
        },
        "productId": {
          "kind": "string"
        },
        "productName": {
          "kind": "string"
        },
        "cnCode": {
          "kind": "string"
        },
        "productionRoute": {
          "kind": "string"
        },
        "country": {
          "kind": "string",
          "optional": true
        },
        "year": {
          "kind": "number",
          "min": 0
        },
        "periodStart": {
          "kind": "string"
        },
        "periodEnd": {
          "kind": "string"
        },
        "declarationIds": {
          "kind": "array",
          "item": {
            "kind": "string",
            "arrayElement": true,
            "table": "workspaces_rows_declaration_ids_rows"
          },
          "table": "workspaces_rows_declaration_ids"
        },
        "createdAt": {
          "kind": "string"
        },
        "selfSupplied": {
          "kind": "boolean",
          "optional": true
        },
        "supplierId": {
          "kind": "string",
          "optional": true
        },
        "supplierName": {
          "kind": "string",
          "optional": true
        },
        "schedule": {
          "kind": "object",
          "fields": {
            "dueDay": {
              "kind": "number",
              "min": 0
            }
          },
          "optional": true,
          "table": "workspaces_rows_schedule"
        },
        "archivedAt": {
          "kind": "string",
          "optional": true,
          "nullable": true
        },
        "internalSignoff": {
          "kind": "object",
          "fields": {
            "name": {
              "kind": "string"
            },
            "role": {
              "kind": "string"
            },
            "at": {
              "kind": "string"
            },
            "note": {
              "kind": "string",
              "optional": true
            }
          },
          "optional": true,
          "nullable": true,
          "table": "workspaces_rows_internal_signoff"
        },
        "verifierSignoff": {
          "kind": "object",
          "fields": {
            "name": {
              "kind": "string"
            },
            "role": {
              "kind": "string"
            },
            "at": {
              "kind": "string"
            },
            "note": {
              "kind": "string",
              "optional": true
            }
          },
          "optional": true,
          "nullable": true,
          "table": "workspaces_rows_verifier_signoff"
        }
      },
      "arrayElement": true,
      "table": "workspace_profiles"
    },
    "table": "workspaces"
  },
  "certrace:installations": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "id": {
          "kind": "string"
        },
        "name": {
          "kind": "string"
        },
        "nameLocal": {
          "kind": "string"
        },
        "self": {
          "kind": "boolean"
        },
        "supplierId": {
          "kind": "string"
        },
        "role": {
          "kind": "string",
          "optional": true,
          "enum": [
            "own",
            "oem",
            "supplier"
          ]
        },
        "street": {
          "kind": "string"
        },
        "economicActivity": {
          "kind": "string"
        },
        "postcode": {
          "kind": "string"
        },
        "poBox": {
          "kind": "string"
        },
        "city": {
          "kind": "string"
        },
        "country": {
          "kind": "string"
        },
        "unlocode": {
          "kind": "string"
        },
        "lat": {
          "kind": "string"
        },
        "lng": {
          "kind": "string"
        },
        "contactName": {
          "kind": "string"
        },
        "contactEmail": {
          "kind": "string"
        },
        "contactPhone": {
          "kind": "string"
        },
        "otherGoods": {
          "kind": "array",
          "item": {
            "kind": "object",
            "fields": {
              "name": {
                "kind": "string"
              },
              "description": {
                "kind": "string",
                "optional": true
              }
            },
            "arrayElement": true,
            "table": "installations_rows_other_goods_rows"
          },
          "table": "installations_rows_other_goods"
        },
        "operatorName": {
          "kind": "string"
        },
        "operatorRegistrationNumber": {
          "kind": "string"
        },
        "operatorAddress": {
          "kind": "string"
        },
        "registryId": {
          "kind": "string"
        },
        "monitoring": {
          "kind": "object",
          "fields": {
            "nonCbamProcesses": {
              "kind": "string"
            },
            "topFuels": {
              "kind": "string"
            },
            "topMaterials": {
              "kind": "string"
            },
            "cems": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "cemsDetail": {
              "kind": "string"
            },
            "zeroRatedFuels": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "zeroRatedDetail": {
              "kind": "string"
            },
            "heatTrade": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "heatDetail": {
              "kind": "string"
            },
            "electricityMixed": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "electricityDetail": {
              "kind": "string"
            },
            "onsiteElectricity": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "onsiteElectricityDetail": {
              "kind": "string"
            },
            "wasteGases": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "wasteGasDetail": {
              "kind": "string"
            },
            "co2Transfer": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            },
            "co2TransferDetail": {
              "kind": "string"
            },
            "electricityToEu": {
              "kind": "string",
              "enum": [
                "",
                "yes",
                "no"
              ]
            }
          },
          "table": "installations_rows_monitoring"
        },
        "createdAt": {
          "kind": "string"
        }
      },
      "arrayElement": true,
      "table": "installation_profiles"
    },
    "table": "installations"
  },
  "certrace:supplier-companies": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "id": {
          "kind": "string"
        },
        "name": {
          "kind": "string"
        },
        "country": {
          "kind": "string"
        },
        "contactName": {
          "kind": "string"
        },
        "contactEmail": {
          "kind": "string"
        },
        "contactPhone": {
          "kind": "string"
        },
        "createdAt": {
          "kind": "string"
        }
      },
      "arrayElement": true,
      "table": "supplier_company_profiles"
    },
    "table": "supplier_companies"
  },
  "certrace:workspace-drafts": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "id": {
          "kind": "string"
        },
        "updatedAt": {
          "kind": "number",
          "min": 0
        },
        "snapshot": {
          "kind": "object",
          "fields": {
            "installationId": {
              "kind": "string"
            },
            "installationName": {
              "kind": "string"
            },
            "isSelf": {
              "kind": "boolean"
            },
            "supplierChoice": {
              "kind": "string",
              "enum": [
                "",
                "self",
                "other"
              ]
            },
            "supplierId": {
              "kind": "string",
              "optional": true
            },
            "productId": {
              "kind": "string"
            },
            "route": {
              "kind": "string"
            },
            "country": {
              "kind": "string",
              "optional": true
            },
            "year": {
              "kind": "number",
              "min": 0
            },
            "dueDay": {
              "kind": "number",
              "optional": true,
              "min": 0
            },
            "requestDay": {
              "kind": "number",
              "optional": true,
              "min": 0
            },
            "dueAfterDays": {
              "kind": "number",
              "optional": true,
              "min": 0
            },
            "step": {
              "kind": "number",
              "min": 0
            }
          },
          "table": "workspace_drafts_rows_snapshot"
        },
        "display": {
          "kind": "object",
          "fields": {
            "installationName": {
              "kind": "string"
            },
            "productName": {
              "kind": "string"
            },
            "year": {
              "kind": "number",
              "min": 0
            },
            "step": {
              "kind": "number",
              "min": 0
            },
            "stepCount": {
              "kind": "number",
              "min": 0
            }
          },
          "table": "workspace_drafts_rows_display"
        }
      },
      "arrayElement": true,
      "table": "workspace_drafts_rows"
    },
    "table": "workspace_drafts"
  },
  "certrace:workspace-mmd-draft": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "inputPlan": {
          "kind": "object",
          "fields": {
            "operatorName": {
              "kind": "string"
            },
            "operatorRegistration": {
              "kind": "string"
            },
            "operatorAddress": {
              "kind": "string"
            },
            "registryId": {
              "kind": "string"
            },
            "monitoringStart": {
              "kind": "string"
            },
            "processes": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "name": {
                    "kind": "string"
                  },
                  "routes": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "process_routes"
                    },
                    "table": "workspace_mmd_draft_rows_input_plan_processes_rows_routes"
                  },
                  "steps": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "process_steps"
                    },
                    "table": "workspace_mmd_draft_rows_input_plan_processes_rows_steps"
                  },
                  "products": {
                    "kind": "array",
                    "item": {
                      "kind": "object",
                      "fields": {
                        "id": {
                          "kind": "string"
                        },
                        "name": {
                          "kind": "string"
                        },
                        "cnCode": {
                          "kind": "string"
                        },
                        "description": {
                          "kind": "string"
                        },
                        "unit": {
                          "kind": "string",
                          "enum": [
                            "t",
                            "kWh",
                            "kg N",
                            "t clinker"
                          ]
                        },
                        "benchmark": {
                          "kind": "string"
                        }
                      },
                      "arrayElement": true,
                      "table": "report_goods"
                    },
                    "table": "workspace_mmd_draft_rows_input_plan_processes_row_b73e345b"
                  },
                  "precursorIds": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "workspace_mmd_draft_rows_input_plan_processes_row_efbfb89e"
                    },
                    "table": "workspace_mmd_draft_rows_input_plan_processes_row_68b45ba8"
                  },
                  "otherInputs": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "workspace_mmd_draft_rows_input_plan_processes_row_3c2afe84"
                    },
                    "table": "workspace_mmd_draft_rows_input_plan_processes_row_df8dfaeb"
                  }
                },
                "arrayElement": true,
                "table": "production_processes"
              },
              "table": "workspace_mmd_draft_rows_input_plan_processes"
            },
            "additionalFlows": {
              "kind": "array",
              "item": {
                "kind": "string",
                "arrayElement": true,
                "table": "workspace_mmd_draft_rows_input_plan_additional_flows_rows"
              },
              "table": "workspace_mmd_draft_rows_input_plan_additional_flows"
            }
          },
          "optional": true,
          "table": "operator_reporting_plans"
        },
        "noCombustion": {
          "kind": "boolean",
          "optional": true
        },
        "diagramFileId": {
          "kind": "string",
          "optional": true
        },
        "boundaryDescription": {
          "kind": "string"
        },
        "processesIncluded": {
          "kind": "array",
          "item": {
            "kind": "string",
            "arrayElement": true,
            "table": "workspace_mmd_draft_rows_processes_included_rows"
          },
          "table": "workspace_mmd_draft_rows_processes_included"
        },
        "exclusions": {
          "kind": "array",
          "item": {
            "kind": "object",
            "fields": {
              "id": {
                "kind": "string"
              },
              "process": {
                "kind": "string"
              },
              "ground": {
                "kind": "string",
                "enum": [
                  "other",
                  "not_production_process",
                  "separately_metered",
                  "outsourced",
                  "non_cbam_good",
                  "de_minimis"
                ]
              },
              "groundOther": {
                "kind": "string"
              },
              "note": {
                "kind": "string"
              }
            },
            "arrayElement": true,
            "table": "workspace_mmd_draft_rows_exclusions_rows"
          },
          "table": "workspace_mmd_draft_rows_exclusions"
        },
        "periodStart": {
          "kind": "string"
        },
        "periodEnd": {
          "kind": "string"
        },
        "directMethod": {
          "kind": "string",
          "enum": [
            "calculation",
            "measurement"
          ]
        },
        "fuelTypeIds": {
          "kind": "array",
          "item": {
            "kind": "string",
            "arrayElement": true,
            "table": "workspace_mmd_draft_rows_fuel_type_ids_rows"
          },
          "table": "workspace_mmd_draft_rows_fuel_type_ids"
        },
        "fuelTypesOther": {
          "kind": "string"
        },
        "electricitySupply": {
          "kind": "string"
        },
        "electricitySupplyOther": {
          "kind": "string"
        },
        "electricityMeteringPoint": {
          "kind": "string"
        },
        "ownGenerationFuelDeclared": {
          "kind": "boolean"
        },
        "fuelInstruments": {
          "kind": "array",
          "item": {
            "kind": "object",
            "fields": {
              "id": {
                "kind": "string"
              },
              "parameter": {
                "kind": "string"
              },
              "instrument": {
                "kind": "string"
              },
              "readingFrequency": {
                "kind": "string"
              },
              "readingFrequencyOther": {
                "kind": "string",
                "optional": true
              },
              "lastCalibration": {
                "kind": "string"
              },
              "factorSource": {
                "kind": "string",
                "enum": [
                  "eu_standard",
                  "lab_analysis",
                  "national_inventory",
                  "supplier_declared"
                ]
              },
              "directMethod": {
                "kind": "string",
                "enum": [
                  "calculation",
                  "measurement"
                ]
              },
              "cemsCalibrationRef": {
                "kind": "string",
                "optional": true
              },
              "measurementPointLocation": {
                "kind": "string",
                "optional": true
              },
              "location": {
                "kind": "string",
                "optional": true
              },
              "uncertaintyPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              }
            },
            "arrayElement": true,
            "table": "fuel_instruments"
          },
          "table": "workspace_mmd_draft_rows_fuel_instruments"
        },
        "electricityInstruments": {
          "kind": "array",
          "item": {
            "kind": "object",
            "fields": {
              "id": {
                "kind": "string"
              },
              "parameter": {
                "kind": "string"
              },
              "instrument": {
                "kind": "string"
              },
              "readingFrequency": {
                "kind": "string"
              },
              "readingFrequencyOther": {
                "kind": "string",
                "optional": true
              },
              "lastCalibration": {
                "kind": "string"
              },
              "factorSource": {
                "kind": "string",
                "enum": [
                  "eu_standard",
                  "lab_analysis",
                  "national_inventory",
                  "supplier_declared"
                ]
              },
              "directMethod": {
                "kind": "string",
                "enum": [
                  "calculation",
                  "measurement"
                ]
              },
              "cemsCalibrationRef": {
                "kind": "string",
                "optional": true
              },
              "measurementPointLocation": {
                "kind": "string",
                "optional": true
              },
              "location": {
                "kind": "string",
                "optional": true
              },
              "uncertaintyPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              }
            },
            "arrayElement": true,
            "table": "electricity_instruments"
          },
          "table": "workspace_mmd_draft_rows_electricity_instruments"
        },
        "dataGaps": {
          "kind": "array",
          "item": {
            "kind": "object",
            "fields": {
              "id": {
                "kind": "string"
              },
              "periodStart": {
                "kind": "string"
              },
              "periodEnd": {
                "kind": "string"
              },
              "reason": {
                "kind": "string"
              },
              "estimationMethod": {
                "kind": "string"
              },
              "estimatedTCO2e": {
                "kind": "number",
                "min": 0
              },
              "reviewerName": {
                "kind": "string"
              },
              "gapDate": {
                "kind": "string"
              }
            },
            "arrayElement": true,
            "table": "data_gaps"
          },
          "table": "workspace_mmd_draft_rows_data_gaps"
        },
        "qualityAssurance": {
          "kind": "string",
          "enum": [
            "third_party_verification",
            "internal_audits",
            "four_eyes",
            "none"
          ]
        },
        "reviewerName": {
          "kind": "string"
        },
        "reviewFrequency": {
          "kind": "string"
        },
        "diagramFileName": {
          "kind": "string",
          "nullable": true
        },
        "diagramDataUrl": {
          "kind": "string",
          "optional": true
        },
        "diagramCovers": {
          "kind": "array",
          "item": {
            "kind": "number",
            "min": 0,
            "arrayElement": true,
            "table": "workspace_mmd_draft_rows_diagram_covers_rows"
          },
          "table": "workspace_mmd_draft_rows_diagram_covers"
        },
        "sectorParameters": {
          "kind": "object",
          "fields": {
            "reducingAgent": {
              "kind": "string",
              "enum": [
                "",
                "other",
                "none",
                "coke",
                "natural_gas",
                "hydrogen",
                "coal"
              ]
            },
            "reducingAgentOther": {
              "kind": "string"
            },
            "mnPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "crPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "niPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "otherAlloyingPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "otherMaterialsPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "steelMillId": {
              "kind": "string"
            },
            "carbonPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "scrapTonnesPerTonneSteel": {
              "kind": "number",
              "optional": true,
              "min": 0
            },
            "preConsumerScrapPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            },
            "scrapTonnesPerTonneAluminium": {
              "kind": "number",
              "optional": true,
              "min": 0
            },
            "nonAluminiumPct": {
              "kind": "number",
              "optional": true,
              "min": 0,
              "max": 100
            }
          },
          "table": "steel_parameters"
        },
        "pfcMethodology": {
          "kind": "object",
          "fields": {
            "method": {
              "kind": "string",
              "enum": [
                "",
                "slope",
                "overvoltage"
              ]
            },
            "technology": {
              "kind": "string"
            },
            "factorSource": {
              "kind": "string",
              "enum": [
                "",
                "eu_table",
                "own_measurement"
              ]
            },
            "measuredOn": {
              "kind": "string"
            },
            "collectionBasis": {
              "kind": "string"
            }
          },
          "optional": true,
          "table": "workspace_mmd_draft_rows_pfc_methodology"
        },
        "samplingPlan": {
          "kind": "string"
        },
        "controlSystem": {
          "kind": "object",
          "fields": {
            "riskAssessment": {
              "kind": "string"
            },
            "itSystems": {
              "kind": "string"
            },
            "segregationOfDuties": {
              "kind": "string"
            },
            "corrections": {
              "kind": "string"
            },
            "outsourced": {
              "kind": "string"
            },
            "records": {
              "kind": "string"
            }
          },
          "table": "workspace_mmd_draft_rows_control_system"
        }
      },
      "scopeKey": true,
      "table": "monitoring_plans"
    },
    "table": "workspace_mmd_draft"
  },
  "certrace:workspace-mmd-versions": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "id": {
            "kind": "string"
          },
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "n": {
            "kind": "number",
            "min": 0
          },
          "finalisedAt": {
            "kind": "string"
          },
          "author": {
            "kind": "string"
          },
          "content": {
            "kind": "object",
            "fields": {
              "inputPlan": {
                "kind": "object",
                "fields": {
                  "operatorName": {
                    "kind": "string"
                  },
                  "operatorRegistration": {
                    "kind": "string"
                  },
                  "operatorAddress": {
                    "kind": "string"
                  },
                  "registryId": {
                    "kind": "string"
                  },
                  "monitoringStart": {
                    "kind": "string"
                  },
                  "processes": {
                    "kind": "array",
                    "item": {
                      "kind": "object",
                      "fields": {
                        "id": {
                          "kind": "string"
                        },
                        "name": {
                          "kind": "string"
                        },
                        "routes": {
                          "kind": "array",
                          "item": {
                            "kind": "string",
                            "arrayElement": true,
                            "table": "workspace_mmd_versions_rows_rows_content_input_pl_724fed64"
                          },
                          "table": "workspace_mmd_versions_rows_rows_content_input_pl_0df64e37"
                        },
                        "steps": {
                          "kind": "array",
                          "item": {
                            "kind": "string",
                            "arrayElement": true,
                            "table": "workspace_mmd_versions_rows_rows_content_input_pl_49b849be"
                          },
                          "table": "workspace_mmd_versions_rows_rows_content_input_pl_c16e3476"
                        },
                        "products": {
                          "kind": "array",
                          "item": {
                            "kind": "object",
                            "fields": {
                              "id": {
                                "kind": "string"
                              },
                              "name": {
                                "kind": "string"
                              },
                              "cnCode": {
                                "kind": "string"
                              },
                              "description": {
                                "kind": "string"
                              },
                              "unit": {
                                "kind": "string",
                                "enum": [
                                  "t",
                                  "kWh",
                                  "kg N",
                                  "t clinker"
                                ]
                              },
                              "benchmark": {
                                "kind": "string"
                              }
                            },
                            "arrayElement": true,
                            "table": "workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb"
                          },
                          "table": "workspace_mmd_versions_rows_rows_content_input_pl_28fb5463"
                        },
                        "precursorIds": {
                          "kind": "array",
                          "item": {
                            "kind": "string",
                            "arrayElement": true,
                            "table": "workspace_mmd_versions_rows_rows_content_input_pl_5fd2b359"
                          },
                          "table": "workspace_mmd_versions_rows_rows_content_input_pl_cf73d1f3"
                        },
                        "otherInputs": {
                          "kind": "array",
                          "item": {
                            "kind": "string",
                            "arrayElement": true,
                            "table": "workspace_mmd_versions_rows_rows_content_input_pl_20877ba7"
                          },
                          "table": "workspace_mmd_versions_rows_rows_content_input_pl_05b6c118"
                        }
                      },
                      "arrayElement": true,
                      "table": "workspace_mmd_versions_rows_rows_content_input_pl_2efa3d4f"
                    },
                    "table": "workspace_mmd_versions_rows_rows_content_input_pl_96da24ad"
                  },
                  "additionalFlows": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "workspace_mmd_versions_rows_rows_content_input_pl_638d945a"
                    },
                    "table": "workspace_mmd_versions_rows_rows_content_input_pl_b2710d03"
                  }
                },
                "optional": true,
                "table": "workspace_mmd_versions_rows_rows_content_input_plan"
              },
              "noCombustion": {
                "kind": "boolean",
                "optional": true
              },
              "diagramFileId": {
                "kind": "string",
                "optional": true
              },
              "boundaryDescription": {
                "kind": "string"
              },
              "processesIncluded": {
                "kind": "array",
                "item": {
                  "kind": "string",
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_processe_bb0bb544"
                },
                "table": "workspace_mmd_versions_rows_rows_content_processe_80cdb87f"
              },
              "exclusions": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "id": {
                      "kind": "string"
                    },
                    "process": {
                      "kind": "string"
                    },
                    "ground": {
                      "kind": "string",
                      "enum": [
                        "other",
                        "not_production_process",
                        "separately_metered",
                        "outsourced",
                        "non_cbam_good",
                        "de_minimis"
                      ]
                    },
                    "groundOther": {
                      "kind": "string"
                    },
                    "note": {
                      "kind": "string"
                    }
                  },
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_exclusions_rows"
                },
                "table": "workspace_mmd_versions_rows_rows_content_exclusions"
              },
              "periodStart": {
                "kind": "string"
              },
              "periodEnd": {
                "kind": "string"
              },
              "directMethod": {
                "kind": "string",
                "enum": [
                  "calculation",
                  "measurement"
                ]
              },
              "fuelTypeIds": {
                "kind": "array",
                "item": {
                  "kind": "string",
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_fuel_typ_cd68406e"
                },
                "table": "workspace_mmd_versions_rows_rows_content_fuel_type_ids"
              },
              "fuelTypesOther": {
                "kind": "string"
              },
              "electricitySupply": {
                "kind": "string"
              },
              "electricitySupplyOther": {
                "kind": "string"
              },
              "electricityMeteringPoint": {
                "kind": "string"
              },
              "ownGenerationFuelDeclared": {
                "kind": "boolean"
              },
              "fuelInstruments": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "id": {
                      "kind": "string"
                    },
                    "parameter": {
                      "kind": "string"
                    },
                    "instrument": {
                      "kind": "string"
                    },
                    "readingFrequency": {
                      "kind": "string"
                    },
                    "readingFrequencyOther": {
                      "kind": "string",
                      "optional": true
                    },
                    "lastCalibration": {
                      "kind": "string"
                    },
                    "factorSource": {
                      "kind": "string",
                      "enum": [
                        "eu_standard",
                        "lab_analysis",
                        "national_inventory",
                        "supplier_declared"
                      ]
                    },
                    "directMethod": {
                      "kind": "string",
                      "enum": [
                        "calculation",
                        "measurement"
                      ]
                    },
                    "cemsCalibrationRef": {
                      "kind": "string",
                      "optional": true
                    },
                    "measurementPointLocation": {
                      "kind": "string",
                      "optional": true
                    },
                    "location": {
                      "kind": "string",
                      "optional": true
                    },
                    "uncertaintyPct": {
                      "kind": "number",
                      "optional": true,
                      "min": 0,
                      "max": 100
                    }
                  },
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_fuel_ins_2b1d54a6"
                },
                "table": "workspace_mmd_versions_rows_rows_content_fuel_instruments"
              },
              "electricityInstruments": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "id": {
                      "kind": "string"
                    },
                    "parameter": {
                      "kind": "string"
                    },
                    "instrument": {
                      "kind": "string"
                    },
                    "readingFrequency": {
                      "kind": "string"
                    },
                    "readingFrequencyOther": {
                      "kind": "string",
                      "optional": true
                    },
                    "lastCalibration": {
                      "kind": "string"
                    },
                    "factorSource": {
                      "kind": "string",
                      "enum": [
                        "eu_standard",
                        "lab_analysis",
                        "national_inventory",
                        "supplier_declared"
                      ]
                    },
                    "directMethod": {
                      "kind": "string",
                      "enum": [
                        "calculation",
                        "measurement"
                      ]
                    },
                    "cemsCalibrationRef": {
                      "kind": "string",
                      "optional": true
                    },
                    "measurementPointLocation": {
                      "kind": "string",
                      "optional": true
                    },
                    "location": {
                      "kind": "string",
                      "optional": true
                    },
                    "uncertaintyPct": {
                      "kind": "number",
                      "optional": true,
                      "min": 0,
                      "max": 100
                    }
                  },
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_electric_900d1b50"
                },
                "table": "workspace_mmd_versions_rows_rows_content_electric_e32ef46e"
              },
              "dataGaps": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "id": {
                      "kind": "string"
                    },
                    "periodStart": {
                      "kind": "string"
                    },
                    "periodEnd": {
                      "kind": "string"
                    },
                    "reason": {
                      "kind": "string"
                    },
                    "estimationMethod": {
                      "kind": "string"
                    },
                    "estimatedTCO2e": {
                      "kind": "number",
                      "min": 0
                    },
                    "reviewerName": {
                      "kind": "string"
                    },
                    "gapDate": {
                      "kind": "string"
                    }
                  },
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_data_gaps_rows"
                },
                "table": "workspace_mmd_versions_rows_rows_content_data_gaps"
              },
              "qualityAssurance": {
                "kind": "string",
                "enum": [
                  "third_party_verification",
                  "internal_audits",
                  "four_eyes",
                  "none"
                ]
              },
              "reviewerName": {
                "kind": "string"
              },
              "reviewFrequency": {
                "kind": "string"
              },
              "diagramFileName": {
                "kind": "string",
                "nullable": true
              },
              "diagramDataUrl": {
                "kind": "string",
                "optional": true
              },
              "diagramCovers": {
                "kind": "array",
                "item": {
                  "kind": "number",
                  "min": 0,
                  "arrayElement": true,
                  "table": "workspace_mmd_versions_rows_rows_content_diagram__3f492851"
                },
                "table": "workspace_mmd_versions_rows_rows_content_diagram_covers"
              },
              "sectorParameters": {
                "kind": "object",
                "fields": {
                  "reducingAgent": {
                    "kind": "string",
                    "enum": [
                      "",
                      "other",
                      "none",
                      "coke",
                      "natural_gas",
                      "hydrogen",
                      "coal"
                    ]
                  },
                  "reducingAgentOther": {
                    "kind": "string"
                  },
                  "mnPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "crPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "niPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "otherAlloyingPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "otherMaterialsPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "steelMillId": {
                    "kind": "string"
                  },
                  "carbonPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "scrapTonnesPerTonneSteel": {
                    "kind": "number",
                    "optional": true,
                    "min": 0
                  },
                  "preConsumerScrapPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  },
                  "scrapTonnesPerTonneAluminium": {
                    "kind": "number",
                    "optional": true,
                    "min": 0
                  },
                  "nonAluminiumPct": {
                    "kind": "number",
                    "optional": true,
                    "min": 0,
                    "max": 100
                  }
                },
                "table": "workspace_mmd_versions_rows_rows_content_sector_parameters"
              },
              "pfcMethodology": {
                "kind": "object",
                "fields": {
                  "method": {
                    "kind": "string",
                    "enum": [
                      "",
                      "slope",
                      "overvoltage"
                    ]
                  },
                  "technology": {
                    "kind": "string"
                  },
                  "factorSource": {
                    "kind": "string",
                    "enum": [
                      "",
                      "eu_table",
                      "own_measurement"
                    ]
                  },
                  "measuredOn": {
                    "kind": "string"
                  },
                  "collectionBasis": {
                    "kind": "string"
                  }
                },
                "optional": true,
                "table": "workspace_mmd_versions_rows_rows_content_pfc_methodology"
              },
              "samplingPlan": {
                "kind": "string"
              },
              "controlSystem": {
                "kind": "object",
                "fields": {
                  "riskAssessment": {
                    "kind": "string"
                  },
                  "itSystems": {
                    "kind": "string"
                  },
                  "segregationOfDuties": {
                    "kind": "string"
                  },
                  "corrections": {
                    "kind": "string"
                  },
                  "outsourced": {
                    "kind": "string"
                  },
                  "records": {
                    "kind": "string"
                  }
                },
                "table": "workspace_mmd_versions_rows_rows_content_control_system"
              }
            },
            "table": "workspace_mmd_versions_rows_rows_content"
          },
          "periodStart": {
            "kind": "string"
          },
          "periodEnd": {
            "kind": "string"
          }
        },
        "arrayElement": true,
        "table": "workspace_mmd_versions_rows_rows"
      },
      "scopeKey": true,
      "table": "workspace_mmd_versions_rows"
    },
    "table": "workspace_mmd_versions"
  },
  "certrace:monthly-data": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "zeroProductionConfirmed": {
            "kind": "boolean",
            "optional": true
          },
          "noElectricityConfirmed": {
            "kind": "boolean",
            "optional": true
          },
          "noFuelConfirmed": {
            "kind": "boolean",
            "optional": true
          },
          "activityNote": {
            "kind": "string",
            "optional": true
          },
          "outputQuantities": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "processId": {
                  "kind": "string"
                },
                "productId": {
                  "kind": "string"
                },
                "route": {
                  "kind": "string"
                },
                "quantity": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "tonnes": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "production_outputs"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_output_quantities"
          },
          "otherFlows": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "kind": {
                  "kind": "string"
                },
                "processId": {
                  "kind": "string"
                },
                "quantity": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "unit": {
                  "kind": "string"
                },
                "counterpart": {
                  "kind": "string"
                },
                "basis": {
                  "kind": "string"
                }
              },
              "arrayElement": true,
              "table": "transfer_readings"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_other_flows"
          },
          "id": {
            "kind": "string"
          },
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "month": {
            "kind": "string"
          },
          "productionTonnes": {
            "kind": "number",
            "min": 0
          },
          "fuels": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "deliveredQuantity": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "id": {
                  "kind": "string"
                },
                "fuelType": {
                  "kind": "string"
                },
                "fuelTypeOther": {
                  "kind": "string",
                  "optional": true
                },
                "quantity": {
                  "kind": "number",
                  "min": 0
                },
                "unit": {
                  "kind": "string",
                  "enum": [
                    "t",
                    "m3",
                    "kg",
                    "l",
                    "GJ"
                  ]
                },
                "ncvMjPerUnit": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "efTco2PerGj": {
                  "kind": "number",
                  "min": 0
                },
                "oxidationFactor": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 1
                },
                "oxidationFactorSource": {
                  "kind": "string",
                  "optional": true,
                  "enum": [
                    "conservative_default",
                    "measured"
                  ]
                },
                "cAsh": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "cTotal": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "biomassFraction": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 1
                },
                "biomassEvidenced": {
                  "kind": "boolean",
                  "optional": true
                },
                "factorSource": {
                  "kind": "string",
                  "enum": [
                    "eu_standard",
                    "lab_analysis",
                    "national_inventory",
                    "supplier_specific"
                  ]
                },
                "usedForSelfGeneratedElectricity": {
                  "kind": "boolean",
                  "optional": true
                },
                "stock": {
                  "kind": "object",
                  "fields": {
                    "delivered": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "opening": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "closing": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    }
                  },
                  "optional": true,
                  "table": "monthly_data_rows_rows_fuels_rows_stock"
                },
                "shared": {
                  "kind": "object",
                  "fields": {
                    "meter": {
                      "kind": "string"
                    },
                    "reading": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "key": {
                      "kind": "string",
                      "enum": [
                        "production",
                        "energy",
                        "manual"
                      ]
                    },
                    "thisValue": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "totalValue": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "manualPct": {
                      "kind": "number",
                      "optional": true,
                      "min": 0,
                      "max": 100
                    }
                  },
                  "optional": true,
                  "table": "monthly_data_rows_rows_fuels_rows_shared"
                }
              },
              "arrayElement": true,
              "table": "fuel_readings"
            },
            "table": "monthly_data_rows_rows_fuels"
          },
          "processEmissionsTco2": {
            "kind": "number",
            "min": 0
          },
          "processEmissionsBasis": {
            "kind": "string",
            "optional": true
          },
          "processEmissionEntries": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "method": {
                  "kind": "string",
                  "enum": [
                    "standard",
                    "mass_balance"
                  ]
                },
                "materialId": {
                  "kind": "string"
                },
                "quantityT": {
                  "kind": "number"
                },
                "conversionFactor": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 1
                },
                "note": {
                  "kind": "string",
                  "optional": true
                },
                "specKey": {
                  "kind": "string",
                  "optional": true
                },
                "stock": {
                  "kind": "object",
                  "fields": {
                    "delivered": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "opening": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "closing": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    }
                  },
                  "optional": true,
                  "table": "monthly_data_rows_rows_process_emission_entries_rows_stock"
                },
                "carbonContent": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "label": {
                  "kind": "string",
                  "optional": true
                },
                "preConsumerT": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "material_readings"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_process_emission_entries"
          },
          "electricityMwh": {
            "kind": "number",
            "min": 0
          },
          "electricityFactorTco2PerMwh": {
            "kind": "number",
            "min": 0
          },
          "electricityFactorSource": {
            "kind": "string",
            "enum": [
              "grid_default",
              "ppa",
              "self_generated",
              "direct_technical_link"
            ]
          },
          "selfGeneratedSharePct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "electricitySources": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "sourceType": {
                  "kind": "string",
                  "enum": [
                    "grid_default",
                    "ppa",
                    "self_generated",
                    "direct_technical_link"
                  ]
                },
                "mwh": {
                  "kind": "number",
                  "min": 0
                },
                "factorTco2PerMwh": {
                  "kind": "number",
                  "nullable": true,
                  "min": 0
                },
                "country": {
                  "kind": "string",
                  "optional": true
                },
                "supplierInstallation": {
                  "kind": "string",
                  "optional": true
                },
                "shared": {
                  "kind": "object",
                  "fields": {
                    "meter": {
                      "kind": "string"
                    },
                    "reading": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "key": {
                      "kind": "string",
                      "enum": [
                        "production",
                        "energy",
                        "manual"
                      ]
                    },
                    "thisValue": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "totalValue": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "manualPct": {
                      "kind": "number",
                      "optional": true,
                      "min": 0,
                      "max": 100
                    }
                  },
                  "optional": true,
                  "table": "monthly_data_rows_rows_electricity_sources_rows_shared"
                }
              },
              "arrayElement": true,
              "table": "electricity_readings"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_electricity_sources"
          },
          "flueGasCleaningEmissionsTco2": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "electricityInstallationTotalMwh": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "nonCbamGoods": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "name": {
                  "kind": "string"
                },
                "tonnes": {
                  "kind": "number",
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "monthly_data_rows_rows_non_cbam_goods_rows"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_non_cbam_goods"
          },
          "measuredEmissions": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "source": {
                  "kind": "string"
                },
                "gas": {
                  "kind": "string",
                  "enum": [
                    "co2",
                    "n2o",
                    "cf4",
                    "c2f6"
                  ]
                },
                "tCO2e": {
                  "kind": "number",
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "monthly_data_rows_rows_measured_emissions_rows"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_measured_emissions"
          },
          "co2ReceivedT": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "co2TransferredOutT": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "heatGj": {
            "kind": "object",
            "fields": {
              "imported": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "produced": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "consumed": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "exported": {
                "kind": "number",
                "optional": true,
                "min": 0
              }
            },
            "optional": true,
            "table": "monthly_data_rows_rows_heat_gj"
          },
          "wasteGasGj": {
            "kind": "object",
            "fields": {
              "imported": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "produced": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "consumed": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "exported": {
                "kind": "number",
                "optional": true,
                "min": 0
              }
            },
            "optional": true,
            "table": "monthly_data_rows_rows_waste_gas_gj"
          },
          "electricityExportedMwh": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "pfc": {
            "kind": "object",
            "fields": {
              "method": {
                "kind": "string",
                "enum": [
                  "slope",
                  "overvoltage"
                ]
              },
              "technology": {
                "kind": "string"
              },
              "primaryAlT": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "aem": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "aeo": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "ce": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "ownCf4Factor": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "ownC2f6Fraction": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 1
              },
              "collectionEfficiencyPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "potlines": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "id": {
                      "kind": "string"
                    },
                    "label": {
                      "kind": "string"
                    },
                    "technology": {
                      "kind": "string"
                    },
                    "sharePct": {
                      "kind": "number",
                      "optional": true,
                      "min": 0,
                      "max": 100
                    },
                    "aePerCellDay": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "aeMinutes": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "cellDays": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "aeo": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "ce": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    }
                  },
                  "arrayElement": true,
                  "table": "monthly_data_rows_rows_pfc_potlines_rows"
                },
                "optional": true,
                "table": "monthly_data_rows_rows_pfc_potlines"
              }
            },
            "optional": true,
            "table": "monthly_data_rows_rows_pfc"
          },
          "scrap": {
            "kind": "object",
            "fields": {
              "tonnes": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "preConsumerT": {
                "kind": "number",
                "optional": true,
                "min": 0
              }
            },
            "optional": true,
            "table": "monthly_data_rows_rows_scrap"
          },
          "wasteGases": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "gas": {
                  "kind": "string",
                  "enum": [
                    "other",
                    "bfg",
                    "cog",
                    "bofg"
                  ]
                },
                "label": {
                  "kind": "string",
                  "optional": true
                },
                "flow": {
                  "kind": "string",
                  "enum": [
                    "produced",
                    "consumed",
                    "imported",
                    "exported"
                  ]
                },
                "volumeNm3": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "ncvMjPerNm3": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "coPct": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 100
                },
                "co2Pct": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 100
                },
                "h2Pct": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 100
                },
                "ch4Pct": {
                  "kind": "number",
                  "optional": true,
                  "min": 0,
                  "max": 100
                }
              },
              "arrayElement": true,
              "table": "monthly_data_rows_rows_waste_gases_rows"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_waste_gases"
          },
          "scrapDeliveries": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "id": {
                  "kind": "string"
                },
                "material": {
                  "kind": "string",
                  "enum": [
                    "steel_scrap",
                    "iron_scrap",
                    "aluminium_scrap"
                  ]
                },
                "supplier": {
                  "kind": "string"
                },
                "grade": {
                  "kind": "string"
                },
                "origin": {
                  "kind": "string",
                  "enum": [
                    "pre_consumer",
                    "post_consumer"
                  ]
                },
                "tonnes": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "monthly_data_rows_rows_scrap_deliveries_rows"
            },
            "optional": true,
            "table": "monthly_data_rows_rows_scrap_deliveries"
          },
          "composition": {
            "kind": "object",
            "fields": {
              "mnPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "crPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "niPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "otherPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "basis": {
                "kind": "string",
                "optional": true
              }
            },
            "optional": true,
            "table": "monthly_data_rows_rows_composition"
          },
          "status": {
            "kind": "string",
            "enum": [
              "empty",
              "draft",
              "submitted",
              "reviewed"
            ]
          },
          "submittedAt": {
            "kind": "string",
            "optional": true
          },
          "submittedBy": {
            "kind": "string",
            "optional": true
          },
          "notes": {
            "kind": "string",
            "optional": true
          },
          "notManufactured": {
            "kind": "boolean",
            "optional": true
          }
        },
        "arrayElement": true,
        "table": "report_months"
      },
      "scopeKey": true,
      "table": "monthly_data_rows"
    },
    "table": "monthly_data"
  },
  "certrace:precursor-suppliers": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "consumingProcessIds": {
            "kind": "array",
            "item": {
              "kind": "string",
              "arrayElement": true,
              "table": "precursor_suppliers_rows_rows_consuming_process_ids_rows"
            },
            "optional": true,
            "table": "precursor_suppliers_rows_rows_consuming_process_ids"
          },
          "consumingProductIds": {
            "kind": "array",
            "item": {
              "kind": "string",
              "arrayElement": true,
              "table": "precursor_suppliers_rows_rows_consuming_product_ids_rows"
            },
            "optional": true,
            "table": "precursor_suppliers_rows_rows_consuming_product_ids"
          },
          "autofillProvenance": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "field": {
                  "kind": "string"
                },
                "documentId": {
                  "kind": "string",
                  "optional": true
                },
                "page": {
                  "kind": "number",
                  "min": 0
                },
                "excerpt": {
                  "kind": "string"
                }
              },
              "arrayElement": true,
              "table": "precursor_suppliers_rows_rows_autofill_provenance_rows"
            },
            "optional": true,
            "table": "precursor_suppliers_rows_rows_autofill_provenance"
          },
          "emissionsInputPolicy": {
            "kind": "string",
            "optional": true,
            "enum": [
              "source_only"
            ]
          },
          "supplierResponseReceived": {
            "kind": "boolean",
            "optional": true
          },
          "supplierReportUnavailable": {
            "kind": "boolean",
            "optional": true
          },
          "defaultValueReference": {
            "kind": "string",
            "optional": true
          },
          "defaultValueChecked": {
            "kind": "boolean",
            "optional": true
          },
          "defaultValueSourceId": {
            "kind": "string",
            "optional": true
          },
          "defaultValueYear": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "verificationCoverageStart": {
            "kind": "string",
            "optional": true
          },
          "verificationCoverageEnd": {
            "kind": "string",
            "optional": true
          },
          "id": {
            "kind": "string"
          },
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "parentId": {
            "kind": "string",
            "nullable": true
          },
          "name": {
            "kind": "string"
          },
          "installationName": {
            "kind": "string"
          },
          "country": {
            "kind": "string"
          },
          "precursorName": {
            "kind": "string"
          },
          "cnCode": {
            "kind": "string"
          },
          "catalogProductId": {
            "kind": "string",
            "optional": true
          },
          "productionRoute": {
            "kind": "string"
          },
          "isScrap": {
            "kind": "boolean"
          },
          "seeTco2ePerT": {
            "kind": "number",
            "nullable": true,
            "min": 0
          },
          "specificEmbeddedDirectTco2PerT": {
            "kind": "number",
            "optional": true,
            "nullable": true,
            "min": 0
          },
          "specificEmbeddedIndirectTco2PerT": {
            "kind": "number",
            "optional": true,
            "nullable": true,
            "min": 0
          },
          "dataOrigin": {
            "kind": "string",
            "enum": [
              "supplier_verified",
              "supplier_unverified",
              "default_value"
            ]
          },
          "monthlyQuantities": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "basis": {
                  "kind": "string",
                  "optional": true,
                  "enum": [
                    "used",
                    "received"
                  ]
                },
                "receivedTonnes": {
                  "kind": "number",
                  "optional": true,
                  "min": 0
                },
                "processId": {
                  "kind": "string",
                  "optional": true
                },
                "month": {
                  "kind": "string"
                },
                "tonnes": {
                  "kind": "number",
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "precursor_suppliers_rows_rows_monthly_quantities_rows"
            },
            "table": "precursor_suppliers_rows_rows_monthly_quantities"
          },
          "smartLinkToken": {
            "kind": "string",
            "optional": true
          },
          "smartLinkSentAt": {
            "kind": "string",
            "optional": true
          },
          "smartLinkLastSentAt": {
            "kind": "string",
            "optional": true
          },
          "smartLinkOpenedAt": {
            "kind": "string",
            "optional": true
          },
          "smartLinkSubmittedAt": {
            "kind": "string",
            "optional": true
          },
          "addedBy": {
            "kind": "string",
            "optional": true,
            "enum": [
              "supplier",
              "exporter"
            ]
          },
          "isChainRoot": {
            "kind": "boolean",
            "optional": true
          },
          "pendingExporterConfirmation": {
            "kind": "boolean",
            "optional": true
          },
          "qtyPerTonneOverride": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "quantityUsedT": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "origin": {
            "kind": "string",
            "enum": [
              "same_installation",
              "purchased"
            ]
          },
          "supplierCompanyId": {
            "kind": "string",
            "optional": true
          },
          "contactName": {
            "kind": "string",
            "optional": true
          },
          "contactEmail": {
            "kind": "string",
            "optional": true
          },
          "contactPhone": {
            "kind": "string",
            "optional": true
          },
          "sourceProcessId": {
            "kind": "string",
            "optional": true
          },
          "latitude": {
            "kind": "number",
            "optional": true,
            "min": -90,
            "max": 90
          },
          "longitude": {
            "kind": "number",
            "optional": true,
            "min": -180,
            "max": 180
          },
          "installationUniqueId": {
            "kind": "string",
            "optional": true
          },
          "unlocode": {
            "kind": "string",
            "optional": true
          },
          "fullAddress": {
            "kind": "string",
            "optional": true
          },
          "reportingPeriodStart": {
            "kind": "string",
            "optional": true
          },
          "reportingPeriodEnd": {
            "kind": "string",
            "optional": true
          },
          "verificationReportFileId": {
            "kind": "string",
            "optional": true
          },
          "verifierName": {
            "kind": "string",
            "optional": true
          },
          "verifierAccreditationNumber": {
            "kind": "string",
            "optional": true
          },
          "verifierAccreditationIssuingCountry": {
            "kind": "string",
            "optional": true
          },
          "verifierAccreditationExpiryDate": {
            "kind": "string",
            "optional": true
          },
          "verificationReportIssueDate": {
            "kind": "string",
            "optional": true
          },
          "verificationReportExpiresAt": {
            "kind": "string",
            "optional": true
          },
          "verificationSectoralScope": {
            "kind": "string",
            "optional": true
          },
          "verificationChecks": {
            "kind": "object",
            "fields": {
              "accreditationValid": {
                "kind": "boolean"
              },
              "sectoralScopeMatch": {
                "kind": "boolean"
              },
              "periodCovered": {
                "kind": "boolean"
              },
              "fileIntact": {
                "kind": "boolean"
              },
              "failedReasons": {
                "kind": "array",
                "item": {
                  "kind": "string",
                  "arrayElement": true,
                  "table": "precursor_suppliers_rows_rows_verification_checks_d4531d84"
                },
                "table": "precursor_suppliers_rows_rows_verification_checks_a538276d"
              }
            },
            "optional": true,
            "table": "precursor_suppliers_rows_rows_verification_checks"
          },
          "reducingAgent": {
            "kind": "string",
            "optional": true
          },
          "mnPct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "crPct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "niPct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "otherAlloyingPct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "scrapRatioTPerT": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "preConsumerScrapPct": {
            "kind": "number",
            "optional": true,
            "min": 0,
            "max": 100
          },
          "linkedWorkspaceId": {
            "kind": "string",
            "optional": true
          },
          "valueBasis": {
            "kind": "string",
            "optional": true,
            "enum": [
              "default",
              "actual"
            ]
          },
          "originUnknown": {
            "kind": "boolean",
            "optional": true
          },
          "reportingPeriodBasis": {
            "kind": "string",
            "optional": true,
            "enum": [
              "default_period",
              "actual_time"
            ]
          },
          "alsoFromOtherInstallations": {
            "kind": "boolean",
            "optional": true
          },
          "sectorParams": {
            "kind": "map",
            "item": {
              "kind": "string",
              "table": "precursor_suppliers_rows_rows_sector_params_rows"
            },
            "optional": true,
            "table": "precursor_suppliers_rows_rows_sector_params"
          },
          "verifierAddress": {
            "kind": "string",
            "optional": true
          },
          "verifierLeadAuditor": {
            "kind": "string",
            "optional": true
          },
          "verifierAccreditationBody": {
            "kind": "string",
            "optional": true
          },
          "verifierReasonableAssurance": {
            "kind": "boolean",
            "optional": true
          }
        },
        "arrayElement": true,
        "table": "precursor_sources"
      },
      "scopeKey": true,
      "table": "precursor_suppliers_rows"
    },
    "table": "precursor_suppliers"
  },
  "certrace:workspace-evidence": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "reviewedBy": {
            "kind": "string",
            "optional": true
          },
          "reviewedAt": {
            "kind": "string",
            "optional": true
          },
          "fileHash": {
            "kind": "string",
            "optional": true
          },
          "localFileId": {
            "kind": "string",
            "optional": true
          },
          "serverFileId": {
            "kind": "string",
            "optional": true
          },
          "id": {
            "kind": "string"
          },
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "month": {
            "kind": "string",
            "optional": true
          },
          "fieldKeys": {
            "kind": "array",
            "item": {
              "kind": "string",
              "arrayElement": true,
              "table": "workspace_evidence_rows_rows_field_keys_rows"
            },
            "table": "workspace_evidence_rows_rows_field_keys"
          },
          "sourceType": {
            "kind": "string",
            "enum": [
              "other",
              "utility_invoice",
              "fuel_invoice",
              "meter_log",
              "erp_export",
              "lab_report",
              "supplier_cti",
              "mill_test_certificate",
              "calibration_record",
              "carbon_price_receipt",
              "calculation_sheet"
            ]
          },
          "fileName": {
            "kind": "string"
          },
          "fileDataUrl": {
            "kind": "string",
            "optional": true
          },
          "mimeType": {
            "kind": "string",
            "optional": true
          },
          "sizeBytes": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "extraction": {
            "kind": "object",
            "fields": {
              "status": {
                "kind": "string",
                "enum": [
                  "pending",
                  "done",
                  "failed",
                  "needs_review"
                ]
              },
              "fields": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "page": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "excerpt": {
                      "kind": "string",
                      "optional": true
                    },
                    "key": {
                      "kind": "string"
                    },
                    "value": {
                      "kind": "string"
                    },
                    "unit": {
                      "kind": "string",
                      "optional": true
                    },
                    "confidence": {
                      "kind": "number",
                      "min": 0
                    },
                    "accepted": {
                      "kind": "boolean"
                    }
                  },
                  "arrayElement": true,
                  "table": "workspace_evidence_rows_rows_extraction_fields_rows"
                },
                "table": "workspace_evidence_rows_rows_extraction_fields"
              },
              "rawSummary": {
                "kind": "string",
                "optional": true
              },
              "extractedAt": {
                "kind": "string",
                "optional": true
              },
              "error": {
                "kind": "string",
                "optional": true
              }
            },
            "optional": true,
            "table": "workspace_evidence_rows_rows_extraction"
          },
          "capturedAt": {
            "kind": "string"
          },
          "uploadedBy": {
            "kind": "string",
            "optional": true
          },
          "boundTo": {
            "kind": "string",
            "optional": true
          }
        },
        "arrayElement": true,
        "table": "evidence_items"
      },
      "scopeKey": true,
      "table": "workspace_evidence_rows"
    },
    "table": "workspace_evidence"
  },
  "certrace:pack-signoff": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "workspaceId": {
          "kind": "string",
          "derived": "workspace"
        },
        "name": {
          "kind": "string"
        },
        "jobTitle": {
          "kind": "string"
        },
        "signedAt": {
          "kind": "string"
        },
        "fingerprint": {
          "kind": "string"
        }
      },
      "scopeKey": true,
      "table": "report_signoffs"
    },
    "table": "pack_signoff"
  },
  "certrace:carbon-price": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "workspaceId": {
          "kind": "string",
          "derived": "workspace"
        },
        "amountPerTonne": {
          "kind": "number",
          "min": 0
        },
        "currency": {
          "kind": "string",
          "enum": [
            "THB",
            "EUR"
          ]
        },
        "instrument": {
          "kind": "string",
          "enum": [
            "none",
            "ets",
            "tax",
            "levy",
            "excise_embedded"
          ]
        },
        "rebates": {
          "kind": "string",
          "optional": true
        },
        "rebateAmountPerTonne": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "legalBasis": {
          "kind": "string",
          "optional": true
        },
        "certifiedBy": {
          "kind": "string",
          "optional": true
        },
        "shareOfEmissionsCovered": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "evidenceItemId": {
          "kind": "string",
          "optional": true
        },
        "recorded": {
          "kind": "boolean"
        },
        "updatedAt": {
          "kind": "string"
        }
      },
      "scopeKey": true,
      "table": "carbon_price_claims"
    },
    "table": "carbon_price"
  },
  "certrace:reporting-periods": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "installationId": {
          "kind": "string"
        },
        "year": {
          "kind": "number",
          "min": 0
        },
        "createdAt": {
          "kind": "string"
        }
      },
      "arrayElement": true,
      "table": "reporting_periods_rows"
    },
    "table": "reporting_periods"
  },
  "certrace:annual-production": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "declarationId": {
          "kind": "string"
        },
        "tonnes": {
          "kind": "number",
          "min": 0
        },
        "provenance": {
          "kind": "object",
          "fields": {
            "source": {
              "kind": "string",
              "enum": [
                "meter",
                "invoice",
                "lab",
                "erp",
                "national_dataset",
                "eu_default",
                "ASSUMPTION"
              ]
            },
            "reference": {
              "kind": "string",
              "optional": true
            },
            "evidenceFileId": {
              "kind": "string",
              "optional": true
            },
            "enteredBy": {
              "kind": "string"
            },
            "enteredAt": {
              "kind": "string"
            }
          },
          "table": "annual_production_rows_provenance"
        },
        "confirmedAt": {
          "kind": "number",
          "nullable": true,
          "min": 0
        },
        "confirmedAgainstShippedTonnes": {
          "kind": "number",
          "optional": true,
          "min": 0
        },
        "updatedAt": {
          "kind": "number",
          "min": 0
        }
      },
      "table": "annual_production_rows"
    },
    "table": "annual_production"
  },
  "certrace:monthly-requests": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "declId": {
            "kind": "string"
          },
          "supplierId": {
            "kind": "string"
          },
          "supplierName": {
            "kind": "string"
          },
          "month": {
            "kind": "string"
          },
          "token": {
            "kind": "string"
          },
          "sentAt": {
            "kind": "string",
            "optional": true
          },
          "resendCount": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "createdAt": {
            "kind": "string"
          }
        },
        "arrayElement": true,
        "table": "monthly_requests_rows_rows"
      },
      "scopeKey": true,
      "table": "monthly_requests_rows"
    },
    "table": "monthly_requests"
  },
  "certrace:month-submissions": {
    "kind": "map",
    "item": {
      "kind": "map",
      "item": {
        "kind": "object",
        "fields": {
          "workspaceId": {
            "kind": "string",
            "derived": "workspace"
          },
          "month": {
            "kind": "string"
          },
          "state": {
            "kind": "string",
            "enum": [
              "submitted",
              "open",
              "in_review",
              "confirmed",
              "changes_requested"
            ]
          },
          "attestation": {
            "kind": "object",
            "fields": {
              "fullName": {
                "kind": "string"
              },
              "role": {
                "kind": "string"
              },
              "at": {
                "kind": "string"
              },
              "warningsAcknowledged": {
                "kind": "number",
                "min": 0
              }
            },
            "nullable": true,
            "table": "month_submissions_rows_rows_attestation"
          },
          "history": {
            "kind": "array",
            "item": {
              "kind": "object",
              "fields": {
                "fullName": {
                  "kind": "string"
                },
                "role": {
                  "kind": "string"
                },
                "at": {
                  "kind": "string"
                },
                "warningsAcknowledged": {
                  "kind": "number",
                  "min": 0
                }
              },
              "arrayElement": true,
              "table": "month_submissions_rows_rows_history_rows"
            },
            "optional": true,
            "table": "month_submissions_rows_rows_history"
          },
          "submittedAt": {
            "kind": "string",
            "optional": true
          },
          "editedByExporter": {
            "kind": "boolean"
          },
          "editedAt": {
            "kind": "string",
            "optional": true
          },
          "reviewerId": {
            "kind": "string",
            "optional": true
          },
          "reviewerName": {
            "kind": "string",
            "optional": true
          },
          "confirmedBy": {
            "kind": "string",
            "optional": true
          },
          "confirmedAt": {
            "kind": "string",
            "optional": true
          },
          "revisionNote": {
            "kind": "string",
            "optional": true
          },
          "revisionAt": {
            "kind": "string",
            "optional": true
          },
          "revisionCarriedEdits": {
            "kind": "boolean",
            "optional": true
          },
          "revisionAreas": {
            "kind": "array",
            "item": {
              "kind": "string",
              "arrayElement": true,
              "table": "month_submissions_rows_rows_revision_areas_rows"
            },
            "optional": true,
            "table": "month_submissions_rows_rows_revision_areas"
          },
          "revisionRound": {
            "kind": "number",
            "optional": true,
            "min": 0
          },
          "editRequest": {
            "kind": "object",
            "fields": {
              "at": {
                "kind": "string"
              },
              "reason": {
                "kind": "string"
              },
              "state": {
                "kind": "string",
                "enum": [
                  "pending",
                  "approved",
                  "rejected"
                ]
              },
              "decidedAt": {
                "kind": "string",
                "optional": true
              },
              "decidedBy": {
                "kind": "string",
                "optional": true
              }
            },
            "optional": true,
            "table": "month_submissions_rows_rows_edit_request"
          }
        },
        "table": "month_submissions_rows_rows"
      },
      "scopeKey": true,
      "table": "month_submissions_rows"
    },
    "table": "month_submissions"
  },
  "certrace:precursor-versions": {
    "kind": "map",
    "item": {
      "kind": "array",
      "item": {
        "kind": "object",
        "fields": {
          "version": {
            "kind": "number",
            "min": 0
          },
          "savedAt": {
            "kind": "string"
          },
          "changed": {
            "kind": "array",
            "item": {
              "kind": "string",
              "arrayElement": true,
              "table": "precursor_versions_rows_rows_changed_rows"
            },
            "table": "precursor_versions_rows_rows_changed"
          },
          "snapshot": {
            "kind": "object",
            "fields": {
              "id": {
                "kind": "string"
              },
              "name": {
                "kind": "string"
              },
              "nameLocal": {
                "kind": "string",
                "optional": true
              },
              "self": {
                "kind": "boolean",
                "optional": true
              },
              "supplierId": {
                "kind": "string",
                "optional": true
              },
              "role": {
                "kind": "string",
                "optional": true,
                "enum": [
                  "own",
                  "oem",
                  "supplier"
                ]
              },
              "street": {
                "kind": "string",
                "optional": true
              },
              "economicActivity": {
                "kind": "string",
                "optional": true
              },
              "postcode": {
                "kind": "string",
                "optional": true
              },
              "poBox": {
                "kind": "string",
                "optional": true
              },
              "city": {
                "kind": "string",
                "optional": true
              },
              "country": {
                "kind": "string"
              },
              "unlocode": {
                "kind": "string",
                "optional": true
              },
              "lat": {
                "kind": "string",
                "optional": true
              },
              "lng": {
                "kind": "string",
                "optional": true
              },
              "contactName": {
                "kind": "string",
                "optional": true
              },
              "contactEmail": {
                "kind": "string",
                "optional": true
              },
              "contactPhone": {
                "kind": "string",
                "optional": true
              },
              "otherGoods": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "name": {
                      "kind": "string"
                    },
                    "description": {
                      "kind": "string",
                      "optional": true
                    }
                  },
                  "arrayElement": true,
                  "table": "precursor_versions_rows_rows_snapshot_other_goods_rows"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_other_goods"
              },
              "operatorName": {
                "kind": "string",
                "optional": true
              },
              "operatorRegistrationNumber": {
                "kind": "string",
                "optional": true
              },
              "operatorAddress": {
                "kind": "string",
                "optional": true
              },
              "registryId": {
                "kind": "string",
                "optional": true
              },
              "monitoring": {
                "kind": "object",
                "fields": {
                  "nonCbamProcesses": {
                    "kind": "string"
                  },
                  "topFuels": {
                    "kind": "string"
                  },
                  "topMaterials": {
                    "kind": "string"
                  },
                  "cems": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "cemsDetail": {
                    "kind": "string"
                  },
                  "zeroRatedFuels": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "zeroRatedDetail": {
                    "kind": "string"
                  },
                  "heatTrade": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "heatDetail": {
                    "kind": "string"
                  },
                  "electricityMixed": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "electricityDetail": {
                    "kind": "string"
                  },
                  "onsiteElectricity": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "onsiteElectricityDetail": {
                    "kind": "string"
                  },
                  "wasteGases": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "wasteGasDetail": {
                    "kind": "string"
                  },
                  "co2Transfer": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  },
                  "co2TransferDetail": {
                    "kind": "string"
                  },
                  "electricityToEu": {
                    "kind": "string",
                    "enum": [
                      "",
                      "yes",
                      "no"
                    ]
                  }
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_monitoring"
              },
              "createdAt": {
                "kind": "string",
                "optional": true
              },
              "consumingProcessIds": {
                "kind": "array",
                "item": {
                  "kind": "string",
                  "arrayElement": true,
                  "table": "precursor_versions_rows_rows_snapshot_consuming_p_8eb5526e"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_consuming_p_dc261dd9"
              },
              "consumingProductIds": {
                "kind": "array",
                "item": {
                  "kind": "string",
                  "arrayElement": true,
                  "table": "precursor_versions_rows_rows_snapshot_consuming_p_6a32fcd2"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_consuming_p_268a46d1"
              },
              "autofillProvenance": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "field": {
                      "kind": "string"
                    },
                    "documentId": {
                      "kind": "string",
                      "optional": true
                    },
                    "page": {
                      "kind": "number",
                      "min": 0
                    },
                    "excerpt": {
                      "kind": "string"
                    }
                  },
                  "arrayElement": true,
                  "table": "precursor_versions_rows_rows_snapshot_autofill_pr_598874d4"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_autofill_provenance"
              },
              "emissionsInputPolicy": {
                "kind": "string",
                "optional": true,
                "enum": [
                  "source_only"
                ]
              },
              "supplierResponseReceived": {
                "kind": "boolean",
                "optional": true
              },
              "supplierReportUnavailable": {
                "kind": "boolean",
                "optional": true
              },
              "defaultValueReference": {
                "kind": "string",
                "optional": true
              },
              "defaultValueChecked": {
                "kind": "boolean",
                "optional": true
              },
              "defaultValueSourceId": {
                "kind": "string",
                "optional": true
              },
              "defaultValueYear": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "verificationCoverageStart": {
                "kind": "string",
                "optional": true
              },
              "verificationCoverageEnd": {
                "kind": "string",
                "optional": true
              },
              "workspaceId": {
                "kind": "string",
                "optional": true
              },
              "parentId": {
                "kind": "string",
                "nullable": true,
                "optional": true
              },
              "installationName": {
                "kind": "string",
                "optional": true
              },
              "precursorName": {
                "kind": "string",
                "optional": true
              },
              "cnCode": {
                "kind": "string",
                "optional": true
              },
              "catalogProductId": {
                "kind": "string",
                "optional": true
              },
              "productionRoute": {
                "kind": "string",
                "optional": true
              },
              "isScrap": {
                "kind": "boolean",
                "optional": true
              },
              "seeTco2ePerT": {
                "kind": "number",
                "nullable": true,
                "optional": true,
                "min": 0
              },
              "specificEmbeddedDirectTco2PerT": {
                "kind": "number",
                "optional": true,
                "nullable": true,
                "min": 0
              },
              "specificEmbeddedIndirectTco2PerT": {
                "kind": "number",
                "optional": true,
                "nullable": true,
                "min": 0
              },
              "dataOrigin": {
                "kind": "string",
                "enum": [
                  "supplier_verified",
                  "supplier_unverified",
                  "default_value"
                ],
                "optional": true
              },
              "monthlyQuantities": {
                "kind": "array",
                "item": {
                  "kind": "object",
                  "fields": {
                    "basis": {
                      "kind": "string",
                      "optional": true,
                      "enum": [
                        "used",
                        "received"
                      ]
                    },
                    "receivedTonnes": {
                      "kind": "number",
                      "optional": true,
                      "min": 0
                    },
                    "processId": {
                      "kind": "string",
                      "optional": true
                    },
                    "month": {
                      "kind": "string"
                    },
                    "tonnes": {
                      "kind": "number",
                      "min": 0
                    }
                  },
                  "arrayElement": true,
                  "table": "precursor_versions_rows_rows_snapshot_monthly_qua_59f4c047"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_monthly_quantities"
              },
              "smartLinkToken": {
                "kind": "string",
                "optional": true
              },
              "smartLinkSentAt": {
                "kind": "string",
                "optional": true
              },
              "smartLinkLastSentAt": {
                "kind": "string",
                "optional": true
              },
              "smartLinkOpenedAt": {
                "kind": "string",
                "optional": true
              },
              "smartLinkSubmittedAt": {
                "kind": "string",
                "optional": true
              },
              "addedBy": {
                "kind": "string",
                "optional": true,
                "enum": [
                  "supplier",
                  "exporter"
                ]
              },
              "isChainRoot": {
                "kind": "boolean",
                "optional": true
              },
              "pendingExporterConfirmation": {
                "kind": "boolean",
                "optional": true
              },
              "qtyPerTonneOverride": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "quantityUsedT": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "origin": {
                "kind": "string",
                "enum": [
                  "same_installation",
                  "purchased"
                ],
                "optional": true
              },
              "supplierCompanyId": {
                "kind": "string",
                "optional": true
              },
              "sourceProcessId": {
                "kind": "string",
                "optional": true
              },
              "latitude": {
                "kind": "number",
                "optional": true,
                "min": -90,
                "max": 90
              },
              "longitude": {
                "kind": "number",
                "optional": true,
                "min": -180,
                "max": 180
              },
              "installationUniqueId": {
                "kind": "string",
                "optional": true
              },
              "fullAddress": {
                "kind": "string",
                "optional": true
              },
              "reportingPeriodStart": {
                "kind": "string",
                "optional": true
              },
              "reportingPeriodEnd": {
                "kind": "string",
                "optional": true
              },
              "verificationReportFileId": {
                "kind": "string",
                "optional": true
              },
              "verifierName": {
                "kind": "string",
                "optional": true
              },
              "verifierAccreditationNumber": {
                "kind": "string",
                "optional": true
              },
              "verifierAccreditationIssuingCountry": {
                "kind": "string",
                "optional": true
              },
              "verifierAccreditationExpiryDate": {
                "kind": "string",
                "optional": true
              },
              "verificationReportIssueDate": {
                "kind": "string",
                "optional": true
              },
              "verificationReportExpiresAt": {
                "kind": "string",
                "optional": true
              },
              "verificationSectoralScope": {
                "kind": "string",
                "optional": true
              },
              "verificationChecks": {
                "kind": "object",
                "fields": {
                  "accreditationValid": {
                    "kind": "boolean"
                  },
                  "sectoralScopeMatch": {
                    "kind": "boolean"
                  },
                  "periodCovered": {
                    "kind": "boolean"
                  },
                  "fileIntact": {
                    "kind": "boolean"
                  },
                  "failedReasons": {
                    "kind": "array",
                    "item": {
                      "kind": "string",
                      "arrayElement": true,
                      "table": "precursor_versions_rows_rows_snapshot_verificatio_675f13bd"
                    },
                    "table": "precursor_versions_rows_rows_snapshot_verificatio_46e957f3"
                  }
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_verification_checks"
              },
              "reducingAgent": {
                "kind": "string",
                "optional": true
              },
              "mnPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "crPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "niPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "otherAlloyingPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "scrapRatioTPerT": {
                "kind": "number",
                "optional": true,
                "min": 0
              },
              "preConsumerScrapPct": {
                "kind": "number",
                "optional": true,
                "min": 0,
                "max": 100
              },
              "linkedWorkspaceId": {
                "kind": "string",
                "optional": true
              },
              "valueBasis": {
                "kind": "string",
                "optional": true,
                "enum": [
                  "default",
                  "actual"
                ]
              },
              "originUnknown": {
                "kind": "boolean",
                "optional": true
              },
              "reportingPeriodBasis": {
                "kind": "string",
                "optional": true,
                "enum": [
                  "default_period",
                  "actual_time"
                ]
              },
              "alsoFromOtherInstallations": {
                "kind": "boolean",
                "optional": true
              },
              "sectorParams": {
                "kind": "map",
                "item": {
                  "kind": "string",
                  "table": "precursor_versions_rows_rows_snapshot_sector_params_rows"
                },
                "optional": true,
                "table": "precursor_versions_rows_rows_snapshot_sector_params"
              },
              "verifierAddress": {
                "kind": "string",
                "optional": true
              },
              "verifierLeadAuditor": {
                "kind": "string",
                "optional": true
              },
              "verifierAccreditationBody": {
                "kind": "string",
                "optional": true
              },
              "verifierReasonableAssurance": {
                "kind": "boolean",
                "optional": true
              }
            },
            "table": "precursor_versions_rows_rows_snapshot"
          }
        },
        "arrayElement": true,
        "table": "precursor_versions_rows_rows"
      },
      "table": "precursor_versions_rows"
    },
    "table": "precursor_versions"
  },
  "certrace:final-report-snapshot": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "workspaceId": {
          "kind": "string",
          "derived": "workspace"
        },
        "fingerprint": {
          "kind": "string"
        },
        "signedAt": {
          "kind": "string"
        },
        "doc": {
          "kind": "artifact"
        }
      },
      "scopeKey": true,
      "table": "final_report_snapshot_rows"
    },
    "table": "final_report_snapshot"
  },
  "certrace:report-snapshots:*": {
    "kind": "array",
    "item": {
      "kind": "object",
      "fields": {
        "version": {
          "kind": "number",
          "min": 0
        },
        "createdAt": {
          "kind": "string"
        },
        "reason": {
          "kind": "string"
        },
        "fingerprint": {
          "kind": "string"
        },
        "dataset": {
          "kind": "artifact"
        }
      },
      "arrayElement": true,
      "table": "report_snapshots_rows"
    },
    "table": "report_snapshots_"
  },
  "certrace:report-inputs:v1": {
    "kind": "map",
    "item": {
      "kind": "object",
      "fields": {
        "0.4": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "country": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_0_4_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_0_4_rows_rows"
              },
              "table": "report_inputs_v1_rows_0_4_rows"
            }
          },
          "table": "report_inputs_v1_rows_0_4"
        },
        "0.5": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "name": {
                        "kind": "string",
                        "optional": true
                      },
                      "email": {
                        "kind": "string",
                        "optional": true
                      },
                      "phone": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_0_5_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_0_5_rows_rows"
              },
              "table": "report_inputs_v1_rows_0_5_rows"
            }
          },
          "table": "report_inputs_v1_rows_0_5"
        },
        "0.6": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "name": {
                        "kind": "string",
                        "optional": true
                      },
                      "role": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_0_6_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_0_6_rows_rows"
              },
              "table": "report_inputs_v1_rows_0_6_rows"
            }
          },
          "table": "report_inputs_v1_rows_0_6"
        },
        "0.7": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "operator": {
                        "kind": "string",
                        "optional": true
                      },
                      "exporter": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_0_7_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_0_7_rows_rows"
              },
              "table": "report_inputs_v1_rows_0_7_rows"
            }
          },
          "table": "report_inputs_v1_rows_0_7"
        },
        "1.19": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "operated": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_1_19_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_1_19_rows_rows"
              },
              "table": "report_inputs_v1_rows_1_19_rows"
            }
          },
          "table": "report_inputs_v1_rows_1_19"
        },
        "1.20": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "start": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "months": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 1,
                        "max": 12
                      }
                    },
                    "table": "report_inputs_v1_rows_1_20_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_1_20_rows_rows"
              },
              "table": "report_inputs_v1_rows_1_20_rows"
            }
          },
          "table": "report_inputs_v1_rows_1_20"
        },
        "2.0.4": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "change": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_0_4_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_0_4_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_0_4_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_0_4"
        },
        "2.0.5": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "change": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_0_5_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_0_5_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_0_5_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_0_5"
        },
        "2.1.11": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "classification": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "cbam",
                          "non_cbam"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_11_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_11_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_11_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_11"
        },
        "2.1.12": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "classification": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "simple",
                          "complex"
                        ]
                      },
                      "boundary": {
                        "kind": "string",
                        "optional": true
                      },
                      "indirect": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "legalBasis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_12_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_12_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_12_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_12"
        },
        "2.1.13": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "route": {
                        "kind": "string",
                        "optional": true
                      },
                      "equipment": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_13_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_13_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_13_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_13"
        },
        "2.1.14": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_14_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_14_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_14_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_14"
        },
        "2.1.25": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "composition": {
                        "kind": "string",
                        "optional": true
                      },
                      "parameter": {
                        "kind": "string",
                        "optional": true
                      },
                      "value": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "unit": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_25_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_25_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_25_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_25"
        },
        "2.1.26": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "parameter": {
                        "kind": "string",
                        "optional": true
                      },
                      "value": {
                        "kind": "string",
                        "optional": true
                      },
                      "unit": {
                        "kind": "string",
                        "optional": true
                      },
                      "reference": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_1_26_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_1_26_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_1_26_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_1_26"
        },
        "2.2.29": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_29_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_29_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_29_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_29"
        },
        "2.2.30": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "stream": {
                        "kind": "string",
                        "optional": true
                      },
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "description": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_30_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_30_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_30_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_30"
        },
        "2.2.31": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "stream": {
                        "kind": "string",
                        "optional": true
                      },
                      "formula": {
                        "kind": "string",
                        "optional": true
                      },
                      "factorSource": {
                        "kind": "string",
                        "optional": true
                      },
                      "sampling": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_31_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_31_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_31_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_31"
        },
        "2.2.32": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "instrument": {
                        "kind": "string",
                        "optional": true
                      },
                      "uncertainty": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 100
                      },
                      "calibrated": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "due": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_32_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_32_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_32_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_32"
        },
        "2.2.33": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "source": {
                        "kind": "string",
                        "optional": true
                      },
                      "gas": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "CO2",
                          "N2O",
                          "CF4",
                          "C2F6"
                        ]
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_33_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_33_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_33_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_33"
        },
        "2.2.34": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "stream": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_34_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_34_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_34_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_34"
        },
        "2.2.35": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "flow": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "heat",
                          "waste_gas",
                          "co2"
                        ]
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_35_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_35_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_35_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_35"
        },
        "2.2.36": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "actual",
                          "default"
                        ]
                      },
                      "eligibility": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_36_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_36_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_36_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_36"
        },
        "2.2.37": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "generation": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "chp",
                          "separate"
                        ]
                      },
                      "fuel": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "fossil",
                          "renewable",
                          "mixed"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_37_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_37_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_37_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_37"
        },
        "2.2.38": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "directShare": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 100
                      },
                      "indirectShare": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 100
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_38_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_38_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_38_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_38"
        },
        "2.2.39": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "method": {
                        "kind": "string",
                        "optional": true
                      },
                      "benchmark": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "cbamFactor": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 1
                      },
                      "cscf": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 1
                      },
                      "reference": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_2_39_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_2_39_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_2_39_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_2_39"
        },
        "2.3.29": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "name": {
                        "kind": "string",
                        "optional": true
                      },
                      "cn": {
                        "kind": "string",
                        "optional": true
                      },
                      "tonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_29_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_29_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_29_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_29"
        },
        "2.3.30": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "route": {
                        "kind": "string",
                        "optional": true
                      },
                      "composition": {
                        "kind": "string",
                        "optional": true
                      },
                      "quantity": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "tonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_30_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_30_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_30_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_30"
        },
        "2.3.31": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "tonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "factor": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_31_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_31_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_31_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_31"
        },
        "2.3.32": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "material": {
                        "kind": "string",
                        "optional": true
                      },
                      "opening": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "receipts": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "returns": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "closing": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "waste": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "offSpec": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_32_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_32_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_32_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_32"
        },
        "2.3.33": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "share": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 100
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_33_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_33_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_33_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_33"
        },
        "2.3.34": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "carbon": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 1
                      },
                      "oxidation": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0,
                        "max": 1
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_34_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_34_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_34_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_34"
        },
        "2.3.35": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "source": {
                        "kind": "string",
                        "optional": true
                      },
                      "gas": {
                        "kind": "string",
                        "optional": true
                      },
                      "start": {
                        "kind": "string",
                        "optional": true,
                        "format": "datetime-local"
                      },
                      "end": {
                        "kind": "string",
                        "optional": true,
                        "format": "datetime-local"
                      },
                      "flow": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "concentration": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "gwp": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_35_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_35_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_35_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_35"
        },
        "2.3.36": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "supplier": {
                        "kind": "string",
                        "optional": true
                      },
                      "installation": {
                        "kind": "string",
                        "optional": true
                      },
                      "country": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_36_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_36_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_36_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_36"
        },
        "2.3.37": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "mwh": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_37_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_37_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_37_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_37"
        },
        "2.3.38": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "produced": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "used": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "exported": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_38_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_38_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_38_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_38"
        },
        "2.3.39": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "gross": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "ownUse": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "fuelGj": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "heatGj": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_39_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_39_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_39_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_39"
        },
        "2.3.40": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "contract": {
                        "kind": "string",
                        "optional": true
                      },
                      "start": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "end": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_40_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_40_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_40_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_40"
        },
        "2.3.41": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "kind": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "heat",
                          "waste_gas"
                        ]
                      },
                      "imported": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "produced": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "used": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "exported": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "counterpart": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_41_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_41_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_41_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_41"
        },
        "2.3.42": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "kind": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "heat",
                          "waste_gas"
                        ]
                      },
                      "factor": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "reference": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_42_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_42_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_42_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_42"
        },
        "2.3.43": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "direction": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "captured",
                          "received",
                          "transferred"
                        ]
                      },
                      "tonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "purpose": {
                        "kind": "string",
                        "optional": true
                      },
                      "recipient": {
                        "kind": "string",
                        "optional": true
                      },
                      "contact": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_43_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_43_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_43_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_43"
        },
        "2.3.44": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "source": {
                        "kind": "string",
                        "optional": true,
                        "format": "source"
                      },
                      "start": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "end": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "replacement": {
                        "kind": "string",
                        "optional": true
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_44_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_44_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_44_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_44"
        },
        "2.3.45": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "source": {
                        "kind": "string",
                        "optional": true
                      },
                      "method": {
                        "kind": "string",
                        "optional": true
                      },
                      "activity": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "unit": {
                        "kind": "string",
                        "optional": true
                      },
                      "factor": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_3_45_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_3_45_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_3_45_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_3_45"
        },
        "2.4.27": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "origin": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "external",
                          "internal"
                        ]
                      },
                      "producingProcess": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_27_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_27_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_27_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_27"
        },
        "2.4.28": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "month": {
                        "kind": "string",
                        "optional": true,
                        "format": "month"
                      },
                      "producingProcess": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "produced": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "used": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_28_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_28_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_28_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_28"
        },
        "2.4.29": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "process": {
                        "kind": "string",
                        "optional": true,
                        "format": "process"
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_29_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_29_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_29_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_29"
        },
        "2.4.30": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "basis": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "default_period",
                          "actual_production"
                        ]
                      },
                      "explanation": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_30_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_30_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_30_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_30"
        },
        "2.4.31": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "method": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "weighted",
                          "subset"
                        ]
                      },
                      "group": {
                        "kind": "string",
                        "optional": true
                      },
                      "start": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "end": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "tonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_31_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_31_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_31_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_31"
        },
        "2.4.32": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "supplier": {
                        "kind": "string",
                        "optional": true
                      },
                      "location": {
                        "kind": "string",
                        "optional": true
                      },
                      "received": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "receivedTonnes": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_32_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_32_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_32_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_32"
        },
        "2.4.33": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "category": {
                        "kind": "string",
                        "optional": true
                      },
                      "classification": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "simple",
                          "complex"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_33_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_33_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_33_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_33"
        },
        "2.4.34": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "reference": {
                        "kind": "string",
                        "optional": true
                      },
                      "page": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_4_34_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_4_34_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_4_34_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_4_34"
        },
        "2.5.7": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      },
                      "owner": {
                        "kind": "string",
                        "optional": true
                      },
                      "issued": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "expiry": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_5_7_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_5_7_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_5_7_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_5_7"
        },
        "2.5.8": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      },
                      "access": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "verifier",
                          "internal"
                        ]
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_5_8_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_5_8_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_5_8_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_5_8"
        },
        "2.5.9": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "recipient": {
                        "kind": "string",
                        "optional": true
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_5_9_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_5_9_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_5_9_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_5_9"
        },
        "2.5.10": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "decision": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "accepted",
                          "rejected",
                          "pending"
                        ]
                      },
                      "reviewer": {
                        "kind": "string",
                        "optional": true
                      },
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "basis": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_5_10_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_5_10_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_5_10_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_5_10"
        },
        "2.5.11": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_5_11_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_5_11_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_5_11_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_5_11"
        },
        "2.7.3": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "product": {
                        "kind": "string",
                        "optional": true,
                        "format": "product"
                      },
                      "criteria": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_3_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_3_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_3_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_3"
        },
        "2.7.4": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "connection": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "emissions": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_4_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_4_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_4_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_4"
        },
        "2.7.5": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "name": {
                        "kind": "string",
                        "optional": true
                      },
                      "eori": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_5_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_5_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_5_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_5"
        },
        "2.7.6": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "eori": {
                        "kind": "string",
                        "optional": true
                      },
                      "ppa": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "nomination": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "congestion": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no",
                          "na"
                        ]
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_6_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_6_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_6_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_6"
        },
        "2.7.7": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "eori": {
                        "kind": "string",
                        "optional": true
                      },
                      "mwh": {
                        "kind": "decimalText",
                        "optional": true,
                        "min": 0
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_7_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_7_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_7_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_7"
        },
        "2.7.8": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "eori": {
                        "kind": "string",
                        "optional": true
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "recipient": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_8_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_8_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_8_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_8"
        },
        "2.7.9": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "reviewer": {
                        "kind": "string",
                        "optional": true
                      },
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "reviewed": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_9_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_9_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_9_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_9"
        },
        "2.7.10": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "reviewer": {
                        "kind": "string",
                        "optional": true
                      },
                      "date": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "benchmarks": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      },
                      "reviewed": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "yes",
                          "no"
                        ]
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_10_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_10_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_10_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_10"
        },
        "2.7.11": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      },
                      "verifier": {
                        "kind": "string",
                        "optional": true
                      },
                      "finding": {
                        "kind": "string",
                        "optional": true
                      },
                      "status": {
                        "kind": "string",
                        "optional": true,
                        "enum": [
                          "",
                          "open",
                          "resolved",
                          "no_findings"
                        ]
                      },
                      "response": {
                        "kind": "string",
                        "optional": true
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_11_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_11_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_11_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_11"
        },
        "2.7.12": {
          "kind": "object",
          "optional": true,
          "fields": {
            "applicability": {
              "kind": "string",
              "enum": [
                "yes",
                "no",
                ""
              ]
            },
            "reason": {
              "kind": "string"
            },
            "updatedAt": {
              "kind": "string",
              "optional": true
            },
            "rows": {
              "kind": "array",
              "item": {
                "kind": "object",
                "fields": {
                  "id": {
                    "kind": "string"
                  },
                  "values": {
                    "kind": "object",
                    "fields": {
                      "version": {
                        "kind": "string",
                        "optional": true
                      },
                      "sent": {
                        "kind": "string",
                        "optional": true,
                        "format": "date"
                      },
                      "recipient": {
                        "kind": "string",
                        "optional": true
                      },
                      "reason": {
                        "kind": "string",
                        "optional": true
                      },
                      "evidence": {
                        "kind": "string",
                        "optional": true,
                        "format": "evidence"
                      }
                    },
                    "table": "report_inputs_v1_rows_2_7_12_rows_rows_values"
                  }
                },
                "arrayElement": true,
                "table": "report_inputs_v1_rows_2_7_12_rows_rows"
              },
              "table": "report_inputs_v1_rows_2_7_12_rows"
            }
          },
          "table": "report_inputs_v1_rows_2_7_12"
        }
      },
      "table": "report_inputs_v1_rows"
    },
    "table": "report_inputs_v1"
  }
};
export interface ReportStoreValues {
 "certrace:internal-precursors": Record<string, Array<{ "id": string; "workspaceId": string; "sourceWorkspaceId": string; "quantityUsedT"?: number }>>;
 "certrace:unit-costs": Record<string, { "priceThbPerTonne"?: number; "pieceKg"?: number; "electricityThbPerKwh"?: number; "fuelThbPerUnit"?: Record<string, number>; "workspaceId": string; "updatedAt": string }>;
 "certrace:workspaces": Array<{ "id": string; "installationId": string; "installationName": string; "productId": string; "productName": string; "cnCode": string; "productionRoute": string; "country"?: string; "year": number; "periodStart": string; "periodEnd": string; "declarationIds": Array<string>; "createdAt": string; "selfSupplied"?: boolean; "supplierId"?: string; "supplierName"?: string; "schedule"?: { "dueDay": number }; "archivedAt"?: string | null; "internalSignoff"?: { "name": string; "role": string; "at": string; "note"?: string } | null; "verifierSignoff"?: { "name": string; "role": string; "at": string; "note"?: string } | null }>;
 "certrace:installations": Array<{ "id": string; "name": string; "nameLocal": string; "self": boolean; "supplierId": string; "role"?: "own" | "oem" | "supplier"; "street": string; "economicActivity": string; "postcode": string; "poBox": string; "city": string; "country": string; "unlocode": string; "lat": string; "lng": string; "contactName": string; "contactEmail": string; "contactPhone": string; "otherGoods": Array<{ "name": string; "description"?: string }>; "operatorName": string; "operatorRegistrationNumber": string; "operatorAddress": string; "registryId": string; "monitoring": { "nonCbamProcesses": string; "topFuels": string; "topMaterials": string; "cems": "" | "yes" | "no"; "cemsDetail": string; "zeroRatedFuels": "" | "yes" | "no"; "zeroRatedDetail": string; "heatTrade": "" | "yes" | "no"; "heatDetail": string; "electricityMixed": "" | "yes" | "no"; "electricityDetail": string; "onsiteElectricity": "" | "yes" | "no"; "onsiteElectricityDetail": string; "wasteGases": "" | "yes" | "no"; "wasteGasDetail": string; "co2Transfer": "" | "yes" | "no"; "co2TransferDetail": string; "electricityToEu": "" | "yes" | "no" }; "createdAt": string }>;
 "certrace:supplier-companies": Array<{ "id": string; "name": string; "country": string; "contactName": string; "contactEmail": string; "contactPhone": string; "createdAt": string }>;
 "certrace:workspace-drafts": Array<{ "id": string; "updatedAt": number; "snapshot": { "installationId": string; "installationName": string; "isSelf": boolean; "supplierChoice": "" | "self" | "other"; "supplierId"?: string; "productId": string; "route": string; "country"?: string; "year": number; "dueDay"?: number; "requestDay"?: number; "dueAfterDays"?: number; "step": number }; "display": { "installationName": string; "productName": string; "year": number; "step": number; "stepCount": number } }>;
 "certrace:workspace-mmd-draft": Record<string, { "inputPlan"?: { "operatorName": string; "operatorRegistration": string; "operatorAddress": string; "registryId": string; "monitoringStart": string; "processes": Array<{ "id": string; "name": string; "routes": Array<string>; "steps": Array<string>; "products": Array<{ "id": string; "name": string; "cnCode": string; "description": string; "unit": "t" | "kWh" | "kg N" | "t clinker"; "benchmark": string }>; "precursorIds": Array<string>; "otherInputs": Array<string> }>; "additionalFlows": Array<string> }; "noCombustion"?: boolean; "diagramFileId"?: string; "boundaryDescription": string; "processesIncluded": Array<string>; "exclusions": Array<{ "id": string; "process": string; "ground": "other" | "not_production_process" | "separately_metered" | "outsourced" | "non_cbam_good" | "de_minimis"; "groundOther": string; "note": string }>; "periodStart": string; "periodEnd": string; "directMethod": "calculation" | "measurement"; "fuelTypeIds": Array<string>; "fuelTypesOther": string; "electricitySupply": string; "electricitySupplyOther": string; "electricityMeteringPoint": string; "ownGenerationFuelDeclared": boolean; "fuelInstruments": Array<{ "id": string; "parameter": string; "instrument": string; "readingFrequency": string; "readingFrequencyOther"?: string; "lastCalibration": string; "factorSource": "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_declared"; "directMethod": "calculation" | "measurement"; "cemsCalibrationRef"?: string; "measurementPointLocation"?: string; "location"?: string; "uncertaintyPct"?: number }>; "electricityInstruments": Array<{ "id": string; "parameter": string; "instrument": string; "readingFrequency": string; "readingFrequencyOther"?: string; "lastCalibration": string; "factorSource": "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_declared"; "directMethod": "calculation" | "measurement"; "cemsCalibrationRef"?: string; "measurementPointLocation"?: string; "location"?: string; "uncertaintyPct"?: number }>; "dataGaps": Array<{ "id": string; "periodStart": string; "periodEnd": string; "reason": string; "estimationMethod": string; "estimatedTCO2e": number; "reviewerName": string; "gapDate": string }>; "qualityAssurance": "third_party_verification" | "internal_audits" | "four_eyes" | "none"; "reviewerName": string; "reviewFrequency": string; "diagramFileName": string | null; "diagramDataUrl"?: string; "diagramCovers": Array<number>; "sectorParameters": { "reducingAgent": "" | "other" | "none" | "coke" | "natural_gas" | "hydrogen" | "coal"; "reducingAgentOther": string; "mnPct"?: number; "crPct"?: number; "niPct"?: number; "otherAlloyingPct"?: number; "otherMaterialsPct"?: number; "steelMillId": string; "carbonPct"?: number; "scrapTonnesPerTonneSteel"?: number; "preConsumerScrapPct"?: number; "scrapTonnesPerTonneAluminium"?: number; "nonAluminiumPct"?: number }; "pfcMethodology"?: { "method": "" | "slope" | "overvoltage"; "technology": string; "factorSource": "" | "eu_table" | "own_measurement"; "measuredOn": string; "collectionBasis": string }; "samplingPlan": string; "controlSystem": { "riskAssessment": string; "itSystems": string; "segregationOfDuties": string; "corrections": string; "outsourced": string; "records": string } }>;
 "certrace:workspace-mmd-versions": Record<string, Array<{ "id": string; "workspaceId": string; "n": number; "finalisedAt": string; "author": string; "content": { "inputPlan"?: { "operatorName": string; "operatorRegistration": string; "operatorAddress": string; "registryId": string; "monitoringStart": string; "processes": Array<{ "id": string; "name": string; "routes": Array<string>; "steps": Array<string>; "products": Array<{ "id": string; "name": string; "cnCode": string; "description": string; "unit": "t" | "kWh" | "kg N" | "t clinker"; "benchmark": string }>; "precursorIds": Array<string>; "otherInputs": Array<string> }>; "additionalFlows": Array<string> }; "noCombustion"?: boolean; "diagramFileId"?: string; "boundaryDescription": string; "processesIncluded": Array<string>; "exclusions": Array<{ "id": string; "process": string; "ground": "other" | "not_production_process" | "separately_metered" | "outsourced" | "non_cbam_good" | "de_minimis"; "groundOther": string; "note": string }>; "periodStart": string; "periodEnd": string; "directMethod": "calculation" | "measurement"; "fuelTypeIds": Array<string>; "fuelTypesOther": string; "electricitySupply": string; "electricitySupplyOther": string; "electricityMeteringPoint": string; "ownGenerationFuelDeclared": boolean; "fuelInstruments": Array<{ "id": string; "parameter": string; "instrument": string; "readingFrequency": string; "readingFrequencyOther"?: string; "lastCalibration": string; "factorSource": "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_declared"; "directMethod": "calculation" | "measurement"; "cemsCalibrationRef"?: string; "measurementPointLocation"?: string; "location"?: string; "uncertaintyPct"?: number }>; "electricityInstruments": Array<{ "id": string; "parameter": string; "instrument": string; "readingFrequency": string; "readingFrequencyOther"?: string; "lastCalibration": string; "factorSource": "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_declared"; "directMethod": "calculation" | "measurement"; "cemsCalibrationRef"?: string; "measurementPointLocation"?: string; "location"?: string; "uncertaintyPct"?: number }>; "dataGaps": Array<{ "id": string; "periodStart": string; "periodEnd": string; "reason": string; "estimationMethod": string; "estimatedTCO2e": number; "reviewerName": string; "gapDate": string }>; "qualityAssurance": "third_party_verification" | "internal_audits" | "four_eyes" | "none"; "reviewerName": string; "reviewFrequency": string; "diagramFileName": string | null; "diagramDataUrl"?: string; "diagramCovers": Array<number>; "sectorParameters": { "reducingAgent": "" | "other" | "none" | "coke" | "natural_gas" | "hydrogen" | "coal"; "reducingAgentOther": string; "mnPct"?: number; "crPct"?: number; "niPct"?: number; "otherAlloyingPct"?: number; "otherMaterialsPct"?: number; "steelMillId": string; "carbonPct"?: number; "scrapTonnesPerTonneSteel"?: number; "preConsumerScrapPct"?: number; "scrapTonnesPerTonneAluminium"?: number; "nonAluminiumPct"?: number }; "pfcMethodology"?: { "method": "" | "slope" | "overvoltage"; "technology": string; "factorSource": "" | "eu_table" | "own_measurement"; "measuredOn": string; "collectionBasis": string }; "samplingPlan": string; "controlSystem": { "riskAssessment": string; "itSystems": string; "segregationOfDuties": string; "corrections": string; "outsourced": string; "records": string } }; "periodStart": string; "periodEnd": string }>>;
 "certrace:monthly-data": Record<string, Array<{ "zeroProductionConfirmed"?: boolean; "noElectricityConfirmed"?: boolean; "noFuelConfirmed"?: boolean; "activityNote"?: string; "outputQuantities"?: Array<{ "processId": string; "productId": string; "route": string; "quantity"?: number; "tonnes"?: number }>; "otherFlows"?: Array<{ "id": string; "kind": string; "processId": string; "quantity"?: number; "unit": string; "counterpart": string; "basis": string }>; "id": string; "workspaceId": string; "month": string; "productionTonnes": number; "fuels": Array<{ "deliveredQuantity"?: number; "id": string; "fuelType": string; "fuelTypeOther"?: string; "quantity": number; "unit": "t" | "m3" | "kg" | "l" | "GJ"; "ncvMjPerUnit"?: number; "efTco2PerGj": number; "oxidationFactor"?: number; "oxidationFactorSource"?: "conservative_default" | "measured"; "cAsh"?: number; "cTotal"?: number; "biomassFraction"?: number; "biomassEvidenced"?: boolean; "factorSource": "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_specific"; "usedForSelfGeneratedElectricity"?: boolean; "stock"?: { "delivered"?: number; "opening"?: number; "closing"?: number }; "shared"?: { "meter": string; "reading"?: number; "key": "production" | "energy" | "manual"; "thisValue"?: number; "totalValue"?: number; "manualPct"?: number } }>; "processEmissionsTco2": number; "processEmissionsBasis"?: string; "processEmissionEntries"?: Array<{ "id": string; "method": "standard" | "mass_balance"; "materialId": string; "quantityT": number; "conversionFactor"?: number; "note"?: string; "specKey"?: string; "stock"?: { "delivered"?: number; "opening"?: number; "closing"?: number }; "carbonContent"?: number; "label"?: string; "preConsumerT"?: number }>; "electricityMwh": number; "electricityFactorTco2PerMwh": number; "electricityFactorSource": "grid_default" | "ppa" | "self_generated" | "direct_technical_link"; "selfGeneratedSharePct"?: number; "electricitySources"?: Array<{ "id": string; "sourceType": "grid_default" | "ppa" | "self_generated" | "direct_technical_link"; "mwh": number; "factorTco2PerMwh": number | null; "country"?: string; "supplierInstallation"?: string; "shared"?: { "meter": string; "reading"?: number; "key": "production" | "energy" | "manual"; "thisValue"?: number; "totalValue"?: number; "manualPct"?: number } }>; "flueGasCleaningEmissionsTco2"?: number; "electricityInstallationTotalMwh"?: number; "nonCbamGoods"?: Array<{ "id": string; "name": string; "tonnes": number }>; "measuredEmissions"?: Array<{ "id": string; "source": string; "gas": "co2" | "n2o" | "cf4" | "c2f6"; "tCO2e": number }>; "co2ReceivedT"?: number; "co2TransferredOutT"?: number; "heatGj"?: { "imported"?: number; "produced"?: number; "consumed"?: number; "exported"?: number }; "wasteGasGj"?: { "imported"?: number; "produced"?: number; "consumed"?: number; "exported"?: number }; "electricityExportedMwh"?: number; "pfc"?: { "method": "slope" | "overvoltage"; "technology": string; "primaryAlT"?: number; "aem"?: number; "aeo"?: number; "ce"?: number; "ownCf4Factor"?: number; "ownC2f6Fraction"?: number; "collectionEfficiencyPct"?: number; "potlines"?: Array<{ "id": string; "label": string; "technology": string; "sharePct"?: number; "aePerCellDay"?: number; "aeMinutes"?: number; "cellDays"?: number; "aeo"?: number; "ce"?: number }> }; "scrap"?: { "tonnes"?: number; "preConsumerT"?: number }; "wasteGases"?: Array<{ "id": string; "gas": "other" | "bfg" | "cog" | "bofg"; "label"?: string; "flow": "produced" | "consumed" | "imported" | "exported"; "volumeNm3"?: number; "ncvMjPerNm3"?: number; "coPct"?: number; "co2Pct"?: number; "h2Pct"?: number; "ch4Pct"?: number }>; "scrapDeliveries"?: Array<{ "id": string; "material": "steel_scrap" | "iron_scrap" | "aluminium_scrap"; "supplier": string; "grade": string; "origin": "pre_consumer" | "post_consumer"; "tonnes"?: number }>; "composition"?: { "mnPct"?: number; "crPct"?: number; "niPct"?: number; "otherPct"?: number; "basis"?: string }; "status": "empty" | "draft" | "submitted" | "reviewed"; "submittedAt"?: string; "submittedBy"?: string; "notes"?: string; "notManufactured"?: boolean }>>;
 "certrace:precursor-suppliers": Record<string, Array<{ "consumingProcessIds"?: Array<string>; "consumingProductIds"?: Array<string>; "autofillProvenance"?: Array<{ "field": string; "documentId"?: string; "page": number; "excerpt": string }>; "emissionsInputPolicy"?: "source_only"; "supplierResponseReceived"?: boolean; "supplierReportUnavailable"?: boolean; "defaultValueReference"?: string; "defaultValueChecked"?: boolean; "defaultValueSourceId"?: string; "defaultValueYear"?: number; "verificationCoverageStart"?: string; "verificationCoverageEnd"?: string; "id": string; "workspaceId": string; "parentId": string | null; "name": string; "installationName": string; "country": string; "precursorName": string; "cnCode": string; "catalogProductId"?: string; "productionRoute": string; "isScrap": boolean; "seeTco2ePerT": number | null; "specificEmbeddedDirectTco2PerT"?: number | null; "specificEmbeddedIndirectTco2PerT"?: number | null; "dataOrigin": "supplier_verified" | "supplier_unverified" | "default_value"; "monthlyQuantities": Array<{ "basis"?: "used" | "received"; "receivedTonnes"?: number; "processId"?: string; "month": string; "tonnes": number }>; "smartLinkToken"?: string; "smartLinkSentAt"?: string; "smartLinkLastSentAt"?: string; "smartLinkOpenedAt"?: string; "smartLinkSubmittedAt"?: string; "addedBy"?: "supplier" | "exporter"; "isChainRoot"?: boolean; "pendingExporterConfirmation"?: boolean; "qtyPerTonneOverride"?: number; "quantityUsedT"?: number; "origin": "same_installation" | "purchased"; "supplierCompanyId"?: string; "contactName"?: string; "contactEmail"?: string; "contactPhone"?: string; "sourceProcessId"?: string; "latitude"?: number; "longitude"?: number; "installationUniqueId"?: string; "unlocode"?: string; "fullAddress"?: string; "reportingPeriodStart"?: string; "reportingPeriodEnd"?: string; "verificationReportFileId"?: string; "verifierName"?: string; "verifierAccreditationNumber"?: string; "verifierAccreditationIssuingCountry"?: string; "verifierAccreditationExpiryDate"?: string; "verificationReportIssueDate"?: string; "verificationReportExpiresAt"?: string; "verificationSectoralScope"?: string; "verificationChecks"?: { "accreditationValid": boolean; "sectoralScopeMatch": boolean; "periodCovered": boolean; "fileIntact": boolean; "failedReasons": Array<string> }; "reducingAgent"?: string; "mnPct"?: number; "crPct"?: number; "niPct"?: number; "otherAlloyingPct"?: number; "scrapRatioTPerT"?: number; "preConsumerScrapPct"?: number; "linkedWorkspaceId"?: string; "valueBasis"?: "default" | "actual"; "originUnknown"?: boolean; "reportingPeriodBasis"?: "default_period" | "actual_time"; "alsoFromOtherInstallations"?: boolean; "sectorParams"?: Record<string, string>; "verifierAddress"?: string; "verifierLeadAuditor"?: string; "verifierAccreditationBody"?: string; "verifierReasonableAssurance"?: boolean }>>;
 "certrace:workspace-evidence": Record<string, Array<{ "reviewedBy"?: string; "reviewedAt"?: string; "fileHash"?: string; "localFileId"?: string; "serverFileId"?: string; "id": string; "workspaceId": string; "month"?: string; "fieldKeys": Array<string>; "sourceType": "other" | "utility_invoice" | "fuel_invoice" | "meter_log" | "erp_export" | "lab_report" | "supplier_cti" | "mill_test_certificate" | "calibration_record" | "carbon_price_receipt" | "calculation_sheet"; "fileName": string; "fileDataUrl"?: string; "mimeType"?: string; "sizeBytes"?: number; "extraction"?: { "status": "pending" | "done" | "failed" | "needs_review"; "fields": Array<{ "page"?: number; "excerpt"?: string; "key": string; "value": string; "unit"?: string; "confidence": number; "accepted": boolean }>; "rawSummary"?: string; "extractedAt"?: string; "error"?: string }; "capturedAt": string; "uploadedBy"?: string; "boundTo"?: string }>>;
 "certrace:pack-signoff": Record<string, { "workspaceId": string; "name": string; "jobTitle": string; "signedAt": string; "fingerprint": string }>;
 "certrace:carbon-price": Record<string, { "workspaceId": string; "amountPerTonne": number; "currency": "THB" | "EUR"; "instrument": "none" | "ets" | "tax" | "levy" | "excise_embedded"; "rebates"?: string; "rebateAmountPerTonne"?: number; "legalBasis"?: string; "certifiedBy"?: string; "shareOfEmissionsCovered"?: number; "evidenceItemId"?: string; "recorded": boolean; "updatedAt": string }>;
 "certrace:reporting-periods": Array<{ "installationId": string; "year": number; "createdAt": string }>;
 "certrace:annual-production": Record<string, { "declarationId": string; "tonnes": number; "provenance": { "source": "meter" | "invoice" | "lab" | "erp" | "national_dataset" | "eu_default" | "ASSUMPTION"; "reference"?: string; "evidenceFileId"?: string; "enteredBy": string; "enteredAt": string }; "confirmedAt": number | null; "confirmedAgainstShippedTonnes"?: number; "updatedAt": number }>;
 "certrace:monthly-requests": Record<string, Array<{ "workspaceId": string; "declId": string; "supplierId": string; "supplierName": string; "month": string; "token": string; "sentAt"?: string; "resendCount"?: number; "createdAt": string }>>;
 "certrace:month-submissions": Record<string, Record<string, { "workspaceId": string; "month": string; "state": "submitted" | "open" | "in_review" | "confirmed" | "changes_requested"; "attestation": { "fullName": string; "role": string; "at": string; "warningsAcknowledged": number } | null; "history"?: Array<{ "fullName": string; "role": string; "at": string; "warningsAcknowledged": number }>; "submittedAt"?: string; "editedByExporter": boolean; "editedAt"?: string; "reviewerId"?: string; "reviewerName"?: string; "confirmedBy"?: string; "confirmedAt"?: string; "revisionNote"?: string; "revisionAt"?: string; "revisionCarriedEdits"?: boolean; "revisionAreas"?: Array<string>; "revisionRound"?: number; "editRequest"?: { "at": string; "reason": string; "state": "pending" | "approved" | "rejected"; "decidedAt"?: string; "decidedBy"?: string } }>>;
 "certrace:precursor-versions": Record<string, Array<{ "version": number; "savedAt": string; "changed": Array<string>; "snapshot": { "id": string; "name": string; "nameLocal"?: string; "self"?: boolean; "supplierId"?: string; "role"?: "own" | "oem" | "supplier"; "street"?: string; "economicActivity"?: string; "postcode"?: string; "poBox"?: string; "city"?: string; "country": string; "unlocode"?: string; "lat"?: string; "lng"?: string; "contactName"?: string; "contactEmail"?: string; "contactPhone"?: string; "otherGoods"?: Array<{ "name": string; "description"?: string }>; "operatorName"?: string; "operatorRegistrationNumber"?: string; "operatorAddress"?: string; "registryId"?: string; "monitoring"?: { "nonCbamProcesses": string; "topFuels": string; "topMaterials": string; "cems": "" | "yes" | "no"; "cemsDetail": string; "zeroRatedFuels": "" | "yes" | "no"; "zeroRatedDetail": string; "heatTrade": "" | "yes" | "no"; "heatDetail": string; "electricityMixed": "" | "yes" | "no"; "electricityDetail": string; "onsiteElectricity": "" | "yes" | "no"; "onsiteElectricityDetail": string; "wasteGases": "" | "yes" | "no"; "wasteGasDetail": string; "co2Transfer": "" | "yes" | "no"; "co2TransferDetail": string; "electricityToEu": "" | "yes" | "no" }; "createdAt"?: string; "consumingProcessIds"?: Array<string>; "consumingProductIds"?: Array<string>; "autofillProvenance"?: Array<{ "field": string; "documentId"?: string; "page": number; "excerpt": string }>; "emissionsInputPolicy"?: "source_only"; "supplierResponseReceived"?: boolean; "supplierReportUnavailable"?: boolean; "defaultValueReference"?: string; "defaultValueChecked"?: boolean; "defaultValueSourceId"?: string; "defaultValueYear"?: number; "verificationCoverageStart"?: string; "verificationCoverageEnd"?: string; "workspaceId"?: string; "parentId"?: string | null; "installationName"?: string; "precursorName"?: string; "cnCode"?: string; "catalogProductId"?: string; "productionRoute"?: string; "isScrap"?: boolean; "seeTco2ePerT"?: number | null; "specificEmbeddedDirectTco2PerT"?: number | null; "specificEmbeddedIndirectTco2PerT"?: number | null; "dataOrigin"?: "supplier_verified" | "supplier_unverified" | "default_value"; "monthlyQuantities"?: Array<{ "basis"?: "used" | "received"; "receivedTonnes"?: number; "processId"?: string; "month": string; "tonnes": number }>; "smartLinkToken"?: string; "smartLinkSentAt"?: string; "smartLinkLastSentAt"?: string; "smartLinkOpenedAt"?: string; "smartLinkSubmittedAt"?: string; "addedBy"?: "supplier" | "exporter"; "isChainRoot"?: boolean; "pendingExporterConfirmation"?: boolean; "qtyPerTonneOverride"?: number; "quantityUsedT"?: number; "origin"?: "same_installation" | "purchased"; "supplierCompanyId"?: string; "sourceProcessId"?: string; "latitude"?: number; "longitude"?: number; "installationUniqueId"?: string; "fullAddress"?: string; "reportingPeriodStart"?: string; "reportingPeriodEnd"?: string; "verificationReportFileId"?: string; "verifierName"?: string; "verifierAccreditationNumber"?: string; "verifierAccreditationIssuingCountry"?: string; "verifierAccreditationExpiryDate"?: string; "verificationReportIssueDate"?: string; "verificationReportExpiresAt"?: string; "verificationSectoralScope"?: string; "verificationChecks"?: { "accreditationValid": boolean; "sectoralScopeMatch": boolean; "periodCovered": boolean; "fileIntact": boolean; "failedReasons": Array<string> }; "reducingAgent"?: string; "mnPct"?: number; "crPct"?: number; "niPct"?: number; "otherAlloyingPct"?: number; "scrapRatioTPerT"?: number; "preConsumerScrapPct"?: number; "linkedWorkspaceId"?: string; "valueBasis"?: "default" | "actual"; "originUnknown"?: boolean; "reportingPeriodBasis"?: "default_period" | "actual_time"; "alsoFromOtherInstallations"?: boolean; "sectorParams"?: Record<string, string>; "verifierAddress"?: string; "verifierLeadAuditor"?: string; "verifierAccreditationBody"?: string; "verifierReasonableAssurance"?: boolean } }>>;
 "certrace:final-report-snapshot": Record<string, { "workspaceId": string; "fingerprint": string; "signedAt": string; "doc": Json }>;
 "certrace:report-snapshots:*": Array<{ "version": number; "createdAt": string; "reason": string; "fingerprint": string; "dataset": Json }>;
 "certrace:report-inputs:v1": Record<string, { "0.4"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "country"?: string } }> }; "0.5"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "name"?: string; "email"?: string; "phone"?: string } }> }; "0.6"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "name"?: string; "role"?: string } }> }; "0.7"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "operator"?: string; "exporter"?: string; "basis"?: string } }> }; "1.19"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "operated"?: "" | "yes" | "no" } }> }; "1.20"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "start"?: string; "months"?: string } }> }; "2.0.4"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "date"?: string; "change"?: string; "basis"?: string } }> }; "2.0.5"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "date"?: string; "change"?: string; "basis"?: string } }> }; "2.1.11"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "classification"?: "" | "cbam" | "non_cbam" } }> }; "2.1.12"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "classification"?: "" | "simple" | "complex"; "boundary"?: string; "indirect"?: "" | "yes" | "no"; "legalBasis"?: string } }> }; "2.1.13"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "route"?: string; "equipment"?: string } }> }; "2.1.14"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "basis"?: string; "evidence"?: string } }> }; "2.1.25"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "composition"?: string; "parameter"?: string; "value"?: string; "unit"?: string; "evidence"?: string } }> }; "2.1.26"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "parameter"?: string; "value"?: string; "unit"?: string; "reference"?: string; "evidence"?: string } }> }; "2.2.29"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "version"?: string; "date"?: string; "evidence"?: string } }> }; "2.2.30"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "stream"?: string; "process"?: string; "description"?: string } }> }; "2.2.31"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "stream"?: string; "formula"?: string; "factorSource"?: string; "sampling"?: string; "evidence"?: string } }> }; "2.2.32"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "instrument"?: string; "uncertainty"?: string; "calibrated"?: string; "due"?: string; "evidence"?: string } }> }; "2.2.33"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "source"?: string; "gas"?: "" | "CO2" | "N2O" | "CF4" | "C2F6"; "basis"?: string } }> }; "2.2.34"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "stream"?: string; "basis"?: string; "evidence"?: string } }> }; "2.2.35"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "flow"?: "" | "heat" | "waste_gas" | "co2"; "basis"?: string; "evidence"?: string } }> }; "2.2.36"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "basis"?: "" | "actual" | "default"; "eligibility"?: string; "evidence"?: string } }> }; "2.2.37"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "generation"?: "" | "chp" | "separate"; "fuel"?: "" | "fossil" | "renewable" | "mixed" } }> }; "2.2.38"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "product"?: string; "directShare"?: string; "indirectShare"?: string; "basis"?: string; "evidence"?: string } }> }; "2.2.39"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "method"?: string; "benchmark"?: string; "cbamFactor"?: string; "cscf"?: string; "reference"?: string; "evidence"?: string } }> }; "2.3.29"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "name"?: string; "cn"?: string; "tonnes"?: string } }> }; "2.3.30"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "product"?: string; "route"?: string; "composition"?: string; "quantity"?: string; "tonnes"?: string } }> }; "2.3.31"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "tonnes"?: string; "factor"?: string; "evidence"?: string } }> }; "2.3.32"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "material"?: string; "opening"?: string; "receipts"?: string; "returns"?: string; "closing"?: string; "waste"?: string; "offSpec"?: string; "evidence"?: string } }> }; "2.3.33"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "process"?: string; "share"?: string } }> }; "2.3.34"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "carbon"?: string; "oxidation"?: string; "evidence"?: string } }> }; "2.3.35"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "source"?: string; "gas"?: string; "start"?: string; "end"?: string; "flow"?: string; "concentration"?: string; "gwp"?: string; "evidence"?: string } }> }; "2.3.36"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "supplier"?: string; "installation"?: string; "country"?: string } }> }; "2.3.37"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "process"?: string; "product"?: string; "mwh"?: string } }> }; "2.3.38"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "produced"?: string; "used"?: string; "exported"?: string } }> }; "2.3.39"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "gross"?: string; "ownUse"?: string; "fuelGj"?: string; "heatGj"?: string; "evidence"?: string } }> }; "2.3.40"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "contract"?: string; "start"?: string; "end"?: string; "evidence"?: string } }> }; "2.3.41"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "kind"?: "" | "heat" | "waste_gas"; "imported"?: string; "produced"?: string; "used"?: string; "exported"?: string; "counterpart"?: string; "evidence"?: string } }> }; "2.3.42"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "kind"?: "" | "heat" | "waste_gas"; "factor"?: string; "reference"?: string; "evidence"?: string } }> }; "2.3.43"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "direction"?: "" | "captured" | "received" | "transferred"; "tonnes"?: string; "purpose"?: string; "recipient"?: string; "contact"?: string; "evidence"?: string } }> }; "2.3.44"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "source"?: string; "start"?: string; "end"?: string; "replacement"?: string; "basis"?: string; "evidence"?: string } }> }; "2.3.45"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "source"?: string; "method"?: string; "activity"?: string; "unit"?: string; "factor"?: string; "evidence"?: string } }> }; "2.4.27"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "origin"?: "" | "external" | "internal"; "producingProcess"?: string } }> }; "2.4.28"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "month"?: string; "producingProcess"?: string; "process"?: string; "product"?: string; "produced"?: string; "used"?: string } }> }; "2.4.29"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "process"?: string; "basis"?: string; "evidence"?: string } }> }; "2.4.30"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "basis"?: "" | "default_period" | "actual_production"; "explanation"?: string } }> }; "2.4.31"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "method"?: "" | "weighted" | "subset"; "group"?: string; "start"?: string; "end"?: string; "tonnes"?: string; "evidence"?: string } }> }; "2.4.32"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "supplier"?: string; "location"?: string; "received"?: string; "receivedTonnes"?: string; "evidence"?: string } }> }; "2.4.33"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "category"?: string; "classification"?: "" | "simple" | "complex" } }> }; "2.4.34"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "reference"?: string; "page"?: string; "evidence"?: string } }> }; "2.5.7"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "evidence"?: string; "owner"?: string; "issued"?: string; "version"?: string; "expiry"?: string } }> }; "2.5.8"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "evidence"?: string; "access"?: "" | "verifier" | "internal"; "basis"?: string } }> }; "2.5.9"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "evidence"?: string; "sent"?: string; "recipient"?: string; "version"?: string } }> }; "2.5.10"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "decision"?: "" | "accepted" | "rejected" | "pending"; "reviewer"?: string; "date"?: string; "basis"?: string; "evidence"?: string } }> }; "2.5.11"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "evidence"?: string; "version"?: string } }> }; "2.7.3"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "product"?: string; "criteria"?: "" | "yes" | "no"; "sent"?: "" | "yes" | "no"; "evidence"?: string } }> }; "2.7.4"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "connection"?: "" | "yes" | "no"; "emissions"?: "" | "yes" | "no"; "sent"?: "" | "yes" | "no"; "evidence"?: string } }> }; "2.7.5"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "name"?: string; "eori"?: string } }> }; "2.7.6"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "eori"?: string; "ppa"?: "" | "yes" | "no"; "nomination"?: "" | "yes" | "no"; "congestion"?: "" | "yes" | "no" | "na"; "sent"?: "" | "yes" | "no"; "evidence"?: string } }> }; "2.7.7"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "eori"?: string; "mwh"?: string; "evidence"?: string } }> }; "2.7.8"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "eori"?: string; "version"?: string; "sent"?: string; "recipient"?: string } }> }; "2.7.9"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "reviewer"?: string; "date"?: string; "version"?: string; "reviewed"?: "" | "yes" | "no" } }> }; "2.7.10"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "reviewer"?: string; "date"?: string; "version"?: string; "benchmarks"?: "" | "yes" | "no"; "reviewed"?: "" | "yes" | "no" } }> }; "2.7.11"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "evidence"?: string; "verifier"?: string; "finding"?: string; "status"?: "" | "open" | "resolved" | "no_findings"; "response"?: string } }> }; "2.7.12"?: { "applicability": "yes" | "no" | ""; "reason": string; "updatedAt"?: string; "rows": Array<{ "id": string; "values": { "version"?: string; "sent"?: string; "recipient"?: string; "reason"?: string; "evidence"?: string } }> } }>;
}
export type ReportStoreKey = keyof ReportStoreValues;
