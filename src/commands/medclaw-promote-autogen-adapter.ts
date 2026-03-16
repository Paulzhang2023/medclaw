import { promptYesNo } from "../cli/prompt.js";
import { promoteAutogenAdapter } from "../medclaw/adapter-runtime.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";

export async function promoteAutogenAdapterCommand(
  opts: {
    adapter: string;
    target?: "workspace" | "global";
    yes?: boolean;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const target = opts.target ?? "workspace";
  if (!opts.yes) {
    const approved = await promptYesNo(
      `Promote this autogen adapter into ${target} adapters?`,
      false,
    );
    if (!approved) {
      runtime.log("Promotion cancelled.");
      return;
    }
  }

  const result = await promoteAutogenAdapter({
    adapterPath: opts.adapter,
    scope: target,
  });

  runtime.log(`Promoted adapter: ${result.adapterId}`);
  runtime.log(`Scope: ${result.scope}`);
  runtime.log(`Adapter file: ${shortenHomePath(result.adapterPath)}`);
  if (result.coveragePath) {
    runtime.log(`Coverage file: ${shortenHomePath(result.coveragePath)}`);
  }
}
