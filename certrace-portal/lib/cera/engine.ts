/* ════════════════════════════════════════════════════════════
   CERA'S BRAIN — one question in, one reply out

   Order matters, and it is the order a careful person would listen in:

     1 · IS THIS SOMETHING CERA WILL TALK ABOUT AT ALL (lib/cera/guard.ts) — before
         anything is looked up, because a question about how the product is built
         must not reach the part that answers questions.
     2 · IS IT SMALL TALK — hello, thanks.
     3 · IS IT A REQUEST FOR AN ACTION — start the smart upload, show what's new in
         the rules.
     4 · IS IT A QUESTION ABOUT NUMBERS Cera can look up — a CN code's default
         value, what is chargeable — or about the reader's own account — where
         they stand, what is missing.
     5 · OTHERWISE, WHAT DOES CERA KNOW (lib/cera/knowledge.ts).
     6 · IF NOTHING FITS, SAY SO, and offer what Cera can do.

   There is no language model behind this: every answer is written down, checkable
   and the same twice. It cannot be talked into anything, and it never answers
   from memory of something it is unsure of. A model can be put behind `reply`
   later without changing anything around it.
   ════════════════════════════════════════════════════════════ */

import { COUNTRIES } from "@/lib/config";
import { localeFor, translate } from "@/lib/i18n";
import { lookupUnknownOrigin, rateSheet } from "@/lib/cbam/eu-rates";
import { listWorkspaces } from "@/lib/workspace";
import { workspaceReadiness } from "@/lib/readiness";
import { best, entryById } from "./knowledge";
import { checkQuestion, looksOnTopic, refusal } from "./guard";
import { chaseReply, verifyReply } from "./data-replies";
import { UPDATES_AS_OF, splitUpdates } from "./updates";
import { UPDATES_TH } from "./updates-th";
import { UPDATES_ZH } from "./updates-zh";
import { UPDATES_HI } from "./updates-hi";
import { bestLocal, englishQuestionFor, localAnswer, localQuestion } from "./knowledge-local";
import { langOf, pick, squash, type CeraLang } from "./lang";
import type { CeraReply, UpdateItem } from "./types";

const fmt = (v: number | null | undefined, dp = 3) =>
  v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/* ── What to ask next, when there is nothing in particular ───── */
export const CERA_SUGGESTIONS = ["What's new in CBAM?", "Smart upload", "What is the default value for CN 7318 12 90?"];

const FALLBACK_SUGGESTIONS = ["What is CBAM?", "What are the key CBAM dates?", "Where do I start in Certrace?"];

/** Suggestions in the language of the reply. */
const sug = (lang: CeraLang, xs: string[]): string[] => (lang === "en" ? xs : xs.map((q) => localQuestion(lang, q)));

/** The digest, in the language of the reply. */
const UPDATE_TEXT = { th: UPDATES_TH, zh: UPDATES_ZH, hi: UPDATES_HI } as const;
const localised = (items: UpdateItem[], lang: CeraLang): UpdateItem[] => (lang === "en" ? items : items.map((u) => ({ ...u, ...(UPDATE_TEXT[lang][u.id] ?? {}) })));

/* ── The same intents, written the way people write them in Thai ── */
const GREETING_TH = /^(สวัสดี|หวัดดี|ดีจ้า|ดีครับ|ดีค่ะ|ฮัลโหล|เฮลโล)[\s!.,ค่ะครับคะจ้า]*$/;
const THANKS_TH = /^(ขอบคุณ|ขอบใจ|โอเค|ได้เลย|เข้าใจแล้ว|ดีมาก|เยี่ยม)[\s!.,ค่ะครับคะจ้านะมาก]*$/;
const IDENTITY_TH = /คุณ(คือใคร|ทำอะไรได้|ช่วยอะไรได้)|เธอคือใคร|cera(คือ|ทำอะไร)|ช่วยอะไรได้บ้าง|ทำอะไรได้บ้าง|^ช่วยด้วย[\s!.?]*$/i;
const UPLOAD_TH = /สมาร์ท\s?อัพโหลด|สมาร์ท\s?อัปโหลด|อัพโหลด(ไฟล์|เอกสาร|บิล|ใบแจ้งหนี้)|อัปโหลด(ไฟล์|เอกสาร|บิล|ใบแจ้งหนี้)|(อ่าน|ดึงข้อมูลจาก|สแกน)(ไฟล์|เอกสาร|บิล)|(กรอก|ใส่)(ข้อมูล)?(เดือน|รายเดือน)?จาก(ไฟล์|เอกสาร)|(ฉัน|ผม|เรา)มี(ไฟล์|เอกสาร|บิล|ใบแจ้งหนี้)|ส่งไฟล์ให้/;
const UPDATES_TH_INTENT = /อัพเดท|อัปเดต|มีอะไรใหม่|ข่าว(ล่าสุด|สาร)|กฎ(เปลี่ยน|ใหม่|ล่าสุด)|เปลี่ยนแปลง(อะไร|ล่าสุด)|กำลังจะมา|cbam\s*ล่าสุด|ล่าสุด\s*cbam/i;
const ACCOUNT_TH = /(รายงานผลิตภัณฑ์|โรงงาน|เดือน|ความพร้อม|ความคืบหน้า|สถานะ).{0,12}ของ(ฉัน|เรา|ผม)|ของ(ฉัน|เรา|ผม).{0,12}(ความพร้อม|ความคืบหน้า|สถานะ|รายงานผลิตภัณฑ์)|ยังขาดอะไร|ยังเหลืออะไร|พร้อมหรือยัง|ฉันอยู่ตรงไหน|สรุป.{0,6}ของ(ฉัน|เรา)/;
/** In Chinese: "smart upload", "upload a file", "read my document". */
const UPLOAD_ZH = /智能上传|上传(文件|文档|账单|发票)|读取(文件|文档)|我有(文件|文档|账单)|发送文件/;
const GREETING_ZH = /^(你好|您好|嗨|哈喽|哈啰|早上好|早安|下午好|晚上好)[\s!！。.,，~]*$/;
const THANKS_ZH = /^(谢谢|多谢|感谢|谢了|好的|好|明白了|知道了|太好了|不错|很好|收到)[\s!！。.,，~]*(你|您)?[\s!！。.,，]*$/;
const IDENTITY_ZH = /你是谁|您是谁|你能做什么|你可以做什么|你会什么|能帮我(做)?什么|怎么帮我|cera是什么|cera能做什么|^帮助[\s!！。?？]*$|^帮帮我[\s!！。?？]*$/i;
const UPDATES_ZH_INTENT = /最新(消息|变化|动态|规则|情况)|有什么新(动态|变化|消息|内容)|有哪些新(动态|变化|消息)|cbam\s*(更新|动态|新闻)|(更新|动态)\s*cbam|规则(有)?(变化|更新|调整)|即将(到来|推出|生效)|近期变化/i;
const ACCOUNT_ZH = /我(目前)?的(进度|进展|状态|就绪|准备情况|产品报告|设施|工厂)|(进度|进展|状态|就绪)(如何|怎么样)|还缺(什么|少什么)|还差(什么|多少)|准备好了吗|我(目前)?处于什么(阶段|位置)|我的情况/;
const HOW_TO_ZH = /怎么|如何|怎样/;
/** "Why does my product report say Blocked?" in Chinese asks what the word means, not where the reader stands. */
const EXPLAIN_BLOCKED_ZH = /(为什么|为何).{0,24}受阻|受阻.{0,8}(是什么|什么意思|指什么|是指)/;
const EXPLAIN_UPLOAD_ZH = /智能上传.{0,8}(如何|怎么|怎样|是什么|工作|原理|支持)|(如何|怎么|怎样|是什么).{0,8}智能上传|支持.{0,4}(哪些)?(文件|格式)/;

