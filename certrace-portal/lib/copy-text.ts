/** Clipboard API needs HTTPS (or localhost). The selection fallback also works
 * when the portal is opened through an HTTP IP address. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard permission may be denied even on a secure origin.
    }
  }

  if (typeof document === "undefined") return false;
  const field = document.createElement("textarea");
  const previousFocus = document.activeElement;
  field.value = text;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.focus();
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }
}
