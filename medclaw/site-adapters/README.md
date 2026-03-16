# MedClaw Site Adapters

This directory stores shared structured adapters for medical websites.

Purpose:

- recognize known medical sites and page types
- extract compact structured fields
- avoid repeated full-page browser analysis

Scopes:

- `global/` for adapters shared by all users
- `workspace/` for team or project-specific adapters
- `user/` for personal overrides

Resolution order:

1. `user`
2. `workspace`
3. `global`

Within the same scope, prefer the matching adapter with the highest `priority`.

File naming:

- `<page-type>.adapter.json`

Examples:

- `global/pubmed/search-results.adapter.json`
- `global/clinicaltrials/search-results.adapter.json`

Each adapter should follow the schema defined in:

- `/Users/paul/Documents/novel/medclaw/src/medclaw/site-adapter-registry.ts`
