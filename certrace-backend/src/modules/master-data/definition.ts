import { reportSpecs } from "../reporting/catalogue";
import { profileSpec } from "./profile-contract";
import type { Shape } from "../reporting/shape";

export const entities = {
  organization: {
    name: "text",
    registration: "text",
    address: "text",
    country: "text",
    contact_name: "text",
    contact_email: "text",
    contact_phone: "text",
  },
  installation: {
    name: "text",
    name_local: "text",
    street: "text",
    economic_activity: "text",
    postcode: "text",
    po_box: "text",
    city: "text",
    country: "text",
    unlocode: "text",
    latitude: "text",
    longitude: "text",
    contact_name: "text",
    contact_email: "text",
    contact_phone: "text",
    registry_id: "text",
    full_address: "text",
  },
  product: {
    name: "text",
    cn_code: "text",
    description: "text",
    unit: "text",
    benchmark: "text",
  },
} as const;
export type EntityKind = keyof typeof entities;
export type Binding = {
  kind: EntityKind;
  role: string;
  fields: Record<string, string>;
  via?: "installation";
  when?: "precursor" | "installation";
};
const installationFields = {
  name: "name",
  nameLocal: "name_local",
  street: "street",
  economicActivity: "economic_activity",
  postcode: "postcode",
  poBox: "po_box",
  city: "city",
  country: "country",
  unlocode: "unlocode",
  lat: "latitude",
  lng: "longitude",
  contactName: "contact_name",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
};
const companyFields = {
  name: "name",
  country: "country",
  contactName: "contact_name",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
};
const productFields = {
  name: "name",
  cnCode: "cn_code",
  description: "description",
  unit: "unit",
  benchmark: "benchmark",
};
export function bindings(s: Shape): Binding[] {
  const t = s.table ?? "";
  if (t === "account_profile")
    return [
      {
        kind: "organization",
        role: "operator",
        fields: { companyName: "name", jurisdiction: "country" },
      },
    ];
  if (t === "workspace_profiles")
    return [
      {
        kind: "organization",
        role: "operator",
        via: "installation",
        fields: {
          supplierName: "name",
          supplierId: "@supplier",
          selfSupplied: "@self",
        },
      },
      {
        kind: "installation",
        role: "installation",
        fields: { installationName: "name", installationId: "@reference" },
      },
      {
        kind: "product",
        role: "product",
        fields: {
          productName: "name",
          cnCode: "cn_code",
          productId: "@catalog",
        },
      },
    ];
  if (t === "installation_profiles")
    return [
      {
        kind: "installation",
        role: "installation",
        fields: {
          ...installationFields,
          id: "@reference",
          self: "@self",
          supplierId: "@supplier",
        },
      },
    ];
  if (t === "supplier_company_profiles")
    return [
      {
        kind: "organization",
        role: "operator",
        fields: { ...companyFields, id: "@supplier" },
      },
    ];
  if (s.fields?.operatorName)
    return [
      {
        kind: "organization",
        role: "operator",
        via: "installation",
        fields: {
          operatorName: "name",
          operatorRegistration: "registration",
          operatorAddress: "address",
        },
      },
      {
        kind: "installation",
        role: "installation",
        fields: { registryId: "registry_id" },
      },
    ];
  if (s.fields?.benchmark && s.fields?.cnCode)
    return [{ kind: "product", role: "product", fields: productFields }];
  if (
    t === "precursor_sources" ||
    t === "precursor_versions_rows_rows_snapshot"
  )
    return (
      [
        {
          kind: "organization",
          role: "producer",
          fields: {
            name: "name",
            contactName: "contact_name",
            contactEmail: "contact_email",
            contactPhone: "contact_phone",
          },
        },
        {
          kind: "installation",
          role: "producer_installation",
          fields: {
            installationName: "name",
            country: "country",
            unlocode: "unlocode",
            latitude: "latitude",
            longitude: "longitude",
            fullAddress: "full_address",
          },
        },
        {
          kind: "product",
          role: "precursor_product",
          fields: { precursorName: "name", cnCode: "cn_code" },
        },
      ] as Binding[]
    )
      .map((b) => ({
        ...b,
        ...(t.includes("versions") ? { when: "precursor" as const } : {}),
      }))
      .concat(
        t.includes("versions")
          ? [
              {
                kind: "installation" as const,
                role: "installation_history",
                fields: {
                  ...installationFields,
                  self: "@self",
                  supplierId: "@supplier",
                },
                when: "installation" as const,
              },
            ]
          : [],
      );
  if (t === "report_inputs_v1_rows")
    return [{ kind: "organization", role: "scope_operator", fields: {} }];
  if (t === "report_inputs_v1_rows_0_7_rows_rows_values")
    return [
      { kind: "organization", role: "operator", fields: { operator: "name" } },
      { kind: "organization", role: "exporter", fields: { exporter: "name" } },
    ];
  if (t === "report_inputs_v1_rows_0_4_rows_rows_values")
    return [
      {
        kind: "organization",
        role: "operator",
        fields: { country: "country" },
      },
    ];
  if (t === "report_inputs_v1_rows_0_5_rows_rows_values")
    return [
      {
        kind: "organization",
        role: "operator",
        fields: {
          name: "contact_name",
          email: "contact_email",
          phone: "contact_phone",
        },
      },
    ];
  return [];
}
export const nodes: { shape: Shape; parent: string }[] = [];
function collect(s: Shape, parent: string) {
  nodes.push({ shape: s, parent });
  if (s.fields)
    for (const v of Object.values(s.fields)) if (v.table) collect(v, s.table!);
  if (s.item) collect(s.item, s.table!);
}
for (const s of [...Object.values(reportSpecs), profileSpec])
  collect(s, "records");
export const boundNodes = nodes.filter((n) => bindings(n.shape).length);
export const versionColumn = (b: Binding) => `_${b.role}_version_id`;
export function masterFields(s: Shape) {
  return new Set(bindings(s).flatMap((b) => Object.keys(b.fields)));
}
