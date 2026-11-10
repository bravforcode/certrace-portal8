// Generated report section metadata (no values).
export const sections = [
  {
    "id": "0.4",
    "title": "Operator country",
    "th": "ประเทศของผู้ดำเนินการ",
    "area": "setup",
    "fields": [
      {
        "key": "country",
        "label": "Country (ISO code)",
        "th": "ประเทศ (รหัส ISO)",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "0.5",
    "title": "Company contact",
    "th": "ผู้ติดต่อบริษัท",
    "area": "setup",
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "th": "ชื่อ",
        "kind": "text"
      },
      {
        "key": "email",
        "label": "Email",
        "th": "อีเมล",
        "kind": "email"
      },
      {
        "key": "phone",
        "label": "Telephone",
        "th": "โทรศัพท์",
        "kind": "tel"
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "0.6",
    "title": "Monitoring responsibility",
    "th": "ผู้รับผิดชอบการติดตาม",
    "area": "setup",
    "fields": [
      {
        "key": "name",
        "label": "Responsible person",
        "th": "ผู้รับผิดชอบ",
        "kind": "text"
      },
      {
        "key": "role",
        "label": "Role and responsibilities",
        "th": "ตำแหน่งและหน้าที่",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "0.7",
    "title": "Operator relationships",
    "th": "ความสัมพันธ์ผู้ดำเนินการ",
    "area": "setup",
    "fields": [
      {
        "key": "operator",
        "label": "Operator legal name",
        "th": "ชื่อผู้ดำเนินการ",
        "kind": "text"
      },
      {
        "key": "exporter",
        "label": "Exporter legal name",
        "th": "ชื่อผู้ส่งออก",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "1.19",
    "title": "Installation operation this year",
    "th": "การดำเนินงานโรงงานในปีนี้",
    "area": "setup",
    "fields": [
      {
        "key": "operated",
        "label": "Operated during this reporting year",
        "th": "ดำเนินงานในปีรายงานนี้",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "1.20",
    "title": "New installation monitoring",
    "th": "การติดตามโรงงานใหม่",
    "area": "setup",
    "fields": [
      {
        "key": "start",
        "label": "Operation start date",
        "th": "วันที่เริ่มดำเนินงาน",
        "kind": "date"
      },
      {
        "key": "months",
        "label": "Actual months monitored",
        "th": "จำนวนเดือนที่ติดตามจริง",
        "kind": "number",
        "min": 1,
        "max": 12
      }
    ],
    "required": false,
    "repeat": false
  },
  {
    "id": "2.0.4",
    "title": "Process and boundary changes",
    "th": "การเปลี่ยนกระบวนการและขอบเขต",
    "area": "method",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "date",
        "label": "Effective date",
        "th": "วันที่มีผล",
        "kind": "date"
      },
      {
        "key": "change",
        "label": "Route / boundary change",
        "th": "การเปลี่ยนเส้นทาง / ขอบเขต",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.0.5",
    "title": "Control-system changes",
    "th": "การเปลี่ยนระบบควบคุม",
    "area": "method",
    "fields": [
      {
        "key": "date",
        "label": "Effective date",
        "th": "วันที่มีผล",
        "kind": "date"
      },
      {
        "key": "change",
        "label": "Control-system change",
        "th": "การเปลี่ยนระบบควบคุม",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.1.11",
    "title": "Process classification",
    "th": "ประเภทกระบวนการ",
    "area": "setup",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "classification",
        "label": "Classification",
        "th": "ประเภท",
        "kind": "select",
        "options": [
          {
            "value": "cbam",
            "label": "CBAM",
            "th": "CBAM"
          },
          {
            "value": "non_cbam",
            "label": "Non-CBAM",
            "th": "นอกขอบเขต CBAM"
          }
        ]
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.1.12",
    "title": "Product boundary and composition",
    "th": "ขอบเขตและองค์ประกอบสินค้า",
    "area": "setup",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "classification",
        "label": "Simple / complex good",
        "th": "สินค้าธรรมดา / ซับซ้อน",
        "kind": "select",
        "options": [
          {
            "value": "simple",
            "label": "Simple",
            "th": "ธรรมดา"
          },
          {
            "value": "complex",
            "label": "Complex",
            "th": "ซับซ้อน"
          }
        ]
      },
      {
        "key": "boundary",
        "label": "Emissions boundary",
        "th": "ขอบเขตการปล่อย",
        "kind": "text"
      },
      {
        "key": "indirect",
        "label": "Indirect emissions apply to this CN code",
        "th": "รหัส CN นี้ต้องรวมการปล่อยทางอ้อม",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "legalBasis",
        "label": "CN scope / applicability reference",
        "th": "แหล่งอ้างอิงขอบเขต CN",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.1.13",
    "title": "Product routes and equipment",
    "th": "เส้นทางและอุปกรณ์ของสินค้า",
    "area": "setup",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "route",
        "label": "Production route",
        "th": "เส้นทางการผลิต",
        "kind": "text"
      },
      {
        "key": "equipment",
        "label": "Equipment IDs",
        "th": "รหัสอุปกรณ์",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.1.14",
    "title": "Joint production",
    "th": "การผลิตร่วม",
    "area": "setup",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.1.25",
    "title": "Product composition",
    "th": "องค์ประกอบสินค้าแยกตามสินค้า",
    "area": "setup",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "composition",
        "label": "Composition / grade identifier",
        "th": "รหัสองค์ประกอบ / เกรด",
        "kind": "text"
      },
      {
        "key": "parameter",
        "label": "Parameter (e.g. manganese)",
        "th": "พารามิเตอร์ (เช่น แมงกานีส)",
        "kind": "text"
      },
      {
        "key": "value",
        "label": "Measured value",
        "th": "ค่าที่วัด",
        "kind": "number"
      },
      {
        "key": "unit",
        "label": "Unit",
        "th": "หน่วย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.1.26",
    "title": "Other sector parameters",
    "th": "พารามิเตอร์เฉพาะภาคส่วนอื่น",
    "area": "setup",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "parameter",
        "label": "Applicable sector parameter",
        "th": "พารามิเตอร์ที่ใช้กับภาคส่วน",
        "kind": "text"
      },
      {
        "key": "value",
        "label": "Value",
        "th": "ค่า",
        "kind": "text"
      },
      {
        "key": "unit",
        "label": "Unit",
        "th": "หน่วย",
        "kind": "text"
      },
      {
        "key": "reference",
        "label": "Annex IV section 2 reference",
        "th": "อ้างอิงภาคผนวก IV ข้อ 2",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.29",
    "title": "Monitoring plan versions",
    "th": "รุ่นแผนติดตาม",
    "area": "method",
    "fields": [
      {
        "key": "version",
        "label": "Plan version",
        "th": "รุ่นแผน",
        "kind": "text"
      },
      {
        "key": "date",
        "label": "Effective date",
        "th": "วันที่มีผล",
        "kind": "date"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.2.30",
    "title": "Source streams by process",
    "th": "กระแสแหล่งกำเนิดตามกระบวนการ",
    "area": "method",
    "fields": [
      {
        "key": "stream",
        "label": "Source-stream identifier",
        "th": "รหัสกระแสแหล่งกำเนิด",
        "kind": "text"
      },
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "description",
        "label": "Material / fuel / source description",
        "th": "รายละเอียดวัสดุ / เชื้อเพลิง / แหล่งกำเนิด",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.2.31",
    "title": "Factors and sampling",
    "th": "ตัวประกอบและการเก็บตัวอย่าง",
    "area": "method",
    "fields": [
      {
        "key": "stream",
        "label": "Source-stream identifier",
        "th": "รหัสกระแสแหล่งกำเนิด",
        "kind": "text"
      },
      {
        "key": "formula",
        "label": "Calculation formula",
        "th": "สูตรคำนวณ",
        "kind": "text"
      },
      {
        "key": "factorSource",
        "label": "Factor source and version",
        "th": "ที่มาและรุ่นตัวประกอบ",
        "kind": "text"
      },
      {
        "key": "sampling",
        "label": "Sampling / laboratory method",
        "th": "วิธีเก็บตัวอย่าง / ห้องปฏิบัติการ",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.32",
    "title": "Instrument history",
    "th": "ประวัติเครื่องมือ",
    "area": "method",
    "fields": [
      {
        "key": "instrument",
        "label": "Instrument identifier",
        "th": "รหัสเครื่องมือ",
        "kind": "text"
      },
      {
        "key": "uncertainty",
        "label": "Uncertainty (%)",
        "th": "ความไม่แน่นอน (%)",
        "kind": "number",
        "max": 100
      },
      {
        "key": "calibrated",
        "label": "Calibration date",
        "th": "วันที่สอบเทียบ",
        "kind": "date"
      },
      {
        "key": "due",
        "label": "Next calibration date",
        "th": "วันสอบเทียบครั้งถัดไป",
        "kind": "date"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.33",
    "title": "CEMS source register",
    "th": "ทะเบียนแหล่งกำเนิด CEMS",
    "area": "method",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "source",
        "label": "Source identifier",
        "th": "รหัสแหล่งกำเนิด",
        "kind": "text"
      },
      {
        "key": "gas",
        "label": "Greenhouse gas",
        "th": "ก๊าซเรือนกระจก",
        "kind": "select",
        "options": [
          {
            "value": "CO2",
            "label": "CO₂",
            "th": "CO₂"
          },
          {
            "value": "N2O",
            "label": "N₂O",
            "th": "N₂O"
          },
          {
            "value": "CF4",
            "label": "CF₄",
            "th": "CF₄"
          },
          {
            "value": "C2F6",
            "label": "C₂F₆",
            "th": "C₂F₆"
          }
        ]
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.34",
    "title": "Zero-rated fuel qualification",
    "th": "เงื่อนไขเชื้อเพลิงอัตราศูนย์",
    "area": "method",
    "fields": [
      {
        "key": "stream",
        "label": "Fuel stream",
        "th": "กระแสเชื้อเพลิง",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.35",
    "title": "Transfer and allocation methods",
    "th": "วิธีโอนและปันส่วน",
    "area": "method",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "flow",
        "label": "Flow",
        "th": "ประเภทการไหล",
        "kind": "select",
        "options": [
          {
            "value": "heat",
            "label": "Heat",
            "th": "ความร้อน"
          },
          {
            "value": "waste_gas",
            "label": "Waste gas",
            "th": "ก๊าซทิ้ง"
          },
          {
            "value": "co2",
            "label": "CO₂",
            "th": "CO₂"
          }
        ]
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.36",
    "title": "Electricity method eligibility",
    "th": "เงื่อนไขวิธีไฟฟ้า",
    "area": "method",
    "fields": [
      {
        "key": "source",
        "label": "Electricity source identifier",
        "th": "รหัสแหล่งไฟฟ้า",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Emissions basis",
        "th": "ฐานการปล่อย",
        "kind": "select",
        "options": [
          {
            "value": "actual",
            "label": "Actual",
            "th": "ค่าจริง"
          },
          {
            "value": "default",
            "label": "Official default",
            "th": "ค่ามาตรฐานทางการ"
          }
        ]
      },
      {
        "key": "eligibility",
        "label": "Eligibility and legal reference",
        "th": "เงื่อนไขและอ้างอิงกฎหมาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.37",
    "title": "Own generation type",
    "th": "ประเภทผลิตไฟฟ้าเอง",
    "area": "method",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "generation",
        "label": "Generation",
        "th": "การผลิต",
        "kind": "select",
        "options": [
          {
            "value": "chp",
            "label": "CHP",
            "th": "ความร้อนร่วมไฟฟ้า"
          },
          {
            "value": "separate",
            "label": "Separate generation",
            "th": "ผลิตแยก"
          }
        ]
      },
      {
        "key": "fuel",
        "label": "Energy origin",
        "th": "ที่มาพลังงาน",
        "kind": "select",
        "options": [
          {
            "value": "fossil",
            "label": "Fossil",
            "th": "ฟอสซิล"
          },
          {
            "value": "renewable",
            "label": "Renewable",
            "th": "หมุนเวียน"
          },
          {
            "value": "mixed",
            "label": "Mixed",
            "th": "ผสม"
          }
        ]
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.2.38",
    "title": "Allocation to products",
    "th": "ปันส่วนให้สินค้า",
    "area": "method",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "directShare",
        "label": "Share of process direct emissions (%)",
        "th": "สัดส่วนการปล่อยตรงของกระบวนการ (%)",
        "kind": "number",
        "max": 100
      },
      {
        "key": "indirectShare",
        "label": "Share of process indirect emissions (%)",
        "th": "สัดส่วนการปล่อยทางอ้อม (%)",
        "kind": "number",
        "max": 100
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.2.39",
    "title": "Free-allocation calculation basis",
    "th": "ฐานคำนวณการจัดสรรฟรี",
    "area": "method",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "method",
        "label": "Applicable method and equation",
        "th": "วิธีและสมการที่ใช้",
        "kind": "text"
      },
      {
        "key": "benchmark",
        "label": "Published CBAM benchmark",
        "th": "ค่า benchmark CBAM ที่ประกาศ",
        "kind": "number"
      },
      {
        "key": "cbamFactor",
        "label": "CBAM factor (0–1)",
        "th": "ตัวประกอบ CBAM (0–1)",
        "kind": "number",
        "max": 1
      },
      {
        "key": "cscf",
        "label": "Cross-sectoral correction factor (0–1)",
        "th": "ตัวประกอบแก้ไขข้ามภาคส่วน (0–1)",
        "kind": "number",
        "max": 1
      },
      {
        "key": "reference",
        "label": "Published benchmark / factor citation",
        "th": "แหล่งประกาศ benchmark / ตัวประกอบ",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.29",
    "title": "Non-CBAM output",
    "th": "ผลผลิตนอก CBAM",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "name",
        "label": "Good name",
        "th": "ชื่อสินค้า",
        "kind": "text"
      },
      {
        "key": "cn",
        "label": "CN code",
        "th": "รหัส CN",
        "kind": "text"
      },
      {
        "key": "tonnes",
        "label": "Output (t)",
        "th": "ผลผลิต (ตัน)",
        "kind": "number"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.30",
    "title": "Output split by route",
    "th": "ผลผลิตแยกเส้นทาง",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "route",
        "label": "Production route",
        "th": "เส้นทางการผลิต",
        "kind": "text"
      },
      {
        "key": "composition",
        "label": "Composition / grade (use standard if none)",
        "th": "องค์ประกอบ / เกรด (ระบุ standard ถ้าไม่มี)",
        "kind": "text"
      },
      {
        "key": "quantity",
        "label": "Output in product functional unit",
        "th": "ผลผลิตในหน่วยหน้าที่ของสินค้า",
        "kind": "number"
      },
      {
        "key": "tonnes",
        "label": "Physical output (t)",
        "th": "ผลผลิตจริง (ตัน)",
        "kind": "number"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.31",
    "title": "Functional-unit conversion",
    "th": "แปลงหน่วยหน้าที่",
    "area": "monthly",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "tonnes",
        "label": "Physical output (t)",
        "th": "ผลผลิตจริง (ตัน)",
        "kind": "number"
      },
      {
        "key": "factor",
        "label": "Functional units per tonne",
        "th": "หน่วยหน้าที่ต่อตัน",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.32",
    "title": "Stocks and losses",
    "th": "สต็อกและการสูญเสีย",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "material",
        "label": "Material / good",
        "th": "วัสดุ / สินค้า",
        "kind": "text"
      },
      {
        "key": "opening",
        "label": "Opening stock (t)",
        "th": "สต็อกต้นงวด (ตัน)",
        "kind": "number"
      },
      {
        "key": "receipts",
        "label": "Receipts (t)",
        "th": "รับเข้า (ตัน)",
        "kind": "number"
      },
      {
        "key": "returns",
        "label": "Returns out (t)",
        "th": "คืนออก (ตัน)",
        "kind": "number"
      },
      {
        "key": "closing",
        "label": "Closing stock (t)",
        "th": "สต็อกปลายงวด (ตัน)",
        "kind": "number"
      },
      {
        "key": "waste",
        "label": "Waste (t)",
        "th": "ของเสีย (ตัน)",
        "kind": "number"
      },
      {
        "key": "offSpec",
        "label": "Off-spec output (t)",
        "th": "ผลผลิตนอกสเปก (ตัน)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.33",
    "title": "Source attribution",
    "th": "ระบุแหล่งให้กระบวนการ",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "share",
        "label": "Share attributed (%)",
        "th": "สัดส่วนที่ปันให้ (%)",
        "kind": "number",
        "max": 100
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.34",
    "title": "Measured carbon and oxidation",
    "th": "คาร์บอนและออกซิเดชันที่วัด",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "carbon",
        "label": "Carbon content (t C/t material)",
        "th": "คาร์บอน (ตัน C/ตันวัสดุ)",
        "kind": "number",
        "max": 1
      },
      {
        "key": "oxidation",
        "label": "Oxidation factor (0–1)",
        "th": "ตัวประกอบออกซิเดชัน (0–1)",
        "kind": "number",
        "max": 1
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.35",
    "title": "Continuous measurements",
    "th": "การวัดต่อเนื่อง",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "source",
        "label": "Source identifier",
        "th": "รหัสแหล่งกำเนิด",
        "kind": "text"
      },
      {
        "key": "gas",
        "label": "Greenhouse gas",
        "th": "ก๊าซเรือนกระจก",
        "kind": "text"
      },
      {
        "key": "start",
        "label": "Interval start",
        "th": "เริ่มช่วงวัด",
        "kind": "datetime-local"
      },
      {
        "key": "end",
        "label": "Interval end",
        "th": "สิ้นสุดช่วงวัด",
        "kind": "datetime-local"
      },
      {
        "key": "flow",
        "label": "Dry standard gas flow (Nm³/h)",
        "th": "อัตราไหลก๊าซแห้งมาตรฐาน (Nm³/ชม.)",
        "kind": "number"
      },
      {
        "key": "concentration",
        "label": "Mass concentration (mg/Nm³)",
        "th": "ความเข้มข้นมวล (มก./Nm³)",
        "kind": "number"
      },
      {
        "key": "gwp",
        "label": "Applicable GWP (CO₂ = 1)",
        "th": "GWP ที่ใช้ (CO₂ = 1)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.36",
    "title": "Electricity producer details",
    "th": "รายละเอียดผู้ผลิตไฟฟ้า",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "supplier",
        "label": "Supplier operator",
        "th": "ผู้ดำเนินการผู้จัดหา",
        "kind": "text"
      },
      {
        "key": "installation",
        "label": "Generating installation",
        "th": "โรงงานผลิตไฟฟ้า",
        "kind": "text"
      },
      {
        "key": "country",
        "label": "Country (ISO code)",
        "th": "ประเทศ (รหัส ISO)",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.37",
    "title": "Electricity use by product",
    "th": "ไฟฟ้าที่ใช้แยกสินค้า",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "mwh",
        "label": "Electricity consumed (MWh)",
        "th": "ไฟฟ้าใช้ (MWh)",
        "kind": "number"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.38",
    "title": "On-site electricity balance",
    "th": "สมดุลไฟฟ้าผลิตเอง",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "produced",
        "label": "Produced (MWh)",
        "th": "ผลิต (MWh)",
        "kind": "number"
      },
      {
        "key": "used",
        "label": "Consumed (MWh)",
        "th": "ใช้ (MWh)",
        "kind": "number"
      },
      {
        "key": "exported",
        "label": "Exported (MWh)",
        "th": "ส่งออก (MWh)",
        "kind": "number"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.39",
    "title": "Generation and CHP performance",
    "th": "ประสิทธิภาพการผลิตและ CHP",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "gross",
        "label": "Gross generation (MWh)",
        "th": "ไฟฟ้าผลิตรวม (MWh)",
        "kind": "number"
      },
      {
        "key": "ownUse",
        "label": "Generator own use (MWh)",
        "th": "ไฟฟ้าที่เครื่องกำเนิดใช้เอง (MWh)",
        "kind": "number"
      },
      {
        "key": "fuelGj",
        "label": "Fuel energy input (GJ)",
        "th": "พลังงานเชื้อเพลิงเข้า (GJ)",
        "kind": "number"
      },
      {
        "key": "heatGj",
        "label": "Useful heat (GJ)",
        "th": "ความร้อนใช้ประโยชน์ (GJ)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.40",
    "title": "Power purchase agreement",
    "th": "สัญญาซื้อไฟฟ้า",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "contract",
        "label": "PPA identifier",
        "th": "รหัส PPA",
        "kind": "text"
      },
      {
        "key": "start",
        "label": "Contract start",
        "th": "เริ่มสัญญา",
        "kind": "date"
      },
      {
        "key": "end",
        "label": "Contract end",
        "th": "สิ้นสุดสัญญา",
        "kind": "date"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.41",
    "title": "Heat and waste-gas balances",
    "th": "สมดุลความร้อนและก๊าซทิ้ง",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "kind",
        "label": "Flow type",
        "th": "ประเภท",
        "kind": "select",
        "options": [
          {
            "value": "heat",
            "label": "Heat",
            "th": "ความร้อน"
          },
          {
            "value": "waste_gas",
            "label": "Waste gas",
            "th": "ก๊าซทิ้ง"
          }
        ]
      },
      {
        "key": "imported",
        "label": "Imported (GJ)",
        "th": "นำเข้า (GJ)",
        "kind": "number"
      },
      {
        "key": "produced",
        "label": "Produced (GJ)",
        "th": "ผลิต (GJ)",
        "kind": "number"
      },
      {
        "key": "used",
        "label": "Consumed (GJ)",
        "th": "ใช้ (GJ)",
        "kind": "number"
      },
      {
        "key": "exported",
        "label": "Exported (GJ)",
        "th": "ส่งออก (GJ)",
        "kind": "number"
      },
      {
        "key": "counterpart",
        "label": "Other installation / internal process",
        "th": "โรงงานอื่น / กระบวนการภายใน",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.42",
    "title": "Heat and waste-gas factors",
    "th": "ตัวประกอบความร้อนและก๊าซทิ้ง",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "kind",
        "label": "Flow type",
        "th": "ประเภท",
        "kind": "select",
        "options": [
          {
            "value": "heat",
            "label": "Heat",
            "th": "ความร้อน"
          },
          {
            "value": "waste_gas",
            "label": "Waste gas",
            "th": "ก๊าซทิ้ง"
          }
        ]
      },
      {
        "key": "factor",
        "label": "Emission factor (tCO₂/GJ)",
        "th": "ตัวประกอบการปล่อย (tCO₂/GJ)",
        "kind": "number"
      },
      {
        "key": "reference",
        "label": "Factor source",
        "th": "แหล่งตัวประกอบ",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.43",
    "title": "CO₂ transfers",
    "th": "การโอน CO₂",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "direction",
        "label": "Direction",
        "th": "ทิศทาง",
        "kind": "select",
        "options": [
          {
            "value": "captured",
            "label": "Captured",
            "th": "ดักจับ"
          },
          {
            "value": "received",
            "label": "Received",
            "th": "รับเข้า"
          },
          {
            "value": "transferred",
            "label": "Transferred",
            "th": "ส่งออก"
          }
        ]
      },
      {
        "key": "tonnes",
        "label": "Quantity (tCO₂)",
        "th": "ปริมาณ (tCO₂)",
        "kind": "number"
      },
      {
        "key": "purpose",
        "label": "Storage / permanent binding purpose",
        "th": "วัตถุประสงค์เก็บกัก / ยึดเหนี่ยวถาวร",
        "kind": "text"
      },
      {
        "key": "recipient",
        "label": "Receiving installation / infrastructure",
        "th": "โรงงาน / โครงสร้างพื้นฐานผู้รับ",
        "kind": "text"
      },
      {
        "key": "contact",
        "label": "Responsible person and contact",
        "th": "ผู้รับผิดชอบและช่องทางติดต่อ",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.44",
    "title": "Gaps in source readings",
    "th": "ข้อมูลขาดหายแยกแหล่ง",
    "area": "monthly",
    "fields": [
      {
        "key": "source",
        "label": "Source stream / reading",
        "th": "กระแสแหล่งกำเนิด / ค่าที่วัด",
        "kind": "source"
      },
      {
        "key": "start",
        "label": "Gap start",
        "th": "เริ่มข้อมูลขาด",
        "kind": "date"
      },
      {
        "key": "end",
        "label": "Gap end",
        "th": "สิ้นสุดข้อมูลขาด",
        "kind": "date"
      },
      {
        "key": "replacement",
        "label": "Replacement reading / estimate reference",
        "th": "ค่าแทน / อ้างอิงประมาณการ",
        "kind": "text"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.3.45",
    "title": "Other measurement methods",
    "th": "วิธีวัดอื่น",
    "area": "monthly",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "source",
        "label": "Source identifier",
        "th": "รหัสแหล่งกำเนิด",
        "kind": "text"
      },
      {
        "key": "method",
        "label": "Method / equation",
        "th": "วิธี / สมการ",
        "kind": "text"
      },
      {
        "key": "activity",
        "label": "Activity quantity",
        "th": "ปริมาณกิจกรรม",
        "kind": "number"
      },
      {
        "key": "unit",
        "label": "Activity unit",
        "th": "หน่วยกิจกรรม",
        "kind": "text"
      },
      {
        "key": "factor",
        "label": "Factor (tCO₂e per activity unit)",
        "th": "ตัวประกอบ (tCO₂e ต่อหน่วยกิจกรรม)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.4.27",
    "title": "Precursor origin",
    "th": "แหล่งผลิตสารตั้งต้น",
    "area": "precursor",
    "fields": [
      {
        "key": "origin",
        "label": "Origin",
        "th": "แหล่งผลิต",
        "kind": "select",
        "options": [
          {
            "value": "external",
            "label": "External producer",
            "th": "ผู้ผลิตภายนอก"
          },
          {
            "value": "internal",
            "label": "This installation",
            "th": "โรงงานนี้"
          }
        ]
      },
      {
        "key": "producingProcess",
        "label": "Internal producing process",
        "th": "กระบวนการผลิตภายใน",
        "kind": "process",
        "optional": true
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "2.4.28",
    "title": "Internal precursor movements",
    "th": "การเคลื่อนสารตั้งต้นภายใน",
    "area": "precursor",
    "fields": [
      {
        "key": "month",
        "label": "Month",
        "th": "เดือน",
        "kind": "month"
      },
      {
        "key": "producingProcess",
        "label": "Producing process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "product",
        "label": "Precursor product from the producing process",
        "th": "สินค้าสารตั้งต้นจากกระบวนการผลิตต้นทาง",
        "kind": "product"
      },
      {
        "key": "produced",
        "label": "Produced (t)",
        "th": "ผลิต (ตัน)",
        "kind": "number"
      },
      {
        "key": "used",
        "label": "Used (t)",
        "th": "ใช้ (ตัน)",
        "kind": "number"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.4.29",
    "title": "Same-process exclusion",
    "th": "ยกเว้นภายในกระบวนการเดียวกัน",
    "area": "precursor",
    "fields": [
      {
        "key": "process",
        "label": "Production process",
        "th": "กระบวนการผลิต",
        "kind": "process"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.4.30",
    "title": "Producer reporting period basis",
    "th": "ฐานรอบรายงานผู้ผลิต",
    "area": "precursor",
    "fields": [
      {
        "key": "basis",
        "label": "Period basis",
        "th": "ฐานรอบเวลา",
        "kind": "select",
        "options": [
          {
            "value": "default_period",
            "label": "Default reporting period",
            "th": "รอบรายงานตามกฎ"
          },
          {
            "value": "actual_production",
            "label": "Actual production period",
            "th": "ช่วงผลิตจริง"
          }
        ]
      },
      {
        "key": "explanation",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": false
  },
  {
    "id": "2.4.31",
    "title": "Source combination method",
    "th": "วิธีรวมหลายแหล่ง",
    "area": "precursor",
    "fields": [
      {
        "key": "method",
        "label": "Article 14 method",
        "th": "วิธีตามข้อ 14",
        "kind": "select",
        "options": [
          {
            "value": "weighted",
            "label": "All installations: weighted average",
            "th": "ทุกโรงงาน: เฉลี่ยถ่วงน้ำหนัก"
          },
          {
            "value": "subset",
            "label": "Specific installation / subset",
            "th": "โรงงานเฉพาะ / กลุ่มย่อย"
          }
        ]
      },
      {
        "key": "group",
        "label": "Combination group / subset identifier",
        "th": "รหัสกลุ่มแหล่งที่รวม",
        "kind": "text"
      },
      {
        "key": "start",
        "label": "Source period start",
        "th": "เริ่มรอบแหล่ง",
        "kind": "date"
      },
      {
        "key": "end",
        "label": "Source period end",
        "th": "สิ้นสุดรอบแหล่ง",
        "kind": "date"
      },
      {
        "key": "tonnes",
        "label": "Quantity represented (t)",
        "th": "ปริมาณที่ครอบคลุม (ตัน)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.4.32",
    "title": "Supplier and delivery records",
    "th": "ผู้จัดหาและการรับสินค้า",
    "area": "precursor",
    "fields": [
      {
        "key": "supplier",
        "label": "Supplier / trader legal name",
        "th": "ชื่อผู้จัดหา / ผู้ค้า",
        "kind": "text"
      },
      {
        "key": "location",
        "label": "Source location",
        "th": "ที่ตั้งแหล่ง",
        "kind": "text"
      },
      {
        "key": "received",
        "label": "Receipt date",
        "th": "วันที่รับ",
        "kind": "date"
      },
      {
        "key": "receivedTonnes",
        "label": "Tonnes received",
        "th": "ตันที่รับ",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.4.33",
    "title": "Precursor classification",
    "th": "ประเภทสารตั้งต้น",
    "area": "precursor",
    "fields": [
      {
        "key": "category",
        "label": "CBAM category",
        "th": "หมวด CBAM",
        "kind": "text"
      },
      {
        "key": "classification",
        "label": "Simple / complex",
        "th": "ธรรมดา / ซับซ้อน",
        "kind": "select",
        "options": [
          {
            "value": "simple",
            "label": "Simple",
            "th": "ธรรมดา"
          },
          {
            "value": "complex",
            "label": "Complex",
            "th": "ซับซ้อน"
          }
        ]
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "2.4.34",
    "title": "Producer report references",
    "th": "อ้างอิงรายงานผู้ผลิต",
    "area": "precursor",
    "fields": [
      {
        "key": "reference",
        "label": "Upstream reference in producer report",
        "th": "อ้างอิงต้นน้ำในรายงานผู้ผลิต",
        "kind": "text"
      },
      {
        "key": "page",
        "label": "Report page / table",
        "th": "หน้า / ตาราง",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.5.7",
    "title": "Document register",
    "th": "ทะเบียนเอกสาร",
    "area": "evidence",
    "fields": [
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      },
      {
        "key": "owner",
        "label": "Document owner",
        "th": "เจ้าของเอกสาร",
        "kind": "text"
      },
      {
        "key": "issued",
        "label": "Issue date",
        "th": "วันที่ออก",
        "kind": "date"
      },
      {
        "key": "version",
        "label": "Version",
        "th": "รุ่น",
        "kind": "text"
      },
      {
        "key": "expiry",
        "label": "Expiry date (if any)",
        "th": "วันหมดอายุ (ถ้ามี)",
        "kind": "date",
        "optional": true
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.5.8",
    "title": "Evidence disclosure",
    "th": "การเปิดเผยหลักฐาน",
    "area": "evidence",
    "fields": [
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      },
      {
        "key": "access",
        "label": "Include in verifier package",
        "th": "รวมในชุดสำหรับผู้ทวนสอบ",
        "kind": "select",
        "options": [
          {
            "value": "verifier",
            "label": "Share with verifier",
            "th": "ส่งให้ผู้ทวนสอบ"
          },
          {
            "value": "internal",
            "label": "Internal only",
            "th": "ใช้ภายในเท่านั้น"
          }
        ]
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.5.9",
    "title": "Evidence sent to verifier",
    "th": "หลักฐานที่ส่งผู้ทวนสอบ",
    "area": "evidence",
    "fields": [
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      },
      {
        "key": "sent",
        "label": "Sent date",
        "th": "วันที่ส่ง",
        "kind": "date"
      },
      {
        "key": "recipient",
        "label": "Verifier recipient",
        "th": "ผู้ทวนสอบผู้รับ",
        "kind": "text"
      },
      {
        "key": "version",
        "label": "Report version",
        "th": "รุ่นรายงาน",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.5.10",
    "title": "Review producer verification",
    "th": "ตรวจรายงานผู้ผลิต",
    "area": "precursor",
    "fields": [
      {
        "key": "decision",
        "label": "Review decision",
        "th": "ผลตรวจ",
        "kind": "select",
        "options": [
          {
            "value": "accepted",
            "label": "Accepted after review",
            "th": "ยอมรับหลังตรวจ"
          },
          {
            "value": "rejected",
            "label": "Rejected — use default",
            "th": "ปฏิเสธ — ใช้ค่ามาตรฐาน"
          },
          {
            "value": "pending",
            "label": "Pending review",
            "th": "รอตรวจ"
          }
        ]
      },
      {
        "key": "reviewer",
        "label": "Reviewer",
        "th": "ผู้ตรวจ",
        "kind": "text"
      },
      {
        "key": "date",
        "label": "Review date",
        "th": "วันที่ตรวจ",
        "kind": "date"
      },
      {
        "key": "basis",
        "label": "Method / explanation",
        "th": "วิธีการ / คำอธิบาย",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.5.11",
    "title": "Monitoring plan diagram",
    "th": "แผนภาพแผนติดตาม",
    "area": "method",
    "fields": [
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      },
      {
        "key": "version",
        "label": "Monitoring plan version",
        "th": "รุ่นแผนติดตาม",
        "kind": "text"
      }
    ],
    "required": true,
    "repeat": true
  },
  {
    "id": "2.7.3",
    "title": "Actual indirect electricity criteria",
    "th": "เงื่อนไขค่าไฟฟ้าทางอ้อมจริง",
    "area": "report",
    "fields": [
      {
        "key": "product",
        "label": "Product",
        "th": "สินค้า",
        "kind": "product"
      },
      {
        "key": "criteria",
        "label": "Annex IV point 6 criteria met",
        "th": "ผ่านเงื่อนไขภาคผนวก IV ข้อ 6",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "sent",
        "label": "D.4.3 evidence sent to verifier",
        "th": "ส่งหลักฐาน D.4.3 ให้ผู้ทวนสอบแล้ว",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.4",
    "title": "Imported electricity criteria",
    "th": "เงื่อนไขไฟฟ้านำเข้า",
    "area": "report",
    "fields": [
      {
        "key": "connection",
        "label": "Direct-connection criterion met where applicable",
        "th": "ผ่านเงื่อนไขเชื่อมต่อโดยตรงเมื่อเกี่ยวข้อง",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "emissions",
        "label": "Point 5(c) emissions criterion met",
        "th": "ผ่านเงื่อนไขการปล่อยข้อ 5(c)",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "sent",
        "label": "D.2.4 evidence sent to verifier",
        "th": "ส่งหลักฐาน D.2.4 ให้ผู้ทวนสอบแล้ว",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.5",
    "title": "Declarants",
    "th": "ผู้สำแดง",
    "area": "report",
    "fields": [
      {
        "key": "name",
        "label": "Declarant name",
        "th": "ชื่อผู้สำแดง",
        "kind": "text"
      },
      {
        "key": "eori",
        "label": "EORI",
        "th": "EORI",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.6",
    "title": "Declarant electricity eligibility",
    "th": "สิทธิใช้ค่าไฟฟ้าจริงของผู้สำแดง",
    "area": "report",
    "fields": [
      {
        "key": "eori",
        "label": "EORI",
        "th": "EORI",
        "kind": "text"
      },
      {
        "key": "ppa",
        "label": "Point 5(a) PPA criterion met",
        "th": "ผ่านเงื่อนไข PPA ข้อ 5(a)",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "nomination",
        "label": "Point 5(d) nomination criterion met",
        "th": "ผ่านเงื่อนไขเสนอชื่อข้อ 5(d)",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "congestion",
        "label": "No-congestion criterion",
        "th": "เงื่อนไขไม่แออัด",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Met",
            "th": "ผ่าน"
          },
          {
            "value": "no",
            "label": "Not met",
            "th": "ไม่ผ่าน"
          },
          {
            "value": "na",
            "label": "Not applicable",
            "th": "ไม่เกี่ยวข้อง"
          }
        ]
      },
      {
        "key": "sent",
        "label": "Evidence sent to verifier",
        "th": "ส่งหลักฐานให้ผู้ทวนสอบแล้ว",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.7",
    "title": "Electricity per declarant",
    "th": "ไฟฟ้าแยกผู้สำแดง",
    "area": "report",
    "fields": [
      {
        "key": "eori",
        "label": "EORI",
        "th": "EORI",
        "kind": "text"
      },
      {
        "key": "mwh",
        "label": "Eligible imported electricity (MWh)",
        "th": "ไฟฟ้านำเข้าที่ผ่านเกณฑ์ (MWh)",
        "kind": "number"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.8",
    "title": "Addenda sent to verifier",
    "th": "ภาคผนวกส่งผู้ทวนสอบ",
    "area": "report",
    "fields": [
      {
        "key": "eori",
        "label": "EORI",
        "th": "EORI",
        "kind": "text"
      },
      {
        "key": "version",
        "label": "Addendum version",
        "th": "รุ่นภาคผนวก",
        "kind": "text"
      },
      {
        "key": "sent",
        "label": "Sent date",
        "th": "วันที่ส่ง",
        "kind": "date"
      },
      {
        "key": "recipient",
        "label": "Verifier recipient",
        "th": "ผู้ทวนสอบผู้รับ",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.9",
    "title": "OER review",
    "th": "ตรวจทาน OER",
    "area": "report",
    "fields": [
      {
        "key": "reviewer",
        "label": "Reviewer",
        "th": "ผู้ตรวจทาน",
        "kind": "text"
      },
      {
        "key": "date",
        "label": "Review date",
        "th": "วันที่ตรวจ",
        "kind": "date"
      },
      {
        "key": "version",
        "label": "Dataset snapshot version",
        "th": "รุ่นข้อมูลที่บันทึก",
        "kind": "text"
      },
      {
        "key": "reviewed",
        "label": "OER dataset reviewed",
        "th": "ตรวจข้อมูล OER แล้ว",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "2.7.10",
    "title": "OSER review",
    "th": "ตรวจทาน OSER",
    "area": "report",
    "fields": [
      {
        "key": "reviewer",
        "label": "Reviewer",
        "th": "ผู้ตรวจทาน",
        "kind": "text"
      },
      {
        "key": "date",
        "label": "Review date",
        "th": "วันที่ตรวจ",
        "kind": "date"
      },
      {
        "key": "version",
        "label": "Dataset snapshot version",
        "th": "รุ่นข้อมูลที่บันทึก",
        "kind": "text"
      },
      {
        "key": "benchmarks",
        "label": "Applicable benchmarks and method confirmed",
        "th": "ยืนยัน benchmark และวิธีที่ใช้",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      },
      {
        "key": "reviewed",
        "label": "OSER dataset reviewed",
        "th": "ตรวจข้อมูล OSER แล้ว",
        "kind": "select",
        "options": [
          {
            "value": "yes",
            "label": "Yes",
            "th": "ใช่"
          },
          {
            "value": "no",
            "label": "No",
            "th": "ไม่ใช่"
          }
        ]
      }
    ],
    "required": true,
    "repeat": false
  },
  {
    "id": "2.7.11",
    "title": "Independent verifier findings",
    "th": "ข้อค้นพบผู้ทวนสอบอิสระ",
    "area": "report",
    "fields": [
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      },
      {
        "key": "verifier",
        "label": "Verifier name",
        "th": "ชื่อผู้ทวนสอบ",
        "kind": "text"
      },
      {
        "key": "finding",
        "label": "Finding / opinion",
        "th": "ข้อค้นพบ / ความเห็น",
        "kind": "text"
      },
      {
        "key": "status",
        "label": "Finding status",
        "th": "สถานะ",
        "kind": "select",
        "options": [
          {
            "value": "open",
            "label": "Open",
            "th": "ยังไม่แก้"
          },
          {
            "value": "resolved",
            "label": "Resolved",
            "th": "แก้ไขแล้ว"
          },
          {
            "value": "no_findings",
            "label": "No findings",
            "th": "ไม่มีข้อค้นพบ"
          }
        ]
      },
      {
        "key": "response",
        "label": "Response / resolution reference",
        "th": "คำตอบ / อ้างอิงแก้ไข",
        "kind": "text"
      }
    ],
    "required": false,
    "repeat": true
  },
  {
    "id": "2.7.12",
    "title": "Submissions and corrections",
    "th": "การส่งและแก้ไขรายงาน",
    "area": "report",
    "fields": [
      {
        "key": "version",
        "label": "Dataset snapshot version",
        "th": "รุ่นข้อมูลที่บันทึก",
        "kind": "text"
      },
      {
        "key": "sent",
        "label": "Submission date",
        "th": "วันที่ส่ง",
        "kind": "date"
      },
      {
        "key": "recipient",
        "label": "Recipient",
        "th": "ผู้รับ",
        "kind": "text"
      },
      {
        "key": "reason",
        "label": "Submission / correction reason",
        "th": "เหตุผลส่ง / แก้ไข",
        "kind": "text"
      },
      {
        "key": "evidence",
        "label": "Supporting document",
        "th": "เอกสารหลักฐาน",
        "kind": "evidence"
      }
    ],
    "required": false,
    "repeat": true
  }
] as const;
