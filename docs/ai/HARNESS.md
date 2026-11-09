# AI Engineering Harness

## Purpose

This document defines the operating system for AI-assisted engineering in Order Platform. The goal is reliable, reviewable delivery—not maximum autonomous activity.

The harness combines repository instructions, task planning, scoped tool access, automated checks, and human approval gates. It does not make an AI agent inherently correct; it makes its work easier to constrain and verify.

## Repository map

| Area | Responsibility |
|---|---|
| `apps/web` | Customer-facing React application |
| `apps/admin` | Admin React application |
| `services/api` | Hono API, Cloudflare Workers, D1 and Drizzle |
| `packages/shared` | Shared contracts and utilities |
| `migrations/` and configured migration directory | Database schema history |
| `README.md` | V1 product scope and acceptance checklist |
| `AGENTS.md` | Mandatory agent behavior and safety rules |

Always verify actual paths and configuration before acting; documentation can lag implementation.

## Operating loop

Use this loop for every non-trivial task:

1. **Orient** — inspect branch, worktree, package scripts, relevant files, migrations, and recent changes.
2. **Specify** — convert the request into observable acceptance criteria and list non-goals.
3. **Plan** — identify affected layers, dependencies, risks, and test strategy.
4. **Implement** — make the smallest coherent change; do not mix unrelated refactors.
5. **Verify** — run focused tests/checks, then broader checks when practical.
6. **Review** — inspect the complete diff and look for security, data, migration, and compatibility risks.
7. **Report** — provide evidence, limitations, and outstanding human decisions.

For a trivial documentation-only change, steps may be abbreviated, but the diff still needs review.

## Task contract

Before implementation, record:

- **Goal:** what user-visible or system behavior should change?
- **Acceptance criteria:** how can success be observed?
- **Scope:** which apps, API routes, tables, migrations, or integrations are involved?
- **Non-goals:** what must not change?
- **Risk level:** low, medium, or high.
- **Verification:** exact commands and scenarios to run.

Do not invent requirements when the request is ambiguous. Ask one focused question if an unresolved decision affects data integrity, security, product behavior, or irreversible operations.

## Risk and approval policy

| Risk | Examples | Agent behavior |
|---|---|---|
| Low | Documentation, isolated UI copy, safe refactor | May implement and run local checks |
| Medium | API behavior, schema additions, auth changes, order lifecycle | Plan first; add tests; report exact effects |
| High | Secrets, production data, remote D1, deployment, destructive operations, payment/notification activation | Stop before action and obtain explicit approval |

Approval for one operation does not imply approval for later operations or a different environment.

## Required verification matrix

Select only checks relevant to the change and report those actually run.

| Change | Minimum verification |
|---|---|
| Shared/package config | Workspace install consistency, relevant lint/build |
| Frontend behavior | Relevant lint/build and focused interaction tests if available |
| API behavior | Route tests or focused requests; auth/ownership negative cases |
| Database schema | Migration inspection, local D1 apply, schema/Drizzle consistency |
| Order lifecycle | Valid and invalid transitions; history and result persistence |
| Authentication/authorization | Missing token, wrong role, cross-user access, authorized access |
| Pricing/payment | Server-calculated price; tampered client values rejected |
| Notifications | Unit/integration tests with provider disabled or mocked; no live sends |

If the repository has no suitable test harness, do not simulate success. Propose the smallest test infrastructure addition as a separate task.

## Definition of done for an agent task

- Acceptance criteria are met or explicitly listed as incomplete.
- No unrelated user changes were overwritten.
- Security and data-access rules are preserved.
- Relevant checks ran and their outcomes are recorded.
- Final diff has been reviewed.
- No secrets, local state, or generated artifacts were introduced.
- Human-only steps and unresolved risks are clearly identified.

## Current known constraints

- This repository uses Cloudflare Workers and D1; local and remote environments must be treated separately.
- Remote D1 changes and deployments require explicit approval.
- External notifications/integrations must not be enabled as a side effect.
- The V1 roadmap is functional-first; visual redesign belongs to V2 unless requested.
- Package scripts and migration paths must be re-checked because they may evolve.