/* ── And in Hindi ──────────────────────────────────────────────── */
const GREETING_HI = /^(नमस्ते|नमस्कार|हेलो|हैलो|हाय|हे|सुप्रभात|शुभ\s?(प्रभात|संध्या|दोपहर))[\s!।.,~]*$/;
const THANKS_HI = /^(धन्यवाद|शुक्रिया|थैंक्स|ठीक है|ठीक|समझ गया|समझ गई|समझ आ गया|बढ़िया|बहुत अच्छा|अच्छा)[\s!।.,~]*(जी)?[\s!।.,]*$/;
const IDENTITY_HI = /आप कौन हैं|तुम कौन हो|आप क्या (कर सकते|कर सकती)|तुम क्या कर सकते|आप (मेरी )?क्या मदद|आप कैसे मदद|cera क्या है|cera क्या कर|^मदद[\s!।?]*$|^मेरी मदद करो[\s!।?]*$/i;
const UPLOAD_HI = /स्मार्ट\s?अपलोड|(फ़?ाइल|फाइल|दस्तावेज़|दस्तावेज|बिल|चालान)\s?(अपलोड|पढ़|स्कैन|भेज)|अपलोड\s?करना|मेरे पास (एक )?(फ़?ाइल|फाइल|दस्तावेज़|दस्तावेज|बिल|चालान)|फ़?ाइल\s?से\s?(भर|डाल)/;
const UPDATES_HI_INTENT = /अपडेट|नया क्या है|क्या नया|ताज़ा\s?(खबर|ख़बर|बदलाव|समाचार)|नियमों? (में|के) (बदलाव|परिवर्तन)|नियम (बदल|अपडेट)|आने वाले (बदलाव|नियम)|cbam (समाचार|न्यूज़|न्यूज)/i;
const ACCOUNT_HI = /मेरी?\s?(प्रगति|स्थिति|तैयारी|उत्पाद रिपोर्ट|रिपोर्ट|संयंत्र)|(क्या|कितना) (बाकी|गायब|बचा)|अभी क्या बाकी|मैं (अभी )?कहाँ (हूँ|खड़ा|खड़ी)|कितना तैयार|तैयार हूँ|मेरी हालत/;
const HOW_TO_HI = /कैसे|किस तरह|कैसा/;
const EXPLAIN_BLOCKED_HI = /क्यों.{0,30}अवरुद्ध|अवरुद्ध.{0,12}(क्या|मतलब|अर्थ)/;
const EXPLAIN_UPLOAD_HI = /स्मार्ट\s?अपलोड.{0,14}(कैसे|क्या|काम)|(कैसे|क्या).{0,14}स्मार्ट\s?अपलोड|कौन-?सी (फ़?ाइल|फाइल)/;
const HOW_TO_TH = /ทำอย่างไร|ทำยังไง|ต้องทำอย่างไร/;
/** "Why does my product report say Blocked?" asks what the word means, not where the reader stands — the knowledge answers it. */
const EXPLAIN_BLOCKED = /\b(why|what does|what is|what do you mean)\b[^.?!]*\bblocked\b|ทำไม.{0,24}ติดขัด|ติดขัด.{0,8}(คืออะไร|หมายความว่า|หมายถึง)/i;
/** "How does smart upload work?" is a question about it, not a request to start it. */
const EXPLAIN_UPLOAD = /\b(how (does|do|is)|what (is|does)|which files?|what files?)\b.*\bsmart ?upload\b|\bsmart ?upload\b.*\b(work|works|supported|file types)\b|(ทำงานอย่างไร|คืออะไร|ใช้อย่างไร|รองรับ|ไฟล์อะไร)/i;

