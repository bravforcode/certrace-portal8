/** Loads the packaged PDF.js module from /pdf.min.mjs at runtime.
 *
 * Load the packaged ES module directly: rebundling PDF.js's legacy webpack
 * runtime inside Next's runtime can shadow its module export helpers.
 *
 * Server and edge builds swap this file for lib/pdf-loader-server-stub.ts
 * (next.config.ts). Otherwise the /pdf.min.mjs reference lands in edge
 * namespace chunks that Vercel's edge validator rejects.
 */
export function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
  const moduleUrl = "/pdf.min.mjs";
  return import(/* webpackIgnore: true */ moduleUrl) as Promise<
    typeof import("pdfjs-dist")
  >;
}
