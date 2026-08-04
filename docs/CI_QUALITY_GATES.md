# CI · Quality Gates

Continuous Integration runs automatically on every pull request and on pushes to `main`. The repo is public, so all jobs below run on GitHub's free plan.

## Jobs

| Job | File | Purpose |
|-----|------|---------|
| **CI** | `.github/workflows/ci.yml` | `next lint`, `tsc --noEmit`, `next build` |
| **SonarCloud** | `.github/workflows/sonarcloud.yml` | Code smells, bugs, security hotspots, quality gate |
| **CodeQL** | `.github/workflows/codeql.yml` | Security vulnerability scanning (TypeScript/JS) |
| **Dependabot** | `.github/dependabot.yml` | Opens PRs for outdated / insecure dependencies |
| **CodeRabbit** | `.coderabbit.yaml` | AI PR review (summary + inline comments) |

## One-time setup (manual)

### 1. CodeRabbit (AI review) — easiest
- Install the **CodeRabbit** GitHub App from the [GitHub Marketplace](https://github.com/marketplace/coderabbitai) (free for public repos).
- Authorize it for `MarBlanco/RegalarteWeb`.
- Done. Every new PR gets a summary + review; the config lives in `.coderabbit.yaml`.

### 2. SonarCloud (code smells + quality gate)
- Sign in at [sonarcloud.io](https://sonarcloud.io) with your GitHub account.
- Add the `MarBlanco/RegalarteWeb` repository.
- In repo Settings > Secrets and variables > Actions, add a secret named **`SONAR_TOKEN`** with the value from SonarCloud > My Account > Security.
- Confirm `sonar.organization` and `sonar.projectKey` in `sonar-project.properties` match what SonarCloud shows on the project's Information page.

### 3. CodeQL + Dependabot
- No manual setup. They run automatically after the first push to `main` that includes the workflow files.

## Notes

- Build is wired with dummy env vars (`PAYLOAD_SECRET`, `DATABASE_URI`) so `next build` succeeds in CI without a real database.
- Workflows use `concurrency` to cancel in-flight runs when a new commit is pushed to a PR — saves Actions minutes.
