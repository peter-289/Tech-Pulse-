# TODOs & Next Steps — Tech Pulse

This file breaks down recommended tasks to finish and polish the project.

Priority: High
- [ ] Secure admin authentication: ensure admin endpoints use role-based JWT (done) and revoke invalid tokens.
- [ ] Enforce HTTPS & secure cookie flags based on environment (done for login; validate other cookie setters).
- [ ] Harden password reset flow: store hashed tokens with expiry, use constant-time token comparison (done).
- [ ] Add DB migrations using Alembic; create initial migration and integrate with CI.
# [x] Add DB migrations using Alembic; create initial migration and integrate with CI.
- [ ] Replace rate limiter memory store with Redis and configure correct storage URI.

Priority: Medium
- [ ] Add CI pipeline: run tests, lint, and build both backend & frontend on PRs.
- [ ] Add unit tests and integration tests for auth flows, transcribe flows, and admin workflows.
- [ ] Add Dockerfiles and `docker-compose.yml` for local dev with DB, Redis, and MailHog.
- [ ] Add environment variable checks at startup and safer defaults.

Priority: Low
- [ ] Add OpenAPI/Swagger docs, and consider generating a Postman collection.
- [ ] Add email delivery monitoring and re-try logic; extract the email SMTP config into secret storage.
- [ ] Add a simple admin UI for viewing logs, flagged entries, and user management.
- [ ] Add background worker (Celery/RQ) to process transcriptions asynchronously and scale model operations.

Optional Enhancements
- Move transcripts to an object store (S3) and serve via signed URLs.
- Add support for OAuth (Google, GitHub) for user signup/login.

Notes
- Re-run the project and test manually each flow after implementing changes.
