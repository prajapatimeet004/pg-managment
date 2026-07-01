from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from database import get_session
from models import Owner

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "supersecretkey_please_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# We will expect the token to be passed as Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/owner/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # If the hashed password is not valid bcrypt (e.g. plaintext from old db)
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> Owner:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        owner_id: str = payload.get("sub")
        if owner_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    owner = session.get(Owner, int(owner_id))
    if owner is None:
        raise credentials_exception
    return owner

def get_current_tenant(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    from models import Tenant
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tenant_id: str = payload.get("tenant_id")
        if tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    tenant = session.get(Tenant, int(tenant_id))
    if tenant is None:
        raise credentials_exception
    return tenant
