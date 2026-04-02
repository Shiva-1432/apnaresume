# CI Setup Pending Actions

Use this checklist to finish the GitHub CI rollout.

## 1) Add Required GitHub Actions Secrets

Path: `GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

- [ ] `STAGING_URL`
  - Value: staging frontend URL used by Playwright e2e (for example `https://staging.yourdomain.com`)
- [ ] `NEXT_PUBLIC_API_BASE_URL`
  - Value: staging backend API base URL including `/api` (for example `https://api-staging.yourdomain.com/api`)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Value: Clerk publishable key for staging/test environment (starts with `pk_test_...` unless you intentionally use live)

## 2) Enable Branch Protection (main)

Path: `GitHub repo -> Settings -> Branches -> Add branch protection rule`

- [ ] Branch name pattern: `main`
- [ ] Enable `Require a pull request before merging`
- [ ] Enable `Require status checks to pass before merging`
- [ ] Required checks:
  - [ ] `quality`
  - [ ] `build`
- [ ] (Recommended) Enable `Require branches to be up to date before merging`

## 3) Validate Workflow Behavior

Workflow file: `.github/workflows/ci.yml`

- [ ] Open a PR targeting `main`
- [ ] Confirm PR runs:
  - [ ] `quality`
  - [ ] `build` (after `quality` passes)
- [ ] Confirm PR is blocked if `quality` or `build` fails
- [ ] Push to `main` and confirm `e2e` runs
- [ ] If `e2e` fails, confirm `playwright-report` artifact is uploaded

## 4) Optional Hardening

- [ ] Protect against direct pushes to `main` (team policy)
- [ ] Add required reviewers/code owners if needed
- [ ] Add Slack/Teams notifications for failed CI runs

## Notes

- `quality` and `build` are intentionally scoped to pull requests.
- `e2e` is intentionally scoped to pushes on `main` and uses `PLAYWRIGHT_BASE_URL=${{ secrets.STAGING_URL }}`.
