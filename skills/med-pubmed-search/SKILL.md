---
name: med-pubmed-search
description: Structured workflow for PubMed evidence search, triage, and extraction in MedClaw. Use for literature search, MeSH-aware query refinement, PMID capture, abstract review, and export-ready evidence tables.
metadata: { "openclaw": { "emoji": "🧬", "requires": { "bins": ["node"] } } }
---

# Med PubMed Search

Use this skill when the user needs PubMed-oriented literature retrieval in a repeatable, low-token workflow.

## Objectives

- Prefer structured browser interaction over screenshot-heavy inspection.
- Keep query refinement explicit.
- Return a compact evidence table instead of raw browsing transcripts.
- Prefer the `medclaw_research` tool over the generic `browser` tool when the target is standard PubMed search results.

## Workflow

1. Clarify the research question in PICO-like terms when possible.
2. Build a PubMed query using disease, intervention, comparator, outcome, study type, and date filters.
   When the browser is available, prefer a direct `medclaw_research` call such as:

   ```json
   {
     "site": "pubmed",
     "query": "breast cancer trastuzumab adjuvant overall survival",
     "years": "2020:2025",
     "publicationType": "systematic-review",
     "limit": 5
   }
   ```

   Use the workflow helper when you want a ready-to-run retrieval spec:

   ```bash
   node skills/med-pubmed-search/scripts/pubmed-workflow.mjs \
     --query "breast cancer trastuzumab adjuvant overall survival" \
     --years 2020:2025 \
     --type systematic-review
   ```

   Use the URL helper when you only need a normalized search URL:

   ```bash
   node skills/med-pubmed-search/scripts/pubmed-search-url.mjs --query "breast cancer trastuzumab adjuvant overall survival"
   ```

3. Use efficient browser snapshots or direct page reading to inspect results pages.
4. Extract only the fields needed for reasoning:
   - title
   - PMID
   - journal
   - year
   - authors
   - abstract snippet
   - publication type
5. Summarize findings in a compact Markdown table before broader interpretation.

## Output format

Return:

- Search goal
- Final PubMed query
- Top included studies
- Excluded studies if exclusion materially affected conclusions
- Short evidence summary

## Guardrails

- Do not claim clinical recommendations from titles alone.
- Mark uncertainty when only abstracts are available.
- Separate retrieval from interpretation.
- Fall back to the generic `browser` tool only when PubMed layout changes or a non-standard flow is required.

## Helper script

- `scripts/pubmed-workflow.mjs`
  - Emits a compact workflow spec in Markdown or JSON
  - Supports:
    - `--query`
    - `--years 2020:2025`
    - `--type systematic-review`
    - `--journal`
    - `--sort pub-date`
    - `--json`
- `scripts/pubmed-search-url.mjs`
  - Builds a PubMed URL from a free-text query plus optional filters
  - Supports:
    - `--query`
    - `--years 2020:2025`
    - `--type systematic-review`
    - `--journal`
    - `--sort pub-date`
