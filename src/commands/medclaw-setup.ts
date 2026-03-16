import fs from "node:fs/promises";
import path from "node:path";
import { ensureAgentWorkspace } from "../agents/workspace.js";
import {
  type OpenClawConfig,
  createConfigIO,
  migrateLegacyConfig,
  readConfigFileSnapshotForWrite,
  writeConfigFile,
} from "../config/config.js";
import { resolveGatewayPort } from "../config/config.js";
import { formatConfigPath, logConfigUpdated } from "../config/logging.js";
import { resolveSessionTranscriptsDir } from "../config/sessions.js";
import {
  MEDCLAW_MINIMAL_CONFIG_EXAMPLE,
  type MedClawMinimalConfig,
  translateMedClawMinimalConfigToOpenClawConfig,
  validateMedClawMinimalConfig,
} from "../medclaw/minimal-config.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";
import { maybeInstallDaemon } from "./configure.daemon.js";
import { confirm, intro, outro, select } from "./configure.shared.js";
import { dashboardCommand } from "./dashboard.js";
import {
  buildMedClawPreset,
  MEDCLAW_DEFAULT_DEEPEVIDENCE_URL,
  MEDCLAW_DEFAULT_SEEKEVIDENCE_URL,
  MEDCLAW_LOCAL_REGISTRY_URL,
  MEDCLAW_DEFAULT_WORKSPACE,
} from "./medclaw-preset.js";
import { setupCommand } from "./setup.js";

function formatMedClawError(error: unknown, fallback = "MedClaw setup failed.") {
  const message = error instanceof Error ? error.message : String(error);
  if (/enoent/i.test(message)) {
    return `${fallback}\nThe requested file was not found.\nCheck the path and try again.`;
  }
  if (/Unexpected token|JSON/i.test(message) && /medclaw\.config\.json/i.test(message)) {
    return `${fallback}\nmedclaw.config.json is not valid JSON.\nFix the file syntax and run the command again.`;
  }
  if (/Invalid medclaw\.config\.json/i.test(message)) {
    return `${fallback}\n${message}`;
  }
  return `${fallback}\n${message}`;
}

async function readMinimalConfigFile(filePath: string): Promise<MedClawMinimalConfig> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return validateMedClawMinimalConfig(parsed);
}

