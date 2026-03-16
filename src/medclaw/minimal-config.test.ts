import { describe, expect, it } from "vitest";
import {
  type MedClawMinimalConfig,
  translateMedClawMinimalConfigToOpenClawConfig,
  validateMedClawMinimalConfig,
} from "./minimal-config.js";

describe("validateMedClawMinimalConfig", () => {
  it("accepts the minimal example shape", () => {
    const config = validateMedClawMinimalConfig({
      profile: {
        workspace: "~/.medclaw/workspace",
        language: "zh-CN",
      },
      ai: {
        provider: "openai",
        model: "gpt-5.1",
      },
      registry: {
        mode: "local",
        url: "http://127.0.0.1:4318",
        tokenEnv: "MEDCLAW_ADAPTER_REGISTRY_TOKEN",
      },
    });
    expect(config.ai?.provider).toBe("openai");
  });

  it("rejects invalid registry mode", () => {
    expect(() =>
      validateMedClawMinimalConfig({
        registry: {
          mode: "broken",
        },
      }),
    ).toThrow(/Invalid medclaw\.config\.json/i);
  });
});

describe("translateMedClawMinimalConfigToOpenClawConfig", () => {
  it("maps workspace, model, urls, and local registry token into OpenClaw config", () => {
    const minimal: MedClawMinimalConfig = {
      profile: {
        workspace: "/tmp/medclaw-workspace",
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
          url: "https://deepevid.medsci.cn",
        },
        seekEvidence: {
          enabled: true,
          url: "https://seekevidence.medsci.cn",
        },
      },
      surfaces: {
        pubmed: true,
        clinicalTrials: true,
        guidelines: false,
      },
      registry: {
        mode: "local",
        url: "http://127.0.0.1:4318",
        tokenEnv: "MEDCLAW_ADAPTER_REGISTRY_TOKEN",
        autoCheck: true,
      },
      privacy: {
        shareAdapters: true,
        askBeforeInstall: true,
        askBeforeUpload: false,
      },
    };

    const config = translateMedClawMinimalConfigToOpenClawConfig(minimal, {
      env: {
        ...process.env,
        MEDCLAW_ADAPTER_REGISTRY_TOKEN: "test-token",
      },
    });

    expect(config.agents?.defaults?.workspace).toBe("/tmp/medclaw-workspace");
    expect(config.agents?.defaults?.model).toEqual({ primary: "openai/gpt-5.1" });
    expect(config.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_URL).toBe("http://127.0.0.1:4318");
    expect(config.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_TOKEN).toBe("test-token");
    expect(config.env?.vars?.MEDCLAW_LANGUAGE).toBe("zh-CN");
    expect(config.skills?.allowBundled).toContain("med-pubmed-search");
    expect(config.skills?.allowBundled).toContain("med-clinicaltrials-search");
    expect(config.skills?.allowBundled).not.toContain("med-guideline-review");
  });

  it("supports turning registry off", () => {
    const config = translateMedClawMinimalConfigToOpenClawConfig({
      registry: {
        mode: "off",
      },
    });

    expect(config.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_URL).toBeUndefined();
    expect(config.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_TOKEN).toBeUndefined();
  });
});
