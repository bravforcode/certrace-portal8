/* ════════════════════════════════════════════════════════════
   WHAT CERA KNOWS, IN THAI

   The Thai side of lib/cera/knowledge.ts: every entry has the same id in both languages, so there is
   one meaning and two ways of saying it. A question typed in Thai is matched on the Thai phrases of
   each entry; a question that is one of Cera's own suggestions (the buttons under a reply, the chips
   on the welcome screen) is recognised exactly and answered from the English entry it stands for.

   Thai is written without spaces between words, so matching is on letters: both the question and the
   phrase are stripped of spaces and punctuation, and a phrase counts when the question contains it.
   The longer the phrase that fits, the more it is worth — the same idea as the English matcher.
   ════════════════════════════════════════════════════════════ */

import { squash } from "./lang";
import { entryById } from "./knowledge";
import type { ThEntry } from "./knowledge-th-types";
import { TH_CBAM_1 } from "./knowledge-th/cbam-1";
import { TH_CBAM_2 } from "./knowledge-th/cbam-2";
import { TH_CBAM_3 } from "./knowledge-th/cbam-3";
import { TH_PLATFORM_1 } from "./knowledge-th/platform-1";
import { TH_PLATFORM_2 } from "./knowledge-th/platform-2";
import { TH_PLATFORM_3, TH_PLATFORM_NEW } from "./knowledge-th/platform-3";

export const TH_KNOWLEDGE: Record<string, ThEntry> = { ...TH_CBAM_1, ...TH_CBAM_2, ...TH_CBAM_3, ...TH_PLATFORM_1, ...TH_PLATFORM_2, ...TH_PLATFORM_3, ...TH_PLATFORM_NEW };

