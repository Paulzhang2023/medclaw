---
name: med-deepevidence-entry
description: Entry workflow for routing clinical question answering to DeepEvidence while preserving question intent, clinical context, and output expectations.
metadata: { "openclaw": { "emoji": "🩻" } }
---

# Med DeepEvidence Entry

Use this skill when the user wants MedClaw to hand off a clinical question to DeepEvidence.

## Workflow

1. Reframe the user request as a clean clinical question.
2. Preserve the key context:
   - patient population
   - condition
   - intervention/exposure
   - comparator
   - desired output
3. Route the user to the DeepEvidence entry point from the MedClaw Medical page.
4. If the handoff is not available, prepare a compact prompt the user can paste into DeepEvidence manually.

## Output format

- Cleaned question
- Clinical context bullets
- Suggested DeepEvidence handoff text

## Guardrails

- Do not claim DeepEvidence has been queried unless it actually has.
- Keep the handoff prompt concise and clinically precise.
