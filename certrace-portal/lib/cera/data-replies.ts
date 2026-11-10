/* ════════════════════════════════════════════════════════════
   CERA, ABOUT THE READER'S OWN SUPPLY CHAIN

   "Who is late and what should I chase first?" and "Which suppliers should I get verified figures from?" are the two
   questions the dashboard card puts one tap away — and a general answer about what a supplier is does not answer either.
   These read the same figures the dashboard reads (`readDashboard`) and say, in order, who and what.

   Nothing is invented: a month is late because the action queue says it is, a supplier is a worry because the Supply
   Chain model ranks it one, and a figure is on a default value because that is its recorded basis. With nothing to say,
   Cera says that.
   ════════════════════════════════════════════════════════════ */

import { readDashboard } from "@/lib/cbam/dashboard-data";
import type { Concern } from "@/lib/cbam/supply-chain-model";
import { translate } from "@/lib/i18n";
import { monthNameLong } from "@/lib/workspace";
import { pick, type CeraLang } from "./lang";
import type { CeraReply } from "./types";

const SHOWN = 4;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const monthOf = (link: string) => /\/monthly\/(\d{4}-\d{2})/.exec(link)?.[1];

/** One worry, in a short phrase in the language of the reply. */
function reason(lang: CeraLang, c: Concern): string {
  const L = (en: string, th: string, zh: string, hi: string) =>
    pick(lang, en, th, zh, hi);
  const n = c.n ?? 0;
  switch (c.kind) {
    case "late_months":
      return L(
        `${n} month${n === 1 ? "" : "s"} past the deadline and still unanswered`,
        `${n} เดือนเกินกำหนดและยังไม่ตอบ`,
        `${n} 个月已逾期仍未回复`,
        `${n} महीने समय सीमा से आगे और अब भी बिना जवाब`,
      );
    case "no_contact":
      return L(
        "no email on file to send the monthly link to",
        "ไม่มีอีเมลสำหรับส่งลิงก์รายเดือน",
        "没有可发送月度链接的邮箱",
        "मासिक लिंक भेजने के लिए कोई ईमेल दर्ज नहीं",
      );
    case "months_to_send":
      return L(
        `${n} month${n === 1 ? "" : "s"} ready to send: nobody has been asked yet`,
        `${n} เดือนพร้อมส่ง: ยังไม่ได้ขอจากใครเลย`,
        `${n} 个月可发送：尚未向任何人索取`,
        `${n} महीने भेजने के लिए तैयार: अभी किसी से नहीं माँगा गया`,
      );
    case "low_completeness":
      return L(
        "most of its answers are still empty",
        "คำตอบส่วนใหญ่ยังว่างอยู่",
        "大部分答复仍为空",
        "ज़्यादातर उत्तर अभी खाली हैं",
      );
    case "precursor_late":
      return L(
        "its answer is past the deadline",
        "คำตอบเกินกำหนดแล้ว",
        "其答复已逾期",
        "इसका उत्तर समय सीमा से आगे है",
      );
    case "precursor_not_sent":
      return L(
        "not invited yet",
        "ยังไม่ได้เชิญ",
        "尚未邀请",
        "अभी आमंत्रित नहीं किया गया",
      );
    case "precursor_stale":
      return L(
        `invited ${n} days ago, no answer`,
        `เชิญไปเมื่อ ${n} วันก่อน ยังไม่ตอบ`,
        `${n} 天前已邀请，未回复`,
        `${n} दिन पहले आमंत्रित, कोई जवाब नहीं`,
      );
    case "precursor_default":
      return n > 0
        ? L(
            `on a default value, carrying ${n}% of the precursor emissions`,
            `ใช้ค่า default และมีสัดส่วน ${n}% ของการปล่อยจากวัตถุดิบตั้งต้น`,
            `使用默认值，占前体排放的 ${n}%`,
            `डिफ़ॉल्ट मान पर, पूर्ववर्ती उत्सर्जन का ${n}% वहन करता है`,
          )
        : L(
            "on a default value",
            "ใช้ค่า default",
            "使用默认值",
            "डिफ़ॉल्ट मान पर",
          );
    case "precursor_checks":
      return L(
        "the verification report fails a check",
        "รายงานการทวนสอบไม่ผ่านการตรวจ",
        "核查报告未通过检查",
        "सत्यापन रिपोर्ट एक जाँच में विफल है",
      );
    case "precursor_unverified":
      return L(
        "a figure with no verification report behind it",
        "ตัวเลขที่ไม่มีรายงานการทวนสอบรองรับ",
        "数字背后没有核查报告",
        "बिना सत्यापन रिपोर्ट वाला आँकड़ा",
      );
  }
}