/** Every question Cera offers as a button, in English and in Thai. The Thai side is what a button sends when the interface is Thai. */
export const Q_TH: Record<string, string> = {
  "Who is late and what should I chase first?": "ใครล่าช้า และควรตามใครก่อน",
  "Which suppliers should I get verified figures from?": "ควรขอตัวเลขที่ผ่านการทวนสอบจากซัพพลายเออร์รายใด",
  "What is Thailand's carbon price?": "ราคาคาร์บอนของไทยคือเท่าไหร่",
  "Am I the declarant?": "ฉันเป็นผู้ยื่นหรือเปล่า",
  "Can I deduct a carbon tax?": "หักภาษีคาร์บอนได้ไหม",
  "Can I fill in a month myself?": "กรอกเดือนเองได้ไหม",
  "Can I use biomass as zero?": "ใช้ชีวมวลเป็นศูนย์ได้ไหม",
  "Default or actual?": "ค่า default หรือค่าจริง",
  "Do I need a verifier?": "ต้องมีผู้ทวนสอบไหม",
  "Which goods CBAM covers": "CBAM ครอบคลุมสินค้าอะไร",
  "How are emissions shared between goods?": "การปล่อยแบ่งระหว่างสินค้าอย่างไร",
  "How do I add a precursor in Certrace?": "เพิ่มวัตถุดิบตั้งต้นใน Certrace อย่างไร",
  "How do I add a supplier?": "เพิ่มซัพพลายเออร์อย่างไร",
  "How do I add an installation in Certrace?": "เพิ่มโรงงานใน Certrace อย่างไร",
  "How do I add an installation?": "เพิ่มโรงงานอย่างไร",
  "How do I calculate fuel emissions?": "คำนวณการปล่อยจากเชื้อเพลิงอย่างไร",
  "How do I create a product report?": "สร้างรายงานผลิตภัณฑ์อย่างไร",
  "How do I duplicate a product report?": "ทำสำเนารายงานผลิตภัณฑ์อย่างไร",
  "What are the tabs of an installation?": "โรงงานมีแท็บอะไรบ้าง",
  "Why does my product report say Blocked?": "ทำไมรายงานผลิตภัณฑ์ขึ้นว่าติดขัด",
  "How do I handle precursors?": "จัดการวัตถุดิบตั้งต้นอย่างไร",
  "How do I invite a colleague?": "เชิญเพื่อนร่วมงานอย่างไร",
  "How do I record electricity in Certrace?": "บันทึกไฟฟ้าใน Certrace อย่างไร",
  "How do I send a reminder?": "ส่งการเตือนอย่างไร",
  "How do precursors work?": "วัตถุดิบตั้งต้นทำงานอย่างไร",
  "How do process emissions work?": "การปล่อยจากกระบวนการทำงานอย่างไร",
  "How does Cera's smart upload work?": "สมาร์ทอัพโหลดของ Cera ทำงานอย่างไร",
  "How does smart upload work?": "สมาร์ทอัพโหลดทำงานอย่างไร",
  "How does the free allocation phase out?": "สิทธิ์ฟรีทยอยลดอย่างไร",
  "How does the monthly link work?": "ลิงก์รายเดือนทำงานอย่างไร",
  "How is electricity emissions calculated?": "คำนวณการปล่อยจากไฟฟ้าอย่างไร",
  "How is free allocation deducted?": "หักสิทธิ์ฟรีอย่างไร",
  "How is heat treated?": "ความร้อนนับอย่างไร",
  "How is the carbon price deducted?": "หักราคาคาร์บอนอย่างไร",
  "How long must I keep records?": "ต้องเก็บบันทึกนานแค่ไหน",
  "How many reports do I send to the verifier?": "ต้องส่งรายงานกี่ฉบับให้ผู้ทวนสอบ",
  "How much will CBAM cost me?": "CBAM จะมีต้นทุนเท่าไร",
  "Is my CN code in scope?": "รหัส CN ของฉันอยู่ในขอบเขตไหม",
  "Should I use default or actual values?": "ควรใช้ค่า default หรือค่าจริงดี",
  "Smart upload": "สมาร์ทอัพโหลด",
  "Where do I stand?": "ตอนนี้ฉันอยู่ตรงไหน",
  "How is the free allocation deducted?": "ส่วนจัดสรรฟรีถูกหักออกอย่างไร",
  "Thailand's default values": "ค่า default ของประเทศไทย",
  "What about site visits?": "การเข้าตรวจที่โรงงานเป็นอย่างไร",
  "What are direct vs indirect emissions?": "การปล่อยทางตรงกับทางอ้อมต่างกันอย่างไร",
  "What are embedded emissions?": "การปล่อยที่ฝังอยู่คืออะไร",
  "What are functional units?": "หน่วยการทำงานคืออะไร",
  "What are latitude and longitude for?": "ละติจูดและลองจิจูดใช้ทำอะไร",
  "What are the key CBAM dates?": "วันสำคัญของ CBAM มีอะไรบ้าง",
  "What are the tabs of a product report?": "รายงานผลิตภัณฑ์มีแท็บอะไรบ้าง",
  "What can Cera do?": "Cera ทำอะไรได้บ้าง",
  "What do the numbered boxes mean?": "กล่องตัวเลขหมายถึงอะไร",
  "What does each sidebar item do?": "เมนูด้านข้างแต่ละอันทำอะไร",
  "What does sign-off do?": "การลงนามทำอะไร",
  "What does the package include in Certrace?": "แพ็กเกจใน Certrace มีอะไรบ้าง",
  "What does the plant fill in each month?": "โรงงานต้องกรอกอะไรบ้างในแต่ละเดือน",
  "What does verification involve?": "การทวนสอบต้องทำอะไรบ้าง",
  "What goes in the installation Overview?": "ภาพรวมโรงงานต้องกรอกอะไร",
  "What goes in the monitoring plan?": "แผนการติดตามมีอะไรบ้าง",
  "What goes in the monthly data?": "ข้อมูลรายเดือนต้องกรอกอะไร",
  "What goes in the operator's report?": "รายงานของผู้ดำเนินการมีอะไรบ้าง",
  "What happens if the declarant is late?": "ถ้าผู้ยื่นล่าช้าจะเกิดอะไรขึ้น",
  "What if I don't know the origin?": "ถ้าไม่ทราบถิ่นกำเนิดทำอย่างไร",
  "What if I don't know the precursor's origin?": "ถ้าไม่ทราบถิ่นกำเนิดของวัตถุดิบตั้งต้นทำอย่างไร",
  "What if my own site makes the precursor?": "ถ้าไซต์ของฉันผลิตวัตถุดิบตั้งต้นเองล่ะ",
  "What is Verification?": "การทวนสอบคืออะไร",
  "What is a default value?": "ค่า default คืออะไร",
  "What is a mass balance?": "สมดุลมวลคืออะไร",
  "What is a precursor?": "วัตถุดิบตั้งต้นคืออะไร",
  "What is a shared meter?": "มิเตอร์ร่วมคืออะไร",
  "What is a stock change?": "การเปลี่ยนแปลงสต็อกคืออะไร",
  "What is an oxidation factor?": "ค่าสัมประสิทธิ์ออกซิเดชันคืออะไร",
  "What is direct vs indirect?": "ทางตรงกับทางอ้อมต่างกันอย่างไร",
  "What is embedded emissions?": "การปล่อยที่ฝังอยู่คืออะไร",
  "What is in the operator's report?": "รายงานของผู้ดำเนินการมีอะไรบ้าง",
  "What is in the report package?": "แพ็กเกจรายงานมีอะไรบ้าง",
  "What is materiality?": "เกณฑ์สาระสำคัญคืออะไร",
  "What is on Plan and billing?": "หน้าแพ็กเกจและการเรียกเก็บเงินมีอะไร",
  "What is readiness?": "ความพร้อมคืออะไร",
  "What is sign-off?": "การลงนามคืออะไร",
  "What is the 50 tonne rule?": "เกณฑ์ 50 ตันคืออะไร",
  "What is the CBAM Registry?": "ทะเบียน CBAM คืออะไร",
  "What is the Reports page?": "หน้ารายงานคืออะไร",
  "What is the UN/LOCODE?": "UN/LOCODE คืออะไร",
  "What is the default for CN 7208?": "ค่า default ของ CN 7208 คือเท่าไร",
  "What is the default value for CN 7318 12 90?": "ค่า default ของ CN 7318 12 90 คือเท่าไร",
  "What is the installation reference?": "รหัสอ้างอิงโรงงานคืออะไร",
  "What is the mark-up?": "ส่วนบวกเพิ่มคืออะไร",
  "What is the operator's emissions report?": "รายงานการปล่อยของผู้ดำเนินการคืออะไร",
  "What is the quarterly holding rule?": "กฎถือใบรับรองรายไตรมาสคืออะไร",
  "What's new in CBAM?": "อัพเดท CBAM",
  "When can certificates be bought?": "ซื้อใบรับรองได้เมื่อไร",
  "When is the first CBAM declaration?": "การยื่น CBAM ครั้งแรกเมื่อไร",
  "Where do I start?": "ควรเริ่มตรงไหน",
  "Which goods are covered?": "สินค้าอะไรบ้างที่ครอบคลุม",
  "Which goods count indirect emissions?": "สินค้าไหนนับการปล่อยทางอ้อม",
  "Who pays for CBAM certificates?": "ใครเป็นผู้จ่ายค่าใบรับรอง CBAM",
  "Why can't I download the package?": "ทำไมดาวน์โหลดแพ็กเกจไม่ได้",
  "Why is everything I type in English?": "ทำไมสิ่งที่พิมพ์ต้องเป็นภาษาอังกฤษ",
  "Why is the calorific value locked?": "ทำไมค่าความร้อนถูกล็อก",
  // used by the engine's own replies and by the welcome chips
  "What is CBAM?": "CBAM คืออะไร",
  "Where do I start in Certrace?": "ควรเริ่มต้นใช้ Certrace จากตรงไหน",
  "Which goods does CBAM cover?": "CBAM ครอบคลุมสินค้าอะไรบ้าง",
  "Why can't I submit a month?": "ทำไมส่งเดือนไม่ได้",
  "What is on the Supply Chain page?": "หน้าห่วงโซ่อุปทานมีอะไร",
  "What are sample numbers?": "ตัวเลขตัวอย่างคืออะไร",
};

