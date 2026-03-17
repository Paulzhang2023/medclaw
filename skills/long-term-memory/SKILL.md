---
name: long-term-memory
description: Capture, maintain, and reuse durable user context across tasks, including stable preferences, recurring constraints, working styles, project conventions, and important background facts. Use when Codex should preserve information for future work, summarize reusable lessons from completed tasks, distinguish long-lived memory from temporary context, or consult existing memory before planning, writing, coding, analysis, or revision.
---

# Long Term Memory

Treat memory as a working asset, not a transcript. Save only information that is likely to improve future task execution.

Load [references/memory-rubric.md](references/memory-rubric.md) when deciding whether something deserves long-term storage or when formatting a memory note.

## Memory Goals

- Preserve stable user preferences that change how future tasks should be done.
- Preserve project-specific conventions that will predictably recur.
- Preserve lessons learned from repeated friction, corrections, and revisions.
- Avoid saving transient facts that are unlikely to matter again.

## Workflow

1. Scan the current conversation or artifact for reusable facts, preferences, constraints, or lessons.
2. Classify each candidate as one of: user preference, workflow rule, project convention, durable background fact, or temporary context.
3. Save only items that are both specific and likely to matter again.
4. Rewrite retained items into short, operational statements another Codex instance could apply quickly.
5. Before using stored memory on a new task, check whether it still fits the current request and avoid forcing stale assumptions.

## What To Store

- Stable user preferences
  Example: preferred language, tone, formatting style, decision style, review strictness, literary taste.
- Recurrent task preferences
  Example: prefers concise summaries, wants code review findings first, likes prose over bullets for simple answers.
- Durable project conventions
  Example: file naming scheme, source-of-truth documents, analysis pipeline, domain assumptions.
- Reusable lessons
  Example: a workflow that repeatedly caused failure and the correction that fixed it.
- Enduring background facts
  Example: user's role, long-running project focus, standing constraints that appear across sessions.

## What Not To Store

- Ephemeral deadlines unless they recur or define a standing cadence.
- Sensitive details with no clear future utility.
- Verbatim conversation history.
- One-off task instructions that are already fully expressed in the current request.
- Guesses about the user's motives or personality.
- Facts that are likely to expire soon unless the expiry is recorded clearly.

## Writing Memory Notes

- Write memory as brief declarative statements.
- Prefer operational phrasing: "User prefers X" or "Project uses Y as source of truth."
- Keep each item atomic. Split compound statements when different parts may age differently.
- Add scope when needed: user-wide, project-wide, or task-family-specific.
- If a fact may expire, label the time boundary explicitly.

## Retrieval Rules

- Consult memory before planning when the task depends on style, tone, workflow, or recurring project context.
- Favor the most stable and most relevant memories first.
- If memory conflicts with the user's current request, obey the current request.
- If a memory item looks stale, mention the uncertainty or ignore it.

## Update Triggers

- The user explicitly says to remember something.
- The user repeats the same correction across tasks.
- A project workflow or preference becomes clearly recurring.
- A completed task reveals a reusable lesson that would change future execution.

## Suggested Note Shape

Use a compact structure like:

```text
Scope: user | project:<name> | task-family:<name>
Type: preference | convention | lesson | background
Statement: <single durable fact>
Why it matters: <one short line>
Confidence: high | medium | low
Review cue: <optional note if this may go stale>
```

## Output Preferences

- When asked to capture memory, return the distilled notes rather than a long explanation.
- When asked to review memory candidates, separate "keep" from "discard" with brief reasons.
- When asked to prepare future context, summarize the few memories that actually affect the next task.
