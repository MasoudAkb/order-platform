# Codex / AI Agent Workflow

Use this workflow when assigning work to Codex, Claude Code, or another repository-aware coding agent.

## Recommended task prompt

Copy and adapt:

```text
Read AGENTS.md and docs/ai/HARNESS.md before changing anything.

Task:
[Describe one outcome.]

Acceptance criteria:
- [Observable criterion]
- [Observable criterion]

Constraints:
- Preserve unrelated work and existing behavior.
- Do not deploy, use remote D1, change secrets, or enable external integrations.
- Inspect relevant code, callers, schema/migrations, and tests before editing.
- Add/update tests for changed behavior.
- Run relevant checks and report exact commands and results.
- Review the full diff before finishing.
- Do not commit or merge unless explicitly requested.

First inspect the repository and return a short plan. Then implement if the scope is sufficiently clear. Ask before proceeding if a security, data-integrity, or irreversible decision is unresolved.
```

## Suggested task sequence

1. **Reconnaissance:** map the current implementation against the V1 roadmap. Produce an evidence-based gap report; do not modify code.
2. **Test foundation:** identify the smallest useful test setup for API, frontend, and D1. Propose before adding dependencies.
3. **Security baseline:** audit auth middleware, role checks, record ownership, password handling, validation, and sensitive-data exposure.
4. **Critical workflows:** complete one vertical slice at a time (API + database + frontend + tests).
5. **Operational readiness:** verify local setup, migrations, build/lint, environment configuration, and deployment checklist.
6. **V1 acceptance:** execute the README checklist and report each item as pass, fail, blocked, or not verified.

## Review-agent prompt

Use a separate agent or fresh context for review when available:

```text
Review the proposed diff as a skeptical senior engineer.
Do not edit files.

Prioritize:
1. Security vulnerabilities and authorization bypasses.
2. Data loss, migration correctness, and transaction consistency.
3. Broken API contracts and frontend regressions.
4. Missing negative tests and edge cases.
5. Operational/deployment risks.

For every finding, provide severity, file/line, concrete failure scenario, and a minimal fix.
Do not report style preferences as bugs. If no issue is found, state what was reviewed and what was not verified.
```

## Human release checklist

- [ ] Review diff and test evidence.
- [ ] Confirm migration plan and target environment.
- [ ] Confirm secrets/configuration are present in the intended environment.
- [ ] Confirm external integrations are intentionally enabled.
- [ ] Approve deployment separately.
- [ ] Verify production behavior after deployment.