/** A suggestion in the language of the reply. A question with no Thai written for it stays English rather than being guessed. */
export const thaiQuestion = (en: string): string => Q_TH[en] ?? en;

const INVERSE = new Map<string, string>(Object.entries(Q_TH).map(([en, th]) => [squash(th), en]));

/** The English question a Thai suggestion stands for, if what was sent is exactly one of them. */
export const englishQuestion = (thai: string): string | undefined => INVERSE.get(squash(thai));

/** The entry a Thai question is about: the one with the longest of its phrases found in the question. */
export function bestThai(query: string): string | null {
  const q = squash(query);
  if (q.length < 3) return null;
  let top: { id: string; score: number } | null = null;
  for (const [id, e] of Object.entries(TH_KNOWLEDGE)) {
    let score = 0;
    for (const key of [...e.keys, e.title]) {
      const k = squash(key);
      if (k.length < 4 || !q.includes(k)) continue;
      // The whole question is the phrase: nothing else to weigh.
      score = Math.max(score, k === q ? k.length + 20 : k.length);
    }
    if (score > 0 && (!top || score > top.score)) top = { id, score };
  }
  return top && top.score >= 5 ? top.id : null;
}

/** Thai text for an entry id, falling back to the English entry when no Thai has been written for it. */
export function thaiAnswer(id: string): { text: string; related: string[] } | null {
  const th = TH_KNOWLEDGE[id];
  const en = entryById(id);
  if (!th || !en) return null;
  return { text: th.answer.trim(), related: (en.related ?? []).map(thaiQuestion).slice(0, 3) };
}
