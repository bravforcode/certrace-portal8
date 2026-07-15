/* Brand mark — always render from the asset file, never re-typeset the wordmark.
   Source of truth: certrace design system/assets/logo (LOGO_GUIDELINES.md).
   `-ink` (#111) is the default for the bone/white canvas; `-onDark` (#fff) is
   reserved for the #111 dark fill only. Min lockup width 96px — below that the
   wordmark stops reading, so use <CertraceIcon> instead. */

/* eslint-disable @next/next/no-img-element */

type Variant = "ink" | "onDark";

export function CertraceLogo({
  variant = "ink",
  className = "h-[18px] w-auto",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <img
      src={`/brand/certrace-logo-horizontal-${variant}.svg`}
      alt="Certrace"
      className={className}
      draggable={false}
    />
  );
}

export function CertraceIcon({
  variant = "ink",
  className = "h-6 w-6",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <img
      src={`/brand/certrace-icon-${variant}.svg`}
      alt="Certrace"
      className={className}
      draggable={false}
    />
  );
}
