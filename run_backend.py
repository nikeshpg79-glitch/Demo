#!/usr/bin/env python3
"""
PQC HealthSecure - Root Backend Launcher
Allows running FastAPI directly from root workspace:
    python run_backend.py
"""
import sys
import os

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("RENDER") else "127.0.0.1")
    print("=" * 60)
    print(f"Starting PQC HealthSecure Backend on http://{host}:{port}")
    print(f"Interactive API Documentation: http://{host}:{port}/docs")
    print(f"Health & Status Endpoint:     http://{host}:{port}/api/health")
    print("=" * 60)
    uvicorn.run(
        "app.main:app", 
        host=host, 
        port=port, 
        reload=True, 
        reload_dirs=[backend_dir],
        app_dir=backend_dir
    )
