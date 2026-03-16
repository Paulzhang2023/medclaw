import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  buildMedClawPreset,
  MEDCLAW_DEFAULT_DEEPEVIDENCE_URL,
  MEDCLAW_DEFAULT_SEEKEVIDENCE_URL,
  MEDCLAW_DEFAULT_WORKSPACE,
  MEDCLAW_LOCAL_REGISTRY_URL,
} from "../commands/medclaw-preset.js";
import type { OpenClawConfig } from "../config/config.js";

const MedClawAiProviderSchema = Type.Union([
  Type.Literal("openai"),
  Type.Literal("anthropic"),
  Type.Literal("google"),
  Type.Literal("openrouter"),
  Type.Literal("ollama"),
]);

const MedClawRegistryModeSchema = Type.Union([
  Type.Literal("cloud"),
  Type.Literal("local"),
  Type.Literal("off"),
]);

export const MedClawMinimalConfigSchema = Type.Object({
  profile: Type.Optional(
    Type.Object({
      workspace: Type.Optional(Type.String()),
      language: Type.Optional(Type.String()),
      region: Type.Optional(Type.String()),
    }),
  ),
  ai: Type.Optional(
    Type.Object({
      provider: Type.Optional(MedClawAiProviderSchema),
      model: Type.Optional(Type.String()),
      apiKeyEnv: Type.Optional(Type.String()),
    }),
  ),
  products: Type.Optional(
    Type.Object({
      deepEvidence: Type.Optional(
        Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          url: Type.Optional(Type.String()),
        }),
      ),
      seekEvidence: Type.Optional(
        Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          url: Type.Optional(Type.String()),
        }),
      ),
    }),
  ),
  surfaces: Type.Optional(
    Type.Object({
      pubmed: Type.Optional(Type.Boolean()),
      clinicalTrials: Type.Optional(Type.Boolean()),
      guidelines: Type.Optional(Type.Boolean()),
      journals: Type.Optional(Type.Boolean()),
      chineseMedicalSites: Type.Optional(Type.Boolean()),
    }),
  ),
  registry: Type.Optional(
    Type.Object({
      mode: Type.Optional(MedClawRegistryModeSchema),
      url: Type.Optional(Type.String()),
      tokenEnv: Type.Optional(Type.String()),
      autoCheck: Type.Optional(Type.Boolean()),
    }),
  ),
  privacy: Type.Optional(
    Type.Object({
      shareAdapters: Type.Optional(Type.Boolean()),
      askBeforeInstall: Type.Optional(Type.Boolean()),
      askBeforeUpload: Type.Optional(Type.Boolean()),
    }),
  ),
});

export type MedClawMinimalConfig = Static<typeof MedClawMinimalConfigSchema>;

