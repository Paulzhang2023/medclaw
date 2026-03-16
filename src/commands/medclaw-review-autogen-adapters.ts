import { listAutogenAdapterReviews } from "../medclaw/adapter-runtime.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";

export async function reviewAutogenAdaptersCommand(runtime: RuntimeEnv = defaultRuntime) {
  const reviews = await listAutogenAdapterReviews();
  const flagged = reviews.filter((entry) => !entry.trusted);

  if (flagged.length === 0) {
    runtime.log("No untrusted autogen adapters found.");
    return;
  }

  runtime.log(`Untrusted autogen adapters: ${flagged.length}`);
  for (const entry of flagged) {
    runtime.log("");
    runtime.log(`- Adapter: ${entry.adapterId}`);
    runtime.log(`  Score: ${entry.score.toFixed(2)}`);
    runtime.log(`  Rows checked: ${entry.rowsChecked}`);
    runtime.log(`  Generated: ${entry.generatedAt}`);
    runtime.log(`  Adapter file: ${shortenHomePath(entry.adapterPath)}`);
    runtime.log(`  Coverage file: ${shortenHomePath(entry.reportPath)}`);
    for (const field of entry.fields) {
      runtime.log(
        `  Field ${field.field}: ${field.nonEmpty}/${field.total} (${field.ratio.toFixed(2)})`,
      );
    }
  }
}
