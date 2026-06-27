# Open-Source Backend and Agent Recommendations

This note complements
[`mawmawmaw/venezuela-ayuda#33`](https://github.com/mawmawmaw/venezuela-ayuda/pull/33).
PR #33 owns the contributor collaboration layer: `CONTRIBUTING.md`,
`SECURITY.md`, CODEOWNERS, issue templates, labels, PR template, branch
protection, migration coordination, and governance.

This PR should stay narrower: backend/agent operating guidance and architecture
notes for agents that work in the repo after the collaboration layer lands.

## Recommended Contributor Flow

Use the contributor flow from PR #33 as canonical. In short:

```bash
gh repo fork mawmawmaw/venezuela-ayuda --clone=true
cd venezuela-ayuda
git remote add upstream https://github.com/mawmawmaw/venezuela-ayuda.git
git fetch upstream
git switch -c docs/my-change upstream/staging
git push -u origin docs/my-change
gh pr create --repo mawmawmaw/venezuela-ayuda --base staging --head <tu-usuario>:docs/my-change
```

Review the staged app at <https://venezuela-ayuda-staging.vercel.app/>. The
production branch is `main`; do not target it directly for normal work.

If a PR was opened against `main` by mistake, rebase the feature branch onto
`upstream/staging` before changing the PR base. That keeps GitHub from showing
unrelated commits that exist on `main` but have not reached `staging`.

Before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

If validation needs private credentials, contributors should say what was blocked
and provide the commands they did run.

## Recommended Maintainer Settings

PR #33 already proposes the full branch-protection model. Keep these backend
checks aligned with that model:

- Protect `main`.
- Protect `staging` if it maps to a real staging database.
- Require pull requests before merging.
- Require at least one approving review for code, API, migrations, auth, privacy,
  or admin changes.
- Require status checks for lint, tests, build, and migration checks once CI is
  fully wired.
- Disable direct pushes to `main` except for repository admins during incident
  response.
- Keep secret scanning and push protection enabled.
- Add branch rules that require conversation resolution before merge.

## PR Review Labels

Suggested labels:

- `area:api`
- `area:admin`
- `area:docs`
- `area:migrations`
- `area:privacy`
- `area:frontend`
- `needs:security-review`
- `needs:data-review`
- `good first issue`

## Required Before Calling the Repo Fully Open Source

- Add an explicit `LICENSE` file. This is a maintainer/legal choice; common
  options are MIT or Apache-2.0, but the maintainers should decide.
- Land or intentionally replace the collaboration docs from PR #33.
- Document who can issue partner API keys and how key revocation is handled.
- Make sure production secrets are rotated if any were ever exposed during early
  development.
- Confirm that backups, Supabase temp files, and local exports are ignored and
  absent from history.

## Suggested PR Categories

- Documentation-only: one reviewer, no credentials required.
- UI copy or translation: one reviewer, screenshots with fake data when useful.
- API contract: backend reviewer plus OpenAPI update.
- Migration: backend reviewer plus migration check.
- Privacy/security: security reviewer, no public sensitive details.

## Current Backend Positioning

Venezuela Ayuda should be treated as the main backend hub for partner data
exchange:

- partner writes go to `/api/v1/reports`,
- public reads come from `/api/v1/reports` and redacted views,
- audit history stays append-only,
- source attribution is preserved from partner auth,
- deduplication and cleanup stay review-oriented.