/* ── Small talk ──────────────────────────────────────────────── */
const GREETING = /^(hi|hello|hey|hiya|good (morning|afternoon|evening)|sawasdee|sawadee)\b[\s!.,]*$/i;
/* "Who are you", "what can you do" — every word of them is one the matcher ignores, so they are caught here. */
const IDENTITY = /^(who|what) (are|is) (you|cera)\b|\bwhat (can|do) you do\b|\bhow can you help\b|\bwhat can i ask( you)?\b|^help( me)?[\s?!.]*$/i;
const THANKS = /^(thanks|thank you|thx|ty|cheers|great|perfect|ok|okay|cool|nice|got it)\b[\s!.,]*(thanks|thank you)?[\s!.]*$/i;

/* ── Actions ─────────────────────────────────────────────────── */
const UPLOAD_INTENT =
  /\bsmart ?upload\b|\bupload (a |my |the |this |another )?(file|document|doc|bill|invoice|log|report|csv|spreadsheet)\b|\b(read|extract|scan|parse) (my |this |the |a |that )?(file|document|doc|bill|invoice|csv)\b|\b(fill|populate) (in |out )?(the |a |my )?(month|monthly data|form)s? (from|using|with) (a |my |the )?(file|document)\b|\bi (have|got) a (file|document|bill|invoice)\b/i;

const UPDATES_INTENT =
  /\bwhat'?s new\b|\bwhats new\b|\bany news\b|\blatest (news|changes|updates|rules)\b|\bcbam (news|updates?)\b|\bupdates? (on|about|to|in) (the )?(cbam|rules?|regulations?)\b|\bkeep me (up to date|updated|posted)\b|\bstay (up to date|updated|current)\b|\brule changes?\b|\bwhat (has )?changed\b|\bany changes?\b|\bupcoming (dates?|deadlines?|changes?|rules?)\b|\bwhat'?s coming\b|\brecent changes?\b|\b(any|new|recent|latest) updates?\b|^updates?\b[\s?!.]*$/i;

/* ── Numbers Cera can look up ────────────────────────────────── */
const CN8 = /\b(\d{4})[\s.]?(\d{2})[\s.]?(\d{2})\b/;
/* "CN 7208" and "HS 7208 25" are as common as the full code. The heading or
   sub-heading is padded with 00 for the lookup, and printed as it was typed. */
const CN_SHORT = /\b(?:cn|hs)(?:\s*code)?\s*(\d{4})(?:[\s.]?(\d{2}))?\b/i;

type CnRef = { display: string; lookup: string };

function cnIn(prompt: string): CnRef | null {
  const full = prompt.match(CN8);
  if (full) {
    const code = `${full[1]} ${full[2]} ${full[3]}`;
    return { display: code, lookup: code };
  }
  const short = prompt.match(CN_SHORT);
  if (short) {
    const display = [short[1], short[2]].filter(Boolean).join(" ");
    return { display, lookup: `${short[1]} ${short[2] ?? "00"} 00` };
  }
  return null;
}
const YEAR = /\b(20(?:2[6-9]|3[0-4]))\b/;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A country's name in the reader's language, for finding it in a question and for naming it in an answer. */
function nativeCountry(code: string, lang: CeraLang): string | undefined {
  if (lang === "en") return undefined;
  try {
    return new Intl.DisplayNames([localeFor(lang)], { type: "region" }).of(code);
  } catch {
    return undefined;
  }
}

function countryIn(prompt: string, lang: CeraLang): { code: string; name: string } | null {
  const q = prompt.toLowerCase();
  // Longest names first, so "South Korea" is not read as "Korea" and "Niger" is not found in "Nigeria".
  for (const c of [...COUNTRIES].sort((a, b) => b.name.length - a.name.length)) {
    if (new RegExp(`\\b${escape(c.name.toLowerCase())}\\b`).test(q)) return c;
  }
  if (/\bvietnam\b|\bviet nam\b/.test(q)) return COUNTRIES.find((c) => c.code === "VN") ?? null;
  if (/\bchina\b/.test(q)) return COUNTRIES.find((c) => c.code === "CN") ?? null;
  // A question in another language names the country in it: "ค่า default ของ CN 7208 ในเวียดนาม", "越南的 CN 7208 默认值".
  if (lang !== "en") {
    const flat = squash(prompt);
    const shortest = lang === "zh" ? 2 : 3;
    const named = COUNTRIES.map((c) => ({ c, native: nativeCountry(c.code, lang) }))
      .filter((x): x is { c: (typeof COUNTRIES)[number]; native: string } => Boolean(x.native))
      .sort((a, b) => b.native.length - a.native.length);
    for (const { c, native } of named) if (native.length >= shortest && flat.includes(squash(native))) return c;
  }
  return null;
}

const countryName = (c: { code: string; name: string }, lang: CeraLang): string => nativeCountry(c.code, lang) ?? c.name;

