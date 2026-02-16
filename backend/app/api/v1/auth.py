from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.services.auth_service import AuthService
from app.core.unit_of_work import UnitOfWork
from app.schemas.user import ProfileResponse
from app.database.db_setup import get_db
from app.core.config import (
    ACCESS_COOKIE_NAME,
    ACCESS_COOKIE_PATH,
    FRONTEND_URL,
    COOKIE_DOMAIN,
    COOKIE_SAMESITE,
    COOKIE_SECURE,
    LOGIN_TOKEN_EXPIRE_MINUTES,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_PATH,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]

)

# Get auth service
def get_service(session: Session = Depends(get_db))->AuthService:
    uow = UnitOfWork(session=session)
    return AuthService(uow)

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    access_max_age = LOGIN_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=access_max_age,
        path=ACCESS_COOKIE_PATH,
        domain=COOKIE_DOMAIN,
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=refresh_max_age,
        path=REFRESH_COOKIE_PATH,
        domain=COOKIE_DOMAIN,
    )

def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        path=ACCESS_COOKIE_PATH,
        domain=COOKIE_DOMAIN,
    )
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        domain=COOKIE_DOMAIN,
    )

# Login route
@router.post("/login", response_model=ProfileResponse, status_code=200)
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_service),
      ):
    username = form_data.username
    password = form_data.password

    user, access_token = service.authenticate_user(username, password)
    user_agent = request.headers.get("user-agent") if request else None
    ip_address = request.client.host if request and request.client else None
    refresh_token, _session = service.create_session(
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    # Set cookies
    _set_auth_cookies(response, access_token, refresh_token)
    return {
        "user_id": user.id,
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
    }

# Logout route
@router.post("/refresh", response_model=ProfileResponse, status_code=200)
def refresh_session(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_service),
):
    # Get refresh token from cookie
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME) if request else None
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    user_agent = request.headers.get("user-agent") if request else None
    ip_address = request.client.host if request and request.client else None
    user, access_token, new_refresh = service.rotate_session(
        refresh_token=refresh_token,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    _set_auth_cookies(response, access_token, new_refresh)
    return {
        "user_id": user.id,
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
    }


# Logout route
@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_service),
):
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME) if request else None
    if refresh_token:
        service.revoke_session(refresh_token=refresh_token)
    _clear_auth_cookies(response)
    return None

# Verify route
@router.get("/verify", status_code=200)
def verify_email(
    token: str,
    service: AuthService = Depends(get_service),
):
    service.verify_user_account(token=token)
    return {"message": "Account verified"}


# Email verification page
@router.get("/verify-page", response_class=HTMLResponse, status_code=200)
def verify_page():
    template_path = (
        Path(__file__).resolve().parents[2]
        / "services"
        / "email_service"
        / "templates"
        / "verification_page.html"
    )
    html = template_path.read_text(encoding="utf-8")
    frontend_origins = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]
    login_base_url = (frontend_origins[0] if frontend_origins else "http://localhost:3000").rstrip("/")
    login_url = f"{login_base_url}/?page=login"
    html = html.replace("__LOGIN_URL__", login_url)
    return HTMLResponse(content=html)

# Password reset routes
@router.post("/password-reset/requests", status_code=200)
def request_password_reset(
    background_tasks: BackgroundTasks,
    email: str = Form(...),
    service: AuthService = Depends(get_service),
):
    detail = service.request_password_reset(email=email, background_tasks=background_tasks)
    return {"detail": detail}

# Password reset confirmation route
@router.post("/password-reset/confirm", status_code=200)
def confirm_password_reset(
    token: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    service: AuthService = Depends(get_service),
):
    service.reset_password(
        token=token,
        new_password=new_password,
        confirm_password=confirm_password,
    )
    return {"detail": "Password reset successful"}

# Password reset page
@router.get("/password-reset/page", response_class=HTMLResponse, status_code=200)
def password_reset_page(token: str):
    template_path = (
        Path(__file__).resolve().parents[2]
        / "services"
        / "email_service"
        / "templates"
        / "password_reset_page.html"
    )
    html = template_path.read_text(encoding="utf-8")
    frontend_origins = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]
    login_base_url = (frontend_origins[0] if frontend_origins else "http://localhost:3000").rstrip("/")
    login_url = f"{login_base_url}/?page=login"
    html = html.replace("__TOKEN__", token).replace("__LOGIN_URL__", login_url)
    return HTMLResponse(content=html)
