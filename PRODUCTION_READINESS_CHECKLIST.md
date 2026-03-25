# ApnaResume Production Readiness Checklist

Use this checklist before each production release.

## 1) Security

- [ ] JWT secret is 32+ characters and not reused across environments.
- [ ] All secrets are stored in a secure secret manager (not committed).
- [ ] CORS origin is locked to production frontend URL.
- [ ] Rate limiting thresholds are validated for real traffic.
- [ ] Helmet headers are enabled and verified.
- [ ] Password reset and email verification flows validated in production-like environment.

## 2) Infrastructure and Runtime

- [ ] MongoDB production instance is reachable and has backups enabled.
- [ ] Database indexes are created and verified.
- [ ] Backend and frontend containers build successfully.
- [ ] Health endpoint returns healthy status in deployment environment.
- [ ] Auto-restart policy is configured for app containers.

## 3) CI/CD and Quality Gates

- [ ] CI pipeline passes (frontend lint/build and backend tests).
- [ ] Pull request protection requires CI checks.
- [ ] Release branch/tag strategy is defined.
- [ ] Repository variable HARDENED_NODE_BUILDER_IMAGE is set to an approved hardened Node builder image.
- [ ] Rollback strategy is documented and tested.

## 4) Observability and Operations

- [ ] Structured logs are collected centrally.
- [ ] Error tracking and alerts are configured.
- [ ] SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN are configured in production.
- [ ] API latency, error rate, and uptime dashboards are available.
- [ ] On-call/incident response owner is assigned.

## 5) Payments and Email

- [ ] Razorpay keys are configured in production.
- [ ] Payment verification flow tested end to end.
- [ ] SendGrid API key and sender identity are configured.
- [ ] Transactional emails (verification/reset/payment) deliver successfully.

## 6) Frontend Delivery

- [ ] NEXT_PUBLIC_API_URL points to production backend URL.
- [ ] SEO metadata and social preview tags are reviewed.
- [ ] Browser smoke test completed (Chrome/Edge/mobile view).

## 7) Compliance and Data Safety

- [ ] Terms/Privacy links are present and current.
- [ ] Data retention policy is defined.
- [ ] User data deletion/export process is documented.

## 8) Final Go-Live Gate

- [ ] Critical user journeys tested end to end:
  - [ ] Sign up and verify email
  - [ ] Login and logout
  - [ ] Resume upload and analysis
  - [ ] Job matching flow
  - [ ] Skill gap analysis
  - [ ] Payment and credit update
- [ ] Final stakeholder sign-off recorded.
