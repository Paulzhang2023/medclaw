---
summary: "Public alpha release notes and operator checklist for MedClaw."
read_when:
  - You are preparing a public MedClaw alpha release
  - You need the shortest install/start path for testers
title: "MedClaw Alpha Release"
---

# MedClaw Alpha Release

MedClaw is an open-source medical edition built on the [OpenClaw](https://github.com/openclaw/openclaw) architecture and released by MedSci (梅斯医学).

It is designed for medical professionals who need a lighter, faster, and lower-token intelligent workspace for medical retrieval, evidence access, clinical entry points, skill usage, and long-term workflow accumulation.

## Product highlights

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

## Recommended public alpha entry points

For source users:

```bash
pnpm install
pnpm build
openclaw medclaw --wizard
```

For the shortest repeatable local launch:

```bash
pnpm medclaw:install-and-start
```

## What this alpha is for

- PubMed and ClinicalTrials.gov evidence collection
- Guideline page review
- Journal and medical-site extraction through adapters
- DeepEvidence and SeekEvidence entry points

## What this alpha is not for

- Direct clinical diagnosis
- Automatic medical orders or treatment decisions
- Unsupervised patient-facing use
- Broad consumer/general web automation

## Release checklist

- Confirm `medclaw.config.json` is the primary user-facing config path.
- Confirm `openclaw medclaw --wizard` stays on the MedClaw narrow flow.
- Confirm cloud registry moderation is enabled before accepting public adapter uploads.
- Confirm public docs include the MedSci/OpenClaw attribution and medical-use disclaimer.
- Confirm a human review step exists before adapters are promoted to shared use.
