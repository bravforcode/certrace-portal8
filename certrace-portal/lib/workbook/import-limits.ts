/* Limits and the one error type the import shows to people. Anything else thrown while reading
   a file is reported as "This file could not be read." */

export class ImportError extends Error {}

export const PARSE_LIMITS = {
  /** rows kept while parsing a CSV or sheet */
  rows: 20_000,
  /** columns kept while parsing (A to IV) */
  cols: 256,
  /** total bytes inflated from one workbook, across all parts */
  zipBytes: 50 * 1024 * 1024,
  /** parts listed in one workbook's central directory */
  zipEntries: 500,
  /** size of one XML part (a sheet or the shared strings) */
  partBytes: 10 * 1024 * 1024,
};
