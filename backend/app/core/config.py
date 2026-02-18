import os
from pathlib import Path
from urllib.parse import urlparse
from fastapi_mail import ConnectionConfig


try:
   from dotenv import load_dotenv

   # Load .env from project root and backend root if present.
   project_root = Path(__file__).resolve().parents[3]
   backend_root = Path(__file__).resolve().parents[2]
   load_dotenv(project_root / ".env")
   load_dotenv(backend_root / ".env")
except Exception:
   pass


def _normalize_smtp_host(value: str) -> str:
   host = (value or "").strip()
   if not host:
      return host
   parsed = urlparse(host)
   if parsed.scheme:
      return parsed.hostname or host
   return host

# Load variables
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY =   os.getenv("SECRET_KEY")
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_DIR = os.getenv("LOG_DIR", str(Path(__file__).resolve().parents[2] / "logs"))
LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", str(Path(LOG_DIR) / "app.log"))
LOG_MAX_BYTES = int(os.getenv("LOG_MAX_BYTES", str(10 * 1024 * 1024)))
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))
AUDIT_ENABLED = os.getenv("AUDIT_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
ALERT_LOGIN_FAILURE_THRESHOLD = int(os.getenv("ALERT_LOGIN_FAILURE_THRESHOLD", "5"))
ALERT_ACCESS_DENIED_THRESHOLD = int(os.getenv("ALERT_ACCESS_DENIED_THRESHOLD", "10"))
ALERT_LOOKBACK_MINUTES = int(os.getenv("ALERT_LOOKBACK_MINUTES", "15"))
ALERT_DEDUP_MINUTES = int(os.getenv("ALERT_DEDUP_MINUTES", "15"))


# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


# Email
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@techpulse.local")
EMAIL_SUBJECT = os.getenv("EMAIL_SUBJECT", "Welcome to Tech Pulse")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"}
SMTP_HOST = _normalize_smtp_host(SMTP_HOST)
BASE_URL = os.getenv("BASE_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", BASE_URL) or "http://127.0.0.1:8000"

UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", str(Path(__file__).resolve().parents[2] / "storage"))
PACKAGE_STORAGE_BACKEND = os.getenv("PACKAGE_STORAGE_BACKEND", "local")
PACKAGE_UPLOAD_MAX_SIZE_BYTES = int(os.getenv("PACKAGE_UPLOAD_MAX_SIZE_BYTES", str(5 * 1024 * 1024 * 1024)))
PACKAGE_UPLOAD_CHUNK_SIZE_BYTES = int(os.getenv("PACKAGE_UPLOAD_CHUNK_SIZE_BYTES", str(1024 * 1024)))
PACKAGE_USER_QUOTA_BYTES = int(os.getenv("PACKAGE_USER_QUOTA_BYTES", str(25 * 1024 * 1024 * 1024)))


# Authentication
ALGORITHM = os.getenv("ALGORITHM", "HS256")
LOGIN_TOKEN_EXPIRE_MINUTES = int(os.getenv("LOGIN_TOKEN_EXPIRE_MINUTES", "30"))
EMAIL_TOKEN_EXPIRE_MINUTES = int(os.getenv("EMAIL_TOKEN_EXPIRE_MINUTES", "60"))
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))
EMAIL_VERIFY_SECRET = os.getenv("EMAIL_VERIFY_SECRET", "")
PASSWORD_RESET_SECRET = os.getenv("PASSWORD_RESET_SECRET", EMAIL_VERIFY_SECRET or SECRET_KEY or "")
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))

# AI integrations
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "whisper-1")
SUPPORT_CHAT_MODEL = os.getenv("SUPPORT_CHAT_MODEL", "gpt-4o-mini")
TRANSCRIPTION_BASE_URL = os.getenv("TRANSCRIPTION_BASE_URL")

# Startup superuser seeding
SUPERUSER_SEED_ENABLED = os.getenv("SUPERUSER_SEED_ENABLED", "true").lower() in {
   "1", "true", "yes", "on"
}
SUPERUSER_FULL_NAME = os.getenv("SUPERUSER_FULL_NAME")
SUPERUSER_USERNAME = os.getenv("SUPERUSER_USERNAME")
SUPERUSER_EMAIL = os.getenv("SUPERUSER_EMAIL")
SUPERUSER_PASSWORD = os.getenv("SUPERUSER_PASSWORD")
SUPERUSER_UPDATE_PASSWORD_ON_STARTUP = os.getenv(
   "SUPERUSER_UPDATE_PASSWORD_ON_STARTUP", "false"
).lower() in {"1", "true", "yes", "on"}


# Session cookies
ACCESS_COOKIE_NAME = os.getenv("ACCESS_COOKIE_NAME", "tp_access")
REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "tp_refresh")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in {"1", "true", "yes", "on"}
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")
ACCESS_COOKIE_PATH = os.getenv("ACCESS_COOKIE_PATH", "/")
REFRESH_COOKIE_PATH = os.getenv("REFRESH_COOKIE_PATH", "/api/v1/auth")

# Email retry
EMAIL_RETRY_MAX_ATTEMPTS = int(os.getenv("EMAIL_RETRY_MAX_ATTEMPTS", "4"))
EMAIL_RETRY_BASE_DELAY_SECONDS = int(os.getenv("EMAIL_RETRY_BASE_DELAY_SECONDS", "2"))
EMAIL_RETRY_MAX_DELAY_SECONDS = int(os.getenv("EMAIL_RETRY_MAX_DELAY_SECONDS", "30"))

# Email verification recovery loop
EMAIL_RECOVERY_ENABLED = os.getenv("EMAIL_RECOVERY_ENABLED", "true").lower() in {
   "1", "true", "yes", "on"
}
EMAIL_RECOVERY_INTERVAL_SECONDS = int(os.getenv("EMAIL_RECOVERY_INTERVAL_SECONDS", "120"))
EMAIL_RECOVERY_ELIGIBLE_AGE_SECONDS = int(os.getenv("EMAIL_RECOVERY_ELIGIBLE_AGE_SECONDS", "120"))
EMAIL_RECOVERY_MAX_BATCH_SIZE = int(os.getenv("EMAIL_RECOVERY_MAX_BATCH_SIZE", "100"))
EMAIL_RECOVERY_MAX_RETRY_COUNT = int(os.getenv("EMAIL_RECOVERY_MAX_RETRY_COUNT", "20"))
EMAIL_RECOVERY_BACKOFF_BASE_SECONDS = int(os.getenv("EMAIL_RECOVERY_BACKOFF_BASE_SECONDS", "120"))
EMAIL_RECOVERY_BACKOFF_MAX_SECONDS = int(os.getenv("EMAIL_RECOVERY_BACKOFF_MAX_SECONDS", "3600"))
EMAIL_RECOVERY_STARTUP_DELAY_SECONDS = int(os.getenv("EMAIL_RECOVERY_STARTUP_DELAY_SECONDS", "15"))


# Mail configuration
mail_config = ConnectionConfig(
   MAIL_USERNAME=SMTP_USERNAME,
   MAIL_PASSWORD=SMTP_PASSWORD,
   MAIL_FROM=EMAIL_FROM,
   MAIL_PORT=SMTP_PORT,
   MAIL_SERVER=SMTP_HOST,
   MAIL_STARTTLS=False,
   MAIL_SSL_TLS=False,
   USE_CREDENTIALS=False,
   VALIDATE_CERTS=False
)
