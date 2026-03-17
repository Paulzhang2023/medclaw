---
name: skill-intake-auditor
description: Inspect external or newly discovered skills before adoption, especially when Codex needs to determine whether a skill is safe, compatible, worth installing, or better rewritten locally. Use when evaluating third-party skills from GitHub, ClawHub, OpenClaw, or other ecosystems; when performing static safety review; when deciding between direct install, rejection, or Codex-native porting; or when summarizing risks, dependencies, and migration effort.
---

# Skill Intake Auditor

Treat every external skill as untrusted until reviewed. Default to static inspection first, then choose the narrowest safe adoption path.

Load [references/audit-checklist.md](references/audit-checklist.md) for the review checklist. Load [references/decision-matrix.md](references/decision-matrix.md) when deciding whether to install, reject, or port.

## Intake Goals

- Identify what problem the skill solves.
- Determine which ecosystem it targets and whether that matches Codex.
- Detect unsafe execution paths, destructive actions, package installation, network reporting, or hidden automation.
- Decide whether the skill can be installed directly, should be adapted, or should be rejected.

## Standard Workflow

1. Locate the upstream source and confirm the canonical repo or package.
2. Read the top-level metadata and usage instructions.
3. Perform a static safety review before running anything.
4. Identify ecosystem assumptions: runtime, host APIs, agent model, directory layout, background loops, package manager, secrets, network services.
5. Classify the result into one of three paths:
   - direct install
   - Codex-native port
   - reject
6. If porting is chosen, keep only the transferable concepts and discard unsafe or host-specific mechanics.
7. Summarize findings with explicit evidence.

## Safety Rules

- Never execute third-party code before static review unless the user explicitly requests it and the review justifies it.
- Treat self-modifying behavior, destructive git commands, auto-installers, daemon loops, and network reporting as high risk by default.
- Prefer reading `SKILL.md`, `README`, entrypoints, package manifests, and scripts before inspecting deeper modules.
- Assume host-specific skills are incompatible until proven otherwise.

## Compatibility Questions

- Is this a Codex skill, or does it target another host such as OpenClaw?
- Does it rely on a runtime Codex does not provide?
- Does it assume background execution, slash commands, event buses, or custom APIs?
- Does it require secrets, tokens, hub identities, or external services?
- Are the useful parts procedural guidance, or executable behavior?

## Decision Policy

### Direct Install

Choose only if the skill is already designed for Codex or is simple enough to fit Codex without host-specific logic.

### Codex-Native Port

Choose when the upstream skill has valuable ideas but unsafe or incompatible mechanics.

- Preserve the workflow, constraints, and heuristics.
- Remove daemon behavior, hidden side effects, auto-updates, and host-only integrations.
- Rebuild as a small, explicit Codex skill with local validation.

### Reject

Choose when the skill is opaque, unsafe, low-value, or too tightly coupled to another ecosystem to justify the migration cost.

## Evidence Priorities

- Top-level docs and metadata
- Entrypoints such as `index.js`, `main.py`, shell wrappers
- Package manifests and dependency declarations
- Obvious command execution, network calls, and mutation logic
- Persistence, telemetry, and secret handling paths

## Output Preferences

- Present findings first, ordered by severity.
- State the host ecosystem explicitly.
- Give a final disposition: install, port, or reject.
- If porting, list what to keep and what to remove.
- If safe installation is not justified, say so clearly.
