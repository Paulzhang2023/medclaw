# MedClaw Skills Package Spec

This document is the backend entry guide for publishing a cloud skill into the MedClaw Skills Library.

## Required fields

- `id`
  - Stable unique id, for example `medclaw.stats.demo`
- `slug`
  - Human-readable package slug, for example `medclaw-stats-demo`
- `name`
  - Display name shown in the MedClaw UI
- `version`
  - Version string, for example `0.1.0`
- `category`
  - One of:
    - `clinical`
    - `literature`
    - `statistics`
    - `bioinformatics`
    - `writing`
    - `productivity`
    - `other`
- `summary`
  - Short one-sentence summary shown on the card
- `packageUrl`
  - Download URL for the packaged skill archive
- `archiveKind`
  - `zip`, `tar.gz`, or `tar.bz2`

## Optional fields

- `description`
  - Longer detail text
- `featured`
  - `true` means show in the Recommended Medical Skills section
- `tags`
  - Short searchable tags
- `homepageUrl`
  - Product or documentation page
- `sourceUrl`
  - Source repository or reference page
- `checksumSha256`
  - Strongly recommended for package integrity

## Package requirements

The archive behind `packageUrl` must:

- contain a valid `SKILL.md`
- extract cleanly inside a controlled directory
- pass MedClaw local code-safety scanning

If the archive does not contain a valid `SKILL.md`, MedClaw will reject installation.

## Recommended category usage

- `clinical`
  - clinical review, decision support, evidence synthesis
- `literature`
  - PubMed, guideline review, citation triage
- `statistics`
  - table analysis, regression, meta-analysis support
- `bioinformatics`
  - omics, sequencing, pathway, spatial analysis
- `writing`
  - review writing, paper drafting, medical editing
- `productivity`
  - notes, task flow, reference management helpers

## Publishing flow

1. Prepare a packaged skill archive.
2. Generate a JSON payload using the admin CLI template helper, or fill one manually.
3. Submit through:
   - `POST /v1/admin/skills`
   - or `node scripts/admin-cli.js skills-upsert --file <json>`
   - or `node scripts/admin-cli.js skills-upsert --interactive`
4. If needed, hide the skill later:
   - `POST /v1/admin/skills/:id/hide`

## Template generator

Use the backend helper to generate a starter JSON:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-template \
  --name "MedClaw Table Analysis" \
  --category statistics \
  --package-url "https://example.com/packages/medclaw-table-analysis-0.1.0.zip"
```

Write directly to a file:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-template \
  --name "MedClaw Table Analysis" \
  --category statistics \
  --package-url "https://example.com/packages/medclaw-table-analysis-0.1.0.zip" \
  --featured true \
  --tags "statistics,medical-research,tables" \
  --out /tmp/medclaw-table-analysis.json
```

Use interactive mode:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-template --interactive --out /tmp/medclaw-skill.json
```

Directly generate and submit in one step:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-upsert --interactive
```

Generate multiple skill templates from CSV:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-template \
  --csv /tmp/medclaw-skills.csv \
  --out /tmp/medclaw-skills.json
```

Supported options:

- `--name`
- `--category`
- `--package-url`
- `--version`
- `--summary`
- `--description`
- `--featured true|false`
- `--tags "tag1,tag2"`
- `--homepage-url`
- `--source-url`
- `--archive-kind`
- `--checksum-sha256`
- `--out`

## Batch import

Import multiple skills from a JSON array file:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-upsert --file /tmp/skills-batch.json
```

Import multiple skills from NDJSON:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-upsert --file /tmp/skills-batch.ndjson
```

Import every `.json` file under a directory:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-upsert --dir /tmp/medclaw-skills
```

Import directly from CSV in one step:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-upsert --csv /tmp/medclaw-skills.csv
```

Continue even if one entry fails:

```bash
cd /Users/paul/Documents/novel/medclaw/services/medclaw-adapter-registry
node scripts/admin-cli.js skills-batch-upsert --dir /tmp/medclaw-skills --continue-on-error true
```

## CSV format

Recommended CSV headers:

- `name`
- `category`
- `packageUrl`
- `version`
- `summary`
- `description`
- `featured`
- `tags`
- `homepageUrl`
- `sourceUrl`
- `archiveKind`
- `checksumSha256`

`tags` should be comma-separated inside the cell.

`featured` accepts `true` or `false`.

## JSON example

See:
[medclaw-skills-package-spec.example.json](/Users/paul/Documents/novel/medclaw/docs/start/medclaw-skills-package-spec.example.json)
