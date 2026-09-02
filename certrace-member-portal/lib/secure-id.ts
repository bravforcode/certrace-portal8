/* ════════════════════════════════════════════════════════════
   IDENTIFIERS THAT DOUBLE AS ACCESS TOKENS

   A supplier row's id is what /p/<token> resolves, and a workspace's id is
   what /w/<token> resolves. Anyone holding the string can open the form, so
   the id is a credential whether or not it was designed as one.

   Which rules out Math.random() and Date.now(): both are guessable from
   outside — a timestamp to the millisecond is a small search space, and
   Math.random() is seeded per-context and never claimed to be unpredictable.
   crypto.getRandomValues is the only source here, with no fallback, because a
   fallback is exactly the path an attacker would rather the code took.
   ════════════════════════════════════════════════════════════ */

/** A prefixed identifier with `bytes` bytes of cryptographic randomness. */
export function secureId(prefix: string, bytes = 8): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
}
