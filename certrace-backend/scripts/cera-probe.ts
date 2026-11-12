// Manual probe: one real Cera turn against the configured provider. Prints the
// provider name, the text, and proposed actions, or the error message.
import { companyContext } from "../src/modules/cera/context";
import { ceraProviderName } from "../src/modules/cera/provider";
import { generateTurn } from "../src/modules/cera/service";

const prompt =
  process.argv[2] ??
  'Set the CBAM field "Economic activity" (a-i22) for installation TH-CHECK-01, year 2026, to "Manufacture of basic iron and steel"';

console.log("provider:", ceraProviderName());
try {
  const turn = await generateTurn(
    { prompt, lang: "en", history: [], reference: "" },
    companyContext([], prompt),
  );
  console.log(JSON.stringify(turn, null, 2));
} catch (e) {
  const err = e as {
    message?: string;
    statusCode?: number;
    responseBody?: string;
  };
  console.log(
    "error:",
    err.statusCode,
    err.message,
    err.responseBody?.slice(0, 600),
  );
}
