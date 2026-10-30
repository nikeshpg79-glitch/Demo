"""
PQC HealthSecure - App Package Bridge
Allows running uvicorn app.main:app from project root as well as backend/
"""
import os
import sys

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

_backend_app = os.path.join(_backend, "app")
if os.path.exists(_backend_app) and _backend_app not in __path__:
    __path__.append(_backend_app)

