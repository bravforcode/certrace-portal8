/* Brand mark — always render from the asset file, never re-typeset the wordmark.
   Source of truth: certrace design system/assets/logo (LOGO_GUIDELINES.md).
   `-ink` (#111) is the default for the bone/white canvas; `-onDark` (#fff) is
   reserved for the #111 dark fill only. Min lockup width 96px — below that the
   wordmark stops reading, so use <CertraceIcon> instead. */

type Variant = "ink" | "onDark";

export function CertraceLogo({
  variant = "ink",
  className = "h-[18px] w-auto",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       the mark is an SVG. next/image cannot optimise SVG and would only add a
       loader hop in front of a file that is already a few hundred bytes. */
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
    /* eslint-disable-next-line @next/next/no-img-element --
       the mark is an SVG. next/image cannot optimise SVG and would only add a
       loader hop in front of a file that is already a few hundred bytes. */
    <img
      src={`/brand/certrace-icon-${variant}.svg`}
      alt="Certrace"
      className={className}
      draggable={false}
    />
  );
}
