import fs from "node:fs/promises";
import path from "node:path";
import type { Command } from "commander";
import {
  checkCloudAdaptersCommand,
  installCloudAdapterCommand,
  uploadAdapterToCloudCommand,
} from "../../commands/medclaw-cloud-sync.js";
import { promoteAutogenAdapterCommand } from "../../commands/medclaw-promote-autogen-adapter.js";
import { reviewAutogenAdaptersCommand } from "../../commands/medclaw-review-autogen-adapters.js";
import {
  applyMedClawMinimalConfigCommand,
  connectLocalMedClawRegistryCommand,
  initMedClawMinimalConfigCommand,
  medClawStartCommand,
  medClawSetupCommand,
  refreshMedClawWorkspaceGuideCommand,
  runMedClawWizardCommand,
} from "../../commands/medclaw-setup.js";
import { validateMedClawAdapterCommand } from "../../commands/medclaw-validate-adapter.js";
import { MEDCLAW_MINIMAL_CONFIG_EXAMPLE } from "../../medclaw/minimal-config.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { runCommandWithRuntime } from "../cli-utils.js";

function buildDefaultMinimalConfig(opts: {
  workspace?: string;
  seekEvidenceUrl?: string;
  deepEvidenceUrl?: string;
  adapterRegistryUrl?: string;
}) {
  return {
    ...structuredClone(MEDCLAW_MINIMAL_CONFIG_EXAMPLE),
    profile: {
      ...MEDCLAW_MINIMAL_CONFIG_EXAMPLE.profile,
      ...("workspace" in opts && opts.workspace ? { workspace: opts.workspace } : {}),
    },
    products: {
      ...MEDCLAW_MINIMAL_CONFIG_EXAMPLE.products,
      deepEvidence: {
        ...MEDCLAW_MINIMAL_CONFIG_EXAMPLE.products?.deepEvidence,
        ...(opts.deepEvidenceUrl ? { url: opts.deepEvidenceUrl } : {}),
      },
      seekEvidence: {
        ...MEDCLAW_MINIMAL_CONFIG_EXAMPLE.products?.seekEvidence,
        ...(opts.seekEvidenceUrl ? { url: opts.seekEvidenceUrl } : {}),
      },
    },
    registry:
      opts.adapterRegistryUrl === undefined
        ? undefined
        : opts.adapterRegistryUrl
          ? {
              mode: "cloud",
              url: opts.adapterRegistryUrl,
            }
          : {
              mode: "off",
            },
  };
}

