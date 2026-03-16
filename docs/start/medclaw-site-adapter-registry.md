---
summary: "Design for a shared MedClaw site adapter registry that lets one structured site analysis benefit all future users."
read_when:
  - You are adding support for a new medical website
  - You want shared structured extraction instead of repeated site analysis
  - You are deciding how MedClaw should cache and reuse website understanding
title: "MedClaw Site Adapter Registry"
---

# MedClaw Site Adapter Registry

The MedClaw site adapter registry is the shared layer that turns one-time structured site analysis into reusable extraction rules for all future users.

## Goal

Avoid repeated high-token site understanding on stable medical websites.

Instead of:

- opening a page
- taking a large snapshot
- asking the model to rediscover page structure each time

MedClaw should:

1. identify the site and page type
2. load a matching site adapter
3. extract fields with selectors and compact rules
4. only fall back to broader analysis when the adapter no longer matches

## Core idea

The registry stores **shared structured adapters**, not screenshot coordinates.

An adapter should describe:

- which domain/page it applies to
- how to recognize that page
- which elements define rows or sections
- how to extract fields
- what output columns the agent should produce
- how to paginate or fall back

This is much more stable than OCR caches and much cheaper than repeated full-page reasoning.

## Scope layers

The registry supports three scopes:

- `global`
  - shared for all MedClaw users
  - best for public medical sites like PubMed, guideline sites, journal sites, registry sites
- `workspace`
  - shared inside one project or institution
  - best for team-specific workflows
- `user`
  - local overrides for one user
  - best for personal preferences or temporary fixes

Resolution order should be:

1. `user`
2. `workspace`
3. `global`

Within the same scope, use the highest `priority` adapter that matches.

## Directory layout

Recommended layout:

```text
medclaw/
  site-adapters/
    README.md
    global/
      pubmed/
        search-results.adapter.json
        article-detail.adapter.json
      clinicaltrials/
        search-results.adapter.json
      nice/
        guideline-detail.adapter.json
    workspace/
      <workspace-specific adapters>
    user/
      <personal overrides>
```

## Data model

Each adapter file should describe one site plus one or more page types.

Top-level fields:

- `schemaVersion`
- `id`
- `site`
- `scope`
- `owner`
- `priority`
- `tags`
- `pages`

Each page entry should define:

- `pageType`
- `match`
- `ready`
- `extraction`
- `pagination`
- `notes`

## Matching strategy

Use lightweight, deterministic matching:

- host match
- path prefix or regex
- key query params
- optional title hints

Do not rely on:

- screen coordinates
- page pixel layout
- OCR text positions

## Extraction strategy

For list pages:

- define `rowSelector`
- define per-field selectors within each row
- define a dedupe key such as PMID or NCT ID
- define output columns

For detail pages:

- define field selectors directly on the page
- extract only the stable fields needed by downstream reasoning

Field transforms should stay simple:

- trim
- whitespace collapse
- lowercase/uppercase
- extractYear

## How first-time modeling should work

When MedClaw meets an unsupported site:

1. inspect DOM/accessibility structure
2. identify repeated rows, metadata blocks, buttons, pagination
3. draft a candidate adapter
4. validate it on a few example pages
5. save it into the registry
6. reuse it for all future matching pages

That means the expensive “figure out this site” step is paid once, not on every query.

## Validation flow

An adapter should be considered valid only if:

- it matches the intended page type consistently
- required fields are present on representative pages
- dedupe keys are stable
- output columns are sufficient for MedClaw tables

If validation fails:

- do not publish it to `global`
- keep it in `workspace` or `user`
- fall back to guided browser extraction

## Runtime behavior

Suggested runtime flow:

1. current URL is read from the browser
2. matching adapters are loaded
3. best adapter is selected by scope + priority
4. extractor runs against the page
5. output rows are normalized to fixed columns
6. if extraction is sparse or broken, adapter is marked suspect and MedClaw falls back

## Why this is better than OCR caching

OCR caching is fragile because:

- coordinates move
- visual styling changes
- OCR text is noisy
- it does not express row structure or field meaning

Adapter registry is stronger because it stores:

- semantic structure
- selectors
- field names
- page-type intent

## Relationship to `medclaw_research`

`medclaw_research` should eventually stop hardcoding site-specific DOM logic in tool code.

Longer term:

- `medclaw_research` becomes the execution engine
- the adapter registry becomes the site knowledge layer

That separation makes it much easier to add new medical sites without changing core tool logic each time.
