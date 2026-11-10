// The company is tab-specific. The server checks this selection against the
// authenticated user on every request, including raw file requests.
export function companyHeaders(actorId: string): Record<string, string> {
  const id =
    typeof window === "undefined"
      ? null
      : window.sessionStorage?.getItem("certrace:company:" + actorId);
  return id && id !== actorId ? { "X-Certrace-Company": id } : {};
}
export function restoreCompanyPreference(actorId: string) {
  if (
    typeof window === "undefined" ||
    !window.sessionStorage ||
    !window.localStorage
  )
    return;
  const key = "certrace:company:" + actorId;
  if (window.sessionStorage.getItem(key) === null)
    window.sessionStorage.setItem(
      key,
      window.localStorage.getItem(key) ?? actorId,
    );
}
export function selectCompany(actorId: string, companyId: string) {
  const key = "certrace:company:" + actorId;
  window.sessionStorage.setItem(key, companyId);
  window.localStorage.setItem(key, companyId);
}
const joinKey = "certrace:join-invitation";
export function rememberInvitation(value: string) {
  window.sessionStorage.setItem(joinKey, value);
}
export function forgetInvitation() {
  window.sessionStorage.removeItem(joinKey);
}
export function pendingInvitation() {
  return typeof window === "undefined"
    ? null
    : window.sessionStorage?.getItem(joinKey);
}