function cnReply(prompt: string, ref: CnRef, lang: CeraLang): CeraReply {
  const L = (en: string, th: string, zh: string, hi: string) => pick(lang, en, th, zh, hi);
  const code = ref.display;
  const year = Number(prompt.match(YEAR)?.[1] ?? 2026);
  const country = countryIn(prompt, lang) ?? { code: "TH", name: "Thailand" };
  const where = countryName(country, lang);
  const unknownOrigin =
    /\bunknown (origin|country)|\bcannot (be )?identif|\bnot known\b|\bdon'?t know (the )?(country|origin)\b|\bhighest default\b/i.test(prompt) ||
    /ไม่ทราบ(ประเทศ|ถิ่นกำเนิด)|ระบุ(ประเทศ|ถิ่นกำเนิด)ไม่ได้|ไม่รู้(ประเทศ|ถิ่นกำเนิด)|ค่า default สูงสุด/.test(prompt) ||
    /不知道(生产国|原产国|产地|原产地)|无法(确认|识别|确定)(生产国|原产国|国家|产地)|不清楚(生产国|原产国|产地)|最高默认值/.test(prompt) ||
    /(मूल|उत्पादन)\s?(का\s)?(देश|स्थान)\s?(पता नहीं|अज्ञात|पहचान)|देश (पता नहीं|की पहचान नहीं)|सबसे ऊँचा डिफ़ॉल्ट|सबसे अधिक डिफ़ॉल्ट/.test(prompt);

  if (unknownOrigin) {
    const u = lookupUnknownOrigin(ref.lookup);
    if (u) {
      const v = year <= 2026 ? u.y2026 : year === 2027 ? u.y2027 : u.y2028;
      const yr = Math.max(year, 2026);
      return {
        text: L(
          `For CN ${code}, when the country of production can't be identified, the default is the highest country default for that code: ${fmt(v)} tCO₂e per tonne for ${yr}.\n\n` +
            `That figure already includes the mark-up, and it is always at least as high as any single country's value. If you learn the country, switch to that country's default — or to an actual value from the producer.`,
          `สำหรับ CN ${code} เมื่อระบุประเทศผู้ผลิตไม่ได้ ค่า default คือค่าสูงสุดของรหัสนั้นในทุกประเทศ: ${fmt(v)} tCO₂e ต่อตัน สำหรับปี ${yr}\n\nตัวเลขนี้รวมส่วนบวกเพิ่มแล้ว และสูงเท่ากับหรือสูงกว่าค่าของทุกประเทศเสมอ ถ้าทราบประเทศภายหลัง ให้เปลี่ยนไปใช้ค่า default ของประเทศนั้น — หรือค่าจริงจากผู้ผลิต`,
          `对于 CN ${code}，无法确认生产国时，默认值取该编码所有国家中的最高默认值：${yr} 年为每吨 ${fmt(v)} tCO₂e。\n\n该数字已包含加成，且始终不低于任何单个国家的数值。如果之后查明了国家，请改用该国的默认值 — 或生产商提供的实际值。`,
          `CN ${code} के लिए, जब उत्पादन का देश पहचाना नहीं जा सकता, डिफ़ॉल्ट उस कोड के सभी देशों में सबसे ऊँचा डिफ़ॉल्ट है: ${yr} के लिए ${fmt(v)} tCO₂e प्रति टन।\n\nयह आँकड़ा मार्क-अप पहले ही शामिल करता है, और हमेशा किसी भी एक देश के मान से कम नहीं होता। अगर आपको देश पता चल जाए तो उस देश के डिफ़ॉल्ट पर जाएँ — या उत्पादक से वास्तविक मान लें।`,
        ),
        suggestions: sug(lang, ["What is a default value?", "What if I don't know the origin?"]),
      };
    }
  }

  const s = rateSheet({ cn: ref.lookup, country: country.code, year });
  if (!s) {
    return {
      text: L(
        `I couldn't find CN ${code} in the CBAM scope. Check the code on your customs declaration — Certrace's catalogue has all 570 CN8 codes in scope, and the same goods can sit under a covered or an uncovered code depending on the detail.`,
        `ฉันไม่พบ CN ${code} ในขอบเขต CBAM ตรวจรหัสในใบขนสินค้าอีกครั้ง — แค็ตตาล็อกของ Certrace มีรหัส CN8 ที่อยู่ในขอบเขตครบทั้ง 570 รหัส และสินค้าเดียวกันอาจอยู่ใต้รหัสที่ครอบคลุมหรือไม่ครอบคลุมก็ได้ ขึ้นกับรายละเอียด`,
        `我在 CBAM 范围内没有找到 CN ${code}。请再核对报关单上的编码 — Certrace 的目录收录了范围内全部 570 个 CN8 编码，同一种货物根据细节不同，可能归入涵盖或不涵盖的编码。`,
        `मुझे CBAM दायरे में CN ${code} नहीं मिला। अपने सीमा-शुल्क घोषणापत्र का कोड फिर जाँचें — Certrace की सूची में दायरे के सभी 570 CN8 कोड हैं, और विवरण के आधार पर वही माल किसी शामिल या अशामिल कोड के अंतर्गत आ सकता है।`,
      ),
      suggestions: sug(lang, ["Which goods does CBAM cover?"]),
    };
  }
  const per = (price: number) => (s.chargeable != null ? s.chargeable * price : null);
  const pct = Math.round(s.markup * 100);
  const lines = [
    L(
      `For CN ${code} made in ${where}, the EU default value for ${s.year} is ${fmt(s.defaultValue)} tCO₂e per tonne (${fmt(s.baseValue)} plus a ${pct}% mark-up).`,
      `สำหรับ CN ${code} ที่ผลิตใน${where} ค่า default ของ EU ปี ${s.year} คือ ${fmt(s.defaultValue)} tCO₂e ต่อตัน (${fmt(s.baseValue)} บวกส่วนบวกเพิ่ม ${pct}%)`,
      `CN ${code} 在${where}生产时，${s.year} 年欧盟默认值为每吨 ${fmt(s.defaultValue)} tCO₂e（${fmt(s.baseValue)} 加上 ${pct}% 加成）。`,
      `${where} में बने CN ${code} के लिए, ${s.year} का EU डिफ़ॉल्ट मान ${fmt(s.defaultValue)} tCO₂e प्रति टन है (${fmt(s.baseValue)} जमा ${pct}% मार्क-अप)।`,
    ),
  ];
  if (s.freeAllocation != null && s.chargeable != null) {
    lines.push(
      L(
        `The free-allocation offset is ${fmt(s.freeAllocation)} tCO₂e/t, so ${fmt(s.chargeable)} tCO₂e/t is chargeable — about €${fmt(per(90), 0)} per tonne at an illustrative €90 certificate price.`,
        `ส่วนหักสิทธิ์ฟรีคือ ${fmt(s.freeAllocation)} tCO₂e/t จึงต้องชำระ ${fmt(s.chargeable)} tCO₂e/t — ประมาณ €${fmt(per(90), 0)} ต่อตัน ที่ราคาใบรับรองสมมติ €90`,
        `免费配额抵减为 ${fmt(s.freeAllocation)} tCO₂e/t，因此应缴 ${fmt(s.chargeable)} tCO₂e/t — 按示意的证书价格 €90 计，约每吨 €${fmt(per(90), 0)}。`,
        `निःशुल्क आवंटन ऑफ़सेट ${fmt(s.freeAllocation)} tCO₂e/t है, इसलिए ${fmt(s.chargeable)} tCO₂e/t प्रभार्य है — €90 के उदाहरण प्रमाणपत्र मूल्य पर लगभग €${fmt(per(90), 0)} प्रति टन।`,
      ),
    );
  }
  if (s.lookup.usedOther)
    lines.push(
      L(
        `${where} has no row of its own for this good, so the "other countries" value applies.`,
        `${where}ไม่มีแถวของตัวเองสำหรับสินค้านี้ จึงใช้ค่าของ "ประเทศอื่น"`,
        `${where}对该货物没有单独的行，因此适用“其他国家”的值。`,
        `${where} की इस माल के लिए अपनी कोई पंक्ति नहीं, इसलिए “अन्य देश” का मान लागू होता है।`,
      ),
    );
  lines.push(
    L(
      "A verified actual value is often lower than the default — it is worth comparing before relying on the default.",
      "ค่าจริงที่ผ่านการทวนสอบมักต่ำกว่าค่า default — ควรเปรียบเทียบก่อนตัดสินใจใช้ค่า default",
      "经核查的实际值往往低于默认值 — 在决定依赖默认值之前，值得先比较。",
      "सत्यापित वास्तविक मान अक्सर डिफ़ॉल्ट से कम होता है — डिफ़ॉल्ट पर निर्भर होने से पहले तुलना करना सार्थक है।",
    ),
  );
  return { text: lines.join("\n\n"), suggestions: sug(lang, ["Should I use default or actual values?", "How is the free allocation deducted?"]) };
}


