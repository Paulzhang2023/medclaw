import { promptYesNo } from "../cli/prompt.js";
import {
  installCloudAdapter,
  listCloudAdapters,
  uploadAdapterToCloud,
} from "../medclaw/cloud-registry.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";

function formatCloudError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/registry url not configured/i.test(message)) {
    return [
      "MedClaw cloud registry is not configured.",
      "Run `openclaw medclaw connect-local-registry` for local development, or set a registry URL in medclaw.config.json.",
    ].join("\n");
  }
  if (/401|unauthorized/i.test(message)) {
    return [
      "MedClaw cloud registry rejected this request.",
      "Check the adapter registry token and try again.",
    ].join("\n");
  }
  return `MedClaw cloud sync failed.\n${message}`;
}

export async function uploadAdapterToCloudCommand(
  opts: { adapter: string; yes?: boolean },
  runtime: RuntimeEnv = defaultRuntime,
) {
  try {
    if (!opts.yes) {
      const approved = await promptYesNo(
        "Upload this adapter to the MedClaw cloud registry for potential global sharing?",
        false,
      );
      if (!approved) {
        runtime.log("Upload cancelled.");
        return;
      }
    }
    const result = await uploadAdapterToCloud({
      adapterPath: opts.adapter,
    });
    runtime.log(`Uploaded adapter: ${result.id}`);
    runtime.log(`Version: ${result.version}`);
    if (result.reviewStatus) {
      runtime.log(`Review status: ${result.reviewStatus}`);
    }
  } catch (error) {
    throw new Error(formatCloudError(error), { cause: error });
  }
}

export async function checkCloudAdaptersCommand(
  opts: { site?: string; host?: string },
  runtime: RuntimeEnv = defaultRuntime,
) {
  try {
    const items = await listCloudAdapters({
      site: opts.site,
      host: opts.host,
    });
    if (items.length === 0) {
      runtime.log("No cloud adapters found.");
      return;
    }
    runtime.log(`Cloud adapters: ${items.length}`);
    for (const item of items) {
      runtime.log("");
      runtime.log(`- ${item.id}`);
      runtime.log(`  Site: ${item.site}`);
      runtime.log(`  Version: ${item.version}`);
      if (typeof item.score === "number") {
        runtime.log(`  Score: ${item.score.toFixed(2)}`);
      }
      if (typeof item.trusted === "boolean") {
        runtime.log(`  Trusted: ${item.trusted ? "yes" : "no"}`);
      }
      if (item.hosts?.length) {
        runtime.log(`  Hosts: ${item.hosts.join(", ")}`);
      }
      if (item.title) {
        runtime.log(`  Title: ${item.title}`);
      }
    }
  } catch (error) {
    throw new Error(formatCloudError(error), { cause: error });
  }
}

export async function installCloudAdapterCommand(
  opts: {
    id: string;
    target?: "workspace" | "global";
    yes?: boolean;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const target = opts.target ?? "workspace";
  try {
    if (!opts.yes) {
      const approved = await promptYesNo(
        `Install cloud adapter ${opts.id} into ${target} adapters?`,
        false,
      );
      if (!approved) {
        runtime.log("Install cancelled.");
        return;
      }
    }
    const result = await installCloudAdapter({
      id: opts.id,
      target,
    });
    runtime.log(`Installed cloud adapter: ${opts.id}`);
    runtime.log(`Adapter file: ${shortenHomePath(result.adapterPath)}`);
    if (result.coveragePath) {
      runtime.log(`Coverage file: ${shortenHomePath(result.coveragePath)}`);
    }
  } catch (error) {
    throw new Error(formatCloudError(error), { cause: error });
  }
}
