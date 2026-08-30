import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserRead, AdminLogin, AdminToken, AdminRead
from app.services.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.services.audit import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> User:
    """Register a new user with username, email, name, and password"""
    user = User(
        username=user_data.username,
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        error_str = str(error).lower()
        if "username" in error_str:
            raise HTTPException(status_code=409, detail="Username is already registered") from error
        elif "email" in error_str:
            raise HTTPException(status_code=409, detail="Email is already registered") from error
        raise
    db.refresh(user)
    
    # Log signup event
    try:
        log_audit_event(
            db=db,
            user_id=user.id,
            action="USER_SIGNUP",
            description=f"User {user.username} signed up",
        )
    except Exception as e:
        # Log but don't fail the signup
        print(f"Failed to log audit event: {e}")
    
    return user


@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin, db: Session = Depends(get_db)
) -> Token:
    """
    Login with username or email + password (JSON body).
    
    Supports:
    - username: testuser
    - email: test@example.com
    """
    # Find user by username or email
    user = db.scalar(
        select(User).where(
            or_(
                User.username == user_data.username_or_email,
                User.email == user_data.username_or_email,
            )
        )
    )
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Log login event
    try:
        log_audit_event(
            db=db,
            user_id=user.id,
            action="USER_LOGIN",
            description=f"User {user.username} logged in",
        )
    except Exception as e:
        # Log but don't fail the login
        print(f"Failed to log audit event: {e}")
    
    return Token(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
    )


@router.post("/token", response_model=Token)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Token:
    """
    Login endpoint for OAuth2 form data (works with Authorize button).
    
    Accepts:
    - username: can be username or email
    - password: user password
    """
    # Find user by username or email
    user = db.scalar(
        select(User).where(
            or_(
                User.username == form_data.username,
                User.email == form_data.username,
            )
        )
    )
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Log login event
    try:
        log_audit_event(
            db=db,
            user_id=user.id,
            action="USER_LOGIN",
            description=f"User {user.username} logged in via token endpoint",
        )
    except Exception as e:
        # Log but don't fail the login
        print(f"Failed to log audit event: {e}")
    
    return Token(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
    )


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = decode_access_token(token)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_error
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise credentials_error
    return user


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current authenticated user info"""
    return current_user


@router.post("/admin/login", response_model=AdminToken)
def admin_login(
    admin_data: AdminLogin, db: Session = Depends(get_db)
) -> AdminToken:
    """
    Admin login with username or email + password (JSON body).
    
    Only users with admin privileges can log in here.
    """
    # Find user by username or email
    user = db.scalar(
        select(User).where(
            or_(
                User.username == admin_data.username_or_email,
                User.email == admin_data.username_or_email,
            )
        )
    )
    
    if not user or not verify_password(admin_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrator access"
        )
    
    # Log admin login event
    try:
        log_audit_event(
            db=db,
            user_id=user.id,
            action="ADMIN_LOGIN",
            description=f"Admin {user.username} logged in",
        )
    except Exception as e:
        # Log but don't fail the login
        print(f"Failed to log audit event: {e}")
    
    return AdminToken(
        access_token=create_access_token(user.id),
        admin=AdminRead.model_validate(user),
    )


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """User logout endpoint - logs the logout event"""
    # Log user logout event
    try:
        log_audit_event(
            db=db,
            user_id=current_user.id,
            action="USER_LOGOUT",
            description=f"User {current_user.username} logged out",
        )
    except Exception as e:
        # Log but don't fail the logout
        print(f"Failed to log audit event: {e}")
    
    return {"message": "Logged out successfully"}


@router.post("/admin/logout")
def admin_logout(
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """Admin logout endpoint"""
    if not current_admin.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized"
        )
    
    # Log admin logout event
    try:
        log_audit_event(
            db=db,
            user_id=current_admin.id,
            action="ADMIN_LOGOUT",
            description=f"Admin {current_admin.username} logged out",
        )
    except Exception as e:
        # Log but don't fail the logout
        print(f"Failed to log audit event: {e}")
    
    return {"message": "Logged out successfully"}