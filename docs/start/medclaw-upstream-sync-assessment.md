# MedClaw Upstream Sync Assessment

Date: 2026-03-16

## Current Base

- Local MedClaw base version: `2026.3.14`
- Upstream tagged releases currently visible on GitHub: up to `v2026.3.13-1`
- Conclusion: the current MedClaw base is already ahead of the latest upstream tag and includes post-`2026.3.11` hardening and browser/runtime work from upstream `main`.

## Priority Areas Requested

### 1. Gateway / WebSocket / Device Token Security

Status: already present in the current base.

Relevant upstream commits already in local history:

- `5e389d5e7c` `Gateway/ws: clear unbound scopes for shared-token auth (#44306)`
- `7dc447f79f` `fix(gateway): strip unbound scopes for shared-auth connects`
- `4f462facda` `Infra: cap device tokens to approved scopes (#43686)`
- `d8d8dc7421` `Infra: fail closed without device scope baseline`
- `eff0d5a947` `Hardening: tighten preauth WebSocket handshake limits (#44089)`
- `9692dc7668` `fix(security): harden nodes owner-only tool gating`
- `8661c271e9` `Gateway: preserve trusted-proxy browser scopes`

Assessment:

- No additional sync work is needed for this category unless we choose to move to a newer upstream commit after `a47722de7e`.

### 2. Browser Existing-Session / User Profile / Session Selection

Status: already largely present in the current base.

Relevant upstream commits already in local history:

- `593964560b` `feat(browser): add chrome MCP existing-session support`
- `4357cf4e37` `fix: harden browser existing-session flows`
- `eee5d7c6b0` `fix(browser): harden existing-session driver validation and session lifecycle (#45682)`
- `5c40c1c78a` `fix(browser): add browser session selection`
- `b6d1d0d72d` `fix(browser): prefer user profile over chrome relay`
- `173fe3cb54` `feat(browser): add headless existing-session MCP support esp for Linux/Docker/VPS (#45769)`
- `b1d8737017` `browser: drop chrome-relay auto-creation, simplify to user profile only (#46596)`
- `3704293e6f` `browser: drop headless/remote MCP attach modes, simplify existing-session to autoConnect-only (#46628)`

Assessment:

- This category is already in good shape for MedClaw.
- The main remaining work is MedClaw-specific product integration, not upstream sync.

### 3. Compaction / Usage / Tool-call Dedup

Status: already present in the current base.

Relevant upstream commits already in local history:

- `5c5c64b612` `Deduplicate repeated tool call IDs for OpenAI-compatible APIs (#40996)`
- `143e593ab8` `Compaction Runner: wire post-compaction memory sync (#25561)`
- `9cd54ea882` `fix: skip cache-ttl append after compaction to prevent double compaction (#28548)`
- `771066d122` `fix(compaction): use full-session token count for post-compaction sanity check (#28347)`
- `72b6a11a83` `fix: preserve persona and language continuity in compaction summaries (#10456)`
- `3928b4872a` `fix: persist context-engine auto-compaction counts (#42629)`
- `bb06dc7cc9` `fix(agents): restore usage tracking for non-native openai-completions providers`
- `f77a684131` `feat: make compaction timeout configurable via agents.defaults.compaction.timeoutSeconds (#46889)`
- `6a458ef29e` `fix: harden compaction timeout follow-ups`

Assessment:

- No immediate upstream sync is needed here.
- Remaining optimization work should be MedClaw-local, such as:
  - more aggressive structured extraction in `medclaw_research`
  - adapter reuse before large snapshots
  - site-specific response shaping to reduce model context

### 4. Dashboard-v2 Pieces That Help Simplify MedClaw UI

Status: foundational upstream work is already present, but selective MedClaw integration is still useful.

Relevant upstream commits already in local history:

- `c5ea6134d0` `feat(ui): add chat infrastructure modules (slice 1/3 of dashboard-v2) (#41497)`
- `46cb73da37` `feat(ui): utilities, theming, and i18n updates (slice 2/3 of dashboard-v2) (#41500)`
- `f76a3c5225` `feat(ui): dashboard-v2 views refactor (slice 3/3 of dashboard-v2) (#41503)`

Assessment:

- This is the only requested category where more work still makes sense.
- The work is not "sync upstream security fixes"; it is "adopt more of the new UI structure into MedClaw's narrowed medical shell".
- Recommended MedClaw-specific follow-ups:
  - hide more generic OpenClaw navigation/routes
  - add a dedicated registry/skills status panel
  - surface MedClaw product entry points more prominently than generic settings

## Summary

- Security hardening requested by the user: already included.
- Browser existing-session improvements requested by the user: already included.
- Compaction / usage / tool-call dedup improvements requested by the user: already included.
- Dashboard-v2 simplification work: partially included at the framework level; still worth adapting further inside MedClaw UI.

## Recommendation

Do not spend time on a broad upstream sync right now.

Instead, continue with MedClaw-specific product work on top of the current base:

1. Further simplify the MedClaw UI shell.
2. Surface registry, skills library, and medical entry points more clearly.
3. Keep monitoring upstream for new security advisories and browser/runtime changes after `2026.3.14`.
