# Upstream Safety Audit

This note summarizes why the upstream OpenClaw `capability-evolver` was not installed directly and which concepts were retained for the Codex version.

## Safe Ideas Retained

- Review runtime friction and repeated failures
- Distill reusable lessons into durable assets
- Separate `repair`, `harden`, and `innovate` modes
- Prefer validation before claiming improvement

## Excluded Behaviors

- Autonomous loop execution via `node index.js --loop`
- Self-modifying daemon behavior
- External hub and GitHub reporting
- Automatic package installation
- Destructive git rollback paths
- OpenClaw-specific `sessions_spawn(...)` executor model

## Static Findings

- `src/ops/self_repair.js` contains `git reset --hard origin/main` behind `EVOLVE_GIT_RESET=true`.
- `src/ops/skills_monitor.js` runs `npm install --production --no-audit --no-fund` for missing dependencies.
- `src/gep/issueReporter.js` can automatically submit GitHub issues using `GITHUB_TOKEN` or related tokens.
- `src/gep/hubReview.js` posts asset reviews to an external A2A hub.
- `index.js` implements daemon-style loop behavior and restart logic through child process spawning.
- `src/gep/solidify.js` executes validation commands from gene assets, even though it applies filtering.

## Migration Rule

For Codex, keep only the review-and-distillation mindset. Replace autonomous execution with explicit, user-visible, narrow-scope improvement loops.
