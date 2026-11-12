/** Stand-in for lib/pdf-loader.ts on the server and edge builds only (next.config.ts).
 *
 * /pdf.min.mjs is a static file served to browsers. The server cannot import it,
 * so this throws the same failure, with a clear message, and keeps PDF.js out of the server graph.
 */
export function loadPdfJs(): Promise<never> {
  return Promise.reject(
    new Error(
      "PDF reading runs in the browser; the server cannot load PDF.js.",
    ),
  );
}
