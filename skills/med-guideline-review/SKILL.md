---
name: med-guideline-review
description: Structured workflow for reviewing guideline websites and extracting recommendation statements, recommendation strength, evidence levels, and publication metadata.
metadata: { "openclaw": { "emoji": "📘", "requires": { "bins": ["node"] } } }
---

# Med Guideline Review

Use this skill when the user asks for guideline-oriented answers from society or institutional guideline sites.

## Objectives

- Extract recommendation statements cleanly.
- Preserve source attribution.
- Avoid mixing guideline text with general commentary.
- Prefer the `medclaw_research` tool over the generic `browser` tool when the user already provides a target guideline URL.

## Workflow

1. Identify the relevant guideline source and version/date.
2. Navigate directly to the recommendation or section of interest.
   When the browser is available, prefer a direct `medclaw_research` call such as:

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

   Use the workflow helper to generate a review spec before browsing:

   ```bash
   node skills/med-guideline-review/scripts/guideline-workflow.mjs \
     --organization NICE \
     --topic "Hypertension in adults" \
     --question "What do the recommendations say about first-line drug therapy?"
   ```

   Use the worksheet helper when you want a fill-in template:

   ```bash
   node skills/med-guideline-review/scripts/guideline-review-template.mjs --organization NICE --topic "Hypertension in adults"
   ```

3. Extract only the structured essentials:
   - organization
   - guideline title
   - publication/update date
   - section title
   - recommendation text summary
   - recommendation strength/evidence grade if present
4. Summarize differences between guideline sources when multiple are reviewed.

## Output format

- Question
- Sources reviewed
- Recommendation summary
- Strength/grade table
- Notes on disagreement or uncertainty

## Guardrails

- Preserve exact source names and dates.
- Note when recommendation strength is absent or unclear.
- Fall back to the generic `browser` tool only when the page needs manual navigation or the extraction result is clearly incomplete.

## Helper script

- `scripts/guideline-workflow.mjs`
  - Emits a compact workflow spec in Markdown or JSON
  - Supports:
    - `--organization`
    - `--topic`
    - `--question`
    - `--url`
    - `--json`
- `scripts/guideline-review-template.mjs`
  - Generates a Markdown review worksheet for a guideline review pass
  - Supports:
    - `--organization`
    - `--topic`
    - `--question`
    - `--url`
