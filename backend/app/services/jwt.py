from datetime import datetime, timedelta, timezone

import jwt
from pydantic_settings import BaseSettings


# =========================
# SETTINGS
# =========================

class Settings(BaseSettings):
    jwt_secret_key: str

    class Config:
        env_file = ".env"


settings = Settings()


# =========================
# JWT CONFIGURATION
# =========================

SECRET_KEY = settings.jwt_secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================
# CREATE ACCESS TOKEN
# =========================

def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================
# DECODE ACCESS TOKEN
# =========================

def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )