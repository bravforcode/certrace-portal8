export type Path = (string | number)[];
export type PageReading = { page: number; text: string; image?: string };
export type FieldTarget = {
  id: string;
  key: string;
  path: Path;
  label: string;
  kind: string;
  options?: readonly (string | number | boolean)[];
  min?: number;
  max?: number;
  format?: string;
  unit?: string;
  current: unknown;
  context: string;
  shared?: boolean;
};
export type Proposal = {
  id: string;
  target: FieldTarget;
  value: string | number | boolean | string[];
  original: string;
  sourceUnit: string;
  page: number;
  quote: string;
  explanation: string;
  warnings: string[];
  blocked: boolean;
};
export type AutofillResult = {
  proposals: Proposal[];
  unresolved: string[];
  needsVision: number[];
  model: string;
  inputTokens: number;
  outputTokens: number;
};
export type AutofillRunView = {
  id: string;
  status: string;
  fileId: string;
  sourceStored?: boolean;
  month?: string;
  monthInferred?: boolean;
  filename: string;
  result: Pick<AutofillResult, "proposals" | "unresolved" | "needsVision">;
  error: string | null;
};
