---
summary: "Medical-focused OpenClaw starter profile with a reduced UI, efficient browser snapshots, and bundled evidence skills."
read_when:
  - You are setting up MedClaw V0.2（β）
  - You want the medical-only starter preset
  - You are trimming OpenClaw to a literature and evidence workflow
title: "MedClaw V0.2（β）"
---

# MedClaw V0.2（β）

MedClaw is an open-source medical edition built on the OpenClaw architecture and released by MedSci (梅斯医学).

It is designed for medical professionals who need a lighter, faster, and lower-token intelligent workspace for medical retrieval, evidence access, clinical entry points, skill usage, and long-term workflow accumulation.

## Scope

MedClaw is better understood as a medical research and evidence-assistance platform:

- Faster access to medical websites
- Lower token use during browser workflows
- Simpler configuration
- Becomes more useful over time and grows into a personal secretary and assistant

## Core capabilities

- Medical workspace entry points
- Built-in access to `PubMed`
- Built-in access to `ClinicalTrials.gov`
- Guideline site entry points
- `DeepEvidence`
- `SeekEvidence`
- Medical retrieval tool: `medclaw_research`
- Support for `global adapter`
- Support for `workspace adapter`
- Support for `autogen adapter`
- `MedClaw Skills Library`
- Cloud-managed skill categories
- Local browse-and-install flow
- Recommended skills support
- Categories such as statistics, bioinformatics, and writing
- Minimal config flow with `medclaw.config.json`
- Automatic translation into internal OpenClaw config
- `openclaw medclaw --wizard` uses the minimal config flow by default

## Architecture traits

- Built on the OpenClaw `gateway / agent / browser` architecture
- Adds a medical-focused product layer on top
- Prioritizes structured webpage understanding to optimize loading speed
- In normal browsing workflows, page handling is much faster than the default generic path

## Product layer

- Medical workspace
- Minimal config
- MedClaw UI shell
- Basic / Advanced settings
- Medical knowledge and execution layer

## Product advantages

- Token usage is reduced substantially
- Browser speed is improved substantially
- Tailored for medical professionals
- Minimal configuration
- Becomes progressively smarter and closer to a long-term personal secretary and assistant

## Recommended config flow

Use the MedClaw helper command:

```bash
openclaw medclaw
```

For the narrowest first-run path:

```bash
openclaw medclaw --wizard
```

For a one-command local launch after dependencies are installed:

```bash
openclaw medclaw start
```

From source, you can also use:

```bash
pnpm medclaw:install-and-start
```

This keeps the legacy preset path available, but for ordinary users the preferred flow is the minimal config file:

```bash
openclaw medclaw init-minimal-config
openclaw medclaw apply-minimal-config
```

To generate or reuse `./medclaw.config.json`, apply it, and then run the narrowed onboarding flow:

```bash
openclaw medclaw --wizard
```

If you want to keep the file somewhere else:

```bash
openclaw medclaw --minimal-config /path/to/medclaw.config.json --wizard
```

Key defaults in the MedClaw config flow:

- `browser.snapshotDefaults.mode: "efficient"` to reduce browser snapshot size
- `agents.defaults.imageMaxDimensionPx: 960` to reduce screenshot payload size
- `skills.allowBundled` narrowed to the initial medical workflow skills
- `env.vars.MEDCLAW_SEEKEVIDENCE_URL` defaulting to `https://seekevidence.medsci.cn`
- `env.vars.MEDCLAW_DEEPEVIDENCE_URL` defaulting to `https://deepevid.medsci.cn`

## Suggested first-run flow

1. Install dependencies and build the project.
2. Create `medclaw.config.json` with `openclaw medclaw init-minimal-config`.
3. Set your preferred model/provider credentials in the minimal config.
4. Apply it with `openclaw medclaw apply-minimal-config`.
5. Open the Control UI and go to the **Medical** tab.
6. Use the starter skills for PubMed, ClinicalTrials.gov, guideline review, DeepEvidence, and SeekEvidence entry.

## Included starter skills

- `med-pubmed-search`
- `med-clinicaltrials-search`
- `med-guideline-review`
- `med-deepevidence-entry`
- `med-seekevidence-entry`

See also: [MedClaw Agent Playbook](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-agent-playbook.md)
See also: [MedClaw Site Adapter Registry](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-site-adapter-registry.md)
Cloud backend has been separated from this repo for deployment. Local path:
`/Users/paul/Documents/novel/medclaw-cloud-backend`
See also: [MedClaw Minimal Config](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-minimal-config.md)
See also: [MedClaw V0.2（β） Release Guide](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-alpha-release.md)
See also: [MedClaw Boundaries and Disclaimer](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-boundaries.md)
See also: [MedClaw Release Page Copy](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-release-page-copy.md)
See also: [MedClaw GitHub Release Guide](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-github-release-guide.md)

## Built-in research tool

MedClaw now includes a dedicated agent tool named `medclaw_research`.

Use it when you want the agent to:

- open a supported medical site in the OpenClaw browser
- extract compact structured fields with DOM-based logic
- return a fixed Markdown table instead of a long free-form snapshot

Supported sites in V0.2（β）:

- `pubmed`
- `clinicaltrials`
- `guideline`

### When to prefer `medclaw_research`

Prefer `medclaw_research` over the generic `browser` tool when:

- the user asks for a PubMed literature search
- the user asks for ClinicalTrials.gov registry lookup
- the user asks for a specific guideline page review
- a compact evidence table is more useful than a raw page transcript

Prefer the generic `browser` tool when:

- the target site is not yet supported
- login, CAPTCHA, or non-standard interaction is required
- you need ad hoc navigation beyond the fixed extraction flow

### Example tool calls

PubMed:

```json
{
  "site": "pubmed",
  "query": "breast cancer trastuzumab adjuvant overall survival",
  "years": "2020:2025",
  "publicationType": "systematic-review",
  "limit": 5
}
```

ClinicalTrials.gov:

```json
{
  "site": "clinicaltrials",
  "condition": "breast cancer",
  "term": "trastuzumab",
  "status": "recruiting",
  "limit": 5
}
```

Guideline page:

```json
{
  "site": "guideline",
  "url": "https://www.nice.org.uk/guidance/ng136",
  "organization": "NICE",
  "topic": "Hypertension in adults",
  "question": "What do the recommendations say about first-line drug therapy?",
  "limit": 5
}
```

### Example agent prompts

- `Search PubMed for recent systematic reviews on adjuvant trastuzumab in breast cancer and return a compact evidence table. Prefer medclaw_research.`
- `Check ClinicalTrials.gov for recruiting trastuzumab trials in breast cancer and summarize the most relevant entries in a fixed table using medclaw_research.`
- `Review this guideline page and extract recommendation summaries with section titles in a compact table. Use medclaw_research instead of a raw browser snapshot unless the page layout breaks extraction.`

## Next iteration targets

- Continue hiding full `openclaw.json` behind the MedClaw minimal config flow
- Site-specific helpers for repeated evidence collection tasks
- More structured outputs for review drafting and clinical evidence synthesis