export function registerMedClawCommand(program: Command) {
  const medclaw = program
    .command("medclaw")
    .description(
      "Initialize MedClaw v0.1 with a medical-focused preset and narrowed onboarding path",
    )
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/start/medclaw-v0.1", "docs.openclaw.ai/start/medclaw-v0.1")}\n`,
    )
    .option("--workspace <dir>", "MedClaw workspace directory (default: ~/.medclaw/workspace)")
    .option(
      "--seekevidence-url <url>",
      "SeekEvidence entry URL (default: https://seekevidence.medsci.cn)",
    )
    .option(
      "--deepevidence-url <url>",
      "DeepEvidence entry URL (default: https://deepevid.medsci.cn)",
    )
    .option("--registry-url <url>", "MedClaw adapter registry URL")
    .option("--registry-token <token>", "MedClaw adapter registry bearer token")
    .option("--minimal-config <path>", "Apply MedClaw from a medclaw.config.json file")
    .option(
      "--wizard",
      "Run the MedClaw onboarding flow after applying medclaw.config.json (default path: ./medclaw.config.json)",
      false,
    )
    .option("--install-daemon", "Install the gateway service during onboarding", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const explicitMinimalConfigPath = opts.minimalConfig as string | undefined;
        const workspace = opts.workspace as string | undefined;
        const seekEvidenceUrl = opts.seekevidenceUrl as string | undefined;
        const deepEvidenceUrl = opts.deepevidenceUrl as string | undefined;
        const adapterRegistryUrl = opts.registryUrl as string | undefined;
        const adapterRegistryToken = opts.registryToken as string | undefined;
        const shouldDefaultToMinimalConfig =
          Boolean(opts.wizard) || Boolean(explicitMinimalConfigPath);

        let onboardingWorkspace = workspace;

        if (shouldDefaultToMinimalConfig) {
          const minimalConfigPath = path.resolve(
            explicitMinimalConfigPath ?? path.join(process.cwd(), "medclaw.config.json"),
          );
          if (!explicitMinimalConfigPath) {
            let exists = true;
            try {
              await fs.access(minimalConfigPath);
            } catch {
              exists = false;
            }
            if (!exists) {
              await initMedClawMinimalConfigCommand(
                {
                  path: minimalConfigPath,
                  example: buildDefaultMinimalConfig({
                    workspace,
                    seekEvidenceUrl,
                    deepEvidenceUrl,
                    adapterRegistryUrl,
                  }),
                },
                defaultRuntime,
              );
            }
          }
          const result = await applyMedClawMinimalConfigCommand(
            {
              path: minimalConfigPath,
            },
            defaultRuntime,
          );
          onboardingWorkspace = result.minimal.profile?.workspace?.trim() || onboardingWorkspace;
        } else {
          await medClawSetupCommand(
            {
              workspace,
              seekEvidenceUrl,
              deepEvidenceUrl,
              adapterRegistryUrl,
              adapterRegistryToken,
            },
            defaultRuntime,
          );
        }

        if (!opts.wizard) {
          defaultRuntime.log(
            [
              "",
              "Next steps:",
              "  openclaw medclaw init-minimal-config",
              "  openclaw medclaw apply-minimal-config",
              "  openclaw medclaw --wizard",
              "  openclaw medclaw start",
              "  openclaw dashboard",
            ].join("\n"),
          );
          return;
        }

        await runMedClawWizardCommand(
          {
            workspace: onboardingWorkspace,
            installDaemon: Boolean(opts.installDaemon),
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("start")
    .description(
      "One-command MedClaw local start flow: apply config, prepare workspace, and open the Medical dashboard",
    )
    .option(
      "--minimal-config <path>",
      "Apply MedClaw from a medclaw.config.json file before starting",
    )
    .option("--workspace <dir>", "MedClaw workspace directory (default: ~/.medclaw/workspace)")
    .option(
      "--install-daemon",
      "Install the MedClaw background service before opening the dashboard",
      false,
    )
    .option("--no-open-dashboard", "Do not open the dashboard automatically", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const minimalConfigPath = path.resolve(
          (opts.minimalConfig as string | undefined) ??
            path.join(process.cwd(), "medclaw.config.json"),
        );
        let resolvedMinimalConfigPath: string | undefined;
        try {
          await fs.access(minimalConfigPath);
          resolvedMinimalConfigPath = minimalConfigPath;
        } catch {
          resolvedMinimalConfigPath = undefined;
        }
        await medClawStartCommand(
          {
            minimalConfigPath: resolvedMinimalConfigPath,
            workspace: opts.workspace as string | undefined,
            installDaemon: Boolean(opts.installDaemon),
            openDashboard: !opts.noOpenDashboard,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("init-minimal-config")
    .description("Write a starter medclaw.config.json file for the minimal MedClaw config flow")
    .option("--path <file>", "Target file path (default: ./medclaw.config.json)")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await initMedClawMinimalConfigCommand(
          {
            path: opts.path as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("apply-minimal-config")
    .description(
      "Read medclaw.config.json, validate it, translate it, and apply the generated OpenClaw config",
    )
    .option("--path <file>", "Source file path (default: ./medclaw.config.json)")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await applyMedClawMinimalConfigCommand(
          {
            path: opts.path as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("refresh-workspace-guide")
    .description(
      "Rewrite MEDCLAW.md in the target workspace using the latest MedClaw workspace guidance",
    )
    .option("--workspace <dir>", "MedClaw workspace directory (default: ~/.medclaw/workspace)")
    .option(
      "--seekevidence-url <url>",
      "SeekEvidence entry URL (default: https://seekevidence.medsci.cn)",
    )
    .option(
      "--deepevidence-url <url>",
      "DeepEvidence entry URL (default: https://deepevid.medsci.cn)",
    )
    .option("--registry-url <url>", "MedClaw adapter registry URL")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await refreshMedClawWorkspaceGuideCommand(
          {
            workspace: opts.workspace as string | undefined,
            seekEvidenceUrl: opts.seekevidenceUrl as string | undefined,
            deepEvidenceUrl: opts.deepevidenceUrl as string | undefined,
            adapterRegistryUrl: opts.registryUrl as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("connect-local-registry")
    .description(
      "Point MedClaw cloud sync commands at a local adapter registry for end-to-end development",
    )
    .option("--workspace <dir>", "MedClaw workspace directory (default: ~/.medclaw/workspace)")
    .option("--registry-url <url>", "Registry URL (default: http://127.0.0.1:4318)")
    .option("--registry-token <token>", "Registry bearer token (default: medclaw-local-dev-token)")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await connectLocalMedClawRegistryCommand(
          {
            workspace: opts.workspace as string | undefined,
            adapterRegistryUrl: opts.registryUrl as string | undefined,
            adapterRegistryToken: opts.registryToken as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("review-autogen-adapters")
    .description("List workspace autogen adapters with trusted=false, ordered by coverage score")
    .action(async () => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await reviewAutogenAdaptersCommand(defaultRuntime);
      });
    });

  medclaw
    .command("upload-adapter")
    .description(
      "Upload a local adapter to the MedClaw cloud registry after explicit user approval",
    )
    .requiredOption("--adapter <path>", "Path to the local adapter JSON file")
    .option("--yes", "Skip confirmation prompt", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await uploadAdapterToCloudCommand(
          {
            adapter: opts.adapter as string,
            yes: Boolean(opts.yes),
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("check-cloud-adapters")
    .description("Discover adapters available from the MedClaw cloud registry")
    .option("--site <name>", "Filter by site category")
    .option("--host <name>", "Filter by host")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await checkCloudAdaptersCommand(
          {
            site: opts.site as string | undefined,
            host: opts.host as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("install-cloud-adapter")
    .description("Install a cloud adapter locally after explicit user approval")
    .requiredOption("--id <id>", "Cloud adapter id")
    .option("--target <scope>", "Install target: workspace or global", "workspace")
    .option("--yes", "Skip confirmation prompt", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await installCloudAdapterCommand(
          {
            id: opts.id as string,
            target: (opts.target as "workspace" | "global" | undefined) ?? "workspace",
            yes: Boolean(opts.yes),
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("promote-autogen-adapter")
    .description("Promote an autogen adapter into workspace or global adapters")
    .requiredOption("--adapter <path>", "Path to the autogen adapter JSON file")
    .option("--target <scope>", "Promotion target: workspace or global", "workspace")
    .option("--yes", "Skip confirmation prompt", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await promoteAutogenAdapterCommand(
          {
            adapter: opts.adapter as string,
            target: (opts.target as "workspace" | "global" | undefined) ?? "workspace",
            yes: Boolean(opts.yes),
          },
          defaultRuntime,
        );
      });
    });

  medclaw
    .command("validate-adapter")
    .description(
      "Open a real page and validate whether a MedClaw site adapter extracts the intended fields",
    )
    .requiredOption("--adapter <path>", "Path to the adapter JSON file")
    .requiredOption("--url <url>", "Real page URL to validate against")
    .option("--page-type <type>", "Specific adapter pageType to validate")
    .option("--profile <name>", "Browser profile to use")
    .option("--limit <n>", "Maximum number of sample rows to report", "5")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await validateMedClawAdapterCommand(
          {
            adapter: opts.adapter as string,
            url: opts.url as string,
            pageType: opts.pageType as string | undefined,
            profile: opts.profile as string | undefined,
            limit: Number.parseInt(String(opts.limit ?? "5"), 10),
          },
          defaultRuntime,
        );
      });
    });
}
