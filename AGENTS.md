# Repository Agent Instructions

These instructions apply to the entire repository. More-specific `AGENTS.md` files may add constraints for their directories; they must not weaken the security rules below.

## Mission and source of truth

- Build the Order Platform according to the approved V1 functional roadmap in `README.md`.
- Treat the checked-in code, migrations, package manifests, and tests as the source of truth for current behavior. The roadmap describes intended behavior, not proof that a feature exists.
- Before changing code, inspect the relevant implementation, callers, schemas, migrations, and tests. Do not infer unseen behavior.
- Keep changes small, cohesive, and reversible. Do not perform unrelated cleanup.

## Required workflow

1. Inspect `git status`, the current branch, and recent relevant history. Never overwrite or discard pre-existing user changes.
2. Read this file and the relevant project documentation.
3. Trace the complete path affected by the task: frontend, API, database schema/migrations, shared types, and tests as applicable.
4. State a concise plan and identify risks before substantial changes.
5. Implement the smallest complete change. Follow existing patterns unless they are demonstrably unsafe.
6. Add or update tests for behavior changes, including authorization and negative cases where relevant.
7. Run the narrowest relevant checks first, then repository checks where feasible. Report commands and actual outcomes; never claim a check passed unless it ran successfully.
8. Review the final diff for accidental changes, secrets, generated files, migration mistakes, and regressions.
9. Summarize changed files, behavior, checks, known limitations, and any manual follow-up.

## Architecture and stack

- This is a pnpm + Turborepo monorepo with workspaces under `apps/*`, `services/*`, and `packages/*`.
- Frontends: `apps/web` and `apps/admin` (React/Vite).
- API: `services/api` (Hono on Cloudflare Workers, D1, Drizzle ORM).
- Shared code: `packages/shared`.
- Database migrations are maintained in the repository's authoritative migration directory. Inspect Wrangler/Drizzle configuration and existing migration history before generating or applying migrations.
- Preserve the existing runtime and package-manager versions unless the task explicitly requires a change.

## Security invariants

- Treat all client input as untrusted. Validate at the API boundary.
- Enforce authentication and authorization on the server; frontend route guards are not security controls.
- Users may access only their own records. Admin-only operations must verify the admin role server-side.
- Never trust prices, roles, ownership IDs, status transitions, or payment state supplied by the client.
- Never log passwords, tokens, session secrets, or sensitive order details.
- Store passwords using the established password-hashing implementation; never plaintext.
- Keep secrets in environment/Cloudflare secret storage. Never commit real credentials or populate production secrets.
- Treat order details as potentially sensitive. Minimize exposure and verify access checks on every relevant endpoint.
- Do not run destructive database commands, production migrations, deployments, or data resets without explicit human approval.

## Database and migration rules

- Never edit an already-applied migration to change deployed schema history. Add a new forward migration instead.
- Before creating a migration, inspect the current schema, migration journal, and local D1 migration state.
- Do not apply migrations to remote/production D1 unless the user explicitly authorizes that exact operation.
- Prefer local D1 validation. Preserve migration naming and ordering conventions already used by this repository.
- Keep schema changes, migration SQL, and Drizzle definitions consistent.

## Cloudflare safety

- Default to local development and local D1.
- Do not deploy Workers, alter Cloudflare resources, or access remote D1 as part of ordinary implementation or testing.
- If a command could affect a remote environment, stop and ask for approval.
- Notifications and external integrations must remain disabled unless the task explicitly includes enabling and configuring them.

## Code quality

- Match existing formatting, naming, module conventions, and error-handling patterns.
- Avoid adding dependencies unless there is a clear need; explain the trade-off.
- Do not introduce broad abstractions for a one-off change.
- Keep API contracts and frontend consumers aligned.
- Prefer explicit, typed/validated data contracts over loosely shaped objects.
- Do not silently change V1 scope or move V2 UI polish into functional work.

## Testing expectations

- Test the behavior, not only implementation details.
- For authorization-sensitive changes, cover unauthenticated, unauthorized-role, cross-user access, and permitted access cases where applicable.
- For order lifecycle changes, verify allowed and rejected transitions and status-history consistency.
- For pricing changes, verify the server-derived price cannot be overridden by the client.
- If tests cannot run because the repository lacks a harness or required environment, say so and identify the smallest next step. Do not fabricate test results.

## Git and delivery

- Work only on the task branch unless explicitly told otherwise.
- Never force-push, rewrite history, merge, or push directly to the default branch without explicit approval.
- Do not commit unless asked.
- Do not automatically approve or merge pull requests.
- Keep generated build output, local databases, secrets, and dependency directories out of commits.
- A completed task includes a concise evidence-based report and any remaining risks.
