# Tech Pulse — Production & Developer Setup Notes

## Overview
This document outlines steps to run Tech_Pulse in local development and a production-like environment, and documents changes made to add DB-backed Resources and associated pages.

## Key Changes
- Added `Resource` DB model and CRUD endpoints under `/api/v1/resources` (authenticated GET; admin-only POST/PUT/DELETE).
- Frontend: Added organizational pages and navigation: API Docs, Knowledge Base, Support Center, Product Updates, and a resource details page.
- Admin UI: resource management (create/delete) in the Admin Dashboard.
- Added PowerShell scripts (`backend/scripts`) to simplify local setup and running.
 - Authentication: Added a secure password reset (forgot password) flow with DB-stored hashed reset tokens (SHA-256) and Jinja2 templates for the reset UI. The flow:
	 - Users can click "Forgot password" on the sign-in page and submit their email to receive a time-limited reset link.
	 - The backend stores only a hashed reset token in the DB and sends a plaintext token via email for security.
	 - The reset link points to `GET /api/v1/auth/password-reset/{token}` served by server-side templates where the user may set a new password.
	 - On success, the password is updated and the reset token cleared in the database.

## Backend: Developer setup (Windows PowerShell)

- From the repo root, run:

```powershell
cd backend
./scripts/setup_env.ps1
.\venv\Scripts\Activate.ps1
./scripts/run_backend.ps1
```

- If you prefer manual steps:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend: Developer setup

```powershell
cd frontend
npm install
npm start
```

## Docker
- Build & run via docker-compose (recommended for staging/prod):

```bash
docker-compose up --build
```

## Schema & Migrations
- A `Resource` model was added; migration included in the Alembic initial migration. If you prefer to use Alembic migrations, run:

```bash
cd backend
alembic upgrade head

## Redis & Worker
- Start Redis using Docker (recommended):

```bash
docker run -p 6379:6379 redis:6 --save 60 1 --loglevel warning
```

- Start the RQ worker to process transcription jobs locally:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python worker.py
```

## Password Reset: Test & troubleshooting
- The password reset flow relies on email delivery (SMTP). For local testing, configure a test SMTP server (e.g., MailHog) or use the `FASTAPI_MAIL` config with your mail provider in `backend/config.py`.
- Steps to test locally:
	1. Start the backend (see instructions above). Ensure the environment variable contains your mail config (or run a local SMTP capture tool).
	2. On the login page, click "Forgot password", submit your email and then retrieve the reset email from your mail sink.
	3. Open the link to `GET /api/v1/auth/password-reset/<token>` and submit a new secure password.
	4. Confirm login with the new password.

## Recommendations (next steps to improve production readiness)
- Add E2E tests covering the full reset flow, job queue processing, and admin resource management.
- Add a job history and retry mechanisms for failed transcriptions and admin-facing requeue/cancel actions.
- Add automated email rate-limiting or alerts for suspicious activity.
- Move object storage to S3 or object store for production artifacts (transcripts). Use pre-signed URLs for downloads.
- Harden authentication lifecycle: rotation for refresh tokens and revocation flows.

## Resources API
- List resources (logged-in users):
	- GET /api/v1/resources?type=<api|knowledge|support|updates>

- Get resource details (logged-in users):
	- GET /api/v1/resources/{slug}

- Admin (create/update/delete resources):
	- POST /api/v1/resources  (admin)
	- PUT /api/v1/resources/{slug}  (admin)
	- DELETE /api/v1/resources/{slug}  (admin)

These use the standard `api/v1` versioning conventions and are protected by JWT via cookies or Authorization header. The frontend Admin page provides CRUD UI for creating and removing resources.
```

## Production Checklist (recommended)
1. Ensure `DATABASE_URL` is set to a managed DB (Postgres) and secrets (SECRET_KEY) are secure.
2. Use Redis for rate limiting and RQ as the job queue; replace `slowapi` in-memory storage with Redis-backed storage.
3. Use HTTPS & set cookies `secure` flag.
4. Move file storage (uploads & transcripts) to S3 or similar object store with lifecycle rules.
5. Add centralized logs and monitoring (ELK or managed logging).
6. Add CI/CD: Tests, Linting, and deployment pipelines.

## What to test (quick list)
- Register & verify email, login as user and as admin.
- Upload file, verify job enqueued, processed, and download works.
- Admin: manage users, resources, logs, and jobs.
## Run tests (local)
Backend unit tests (simple smoke test):

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q
```

Frontend tests and build:

```powershell
cd frontend
npm ci
npm test --silent -- --watchAll=false
npm run build
```

## Additional Notes
- If `uvicorn` is not found in your environment, ensure `pip install -r requirements.txt` or use the provided `setup_env.ps1` to create a correct venv environment.

---


