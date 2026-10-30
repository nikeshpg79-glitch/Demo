import asyncio
import requests
from fastapi import APIRouter
from app.core.config import settings
from app.services.crypto_service import crypto_service

router = APIRouter()

def _check_database_sync():
    """
    Directly probes Supabase PostgreSQL and PostgREST endpoint
    without blocking the FastAPI asyncio event loop.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        return {
            "configured": False,
            "connected": False,
            "status": "unconfigured",
            "message": "Supabase credentials not configured in backend/.env (Running in standalone PQC local demo mode)"
        }
    
    headers = {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}"
    }

    try:
        # Check actual database table via PostgREST
        res = requests.get(
            f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?select=id&limit=1",
            headers=headers,
            timeout=3
        )
        
        key_type = "publishable" if settings.SUPABASE_SERVICE_KEY.startswith("sb_publishable_") else "service_role"
        
        if res.status_code == 200:
            return {
                "configured": True,
                "connected": True,
                "status": "active",
                "key_type": key_type,
                "message": "Supabase PostgreSQL connected and table schema verified active."
            }
        elif res.status_code == 404 and "PGRST205" in res.text:
            return {
                "configured": True,
                "connected": True,
                "status": "schema_pending",
                "key_type": key_type,
                "message": "Supabase PostgREST connected; schema migration pending in Supabase SQL editor."
            }
        elif res.status_code in (401, 403):
            return {
                "configured": True,
                "connected": False,
                "status": "auth_error",
                "key_type": key_type,
                "error": f"Supabase API key rejected: HTTP {res.status_code}"
            }
        else:
            return {
                "configured": True,
                "connected": False,
                "status": "unexpected_status",
                "key_type": key_type,
                "error": f"Supabase responded with HTTP {res.status_code}"
            }
    except requests.exceptions.Timeout:
        return {
            "configured": True,
            "connected": False,
            "status": "timeout",
            "error": "Supabase database connection timed out (3s threshold)"
        }
    except requests.exceptions.RequestException as e:
        return {
            "configured": True,
            "connected": False,
            "status": "connection_error",
            "error": f"Failed to connect to Supabase: {str(e)}"
        }

@router.get("/health", tags=["System Health"])
async def health_check():
    """
    Health check endpoint returning system status, post-quantum engines,
    and verified Supabase PostgreSQL connectivity.
    """
    capabilities = crypto_service.get_capabilities()
    db_result = await asyncio.to_thread(_check_database_sync)
    db_connected = db_result.get("connected", False)

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "cryptographic_engines": capabilities,
        "database_connected": db_connected,
        "supabase": db_result
    }
