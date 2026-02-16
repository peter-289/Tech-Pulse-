# Deployment and CI/CD

## 1) Local container run

1. Copy `backend/.env.example` to `backend/.env` and fill secrets.
2. Start stack:
   - `docker compose up --build`
3. Backend runs migrations automatically on startup (`alembic upgrade head`).

## 2) CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

- Runs on PRs and pushes to `main`/`develop`.
- Backend:
  - installs `backend/requirements.txt`
  - runs `pytest` (no-test collection is treated as success)
- Frontend:
  - installs npm deps
  - runs tests with `--passWithNoTests`
  - runs production build

## 3) CD (GitHub Actions)

Workflow: `.github/workflows/cd.yml`

- On push to `main`: builds and pushes Docker images to GHCR.
- On manual dispatch with `deploy=true`: deploys over SSH using `docker-compose.prod.yml`.

### Required repository secrets for deploy

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH` (directory on server where repo + compose file live)
- `GHCR_USERNAME`
- `GHCR_PAT` (token with package read permission)

## 4) Production topology

- Public traffic hits `reverse-proxy` (Nginx) on ports `80/443`.
- `backend` and `frontend` are private internal services (no public published ports).
- Reverse-proxy routes:
  - `/api/*` -> backend
  - all other paths -> frontend
- TLS is terminated at Nginx using mounted certificate files.

## 5) Server prep for deploy

1. Install Docker + Docker Compose plugin.
2. Clone repo to `$DEPLOY_PATH`.
3. Create `backend/.env` on server (start from `backend/.env.example`).
4. Ensure `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are set in the server environment before compose up.
5. Place TLS files on server:
   - `${DEPLOY_PATH}/infra/nginx/certs/fullchain.pem`
   - `${DEPLOY_PATH}/infra/nginx/certs/privkey.pem`
6. Trigger CD workflow manually with `deploy=true`.

## 6) Healthchecks

- `db`: `pg_isready`
- `backend`: `GET /health`
- `frontend`: local HTTP probe on port `3000`
- `reverse-proxy`: `GET /healthz`

Deployment waits for dependencies to become healthy before routing traffic.
