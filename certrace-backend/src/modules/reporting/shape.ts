/** A build-time catalogue of validated JSON document fields. */
export type Shape = {
  kind: string;
  arrayElement?: boolean;
  scopeKey?: boolean;
  derived?: "workspace";
  table?: string; // Historical shape identifier used by shared-master bindings.
  optional?: boolean;
  nullable?: boolean;
  enum?: readonly (string | number | boolean)[];
  min?: number;
  max?: number;
  format?: string;
  maxLength?: number;
  pattern?: string;
  fields?: Record<string, Shape>;
  item?: Shape;
};
