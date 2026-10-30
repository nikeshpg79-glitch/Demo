"""
PQC HealthSecure - App Main Entry Bridge
Exports the authoritative FastAPI app instance from backend/app/main.py
"""
import os
import sys

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

# Import the authoritative FastAPI application instance
from backend.app.main import app

__all__ = ["app"]
