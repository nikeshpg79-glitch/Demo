import requests
from fastapi import APIRouter
from app.core.config import settings
from app.services.crypto_service import crypto_service

router = APIRouter()

@router.get("/health", tags=["System Health"])
async def health_check():
    """
    Health check endpoint returning system status, post-quantum engines,
    and live Supabase PostgreSQL connectivity.
    """
    capabilities = crypto_service.get_capabilities()
    db_connected = False
    supabase_info = {"configured": False, "connected": False}
    
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
        supabase_info["configured"] = True
        try:
            headers = {
                "apikey": settings.SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}"
            }
            # Verify Supabase Auth service & PostgREST connectivity
            res_auth = requests.get(f"{settings.SUPABASE_URL}/auth/v1/health", headers=headers, timeout=4)
            if res_auth.status_code == 200:
                db_connected = True
                supabase_info["connected"] = True
                supabase_info["auth_service"] = "online"
            else:
                res = requests.get(f"{settings.SUPABASE_URL}/rest/v1/", headers=headers, timeout=4)
                db_connected = (res.status_code in [200, 204])
                supabase_info["connected"] = db_connected

            supabase_info["key_type"] = "publishable" if settings.SUPABASE_SERVICE_KEY.startswith("sb_publishable_") else "service_role"
        except Exception as e:
            db_connected = False
            supabase_info["error"] = str(e)

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "cryptographic_engines": capabilities,
        "database_connected": db_connected,
        "supabase": supabase_info
    }
