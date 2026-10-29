#!/usr/bin/env python3
"""
PQC HealthSecure - Root Backend Launcher
Allows running FastAPI directly from root workspace:
    python main.py
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
    print("=" * 60)
    print(f"Starting PQC HealthSecure Backend on http://127.0.0.1:{port}")
    print(f"Interactive API Documentation: http://127.0.0.1:{port}/docs")
    print(f"Health & Status Endpoint:     http://127.0.0.1:{port}/api/health")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True, app_dir=backend_dir)
