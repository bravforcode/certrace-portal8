/* Thai for the CBAM cost what-if panel on the dashboard (components/factory/what-if-panel.tsx) and the opportunity card it saves
   (lib/factory/what-if.ts). Keyed on the English text, like the other dictionaries. */

export const TH_WHATIF: Record<string, string> = {
  "Simulate CBAM cost": "จำลองต้นทุน CBAM",
  "Product CN {cn}": "CN สินค้า {cn}",
  "Indirect emissions do not count for this good.": "สินค้านี้ไม่นับการปล่อยก๊าซทางอ้อม",
  "Add product quantities in the Products sheet first.": "เพิ่มปริมาณสินค้าในชีต Products ก่อน",
  Today: "ปัจจุบัน",
  Scenario: "สถานการณ์จำลอง",
  "Production (t/year)": "ปริมาณการผลิต (ตัน/ปี)",
  "Exported to the EU (t/year)": "ส่งออกไป EU (ตัน/ปี)",
  "Exported tonnes cannot exceed production.": "ปริมาณที่ส่งออกต้องไม่เกินปริมาณการผลิต",
  "Certificate price (EUR/t CO₂)": "ราคาใบรับรอง (EUR/tCO₂)",
  "Typical EU ETS price; replace with your own": "ราคา EU ETS ทั่วไป กรุณาใส่ราคาของคุณเอง",
  "Supplier actual (t CO₂e/t)": "ค่าจริงจากซัพพลายเออร์ (tCO₂e/t)",
  "Blank uses the default.": "หากเว้นว่างจะใช้ค่าตั้งต้น",
  "Default SEE (t CO₂e/t)": "ค่าตั้งต้น SEE (tCO₂e/t)",
  "Chargeable (t CO₂e per t)": "ที่ต้องชำระ (tCO₂e ต่อตัน)",
  "Certificates (t CO₂e)": "ใบรับรอง (tCO₂e)",
  "Scenario leaves cost unchanged": "สถานการณ์จำลองไม่เปลี่ยนต้นทุน",
  "Scenario lowers cost by {amount}": "สถานการณ์จำลองลดต้นทุนลง {amount}",
  "Scenario raises cost by {amount}": "สถานการณ์จำลองเพิ่มต้นทุนขึ้น {amount}",
  "Save to Opportunities": "บันทึกเป็นโอกาสปรับปรุง",
  "Saved to Opportunities.": "บันทึกเป็นโอกาสปรับปรุงแล้ว",
  "Estimate from EU default factors.": "ประมาณการจากค่าตั้งต้นของ EU",
  "Gross cost before free allocation and any carbon price paid in the country of origin.":
    "ต้นทุนรวมก่อนหักการจัดสรรฟรีและราคาคาร์บอนที่จ่ายในประเทศต้นทาง",
  "Scenario saves €{eur} a year": "สถานการณ์จำลองประหยัดได้ €{eur} ต่อปี",
};
