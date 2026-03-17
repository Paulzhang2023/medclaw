# Decision Matrix

Use this matrix after the static review.

## Install

Choose `install` when all of the following are true:

- The skill is already built for Codex or is effectively plain guidance.
- It has no meaningful host-specific execution assumptions.
- It has no high-risk side effects beyond what the user explicitly wants.
- Its value is immediate and recurring.

## Port

Choose `port` when all of the following are true:

- The skill solves a real recurring problem.
- The valuable part is the method, checklist, or domain logic.
- Unsafe behavior can be removed without losing the core value.
- Rewriting it as a Codex-native skill is cheaper than repeated ad hoc handling.

## Reject

Choose `reject` when any of the following are true:

- The skill is mostly executable machinery tied to another host.
- The skill hides side effects or cannot be meaningfully audited.
- The risk is high and the reusable value is low.
- The migration cost exceeds the expected benefit.

## Porting Rules

- Keep concepts, not machinery.
- Keep workflows, not daemons.
- Keep heuristics, not opaque automation.
- Keep explicit validation, not self-authorizing behavior.
