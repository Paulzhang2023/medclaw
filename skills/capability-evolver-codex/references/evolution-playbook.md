# Evolution Playbook

Use this playbook when running a Codex-native self-improvement loop.

## Inputs

- Recent user corrections
- Failed commands or tests
- Repeated manual edits
- Missing guardrails in an existing skill
- Recurrent ambiguity in prompts or outputs

## Decision Tree

If the issue is a repeated failure:

- Choose `repair`

If the issue is avoidable fragility:

- Choose `harden`

If the workflow is stable and missing a useful recurring capability:

- Choose `innovate`

If none of the above is clearly true:

- Do not evolve yet

## Repair Template

```text
Evidence:
Root cause:
Smallest durable fix:
Artifact form:
Validation:
```

## Harden Template

```text
Fragile behavior:
Risk if unchanged:
Guardrail to add:
Artifact form:
Validation:
```

## Innovate Template

```text
Observed need:
Why current workflow is insufficient:
Smallest useful addition:
Artifact form:
Validation:
```

## Safe Mutation Rules

- Prefer one mutation per iteration.
- Prefer explicit review before broad changes.
- Do not mix unrelated improvements in the same loop.
- Do not add background execution unless the user explicitly requests automation.
- Treat external network reporting as opt-in only.

## Good Outputs

- A new memory note that captures a stable user preference.
- A tightened skill instruction that prevents a common mistake.
- A short reference file that standardizes a repeated analysis workflow.
- A narrow code fix plus a passing validation command.

## Bad Outputs

- A large rewrite triggered by one weak signal.
- A self-modifying loop with no human review.
- Automatic cleanup that could remove user work.
- Broad claims of improvement without a concrete validation path.
