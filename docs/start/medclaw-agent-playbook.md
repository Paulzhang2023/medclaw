---
summary: "Agent playbook for MedClaw research workflows, with tool-selection rules that prioritize medclaw_research over large browser snapshots."
read_when:
  - You are answering medical research questions in MedClaw
  - You need to choose between medclaw_research and the generic browser tool
  - You want to reduce token use on supported medical sites
title: "MedClaw Agent Playbook"
---

# MedClaw Agent Playbook

This playbook tells the agent how to handle fixed medical research workflows while keeping browser token use small.

## Core rule

For supported medical sites, prefer `medclaw_research` first.

Do **not** start with a large generic browser snapshot when:

- the target is PubMed
- the target is ClinicalTrials.gov
- the user provides a guideline URL
- the user mainly wants a compact evidence table or structured extraction

Use the generic `browser` tool only when `medclaw_research` is clearly not enough.

## Supported routes

`medclaw_research` currently supports:

- `pubmed`
- `clinicaltrials`
- `guideline`

## Default decision order

1. Identify whether the user question matches a supported medical route.
2. If yes, call `medclaw_research` with the smallest sufficient parameter set.
3. Use the returned compact table as the main evidence surface.
4. Only if extraction is incomplete, fall back to targeted `browser` steps.
5. Avoid large `snapshot --format ai` calls unless the page structure must be inspected manually.

## Tool selection rules

Choose `medclaw_research` when:

- the user asks for recent PubMed studies, reviews, or evidence summaries
- the user asks for recruiting or completed trials from ClinicalTrials.gov
- the user gives a guideline page URL and wants recommendation extraction
- the user wants a table, shortlist, or structured evidence digest

Choose generic `browser` when:

- the site is outside the supported set
- the target page requires login
- the page requires manual navigation before extraction
- the DOM extraction result is obviously sparse or broken
- the user asks for exploratory browsing rather than structured retrieval

## Fallback rule

If `medclaw_research` returns too few rows or obviously incomplete fields:

1. Keep the same target page open.
2. Use a tight browser step instead of a large page dump.
3. Prefer:
   - a targeted navigation action
   - a small efficient snapshot
   - a narrow selector-based inspection
4. Retry structured reasoning from the smaller result.

Do not immediately switch to screenshot-heavy inspection unless the page is genuinely non-standard.

## Prompt patterns

These user requests should usually trigger `medclaw_research` first:

- `Search PubMed for recent systematic reviews on adjuvant trastuzumab in breast cancer and return a compact evidence table.`
- `Find recruiting ClinicalTrials.gov studies for trastuzumab in breast cancer and summarize the most relevant entries.`
- `Review this NICE guideline page and extract the recommendation sections relevant to first-line treatment.`
- `Give me a shortlist of PubMed papers on hypertension guideline updates since 2022.`
- `Check trial registry coverage for CAR-T studies in diffuse large B-cell lymphoma.`

## Recommended tool calls

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

Guideline:

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

## Response style after extraction

After `medclaw_research` returns:

- lead with the compact table or shortlist
- explicitly state the source type
  - literature search
  - registry search
  - guideline page
- separate extraction from interpretation
- mark uncertainty when only titles, snippets, or registry metadata are available

## Anti-patterns

Avoid these on supported routes:

- opening with a full generic browser transcript
- taking a large AI snapshot before trying `medclaw_research`
- mixing trial registry entries with published evidence as if they are equivalent
- inferring guideline strength when the page does not clearly show it
- using screenshot/OCR behavior for standard PubMed or ClinicalTrials.gov pages
