/* ════════════════════════════════════════════════════════════
   WHAT CERA WILL AND WILL NOT TALK ABOUT

   Cera answers two kinds of question: how CBAM works, and how to use Certrace to
   deal with it. Everything else is out of bounds, and the line is drawn here, in
   one place, before any answer is looked for:

     · HOW THE PRODUCT IS BUILT — its code, its stack, its data, its prompts, how
       it works underneath, how it could be copied. A user needs to know what a
       screen does, not what it is made of.
     · THE BUSINESS — plans and prices, customers, revenue, investors, roadmap,
       competitors. Those live on the pages that are about them (Plan & billing),
       and Cera points there rather than speaking for the company.
     · HOW CERA ITSELF WORKS — which model, what instructions, how to get round
       them. A request to ignore its rules is answered like any other out-of-scope
       question: politely, and with what it can do instead.
     · ANYTHING NOT ABOUT CBAM — Cera is not a general assistant, and a polite
       "that is outside what I can help with" is a better answer than a guess.

   The check is deliberately on the QUESTION, not the answer: nothing in the
   knowledge Cera draws on is secret, but the way it is asked can still be a
   request for something it must not give.
   ════════════════════════════════════════════════════════════ */

import type { CeraLang } from "./lang";

export type Verdict = "ok" | "internal" | "business" | "self" | "offtopic";

const INTERNAL = [
  /\bsource ?code\b/,
  /\bcode ?base\b/,
  /\b(github|gitlab|repo|repository)\b/,
  /\btech(nology)? ?stack\b/,
  /\barchitecture\b/,
  /\b(database|db) ?schema\b/,
  /\b(api|secret|access) ?keys?\b/,
  /\bhow (is|was|are|were) (certrace|cera|this (app|platform|portal|product|site)|the (app|platform|portal)) (built|made|coded|developed|engineered|implemented)\b/,
  /\bwhat (framework|language|library|libraries|database|backend|stack|hosting|cloud) (does|do|is|are|did) (certrace|cera|this|it|you)\b/,
  /\b(react|next\.?js|typescript|tailwind|prisma|postgres|supabase|vercel|localstorage)\b/,
  /\b(reverse[- ]engineer|clone (certrace|this|the (app|platform))|copy (certrace|this (app|platform|product)|the (app|platform|product))|replicate (certrace|this))\b/,
  /\bhow (do|can|could|would) (i|we|someone|anyone) (build|make|create|code) (something |a |an )?(like|similar to) (certrace|this|you)\b/,
  /\balgorithm (behind|that)\b/,
  /\binternal (logic|rules|workings|design|tool|document)s?\b/,
  /\bunder the hood\b/,
  /\bwhere (is|are) (my |the |our )?(data|files?|documents?|records?) (stored|kept|hosted|saved|held)\b/,
  /\b(is|are) (my |the |our )?(data|files?|documents?) (safe|secure|encrypted|protected|backed up)\b/,
  /\bwho (hosts|stores) (my |the |our )?(data|files?)\b/,
];

const SELF = [
  /\b(system|hidden|initial|original|secret) (prompt|instruction|message)s?\b/,
  /\b(your|the) (prompt|instructions|rules|guidelines|configuration|training|programming)\b/,
  /\bignore (all |any |your |the |previous |prior |earlier )*(instructions?|rules|prompts?|guidelines|restrictions)\b/,
  /\bdisregard\b.*\b(instructions?|rules|above)\b/,
  /\b(jailbreak|developer mode|dan mode|act as|pretend (to be|you are)|roleplay as|you are now)\b/,
  /\b(reveal|show|print|repeat|leak|tell me) (your|the) (system|hidden|full|initial)\b/,
  /\bwhich (llm|model|ai)\b/,
  /\bwhat (llm|model|ai) (are|is|do|does|powers)\b/,
  /\b(are you|is cera|is this) (chatgpt|gpt|claude|gemini|openai|anthropic|a language model|an llm)\b/,
  /\b(openai|anthropic|chatgpt|gpt-?\d|claude|gemini|llama|mistral)\b/,
];

