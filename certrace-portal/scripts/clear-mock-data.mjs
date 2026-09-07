/**
 * Certrace Portal — Mock Data Cleanup Snippets & Reference
 *
 * Use these snippets in your browser developer console (F12 > Console)
 * to inspect, selectively clear, or completely wipe local mock data.
 */

// 1. One-liner: Complete wipe of all Certrace local data (forces clean slate on reload)
export const BROWSER_FULL_WIPE = `
Object.keys(localStorage)
  .filter(k => k.startsWith("certrace:"))
  .forEach(k => localStorage.removeItem(k));
console.log("Certrace mock data completely wiped. Reloading...");
location.reload();
`;

// 2. Selective wipe: Reset all workspaces, shipments, suppliers & evidence, but KEEP signed-in user session
export const BROWSER_RESET_ESTATE_PRESERVE_AUTH = `
const PRESERVED = new Set(["certrace:auth", "certrace:anthropic-key"]);
let count = 0;
Object.keys(localStorage)
  .filter(k => k.startsWith("certrace:") && !PRESERVED.has(k))
  .forEach(k => {
    localStorage.removeItem(k);
    count++;
  });
console.log(\`Reset complete. \${count} business mock keys removed. Session preserved.\`);
location.reload();
`;

// 3. Inspection snippet: Print all stored mock keys and their payload sizes
export const BROWSER_INSPECT_STORAGE = `
console.table(
  Object.keys(localStorage)
    .filter(k => k.startsWith("certrace:"))
    .map(k => ({
      key: k,
      size_kb: (new Blob([localStorage.getItem(k)]).size / 1024).toFixed(2)
    }))
    .sort((a, b) => b.size_kb - a.size_kb)
);
`;

console.log("=== Certrace Mock Cleanup Helper ===");
console.log("To clear all mock data in your browser console, copy and run:\n");
console.log(BROWSER_FULL_WIPE);
