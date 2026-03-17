# Audit Checklist

Use this checklist during static review.

## Source

- Canonical repo or package found
- License identified
- Maintainer and activity level checked if relevant

## Entry Surface

- `SKILL.md`, `README`, or equivalent read
- Main entrypoint identified
- Package manifest or dependency file inspected

## High-Risk Behaviors

- Destructive git commands
- Shell execution of dynamic commands
- Auto-install of packages or dependencies
- Daemon loops or unattended background execution
- Automatic network reporting, uploads, or telemetry
- Secret or token usage
- Self-modifying code paths
- External service dependencies

## Compatibility

- Host ecosystem identified
- Runtime requirements identified
- Codex compatibility judged
- Migration cost estimated

## Outcome

- Safe for direct install
- Safe only after Codex-native port
- Reject

## Reporting Shape

```text
Host ecosystem:
Primary value:
Key risks:
Compatibility verdict:
Disposition:
Rationale:
```
