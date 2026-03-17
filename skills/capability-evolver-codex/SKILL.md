---
name: capability-evolver-codex
description: Safely evolve Codex workflows by reviewing recent failures, repeated user corrections, fragile execution patterns, and missing reusable guidance, then converting them into bounded improvements such as new memory notes, revised local skills, tighter checklists, safer defaults, or small validated code changes. Use when the goal is self-improvement, process hardening, repair-oriented iteration, or capability distillation without autonomous background loops, destructive git actions, automatic package installs, or unsupervised network activity.
---

# Capability Evolver Codex

Use this skill to turn repeated friction into safer future behavior. Treat evolution as a supervised review-and-improvement loop, not an autonomous daemon.

Load [references/evolution-playbook.md](references/evolution-playbook.md) for the detailed loop. Load [references/upstream-safety-audit.md](references/upstream-safety-audit.md) when you need the rationale for excluding parts of the upstream OpenClaw skill.

## Core Principle

Evolve by compression, not by unchecked autonomy. Prefer extracting a reusable rule, checklist, memory note, or small skill update over building self-modifying machinery.

## Safe Scope

- Review recent tasks for repeated failure modes, user corrections, missing steps, weak defaults, and recurring requests.
- Distill improvements into one of: memory note, skill update, workflow checklist, prompt rule, template, or tightly scoped code change.
- Prefer improvements that can be validated immediately.
- Keep the blast radius small. One improvement per loop is better than broad speculative rewrites.

## Forbidden Scope

- Do not create autonomous background loops, daemons, or cron-style self-execution unless the user explicitly asks for automation.
- Do not perform destructive git actions such as `git reset --hard`, forced checkout, or implicit rollback of user changes.
- Do not auto-install packages, auto-run remote code, or auto-publish data to external services.
- Do not silently send logs, traces, or environment metadata to GitHub, hubs, or third-party APIs.
- Do not modify your own safety constraints to bypass review.

## Evolution Modes

### Repair

Use when the same bug, failure, or correction repeats.

- Identify the exact failure pattern.
- Find the smallest process or code change that prevents recurrence.
- Add a validation step that would have caught it earlier.

### Harden

Use when the system works but remains fragile.

- Tighten guardrails, preflight checks, assumptions, and fallback logic.
- Clarify scope boundaries and stop conditions.
- Reduce the chance of accidental destructive behavior.

### Innovate

Use only when the current workflow is stable.

- Add one new reusable capability at a time.
- Ground innovation in an observed need, not novelty alone.
- Require a clear expected benefit and a way to verify it.

## Standard Loop

1. Gather evidence from recent work: failed commands, repeated edits, user feedback, or awkward manual repetition.
2. Classify the issue: repair, harden, or innovate.
3. State the root cause in one sentence.
4. Propose the smallest durable improvement.
5. Decide the artifact form: memory note, skill change, reference file, template, or code patch.
6. Apply the change only if it stays within the safe scope.
7. Validate the result with the narrowest useful check.
8. Summarize what changed and why it should reduce future friction.

## Preferred Artifacts

- Memory notes for stable preferences and repeated corrections.
- Skill updates for domain-specific recurring workflows.
- Reference files for non-trivial playbooks that should not bloat the skill body.
- Small scripts only when deterministic repeatability is actually needed.
- Small code patches with explicit validation when the problem is implementation-level.

## Review Questions

- Is this problem recurring enough to deserve durable treatment?
- Can the fix be expressed as a rule instead of a larger system?
- Does the proposed change introduce new autonomy, hidden side effects, or external dependencies?
- Can the result be validated quickly and locally?
- Would a future Codex instance understand and reuse this improvement?

## Output Preferences

- If the user asks for analysis, return findings first, ordered by risk or impact.
- If the user asks for evolution, present: evidence, root cause, proposed improvement, validation plan.
- If the user asks for implementation, apply the smallest safe change directly and verify it.
- If no safe improvement is justified, say so explicitly rather than forcing a mutation.
