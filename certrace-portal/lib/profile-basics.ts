/* Client-side mirror of the company and factory patterns in
   certrace-backend profile-contract.ts. The server stays authoritative; these
   only stop a malformed value before the request is sent. Blank values are
   allowed: only a value that is typed must be well formed. */

export type CompanyBasics = { taxId?: string; website?: string; country?: string };
export type FactoryBasics = { boilerCount?: string; furnaceCount?: string };

export function companyBasicsErrors(
  values: CompanyBasics,
): Partial<Record<keyof CompanyBasics, string>> {
  const errors: Partial<Record<keyof CompanyBasics, string>> = {};
  if (values.taxId && !/^\d{13}$/.test(values.taxId))
    errors.taxId = "Tax ID is 13 digits";
  if (values.website && !/^https:\/\/\S+$/.test(values.website))
    errors.website = "Enter a web address starting with https://";
  if (values.country && !/^[A-Z]{2}$/.test(values.country))
    errors.country = "Choose a country";
  return errors;
}

export function factoryBasicsErrors(
  values: FactoryBasics,
): Partial<Record<keyof FactoryBasics, string>> {
  const errors: Partial<Record<keyof FactoryBasics, string>> = {};
  for (const key of ["boilerCount", "furnaceCount"] as const) {
    const value = values[key];
    if (value && !/^\d{1,3}$/.test(value))
      errors[key] = "Enter a whole number from 0 to 999";
  }
  return errors;
}
