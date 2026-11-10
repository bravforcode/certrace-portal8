import type { PageReading } from "./autofill-types";

const englishMonths = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function mentionedMonths(text: string) {
  const found = new Set<string>();
  const add = (year: string, month: number) => {
    const y = Number(year);
    if (month >= 1 && month <= 12 && y >= 2020 && y <= 2099)
      found.add(`${y}-${String(month).padStart(2, "0")}`);
  };
  for (const match of text.matchAll(
    /\b(20\d{2})[-/.](0?[1-9]|1[0-2])\b(?![-/.]\d)/g,
  ))
    add(match[1]!, Number(match[2]));
  for (const match of text.matchAll(
    /(?<![\d/.-])\b(0?[1-9]|1[0-2])[/.-](20\d{2})\b/g,
  ))
    add(match[2]!, Number(match[1]));
  for (const match of text.matchAll(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,._-]+(20\d{2})\b/gi,
  ))
    add(match[2]!, englishMonths.indexOf(match[1]!.toLowerCase()) + 1);
  for (const match of text.matchAll(
    /(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(?:พ\.?ศ\.?\s*)?(20\d{2}|25\d{2})/g,
  )) {
    const year = Number(match[2]);
    add(
      String(year >= 2500 ? year - 543 : year),
      thaiMonths.indexOf(match[1]!) + 1,
    );
  }
  return found;
}

export function inferAutofillMonth(
  pages: PageReading[],
  filename: string,
  periodStart: string,
  periodEnd: string,
) {
  const inPeriod = (month: string) =>
    month >= periodStart.slice(0, 7) && month <= periodEnd.slice(0, 7);
  const fromPages = mentionedMonths(pages.map((page) => page.text).join("\n"));
  if (fromPages.size) {
    const month = [...fromPages][0];
    return fromPages.size === 1 && month && inPeriod(month) ? month : null;
  }
  const fromName = mentionedMonths(filename.replaceAll("_", "-"));
  const month = [...fromName][0];
  return fromName.size === 1 && month && inPeriod(month) ? month : null;
}
