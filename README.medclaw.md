# MedClaw

MedClaw is an open-source medical edition built on the OpenClaw architecture and released by MedSci (梅斯医学).

It is designed for medical professionals who need a lighter, faster, and lower-token intelligent workspace for medical retrieval, evidence access, clinical entry points, skill usage, and long-term workflow accumulation.

## Why MedClaw

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

## Product advantages

- Token usage is reduced substantially
- Browser speed is improved substantially
- Tailored for medical professionals
- Minimal configuration
- Becomes progressively smarter and closer to a long-term personal secretary and assistant

## Quick start

```bash
pnpm install
pnpm build
openclaw medclaw --wizard
```

For repeat local launches:

```bash
openclaw medclaw start
```

For the shortest source-based local path:

```bash
pnpm medclaw:install-and-start
```

## Login and external products

- DeepEvidence: [https://deepevid.medsci.cn](https://deepevid.medsci.cn)
- SeekEvidence: [https://seekevidence.medsci.cn](https://seekevidence.medsci.cn)

MedClaw can send users directly into the DeepEvidence login or registration flow. Real login state is preserved by the browser session, so repeated use is smoother.

## Product boundaries

MedClaw is an evidence and workflow assistant. It is not a diagnosis system and does not replace clinician judgment, institutional policy, or formal evidence review.

Critical outputs must be reviewed by qualified professionals before clinical, regulatory, or publication use.

## Open-source attribution

- Architecture base: OpenClaw
- Medical edition: MedClaw
- Open-source publisher for this edition: MedSci (梅斯医学)

## Current stage

MedClaw is no longer just a concept demonstration. It is now a runnable, extensible, publicly testable alpha-stage medical intelligent workspace.

## One-line summary

MedClaw is an intelligent medical workspace based on the OpenClaw architecture and open-sourced by MedSci (梅斯医学) for medical professionals. It focuses on faster workflows, lower token usage, simpler configuration, and gradual growth into a long-term personal medical assistant.

## Release note

This repository currently contains the MedClaw alpha implementation on top of the OpenClaw codebase. If you are publishing a public release, see:

- [MedClaw Alpha Release Guide](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-alpha-release.md)
- [MedClaw Boundaries](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-boundaries.md)
- [MedClaw GitHub Release Guide](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-github-release-guide.md)
