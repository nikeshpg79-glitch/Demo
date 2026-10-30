import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Robustly find .env file whether running from root or backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
for p in [os.path.join(backend_dir, ".env"), os.path.join(backend_dir, "backend", ".env"), ".env", "backend/.env"]:
    if os.path.exists(p):
        load_dotenv(p, override=True)

import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Robustly find .env file whether running from root or backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
for p in [os.path.join(backend_dir, ".env"), os.path.join(backend_dir, "backend", ".env"), ".env", "backend/.env"]:
    if os.path.exists(p):
        load_dotenv(p, override=True)

def _get_cors_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    env_origins = os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS") or ""
    if env_origins:
        for origin in env_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned not in default_origins:
                default_origins.append(cleaned)
    frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if frontend_url and frontend_url not in default_origins:
        default_origins.append(frontend_url)
    return default_origins

class Settings(BaseModel):
    PROJECT_NAME: str = "PQC Quantum-Secure Hospital-to-Laboratory System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8001))
    CORS_ORIGINS: List[str] = _get_cors_origins()
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    QPIAI_API_TOKEN: str = os.getenv("QPIAI_API_TOKEN", "")

settings = Settings()