/* ── Who is late, and whom to ask for a verified figure — read off the reader's own chain ─────────── */
const CHASE_INTENT = /\b(who|which)\b[^.?!]*\b(late|overdue|behind|owes?|chase)\b|\bwhat should i chase\b|\bchase first\b|\bwhat should i do next\b|\bwhat('?s| is) (late|overdue)\b/i;
const VERIFY_INTENT = /\bwhich suppliers?\b[^.?!]*\b(verified|actual|figures?)\b|\b(worst|weakest|riskiest|biggest)\b[^.?!]*\b(supplier|precursor)s?\b|\bmost at risk\b/i;
const CHASE_TH = /ใคร.{0,6}(ล่าช้า|ช้า|เลยกำหนด)|ควรตามใคร|ตามใครก่อน|ฉันควรทำอะไรต่อ|ทำอะไรต่อ/;
const VERIFY_TH = /ซัพพลายเออร์.{0,12}(ทวนสอบ|ค่าจริง)|ขอตัวเลข.{0,12}จากซัพพลายเออร์|ซัพพลายเออร์.{0,6}(แย่ที่สุด|เสี่ยงที่สุด|อ่อนที่สุด)/;
const CHASE_ZH = /谁(逾期|迟|晚|落后)|先催(谁|什么)|该催|接下来(我)?(该|应该)?做什么/;
const VERIFY_ZH = /哪些供应商.{0,10}(经核查|核查|实际值|数据|数字)|最(差|弱|危险)的供应商|风险最高的供应商/;
const CHASE_HI = /कौन देर|कौन (लेट|पीछे)|किसके पीछे|पहले किसे|आगे क्या करना|अब क्या करूँ/;
const VERIFY_HI = /किन आपूर्तिकर्ताओं से.{0,16}(सत्यापित|वास्तविक)|सबसे (खराब|कमज़ोर|जोखिम\S*) आपूर्तिकर्ता/;

/* ── The reader's own account ────────────────────────────────── */
const ACCOUNT_INTENT =
  /\b(my|our)\b[^.?!]*\b(readiness|status|progress|product reports?|workspaces?|installations?|months?)\b|\bwhat('?s| is| are)? (still )?(missing|outstanding|left|open|holding|blocking)\b|\bhow (ready|far along|complete)\b|\bwhere do i stand\b|\bam i ready\b|\bsummary of my\b/i;

function accountReply(lang: CeraLang): CeraReply {
  const L = (en: string, th: string, zh: string, hi: string) => pick(lang, en, th, zh, hi);
  const all = listWorkspaces();
  if (all.length === 0) {
    return {
      text: L(
        "You don't have any product reports yet. Start one from Verification → New product report: pick who produces the good, the country and CN code, the route and the year. If you haven't added your installation yet, do that first in Settings → Organisation → Your installations.",
        "คุณยังไม่มีรายงานผลิตภัณฑ์ เริ่มได้จากการทวนสอบ → รายงานผลิตภัณฑ์ใหม่: เลือกว่าใครผลิตสินค้า ประเทศและรหัส CN เส้นทางผลิต และปี ถ้ายังไม่ได้เพิ่มโรงงาน ให้เพิ่มก่อนที่การตั้งค่า → องค์กร → โรงงานของคุณ",
        "您还没有产品报告。请从“核查 → 新建产品报告”开始：选择谁生产该货物、国家和 CN 编码、路线和年度。如果尚未添加您的设施，请先在“设置 → 组织 → 您的设施”中添加。",
        "आपके पास अभी कोई उत्पाद रिपोर्ट नहीं है। सत्यापन → नई उत्पाद रिपोर्ट से शुरू करें: चुनें कि माल कौन बनाता है, देश और CN कोड, मार्ग और साल। अगर आपने अभी अपना संयंत्र नहीं जोड़ा है तो पहले सेटिंग्स → संगठन → आपके संयंत्र में जोड़ें।",
      ),
      suggestions: sug(lang, ["How do I create a product report?", "How do I add an installation?"]),
    };
  }
  const rows = all.map((w) => ({ w, r: workspaceReadiness(w) }));
  const done = rows.filter((x) => x.r.overall === "complete").length;
  const blocked = rows.filter((x) => x.r.overall === "blocked").length;
  const rest = all.length - done - blocked;
  const installations = new Set(all.map((w) => w.installationId)).size;
  const lines = [
    L(
      `You have ${all.length} product report${all.length === 1 ? "" : "s"} across ${installations} installation${installations === 1 ? "" : "s"}: ${done} complete, ${rest} in progress, ${blocked} blocked.`,
      `คุณมี ${all.length} รายงานผลิตภัณฑ์ใน ${installations} โรงงาน: เสร็จแล้ว ${done} กำลังทำ ${rest} ติดขัด ${blocked}`,
      `您在 ${installations} 个设施共有 ${all.length} 份产品报告：已完成 ${done} 份，进行中 ${rest} 份，受阻 ${blocked} 份。`,
      `आपके ${installations} संयंत्रों में ${all.length} उत्पाद रिपोर्टें हैं: ${done} पूर्ण, ${rest} प्रगति में, ${blocked} अवरुद्ध।`,
    ),
  ];
  for (const { w, r } of rows.slice(0, 5)) {
    const first = r.tabs.flatMap((t) => t.missing)[0];
    if (lang === "en") {
      lines.push(`• ${w.productName} — ${w.installationName}, ${w.year}: ${r.percentComplete}% ready${first ? `. Next: ${first.label}.` : "."}`);
    } else {
      // A label with no translation is left out rather than shown half in English.
      const label = first ? translate(lang, first.label) : "";
      const next = first && label !== first.label ? label : "";
      const name = translate(lang, w.productName);
      lines.push(
        L(
          "",
          `• ${name} — ${w.installationName}, ${w.year}: พร้อม ${r.percentComplete}%${next ? ` ขั้นต่อไป: ${next}` : ""}`,
          `• ${name} — ${w.installationName}，${w.year}：就绪 ${r.percentComplete}%${next ? `。下一步：${next}` : ""}`,
          `• ${name} — ${w.installationName}, ${w.year}: ${r.percentComplete}% तैयार${next ? `। अगला: ${next}` : ""}`,
        ),
      );
    }
  }
  if (rows.length > 5) lines.push(L(`…and ${rows.length - 5} more.`, `…และอีก ${rows.length - 5} รายงาน`, `…另有 ${rows.length - 5} 份。`, `…और ${rows.length - 5}।`));
  lines.push(
    L(
      "Open an installation's Readiness tab to see everything that is holding its report package.",
      "เปิดแท็บความพร้อมของโรงงานเพื่อดูทุกอย่างที่หน่วงแพ็กเกจรายงานของโรงงานนั้น",
      "打开某个设施的“就绪度”标签页，可查看拖住其报告资料包的所有事项。",
      "किसी संयंत्र का तैयारी टैब खोलें और देखें कि उसके रिपोर्ट पैकेज को क्या रोक रहा है।",
    ),
  );
  return { text: lines.join("\n"), suggestions: sug(lang, ["Why can't I download the package?", "What does the plant fill in each month?"]) };
}

/* ── The reply ───────────────────────────────────────────────── */
type ReplyOptions = {
  today?: Date;
  /** on a supplier's link: no account, only this month */
  supplier?: boolean;
  /** the language to fall back on when the message itself has none to go by — the interface's */
  lang?: CeraLang;
};

export function reply(prompt: string, opts: ReplyOptions = {}): CeraReply {
  return { ...compose(prompt, opts), lang: langOf(prompt.trim(), opts.lang ?? "en") };
}

function compose(prompt: string, opts: ReplyOptions): CeraReply {
  const q = prompt.trim();
  /* ONE RULE: the answer is in the language of the question. A Thai button sends Thai, so it is answered in Thai; a question typed in
     English is answered in English even on a Thai screen — and so for Chinese and Hindi. */
  const lang = langOf(q, opts.lang ?? "en");
  const th = lang === "th";
  const zh = lang === "zh";
  const hi = lang === "hi";
  const local = lang !== "en";
  const L = (en: string, thai: string, zhText: string, hiText: string) => pick(lang, en, thai, zhText, hiText);
  // A button in another language is one of Cera's own questions; the English question it stands for decides what it is about.
  const asEnglish = local ? englishQuestionFor(lang, q) : undefined;
  const probe = asEnglish ?? q;

  if (!q)
    return {
      text: L(
        "What would you like to know about CBAM or about using Certrace?",
        "อยากรู้อะไรเกี่ยวกับ CBAM หรือการใช้ Certrace",
        "您想了解 CBAM 或 Certrace 的哪些方面？",
        "आप CBAM या Certrace के उपयोग के बारे में क्या जानना चाहेंगे?",
      ),
      suggestions: sug(lang, CERA_SUGGESTIONS),
    };

  const verdict = checkQuestion(q);
  if (verdict !== "ok") return { text: refusal(lang)[verdict], suggestions: sug(lang, FALLBACK_SUGGESTIONS) };

  if (GREETING.test(probe) || (th && GREETING_TH.test(q)) || (zh && GREETING_ZH.test(q)) || (hi && GREETING_HI.test(q)))
    return {
      text: L(
        'Hello! Ask me about CBAM, how to use Certrace, or say "smart upload" to give me a file.',
        'สวัสดี! ถามฉันได้เรื่อง CBAM วิธีใช้ Certrace หรือพูดว่า "สมาร์ทอัพโหลด" เพื่อส่งไฟล์ให้ฉัน',
        "您好！您可以问我 CBAM、Certrace 的用法，或者说“智能上传”把文件交给我。",
        'नमस्ते! मुझसे CBAM, Certrace के उपयोग के बारे में पूछें, या कोई फ़ाइल देने के लिए “स्मार्ट अपलोड” कहें।',
      ),
      suggestions: sug(lang, CERA_SUGGESTIONS),
    };
  if (THANKS.test(probe) || (th && THANKS_TH.test(q)) || (zh && THANKS_ZH.test(q)) || (hi && THANKS_HI.test(q)))
    return {
      text: L(
        "Glad to help. Anything else about CBAM or Certrace?",
        "ยินดี มีอะไรอยากถามเรื่อง CBAM หรือ Certrace อีกไหม",
        "很高兴能帮上忙。关于 CBAM 或 Certrace 还有别的想问吗？",
        "खुशी हुई। CBAM या Certrace के बारे में और कुछ पूछना है?",
      ),
      suggestions: sug(lang, FALLBACK_SUGGESTIONS),
    };

  if (IDENTITY.test(probe) || (th && IDENTITY_TH.test(q)) || (zh && IDENTITY_ZH.test(q)) || (hi && IDENTITY_HI.test(q))) {
    const about = entryById("cera-features");
    if (about) return { text: (local ? localAnswer(lang, "cera-features")?.text : undefined) ?? about.answer, suggestions: sug(lang, CERA_SUGGESTIONS) };
  }

  const wantsUpload = UPLOAD_INTENT.test(probe) || (th && !asEnglish && UPLOAD_TH.test(q)) || (zh && UPLOAD_ZH.test(q)) || (hi && UPLOAD_HI.test(q));
  const explainsUpload = EXPLAIN_UPLOAD.test(probe) || (zh && EXPLAIN_UPLOAD_ZH.test(q)) || (hi && EXPLAIN_UPLOAD_HI.test(q));
  if (wantsUpload && !explainsUpload) {
    return {
      text: L(
        "Sure — give me one file and I'll read it. I work out which product report and month it's for and what readings it holds; if I can't tell something, I'll ask. Nothing is saved until you've checked what I found — you can change any figure — and confirmed.",
        "ได้เลย — ส่งไฟล์มาหนึ่งไฟล์ ฉันจะอ่านแล้วดูว่าเป็นของรายงานผลิตภัณฑ์และเดือนไหน และมีค่าอะไรบ้าง ถ้าไม่แน่ใจตรงไหนจะถาม ไม่มีอะไรถูกบันทึกจนกว่าคุณจะตรวจสิ่งที่ฉันพบ — แก้ตัวเลขได้ — แล้วยืนยัน",
        "好的 — 给我一个文件，我来读取。我会判断它属于哪份产品报告、哪个月份，以及包含哪些读数；如果有不确定的地方，我会问您。在您检查我找到的内容（可以修改任何数字）并确认之前，不会保存任何东西。",
        "ज़रूर — मुझे एक फ़ाइल दीजिए, मैं उसे पढ़ूँगी। मैं पता लगाती हूँ कि वह किस उत्पाद रिपोर्ट और महीने की है और उसमें कौन-सी रीडिंग हैं; कुछ साफ़ न हो तो मैं पूछूँगी। जब तक आप मेरे पाए को जाँचकर — किसी भी आँकड़े को बदल सकते हैं — पुष्टि नहीं करते, कुछ सहेजा नहीं जाता।",
      ),
      cards: [{ kind: "upload" }],
      startUpload: true,
    };
  }

  if (UPDATES_INTENT.test(probe) || (th && !asEnglish && UPDATES_TH_INTENT.test(q)) || (zh && UPDATES_ZH_INTENT.test(q)) || (hi && UPDATES_HI_INTENT.test(q))) {
    const { inForce, upcoming } = splitUpdates(opts.today);
    const asOf = new Date(UPDATES_AS_OF).toLocaleDateString(local ? localeFor(lang).replace(/^th-TH$/, "th-TH-u-ca-gregory") : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    return {
      text: L(
        `Here is where the rules stand as of ${asOf}. The 2026 definitive period is running; the next big dates are the mark-up step-up and certificate sales in early 2027, and the first declaration on 30 September 2027.`,
        `นี่คือสถานะของกฎ ณ วันที่ ${asOf} ตอนนี้อยู่ในช่วงระบบถาวรของปี 2026 วันสำคัญถัดไปคือส่วนบวกเพิ่มที่ปรับขึ้นและการขายใบรับรองช่วงต้นปี 2027 และการยื่นครั้งแรกวันที่ 30 กันยายน 2027`,
        `以下是截至 ${asOf} 的规则现状。2026 年的正式期正在进行；接下来的大日期是 2027 年初的加成上调和证书销售，以及 2027 年 9 月 30 日的首次申报。`,
        `यह रहा ${asOf} तक नियमों का हाल। 2026 की निश्चित अवधि चल रही है; अगली बड़ी तारीख़ें 2027 की शुरुआत में मार्क-अप का बढ़ना और प्रमाणपत्रों की बिक्री हैं, और पहली घोषणा 30 सितंबर 2027 को।`,
      ),
      cards: [{ kind: "updates", asOf: UPDATES_AS_OF, inForce: localised(inForce.slice(0, 8), lang), upcoming: localised(upcoming.slice(0, 8), lang) }],
      suggestions: sug(lang, ["What is the mark-up?", "What is the quarterly holding rule?", "How does the free allocation phase out?"]),
    };
  }

  const cn = cnIn(q);
  if (cn) return cnReply(q, cn, lang);

  const explainsBlocked = EXPLAIN_BLOCKED.test(q) || (zh && EXPLAIN_BLOCKED_ZH.test(q)) || (hi && EXPLAIN_BLOCKED_HI.test(q));
  const asksAccount =
    (ACCOUNT_INTENT.test(probe) && !/\bhow do i\b/i.test(probe)) ||
    (th && !asEnglish && ACCOUNT_TH.test(q) && !HOW_TO_TH.test(q)) ||
    (zh && !asEnglish && ACCOUNT_ZH.test(q) && !HOW_TO_ZH.test(q)) ||
    (hi && !asEnglish && ACCOUNT_HI.test(q) && !HOW_TO_HI.test(q));
  /* Who is late / whom to ask: only for somebody who has an account. A supplier's link has none to read. */
  if (!opts.supplier) {
    const wantsChase = CHASE_INTENT.test(probe) || (th && !asEnglish && CHASE_TH.test(q)) || (zh && !asEnglish && CHASE_ZH.test(q)) || (hi && !asEnglish && CHASE_HI.test(q));
    const wantsVerify = VERIFY_INTENT.test(probe) || (th && !asEnglish && VERIFY_TH.test(q)) || (zh && !asEnglish && VERIFY_ZH.test(q)) || (hi && !asEnglish && VERIFY_HI.test(q));
    if ((wantsChase || wantsVerify) && !/\bhow do i\b/i.test(probe)) {
      const r = wantsVerify && !wantsChase ? verifyReply(lang) : chaseReply(lang);
      return { ...r, suggestions: r.suggestions ? sug(lang, r.suggestions) : undefined };
    }
  }

  if (!explainsBlocked && asksAccount) {
    // A supplier has no account to summarise: the exporter who sent the link sees where everything stands.
    if (opts.supplier) {
      return {
        text: L(
          "You're here to answer one month for the exporter who sent you this link. The strip at the top of the monthly readings says what is still needed, and the Check step lists anything that would stop you sending it.",
          "คุณอยู่ที่นี่เพื่อตอบข้อมูลหนึ่งเดือนให้ผู้ส่งออกที่ส่งลิงก์นี้มา แถบด้านบนของค่าที่อ่านได้รายเดือนบอกว่ายังต้องการอะไร และขั้นตรวจสอบระบุสิ่งที่จะขวางการส่ง",
          "您在这里是为发给您此链接的出口商回答一个月的数据。月度读数顶部的提示条会说明还需要什么，“检查”步骤会列出会阻止您提交的事项。",
          "आप यहाँ उस निर्यातक के लिए एक महीने का उत्तर देने आए हैं जिसने आपको यह लिंक भेजा। मासिक रीडिंग के ऊपर की पट्टी बताती है कि अब भी क्या चाहिए, और जाँच चरण वह सब सूचीबद्ध करता है जो आपको भेजने से रोकेगा।",
        ),
        suggestions: sug(lang, ["Why can't I submit a month?", "What does the plant fill in each month?"]),
      };
    }
    return accountReply(lang);
  }

  // What Cera knows in the reader's language: the exact button first, then the phrases people type.
  if (local) {
    /* A question typed with its CBAM words in Latin letters ("CN 7208 默认值") still reaches the English matcher on those words alone. */
    const id = (asEnglish ? best(asEnglish)?.entry.id : undefined) ?? bestLocal(lang, q);
    const a = id ? localAnswer(lang, id) : null;
    if (a) return { text: a.text, suggestions: a.related.length ? a.related : undefined };
  } else {
    const hit = best(q);
    if (hit) {
      const related = (hit.entry.related ?? []).slice(0, 3);
      return { text: hit.entry.answer, suggestions: related.length ? related : undefined };
    }
  }

  if (looksOnTopic(q)) {
    return {
      text: L(
        "I don't have a reliable answer to that. I'd rather say so than guess — try asking it another way, or pick something I can help with below.",
        "ฉันไม่มีคำตอบที่เชื่อถือได้สำหรับเรื่องนั้น ขอบอกตรง ๆ ดีกว่าเดา — ลองถามอีกแบบ หรือเลือกเรื่องที่ฉันช่วยได้ด้านล่าง",
        "关于这个问题，我没有可靠的答案。我宁愿直说也不愿瞎猜 — 请换个方式问，或在下面选择我能帮上忙的事。",
        "इसका मेरे पास कोई भरोसेमंद उत्तर नहीं है। अंदाज़ा लगाने से बेहतर है कि मैं यह साफ़ कह दूँ — इसे किसी और तरह पूछकर देखें, या नीचे से कोई ऐसी बात चुनें जिसमें मैं मदद कर सकती हूँ।",
      ),
      suggestions: sug(lang, FALLBACK_SUGGESTIONS),
    };
  }
  return { text: refusal(lang).offtopic, suggestions: sug(lang, FALLBACK_SUGGESTIONS) };
}
