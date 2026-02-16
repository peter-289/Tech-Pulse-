from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status, Request

from app.exceptions.exceptions import DomainError
from app.core.config import (
    LOGIN_TOKEN_EXPIRE_MINUTES, 
    ALGORITHM, 
    EMAIL_VERIFY_SECRET,
    PASSWORD_RESET_SECRET,
    SECRET_KEY,
    EMAIL_TOKEN_EXPIRE_MINUTES,
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    ACCESS_COOKIE_NAME)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Credentials exception
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW.Authenticate": "Bearer"}
)

# Email verification
EXPECTED_PURPOSE = "email_verification"
EXPECTED_RESET_PURPOSE = "password_reset"
EXPECTED_ISSUER = "Tech_Pulse_Technologies"


# Create login token
def create_login_token(data: dict, expires_delta: timedelta | None = None)->str:
    """Creates a login token"""
    
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=LOGIN_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp":expire})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


# Create email verification token
def create_email_verification_token(user_id: int)->str:
    """Creates an email verification token"""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=EMAIL_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "purpose": "email_verification",
        "iss": "Tech_Pulse_Technologies"
    }
    token = jwt.encode(payload, EMAIL_VERIFY_SECRET, algorithm=ALGORITHM)
    return token


def create_password_reset_token(user_id: int) -> str:
    """Creates a password reset token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "purpose": EXPECTED_RESET_PURPOSE,
        "iss": EXPECTED_ISSUER,
    }
    return jwt.encode(payload, PASSWORD_RESET_SECRET, algorithm=ALGORITHM)


def get_current_user(
        request: Request,
        token: str = Depends(oauth2_scheme),
):
    try:
    
        if not token:
            token = request.cookies.get(ACCESS_COOKIE_NAME)
        if not token:
            raise credentials_exception
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        role: str = payload.get("role")
        
        if not user_id or not role:
           raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {
        "user_id": user_id,
        "role": role
    }


# Get a user assocciated with the token sent to them
def get_email_user(token: str):
    try:
        payload = jwt.decode(
            token, 
            EMAIL_VERIFY_SECRET, 
            algorithms=[ALGORITHM],
            options={"require": ["sub", "exp","iat", "purpose", "iss" ]}
            )
        
        user_id: int = payload["sub"]
        purpose: str = payload["purpose"]
        issuer: str = payload["iss"]

        if purpose != EXPECTED_PURPOSE:
            raise credentials_exception
        if issuer != EXPECTED_ISSUER:
            raise credentials_exception
    except (JWTError, ValueError, TypeError):
        raise credentials_exception 
    return {
        "user_id": int(user_id),
        "purpose": purpose
    }


def get_password_reset_user(token: str):
    try:
        payload = jwt.decode(
            token,
            PASSWORD_RESET_SECRET,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "exp", "iat", "purpose", "iss"]},
        )
        user_id: int = payload["sub"]
        purpose: str = payload["purpose"]
        issuer: str = payload["iss"]
        if purpose != EXPECTED_RESET_PURPOSE:
            raise credentials_exception
        if issuer != EXPECTED_ISSUER:
            raise credentials_exception
    except (JWTError, ValueError, TypeError):
        raise credentials_exception
    return {"user_id": int(user_id), "purpose": purpose}


# Check for admin access
def admin_access(
        current_user: dict = Depends(get_current_user)
)->dict:
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required!"
        )
    return current_user

# Password strenght validation
def validate_password_strength(new_password: str) -> None:
    """Validate password strength according to defined criteria.""" 
 # Validate password strength
    if len(new_password) < 8:
            raise DomainError("Password must be at least 8 characters long")
    if not any(char.isdigit() for char in new_password):
            raise DomainError("Password must contain at least one digit")
    if not any(char.isupper() for char in new_password):
            raise DomainError("Password must contain at least one uppercase letter")
    if not any(char.islower() for char in new_password):
            raise DomainError("Password must contain at least one lowercase letter")
