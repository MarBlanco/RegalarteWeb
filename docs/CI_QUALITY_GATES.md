# CI · Quality Gates

Continuous Integration runs automatically on every pull request and on pushes to `main`. The repo is public, so all jobs below run on GitHub's free plan.

## Active jobs

| Job | File | Purpose |
|-----|------|---------|
| **CI** | `.github/workflows/ci.yml` | `next lint`, `tsc --noEmit`, `next build` |
| **CodeQL** | `.github/workflows/codeql.yml` | Security vulnerability scanning (TypeScript/JS) |
| **Dependabot** | `.github/dependabot.yml` | Opens PRs for outdated / insecure dependencies |

All three run automatically with no setup required — they pass on every PR.

## Disabled jobs (parked, require repo owner access)

These are committed but renamed to `.disabled` so they **don't run** until the repo owner (MarBlanco) completes the one-time setup. Renaming back re-enables them with no code changes.

| Job | Parked as | What enables it |
|-----|-----------|-----------------|
| **SonarCloud** | `.github/workflows/sonarcloud.yml.disabled` | Repo owner adds the `SONAR_TOKEN` GitHub secret, then renames the file to `sonarcloud.yml` |
| **CodeRabbit** | `.coderabbit.yaml.disabled` | Repo owner installs the CodeRabbit GitHub App from the Marketplace, then renames the file to `.coderabbit.yaml` |

### When the repo owner is ready

**SonarCloud** (code smells, bugs, security hotspots, quality gate):
1. Rename: `git mv .github/workflows/sonarcloud.yml.disabled .github/workflows/sonarcloud.yml`
2. Sign in at [sonarcloud.io](https://sonarcloud.io) with GitHub, add `MarBlanco/RegalarteWeb`.
3. In repo Settings > Secrets and variables > Actions, add **`SONAR_TOKEN`** (from SonarCloud > My Account > Security).
4. Confirm `sonar.organization` / `sonar.projectKey` in `sonar-project.properties`.

**CodeRabbit** (AI PR review — summary + inline comments):
1. Rename: `git mv .coderabbit.yaml.disabled .coderabbit.yaml`
2. Repo owner installs the CodeRabbit GitHub App from the [GitHub Marketplace](https://github.com/marketplace/coderabbitai) (free for public repos) and authorizes it for `MarBlanco/RegalarteWeb`.

## Notes

- Build is wired with dummy env vars (`PAYLOAD_SECRET`, `DATABASE_URI`) so `next build` succeeds in CI without a real database.
- The `build` step has `continue-on-error: true` until a pre-existing prerender bug is fixed: `/auth/reset-password` and `/auth/verify` call `useSearchParams()` without a `<Suspense>` boundary (Next.js 15 requirement). Tracked separately; remove the flag once fixed to make build a strict gate.
- Workflows use `concurrency` to cancel in-flight runs when a new commit is pushed to a PR — saves Actions minutes.
