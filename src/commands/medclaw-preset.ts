import type { OpenClawConfig } from "../config/config.js";

export const MEDCLAW_DEFAULT_WORKSPACE = "~/.medclaw/workspace";
export const MEDCLAW_DEFAULT_SEEKEVIDENCE_URL = "https://seekevidence.medsci.cn";
export const MEDCLAW_DEFAULT_DEEPEVIDENCE_URL = "https://deepevid.medsci.cn";
export const MEDCLAW_LOCAL_REGISTRY_URL = "http://127.0.0.1:4318";

export function buildMedClawPreset(params?: {
  workspace?: string;
  seekEvidenceUrl?: string;
  deepEvidenceUrl?: string;
  adapterRegistryUrl?: string;
  adapterRegistryToken?: string;
}): OpenClawConfig {
  const workspace = params?.workspace?.trim() || MEDCLAW_DEFAULT_WORKSPACE;
  const adapterRegistryUrl = params?.adapterRegistryUrl?.trim() || "";
  const adapterRegistryToken = params?.adapterRegistryToken?.trim() || "";
  return {
    agents: {
      list: [
        {
          id: "medclaw",
          default: true,
          identity: {
            name: "MedClaw",
            theme: "clinical evidence copilot",
            emoji: "🩺",
          },
        },
      ],
      defaults: {
        workspace,
        imageMaxDimensionPx: 960,
      },
    },
    gateway: {
      mode: "local",
    },
    tools: {
      profile: "coding",
    },
    browser: {
      snapshotDefaults: {
        mode: "efficient",
      },
    },
    skills: {
      allowBundled: [
        "med-pubmed-search",
        "med-clinicaltrials-search",
        "med-guideline-review",
        "med-deepevidence-entry",
        "med-seekevidence-entry",
        "nano-pdf",
        "summarize",
      ],
    },
    env: {
      vars: {
        MEDCLAW_SEEKEVIDENCE_URL:
          params?.seekEvidenceUrl?.trim() || MEDCLAW_DEFAULT_SEEKEVIDENCE_URL,
        MEDCLAW_DEEPEVIDENCE_URL:
          params?.deepEvidenceUrl?.trim() || MEDCLAW_DEFAULT_DEEPEVIDENCE_URL,
        ...(adapterRegistryUrl ? { MEDCLAW_ADAPTER_REGISTRY_URL: adapterRegistryUrl } : {}),
        ...(adapterRegistryUrl ? { MEDCLAW_SKILLS_LIBRARY_URL: adapterRegistryUrl } : {}),
        ...(adapterRegistryToken ? { MEDCLAW_ADAPTER_REGISTRY_TOKEN: adapterRegistryToken } : {}),
      },
    },
  };
}
