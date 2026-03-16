---
name: med-clinicaltrials-search
description: Structured workflow for ClinicalTrials.gov search, trial screening, and protocol field extraction in MedClaw. Use for study status review, eligibility checks, intervention scanning, and sponsor/date extraction.
metadata: { "openclaw": { "emoji": "🧪", "requires": { "bins": ["node"] } } }
---

# Med ClinicalTrials Search

Use this skill when the user needs trial registry evidence from ClinicalTrials.gov.

## Objectives

- Find relevant registered trials quickly.
- Extract structured trial metadata instead of passing full page text into the model.
- Keep study status and dates explicit.
- Prefer the `medclaw_research` tool over the generic `browser` tool for standard ClinicalTrials.gov searches.

## Workflow

1. Translate the user question into trial search terms.
   When the browser is available, prefer a direct `medclaw_research` call such as:

   ```json
   {
     "site": "clinicaltrials",
     "condition": "breast cancer",
     "term": "trastuzumab",
     "status": "recruiting",
     "limit": 5
   }
   ```

   Use the workflow helper when you want a ready-to-run registry extraction spec:

   ```bash
   node skills/med-clinicaltrials-search/scripts/clinicaltrials-workflow.mjs \
     --condition "breast cancer" \
     --term trastuzumab \
     --status recruiting
   ```

   Use the URL helper when you only need a normalized registry URL:

   ```bash
   node skills/med-clinicaltrials-search/scripts/clinicaltrials-search-url.mjs --condition "breast cancer" --term trastuzumab --status recruiting
   ```

2. Search ClinicalTrials.gov for condition, intervention, sponsor, phase, and status as needed.
3. Capture only the essential fields:
   - NCT ID
   - official title
   - recruitment status
   - phase
   - conditions
   - interventions
   - sponsor
   - locations
   - primary completion date
4. Produce a short list of the most relevant trials.

## Output format

- Search goal
- Search terms used
- Relevant trials table
- Short interpretation of registry coverage and gaps

## Guardrails

- Distinguish registered trials from published evidence.
- Do not infer efficacy from registry entries alone.
- Fall back to the generic `browser` tool only when the registry layout or flow prevents structured extraction.

## Helper script

- `scripts/clinicaltrials-workflow.mjs`
  - Emits a compact workflow spec in Markdown or JSON
  - Supports:
    - `--condition`
    - `--term`
    - `--status`
    - `--phase`
    - `--country`
    - `--json`
- `scripts/clinicaltrials-search-url.mjs`
  - Builds a ClinicalTrials.gov search URL from structured filters
  - Supports:
    - `--condition`
    - `--term`
    - `--status`
    - `--phase`
    - `--country`
