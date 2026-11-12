import { assertProductionConfig } from "./config";

// Imported first by index.ts so unsafe production settings stop startup before
// any other module (database, app routes) loads.
assertProductionConfig();