export function chaseReply(lang: CeraLang, now: Date = new Date()): CeraReply {
  const L = (en: string, th: string, zh: string, hi: string) =>
    pick(lang, en, th, zh, hi);
  const d = readDashboard(now);

  const late = d.actions
    .filter((a) => a.daysUntilDue < 0)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, SHOWN);
  const lateTotal = d.actions.filter((a) => a.daysUntilDue < 0).length;
  // The same supplier turns up in every report it feeds; it is one name to chase, once.
  const seenWorry = new Set<string>();
  const worries = d.chain.concerns
    .filter((c) => c.severity !== "low" && c.kind !== "late_months")
    .filter((c) =>
      seenWorry.has(`${c.name}|${c.kind}`)
        ? false
        : (seenWorry.add(`${c.name}|${c.kind}`), true),
    )
    .slice(0, SHOWN);

  if (lateTotal === 0 && worries.length === 0) {
    const days = d.daysToDeadline;
    return {
      text: L(
        `Nothing is late right now, and nothing in your chain is worrying us. The date to keep in mind is the buyers' first CBAM declaration — ${days} days away — and your verified figures have to be with them before it.`,
        `ตอนนี้ไม่มีอะไรล่าช้า และไม่มีอะไรในห่วงโซ่ของคุณน่ากังวล วันที่ต้องจำคือวันที่ผู้ซื้อยื่นแสดงรายการ CBAM ครั้งแรก — อีก ${days} วัน — และตัวเลขที่ทวนสอบแล้วของคุณต้องไปถึงเขาก่อนวันนั้น`,
        `目前没有逾期事项，您的供应链中也没有令人担忧之处。需要记住的日期是买家首次 CBAM 申报 — 还有 ${days} 天 — 您经核查的数字必须在此之前送到他们手中。`,
        `अभी कुछ भी देर से नहीं है, और आपकी श्रृंखला में कुछ चिंताजनक नहीं। याद रखने वाली तारीख़ खरीदारों की पहली CBAM घोषणा है — ${days} दिन दूर — और आपके सत्यापित आँकड़े उससे पहले उनके पास होने चाहिए।`,
      ),
      suggestions: undefined,
    };
  }

  const lines: string[] = [];
  if (lateTotal > 0) {
    lines.push(
      L(
        lateTotal === 1
          ? "1 thing is overdue:"
          : `${lateTotal} things are overdue, worst first:`,
        lateTotal === 1
          ? "มี 1 รายการเลยกำหนด:"
          : `มี ${lateTotal} รายการเลยกำหนด เรียงจากหนักสุด:`,
        lateTotal === 1
          ? "有 1 项逾期："
          : `有 ${lateTotal} 项逾期，最严重的在前：`,
        lateTotal === 1
          ? "1 चीज़ देर से है:"
          : `${lateTotal} चीज़ें देर से हैं, सबसे बुरी पहले:`,
      ),
    );
    for (const a of late) {
      const iso = monthOf(a.deepLink);
      const what = a.say
        ? translate(lang, a.say.key, a.say.vars)
        : translate(lang, a.label);
      const month = iso ? monthNameLong(iso) : "";
      const n = -a.daysUntilDue;
      lines.push(
        iso
          ? L(
              `• ${month} data — ${a.workspaceLabel}: ${n} day${n === 1 ? "" : "s"} late`,
              `• ข้อมูล ${month} — ${a.workspaceLabel}: ช้า ${n} วัน`,
              `• ${month}的数据 — ${a.workspaceLabel}：逾期 ${n} 天`,
              `• ${month} का डेटा — ${a.workspaceLabel}: ${n} दिन देर`,
            )
          : `• ${what} — ${a.workspaceLabel}`,
      );
    }
  }
  if (worries.length > 0) {
    lines.push(
      L("In your chain:", "ในห่วงโซ่ของคุณ:", "在您的供应链中：", "आपकी श्रृंखला में:"),
    );
    for (const c of worries) lines.push(`• ${c.name}: ${reason(lang, c)}`);
  }
  lines.push(
    L(
      "Start with the oldest month — one late month holds up the whole year's figure, and the buyers file on 30 September 2027.",
      "เริ่มจากเดือนที่เก่าที่สุด — เดือนเดียวที่ล่าช้าทำให้ตัวเลขทั้งปีค้าง และผู้ซื้อยื่นวันที่ 30 กันยายน 2570",
      "先从最早的月份开始 — 一个逾期的月份会拖住全年的数字，而买家在 2027 年 9 月 30 日申报。",
      "सबसे पुराने महीने से शुरू करें — एक देर वाला महीना पूरे साल का आँकड़ा रोक देता है, और खरीदार 30 सितंबर 2027 को घोषणा करते हैं।",
    ),
  );

  const seenMonth = new Set<string>();
  const links = late
    .map((a) => ({ a, iso: monthOf(a.deepLink) }))
    .filter(
      (x) => x.iso && !seenMonth.has(x.iso) && (seenMonth.add(x.iso), true),
    )
    .slice(0, 2)
    .map(({ a, iso }) => ({
      label: L(
        `Open ${monthNameLong(iso as string)}`,
        `เปิด ${monthNameLong(iso as string)}`,
        `打开${monthNameLong(iso as string)}`,
        `${monthNameLong(iso as string)} खोलें`,
      ),
      href: a.deepLink,
      focus: "#qf-production",
    }));
  return {
    text: lines.join("\n"),
    cards: links.length ? [{ kind: "links", links }] : undefined,
    suggestions: [
      "Which suppliers should I get verified figures from?",
      "What does each sidebar item do?",
    ],
  };
}

