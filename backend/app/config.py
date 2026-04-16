from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://darkweb:darkweb_password@postgres:5432/darkweb_db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "alerts@darkweb.local"
    
    # Tor Proxy
    TOR_PROXY: str = "socks5://tor:9050"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://frontend:3000", "http://192.168.10.161:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