export const MEDCLAW_MINIMAL_CONFIG_EXAMPLE: MedClawMinimalConfig = {
  profile: {
    workspace: MEDCLAW_DEFAULT_WORKSPACE,
    language: "zh-CN",
    region: "CN",
  },
  ai: {
    provider: "openai",
    model: "gpt-5.1",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  products: {
    deepEvidence: {
      enabled: true,
      url: MEDCLAW_DEFAULT_DEEPEVIDENCE_URL,
    },
    seekEvidence: {
      enabled: true,
      url: MEDCLAW_DEFAULT_SEEKEVIDENCE_URL,
    },
  },
  surfaces: {
    pubmed: true,
    clinicalTrials: true,
    guidelines: true,
    journals: true,
    chineseMedicalSites: true,
  },
  registry: {
    mode: "cloud",
    url: "https://adapters.medclaw.ai",
    tokenEnv: "MEDCLAW_ADAPTER_REGISTRY_TOKEN",
    autoCheck: true,
  },
  privacy: {
    shareAdapters: false,
    askBeforeInstall: true,
    askBeforeUpload: true,
  },
};

function buildModelRef(config: MedClawMinimalConfig): string | undefined {
  const provider = config.ai?.provider?.trim();
  const model = config.ai?.model?.trim();
  if (!provider || !model) {
    return undefined;
  }
  const providerId = provider === "google" ? "gemini" : provider;
  return `${providerId}/${model}`;
}

function resolveRegistrySettings(config: MedClawMinimalConfig, env: NodeJS.ProcessEnv) {
  const mode = config.registry?.mode ?? "cloud";
  if (mode === "off") {
    return { adapterRegistryUrl: "", adapterRegistryToken: "" };
  }
  const adapterRegistryUrl =
    config.registry?.url?.trim() || (mode === "local" ? MEDCLAW_LOCAL_REGISTRY_URL : "");
  const tokenEnv = config.registry?.tokenEnv?.trim() || "";
  const adapterRegistryToken = tokenEnv ? env[tokenEnv]?.trim() || "" : "";
  return { adapterRegistryUrl, adapterRegistryToken };
}

function resolveBundledSkills(config: MedClawMinimalConfig) {
  const skills = new Set<string>([
    "med-deepevidence-entry",
    "med-seekevidence-entry",
    "nano-pdf",
    "summarize",
  ]);

  if (config.surfaces?.pubmed !== false) {
    skills.add("med-pubmed-search");
  }
  if (config.surfaces?.clinicalTrials !== false) {
    skills.add("med-clinicaltrials-search");
  }
  if (config.surfaces?.guidelines !== false) {
    skills.add("med-guideline-review");
  }

  return [...skills];
}

export function validateMedClawMinimalConfig(raw: unknown): MedClawMinimalConfig {
  if (!Value.Check(MedClawMinimalConfigSchema, raw)) {
    const firstError = [...Value.Errors(MedClawMinimalConfigSchema, raw)][0];
    const path = firstError?.path || "<root>";
    const message = firstError?.message || "invalid MedClaw minimal config";
    throw new Error(`Invalid medclaw.config.json: ${path} ${message}`);
  }
  return raw;
}

export function translateMedClawMinimalConfigToOpenClawConfig(
  config: MedClawMinimalConfig,
  params?: {
    env?: NodeJS.ProcessEnv;
  },
): OpenClawConfig {
  const env = params?.env ?? process.env;
  const workspace = config.profile?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const deepEvidenceEnabled = config.products?.deepEvidence?.enabled !== false;
  const seekEvidenceEnabled = config.products?.seekEvidence?.enabled !== false;
  const deepEvidenceUrl = deepEvidenceEnabled
    ? config.products?.deepEvidence?.url?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL
    : "";
  const seekEvidenceUrl = seekEvidenceEnabled
    ? config.products?.seekEvidence?.url?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL
    : "";
  const registry = resolveRegistrySettings(config, env);
  const bundledSkills = resolveBundledSkills(config);
  const modelRef = buildModelRef(config);

  const next = buildMedClawPreset({
    workspace,
    seekEvidenceUrl,
    deepEvidenceUrl,
    adapterRegistryUrl: registry.adapterRegistryUrl,
    adapterRegistryToken: registry.adapterRegistryToken,
  });

  next.skills = {
    ...next.skills,
    allowBundled: bundledSkills,
  };

  next.env = {
    ...next.env,
    vars: {
      ...next.env?.vars,
      ...(config.profile?.language ? { MEDCLAW_LANGUAGE: config.profile.language } : {}),
      ...(config.profile?.region ? { MEDCLAW_REGION: config.profile.region } : {}),
      ...(config.ai?.apiKeyEnv ? { MEDCLAW_AI_API_KEY_ENV: config.ai.apiKeyEnv } : {}),
      ...(config.registry?.mode ? { MEDCLAW_ADAPTER_REGISTRY_MODE: config.registry.mode } : {}),
      ...(typeof config.registry?.autoCheck === "boolean"
        ? { MEDCLAW_ADAPTER_REGISTRY_AUTOCHECK: String(config.registry.autoCheck) }
        : {}),
      ...(typeof config.privacy?.shareAdapters === "boolean"
        ? { MEDCLAW_SHARE_ADAPTERS: String(config.privacy.shareAdapters) }
        : {}),
      ...(typeof config.privacy?.askBeforeInstall === "boolean"
        ? { MEDCLAW_ASK_BEFORE_INSTALL: String(config.privacy.askBeforeInstall) }
        : {}),
      ...(typeof config.privacy?.askBeforeUpload === "boolean"
        ? { MEDCLAW_ASK_BEFORE_UPLOAD: String(config.privacy.askBeforeUpload) }
        : {}),
    },
  };

  next.agents = {
    ...next.agents,
    defaults: {
      ...next.agents?.defaults,
      ...(modelRef ? { model: { primary: modelRef } } : {}),
    },
  };

  return next;
}