function mergeMedClawConfig(base: OpenClawConfig, incoming: OpenClawConfig): OpenClawConfig {
  return {
    ...base,
    agents: {
      ...incoming.agents,
      ...base.agents,
      list: base.agents?.list ?? incoming.agents?.list,
      defaults: {
        ...base.agents?.defaults,
        ...incoming.agents?.defaults,
      },
    },
    gateway: {
      ...base.gateway,
      ...incoming.gateway,
    },
    tools: {
      ...base.tools,
      ...incoming.tools,
    },
    browser: {
      ...base.browser,
      ...incoming.browser,
      snapshotDefaults: {
        ...base.browser?.snapshotDefaults,
        ...incoming.browser?.snapshotDefaults,
      },
    },
    skills: {
      ...base.skills,
      ...incoming.skills,
      allowBundled: incoming.skills?.allowBundled ?? base.skills?.allowBundled,
    },
    env: {
      ...base.env,
      ...incoming.env,
      vars: {
        ...base.env?.vars,
        ...incoming.env?.vars,
      },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function applyMinimalLegacyMedClawCleanup(config: OpenClawConfig): OpenClawConfig {
  const next = structuredClone(config);
  if (!isRecord(next)) {
    return config;
  }

  const identity = isRecord((next as Record<string, unknown>).identity)
    ? ((next as Record<string, unknown>).identity as Record<string, unknown>)
    : null;
  if (!identity) {
    return next;
  }

  const agents = isRecord(next.agents) ? { ...next.agents } : {};
  const list = Array.isArray(agents.list) ? [...agents.list] : [];
  let entryIndex = list.findIndex(
    (entry) =>
      isRecord(entry) && (entry.default === true || entry.id === "default" || entry.id === "main"),
  );
  if (entryIndex < 0) {
    entryIndex = list.findIndex((entry) => isRecord(entry));
  }
  if (entryIndex < 0) {
    list.push({ id: "default" });
    entryIndex = list.length - 1;
  }
  const entry = isRecord(list[entryIndex]) ? { ...list[entryIndex] } : { id: "default" };
  if (entry.identity === undefined) {
    entry.identity = identity;
  }
  list[entryIndex] = entry;
  agents.list = list;
  next.agents = agents;
  delete (next as Record<string, unknown>).identity;
  return next;
}

async function loadMedClawConfigForWrite(): Promise<{
  current: OpenClawConfig;
  writeOptions: {
    envSnapshotForRestore?: Record<string, string | undefined>;
    expectedConfigPath?: string;
  };
}> {
  const io = createConfigIO();
  try {
    return {
      current: io.loadConfig(),
      writeOptions: {
        expectedConfigPath: io.configPath,
      },
    };
  } catch {
    const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();
    const migrated = migrateLegacyConfig(snapshot.resolved);
    if (migrated.config) {
      return {
        current: migrated.config,
        writeOptions,
      };
    }
    return {
      current: applyMinimalLegacyMedClawCleanup(snapshot.config),
      writeOptions,
    };
  }
}

async function applyMedClawOpenClawConfig(params: {
  incoming: OpenClawConfig;
  workspace?: string;
  seekEvidenceUrl?: string;
  deepEvidenceUrl?: string;
  adapterRegistryUrl?: string;
  runtime?: RuntimeEnv;
  suffix: string;
}) {
  const runtime = params.runtime ?? defaultRuntime;
  const io = createConfigIO();
  const loaded = await loadMedClawConfigForWrite();
  const next = mergeMedClawConfig(loaded.current, params.incoming);

  await writeConfigFile(next, loaded.writeOptions);
  logConfigUpdated(runtime, { path: io.configPath, suffix: params.suffix });

  const workspace = params.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const seekEvidenceUrl = params.seekEvidenceUrl?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL;
  const deepEvidenceUrl = params.deepEvidenceUrl?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL;
  const adapterRegistryUrl = params.adapterRegistryUrl?.trim() || "";

  const ws = await ensureAgentWorkspace({
    dir: workspace,
    ensureBootstrapFiles: !next.agents?.defaults?.skipBootstrap,
  });
  const guidePath = await writeMedClawWorkspaceGuide({
    workspace: ws.dir,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
  });

  return {
    next,
    guidePath,
    configPath: io.configPath,
    workspace: ws.dir,
  };
}

async function writeMedClawWorkspaceGuide(params: {
  workspace: string;
  seekEvidenceUrl: string;
  deepEvidenceUrl: string;
  adapterRegistryUrl?: string;
}) {
  const guidePath = path.join(params.workspace, "MEDCLAW.md");
  const content = `# MedClaw Workspace

This workspace was initialized with the MedClaw v0.1 preset.

## External entry points

- DeepEvidence: ${params.deepEvidenceUrl}
- SeekEvidence: ${params.seekEvidenceUrl}
${params.adapterRegistryUrl ? `- Adapter registry: ${params.adapterRegistryUrl}\n` : ""}

## Focus areas

- PubMed search
- ClinicalTrials.gov review
- Guideline review
- Evidence-oriented medical skills

## Agent rules

- Prefer \`medclaw_research\` before the generic \`browser\` tool for supported medical routes.
- Supported \`medclaw_research\` sites:
  - \`pubmed\`
  - \`clinicaltrials\`
  - \`guideline\`
- Do not start with a large browser AI snapshot when:
  - the user asks for a PubMed search
  - the user asks for ClinicalTrials.gov lookup
  - the user provides a guideline URL
  - the user mainly wants a compact evidence table
- Use the generic \`browser\` tool only when:
  - the site is unsupported
  - login or manual navigation is required
  - \`medclaw_research\` returns clearly incomplete extraction
- If \`medclaw_research\` is incomplete, prefer a small efficient snapshot or targeted browser step instead of a large page dump.

## Notes

- The browser snapshot mode is tuned toward efficient snapshots.
- This setup intentionally deprioritizes generic desktop software automation.
- Keep extraction separate from interpretation.
- For registry results, do not present trial registration as published efficacy evidence.
`;
  await fs.mkdir(params.workspace, { recursive: true });
  await fs.writeFile(guidePath, content, "utf-8");
  return guidePath;
}

export async function refreshMedClawWorkspaceGuideCommand(
  opts?: {
    workspace?: string;
    seekEvidenceUrl?: string;
    deepEvidenceUrl?: string;
    adapterRegistryUrl?: string;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const workspace = opts?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const seekEvidenceUrl = opts?.seekEvidenceUrl?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL;
  const deepEvidenceUrl = opts?.deepEvidenceUrl?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL;
  const adapterRegistryUrl = opts?.adapterRegistryUrl?.trim() || "";

  const ws = await ensureAgentWorkspace({
    dir: workspace,
    ensureBootstrapFiles: true,
  });
  const guidePath = await writeMedClawWorkspaceGuide({
    workspace: ws.dir,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
  });

  runtime.log(`MedClaw workspace guide refreshed: ${shortenHomePath(guidePath)}`);
  runtime.log(`SeekEvidence entry: ${seekEvidenceUrl}`);
  runtime.log(`DeepEvidence entry: ${deepEvidenceUrl}`);
  if (adapterRegistryUrl) {
    runtime.log(`Adapter registry: ${adapterRegistryUrl}`);
  }
}

export async function medClawSetupCommand(
  opts?: {
    workspace?: string;
    seekEvidenceUrl?: string;
    deepEvidenceUrl?: string;
    adapterRegistryUrl?: string;
    adapterRegistryToken?: string;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const workspace = opts?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const seekEvidenceUrl = opts?.seekEvidenceUrl?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL;
  const deepEvidenceUrl = opts?.deepEvidenceUrl?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL;
  const adapterRegistryUrl = opts?.adapterRegistryUrl?.trim() || "";
  const adapterRegistryToken = opts?.adapterRegistryToken?.trim() || "";

  const preset = buildMedClawPreset({
    workspace,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
    adapterRegistryToken,
  });
  const applied = await applyMedClawOpenClawConfig({
    incoming: preset,
    workspace,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
    runtime,
    suffix: "(applied MedClaw v0.1 preset)",
  });

  await setupCommand({ workspace }, runtime);
  const sessionsDir = resolveSessionTranscriptsDir();
  await fs.mkdir(sessionsDir, { recursive: true });

  runtime.log(`MedClaw preset: ${formatConfigPath(applied.configPath)}`);
  runtime.log(`MedClaw workspace guide: ${shortenHomePath(applied.guidePath)}`);
  runtime.log(`SeekEvidence entry: ${seekEvidenceUrl}`);
  runtime.log(`DeepEvidence entry: ${deepEvidenceUrl}`);
  if (adapterRegistryUrl) {
    runtime.log(`Adapter registry: ${adapterRegistryUrl}`);
  }
}

export async function connectLocalMedClawRegistryCommand(
  opts?: {
    workspace?: string;
    adapterRegistryUrl?: string;
    adapterRegistryToken?: string;
    seekEvidenceUrl?: string;
    deepEvidenceUrl?: string;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const workspace = opts?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const seekEvidenceUrl = opts?.seekEvidenceUrl?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL;
  const deepEvidenceUrl = opts?.deepEvidenceUrl?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL;
  const adapterRegistryUrl = opts?.adapterRegistryUrl?.trim() || MEDCLAW_LOCAL_REGISTRY_URL;
  const adapterRegistryToken = opts?.adapterRegistryToken?.trim() || "medclaw-local-dev-token";

  const preset = buildMedClawPreset({
    workspace,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
    adapterRegistryToken,
  });
  const applied = await applyMedClawOpenClawConfig({
    incoming: preset,
    workspace,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl,
    runtime,
    suffix: "(connected local MedClaw registry)",
  });

  runtime.log(`MedClaw workspace guide: ${shortenHomePath(applied.guidePath)}`);
  runtime.log(`Adapter registry: ${adapterRegistryUrl}`);
  runtime.log("MedClaw client cloud sync commands now point at the local registry.");
}

export async function initMedClawMinimalConfigCommand(
  opts?: {
    path?: string;
    example?: unknown;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const filePath = path.resolve(
    opts?.path?.trim() || path.join(process.cwd(), "medclaw.config.json"),
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    `${JSON.stringify(opts?.example ?? MEDCLAW_MINIMAL_CONFIG_EXAMPLE, null, 2)}\n`,
    "utf8",
  );
  runtime.log(`Created MedClaw minimal config: ${shortenHomePath(filePath)}`);
}

export async function applyMedClawMinimalConfigCommand(
  opts?: {
    path?: string;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const filePath = path.resolve(
    opts?.path?.trim() || path.join(process.cwd(), "medclaw.config.json"),
  );
  try {
    const minimal = await readMinimalConfigFile(filePath);
    const translated = translateMedClawMinimalConfigToOpenClawConfig(minimal, {
      env: process.env,
    });
    const workspace = minimal.profile?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
    const seekEvidenceUrl =
      minimal.products?.seekEvidence?.enabled === false
        ? ""
        : minimal.products?.seekEvidence?.url?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL;
    const deepEvidenceUrl =
      minimal.products?.deepEvidence?.enabled === false
        ? ""
        : minimal.products?.deepEvidence?.url?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL;
    const adapterRegistryUrl =
      minimal.registry?.mode === "off"
        ? ""
        : minimal.registry?.url?.trim() ||
          (minimal.registry?.mode === "local" ? MEDCLAW_LOCAL_REGISTRY_URL : "");

    const applied = await applyMedClawOpenClawConfig({
      incoming: translated,
      workspace,
      seekEvidenceUrl,
      deepEvidenceUrl,
      adapterRegistryUrl,
      runtime,
      suffix: `(applied ${path.basename(filePath)})`,
    });

    runtime.log(`Applied MedClaw minimal config: ${shortenHomePath(filePath)}`);
    runtime.log(`Generated OpenClaw config: ${formatConfigPath(applied.configPath)}`);
    runtime.log(`MedClaw workspace guide: ${shortenHomePath(applied.guidePath)}`);

    return {
      filePath,
      minimal,
      applied,
    };
  } catch (error) {
    throw new Error(formatMedClawError(error, "Could not apply MedClaw minimal config."), {
      cause: error,
    });
  }
}

export async function runMedClawWizardCommand(
  opts: {
    workspace?: string;
    installDaemon?: boolean;
    noOpenDashboard?: boolean;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  intro("MedClaw setup");
  runtime.log("MedClaw is a medical evidence workspace built on top of OpenClaw.");
  runtime.log(
    "This alpha release is for medical and research professionals. It is not a diagnosis system and should be used with human review.",
  );
  const accepted = await confirm({
    message:
      "Continue with MedClaw local setup? This will prepare your workspace and can optionally install the local gateway service.",
    initialValue: true,
  });
  if (!accepted) {
    outro("MedClaw setup cancelled.");
    return;
  }

  const workspace = opts.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  await setupCommand({ workspace }, runtime);

  let shouldInstallDaemon = Boolean(opts.installDaemon);
  if (!opts.installDaemon) {
    shouldInstallDaemon = Boolean(
      await confirm({
        message: "Install the MedClaw background service now?",
        initialValue: true,
      }),
    );
  }

  if (shouldInstallDaemon) {
    const cfg = createConfigIO().loadConfig();
    await maybeInstallDaemon({
      runtime,
      port: resolveGatewayPort(cfg),
    });
  } else {
    runtime.log(
      "Skipping background service install. You can still run MedClaw in the current shell.",
    );
  }

  let shouldOpenDashboard = !opts.noOpenDashboard;
  if (!opts.noOpenDashboard) {
    const action = await select({
      message: "What would you like to do next?",
      options: [
        { value: "open", label: "Open Medical dashboard", hint: "Recommended first step" },
        {
          value: "skip",
          label: "Skip for now",
          hint: "You can open it later with openclaw dashboard",
        },
      ],
      initialValue: "open",
    });
    shouldOpenDashboard = action === "open";
  }
  if (shouldOpenDashboard) {
    await dashboardCommand(runtime);
  }

  outro("MedClaw setup complete.");
}

export async function medClawStartCommand(
  opts: {
    minimalConfigPath?: string;
    workspace?: string;
    installDaemon?: boolean;
    openDashboard?: boolean;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  let workspace = opts.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const minimalConfigPath = opts.minimalConfigPath?.trim();
  if (minimalConfigPath) {
    const applied = await applyMedClawMinimalConfigCommand(
      {
        path: minimalConfigPath,
      },
      runtime,
    );
    workspace = applied.minimal.profile?.workspace?.trim() || workspace;
  }
  await setupCommand({ workspace }, runtime);

  if (opts.installDaemon) {
    const cfg = createConfigIO().loadConfig();
    await maybeInstallDaemon({
      runtime,
      port: resolveGatewayPort(cfg),
    });
  }

  runtime.log("MedClaw local start flow is ready.");
  runtime.log(`Workspace: ${shortenHomePath(workspace)}`);
  if (opts.openDashboard !== false) {
    await dashboardCommand(runtime);
  } else {
    runtime.log("Next: openclaw dashboard");
  }
}