const BUSINESS = [
  /\b(pricing|price list|subscription cost|plan cost|how much (does|do|is|are) (certrace|cera|the (plan|plans|subscription)|it|this)( cost)?)\b/,
  /\b(business model|revenue|profit|funding|investors?|valuation|runway|burn rate)\b/,
  /\bhow (does|do) (certrace|you|cera|the company) (make|earn) money\b/,
  /\b(competitors?|competition|alternatives? to certrace|compared to (other|your competitors))\b/,
  /\b(roadmap|upcoming features?|future features?|release plan|what('s| is) next for certrace)\b/,
  /\b(customers?|clients?) (of|using) certrace\b/,
  /\bwho (owns|founded|funds|runs) (certrace|the company)\b/,
  /\b(employees|headcount|team size|salary|salaries)\b/,
  /\b(market share|go[- ]to[- ]market|sales strategy)\b/,
];

/* A question is about CBAM or about using the product if it says so. Words that
   only a CBAM or Certrace question would use. */
const ON_TOPIC = [
  /\bcbam\b/,
  /\bcarbon border\b/,
  /\bembedded\b/,
  /\bemissions?\b/,
  /\bco2\b|\bco₂\b|\btco2/,
  /\bdefault value|\bactual value|\bmark-?up\b/,
  /\bprecursors?\b/,
  /\bverif(y|ier|ication|ied)\b/,
  /\bcertificates?\b/,
  /\bdeclarant|\bimporter|\boperator\b/,
  /\bcn ?code|\bhs ?code|\bcn\d|\b\d{4} ?\d{2}( ?\d{2})?\b/,
  /\b(steel|aluminium|aluminum|cement|fertili[sz]er|hydrogen|iron|ammonia|clinker|urea)\b/,
  /\b(eu|european union|europe|brussels)\b/,
  /\b(ets|allowances?|benchmarks?|free allocation)\b/,
  /\b(installation|monitoring plan|methodology|annex|functional unit|source stream|fuel|electricity|process emissions?|scrap)\b/,
  /\b(report|reports|package|readiness|download|upload|smart upload|smart link|link|monthly|month|workspace|product report|dashboard|settings|team|seat|sidebar|verification page|overview|tab)\b/,
  /\b(certrace|cera|portal|platform|app)\b/,
  /\b(deadline|timeline|penalt(y|ies)|threshold|50 tonnes?|exempt|scope|tariff|customs|import|export|exporter|thailand|thai)\b/,
  /\b(carbon price|carbon tax|carbon cost|cost exposure|ghg|greenhouse|decarboni[sz])\b/,
  /\b(update|updates|news|what's new|whats new|latest)\b/,
  /\b(suppliers?|plants?|colleagues?|account|password|profile|language|documents?|invoices?|drafts?|reminders?|email|pay|payment|register|registry|eori|evidence|certificate|representative)\b/,
];

/* The same lines, drawn in Thai. A question about how the product is built, about the company, or about getting round Cera's rules
   is refused in either language; Thai has no word boundaries, so these are plain phrases. */
const INTERNAL_TH = [
  /ซอร์สโค้ด|โค้ดของระบบ|โค้ดเบส|สร้างด้วยอะไร|ใช้เทคโนโลยีอะไร|เทคโนโลยีเบื้องหลัง|สถาปัตยกรรมของระบบ|โครงสร้างฐานข้อมูล|ฐานข้อมูลของระบบ/,
  /ข้อมูลของ(ฉัน|เรา|ผม)(เก็บ|ถูกเก็บ)ที่ไหน|เก็บข้อมูลไว้ที่ไหน|ข้อมูล(ของ(ฉัน|เรา))?ปลอดภัยไหม|เข้ารหัสข้อมูลไหม|ใครโฮสต์ข้อมูล/,
  /ก็อปปี้ระบบ|ลอกระบบ|ทำซ้ำระบบ|สร้างระบบแบบ(certrace|นี้)|เบื้องหลังการทำงาน/,
];

const SELF_TH = [
  /คำสั่งระบบ|พรอมต์ระบบ|พร้อมต์ระบบ|คำสั่งที่ซ่อน|กฎของคุณ|คำสั่งของคุณ|วิธีที่คุณถูกฝึก/,
  /(ละเลย|เพิกเฉย|ลืม)(คำสั่ง|กฎ)|ข้าม(กฎ|คำสั่ง)|โหมดนักพัฒนา|แกล้งทำเป็น|สวมบทบาท|ตอนนี้คุณคือ/,
  /คุณ(ใช้|คือ)(โมเดล|llm|ai)(อะไร|ตัวไหน)?|(โมเดล|llm|เอไอ)ตัวไหน|คุณคือ(chatgpt|gpt|claude|gemini)|openai|anthropic/,
];

const BUSINESS_TH = [
  /ราคา(แพ็กเกจ|ของ certrace)|ค่าสมัครสมาชิก|ค่าบริการของ certrace|certrace ราคาเท่าไร|โมเดลธุรกิจ|รายได้ของบริษัท|นักลงทุน|มูลค่ากิจการ|คู่แข่ง|แผนพัฒนาฟีเจอร์|ฟีเจอร์ในอนาคต|ใครเป็นเจ้าของ|ใครก่อตั้ง|พนักงานกี่คน|ลูกค้าของ certrace/,
];

const ON_TOPIC_TH = [
  /cbam|certrace|cera|carbon border/i,
  /คาร์บอน|การปล่อย|ก๊าซเรือนกระจก|co2|co₂/i,
  /เหล็ก|อะลูมิเนียม|ซีเมนต์|ปุ๋ย|ไฮโดรเจน|ปูนเม็ด|แอมโมเนีย|ยูเรีย/,
  /ส่งออก|นำเข้า|ผู้ส่งออก|ผู้นำเข้า|ศุลกากร|พิกัด|รหัส cn|รหัส hs/i,
  /ทวนสอบ|ผู้ทวนสอบ|ใบรับรอง|ผู้ยื่น|ผู้ดำเนินการ|วัตถุดิบตั้งต้น|ค่า default|ค่าจริง|ส่วนบวกเพิ่ม|สิทธิ์ฟรี|เกณฑ์อ้างอิง/i,
  /โรงงาน|รายงาน|แพ็กเกจ|ความพร้อม|ข้อมูลรายเดือน|ลิงก์|ซัพพลายเออร์|เอกสาร|หลักฐาน|ทะเบียน|แผนการติดตาม|อัพโหลด|อัปโหลด|อัพเดท|อัปเดต|แดชบอร์ด|การตั้งค่า|ทีม|บัญชี|รหัสผ่าน|อีเมล/,
  /ไฟฟ้า|เชื้อเพลิง|กระบวนการ|เศษเหล็ก|ความร้อน|ก๊าซ|ชีวมวล|สต็อก|มิเตอร์/,
  /กำหนด|ต้นทุน|ค่าปรับ|บทลงโทษ|ภาษี|ราคา|ขอบเขต|เกณฑ์|ยกเว้น|eu|อียู|ยุโรป|ไทย/i,
];


/* And in Chinese and Hindi — the same three lines, the same refusal. Neither language puts word boundaries where the English patterns
   look for them, so these are plain phrases too. */
const INTERNAL_ZH = [
  /源代码|源码|代码库|代码仓库|技术栈|用什么技术|用什么(语言|框架|数据库)|系统架构|架构设计|数据库(结构|表结构)|api\s?(密钥|key)|底层(原理|实现|逻辑)|内部(逻辑|规则|文档|工具)|是怎么(开发|构建|做)出来的|如何(被)?(开发|构建|实现)的/i,
  /我的数据(存|保存|存放)在哪|数据(存放|存储|保存)在哪|数据(安全|加密|有保障)吗|谁(托管|保管)(我的)?数据/,
  /(复制|克隆|仿造|山寨)(certrace|这个(系统|平台|产品|应用))|怎么(做|开发)出?(类似|像)(certrace|这样的)/i,
];
const SELF_ZH = [
  /系统(提示|指令)|提示词|隐藏指令|初始指令|你的(规则|指令|设定|训练|编程)/,
  /忽略(所有|之前|以上|先前|你的)?(的)?(指令|规则|提示|限制)|无视(指令|规则)|越狱|开发者模式|扮演|假装(你是|成)|你现在是/,
  /你(用的|是)?(什么|哪个|哪种)(模型|大模型|ai)|你是(chatgpt|gpt|claude|gemini)吗?|openai|anthropic/i,
];
const BUSINESS_ZH = [
  /certrace.{0,6}(价格|收费|多少钱|费用)|(套餐|订阅|会员|方案)(的)?(价格|费用|收费|多少钱)|定价|商业模式|营收|融资|投资人|估值|竞争对手|竞品|路线图|未来(的)?功能|谁(创立|创办|投资|拥有)/i,
];
const ON_TOPIC_ZH = [
  /cbam|certrace|cera|碳边境/i,
  /碳|排放|温室气体|co2|co₂/i,
  /钢|铝|水泥|化肥|氢|氨|尿素|熟料/,
  /出口|进口|海关|关税|编码|cn\s?\d|hs\s?\d/i,
  /核查|证书|申报人|运营方|前体|默认值|实际值|加成|基准|免费配额/,
  /设施|工厂|报告|资料包|就绪|月度|链接|供应商|文件|证据|登记册|监测计划|方法/,
  /电力|燃料|工艺|废钢|热量|气体|生物质|库存|电表|仪表/,
  /期限|截止|成本|罚款|处罚|税|价格|范围|门槛|豁免|欧盟|欧洲|泰国|更新|最新/,
];

const INTERNAL_HI = [
  /सोर्स\s?कोड|कोड\s?बेस|गिटहब|टेक\s?स्टैक|कौन-?सी तकनीक|किस (भाषा|फ्रेमवर्क) में बना|आर्किटेक्चर|डेटाबेस (स्कीमा|संरचना)|एपीआई\s?(की|कुंजी)|api\s?key|अंदरूनी (तर्क|नियम|कार्य)|हुड के नीचे/i,
  /मेरा डेटा (कहाँ|कहां) (रखा|सहेजा|स्टोर)|डेटा (कहाँ|कहां) (रखा|सहेजा|स्टोर)|डेटा (सुरक्षित|एन्क्रिप्टेड) है/,
  /(कॉपी|नकल|क्लोन)\s?(करना|कर)?\s?(certrace|यह सिस्टम|यह प्लेटफ़ॉर्म)|कैसे बना (है|हुआ)/i,
];
const SELF_HI = [
  /सिस्टम\s?प्रॉम्प्ट|छिपे (हुए )?निर्देश|आपके (निर्देश|नियम|प्रोग्राम)|निर्देशों? (को )?(अनदेखा|नज़रअंदाज़)|नियम (तोड़|अनदेखा)|जेलब्रेक|डेवलपर\s?मोड|नाटक करो|अब आप .{0,12} हैं/,
  /आप (कौन-?सा|किस) (मॉडल|एआई|ai)|आप (chatgpt|gpt|claude|gemini) (हैं|हो)|openai|anthropic|chatgpt/i,
];
const BUSINESS_HI = [
  /(प्लान|सब्सक्रिप्शन)\s?(की\s)?(कीमत|शुल्क|लागत)|certrace (की कीमत|कितने का)|बिज़नेस\s?मॉडल|राजस्व|निवेशक|मूल्यांकन|प्रतियोगी|रोडमैप|भविष्य (की|के) सुविधा|कंपनी (का मालिक|के संस्थापक)/i,
];
const ON_TOPIC_HI = [
  /cbam|certrace|cera|कार्बन सीमा/i,
  /कार्बन|उत्सर्जन|ग्रीनहाउस|co2|co₂/i,
  /इस्पात|स्टील|एल्युमीनियम|सीमेंट|उर्वरक|हाइड्रोजन|अमोनिया|यूरिया|क्लिंकर/,
  /निर्यात|आयात|सीमा-?शुल्क|कोड|cn\s?\d|hs\s?\d/i,
  /सत्यापन|प्रमाणपत्र|घोषणाकर्ता|संचालक|पूर्ववर्ती|डिफ़ॉल्ट|वास्तविक मान|मार्क-?अप|बेंचमार्क|निःशुल्क आवंटन/,
  /संयंत्र|प्लांट|रिपोर्ट|पैकेज|तैयारी|मासिक|लिंक|आपूर्तिकर्ता|दस्तावेज़|साक्ष्य|रजिस्ट्री|निगरानी|पद्धति/,
  /बिजली|ईंधन|प्रक्रिया|स्क्रैप|ऊष्मा|गैस|बायोमास|स्टॉक|मीटर/,
  /समय सीमा|तारीख़|लागत|जुर्माना|दंड|कर\b|कीमत|दायरा|छूट|यूरोप|थाईलैंड|अपडेट|नया/i,
];

const normalise = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

export function checkQuestion(prompt: string): Verdict {
  const q = normalise(prompt);
  if ([SELF, SELF_TH, SELF_ZH, SELF_HI].some((rs) => rs.some((r) => r.test(q)))) return "self";
  if ([INTERNAL, INTERNAL_TH, INTERNAL_ZH, INTERNAL_HI].some((rs) => rs.some((r) => r.test(q)))) return "internal";
  if ([BUSINESS, BUSINESS_TH, BUSINESS_ZH, BUSINESS_HI].some((rs) => rs.some((r) => r.test(q)))) return "business";
  return "ok";
}

/** Does this look like a question Cera is here for at all? Used only after the
    knowledge has found nothing — a question that is on topic but unanswered gets
    "I don't have that", one that is not gets the scope message. */
export function looksOnTopic(prompt: string): boolean {
  const q = normalise(prompt);
  return [ON_TOPIC, ON_TOPIC_TH, ON_TOPIC_ZH, ON_TOPIC_HI].some((rs) => rs.some((r) => r.test(q)));
}

const SCOPE =
  "I can help with two things: how CBAM works — scope, deadlines, embedded emissions, default and actual values, verification, costs — and how to use Certrace to deal with it.";

const SCOPE_TH =
  "ฉันช่วยได้สองเรื่อง: CBAM ทำงานอย่างไร — ขอบเขต กำหนดเวลา การปล่อยที่ฝังอยู่ ค่า default และค่าจริง การทวนสอบ ต้นทุน — และการใช้ Certrace จัดการเรื่องนี้";

export const REFUSAL_TH: Record<Exclude<Verdict, "ok">, string> = {
  internal: `เรื่องนี้เกี่ยวกับการสร้างตัวผลิตภัณฑ์ ซึ่งฉันลงรายละเอียดไม่ได้ ${SCOPE_TH} ถามฉันได้ว่าหน้าจอไหนทำอะไร หรือทำสิ่งหนึ่งอย่างไร แล้วฉันจะพาไปทีละขั้น`,
  business: `เรื่องแพ็กเกจ ราคา และบริษัท ไม่ใช่เรื่องที่ฉันตอบได้ — แพ็กเกจและการเรียกเก็บเงินในเมนูด้านข้างคือที่สำหรับเรื่องแพ็กเกจ ${SCOPE_TH}`,
  self: `เรื่องนั้นฉันช่วยไม่ได้ ${SCOPE_TH}`,
  offtopic: `เรื่องนั้นอยู่นอกขอบเขตที่ฉันช่วยได้ ${SCOPE_TH}`,
};

const SCOPE_ZH = "我可以帮您两件事：CBAM 是如何运作的 — 范围、期限、内含排放、默认值与实际值、核查、成本 — 以及如何用 Certrace 来应对它。";

const SCOPE_HI = "मैं दो बातों में मदद कर सकती हूँ: CBAM कैसे काम करता है — दायरा, समय सीमाएँ, अंतर्निहित उत्सर्जन, डिफ़ॉल्ट और वास्तविक मान, सत्यापन, लागत — और उससे निपटने के लिए Certrace का उपयोग कैसे करें।";

export const REFUSAL_ZH: Record<Exclude<Verdict, "ok">, string> = {
  internal: `这涉及产品是如何构建的，我无法详述。${SCOPE_ZH} 您可以问我某个页面的作用，或者怎么完成某件事，我会一步步带您操作。`,
  business: `套餐、价格和公司方面的问题不归我回答 — 套餐请看侧边栏的“套餐与账单”。${SCOPE_ZH}`,
  self: `这件事我帮不上忙。${SCOPE_ZH}`,
  offtopic: `这超出了我能帮忙的范围。${SCOPE_ZH}`,
};

export const REFUSAL_HI: Record<Exclude<Verdict, "ok">, string> = {
  internal: `यह इस बारे में है कि उत्पाद कैसे बना है, जिसमें मैं नहीं जा सकती। ${SCOPE_HI} मुझसे पूछें कि कोई स्क्रीन क्या करती है या कोई काम कैसे हो, और मैं आपको कदम-दर-कदम बताऊँगा।`,
  business: `प्लान, कीमत और कंपनी के सवाल मेरे जवाब देने के नहीं हैं — प्लान के लिए साइडबार में प्लान और बिलिंग देखें। ${SCOPE_HI}`,
  self: `इसमें मैं मदद नहीं कर सकती। ${SCOPE_HI}`,
  offtopic: `यह मेरी मदद के दायरे से बाहर है। ${SCOPE_HI}`,
};

export const REFUSAL: Record<Exclude<Verdict, "ok">, string> = {
  internal: `That is about how the product is built, which isn't something I can go into. ${SCOPE} Ask me what any screen does or how to get something done and I'll walk you through it.`,
  business: `Plans, pricing and company questions aren't mine to answer — Plan & billing in the sidebar is the place for plans. ${SCOPE}`,
  self: `I can't help with that. ${SCOPE}`,
  offtopic: `That's outside what I can help with. ${SCOPE}`,
};

/** The refusals in the language of the question. */
export const refusal = (lang: CeraLang): Record<Exclude<Verdict, "ok">, string> => (lang === "th" ? REFUSAL_TH : lang === "zh" ? REFUSAL_ZH : lang === "hi" ? REFUSAL_HI : REFUSAL);