export function verifyReply(lang: CeraLang): CeraReply {
  const L = (en: string, th: string, zh: string, hi: string) =>
    pick(lang, en, th, zh, hi);
  const d = readDashboard();
  const all = d.chain.concentration;

  if (all.length === 0) {
    return {
      text: L(
        "No bought-in input carries emissions yet, so there is no supplier whose figure matters more than another's. Add your direct precursors on the Precursors tab of a product report, and I can rank them.",
        "ยังไม่มีวัตถุดิบที่ซื้อเข้ามาที่มีการปล่อย จึงยังไม่มีซัพพลายเออร์รายใดที่ตัวเลขสำคัญกว่ารายอื่น เพิ่มวัตถุดิบตั้งต้นโดยตรงที่แท็บวัตถุดิบตั้งต้นของรายงานผลิตภัณฑ์ แล้วฉันจะจัดอันดับให้",
        "目前没有带排放的外购投入，所以还谈不上哪个供应商的数字更重要。请在产品报告的“前体”标签页添加直接前体，我就能为它们排序。",
        "अभी किसी खरीदे हुए इनपुट में उत्सर्जन नहीं है, इसलिए कोई आपूर्तिकर्ता दूसरे से ज़्यादा मायने नहीं रखता। उत्पाद रिपोर्ट के पूर्ववर्ती सामग्री टैब पर अपनी सीधी पूर्ववर्ती सामग्री जोड़ें, फिर मैं उन्हें क्रम में रख सकूँगी।",
      ),
    };
  }

  // The ones still on a default or an unreported figure come first: a verified figure replaces them, and they are where the gap is.
  const open = all.filter((c) => c.basis !== "verified").slice(0, SHOWN);
  const basisWord = (b: string) =>
    b === "default"
      ? L("on a default value", "ใช้ค่า default", "使用默认值", "डिफ़ॉल्ट मान पर")
      : L(
          "a figure with no verification report",
          "ตัวเลขที่ไม่มีรายงานการทวนสอบ",
          "没有核查报告的数字",
          "बिना सत्यापन रिपोर्ट का आँकड़ा",
        );

  if (open.length === 0) {
    return {
      text: L(
        "Every supplier that carries emissions already has a verified figure behind it. Keep their reports in date — a report that has expired puts the default back.",
        "ซัพพลายเออร์ทุกรายที่มีการปล่อยมีตัวเลขที่ทวนสอบแล้วรองรับ ดูแลรายงานของเขาให้ไม่หมดอายุ — รายงานที่หมดอายุจะทำให้กลับไปใช้ค่า default",
        "每个带排放的供应商都已有经核查的数字支撑。请让他们的报告保持在有效期内 — 过期的报告会让默认值重新生效。",
        "उत्सर्जन वाले हर आपूर्तिकर्ता के पीछे पहले से सत्यापित आँकड़ा है। उनकी रिपोर्टें तारीख़ में रखें — समाप्त हुई रिपोर्ट डिफ़ॉल्ट वापस ले आती है।",
      ),
      suggestions: ["Who is late and what should I chase first?"],
    };
  }

  const lines = [
    L(
      "These carry the largest shares of your bought-in emissions and are not verified yet — ask them first, because a verified figure replaces the default and its mark-up:",
      "รายเหล่านี้มีสัดส่วนการปล่อยจากวัตถุดิบที่ซื้อเข้ามามากที่สุดและยังไม่ได้ทวนสอบ — ขอจากเขาก่อน เพราะตัวเลขที่ทวนสอบแล้วจะแทนที่ค่า default และส่วนบวกเพิ่ม:",
      "这些供应商占您外购排放的份额最大，且尚未经核查 — 请先向他们索取，因为经核查的数字会取代默认值及其加成：",
      "ये आपके खरीदे हुए उत्सर्जन का सबसे बड़ा हिस्सा वहन करते हैं और अभी सत्यापित नहीं हैं — पहले इनसे माँगें, क्योंकि सत्यापित आँकड़ा डिफ़ॉल्ट और उसके मार्क-अप की जगह ले लेता है:",
    ),
  ];
  for (const c of open)
    lines.push(
      `• ${c.name} (${c.product}): ${pct(c.share)} — ${basisWord(c.basis)}`,
    );
  lines.push(
    L(
      "Open the Supply Chain page and press Smart links to send each one the request.",
      "เปิดหน้าห่วงโซ่อุปทาน แล้วไปที่สมาร์ทลิงค์เพื่อส่งคำขอให้แต่ละราย",
      "打开“供应链”页面，再到“智能链接”向他们每一位发送请求。",
      "आपूर्ति श्रृंखला पेज खोलें और हर एक को अनुरोध भेजने के लिए स्मार्ट लिंक पर जाएँ।",
    ),
  );
  return {
    text: lines.join("\n"),
    cards: [
      {
        kind: "links",
        links: [
          {
            label: L(
              "Open Supply Chain",
              "เปิดห่วงโซ่อุปทาน",
              "打开供应链",
              "आपूर्ति श्रृंखला खोलें",
            ),
            href: "/supply-chain",
          },
        ],
      },
    ],
    suggestions: ["Who is late and what should I chase first?"],
  };
}
