import sys
import os

# Ensure backend directory is in sys.path regardless of how script is executed
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.endpoints import health, pqc, documents, security
from app.services.security_service import security_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## Quantum-Secure Hospital-to-Laboratory Data Exchange
    **Long-Term Confidentiality in Hospital-to-Laboratory Data Exchange**
    
    This backend provides quantum-resistant cryptographic services:
    * **ML-KEM-768 (NIST FIPS 203)**: Key Encapsulation Mechanism for secure session key exchange.
    * **AES-256-GCM (NIST SP 800-38D)**: High-performance authenticated symmetric encryption for lab reports.
    * **ML-DSA-65 (NIST FIPS 204)**: Lattice-based digital signatures ensuring non-repudiation and tamper detection.
    * **QpiAI Quantum SDK**: Quantum Random Number Generation & quantum threat demonstrations.
    * **Defensive Threat Monitoring**: Hash-chained tamper-evident security audit trail & rate limiting.
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for React frontend (allows all localhost/127.0.0.1 ports, Render, Vercel, and configured origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.onrender\.com|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Defensive Rate Limiting & Observation Middleware
@app.middleware("http")
async def security_rate_limiting_middleware(request: Request, call_next):
    # Only enforce on API paths (skip static docs, favicon, options preflight, and health checks)
    path = request.url.path
    if request.method != "OPTIONS" and path.startswith("/api/"):
        if path in ("/api/health", "/api/health/", "/health", "/"):
            return await call_next(request)
        client_ip = security_service.resolve_source_ip(request)
        is_allowed, details = security_service.check_rate_limit(client_ip, request.url.path)
        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "TooManyRequests",
                    "detail": details.get("detail", "Rate limit exceeded. Temporary cooldown in effect."),
                    "retry_after_seconds": details.get("retry_after", 60)
                },
                headers={"Retry-After": str(details.get("retry_after", 60))}
            )

    response = await call_next(request)
    return response

# Root redirect / status
@app.get("/", tags=["System Root"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

# Standard Root Health Check (Render / Kubernetes compatible)
@app.get("/health", tags=["System Health"])
async def root_health_check():
    return await health.health_check()

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": request.url.path
        }
    )

# Include Routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(pqc.router, prefix=f"{settings.API_PREFIX}/pqc")
app.include_router(documents.router, prefix=f"{settings.API_PREFIX}/documents")
app.include_router(security.router, prefix=f"{settings.API_PREFIX}/security")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("RENDER") else "127.0.0.1")
    print(f"Starting PQC HealthSecure Backend on http://{host}:{port} (docs: http://{host}:{port}/docs)")
    uvicorn.run("app.main:app", host=host, port=port, reload=True, reload_dirs=[_backend_dir], app_dir=_backend_dir)
