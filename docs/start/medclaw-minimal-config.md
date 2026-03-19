---
summary: "A minimal MedClaw configuration proposal that hides most OpenClaw complexity behind a small medclaw.config.json surface."
read_when:
  - You want to simplify MedClaw onboarding
  - You want a user-facing config surface smaller than openclaw.json
  - You are designing MedClaw v0.2 productization
title: "MedClaw Minimal Config"
---

# MedClaw Minimal Config

This document proposes a much smaller user-facing configuration surface for MedClaw.

The goal is simple:

- MedClaw users should not need to understand full `openclaw.json`
- most OpenClaw internals should become hidden defaults
- the visible config should match medical workflow needs, not framework internals

## Product decision

MedClaw should use two layers:

1. `medclaw.config.json`
   - user-facing
   - small
   - medical/product oriented
2. generated OpenClaw config
   - internal
   - not the main thing users edit
   - derived from the MedClaw config plus bundled defaults

## What users should configure

For most users, keep only these sections.

### 1. Profile

Only the things that feel like basic product setup:

- `workspace`
- `language`
- `region`

### 2. AI provider

Only the few things users actually care about:

- `provider`
- `model`
- `apiKeyEnv`

Do not expose full provider trees by default.

### 3. Medical products

Only visible switches or URLs for MedClaw-specific products:

- `deepEvidence.enabled`
- `deepEvidence.url`
- `seekEvidence.enabled`
- `seekEvidence.url`

### 4. Retrieval surfaces

Only high-level enable flags:

- `pubmed`
- `clinicalTrials`
- `guidelines`
- `journals`
- `chineseMedicalSites`

These should be booleans or very small option objects.

### 5. Cloud adapter sync

Only one small section:

- `registry.mode`
  - `cloud`
  - `local`
  - `off`
- `registry.url`
- `registry.tokenEnv`
- `registry.autoCheck`

### 6. Privacy / install behavior

Only the decision points users understand:

- `shareAdapters`
- `askBeforeInstall`
- `askBeforeUpload`

## What should be hidden from users

These should stay in generated OpenClaw config, not MedClaw user config:

- `gateway.mode`
- `tools.profile`
- `browser.snapshotDefaults.mode`
- `agents.defaults.imageMaxDimensionPx`
- most `env.vars.*`
- raw `skills.allowBundled`
- raw OpenClaw channel config
- plugin loading details
- internal adapter directories
- fallback snapshot tuning

## Proposed minimal file

Recommended user-facing file:

```json
{
  "profile": {
    "workspace": "~/.medclaw/workspace",
    "language": "zh-CN",
    "region": "CN"
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-5.1",
    "apiKeyEnv": "OPENAI_API_KEY"
  },
  "products": {
    "deepEvidence": {
      "enabled": true,
      "url": "https://deepevid.medsci.cn"
    },
    "seekEvidence": {
      "enabled": true,
      "url": "https://seekevidence.medsci.cn"
    }
  },
  "surfaces": {
    "pubmed": true,
    "clinicalTrials": true,
    "guidelines": true,
    "journals": true,
    "chineseMedicalSites": true
  },
  "registry": {
    "mode": "cloud",
    "url": "https://seekevidence.medon.com.cn/medclaw/",
    "tokenEnv": "MEDCLAW_ADAPTER_REGISTRY_TOKEN",
    "autoCheck": true
  },
  "privacy": {
    "shareAdapters": false,
    "askBeforeInstall": true,
    "askBeforeUpload": true
  }
}
```

Set the token outside the file, for example:

```bash
export MEDCLAW_ADAPTER_REGISTRY_TOKEN=your-registry-token
```

If you use separate client roles, prefer:

```bash
export MEDCLAW_ADAPTER_REGISTRY_READ_TOKEN=your-read-token
export MEDCLAW_ADAPTER_REGISTRY_UPLOAD_TOKEN=your-upload-token
```

## Local development variant

For local development:

```json
{
  "profile": {
    "workspace": "~/.medclaw/workspace"
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-5.1",
    "apiKeyEnv": "OPENAI_API_KEY"
  },
  "products": {
    "deepEvidence": {
      "enabled": true,
      "url": "https://deepevid.medsci.cn"
    },
    "seekEvidence": {
      "enabled": true,
      "url": "https://seekevidence.medsci.cn"
    }
  },
  "surfaces": {
    "pubmed": true,
    "clinicalTrials": true,
    "guidelines": true
  },
  "registry": {
    "mode": "local",
    "url": "http://127.0.0.1:4318",
    "tokenEnv": "MEDCLAW_ADAPTER_REGISTRY_TOKEN",
    "autoCheck": true
  },
  "privacy": {
    "shareAdapters": true,
    "askBeforeInstall": true,
    "askBeforeUpload": true
  }
}
```

## Mapping to internal OpenClaw config

The MedClaw runtime should translate the minimal config into OpenClaw internals.

### Example mappings

- `profile.workspace`
  - `agents.defaults.workspace`
- `ai.provider` and `ai.model`
  - OpenClaw model/provider config
- `products.deepEvidence.url`
  - `env.vars.MEDCLAW_DEEPEVIDENCE_URL`
- `products.seekEvidence.url`
  - `env.vars.MEDCLAW_SEEKEVIDENCE_URL`
- `registry.url`
  - `env.vars.MEDCLAW_ADAPTER_REGISTRY_URL`
- `registry.tokenEnv`
  - used at runtime to resolve bearer token
- `surfaces.*`
  - controls visible skills, UI cards, and default adapters

## UX recommendation

Do not ask users to edit this file first.

Preferred order:

1. installer or onboarding writes `medclaw.config.json`
2. UI exposes simple form controls for common settings
3. advanced users may edit the file manually
4. OpenClaw config remains internal

## Recommended v0.2 scope

For the next MedClaw iteration, the smallest practical step is:

1. introduce `medclaw.config.json`
2. keep generating OpenClaw config internally
3. move registry URL/token, product URLs, and workspace into the MedClaw file
4. stop telling users to copy or edit `openclaw.json`

That alone would remove a large part of the current setup friction.
