/* ── Thai (ไทย): the monthly form for steel and aluminium, the Cera chat, and the installation and package screens ──
   Written the way a Thai compliance writer would put it, not word for word: the sentence is rebuilt in Thai order, regulatory
   terms keep their English beside them where a verifier or an EU template will say it in English, and plain interface
   words stay plain. Keyed by the English source string — see lib/i18n.ts. A key that already exists in i18n-th.ts or
   i18n-th-intake.ts is not repeated here; those win. */

export const TH_SECTOR: Record<string, string> = {
  "1 thing to fix": "ต้องแก้ 1 จุด",
  "{n} things to fix": "ต้องแก้ {n} จุด",
  "1 unless only part of the material converts.":
    "ใส่ 1 เว้นแต่วัสดุเปลี่ยนรูปเพียงบางส่วน",
  "1 — everything burns (default)": "1 — เผาไหม้หมด (ค่าเริ่มต้น)",
  "A biomass fraction above zero needs the sustainability criteria evidenced first — attach it on the Documents step.":
    "หากระบุสัดส่วนชีวมวลมากกว่าศูนย์ ต้องมีหลักฐานว่าเข้าเกณฑ์ความยั่งยืนก่อน — แนบเอกสารได้ที่ขั้นตอนเอกสาร",
  "Add a measured source": "เพิ่มแหล่งที่วัดโดยตรง",
  "Also report this month": "รายงานเพิ่มเติมของเดือนนี้",
  "Anodes and electrodes": "ขั้วบวกและขั้วไฟฟ้า",
  "Anything a verifier should know that the numbers above do not say — a shutdown, a meter swapped mid-month, a figure you had to estimate.":
    "สิ่งที่ผู้ทวนสอบควรรู้ซึ่งตัวเลขข้างต้นไม่ได้บอก เช่น การหยุดเดินเครื่อง การเปลี่ยนมิเตอร์กลางเดือน หรือตัวเลขที่ต้องประมาณเอา",
  "Applies at this installation": "เกี่ยวข้องกับโรงงานนี้",
  "Awaiting the published EU country default — cannot be typed.":
    "รอ EU ประกาศค่า default ของประเทศนี้ — ยังกรอกเองไม่ได้",
  "CO₂ received": "CO₂ ที่รับเข้ามา",
  "CO₂ received and sent on": "CO₂ ที่รับเข้าและส่งต่อ",
  "CO₂ sent on": "CO₂ ที่ส่งต่อ",
  "CO₂ sent on for storage or permanent use": "CO₂ ที่ส่งไปกักเก็บหรือใช้ถาวร",
  "CO₂ that came in from another installation, or went out for permanent storage or to be chemically bound in a product.":
    "CO₂ ที่รับมาจากโรงงานอื่น หรือส่งออกไปกักเก็บถาวร หรือไปเป็นส่วนประกอบทางเคมีของผลิตภัณฑ์",
  "Came in from other installations": "รับเข้าจากโรงงานอื่น",
  "Carbon in ash": "คาร์บอนในเถ้า",
  "Carbon in ash and flue-gas dust": "คาร์บอนในเถ้าและฝุ่นจากไอเสีย",
  "Carbon in, carbon out.": "คาร์บอนเข้า คาร์บอนออก",
  "Continuously measured emissions": "การปล่อยที่วัดต่อเนื่อง",
  "Counted as not emitted, so it comes off the month's emissions. Only what was actually stored or bound.":
    "นับว่าไม่ได้ปล่อย จึงหักออกจากการปล่อยของเดือน เฉพาะส่วนที่กักเก็บหรือตรึงไว้จริงเท่านั้น",
  "Country it is generated in": "ประเทศที่ผลิตไฟฟ้า",
  "Country of origin of the electricity": "ประเทศต้นทางของไฟฟ้า",
  "Electricity sent out": "ไฟฟ้าที่ส่งออก",
  "Electricity sent out of the production process": "ไฟฟ้าที่ส่งออกนอกกระบวนการผลิต",
  "Emissions read by a continuous emissions measurement system on a stack — added to the month's emissions.":
    "การปล่อยที่อ่านจากระบบวัดการปล่อยต่อเนื่อง (CEMS) ที่ปล่องระบาย — นำไปรวมกับการปล่อยของเดือน",
  "Emissions this month": "การปล่อยในเดือนนี้",
  Entered: "กรอกแล้ว",
  Entry: "รายการ",
  "Everything needed is in": "ข้อมูลที่ต้องใช้ครบแล้ว",
  "Everything the whole installation drew": "ไฟฟ้าทั้งหมดที่โรงงานใช้",
  "Fluxes and chemicals": "ฟลักซ์และสารเคมี",
  "Four things most plants have nothing to say about. Each one opens by itself when the installation's own answers say it applies here, and stays shut otherwise — so an empty block is a correct answer, not a gap.":
    "สี่หัวข้อที่โรงงานส่วนใหญ่ไม่มีอะไรต้องรายงาน แต่ละหัวข้อจะเปิดเองเมื่อคำตอบของโรงงานระบุว่าเกี่ยวข้อง และปิดไว้ในกรณีอื่น — ปล่อยว่างจึงเป็นคำตอบที่ถูกต้อง ไม่ใช่ข้อมูลที่ขาด",
  "From the laboratory result.": "จากผลวิเคราะห์ของห้องปฏิบัติการ",
  "Gaps, estimates and notes": "ข้อมูลที่ขาด ค่าประมาณ และหมายเหตุ",
  Gas: "ก๊าซ",
  "Gives an oxidation factor of": "ให้ค่าการเกิดออกซิเดชันเท่ากับ",
  "Goods that are not CBAM goods — only if the plant makes any. Leave empty if it does not.":
    "สินค้าที่ไม่ใช่สินค้า CBAM — กรอกเมื่อโรงงานผลิตจริงเท่านั้น ถ้าไม่มีให้เว้นว่าง",
  "Greenhouse gas": "ก๊าซเรือนกระจก",
  Heat: "ความร้อน",
  "Heat that came in from, or went out to, another installation — and what was made and used on site.":
    "ความร้อนที่รับจากหรือส่งให้โรงงานอื่น รวมถึงที่ผลิตและใช้เองในโรงงาน",
  "In the words your invoices use.": "เรียกตามชื่อที่ใช้ในใบแจ้งหนี้",
  "In tonnes of CO₂ equivalent.": "หน่วยเป็นตันคาร์บอนไดออกไซด์เทียบเท่า",
  "Installation it comes from": "โรงงานต้นทาง",
  "Leave empty if it is the installation's own country.":
    "เว้นว่างได้ถ้าเป็นประเทศเดียวกับที่ตั้งโรงงาน",
  "Leave on 1 unless you measure the carbon left in the ash — 1 is always allowed.":
    "ใส่ 1 ไว้ เว้นแต่คุณวัดคาร์บอนที่เหลือในเถ้า — ใช้ 1 ได้เสมอ",
  "Locked to the EU standard value.": "ล็อกไว้ตามค่ามาตรฐานของ EU",
  "Locked to the published country default.":
    "ล็อกไว้ตามค่า default ของประเทศที่ประกาศไว้",
  "Mass balance": "สมดุลมวลสาร",
  "Measurable heat": "ความร้อนที่วัดได้",
  "Measured emissions": "การปล่อยที่วัดได้",
  "Measured from the ash analysis": "วัดจากการวิเคราะห์เถ้า",
  "Measured source": "แหล่งที่วัด",
  "Name of the fuel": "ชื่อเชื้อเพลิง",
  "Name of the good": "ชื่อสินค้า",
  "Not needed for GJ.": "ไม่ต้องใช้เมื่อหน่วยเป็น GJ",
  "Only if it applies": "เฉพาะเมื่อเกี่ยวข้อง",
  "Only if the plant makes other goods as well — the figure on the main meter. Leave empty if this good is all it makes.":
    "กรอกเมื่อโรงงานผลิตสินค้าอื่นด้วย — ใช้ตัวเลขจากมิเตอร์หลัก ถ้าโรงงานผลิตแต่สินค้านี้ให้เว้นว่าง",
  "Other goods made on the same process": "สินค้าอื่นที่ผลิตจากกระบวนการเดียวกัน",
  "Oxidation factor": "ค่าการเกิดออกซิเดชัน",
  PFC: "PFC",
  "Per gigajoule, never per m³ or litre — a volume factor is roughly 25× out.":
    "ต่อกิกะจูลเท่านั้น ห้ามใช้ต่อ m³ หรือลิตร — ค่าต่อปริมาตรจะคลาดเคลื่อนราว 25 เท่า",
  "Pick a fuel": "เลือกเชื้อเพลิง",
  "Pick the fuel first — the standard value fills in.":
    "เลือกเชื้อเพลิงก่อน ระบบจะเติมค่ามาตรฐานให้",
  "Power made on site that left the boundary of this production process.":
    "ไฟฟ้าที่ผลิตในโรงงานและส่งออกนอกขอบเขตของกระบวนการผลิตนี้",
  "Process gases such as blast-furnace or coke-oven gas, by their energy content.":
    "ก๊าซจากกระบวนการ เช่น ก๊าซเตาถลุง หรือก๊าซเตาอบถ่านโค้ก นับตามปริมาณพลังงาน",
  "Produced here": "ผลิตเองในโรงงาน",
  "Quantity made": "ปริมาณที่ผลิต",
  "Quantity of": "ปริมาณของ",
  "Quantity × the material's factor.": "ปริมาณ × ค่าของวัสดุ",
  "Raw materials": "วัตถุดิบ",
  "Remove entry": "ลบรายการ",
  "Remove good": "ลบสินค้า",
  "Remove measured source": "ลบแหล่งที่วัด",
  "Remove source": "ลบแหล่ง",
  "Reported only. CO₂ that arrives inside a gas is already in that gas's emission factor.":
    "รายงานเท่านั้น CO₂ ที่มากับก๊าซรวมอยู่ในค่าการปล่อยของก๊าซนั้นอยู่แล้ว",
  "Same as the installation": "เหมือนกับโรงงาน",
  "Sent to other installations": "ส่งให้โรงงานอื่น",
  "Skip any that do not apply to this plant.": "ข้ามหัวข้อที่ไม่เกี่ยวข้องกับโรงงานนี้ได้",
  Source: "แหล่ง",
  "Standard method": "วิธีมาตรฐาน",
  "The connected generator's own figure.": "ค่าของโรงไฟฟ้าที่เชื่อมต่อโดยตรง",
  "The factor stated in the power purchase agreement.":
    "ค่าตามที่ระบุในสัญญาซื้อขายไฟฟ้า (PPA)",
  "The generator, by name — and its operator if you know it.":
    "ชื่อโรงไฟฟ้า และชื่อผู้ดำเนินการถ้าทราบ",
  "The stack or unit the instrument sits on.": "ปล่องหรือหน่วยที่ติดตั้งเครื่องวัด",
  "Tonnes of saleable output of this good.": "ปริมาณสินค้าที่ขายได้ เป็นตัน",
  "Tonnes this month.": "ปริมาณเป็นตันในเดือนนี้",
  "Tonnes — negative for an output stream.":
    "ตัน — ใส่ค่าติดลบสำหรับสายที่ออกจากกระบวนการ",
  "Tonnes.": "ตัน",
  "Total carbon": "คาร์บอนทั้งหมด",
  "Total carbon in the fuel burned": "คาร์บอนทั้งหมดในเชื้อเพลิงที่เผา",
  "Total electricity of the installation": "ไฟฟ้าทั้งหมดของโรงงาน",
  "Used here": "ใช้ในโรงงาน",
  "Usually:": "โดยทั่วไป:",
  "Waste gases": "ก๊าซเสียจากกระบวนการ",
  "What this month needs": "สิ่งที่เดือนนี้ยังต้องการ",
  "What was missing or estimated, and anything unusual":
    "ข้อมูลที่ขาดหรือใช้ค่าประมาณ และเหตุการณ์ผิดปกติ",
  "Where the calorific value and factor come from.": "ที่มาของค่าความร้อนและค่าตัวคูณ",
  "Worked out from the fuel rows above flagged for self-generation.":
    "คำนวณจากแถวเชื้อเพลิงด้านบนที่ทำเครื่องหมายว่าใช้ผลิตไฟฟ้าเอง",
  good: "สินค้า",
  "Add a material": "เพิ่มวัสดุ",
  "Added to the month": "รวมเข้ากับเดือนนี้",
  "Aluminium scrap put into the furnace this month, and how much of it came from manufacturing rather than from end-of-life products.":
    "เศษอะลูมิเนียมที่ใส่เข้าเตาในเดือนนี้ และส่วนที่มาจากกระบวนการผลิตเอง ไม่ใช่จากผลิตภัณฑ์ที่หมดอายุการใช้งาน",
  "Anode-effect minutes per cell-day": "นาทีแอโนดเอฟเฟกต์ต่อเซลล์ต่อวัน",
  "Anode-effect overvoltage": "แรงดันเกินจากแอโนดเอฟเฟกต์",
  "Another carbon-bearing material": "วัสดุอื่นที่มีคาร์บอน",
  "Another material — name it": "วัสดุอื่น — ระบุชื่อ",
  "Average for the month.": "ค่าเฉลี่ยของเดือน",
  "Average for the month: anode effects per cell per day, times the minutes each lasts. 0 if there were none.":
    "ค่าเฉลี่ยของเดือน: จำนวนครั้งที่เกิดแอโนดเอฟเฟกต์ต่อเซลล์ต่อวัน คูณด้วยนาทีที่เกิดแต่ละครั้ง ใส่ 0 ถ้าไม่เกิดเลย",
  "Back to the EU factors": "กลับไปใช้ค่าของ EU",
  "Back to the EU standard": "กลับไปใช้ค่ามาตรฐานของ EU",
  "Baked anode": "ขั้วบวกที่อบแล้ว",
  "CF₄ factor": "ค่า CF₄",
  "CO₂ released when a carbonate decomposes — limestone, dolomite, magnesite, soda ash. Pick the material and the tonnes; the figure is the quantity times the EU factor for that material. Leave it empty if the plant adds none.":
    "CO₂ ที่ปล่อยเมื่อคาร์บอเนตสลายตัว เช่น หินปูน โดโลไมต์ แมกนีไซต์ โซดาแอช เลือกวัสดุและใส่ปริมาณเป็นตัน ระบบคำนวณจากปริมาณคูณค่าของ EU สำหรับวัสดุนั้น ถ้าโรงงานไม่ได้เติมให้เว้นว่าง",
  "Carbon it brings:": "คาร์บอนที่นำเข้ามา:",
  "Carbon that goes in is counted as emitted. Carbon that leaves in the product, the slag or a by-product is not — it comes off.":
    "คาร์บอนที่ใส่เข้าไปนับว่าถูกปล่อยออกมา ส่วนคาร์บอนที่ออกไปกับผลิตภัณฑ์ ตะกรัน หรือผลพลอยได้ไม่นับ — หักออก",
  "Carbon that stays in it:": "คาร์บอนที่คงอยู่ในนั้น:",
  "Cell type": "ชนิดเซลล์",
  "Charged to the furnace": "ที่ป้อนเข้าเตา",
  "Consumed this month": "ใช้ไปในเดือนนี้",
  "Count the anode effects one of two ways — minutes per cell per day (the slope method) or the overvoltage — and use the factors for the cell type until you have measured your own.":
    "นับแอโนดเอฟเฟกต์ได้สองวิธี คือนับเป็นนาทีต่อเซลล์ต่อวัน (วิธีความชัน) หรือใช้แรงดันเกิน และใช้ค่าของเซลล์ชนิดนั้นไปก่อนจนกว่าจะวัดค่าของโรงงานเอง",
  "Current efficiency": "ประสิทธิภาพกระแส",
  "C₂F₆ fraction": "สัดส่วน C₂F₆",
  Direction: "ทิศทาง",
  "Duct collection efficiency": "ประสิทธิภาพการดูดเก็บของท่อ",
  "During an anode effect an electrolysis cell emits CF₄ and C₂F₆, gases that warm the atmosphere thousands of times more than CO₂. They are counted as CO₂ equivalent: CF₄ × 6,630 and C₂F₆ × 11,100.":
    "เมื่อเกิดแอโนดเอฟเฟกต์ เซลล์อิเล็กโทรลิซิสจะปล่อย CF₄ และ C₂F₆ ซึ่งทำให้โลกร้อนมากกว่า CO₂ หลายพันเท่า จึงนับเป็นคาร์บอนไดออกไซด์เทียบเท่า: CF₄ × 6,630 และ C₂F₆ × 11,100",
  "EU standard": "ค่ามาตรฐาน EU",
  "Established by field measurement to industry best practice, within ±15%, and renewed at least every three years or when the cells change. Attach the measurement report on the Documents step.":
    "ได้จากการวัดจริงตามแนวปฏิบัติที่ดีที่สุดของอุตสาหกรรม คลาดเคลื่อนไม่เกิน ±15% และต้องทำใหม่อย่างน้อยทุกสามปี หรือเมื่อเซลล์เปลี่ยน แนบรายงานการวัดที่ขั้นตอนเอกสาร",
  "Fluxes and flue-gas chemicals": "ฟลักซ์และสารเคมีบำบัดไอเสีย",
  "Fuels are not entered here; they have their own block. Type a quantity only in the rows the plant uses — the rest stay empty and cost nothing.":
    "เชื้อเพลิงไม่ต้องกรอกตรงนี้ มีส่วนของตัวเองแยกไว้ กรอกปริมาณเฉพาะแถวที่โรงงานใช้ แถวที่เหลือเว้นว่างได้โดยไม่มีผลใด ๆ",
  "Goes in — counted as emitted": "ใส่เข้าไป — นับว่าปล่อย",
  "How the anode effects are counted": "วิธีนับแอโนดเอฟเฟกต์",
  "I have my own measured factors": "ฉันมีค่าที่วัดเอง",
  "In the duct": "ในท่อดูดไอเสีย",
  "Leave empty if the plant melts no scrap.": "ถ้าโรงงานไม่หลอมเศษโลหะให้เว้นว่าง",
  "Leaves — carbon stays in it": "ออกไป — คาร์บอนคงอยู่ในนั้น",
  "Leaving in the product and by-products": "ที่ออกไปกับผลิตภัณฑ์และผลพลอยได้",
  "Measure your own factors": "ต้องวัดค่าเอง",
  "Minutes per cell-day (slope)": "นาทีต่อเซลล์ต่อวัน",
  "Name of the material": "ชื่อวัสดุ",
  "Net from the carbon balance:": "สุทธิจากสมดุลคาร์บอน:",
  "No EU factor for the overvoltage method": "EU ไม่มีค่าสำหรับวิธี overvoltage",
  "None recorded. Leave empty if no flux or chemical was added.":
    "ยังไม่มีรายการ ถ้าไม่ได้เติมฟลักซ์หรือสารเคมีให้เว้นว่าง",
  "Not in the EU table; you give its carbon content":
    "ไม่มีในตารางของ EU ต้องระบุค่าคาร์บอนเอง",
  "Nothing to enter here for this process — its emissions are the fuel it burns and the electricity it draws.":
    "กระบวนการนี้ไม่มีอะไรต้องกรอกตรงนี้ — การปล่อยมาจากเชื้อเพลิงที่เผาและไฟฟ้าที่ใช้",
  "Offcuts, trimmings and rejects from manufacturing — not end-of-life scrap.":
    "เศษตัด เศษขอบ และของเสียจากการผลิต — ไม่ใช่เศษจากผลิตภัณฑ์ที่หมดอายุการใช้งาน",
  Overvoltage: "แรงดันเกิน",
  "Own CF₄ factor": "ค่า CF₄ ที่วัดเอง",
  "Own C₂F₆ fraction": "สัดส่วน C₂F₆ ที่วัดเอง",
  "PFC from anode effects": "PFC จากแอโนดเอฟเฟกต์",
  "PFC method": "วิธีคำนวณ PFC",
  "Pick the cell type": "เลือกชนิดเซลล์",
  "Pre-consumer scrap": "เศษโลหะจากกระบวนการผลิต",
  "Primary aluminium made": "อะลูมิเนียมปฐมภูมิที่ผลิตได้",
  "Primary smelting only. Zero minutes is a valid answer — enter it rather than leaving the box empty.":
    "เฉพาะโรงถลุงอะลูมิเนียมปฐมภูมิ ใส่ 0 นาทีได้ถ้าไม่เกิดเลย — ให้กรอก 0 แทนการเว้นว่าง",
  "Raw materials and carbon": "วัตถุดิบและคาร์บอน",
  "Same as production": "เท่ากับปริมาณผลิต",
  "Scrap melted": "เศษโลหะที่หลอม",
  "Sets the EU factors used until you have your own.":
    "กำหนดค่าของ EU ที่ใช้ไปก่อนจนกว่าจะมีค่าที่วัดเอง",
  "Share collected by the duct": "สัดส่วนที่ท่อดูดเก็บได้",
  "The EU gives no slope factor for this cell type. Until you have measured your own, the centre-worked prebake values are used, as the rules allow.":
    "EU ไม่มีค่าความชัน สำหรับเซลล์ชนิดนี้ จึงใช้ค่าของเซลล์พรีเบกแบบป้อนกลางเซลล์แทนจนกว่าจะวัดค่าเองได้ ซึ่งกฎอนุญาตไว้",
  "The figure appears once the cell type, the anode-effect reading and the duct share are in.":
    "ตัวเลขจะแสดงเมื่อกรอกชนิดเซลล์ ค่าแอโนดเอฟเฟกต์ และสัดส่วนที่ท่อดูดเก็บได้ครบ",
  "The most common way": "วิธีที่ใช้กันมากที่สุด",
  "The report states tonnes of scrap per tonne of metal and the pre-consumer share. Unwrought aluminium bought in and added is not scrap — it is a precursor, entered on the Precursors tab.":
    "รายงานระบุปริมาณเศษโลหะต่อตันโลหะและสัดส่วน pre-consumer ส่วนอะลูมิเนียมดิบที่ซื้อมาเติมไม่ใช่เศษโลหะ แต่เป็นวัตถุดิบตั้งต้น ให้กรอกที่แท็บวัตถุดิบตั้งต้น",
  "Time-integrated voltage above target, averaged over the month. 0 if none.":
    "แรงดันที่เกินค่าเป้าหมายแบบอินทิเกรตตามเวลา เฉลี่ยทั้งเดือน ใส่ 0 ถ้าไม่มี",
  "Tonnes charged this month.": "ปริมาณที่ป้อนเข้าเตาในเดือนนี้ เป็นตัน",
  "Tonnes of C₂F₆ per tonne of CF₄.": "C₂F₆ กี่ตันต่อ CF₄ หนึ่งตัน",
  "Tonnes of carbon per tonne of material — from the supplier's specification or your own analysis. The EU table has no value for this one.":
    "ตันคาร์บอนต่อตันวัสดุ — จากสเปกของซัพพลายเออร์หรือผลวิเคราะห์ของโรงงานเอง ตารางของ EU ไม่มีค่าสำหรับวัสดุนี้",
  "Tonnes this month. Empty means the production figure above.":
    "ปริมาณเป็นตันในเดือนนี้ ถ้าเว้นว่างจะใช้ปริมาณผลิตด้านบน",
  "Tonnes used this month.": "ปริมาณที่ใช้ในเดือนนี้ เป็นตัน",
  "Use my own value": "ใช้ค่าของฉันเอง",
  "What is measured in the duct is divided by this to include fume that escapes. From your last field measurement; 100 only if the collection is complete.":
    "ค่าที่วัดในท่อจะหารด้วยตัวเลขนี้เพื่อรวมไอที่รั่วออกไป ใช้ผลวัดครั้งล่าสุด ใส่ 100 เมื่อดูดเก็บได้ครบทั้งหมดเท่านั้น",
  "Where the anode-effect voltage is recorded":
    "ใช้เมื่อบันทึกแรงดันของแอโนดเอฟเฟกต์ไว้",
  "Your analysis. The EU standard is": "ค่าจากผลวิเคราะห์ของคุณ ค่ามาตรฐาน EU คือ",
  "Your own factors": "ค่าที่คุณวัดเอง",
  "carbon in, minus carbon that leaves.": "คาร์บอนเข้า หักคาร์บอนที่ออกไป",
  "kg of CF₄ per tonne of aluminium, per anode-effect minute per cell-day.":
    "กิโลกรัม CF₄ ต่อตันอะลูมิเนียม ต่อนาทีแอโนดเอฟเฟกต์ต่อเซลล์ต่อวัน",
  "kg of CF₄ per tonne of aluminium, per mV.": "กิโลกรัม CF₄ ต่อตันอะลูมิเนียม ต่อ mV",
  "of scrap per tonne made": "ของเศษโลหะต่อตันที่ผลิต",
  "of which pre-consumer": "ในนั้นเป็น pre-consumer",
  "pre-consumer": "pre-consumer",
  "t C per t — used unless you have your own analysis.":
    "ตันคาร์บอนต่อตัน — ใช้ค่านี้ เว้นแต่คุณมีผลวิเคราะห์ของตัวเอง",
  "% carbon": "% คาร์บอน",
  "% non-aluminium elements": "% ธาตุที่ไม่ใช่อะลูมิเนียม",
  "% other alloys": "% ธาตุผสมอื่น",
  "% other materials": "% วัสดุอื่น",
  "% pre-consumer scrap": "% เศษโลหะ pre-consumer",
  "A primary smelter emits CF₄ and C₂F₆ during anode effects. The monitoring plan says how they are counted, for which cells, and on whose factors — once for the year. The monthly figures then follow what is written here.":
    "โรงถลุงอะลูมิเนียมปฐมภูมิปล่อย CF₄ และ C₂F₆ ระหว่างแอโนดเอฟเฟกต์ แผนการติดตามระบุว่านับอย่างไร กับเซลล์ชนิดใด และใช้ค่าของใคร — เขียนครั้งเดียวต่อปี แล้วตัวเลขรายเดือนจะเป็นไปตามที่เขียนไว้ตรงนี้",
  "Date the PFC factors were last measured": "วันที่วัดค่า PFC ครั้งล่าสุด",
  "How PFC is monitored": "การติดตาม PFC",
  "How the duct's collection efficiency was determined":
    "วิธีหาประสิทธิภาพการดูดเก็บของท่อ",
  "Last measured": "วัดครั้งล่าสุด",
  "Non-aluminium elements mass percent": "เปอร์เซ็นต์โดยมวลของธาตุที่ไม่ใช่อะลูมิเนียม",
  "Over the year. Your monthly scrap figures give it; enter the annual one here if you keep it.":
    "เฉลี่ยทั้งปี ตัวเลขเศษโลหะรายเดือนของคุณใช้คำนวณให้ได้ หรือกรอกค่ารายปีตรงนี้ถ้าคุณเก็บไว้",
  "PFC factor source": "ที่มาของค่า PFC",
  "PFC monitoring": "การติดตาม PFC",
  "Plants start from the EU factors for the cell type. Their own factors, measured in the field to within ±15%, replace them and are renewed at least every three years.":
    "โรงงานเริ่มจากค่าของ EU ตามชนิดเซลล์ ค่าที่วัดเองในพื้นที่จริงโดยคลาดเคลื่อนไม่เกิน ±15% ใช้แทนได้ และต้องทำใหม่อย่างน้อยทุกสามปี",
  "Primary smelting only. Written once for the year.":
    "เฉพาะโรงถลุงอะลูมิเนียมปฐมภูมิ เขียนครั้งเดียวต่อปี",
  "Renewed at least every three years, or sooner if the cells or their control change.":
    "ต้องวัดใหม่อย่างน้อยทุกสามปี หรือเร็วกว่านั้นหากเซลล์หรือระบบควบคุมเปลี่ยน",
  "The EU table for the cell type": "ตารางของ EU ตามชนิดเซลล์",
  "The EU table for the cell type, or factors the plant measured itself.":
    "ตารางของ EU ตามชนิดเซลล์ หรือค่าที่โรงงานวัดเอง",
  "The plant's own field measurement": "ค่าที่โรงงานวัดเองในพื้นที่จริง",
  "The share of the metal that is alloying elements, where any one is above 1%.":
    "สัดส่วนธาตุผสมในโลหะ เมื่อมีธาตุใดธาตุหนึ่งเกิน 1%",
  "Tonnes of scrap per tonne of aluminium": "ตันเศษโลหะต่อตันอะลูมิเนียม",
  "What is measured in the duct is divided by it, so the figure includes fume that escapes the duct.":
    "ค่าที่วัดในท่อหารด้วยตัวเลขนี้ ตัวเลขจึงรวมไอที่หลุดจากท่อด้วย",
  "Whose factors": "ใช้ค่าของใคร",
  "Annual paperwork — the licence and the calibration records — sits outside the twelve months and is counted separately below. The carbon-price receipt is attached on the product's Carbon price tab.":
    "เอกสารรายปี เช่น ใบอนุญาตและบันทึกการสอบเทียบ อยู่นอกสิบสองเดือนและนับแยกไว้ด้านล่าง ส่วนใบเสร็จราคาคาร์บอนแนบที่แท็บราคาคาร์บอนของผลิตภัณฑ์",
  Described: "เขียนแล้ว",
  Materials: "วัสดุ",
  "Materials and fluxes CO₂": "CO₂ จากวัสดุและฟลักซ์",
  "No annual paperwork attached yet — the licence and the calibration records live on the installation's Readiness, outside the twelve months; a carbon-price receipt goes on the Carbon price tab.":
    "ยังไม่มีเอกสารรายปีที่แนบ — ใบอนุญาตและบันทึกการสอบเทียบอยู่ที่ความพร้อมของโรงงาน นอกสิบสองเดือน ส่วนใบเสร็จราคาคาร์บอนแนบที่แท็บราคาคาร์บอน",
  "PFC CO₂e": "PFC (CO₂e)",
  Partly: "บางส่วน",
  "Sector parameters": "ค่าเฉพาะของอุตสาหกรรม",
  "Has a note": "มีหมายเหตุ",
  "Steel scrap charged": "เศษเหล็กกล้าที่ป้อนเข้าเตา",
  "Tonnes of steel scrap put into the furnace this month.":
    "ปริมาณเศษเหล็กกล้าที่ป้อนเข้าเตาในเดือนนี้ เป็นตัน",
  "Iron scrap charged": "เศษเหล็กหล่อที่ป้อนเข้าเตา",
  "Cast iron and other iron scrap — tonnes.": "เศษเหล็กหล่อและเศษเหล็กอื่น ๆ เป็นตัน",
  "Direct reduced iron (DRI) charged": "เหล็กรีดิวซ์โดยตรง (DRI) ที่ป้อนเข้าเตา",
  "Tonnes of DRI put into the furnace.": "ปริมาณ DRI ที่ป้อนเข้าเตา เป็นตัน",
  "Hot briquetted iron (HBI) charged": "เหล็กอัดก้อนร้อน (HBI) ที่ป้อนเข้าเตา",
  "Tonnes of HBI put into the furnace.": "ปริมาณ HBI ที่ป้อนเข้าเตา เป็นตัน",
  "Pig iron bought in": "เหล็กดิบที่ซื้อเข้ามา",
  "Pig iron or hot metal that came from outside this installation — tonnes.":
    "เหล็กดิบหรือเหล็กหลอมเหลวที่มาจากนอกโรงงานนี้ เป็นตัน",
  "Carbon electrodes consumed": "ขั้วไฟฟ้าคาร์บอนที่ใช้ไป",
  "Tonnes of electrode and electrode paste used up this month.":
    "ปริมาณขั้วไฟฟ้าและแป้งขั้วไฟฟ้าที่ใช้หมดไปในเดือนนี้ เป็นตัน",
  "Charge carbon": "คาร์บอนที่ป้อนเข้าเตา",
  "Coal, anthracite or coke added to the furnace as a carbon source — tonnes.":
    "ถ่านหิน แอนทราไซต์ หรือถ่านโค้กที่เติมเข้าเตาเป็นแหล่งคาร์บอน เป็นตัน",
  "Petroleum coke": "ถ่านโค้กปิโตรเลียม",
  "Tonnes used as a carbon source.": "ปริมาณที่ใช้เป็นแหล่งคาร์บอน เป็นตัน",
  "Crude steel leaving": "เหล็กกล้าที่ออกจากเตา",
  "Tonnes of steel made — normally the same as production. Its carbon stays in the steel instead of being emitted.":
    "ปริมาณเหล็กกล้าที่ผลิตได้ เป็นตัน — ปกติเท่ากับปริมาณผลิต คาร์บอนในเหล็กคงอยู่ในเนื้อเหล็กแทนที่จะถูกปล่อย",
  "Sintering — iron ore is agglomerated by burning fuel. Most of the CO₂ comes from the fuel and the flux.":
    "การเผาผนึก — แร่เหล็กถูกรวมเป็นก้อนด้วยการเผาเชื้อเพลิง CO₂ ส่วนใหญ่มาจากเชื้อเพลิงและฟลักซ์",
  "Coke breeze, coal, natural gas and any process gas used to fire the sinter strand.":
    "ผงถ่านโค้ก ถ่านหิน ก๊าซธรรมชาติ และก๊าซจากกระบวนการที่ใช้เผาสายพานซินเตอร์",
  "Limestone and dolomite added to the sinter mix.":
    "หินปูนและโดโลไมต์ที่ผสมในส่วนผสมซินเตอร์",
  "Smelting reduction — iron ore reduced in a smelter.":
    "การถลุงแบบรีดักชัน — แร่เหล็กถูกรีดิวซ์ในเตาถลุง",
  "Blast furnace — iron ore reduced with coke and injected coal.":
    "เตาถลุง — แร่เหล็กถูกรีดิวซ์ด้วยถ่านโค้กและถ่านหินที่พ่นเข้าไป",
  "Scrap charged": "เศษโลหะที่ป้อนเข้าเตา",
  "Iron or steel scrap put into the furnace — tonnes. Leave empty if none.":
    "เศษเหล็กหรือเหล็กกล้าที่ป้อนเข้าเตา เป็นตัน ถ้าไม่มีให้เว้นว่าง",
  "Pig iron leaving": "เหล็กดิบที่ออกจากเตา",
  "Tonnes of pig iron tapped or sold. Its carbon stays in the iron instead of being emitted.":
    "ปริมาณเหล็กดิบที่เทออกหรือขาย เป็นตัน คาร์บอนคงอยู่ในเนื้อเหล็กแทนที่จะถูกปล่อย",
  "Furnace or converter gas sent out": "ก๊าซจากเตาหรือเตาแปลงเหล็กที่ส่งออก",
  "Tonnes of gas sent to another user — only if it is weighed, not counted by energy.":
    "ปริมาณก๊าซที่ส่งให้ผู้ใช้อื่น เป็นตัน — เฉพาะกรณีที่ชั่งน้ำหนักจริง ไม่ใช่นับตามพลังงาน",
  "Coke, coke dust, injected coal, natural gas, fuel oil, plastic waste, charcoal and the process gases of the furnace.":
    "ถ่านโค้ก ฝุ่นโค้ก ถ่านหินที่พ่นเข้าเตา ก๊าซธรรมชาติ น้ำมันเตา ขยะพลาสติก ถ่านไม้ และก๊าซจากกระบวนการของเตา",
  "Limestone, dolomite and magnesite charged as flux, and any flue-gas cleaning chemicals.":
    "หินปูน โดโลไมต์ และแมกนีไซต์ที่ใส่เป็นฟลักซ์ รวมถึงสารเคมีบำบัดไอเสีย",
  "Direct reduction — iron ore reduced in the solid state, without melting it.":
    "การรีดิวซ์โดยตรง — รีดิวซ์แร่เหล็กในสถานะของแข็งโดยไม่หลอมละลาย",
  "DRI or HBI leaving": "DRI หรือ HBI ที่ออกจากเตา",
  "Tonnes of iron sponge, DRI or HBI made. Its carbon stays in the product instead of being emitted.":
    "ปริมาณเหล็กพรุน DRI หรือ HBI ที่ผลิตได้ เป็นตัน คาร์บอนคงอยู่ในผลิตภัณฑ์แทนที่จะถูกปล่อย",
  "Natural gas, other fossil fuels or biomass used as the reducing agent and for heating. Hydrogen used as a reductant is a precursor, not a fuel.":
    "ก๊าซธรรมชาติ เชื้อเพลิงฟอสซิลอื่น หรือชีวมวลที่ใช้เป็นตัวรีดิวซ์และให้ความร้อน ส่วนไฮโดรเจนที่ใช้เป็นตัวรีดิวซ์นับเป็นวัตถุดิบตั้งต้น ไม่ใช่เชื้อเพลิง",
  "Any flue-gas cleaning chemicals; carbonates only if the plant adds them.":
    "สารเคมีบำบัดไอเสียทุกชนิด ส่วนคาร์บอเนตกรอกเฉพาะเมื่อโรงงานเติมจริง",
  "Ferro-alloys — made by reducing ore with carbon in an electric furnace.":
    "เหล็กผสม — ผลิตโดยรีดิวซ์แร่ด้วยคาร์บอนในเตาไฟฟ้า",
  "Reducing carbon charged": "คาร์บอนตัวรีดิวซ์ที่ป้อนเข้าเตา",
  "Coke, coal or charcoal added as the reducing agent — tonnes.":
    "ถ่านโค้ก ถ่านหิน หรือถ่านไม้ที่เติมเป็นตัวรีดิวซ์ เป็นตัน",
  "Alloy leaving": "เหล็กผสมที่ออกจากเตา",
  "Tonnes of alloy made, with the carbon content of your own analysis — the EU table has no standard value for it.":
    "ปริมาณเหล็กผสมที่ผลิตได้ เป็นตัน พร้อมค่าคาร์บอนจากผลวิเคราะห์ของโรงงานเอง — ตารางของ EU ไม่มีค่ามาตรฐานสำหรับวัสดุนี้",
  "Fuels and reducing agents of the furnace, whether burned for energy or used as a material.":
    "เชื้อเพลิงและตัวรีดิวซ์ของเตา ไม่ว่าจะเผาเอาพลังงานหรือใช้เป็นวัสดุ",
  "Limestone and any flue-gas cleaning chemicals.": "หินปูนและสารเคมีบำบัดไอเสีย",
  "Basic oxygen steelmaking — hot metal from the blast furnace is refined in an oxygen converter.":
    "การผลิตเหล็กกล้าด้วยเตาออกซิเจน (BOF) — เหล็กหลอมเหลวจากเตาถลุงถูกกลั่นในเตาแปลงออกซิเจน",
  "Pig iron or hot metal bought in": "เหล็กดิบหรือเหล็กหลอมเหลวที่ซื้อเข้ามา",
  "Only what came from outside this installation — tonnes.":
    "เฉพาะที่มาจากนอกโรงงานนี้ เป็นตัน",
  "Tonnes of DRI put into the converter.": "ปริมาณ DRI ที่ป้อนเข้าเตาแปลง เป็นตัน",
  "Converter gas sent out": "ก๊าซจากเตาแปลงที่ส่งออก",
  "Tonnes of oxygen steel furnace gas sent to another user — only if it is weighed, not counted by energy.":
    "ปริมาณก๊าซจากเตาออกซิเจนที่ส่งให้ผู้ใช้อื่น เป็นตัน — เฉพาะกรณีที่ชั่งน้ำหนักจริง ไม่ใช่นับตามพลังงาน",
  "Natural gas, fuel oil, coal and the process gases (blast-furnace, coke-oven, converter) used for heating, ladle preheating and reheating.":
    "ก๊าซธรรมชาติ น้ำมันเตา ถ่านหิน และก๊าซจากกระบวนการ (เตาถลุง เตาอบถ่านโค้ก เตาแปลง) ที่ใช้ให้ความร้อน อุ่นกระบวยเหล็ก และอุ่นซ้ำ",
  "Electric arc furnace — scrap or direct reduced iron melted with electricity and carbon electrodes.":
    "เตาอาร์คไฟฟ้า (EAF) — หลอมเศษเหล็กหรือ DRI ด้วยไฟฟ้าและขั้วไฟฟ้าคาร์บอน",
  "Natural gas, fuel oil and coal for burners, ladle preheating and reheating before casting or rolling.":
    "ก๊าซธรรมชาติ น้ำมันเตา และถ่านหินสำหรับหัวเผา อุ่นกระบวยเหล็ก และอุ่นซ้ำก่อนหล่อหรือรีด",
  "Further processing — reheating, rolling, forging, annealing, drawing, pickling or coating. The steel itself comes in as a precursor.":
    "การแปรรูปต่อ — อุ่นซ้ำ รีด ตีขึ้นรูป อบอ่อน ดึงลวด ล้างกรด หรือเคลือบ ตัวเหล็กเองเข้ามาเป็นวัตถุดิบตั้งต้น",
  "Natural gas, fuel oil and process gas for reheating and annealing furnaces; fuel for coating and galvanising lines.":
    "ก๊าซธรรมชาติ น้ำมันเตา และก๊าซจากกระบวนการสำหรับเตาอุ่นซ้ำและเตาอบอ่อน รวมถึงเชื้อเพลิงของสายการผลิตเคลือบและชุบสังกะสี",
  "Only the chemicals of flue-gas treatment, if there are any.":
    "เฉพาะสารเคมีบำบัดไอเสีย ถ้ามี",
  "Primary smelting, Søderberg cells — alumina is electrolysed with a self-baking anode paste.":
    "การถลุงปฐมภูมิ เซลล์ Søderberg — อะลูมินาถูกแยกด้วยไฟฟ้าโดยใช้แป้งขั้วบวกแบบอบตัวเอง",
  "Primary smelting, prebake cells — alumina is electrolysed with baked carbon anodes.":
    "การถลุงปฐมภูมิ เซลล์พรีเบก — อะลูมินาถูกแยกด้วยไฟฟ้าโดยใช้ขั้วบวกคาร์บอนที่อบแล้ว",
  "Anode paste consumed": "แป้งขั้วบวกที่ใช้ไป",
  "Anodes consumed": "ขั้วบวกที่ใช้ไป",
  "Tonnes used up this month, with the carbon content from the supplier's specification or your analysis — the EU table has no standard value.":
    "ปริมาณที่ใช้หมดไปในเดือนนี้ เป็นตัน พร้อมค่าคาร์บอนจากสเปกของซัพพลายเออร์หรือผลวิเคราะห์ของโรงงาน — ตารางของ EU ไม่มีค่ามาตรฐาน",
  "Other carbon electrodes or paste": "ขั้วไฟฟ้าหรือแป้งคาร์บอนอื่น ๆ",
  "Cathode, ramming or baking paste consumed — tonnes, with its own carbon content.":
    "ขั้วลบ แป้งอัด หรือแป้งอบที่ใช้ไป เป็นตัน พร้อมค่าคาร์บอนของวัสดุนั้น",
  "Fuel for anode baking, for drying and preheating raw materials, for heating the cells and for casting.":
    "เชื้อเพลิงสำหรับอบขั้วบวก อบแห้งและอุ่นวัตถุดิบ ให้ความร้อนแก่เซลล์ และหล่อโลหะ",
  "Soda ash or limestone used to clean the flue gas.":
    "โซดาแอชหรือหินปูนที่ใช้บำบัดไอเสีย",
  "Secondary melting — aluminium scrap is melted and cast. Unwrought aluminium bought in and added is a precursor, not scrap.":
    "การหลอมทุติยภูมิ — หลอมและหล่อเศษอะลูมิเนียม ส่วนอะลูมิเนียมดิบที่ซื้อมาเติมนับเป็นวัตถุดิบตั้งต้น ไม่ใช่เศษโลหะ",
  "Fuel for drying and preheating scrap, for the melting furnaces, for de-coating and de-oiling, for burning off the residues, for treating skimmings and for casting.":
    "เชื้อเพลิงสำหรับอบแห้งและอุ่นเศษโลหะ เตาหลอม การลอกสีและล้างน้ำมัน การเผากำจัดเศษตกค้าง การจัดการขี้ตะกรัน และการหล่อ",
  "Further processing — casting, homogenising, rolling, extruding, annealing or coating. The metal comes in as a precursor.":
    "การแปรรูปต่อ — หล่อ อบปรับเนื้อโลหะ รีด รีดขึ้นรูป อบอ่อน หรือเคลือบ ตัวโลหะเข้ามาเป็นวัตถุดิบตั้งต้น",
  "Fuel for remelting, casting, homogenising, annealing and coating furnaces.":
    "เชื้อเพลิงสำหรับเตาหลอมซ้ำ หล่อ อบปรับเนื้อโลหะ อบอ่อน และเคลือบ",
  "Legacy point-feed prebake": "เซลล์พรีเบกแบบป้อนจุดรุ่นเก่า",
  "Modern point-feed prebake": "เซลล์พรีเบกแบบป้อนจุดรุ่นใหม่",
  "Modern point-feed prebake without fully automated anode-effect intervention":
    "เซลล์พรีเบกแบบป้อนจุดรุ่นใหม่ที่ไม่มีระบบแก้แอโนดเอฟเฟกต์อัตโนมัติเต็มรูปแบบ",
  "Centre-worked prebake": "เซลล์พรีเบกแบบป้อนกลางเซลล์",
  "Side-worked prebake": "เซลล์พรีเบกแบบป้อนด้านข้างเซลล์",
  "Vertical-stud Søderberg": "เซลล์ Søderberg แบบ vertical-stud",
  "Horizontal-stud Søderberg": "เซลล์ Søderberg แบบ horizontal-stud",
  "Show Cera": "แสดง Cera",
  "Drag to move": "ลากเพื่อย้าย",
  "Back to the chat": "กลับไปที่แชต",
  History: "ประวัติการสนทนา",
  conversation: "บทสนทนา",
  conversations: "บทสนทนา",
  "New chat": "แชตใหม่",
  "Full screen": "เต็มหน้าจอ",
  Hide: "ซ่อน",
  "CBAM updates": "อัพเดท CBAM",
  "Earlier chats": "แชตก่อนหน้า",
  "Every conversation you have with Cera is kept here, so you can pick it up again.":
    "ทุกบทสนทนากับ Cera จะถูกเก็บไว้ที่นี่ กลับมาคุยต่อได้ทุกเมื่อ",
  "Exit full screen": "ออกจากเต็มหน้าจอ",
  "What can Cera help you with?": "ให้ Cera ช่วยเรื่องอะไรดี",
  "Give me a file — I'll fill in the month": "ส่งไฟล์มา แล้วฉันจะกรอกข้อมูลของเดือนให้",
  "What's changed, what's coming": "อะไรเปลี่ยนแล้ว อะไรกำลังจะมา",
  "Thinking…": "กำลังคิด…",
  "Drop one file here": "วางไฟล์เดียวตรงนี้",
  "Text or CSV · one at a time ·": "ไฟล์ข้อความหรือ CSV · ทีละไฟล์ ·",
  "choose a file": "เลือกไฟล์",
  "No file to hand? Try": "ยังไม่มีไฟล์? ลอง",
  "Press send and I'll read it.": "กดส่ง แล้วฉันจะอ่านให้",
  "Add a note for Cera — or leave it blank":
    "พิมพ์ข้อความถึง Cera เพิ่มได้ หรือเว้นว่างไว้",
  "Ask Cera anything…": "ถาม Cera ได้ทุกเรื่อง…",
  "Message Cera": "ข้อความถึง Cera",
  "Attach a file": "แนบไฟล์",
  "Attach a file — or drop or paste one": "แนบไฟล์ หรือวางไฟล์ลงในช่อง",
  "Smart upload is on — press to turn it off": "สมาร์ทอัพโหลดเปิดอยู่ — กดเพื่อปิด",
  "Give Cera one file and it fills in the month":
    "ส่งไฟล์ให้ Cera หนึ่งไฟล์ แล้ว Cera จะกรอกข้อมูลของเดือนให้",
  Send: "ส่ง",
  "Enter to send · Shift+Enter for a new line":
    "Enter เพื่อส่ง · Shift+Enter เพื่อขึ้นบรรทัดใหม่",
  "Drop it to read with Smart upload": "ปล่อยไฟล์เพื่อให้สมาร์ทอัพโหลดอ่าน",
  "One file at a time": "ทีละไฟล์",
  "No conversations yet": "ยังไม่มีบทสนทนา",
  "Start one": "เริ่มเลย",
  message: "ข้อความ",
  messages: "ข้อความ",
  "Click again to delete": "กดอีกครั้งเพื่อลบ",
  "Delete this conversation": "ลบบทสนทนานี้",
  "Text or CSV · one at a time": "ไฟล์ข้อความหรือ CSV · ทีละไฟล์",
  "Choose a file": "เลือกไฟล์",
  "No file to hand? Try an example": "ยังไม่มีไฟล์? ลองใช้ตัวอย่าง",
  "Download one, then drop it above. Each holds only a few readings — enough to see how it works.":
    "ดาวน์โหลดหนึ่งไฟล์ แล้ววางด้านบน แต่ละไฟล์มีข้อมูลเพียงไม่กี่ค่า พอให้เห็นว่าทำงานอย่างไร",
  "Choose one": "เลือกหนึ่งรายการ",
  "You changed this — the file says": "คุณแก้ค่านี้ — ในไฟล์ระบุว่า",
  Undo: "ยกเลิกการแก้",
  "From the file": "จากไฟล์",
  "This is what I found. Check each figure against your file and change anything that is not right — nothing goes into the form until you confirm.":
    "นี่คือสิ่งที่ฉันพบ ตรวจแต่ละตัวเลขเทียบกับไฟล์ของคุณ แล้วแก้ที่ไม่ถูกต้องได้เลย — จะยังไม่มีอะไรถูกกรอกลงในแบบฟอร์มจนกว่าคุณจะกดยืนยัน",
  Include: "ใช้ค่านี้",
  "Discarded — nothing was saved": "ทิ้งแล้ว — ไม่มีอะไรถูกบันทึก",
  "Fix the figures marked in red to continue.": "แก้ตัวเลขที่ขีดสีแดงก่อนจึงจะไปต่อได้",
  reading: "ค่า",
  readings: "ค่า",
  "will be written as a draft": "จะถูกบันทึกเป็นฉบับร่าง",
  "changed by you": "คุณแก้ไข",
  Discard: "ทิ้ง",
  "Confirm and fill in": "ยืนยันและกรอกให้",
  "Coming up": "ที่กำลังจะมาถึง",
  "Already in force": "มีผลบังคับใช้แล้ว",
  "Flag new rule changes on my button": "แจ้งเตือนเมื่อกฎมีการเปลี่ยนแปลง",
  "Flag new rule changes": "แจ้งเตือนกฎที่เปลี่ยน",
  "Earlier conversations with Cera": "บทสนทนาก่อนหน้ากับ Cera",
  "Show all {n}": "ดูทั้งหมด {n} รายการ",
  "Enter a number.": "กรอกตัวเลข",
  "That is not a number.": "นี่ไม่ใช่ตัวเลข",
  "It cannot be negative.": "ติดลบไม่ได้",
  "It has to be more than 0.": "ต้องมากกว่า 0",
  "Choose one.": "เลือกหนึ่งรายการ",
  "the readings are in kWh": "ค่าที่อ่านได้เป็น kWh",
  "the readings are in MWh": "ค่าที่อ่านได้เป็น MWh",
  "the readings are in m³": "ค่าที่อ่านได้เป็น m³",
  "the readings are in litres": "ค่าที่อ่านได้เป็นลิตร",
  "the readings are tonnes of product": "ค่าที่อ่านได้เป็นตันของผลิตภัณฑ์",
  "Something else": "อย่างอื่น",
  "it is not a monthly reading": "ไม่ใช่ค่ารายเดือน",
  "Natural gas": "ก๊าซธรรมชาติ",
  Diesel: "ดีเซล",
  Grid: "ไฟฟ้าจากระบบสายส่ง",
  "Self-generated": "ผลิตเอง",
  "Good morning": "สวัสดีตอนเช้า",
  "Good afternoon": "สวัสดีตอนบ่าย",
  "Good evening": "สวัสดีตอนเย็น",
  "What is the default value for CN 7318 12 90?":
    "ค่า default ของ CN 7318 12 90 คือเท่าไร",
  "Where do I start in Certrace?": "ควรเริ่มต้นใช้ Certrace จากตรงไหน",
  "Should I use default or actual values?": "ควรใช้ค่า default หรือค่าจริงดี",
  "What's new in CBAM?": "อัพเดท CBAM",
  "A product report is one CN code at this installation for one reporting year.":
    "รายงานผลิตภัณฑ์หนึ่งฉบับคือสินค้าหนึ่งรหัส CN ของโรงงานนี้ ในหนึ่งปีรายงาน",
  "New product report": "รายงานผลิตภัณฑ์ใหม่",
  "No product report here yet": "โรงงานนี้ยังไม่มีรายงานผลิตภัณฑ์",
  "The product reports made at this installation, by reporting year. Open one to enter its monthly data and choose its direct precursors.":
    "รายงานผลิตภัณฑ์ของโรงงานนี้ แยกตามปีรายงาน เปิดแต่ละฉบับเพื่อกรอกข้อมูลรายเดือนและเลือกวัตถุดิบตั้งต้นโดยตรง",
  "product report": "รายงานผลิตภัณฑ์",
  "product reports": "รายงานผลิตภัณฑ์",
  "Building…": "กำลังสร้าง…",
  "Download package": "ดาวน์โหลดแพ็กเกจ",
  "Each report of the year. Open one to see its materiality self-check.":
    "รายงานแต่ละฉบับของปีนี้ เปิดดูการประเมินความมีนัยสำคัญด้วยตนเอง ของแต่ละฉบับได้",
  "Every report has to be complete first": "ต้องทำทุกรายงานให้ครบก่อน",
  "Everything is complete. One person inside your company can sign these figures off, so the reports carry their name.":
    "ครบถ้วนแล้ว คนในบริษัทหนึ่งคนสามารถลงนามรับรองตัวเลขเหล่านี้ได้ รายงานจะมีชื่อผู้ลงนามกำกับ",
  "Fill them in": "ไปกรอก",
  "If any figure changes after this — a month re-submitted, a precursor corrected, a document added — the sign-off lapses and has to be repeated.":
    "หากตัวเลขใดเปลี่ยนหลังจากนี้ เช่น ส่งเดือนใหม่ แก้วัตถุดิบตั้งต้น หรือเพิ่มเอกสาร การลงนามจะหมดผลและต้องทำใหม่",
  "No product report yet — create one and its readiness appears here.":
    "ยังไม่มีรายงานผลิตภัณฑ์ — สร้างฉบับแรกแล้วความพร้อมจะแสดงที่นี่",
  "Not in trial package": "ไม่รวมในแพ็กเกจช่วงทดลอง",
  "Product reports": "รายงานผลิตภัณฑ์",
  "Report set": "ชุดรายงาน",
  "See plans": "ดูแพ็กเกจ",
  "Sign again": "ลงนามอีกครั้ง",
  "The average of this year's product reports. A tab is green only when a verifier would find nothing missing there.":
    "ค่าเฉลี่ยของรายงานผลิตภัณฑ์ปีนี้ แท็บจะเป็นสีเขียวก็ต่อเมื่อผู้ทวนสอบไม่พบสิ่งที่ขาดในแท็บนั้น",
  "The installation's one-time information is complete.":
    "ข้อมูลที่กรอกครั้งเดียวของโรงงานครบแล้ว",
  "The package unlocks when every report below is complete.":
    "แพ็กเกจจะพร้อมดาวน์โหลดเมื่อทุกรายงานด้านล่างครบถ้วน",
  "The reports carry your company's name. One person inside the business puts theirs to them before they go out.":
    "รายงานมีชื่อบริษัทของคุณกำกับ และมีผู้รับผิดชอบหนึ่งคนในบริษัทลงนามก่อนส่งออก",
  "What it contains": "มีอะไรอยู่ในนี้บ้าง",
  "What this installation hands over for {year}: the monitoring plan, the operator's emissions report and the summary report — and a declarant-specific addendum where electricity is imported into the EU.":
    "สิ่งที่โรงงานนี้ส่งมอบสำหรับปี {year}: แผนการติดตาม รายงานการปล่อยของผู้ดำเนินการ และรายงานสรุป — และภาคผนวกเฉพาะผู้ยื่น เมื่อมีการนำเข้าไฟฟ้าเข้า EU",
  "Your free trial leaves the monitoring plan out of the package.":
    "ช่วงทดลองใช้ฟรีจะไม่รวมแผนการติดตามในแพ็กเกจ",
  ready: "พร้อม",
  "signed. Sign again before sending — a signature against superseded numbers is worse than none.":
    "ลงนามไว้ ลงนามอีกครั้งก่อนส่ง — ลายเซ็นที่อ้างตัวเลขเก่าแย่กว่าไม่มีลายเซ็น",
  "{n} item(s) of the installation's one-time information are still missing:":
    "ข้อมูลที่กรอกครั้งเดียวของโรงงานยังขาดอีก {n} รายการ:",
  "to do": "ต้องทำ",
  "No installation with that reference": "ไม่พบโรงงานที่ใช้รหัสอ้างอิงนี้",
  "It may have been renamed. Open the Verification page and pick it from there.":
    "อาจถูกเปลี่ยนชื่อแล้ว เปิดหน้าการทวนสอบแล้วเลือกจากที่นั่น",
  "Back to Verification": "กลับไปหน้าการทวนสอบ",
  "Installation info complete": "ข้อมูลโรงงานครบถ้วน",
  "Installation info {a}/{b}": "ข้อมูลโรงงาน {a}/{b}",
  "Installation sections": "ส่วนต่าง ๆ ของโรงงาน",
  "Entered once": "กรอกครั้งเดียว",
  "The operator, the installation and its monitoring plan. Every product report and every report in the set reads them from here.":
    "ผู้ดำเนินการ โรงงาน และแผนการติดตาม ทุกรายงานผลิตภัณฑ์และทุกรายงานในชุดอ่านข้อมูลจากที่นี่",
  "required answered": "ข้อบังคับที่ตอบแล้ว",
  Operator: "ผู้ดำเนินการ",
  "Annex IV item 1(d): the name, the CBAM Registry identifier, the UN/LOCODE, the full address in English and the coordinates of the main emission source.":
    "Annex IV ข้อ 1(d): ชื่อ รหัสในทะเบียน CBAM Registry รหัส UN/LOCODE ที่อยู่เต็มเป็นภาษาอังกฤษ และพิกัดของแหล่งปล่อยหลัก",
  "Summary of the monitoring plan": "สรุปแผนการติดตาม",
  "Annex IV items 2 to 6. Which production processes and routes the site runs, and which goods, is read from its product reports — you are not asked it twice.":
    "Annex IV ข้อ 2 ถึง 6 กระบวนการผลิต เส้นทางการผลิต และสินค้าที่โรงงานทำ ระบบอ่านจากรายงานผลิตภัณฑ์ — ไม่ต้องกรอกซ้ำ",
  "Reporting years": "ปีรายงาน",
  "Each year at this installation is a set of product reports and one report set.":
    "แต่ละปีของโรงงานนี้ประกอบด้วยรายงานผลิตภัณฑ์หลายฉบับและชุดรายงานหนึ่งชุด",
  "No product report yet. Create one and it appears here.":
    "ยังไม่มีรายงานผลิตภัณฑ์ สร้างฉบับแรกแล้วจะแสดงที่นี่",
  "Open installation": "เปิดหน้าโรงงาน",
  "Readiness and report set": "ความพร้อมและชุดรายงาน",
  "Remove site": "ลบโรงงาน",
  "Still used by a product report. Remove that report first.":
    "ยังมีรายงานผลิตภัณฑ์ใช้งานอยู่ ลบรายงานนั้นก่อน",
  "Still used by {n} product reports. Remove those reports first.":
    "ยังมีรายงานผลิตภัณฑ์ {n} ฉบับใช้งานอยู่ ลบรายงานเหล่านั้นก่อน",
  "Company → installation → reporting year → product report. The installation holds what is entered once; a product report is one CN code for one reporting year — the screen you monitor each month.":
    "บริษัท → โรงงาน → ปีรายงาน → รายงานผลิตภัณฑ์ โรงงานเก็บข้อมูลที่กรอกครั้งเดียว ส่วนรายงานผลิตภัณฑ์คือสินค้าหนึ่งรหัส CN ในหนึ่งปีรายงาน — เป็นหน้าที่คุณติดตามทุกเดือน",
  "No product reports yet": "ยังไม่มีรายงานผลิตภัณฑ์",
  "A product report is one CN code at one installation for one reporting year — “Steel billet · Plant A · 2026”. Monthly readings, the monitoring methodology, the direct precursors and evidence all hang off it.":
    "รายงานผลิตภัณฑ์หนึ่งฉบับคือสินค้าหนึ่งรหัส CN ของหนึ่งโรงงานในหนึ่งปีรายงาน เช่น “เหล็กแท่ง · โรงงาน A · 2026” ข้อมูลรายเดือน วิธีการติดตาม วัตถุดิบตั้งต้นโดยตรง และหลักฐานทั้งหมดผูกอยู่กับรายงานนี้",
  "Create the first product report": "สร้างรายงานผลิตภัณฑ์ฉบับแรก",
  "Everything entered once for this installation is in.":
    "ข้อมูลที่กรอกครั้งเดียวของโรงงานนี้ครบแล้ว",
  "Information entered once for this installation is still missing.":
    "ข้อมูลที่กรอกครั้งเดียวของโรงงานนี้ยังไม่ครบ",
  "One installation, one CN code, one reporting year. Everything a verifier asks about is scoped that way.":
    "หนึ่งโรงงาน หนึ่งรหัส CN หนึ่งปีรายงาน ทุกอย่างที่ผู้ทวนสอบถามจะแบ่งขอบเขตตามนี้",
  "The country decides which EU default values apply — the EU sets a different number for the same CN code in Thailand, Vietnam or India.":
    "ประเทศกำหนดว่าจะใช้ค่า default ของ EU ชุดใด — รหัส CN เดียวกันมีตัวเลขต่างกันสำหรับไทย เวียดนาม และอินเดีย",
  "Search by the CN code on your customs declaration — typing the first digits narrows the list. The rate on each row is the EU default value for your country in the reporting year.":
    "ค้นหาด้วยรหัส CN ในใบขนสินค้า — พิมพ์ตัวเลขแรก ๆ รายการจะแคบลง ตัวเลขในแต่ละแถวคือค่า default ของ EU สำหรับประเทศของคุณในปีรายงาน",
  "The type tag on each row is what decides the shape of the rest of the workspace: a precursor has nothing above it, a finished product carries precursors.":
    "ป้ายประเภทในแต่ละแถวกำหนดรูปแบบของส่วนที่เหลือ: วัตถุดิบตั้งต้นไม่มีอะไรอยู่เหนือมัน ส่วนผลิตภัณฑ์สำเร็จรูปมีวัตถุดิบตั้งต้น",
  "Which country and which good": "ประเทศและสินค้า",
  "Goods made in the EU, Iceland, Liechtenstein, Norway or Switzerland are outside CBAM — no default value applies.":
    "สินค้าที่ผลิตใน EU ไอซ์แลนด์ ลิกเตนสไตน์ นอร์เวย์ หรือสวิตเซอร์แลนด์อยู่นอก CBAM — ไม่มีค่า default",
  "Where the goods are made. The EU default values on the list below are read for this country.":
    "ประเทศที่ผลิตสินค้า ค่า default ของ EU ในรายการด้านล่างอ่านตามประเทศนี้",
  "Choose a country": "เลือกประเทศ",
  "Country name…": "ชื่อประเทศ…",
  "The EU recognises one route for this good, so it is chosen for you.":
    "EU รับรองเส้นทางการผลิตเดียวสำหรับสินค้านี้ ระบบเลือกให้แล้ว",
  "{n} routes the EU recognises for CN {code}.":
    "EU รับรอง {n} เส้นทางการผลิตสำหรับ CN {code}",
  "In the EU communication template this route reads":
    "ในแม่แบบสื่อสารของ EU เส้นทางนี้เรียกว่า",
  "Benchmark route": "เส้นทางตาม benchmark",
  "Free-allocation benchmark": "Benchmark การจัดสรรฟรี",
  "process benchmark": "benchmark ตามกระบวนการ",
  "This is the route the EU built the default value for {country} on.":
    "เส้นทางนี้คือเส้นทางที่ EU ใช้สร้างค่า default ของ {country}",
  "About this product report": "เกี่ยวกับรายงานผลิตภัณฑ์นี้",
  "The good, the way it is made and where — what a verifier scopes this report against, and what its EU rates are read for.":
    "สินค้า วิธีผลิต และสถานที่ผลิต — ผู้ทวนสอบใช้กำหนดขอบเขตของรายงานนี้ และใช้อ่านอัตราของ EU",
  "Product, route and country": "ผลิตภัณฑ์ เส้นทางการผลิต และประเทศ",
  "— the EU recognises other routes for this code. Fix it in Edit.":
    "— EU รับรองเส้นทางอื่นสำหรับรหัสนี้ แก้ไขได้ที่ปุ่มแก้ไข",
  "Changing the product changes the CN code and the aggregated goods category this report is filed under. The monthly readings stay — they describe the same furnace — but anything already sent to a verifier under the old code will not match.":
    "การเปลี่ยนผลิตภัณฑ์จะเปลี่ยนรหัส CN และหมวดสินค้ารวมที่รายงานนี้อยู่ ข้อมูลรายเดือนยังคงอยู่เพราะเป็นเตาเดิม แต่สิ่งที่ส่งให้ผู้ทวนสอบไปแล้วภายใต้รหัสเก่าจะไม่ตรงกัน",
  "The EU default values are read for this country.":
    "ค่า default ของ EU อ่านตามประเทศนี้",
  "Every route the EU recognises for CN {cn}.":
    "ทุกเส้นทางที่ EU รับรองสำหรับ CN {cn}",
  "Pick a product first.": "เลือกผลิตภัณฑ์ก่อน",
  "To report a different year for the same installation and product, create a second product report. Two years in one report cannot answer “show me March” without asking which March.":
    "หากต้องการรายงานอีกปีสำหรับโรงงานและผลิตภัณฑ์เดียวกัน ให้สร้างรายงานผลิตภัณฑ์ฉบับที่สอง รายงานหนึ่งฉบับที่มีสองปีตอบคำถาม “ขอดูเดือนมีนาคม” ไม่ได้ว่าเป็นมีนาคมปีไหน",
  "Entered once, on the installation page, and read by every product report made there.":
    "กรอกครั้งเดียวที่หน้าโรงงาน และทุกรายงานผลิตภัณฑ์ของโรงงานนั้นอ่านจากที่นี่",
  "The direct precursors — who supplies what, and how much — are a property of the year, not of this month. Add or change them on the":
    "วัตถุดิบตั้งต้นโดยตรง — ใครส่งอะไร และเท่าไร — เป็นข้อมูลของทั้งปี ไม่ใช่ของเดือนนี้ เพิ่มหรือแก้ไขได้ที่แท็บ",
  "tab.": "",
  "Package downloaded": "ดาวน์โหลดแพ็กเกจแล้ว",
  reports: "รายงาน",
  "Could not build the package": "สร้างแพ็กเกจไม่สำเร็จ",
  "One package per installation.": "หนึ่งแพ็กเกจต่อหนึ่งโรงงาน",
  "Each installation you report on hands over one package a year: the monitoring plan, the operator's emissions report and the summary report — and a declarant addendum where electricity goes to the EU. It covers every product the site makes, and downloads once all of it is complete.":
    "ทุกโรงงานที่คุณรายงานจะส่งมอบหนึ่งแพ็กเกจต่อปี ประกอบด้วยแผนการติดตาม รายงานการปล่อยของผู้ดำเนินการ และรายงานสรุป — รวมถึงภาคผนวกเฉพาะผู้ยื่นเมื่อมีการส่งไฟฟ้าเข้า EU ครอบคลุมทุกผลิตภัณฑ์ของโรงงาน และดาวน์โหลดได้เมื่อครบทั้งหมด",
  Packages: "แพ็กเกจ",
  "one per installation and year": "หนึ่งชุดต่อโรงงานต่อปี",
  "Still to do": "ยังต้องทำ",
  "something is missing": "ยังมีข้อมูลขาด",
  "No packages yet": "ยังไม่มีแพ็กเกจ",
  "Create a product report at an installation and its package appears here.":
    "สร้างรายงานผลิตภัณฑ์ของโรงงาน แล้วแพ็กเกจจะแสดงที่นี่",
  "What you send your buyer. One package per installation and year.":
    "สิ่งที่คุณส่งให้ผู้ซื้อ หนึ่งแพ็กเกจต่อโรงงานต่อปี",
  "Suppliers' installations you track": "โรงงานของซัพพลายเออร์ที่คุณติดตาม",
  "Started from a supplier in your chain. These are your evidence for one line of the package above, not something the buyer receives.":
    "เริ่มจากซัพพลายเออร์ในห่วงโซ่ของคุณ ข้อมูลนี้เป็นหลักฐานของคุณสำหรับหนึ่งบรรทัดในแพ็กเกจด้านบน ไม่ใช่สิ่งที่ผู้ซื้อได้รับ",
  "Not ready": "ยังไม่พร้อม",
  "Ready. Your free trial leaves the monitoring plan out of the package.":
    "พร้อมแล้ว ช่วงทดลองใช้ฟรีจะไม่รวมแผนการติดตามในแพ็กเกจ",
  "Ready. Downloads as one package.": "พร้อมแล้ว ดาวน์โหลดเป็นแพ็กเกจเดียว",
  "Export package": "ส่งออกแพ็กเกจ",
  "Site removed": "ลบโรงงานแล้ว",
  "{name} is off your list. Nothing else was deleted.":
    "{name} ถูกนำออกจากรายการแล้ว ไม่มีข้อมูลอื่นถูกลบ",
  "The goods that go straight into this product. For each one, choose the EU's default value or an actual value from the precursor's own operator. Only direct precursors are listed — a precursor's own inputs are reported by its operator as one figure.":
    "สินค้าที่เข้าสู่ผลิตภัณฑ์นี้โดยตรง สำหรับแต่ละรายการ ให้เลือกค่า default ของ EU หรือค่าจริงจากผู้ดำเนินการของวัตถุดิบนั้น แสดงเฉพาะวัตถุดิบตั้งต้นโดยตรง — วัตถุดิบที่ใช้ผลิตวัตถุดิบนั้นผู้ดำเนินการรายงานรวมเป็นตัวเลขเดียว",
  "Add direct precursor": "เพิ่มวัตถุดิบตั้งต้นโดยตรง",
  "No direct precursor recorded yet.": "ยังไม่มีวัตถุดิบตั้งต้นโดยตรง",
  "Add each good that is bought in or made elsewhere and goes into this product — for example the steel a fastener is made from. A product made only from raw materials has none.":
    "เพิ่มสินค้าแต่ละรายการที่ซื้อเข้ามาหรือผลิตที่อื่นแล้วนำมาใช้ในผลิตภัณฑ์นี้ เช่น เหล็กที่ใช้ทำสลักเกลียว ผลิตภัณฑ์ที่ทำจากวัตถุดิบล้วน ๆ จะไม่มีรายการนี้",
  "A note on using a default value for a direct precursor":
    "ข้อควรทราบเมื่อใช้ค่า default กับวัตถุดิบตั้งต้นโดยตรง",
  "A direct precursor usually carries most of a complex good's embedded emissions, and the EU sets its default values on the cautious side: a mark-up applies (+{markup}% in this reporting year, rising in later years), and where the country of origin is not known the highest national value for the CN code is used.":
    "วัตถุดิบตั้งต้นโดยตรงมักมีสัดส่วนใหญ่ของการปล่อยแฝงในสินค้าที่ซับซ้อน และ EU กำหนดค่า default ไว้ค่อนข้างสูง: มีส่วนบวกเพิ่ม (+{markup}% ในปีรายงานนี้ และสูงขึ้นในปีถัด ๆ ไป) และเมื่อไม่ทราบประเทศต้นทางจะใช้ค่าสูงสุดของรหัส CN นั้น",
  "Relying on a default for a direct precursor therefore tends to raise the overall figure for this product, and it can end up close to — or even above — the default value for the finished good itself. An actual value, verified at the precursor's installation, may be lower.":
    "การพึ่งค่า default ของวัตถุดิบตั้งต้นโดยตรงจึงมักทำให้ตัวเลขรวมของผลิตภัณฑ์สูงขึ้น และอาจใกล้เคียงหรือสูงกว่าค่า default ของสินค้าสำเร็จรูปเอง ส่วนค่าจริงที่ผ่านการทวนสอบที่โรงงานของวัตถุดิบนั้นอาจต่ำกว่า",
  "At today's entries the precursors add {a} tCO₂e per tonne of this product{share}; the EU default value for the finished good is {b}.":
    "จากรายการปัจจุบัน วัตถุดิบตั้งต้นเพิ่ม {a} tCO₂e ต่อตันของผลิตภัณฑ์นี้{share} ส่วนค่า default ของ EU สำหรับสินค้าสำเร็จรูปคือ {b}",
  "The precursors alone are already at or above that default. It is worth getting an actual value for the largest one — or considering the finished good's own default value, which Annex II allows you to use instead.":
    "เฉพาะวัตถุดิบตั้งต้นก็ถึงหรือเกินค่า default นั้นแล้ว ควรขอค่าจริงของรายการที่ใหญ่ที่สุด หรือพิจารณาใช้ค่า default ของสินค้าสำเร็จรูปแทน ซึ่ง Annex II อนุญาต",
  "Origin not identified": "ไม่ระบุประเทศต้นทาง",
  "Origin not set": "ยังไม่ตั้งประเทศต้นทาง",
  Default: "ค่า default",
  "Remove this precursor?": "ลบวัตถุดิบตั้งต้นนี้หรือไม่",
  Keep: "เก็บไว้",
  "Which value do you want to use for this precursor?":
    "ต้องการใช้ค่าแบบใดกับวัตถุดิบตั้งต้นนี้",
  "The EU's own figure for this CN code and country of origin. Nothing to ask anyone, and nothing to upload.":
    "ตัวเลขของ EU สำหรับรหัส CN และประเทศต้นทางนี้ ไม่ต้องขอใคร และไม่ต้องอัปโหลดอะไร",
  "Not available while the country of production cannot be identified — an actual value needs a country of origin and an identified operator.":
    "ใช้ไม่ได้ขณะที่ระบุประเทศผู้ผลิตไม่ได้ — ค่าจริงต้องมีประเทศต้นทางและผู้ดำเนินการที่ระบุได้",
  "Ask the precursor's operator for its verified figure for the year. It is used once their data and verification report are in; until then the default stands in.":
    "ขอตัวเลขที่ผ่านการทวนสอบของปีนั้นจากผู้ดำเนินการของวัตถุดิบ จะใช้ได้เมื่อได้รับข้อมูลและรายงานการทวนสอบแล้ว ระหว่างนี้ใช้ค่า default ไปก่อน",
  "The applicable default value": "ค่า default ที่ใช้",
  "The country of production is not identified, so the highest default value for this CN code applies (Annex IV to Regulation 2023/956).":
    "ไม่ระบุประเทศผู้ผลิต จึงใช้ค่า default สูงสุดของรหัส CN นี้ (Annex IV ของ Regulation 2023/956)",
  "Annex I of Implementing Regulation 2025/2621 has no row for this country and good, so “Other countries and territories” applies.":
    "Annex I ของ Implementing Regulation 2025/2621 ไม่มีแถวสำหรับประเทศและสินค้านี้ จึงใช้แถว “ประเทศและดินแดนอื่น”",
  "From Annex I of Implementing Regulation 2025/2621 for {country}.":
    "จาก Annex I ของ Implementing Regulation 2025/2621 สำหรับ {country}",
  "Reporting year {year}, including the +{markup}% mark-up.":
    "ปีรายงาน {year} รวมส่วนบวกเพิ่ม +{markup}% แล้ว",
  "Direct {d} · indirect {i}.": "ทางตรง {d} · ทางอ้อม {i}",
  "Enter the CN code to see the default value.": "กรอกรหัส CN เพื่อดูค่า default",
  "What you fill in": "สิ่งที่คุณกรอก",
  "What the precursor's operator fills in": "สิ่งที่ผู้ดำเนินการของวัตถุดิบกรอก",
  "One request, after the precursor's year has closed and its emissions are verified. It asks for the final data only — nothing is generated for the precursor, and nothing is collected month by month.":
    "คำขอครั้งเดียว หลังจากปีของวัตถุดิบปิดและการปล่อยผ่านการทวนสอบแล้ว ขอเฉพาะข้อมูลสุดท้าย — ไม่มีอะไรถูกสร้างขึ้นแทนวัตถุดิบ และไม่มีการเก็บรายเดือน",
  "What they will be asked": "สิ่งที่จะถามพวกเขา",
  "Enter the precursor's data yourself": "กรอกข้อมูลของวัตถุดิบตั้งต้นเอง",
  "If the precursor sent you their figures and verification report some other way, enter or attach them here. The same checks apply as if they had filled it in themselves.":
    "หากผู้ผลิตวัตถุดิบส่งตัวเลขและรายงานการทวนสอบมาทางอื่น กรอกหรือแนบที่นี่ได้ ระบบตรวจสอบแบบเดียวกับที่เขากรอกเอง",
  "The precursor's verified actual value is in use for this product.":
    "ผลิตภัณฑ์นี้ใช้ค่าจริงที่ผ่านการทวนสอบของวัตถุดิบตั้งต้นนี้แล้ว",
  "For now this product uses the default value for this precursor":
    "ขณะนี้ผลิตภัณฑ์นี้ใช้ค่า default กับวัตถุดิบตั้งต้นนี้",
  "An actual value can replace it once the precursor's data and a verification report that covers the period are in (Annex II A.1(4)).":
    "ค่าจริงจะใช้แทนได้เมื่อได้รับข้อมูลของวัตถุดิบและรายงานการทวนสอบที่ครอบคลุมช่วงเวลานั้น (Annex II A.1(4))",
  "Add the email address of the precursor's operator first — the request is addressed to it.":
    "ใส่อีเมลของผู้ดำเนินการของวัตถุดิบก่อน — คำขอจะส่งถึงอีเมลนี้",
  "Already sent today. You can send it again in {n} hour(s) — Copy link works any time.":
    "ส่งไปแล้ววันนี้ ส่งซ้ำได้อีกใน {n} ชั่วโมง — คัดลอกลิงก์ได้ทุกเมื่อ",
  "The link is copied to your clipboard — paste it wherever you reach {who}. This build does not send the email itself.":
    "คัดลอกลิงก์ไว้ในคลิปบอร์ดแล้ว — วางในช่องทางที่ติดต่อ {who} ได้เลย ระบบรุ่นนี้ยังไม่ส่งอีเมลเอง",
  "Request recorded": "บันทึกคำขอแล้ว",
  "Link copied for {who}.": "คัดลอกลิงก์สำหรับ {who} แล้ว",
  "Contact at the precursor's operator": "ผู้ติดต่อที่ผู้ดำเนินการของวัตถุดิบ",
  "Email the request goes to": "อีเมลที่ส่งคำขอไป",
  "Resend request": "ส่งคำขออีกครั้ง",
  "Send request": "ส่งคำขอ",
  "Step {n} of 2": "ขั้นตอน {n} จาก 2",
  "Add a direct precursor": "เพิ่มวัตถุดิบตั้งต้นโดยตรง",
  "A good that goes straight into this product. Pick it from the CBAM catalogue so its CN code is right.":
    "สินค้าที่เข้าสู่ผลิตภัณฑ์นี้โดยตรง เลือกจากแคตตาล็อก CBAM เพื่อให้รหัส CN ถูกต้อง",
  "Where it was made, and which value you want to use for it.":
    "ผลิตที่ไหน และต้องการใช้ค่าแบบใด",
  "Where this precursor was produced.": "ประเทศที่ผลิตวัตถุดิบตั้งต้นนี้",
  "Not identified": "ไม่ระบุ",
  "The country of production cannot be identified": "ระบุประเทศผู้ผลิตไม่ได้",
  "The highest default value for the CN code applies — Annex IV to Implementing Regulation 2025/2621. An actual value needs a country of origin.":
    "ใช้ค่า default สูงสุดของรหัส CN — Annex IV ของ Implementing Regulation 2025/2621 ค่าจริงต้องมีประเทศต้นทาง",
  "Which value do you want to use?": "ต้องการใช้ค่าแบบใด",
  "The EU's figure. Nothing to ask anyone.": "ตัวเลขของ EU ไม่ต้องขอใคร",
  "Not available — the country is not identified": "ใช้ไม่ได้ — ไม่ระบุประเทศ",
  "An actual value needs a country of origin and an identified operator.":
    "ค่าจริงต้องมีประเทศต้นทางและผู้ดำเนินการที่ระบุได้",
  "Ask the precursor's operator for its verified figure.":
    "ขอตัวเลขที่ผ่านการทวนสอบจากผู้ดำเนินการของวัตถุดิบ",
  "You can change this at any time.": "เปลี่ยนได้ทุกเมื่อ",
  "Made inside the EU or in an exempted territory, so there is no CBAM default value — its embedded emissions count as zero.":
    "ผลิตใน EU หรือดินแดนที่ได้รับยกเว้น จึงไม่มีค่า default ของ CBAM — การปล่อยแฝงนับเป็นศูนย์",
  "The EU publishes no default value for this good.":
    "EU ไม่ประกาศค่า default สำหรับสินค้านี้",
  "EU default value · {year}": "ค่า default ของ EU · {year}",
  "The highest default value for this CN code (Annex IV), including the +{markup}% mark-up.":
    "ค่า default สูงสุดของรหัส CN นี้ รวมส่วนบวกเพิ่ม +{markup}%",
  "{country} is not listed in Annex I, so “Other countries and territories” applies, including the +{markup}% mark-up.":
    "{country} ไม่อยู่ใน Annex I จึงใช้แถว “ประเทศและดินแดนอื่น” รวมส่วนบวกเพิ่ม +{markup}%",
  "From Annex I for {country}, including the +{markup}% mark-up.":
    "จาก Annex I สำหรับ {country} รวมส่วนบวกเพิ่ม +{markup}%",
  "Loading the EU default values for {country}…":
    "กำลังโหลดค่า default ของ EU สำหรับ {country}…",
  "a route-independent value": "ค่าที่ไม่ขึ้นกับเส้นทางการผลิต",
  "What this CN code leads to": "รหัส CN นี้นำไปสู่อะไร",
  "The default-value exposure — what the buyer is charged if no verified figure is supplied.":
    "ความเสี่ยงจากค่า default — สิ่งที่ผู้ซื้อต้องจ่ายหากไม่มีตัวเลขที่ผ่านการทวนสอบ",
  "EU default value": "ค่า default ของ EU",
  "{base} + {markup} mark-up · built on {route}":
    "{base} + ส่วนบวกเพิ่ม {markup} · อิงเส้นทาง {route}",
  "Free-allocation offset": "ส่วนหักการจัดสรรฟรี",
  "{factor} × benchmark {bm}": "{factor} × เกณฑ์อ้างอิง {bm}",
  "No benchmark for this route": "ไม่มี benchmark สำหรับเส้นทางนี้",
  "Chargeable per tonne": "ส่วนที่ต้องชำระต่อตัน",
  "default value less the offset": "ค่า default หักส่วนหักการจัดสรรฟรี",
  "Indicative cost per tonne": "ต้นทุนโดยประมาณต่อตัน",
  "≈ ฿{thb} · at €{price} per tCO₂e ({period})":
    "≈ ฿{thb} · ที่ €{price} ต่อ tCO₂e ({period})",
  "No certificate price on file yet": "ยังไม่มีราคาใบรับรองในระบบ",
  "Mark-up": "ส่วนบวกเพิ่ม",
  "CBAM factor": "ตัวคูณ CBAM",
  "Sources: default values — Implementing Regulation (EU) 2025/2621, Annex I; benchmarks — 2025/2620; phase-in — Article 10a of the ETS Directive; price — Article 21 of Regulation 2023/956.":
    "แหล่งที่มา: ค่า default — Implementing Regulation (EU) 2025/2621 Annex I · benchmark — 2025/2620 · การทยอยใช้ — มาตรา 10a ของ ETS Directive · ราคา — มาตรา 21 ของ Regulation 2023/956",
  Heading: "พิกัดหมวด",
  "All headings": "ทุกพิกัดหมวด",
  matching: "ที่ตรงกัน",
  "goods in CBAM scope in all": "สินค้าที่อยู่ในขอบเขต CBAM ทั้งหมด",
  "goods in CBAM scope": "สินค้าที่อยู่ในขอบเขต CBAM",
  "clear the filters to see them all": "ล้างตัวกรองเพื่อดูทั้งหมด",
  "Show {n} more": "แสดงเพิ่มอีก {n} รายการ",
  "not shown yet": "ยังไม่แสดง",
  "Your selected good is outside these filters — clear them to see it in the list.":
    "สินค้าที่คุณเลือกอยู่นอกตัวกรองเหล่านี้ — ล้างตัวกรองเพื่อดูในรายการ",
  "The boxed number before a field is the item of Annex IV to Implementing Regulation (EU) 2025/2547 — the operator's emissions report — that the answer goes into.":
    "ตัวเลขในกรอบหน้าช่องกรอกคือข้อของ Annex IV ใน Implementing Regulation (EU) 2025/2547 — รายงานการปล่อยของผู้ดำเนินการ — ที่คำตอบจะถูกนำไปใช้",
  "A box starting VR is the matching item of the verification report template (Implementing Regulation (EU) 2025/2546).":
    "กรอบที่ขึ้นต้นด้วย VR คือข้อที่ตรงกันในแม่แบบรายงานการทวนสอบ (Implementing Regulation (EU) 2025/2546)",
  "filled box: required": "กรอบทึบ: จำเป็น",
  "white box: optional": "กรอบขาว: ไม่บังคับ",
  "asked, but not an Annex IV item": "ถามไว้ แต่ไม่ใช่ข้อของ Annex IV",
  "Fixed when the precursor was added": "กำหนดไว้ตั้งแต่เพิ่มวัตถุดิบตั้งต้น",
  "Choose…": "เลือก…",
  "What {exporter} has told us": "สิ่งที่ {exporter} แจ้งมา",
  "The good": "สินค้า",
  "If any of this is wrong, tell {exporter} before you answer — the figures below are only valid for this good.":
    "หากข้อมูลนี้ผิดพลาด แจ้ง {exporter} ก่อนตอบ — ตัวเลขด้านล่างใช้ได้กับสินค้านี้เท่านั้น",
  "The verification report is required: without a report from an accredited verifier that covers this good and the period, {exporter} has to use the EU's default value for it instead of your figure (Annex II A.1(4) of Implementing Regulation (EU) 2025/2547).":
    "จำเป็นต้องมีรายงานการทวนสอบ: หากไม่มีรายงานจากผู้ทวนสอบที่ได้รับการรับรองซึ่งครอบคลุมสินค้าและช่วงเวลานี้ {exporter} ต้องใช้ค่า default ของ EU แทนตัวเลขของคุณ (Annex II A.1(4) ของ Implementing Regulation (EU) 2025/2547)",
  "Uploading…": "กำลังอัปโหลด…",
  "Add more files": "เพิ่มไฟล์",
  "Upload file(s)": "อัปโหลดไฟล์",
  "All submissions approved": "อนุมัติการส่งข้อมูลทั้งหมดแล้ว",
  "All supplier submissions have been approved in local draft.":
    "อนุมัติข้อมูลที่ซัพพลายเออร์ส่งมาทั้งหมดในฉบับร่างแล้ว",
  "Approval failed": "อนุมัติไม่สำเร็จ",
  "Could not approve all submissions.": "อนุมัติข้อมูลที่ส่งมาทั้งหมดไม่ได้",
  "Approve all": "อนุมัติทั้งหมด",
  "filling in (draft)": "กำลังกรอก (ฉบับร่าง)",
  "running quality check": "กำลังตรวจคุณภาพ",
  "That file could not be downloaded.": "ดาวน์โหลดไฟล์นั้นไม่ได้",
  "Only the name of this file was kept - ask the supplier to attach it again":
    "ระบบเก็บไว้เฉพาะชื่อไฟล์ — ให้ซัพพลายเออร์แนบไฟล์อีกครั้ง",
  "Communication Template": "แม่แบบการสื่อสาร",
  "Couldn't delete that declaration": "ลบรายการยื่นข้อมูลนั้นไม่ได้",
  "Awaiting the published default": "รอค่า default ที่ประกาศ",
  "From your contract or fuel mix": "จากสัญญาหรือส่วนผสมเชื้อเพลิงของคุณ",
  "Not in the table — enter it": "ไม่มีในตาราง — กรอกเอง",
  "Needs its own carbon content and evidence": "ต้องมีค่าคาร์บอนและหลักฐานของตัวเอง",
  "Material name": "ชื่อวัสดุ",
  "Not a Point G Table 5 material. Record where this carbon content came from in the provenance below — a lab analysis or a supplier specification.":
    "ไม่ใช่วัสดุในตารางที่ 5 ของ Point G บันทึกที่มาของค่าคาร์บอนนี้ในช่องที่มาด้านล่าง เช่น ผลวิเคราะห์ห้องปฏิบัติการหรือสเปกของซัพพลายเออร์",
  "Opening your request…": "กำลังเปิดคำขอของคุณ…",
  "5 steps — methodology, monthly data, documents, then check and sign. Everything saves as you type.":
    "5 ขั้นตอน — วิธีการติดตาม ข้อมูลรายเดือน เอกสาร แล้วตรวจสอบและลงนาม ทุกอย่างบันทึกอัตโนมัติขณะพิมพ์",
  "Back to": "กลับไปที่",
  "The English name of the producing site — the one your buyer’s declarant and the verifier will use.":
    "ชื่อภาษาอังกฤษของโรงงานที่ผลิต — ชื่อที่ผู้ยื่น ของผู้ซื้อและผู้ทวนสอบจะใช้",
  "Search by CN code or name — 7208 38, hot-rolled, stainless, urea…":
    "ค้นหาด้วยรหัส CN หรือชื่อ — 7208 38, hot-rolled, stainless, urea…",

  /* ── Month inputs worked out rather than read, the monitoring plan's own elements, and what goes to the verifier ── */
  "Where it sits": "ตำแหน่งที่ติดตั้ง",
  "The line, feeder or tank it is fitted to — so a verifier can walk to it.":
    "สายการผลิต ฟีดเดอร์ หรือถังที่ติดตั้งอยู่ — ให้ผู้ทวนสอบเดินไปดูได้เอง",
  Uncertainty: "ความไม่แน่นอนของการวัด",
  "± %, from the maker or the calibration certificate.":
    "± % ตามที่ผู้ผลิตหรือใบรับรองการสอบเทียบระบุ",
  "Measurement uncertainty": "ความไม่แน่นอนของการวัด",
  "Monitoring plan elements": "องค์ประกอบของแผนการติดตาม",
  "9 · Monitoring plan elements": "9 · องค์ประกอบของแผนการติดตาม",
  "What Annex II A.5 asks of the monitoring plan that nothing above already answers.":
    "สิ่งที่ Annex II A.5 กำหนดให้มีในแผนการติดตาม ซึ่งข้อมูลด้านบนยังตอบไม่ครบ",
  "The monitoring plan is the document the verifier reads first. Its template has 22 elements; most are read straight from your boundary, instruments, products and the installation page.":
    "แผนการติดตามคือเอกสารที่ผู้ทวนสอบอ่านก่อนเป็นอันดับแรก แบบฟอร์มมี 22 องค์ประกอบ ส่วนใหญ่ระบบดึงจากขอบเขต เครื่องมือวัด ผลิตภัณฑ์ และหน้าข้อมูลโรงงานที่คุณกรอกไว้แล้ว",
  "These seven are descriptions only you can write. A line or two each is enough — what you do, not a policy manual.":
    "เจ็ดข้อนี้เป็นคำอธิบายที่มีแต่คุณเท่านั้นที่เขียนได้ ข้อละหนึ่งสองบรรทัดก็พอ — เขียนสิ่งที่ทำอยู่จริง ไม่ต้องเป็นคู่มือนโยบาย",
  "How the calculation factors are determined, and the sampling plan":
    "วิธีกำหนดค่าตัวแปรสำหรับการคำนวณ และแผนการเก็บตัวอย่าง",
  "For each source stream: where the factor comes from (laboratory analysis, supplier certificate or an EU standard value), how often the sample is taken, and by whom.":
    "ของแต่ละแหล่งกำเนิด: ค่ามาจากไหน (ผลวิเคราะห์ห้องปฏิบัติการ ใบรับรองจากผู้ขาย หรือค่ามาตรฐานของ EU) เก็บตัวอย่างบ่อยแค่ไหน และใครเป็นผู้เก็บ",
  "Risk assessment of the data flow": "การประเมินความเสี่ยงของการไหลของข้อมูล",
  "Where an error could enter between the primary reading and the figure reported, and how likely each is.":
    "จุดที่ข้อผิดพลาดอาจเกิดขึ้นระหว่างค่าที่อ่านได้ครั้งแรกกับตัวเลขที่รายงาน และแต่ละจุดมีโอกาสเกิดมากน้อยเพียงใด",
  "Quality assurance of the information systems":
    "การประกันคุณภาพของระบบสารสนเทศ",
  "The systems that process the data, and how they are tested, controlled and maintained.":
    "ระบบที่ใช้ประมวลผลข้อมูล และวิธีทดสอบ ควบคุม และบำรุงรักษา",
  "Segregation of duties and competencies":
    "การแบ่งแยกหน้าที่และความสามารถของบุคลากร",
  "Who records, who checks and who approves — and how people are trained for it.":
    "ใครเป็นผู้บันทึก ใครตรวจ ใครอนุมัติ — และฝึกอบรมคนในหน้าที่นั้นอย่างไร",
  "Corrections and corrective action": "การแก้ไขและการดำเนินการแก้ไข",
  "What is done when a review finds an error or an instrument is out of tolerance.":
    "สิ่งที่ทำเมื่อการตรวจพบข้อผิดพลาด หรือเครื่องมือวัดเกินค่าที่ยอมรับได้",
  "Control of outsourced processes": "การควบคุมงานที่จ้างภายนอก",
  "Any part of the data flow done by someone else — a laboratory, a metering contractor. Write “None” if there is none.":
    "ส่วนใดของการไหลของข้อมูลที่ผู้อื่นทำแทน เช่น ห้องปฏิบัติการ ผู้รับเหมางานมิเตอร์ ถ้าไม่มีให้เขียนว่า “ไม่มี”",
  "Keeping records and managing document versions":
    "การเก็บบันทึกและการจัดการเวอร์ชันของเอกสาร",
  "Where records are kept, for how long — at least six years after the reporting period — and how an old version of a document is told from the current one.":
    "เก็บบันทึกไว้ที่ไหน นานเท่าใด — อย่างน้อยหกปีหลังสิ้นรอบรายงาน — และแยกเวอร์ชันเก่าออกจากเวอร์ชันปัจจุบันอย่างไร",
  "Made at this installation": "ผลิตที่โรงงานแห่งนี้",
  "A product this site makes and then uses here — billet that becomes wire rod. Pick its product report and say how much of it was used. Its embedded emissions come from that report, so they move when it does.":
    "ผลิตภัณฑ์ที่โรงงานนี้ผลิตเองแล้วนำมาใช้ต่อที่นี่ เช่น เหล็กบิลเล็ตที่ถูกรีดเป็นลวดเหล็ก เลือกรายงานผลิตภัณฑ์ของมัน แล้วระบุว่าใช้ไปเท่าใด ค่าการปล่อยแฝงจะดึงมาจากรายงานนั้น จึงเปลี่ยนตามเมื่อรายงานนั้นเปลี่ยน",
  "This installation has no other product report for the year":
    "โรงงานนี้ไม่มีรายงานผลิตภัณฑ์อื่นในปีนี้",
  "Add a product made here": "เพิ่มผลิตภัณฑ์ที่ผลิตที่นี่",
  "This installation has no other product report for {year}, so nothing it makes can go into this product. Create the other report first.":
    "โรงงานนี้ไม่มีรายงานผลิตภัณฑ์อื่นของปี {year} จึงยังไม่มีสิ่งที่ผลิตเองมาใช้ในผลิตภัณฑ์นี้ได้ ให้สร้างรายงานอีกฉบับก่อน",
  "None. If a product this site makes goes into this one, add it here.":
    "ยังไม่มี ถ้าผลิตภัณฑ์ที่โรงงานนี้ผลิตเองถูกนำมาใช้ในผลิตภัณฑ์นี้ ให้เพิ่มที่นี่",
  "Made here": "ผลิตที่นี่",
  "Product report": "รายงานผลิตภัณฑ์",
  "Of this installation, for the same year.": "ของโรงงานนี้ ในปีเดียวกัน",
  "Tonnes used in the year": "ตันที่ใช้ในปี",
  "Everything consumed, including what never reached the finished good.":
    "ปริมาณที่ใช้ไปทั้งหมด รวมส่วนที่ไม่ได้ไปอยู่ในสินค้าสำเร็จรูป",
  "Tonnes used": "ตันที่ใช้",
  "Embedded emissions it carries": "ค่าการปล่อยแฝงที่ติดไปด้วย",
  "Adds {n} tCO₂e per tonne to this good.": "เพิ่ม {n} tCO₂e ต่อตันให้สินค้านี้",
  "The product report it came from no longer exists.":
    "รายงานผลิตภัณฑ์ต้นทางนี้ไม่มีอยู่แล้ว",
  "Enter how many tonnes of it this good used.": "กรอกจำนวนตันของมันที่สินค้านี้ใช้",
  "This good has no production counted yet, so the quantity cannot be put per tonne.":
    "สินค้านี้ยังไม่มีปริมาณการผลิตที่นับแล้ว จึงยังคำนวณปริมาณต่อตันไม่ได้",
  "Filled by Cera from {file}. Cera can make mistakes — check it against the document and edit it if it is wrong.":
    "Cera กรอกจาก {file} — Cera อาจผิดพลาดได้ โปรดตรวจเทียบกับเอกสารและแก้ไขหากไม่ถูกต้อง",
  "Cera filled": "Cera กรอกให้",
  "Cera filled {n} values from your documents — they are in green.":
    "Cera กรอกให้ {n} ค่าจากเอกสารของคุณ — แสดงเป็นสีเขียว",
  "Cera can make mistakes — check each value against its document. Typing over a value makes it yours.":
    "Cera อาจผิดพลาดได้ — โปรดตรวจแต่ละค่ากับเอกสาร หากพิมพ์ทับ ค่านั้นจะกลายเป็นค่าของคุณ",
  "Worked out from the stock change below.":
    "คำนวณจากการเปลี่ยนแปลงของสต็อกด้านล่าง",
  "This good's share of the shared meter below.":
    "ส่วนแบ่งของสินค้านี้จากมิเตอร์ที่ใช้ร่วมกันด้านล่าง",
  "Process gases such as blast-furnace or coke-oven gas, by their energy content — or by volume and composition, gas by gas.":
    "ก๊าซจากกระบวนการ เช่น ก๊าซเตาถลุงเหล็กหรือก๊าซเตาอบถ่านโค้ก บันทึกเป็นปริมาณพลังงาน — หรือบันทึกทีละก๊าซตามปริมาตรและองค์ประกอบ",
  "The balance, from the gases above": "ดุลของก๊าซ คำนวณจากรายการด้านบน",
  "Record it gas by gas — volume and composition":
    "บันทึกทีละก๊าซ — ปริมาตรและองค์ประกอบ",
  "One meter or invoice": "มิเตอร์หรือใบแจ้งหนี้ใบเดียว",
  "The quantity is read off a single figure": "ปริมาณอ่านได้จากตัวเลขเดียว",
  "Deliveries and stock": "การส่งมอบและสต็อก",
  "Delivered + stock at the start − stock at the end":
    "ส่งมอบ + สต็อกต้นเดือน − สต็อกปลายเดือน",
  "A share of a shared meter": "ส่วนแบ่งจากมิเตอร์ที่ใช้ร่วมกัน",
  "One meter feeds several product reports": "มิเตอร์เดียวจ่ายให้หลายรายงานผลิตภัณฑ์",
  "How the quantity is found": "หาปริมาณได้อย่างไร",
  "Delivered in the month": "ส่งมอบในเดือนนี้",
  Delivered: "ส่งมอบ",
  "Stock at the start": "สต็อกต้นเดือน",
  "What was in the tank or yard on the 1st.": "ปริมาณในถังหรือลานกองของวันที่ 1",
  "Opening stock": "สต็อกต้นเดือน",
  "Stock at the end": "สต็อกปลายเดือน",
  "What was left on the last day.": "ปริมาณที่เหลือในวันสุดท้ายของเดือน",
  "Closing stock": "สต็อกปลายเดือน",
  "Used this month:": "ใช้ในเดือนนี้:",
  Meter: "มิเตอร์",
  "Its name or tag.": "ชื่อหรือรหัสของมิเตอร์",
  "The whole meter's reading": "ค่าที่อ่านได้จากมิเตอร์ทั้งหมด",
  "For the month, across every product it feeds.":
    "ของทั้งเดือน รวมทุกผลิตภัณฑ์ที่มิเตอร์จ่ายให้",
  "Whole meter reading": "ค่ามิเตอร์ทั้งหมด",
  "Split by": "แบ่งตาม",
  "The allocation key. A verifier recomputes the share from it.":
    "เกณฑ์การแบ่งสัดส่วน ผู้ทวนสอบจะคำนวณส่วนแบ่งซ้ำจากเกณฑ์นี้",
  "Allocation key": "เกณฑ์การแบ่งสัดส่วน",
  "This good's share": "ส่วนแบ่งของสินค้านี้",
  "Between 0 and 100 %.": "ระหว่าง 0 ถึง 100 %",
  "Share of the meter": "ส่วนแบ่งของมิเตอร์",
  "Energy burned for this good": "พลังงานที่เผาไหม้เพื่อสินค้านี้",
  "Tonnes of this good": "ตันของสินค้านี้",
  "This good's value of the key": "ค่าของสินค้านี้ตามเกณฑ์",
  "Total across the products the meter feeds": "ผลรวมของทุกผลิตภัณฑ์ที่มิเตอร์จ่ายให้",
  "Total of the key": "ผลรวมตามเกณฑ์",
  "Fill from the other product reports": "ดึงจากรายงานผลิตภัณฑ์อื่น",
  "This good's share:": "ส่วนแบ่งของสินค้านี้:",
  takes: "ได้รับ",
  "Tonnes made": "ตันที่ผลิต",
  "Energy burned": "พลังงานที่เผาไหม้",
  "A share I set": "สัดส่วนที่ฉันกำหนดเอง",
  "Stock figures cannot be negative.": "ตัวเลขสต็อกติดลบไม่ได้",
  "The stock left at the end is larger than what came in plus what was there at the start.":
    "สต็อกปลายเดือนมากกว่าปริมาณที่ส่งมอบรวมกับสต็อกต้นเดือน",
  "Enter what was delivered and the stock at the start and the end of the month.":
    "กรอกปริมาณที่ส่งมอบ และสต็อกต้นเดือนกับปลายเดือน",
  "Enter the whole meter's reading for the month.":
    "กรอกค่าที่อ่านได้จากมิเตอร์ทั้งหมดของเดือนนี้",
  "Enter this good's share of the meter, from 0 to 100 %.":
    "กรอกส่วนแบ่งของสินค้านี้จากมิเตอร์ ตั้งแต่ 0 ถึง 100 %",
  "Enter this good's energy and the total of every product report the meter feeds.":
    "กรอกพลังงานของสินค้านี้ และผลรวมของทุกรายงานผลิตภัณฑ์ที่มิเตอร์จ่ายให้",
  "Enter this good's tonnes and the total of every product report the meter feeds.":
    "กรอกตันของสินค้านี้ และผลรวมของทุกรายงานผลิตภัณฑ์ที่มิเตอร์จ่ายให้",
  "The total the meter is split across has to be above zero.":
    "ผลรวมที่ใช้แบ่งมิเตอร์ต้องมากกว่าศูนย์",
  "This good's figure cannot be larger than the total it is a part of.":
    "ตัวเลขของสินค้านี้มากกว่าผลรวมที่มันเป็นส่วนหนึ่งไม่ได้",
  "Remove gas": "ลบก๊าซ",
  "Which gas": "ก๊าซชนิดใด",
  "Waste gas": "ก๊าซเสียจากกระบวนการ",
  "Name of the gas": "ชื่อก๊าซ",
  "What happened to it": "เกิดอะไรขึ้นกับก๊าซนี้",
  Flow: "การไหล",
  Volume: "ปริมาตร",
  "Nm³ in the month.": "Nm³ ในเดือนนี้",
  "Leave empty to use the composition, or the typical value.":
    "เว้นว่างไว้เพื่อใช้ค่าจากองค์ประกอบ หรือค่าทั่วไปของก๊าซนั้น",
  "% by volume": "% โดยปริมาตร",
  "Energy:": "พลังงาน:",
  "other (N₂ and the rest)": "อื่น ๆ (N₂ และส่วนที่เหลือ)",
  "Add a gas": "เพิ่มก๊าซ",
  "your own value": "ค่าที่คุณกรอกเอง",
  "worked out from the composition": "คำนวณจากองค์ประกอบ",
  "the typical value for this gas": "ค่าทั่วไปของก๊าซชนิดนี้",
  "not known yet": "ยังไม่ทราบ",
  "Blast furnace gas": "ก๊าซเตาถลุงเหล็ก",
  "Coke oven gas": "ก๊าซเตาอบถ่านโค้ก",
  "Converter (oxygen steel furnace) gas": "ก๊าซจากเตาแปลงเหล็ก",
  "Another process gas": "ก๊าซกระบวนการชนิดอื่น",
  "Came in from another installation": "รับเข้าจากโรงงานอื่น",
  "Sent to another installation": "ส่งไปยังโรงงานอื่น",
  "Name the gas.": "ระบุชื่อก๊าซ",
  "Enter the volume in Nm³.": "กรอกปริมาตรเป็น Nm³",
  "A composition figure is a percentage, 0 to 100.":
    "ค่าองค์ประกอบเป็นเปอร์เซ็นต์ ตั้งแต่ 0 ถึง 100",
  "The composition adds up to more than 100 %.": "องค์ประกอบรวมกันเกิน 100 %",
  "Give the calorific value or the composition, so the energy can be worked out.":
    "ระบุค่าความร้อนหรือองค์ประกอบ เพื่อให้คำนวณพลังงานได้",
  "Worked out from the deliveries below.": "คำนวณจากรายการส่งมอบด้านล่าง",
  "Record it by delivery — supplier, grade and origin":
    "บันทึกเป็นรายการส่งมอบ — ผู้ขาย เกรด และแหล่งที่มา",
  "Scrap by delivery": "เศษโลหะแยกตามรายการส่งมอบ",
  "Add a delivery": "เพิ่มรายการส่งมอบ",
  Delivery: "การส่งมอบ",
  "Remove delivery": "ลบรายการส่งมอบ",
  Grade: "เกรด",
  "As the supplier sells it.": "ตามที่ผู้ขายระบุขาย",
  Origin: "แหล่งที่มา",
  "Scrap origin": "แหล่งที่มาของเศษโลหะ",
  "Tonnes delivered": "ตันที่ส่งมอบ",
  "From the deliveries:": "จากรายการส่งมอบ:",
  "in all": "ทั้งหมด",
  "Pre-consumer (offcuts, runaround, from manufacturing)":
    "Pre-consumer (เศษตัดและของเสียจากกระบวนการผลิต)",
  "Post-consumer (end of life)": "Post-consumer (สินค้าหมดอายุการใช้งาน)",
  "Name the supplier.": "ระบุชื่อผู้ขาย",
  "Enter the tonnes delivered.": "กรอกจำนวนตันที่ส่งมอบ",
  "Lines of cells": "สายเซลล์ผลิต",
  "Back to one cell type": "กลับไปใช้เซลล์ชนิดเดียว",
  "Add a line": "เพิ่มสาย",
  Line: "สาย",
  "Remove line": "ลบสาย",
  "Potline or potroom.": "สายเซลล์หรือห้องเซลล์",
  "Share of the metal": "สัดส่วนของโลหะ",
  "Of this month's primary aluminium. All lines add up to 100 %.":
    "ของอะลูมิเนียมปฐมภูมิเดือนนี้ ทุกสายรวมกันต้องได้ 100 %",
  "Cell-days in the month": "เซลล์-วันในเดือนนี้",
  "Cells in operation × days — so the minutes can be traced to the cells.":
    "จำนวนเซลล์ที่เดินเครื่อง × จำนวนวัน — เพื่อให้ตามรอยจำนวนนาทีกลับไปยังเซลล์ได้",
  "Cell-days": "เซลล์-วัน",
  "Anode effects per cell-day": "จำนวนครั้งของแอโนดเอฟเฟกต์ต่อเซลล์-วัน",
  "How often one happens, on average. 0 if none.":
    "โดยเฉลี่ยเกิดบ่อยแค่ไหน ถ้าไม่มีให้ใส่ 0",
  "Minutes each lasts": "แต่ละครั้งนานกี่นาที",
  "Minutes per anode effect": "นาทีต่อแอโนดเอฟเฟกต์หนึ่งครั้ง",
  "Minutes per cell-day:": "นาทีต่อเซลล์-วัน:",
  "Shares add up to": "สัดส่วนรวมกันได้",
  "Average minutes per cell-day:": "นาทีเฉลี่ยต่อเซลล์-วัน:",
  "My cells are not all one type, or the lines run differently":
    "เซลล์ของฉันไม่ได้เป็นชนิดเดียวกันทั้งหมด หรือแต่ละสายเดินเครื่องไม่เหมือนกัน",
  "What the steel is made of": "เหล็กนี้ประกอบด้วยอะไรบ้าง",
  "Product composition": "องค์ประกอบของผลิตภัณฑ์",
  "The alloying elements of what was made this month, from the mill test certificates, weighted by the heats cast.":
    "ธาตุผสมของสิ่งที่ผลิตในเดือนนี้ จากใบรับรองผลทดสอบของโรงงานเหล็ก ถ่วงน้ำหนักตามจำนวนชาร์จที่หล่อ",
  "The report states Mn, Cr, Ni and the other alloying elements for the year: the months' figures, weighted by what was made in each. Leave a month empty if it was ordinary carbon steel with only trace elements.":
    "รายงานจะระบุ Mn, Cr, Ni และธาตุผสมอื่นของทั้งปี โดยนำตัวเลขรายเดือนมาถ่วงน้ำหนักตามปริมาณที่ผลิตในแต่ละเดือน ถ้าเดือนนั้นเป็นเหล็กกล้าคาร์บอนธรรมดาที่มีธาตุอื่นเพียงเล็กน้อย ให้เว้นว่างไว้",
  "Optional. Weighted by tonnes made across the year in the report.":
    "ไม่บังคับ รายงานจะถ่วงน้ำหนักตามตันที่ผลิตทั้งปี",
  "Manganese.": "แมงกานีส",
  "Chromium.": "โครเมียม",
  "Nickel.": "นิกเกิล",
  "All other alloying elements together.": "ธาตุผสมอื่นทั้งหมดรวมกัน",
  "Where the figures come from": "ตัวเลขมาจากไหน",
  "So a verifier knows which certificates to ask for.":
    "เพื่อให้ผู้ทวนสอบรู้ว่าควรขอใบรับรองฉบับไหน",
  "The alloying elements add up to more than 100 %.": "ธาตุผสมรวมกันเกิน 100 %",
  "Ask about CBAM or Certrace": "ถามเรื่อง CBAM หรือ Certrace",
  "Text or CSV · one at a time · or press to choose":
    "ไฟล์ข้อความหรือ CSV · ครั้งละหนึ่งไฟล์ · หรือกดเพื่อเลือกไฟล์",
  "What goes to the verifier": "สิ่งที่ส่งให้ผู้ทวนสอบ",
  "Everything this installation hands over for {year}, in one package: the reports you write, and the papers that travel with them.":
    "ทุกอย่างที่โรงงานนี้ส่งมอบสำหรับปี {year} ในแพ็กเกจเดียว: รายงานที่คุณจัดทำ และเอกสารที่แนบไปด้วย",
  Attachments: "เอกสารแนบ",
  "Not reports you write. Each is an index of papers that travel in the package, beside the reports — and neither holds the package back.":
    "ไม่ใช่รายงานที่คุณต้องเขียน แต่ละรายการคือดัชนีของเอกสารที่ส่งไปในแพ็กเกจเคียงข้างรายงาน — และไม่มีรายการใดทำให้แพ็กเกจติดค้าง",
  "Monitoring plan, operator's emissions report, summary report":
    "แผนการติดตาม รายงานการปล่อยของผู้ดำเนินการ รายงานสรุป",
  Addendum: "ภาคผนวกเฉพาะผู้ยื่น",
  "Electricity goes to the EU — one per declarant":
    "มีการส่งไฟฟ้าเข้า EU — หนึ่งฉบับต่อผู้ยื่นแต่ละราย",
  "Not needed — no electricity goes to the EU": "ไม่ต้องทำ — ไม่มีการส่งไฟฟ้าเข้า EU",
  "Precursor verification reports, supporting evidence":
    "รายงานการทวนสอบของวัตถุดิบตั้งต้น และหลักฐานประกอบ",
  Contains: "ประกอบด้วย",
  "to get": "ที่ต้องหามา",
  "Still to get": "ยังต้องหามา",
  "Each installation you report on hands over one package a year: the monitoring plan, the operator's emissions report and the summary report — a declarant addendum where electricity goes to the EU — and, beside them, the verification reports of your precursors' installations and the supporting evidence. It covers every product the site makes, and downloads once all of it is complete.":
    "โรงงานแต่ละแห่งที่คุณรายงานจะส่งมอบหนึ่งแพ็กเกจต่อปี ได้แก่ แผนการติดตาม รายงานการปล่อยของผู้ดำเนินการ และรายงานสรุป — บวกภาคผนวกเฉพาะผู้ยื่นหากมีการส่งไฟฟ้าเข้า EU — พร้อมรายงานการทวนสอบของโรงงานผู้ผลิตวัตถุดิบตั้งต้นและหลักฐานประกอบแนบไว้เคียงกัน ครอบคลุมทุกผลิตภัณฑ์ของโรงงานและดาวน์โหลดได้เมื่อครบทุกส่วน",
  documents: "เอกสาร",
  "The product report is not complete": "รายงานผลิตภัณฑ์ยังไม่สมบูรณ์",
  "{n} of {total} product reports are not complete":
    "รายงานผลิตภัณฑ์ {n} จาก {total} ฉบับยังไม่สมบูรณ์",
  "{n} item(s) of the installation's information are still missing":
    "ข้อมูลของโรงงานยังขาดอีก {n} รายการ",
  "{n} item(s) to do": "ต้องทำอีก {n} รายการ",
  "Monitoring plan": "แผนการติดตาม",
  "Operator's emissions report":
    "รายงานการปล่อยของผู้ดำเนินการ (Operator's emissions report)",
  "Operator's summary emissions report":
    "รายงานสรุปการปล่อยของผู้ดำเนินการ (Operator's summary emissions report)",
  "Declarant-specific addendum": "ภาคผนวกเฉพาะผู้ยื่น",
  "Verification reports of precursor installations":
    "รายงานการทวนสอบของโรงงานผู้ผลิตวัตถุดิบตั้งต้น",
  "Supporting evidence and records": "หลักฐานและบันทึกประกอบ",
  "What the installation monitors and how, element by element as the template lists them. The verifier reads it before the year is verified.":
    "โรงงานติดตามอะไรและติดตามอย่างไร ไล่ทีละองค์ประกอบตามแบบฟอร์ม ผู้ทวนสอบอ่านก่อนเริ่มทวนสอบปีนั้น",
  "The full report the verifier verifies. It is in English (Article 10(4)).":
    "รายงานฉบับเต็มที่ผู้ทวนสอบตรวจ จัดทำเป็นภาษาอังกฤษ (ข้อ 10(4))",
  "The shortened report passed on to authorised CBAM declarants (Article 8).":
    "รายงานฉบับย่อที่ส่งต่อให้ผู้ยื่น CBAM ที่ได้รับอนุญาต (ข้อ 8)",
  "One per authorised declarant, only for electricity imported into the EU.":
    "หนึ่งฉบับต่อผู้ยื่นที่ได้รับอนุญาตแต่ละราย ใช้เฉพาะไฟฟ้าที่นำเข้า EU",
  "This installation does not export electricity to the EU, so no addendum is needed.":
    "โรงงานนี้ไม่ได้ส่งไฟฟ้าเข้า EU จึงไม่ต้องมีภาคผนวกนี้",
  "The verification reports of the installations that made your precursors on actual values. The reports themselves are in the package, beside this index.":
    "รายงานการทวนสอบของโรงงานที่ผลิตวัตถุดิบตั้งต้นซึ่งคุณใช้ค่าจริง ตัวรายงานอยู่ในแพ็กเกจเคียงข้างดัชนีนี้",
  "Every document behind a figure, and the figure it supports, so the verifier can sample a month and find its paper. The documents themselves are in the package, beside this index.":
    "เอกสารทุกฉบับที่อยู่เบื้องหลังตัวเลข พร้อมตัวเลขที่เอกสารนั้นรองรับ เพื่อให้ผู้ทวนสอบสุ่มเดือนใดก็หาเอกสารของเดือนนั้นเจอ ตัวเอกสารอยู่ในแพ็กเกจเคียงข้างดัชนีนี้",
  "Operator and installation": "ผู้ดำเนินการและโรงงาน",
  "1 · Operator and installation": "1 · ผู้ดำเนินการและโรงงาน",
  "1–2 · Operator and installation": "1–2 · ผู้ดำเนินการและโรงงาน",
  "1–6 · The installation and its goods": "1–6 · โรงงานและสินค้า",
  "2–6 · Summary of the monitoring plan": "2–6 · สรุปแผนการติดตาม",
  "3–6 · Processes and emissions": "3–6 · กระบวนการและการปล่อย",
  "7–11 · Heat, fuels, gases and electricity":
    "7–11 · ความร้อน เชื้อเพลิง ก๊าซ และไฟฟ้า",
  "7–12 · Direct emissions and electricity": "7–12 · การปล่อยทางตรงและไฟฟ้า",
  "7–13 · How each production process is monitored":
    "7–13 · วิธีติดตามแต่ละกระบวนการผลิต",
  "12–16 · Precursors": "12–16 · วัตถุดิบตั้งต้น",
  "13–15 · Goods and specific embedded emissions":
    "13–15 · สินค้าและค่าการปล่อยแฝงจำเพาะ",
  "14–19 · Precursors, fuels, heat and electricity":
    "14–19 · วัตถุดิบตั้งต้น เชื้อเพลิง ความร้อน และไฟฟ้า",
  "16–17 · Total emissions and balances": "16–17 · การปล่อยรวมและดุล",
  "18–28 · Precursors": "18–28 · วัตถุดิบตั้งต้น",
  "20–21 · Waste gases and CO2": "20–21 · ก๊าซเสียและ CO2",
  "22 · The control system that keeps the data right":
    "22 · ระบบควบคุมที่ทำให้ข้อมูลถูกต้อง",
  "29–35 · Attribution and parameters": "29–35 · การปันส่วนและค่าพารามิเตอร์",
  "Precursors on actual values, made outside the Union":
    "วัตถุดิบตั้งต้นที่ใช้ค่าจริง ผลิตนอกสหภาพยุโรป",
  "Documents expected, month by month": "เอกสารที่ต้องมี แยกรายเดือน",
  "Documents attached": "เอกสารที่แนบแล้ว",
  "Partly there": "มีบางส่วน",
  Missing: "ยังไม่มี",
  "Kept outside the portal": "เก็บไว้นอกระบบ",
  Cover: "ปก",
  "Work it out from deliveries and stock": "คำนวณจากการส่งมอบและสต็อก",
  "To do": "ต้องทำ",
  "Cera reads a file and fills the form. You check every figure before it is saved — Cera can make mistakes.":
    "Cera อ่านไฟล์แล้วกรอกฟอร์มให้ คุณตรวจทุกตัวเลขก่อนบันทึก — Cera อาจผิดพลาดได้",
  "Drop a file on the document it belongs to, or click it to choose one.":
    "ลากไฟล์ไปวางบนเอกสารที่ตรงกัน หรือคลิกที่ช่องนั้นเพื่อเลือกไฟล์",
  "Calibration certificate for measuring instruments — and, where an instrument is under legal metrological control, its verification certificate":
    "ใบรับรองการสอบเทียบเครื่องมือวัด — และหากเครื่องมือนั้นอยู่ภายใต้การควบคุมทางมาตรวิทยาตามกฎหมาย ให้แนบใบรับรองการตรวจสอบด้วย",
  "Single line diagram — the direct connection between the generator and the installation":
    "แผนภาพเส้นเดี่ยว — แสดงการเชื่อมต่อโดยตรงระหว่างเครื่องกำเนิดไฟฟ้ากับโรงงาน",
  "Smart-meter data — what the generator produced and what was delivered to the installation, in periods of an hour or less":
    "ข้อมูลสมาร์ทมิเตอร์ — ปริมาณที่เครื่องกำเนิดผลิตได้และที่ส่งมายังโรงงาน ในช่วงเวลาไม่เกินหนึ่งชั่วโมง",
  "Stock records — the quantity in store at the start and at the end of the month, and the delivery notes":
    "บันทึกสต็อก — ปริมาณคงคลังต้นเดือนและปลายเดือน พร้อมใบส่งของ",
  "Meter log and allocation basis — the whole meter's reading, and the figures the split between products is made from":
    "บันทึกมิเตอร์และเกณฑ์การแบ่งสัดส่วน — ค่าที่อ่านได้จากมิเตอร์ทั้งหมด และตัวเลขที่ใช้แบ่งระหว่างผลิตภัณฑ์",
  "Waste-gas flow and analysis records — the volume and the composition of each gas":
    "บันทึกการไหลและผลวิเคราะห์ก๊าซเสีย — ปริมาตรและองค์ประกอบของก๊าซแต่ละชนิด",
  "Mill test certificates — the alloy analysis of the heats made in the month":
    "ใบรับรองผลทดสอบของโรงงานเหล็ก — ผลวิเคราะห์ธาตุผสมของชาร์จที่ผลิตในเดือนนี้",
  "Continuous measurement records and the calibration (QAL2) certificate of each analyser":
    "บันทึกการวัดต่อเนื่อง และใบรับรองการสอบเทียบ (QAL2) ของเครื่องวิเคราะห์แต่ละเครื่อง",
  "Records of the CO₂ received or sent on — the quantities, and the receiving installation's or storage site's confirmation":
    "บันทึก CO₂ ที่รับเข้าหรือส่งต่อ — ปริมาณ และหนังสือยืนยันจากโรงงานปลายทางหรือแหล่งกักเก็บ",
  "Heat meter records and the statement of the installation the heat came from or went to":
    "บันทึกมิเตอร์ความร้อน และหนังสือยืนยันจากโรงงานที่ส่งหรือรับความร้อน",
};
