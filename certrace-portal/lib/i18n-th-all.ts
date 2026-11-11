// The whole Thai dictionary in one chunk, loaded by `loadLocale("th")` in lib/i18n.ts.
// Later spreads win, so the order is the precedence the dictionary has always had.
import { TH } from "./i18n-th";
import { TH_CN } from "./i18n-th-cn";
import { TH_INTAKE } from "./i18n-th-intake";
import { TH_LINK } from "./i18n-th-link";
import { TH_POLISH } from "./i18n-th-polish";
import { TH_ROUTES } from "./i18n-th-routes";
import { TH_SECTOR } from "./i18n-th-sector";
import { TH_WORKSPACE } from "./i18n-th-workspace";
import { TH_OPPORTUNITIES } from "./i18n-th-opportunities";
import { TH_WHATIF } from "./i18n-th-whatif";

export const TH_ALL: Record<string, string> = {
  ...TH_WORKSPACE,
  ...TH_OPPORTUNITIES,
  ...TH_WHATIF,
  ...TH_LINK,
  ...TH_CN,
  ...TH_ROUTES,
  ...TH_SECTOR,
  ...TH_INTAKE,
  ...TH,
  ...TH_POLISH,
};
