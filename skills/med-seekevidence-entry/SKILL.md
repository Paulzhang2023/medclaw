---
name: med-seekevidence-entry
description: Entry workflow for opening SeekEvidence from MedClaw and translating a research request into a concise evidence-gathering task.
metadata: { "openclaw": { "emoji": "🔎" } }
---

# Med SeekEvidence Entry

Use this skill when the user wants to continue evidence gathering in SeekEvidence.

## Workflow

1. Distill the research request into a concise retrieval task.
2. Preserve inclusion/exclusion hints and desired output format.
3. Route the user to the SeekEvidence entry point from the MedClaw Medical page.
4. If direct handoff is unavailable, return a compact prompt for manual continuation.

## Output format

- Evidence task statement
- Inclusion criteria
- Exclusion criteria
- Suggested SeekEvidence handoff text

## Guardrails

- Treat SeekEvidence as a separate surface unless a live integration exists.
- Keep the task phrasing retrieval-focused rather than interpretive.
