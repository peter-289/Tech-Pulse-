# Tech Pulse - Project Documentation

## Project Overview

Tech Pulse is a web application that allows users to register, upload audio files, and obtain transcriptions. It uses a FastAPI backend and a React frontend.

- Backend: FastAPI, SQLAlchemy, SQLite (or configured DB via DATABASE_URL), Whisper model for transcription.
- Frontend: React (Create React App) with a simple client-side router (MainRouter) and forms for login & registration.
- Email: FastAPI-Mail for sending verification/reset emails (local MailHog or dev SMTP by default).
- Authentication: JWT tokens (access and refresh) stored in cookies; admin routes protected via basic auth.
- Logging: Rotating file handler and a `LogManager` which can parse and flag suspicious activity.

---

## Repository Structure (key files)

- backend/
  - main.py - FastAPI app setup, seeding admin user, includes routers
  - config.py - app configuration from environment variables (CORS, rate-limiter, email settings)
  - database/ - SQLAlchemy engine and session setup
  - models/ - DB models (`user_model.py`, `transcription_model.py`)
  - routes/ - API routes: `user_registration.py`, `transcription_route.py`, `admin_routes.py`
  - schemas/ - Pydantic models for request/response schemas
  - services/ - App logic (Whisper model loader, transcription processing, email service)
  - security_utilities/ - Auth & security helpers (jwt, password hashing, validators, log manager)
  - scripts/ - optional scripts: seeders and log permission script
  - logs/ - logs for registration and other features

- frontend/
  - src/ - React app: `MainRouter.js`, `RegistrationPage.js`, etc.
  - public/ - index.html and manifest
  - package.json - dependencies and scripts

---

## How to Run (Development)

1. Backend (Python):

- Create a Python virtual environment and install requirements (not included in repository):

```powershell
python -m venv .env
.\.env\Scripts\Activate
pip install -r backend/requirements.txt  # if available
# If a requirements.txt is not present, install key dependencies manually:
# pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-dotenv fastapi-mail python-jose slowapi redis
```

- Start a local SMTP capture (MailHog) for testing or configure `config.mail_config` with a real SMTP.
- Set environment variables in a `.env` file (e.g., DATABASE_URL, SECRET_KEY, FRONTEND_URL, OPENAI_API_KEY etc.)
- Run the app:

```powershell
cd backend
uvicorn main:app --reload
```

2. Frontend (JS):

```powershell
cd frontend
npm install
npm start
```

---

## Main Features

- User registration with email verification.
- Login with JWT and cookie storage.
- Whisper transcription: file upload, transcription via `model_loader` and `transcription_service`, and download link.
- Admin endpoints for user management and log inspection.
- Rotating log files (registration_audit.log) and a `LogManager` for suspicious activity detection.
- Basic client-side password strength validation and server-side verification.

---

## API Endpoints (high level)

