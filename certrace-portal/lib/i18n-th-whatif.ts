/* Thai for the CBAM cost what-if panel on the dashboard (components/factory/what-if-panel.tsx) and the opportunity card it saves
   (lib/factory/what-if.ts). Keyed on the English text, like the other dictionaries. */

export const TH_WHATIF: Record<string, string> = {
  "Simulate CBAM cost": "จำลองต้นทุน CBAM",
  "Product CN {cn}": "CN สินค้า {cn}",
  "Indirect emissions do not count for this good.": "สินค้านี้ไม่นับการปล่อยก๊าซทางอ้อม",
  "Add product quantities in the Products sheet first.": "เพิ่มปริมาณสินค้าในชีต Products ก่อน",
  Today: "ปัจจุบัน",
  Scenario: "สถานการณ์จำลอง",
  "Exported to the EU (t/year)": "ส่งออกไป EU (ตัน/ปี)",
  "Production is {n} t a year; exports cannot exceed it.": "การผลิต {n} ตันต่อปี การส่งออกต้องไม่เกินนี้",
  "Exported tonnes cannot exceed production.": "ปริมาณที่ส่งออกต้องไม่เกินปริมาณการผลิต",
  "Certificate price (EUR/t CO₂)": "ราคาใบรับรอง (EUR/tCO₂)",
  "Typical EU ETS price; replace with your own": "ราคา EU ETS ทั่วไป กรุณาใส่ราคาของคุณเอง",
  "Supplier actual (t CO₂e/t)": "ค่าจริงจากซัพพลายเออร์ (tCO₂e/t)",
  "Blank uses the default.": "หากเว้นว่างจะใช้ค่าตั้งต้น",
  "Default SEE (t CO₂e/t)": "ค่าตั้งต้น SEE (tCO₂e/t)",
  "Fill in the exported tonnes and price to see the cost.": "กรอกปริมาณที่ส่งออกและราคาเพื่อดูต้นทุน",
  "Chargeable (t CO₂e per t)": "ที่ต้องชำระ (tCO₂e ต่อตัน)",
  "Certificates (t CO₂e)": "ใบรับรอง (tCO₂e)",
  "vs default values": "เทียบกับค่าตั้งต้น",
  "Saves {amount} against default values": "ประหยัดกว่าค่าตั้งต้น {amount}",
  "Costs {amount} more than default values": "สูงกว่าค่าตั้งต้น {amount}",
  "Scenario changes cost by {amount}": "สถานการณ์จำลองเปลี่ยนต้นทุน {amount}",
  "Save as opportunity": "บันทึกเป็นโอกาส",
  "Saved as opportunity.": "บันทึกเป็นโอกาสแล้ว",
  "Estimate from EU default factors.": "ประมาณการจากค่าตั้งต้นของ EU",
  "Gross cost before free allocation and any carbon price paid in the country of origin.":
    "ต้นทุนรวมก่อนหักการจัดสรรฟรีและราคาคาร์บอนที่จ่ายในประเทศต้นทาง",
  "Scenario saves €{eur} a year": "สถานการณ์จำลองประหยัดได้ €{eur} ต่อปี",
};