- GET / -> Health check
- POST /users/register -> Register a new user (Form data)
- POST /users/login -> Login
- GET /users/verify?token= -> Email verification
- GET /users/resend-verification -> Resend token
- POST /users/forgot-password -> Request reset
- GET /users/reset-password?token= -> Reset page
- POST /users/reset-password -> Reset password
- POST /transcribe -> Upload audio file and get transcription
- GET /transcription/download/{filename} -> Download transcription text
- GET /transcription/download-link/{filename} -> Get download link for a transcript
- GET /transcriptions/all -> Get all transcriptions
- DELETE /transcriptions/delete -> Admin: Delete old transcriptions
- /admin/* -> Admin endpoints for viewing users and logs (protected by `admin_required`)

---

## Security Notes (current implementation)

- Passwords hashed via bcrypt.
- Email verification via JWT token `create_email_token`.
- JWT-based access tokens and cookie storage.
- Basic HTTP Basic auth for admin endpoints (using ENV username/password) — weak for production.
- Rate limiter configured with slowapi using memory storage (not persistent across restarts).
- Logging captures client_info and stores in rotating log files and flags suspicious patterns.

---

## Known Design / Code Observations

- `main.py` imports and uses `router` twice (from `routes.user_registration` and `routes.transcription_route`) without aliasing; the second import may override the first router and cause only one set of route registrations. This should be fixed.
- DB session `get_db` is sometimes local (in route files) and sometimes imported from `database.database_setup`. Use a consistent `get_db` via Depends across routes.
- Some functions are incomplete / TODOs (e.g., saving password reset tokens to DB or updating tokens). `auth.create_reset_token` has a TODO.
- `seed_admins.py` and `seed_users.py` are empty shells.
- `config.limiter` uses memory storage; production should use Redis.
- Admin authentication is HTTP Basic with credentials in env; consider using role-based JWT or OAuth and stronger auth methods.
- No dependency management for front-end environment variables (e.g., baseURL set to `http://127.0.0.1:8000` in `API_Wrapper.js`), should use `.env` for portable configs.
- Logging and `LogManager` use local syslog addresses that aren't provided; remote shipping may fail silently.
- Model loading uses the `whisper` library and caches the model; for heavy models or GPU environment, consider handling device selection and memory constraints.
- File storage uses `constants.paths` for upload/download directories — consider using cloud storage (S3) for scale and durability.

---

## Suggested Improvements (Prioritized)

### 1. Critical Security Improvements

- Fix the router import collision in `backend/main.py`:
  - Import routers with explicit names (e.g. `user_router`, `transcription_router`) and `app.include_router` for each.

- Secure admin endpoints:
  - Replace `HTTPBasic` with a role-based JWT system or use an `admin_token` with better access policies.
  - Add RBAC and admin logging (who performed what action).

- Secure cookies and CORS for production:
  - `secure=True` for cookies in production, `samesite='Lax'` or `Strict` as appropriate.
  - Ensure `FRONT_END_URL` is validated and CORS is set appropriately.

- Implement token storage for email verification & password resets:
  - Store hashed tokens in DB and validate via `password_reset_token` & expiry fields for reset flow.
  - Invalidate tokens after use.

- Use environment-based configuration for local/production behavior (e.g., dev mail server vs. prod SMTP), and ensure `SECRET_KEY` is set and rotation is planned.

- Use HTTPS and set up a CSP (Content Security Policy) and other headers.

### 2. Stability & Production Readiness

- Use a proper persistent rate limiter (Redis) instead of in-memory limiter.
- Use Alembic for DB migrations and tracking schema changes.
- Add input validation via Pydantic across request handlers (use `Form` -> Pydantic BaseModel validation pipes when possible).
- Enable structured logging across the backend (JSON) and add correlation IDs for tracing.
- Add tests (pytest for backend and react-testing-library for frontend).
- Add CI: tests + lint + build on PRs.

### 3. Observability & Monitoring

- Add health endpoints: readiness/liveness.
- Add Prometheus metrics and optionally Grafana for dashboards.
- Add centralized logging: ELK/EFK, Splunk, or managed logging (Azure Monitor, AWS CloudWatch).
- Monitor model usage, CPU/GPU utilisation for the Whisper model.

### 4. Performance & Scalability

- Move file uploads and transcript storage to S3 or object storage.
- Cache common results and enforce file size/upload limits.
- Consider async background processing for transcriptions (Celery/RQ/Redis) for long-running tasks.
- Support chunked uploads for large files and progress updates on frontend.

### 5. Code Quality & Maintainability

- Add `requirements.txt` for backend, and lock (poetry or pip-tools) for reproducible builds.
- Add `Dockerfile`, `docker-compose.yml` for local development and CI workflows.
- Add a global `logger` utility in `security_utilities` and use it consistently.
- Add `prettier` and `eslint` to frontend, `black` & `flake8`/`ruff` to backend.
- Add `pyproject.toml` or `setup.py` to clarify packaging.
- Add unit & integration tests for endpoints, and mock email/sms gateway for tests.

---

## Recent Implementation

I implemented the following improvements to move the project closer to production readiness:
- Role-based admin authentication using JWTs (`security_utilities.dependencies.admin_required`).
- Hardened password reset flow by generating long secure tokens and storing a SHA-256 hash in the DB (`security_utilities.auth`).
- Email links and reset links now use the `BACKEND_URL` setting (in `config.py`) so they work across environments.
- Improved cookie handling in the login flow: server sets secure, HttpOnly access and refresh cookies when BACKEND_URL uses HTTPS.
- Added a `backend/requirements.txt` file to make the Python dependencies explicit.
- Added an `API_DOCUMENTATION.md` with detailed API endpoints and payload examples.
- Added `Dockerfile`s for backend and frontend and a `docker-compose.yml` skeleton for local dev.
- Updated frontend to use API endpoints under `/api/v1/auth` for login and registration and made the API base URL configurable (`REACT_APP_API_URL`).

- Added a DB-backed `Resource` model and a full CRUD API at `/api/v1/resources` (authenticated GET, admin-only create/update/delete). The frontend now includes `API Docs`, `Knowledge Base`, `Support Center`, and `Product Updates` pages which pull from the server resource endpoints.

---
For next steps, see `TODO.md` which contains a prioritized list of remaining tasks and recommended implementations (migrations, tests, CI, Redis rate limiting, and containerization improvements).

### 6. UX & Frontend Improvements

- Replace `MainRouter` state-based navigation with `react-router` for better app routing & bookmarking.
- Replace the API base URL in `API_Wrapper.js` with `process.env.REACT_APP_API_URL` and use `.env` files for dev/prod.
- Add user-friendly error messages & retry UX for uploads.
- Add accessibility improvements (labels, aria-live regions — some already exist — continue audit).
- Add a dedicated admin UI/dashboard for reading logs and user management instead of the API-only approach.
- Add unit tests and e2e tests (Cypress) for frontend flows.

---

## Short-term Implementation Plan (Next 2–4 weeks)

1. Fix router naming conflict and ensure all routers included correctly.
2. Implement token storage for password reset and email verification: store hashed tokens, expiry; update endpoints to validate & invalidate tokens.
3. Tighten admin authentication: migrate to JWT and permission checks.
4. Add Alembic migration support (backend/alembic) for DB schema migrations and add migration to keep tables consistent between deployments.
4. Add Dockerfile and docker-compose for local development.
5. Add tests: basic coverage for registration, login, transcribe, admin endpoints.

## How to run (Docker - quick start)

Run the following to start the app locally with Docker:

```bash
docker-compose up --build
```

Services:
- backend: FastAPI app on port 8000
- frontend: Static build served on port 3000
- db: PostgreSQL running on 5432 (used if configured)

Note: Update `backend/.env` with connection details for `DATABASE_URL` to point to `postgres` service (or use SQLite default).

---

## Additional Notes & References

- Consider integrating OAuth (Google, GitHub) as an authentication option later.
- For the transcription model, test memory usage on CPU vs GPU; allow fallback or quantized models (tiny or base) to reduce resource usage.
- Replace direct filesystem for logs & transcripts with S3 and a CDN for public access.

---

## Summary

Tech Pulse is a well-structured minimal project that demonstrates user registration, email verification, transcription via Whisper, and admin functionality. With a few structural and security changes, it can be production-ready. The suggested improvements are prioritized by security, stability, and scalability.

For implementation assistance, I can: fix the router import collision, add token storage to DB and implement the password reset flow, add a Docker setup, or create test scaffolding—tell me which tasks you'd like me to implement next.

---

Generated on: November 27, 2025
