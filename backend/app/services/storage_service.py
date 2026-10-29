"""
Storage Service for PQC HealthSecure
Manages secure private object storage in Supabase Storage and local fallback,
including short-lived signed URL generation and cryptographic document hashing.
"""

import os
import io
import uuid
import hashlib
import requests
from typing import Optional, Dict, Any, Tuple
from PIL import Image
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


class StorageService:
    def __init__(self):
        self.bucket_name = "medical-documents"
        self.local_storage_dir = os.path.join(os.getcwd(), "local_storage", self.bucket_name)
        os.makedirs(self.local_storage_dir, exist_ok=True)

    def validate_image_file(self, file_bytes: bytes, filename: str) -> Tuple[bool, str, str]:
        """
        Validates image file size, extension, and verifies image header with Pillow.
        Returns (is_valid, mime_type, error_message).
        """
        if len(file_bytes) == 0:
            return False, "", "File is empty."

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            return False, "", f"File exceeds maximum allowed size of 10 MB ({len(file_bytes)} bytes)."

        ext = os.path.splitext(filename.lower())[1]
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return False, "", f"Unsupported file extension '{ext}'. Allowed: .jpg, .jpeg, .png, .webp."

        # Magic bytes / Pillow image integrity validation
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()  # Verifies file integrity without decoding whole image
            img_format = image.format.lower()
            if img_format == 'jpeg':
                mime = 'image/jpeg'
            elif img_format == 'png':
                mime = 'image/png'
            elif img_format == 'webp':
                mime = 'image/webp'
            else:
                return False, "", f"Unsupported image format '{img_format}' detected."
            return True, mime, ""
        except Exception as e:
            return False, "", f"Malformed or corrupted image file: {str(e)}"

    def upload_file(self, file_bytes: bytes, patient_id: str, mime_type: str) -> Dict[str, Any]:
        """
        Stores image with a cryptographically randomized safe object key.
        Uploads to Supabase Storage private bucket, or falls back to secure local storage.
        """
        ext = ALLOWED_MIME_TYPES.get(mime_type, '.jpg')
        safe_filename = f"{uuid.uuid4().hex}{ext}"
        storage_path = f"patients/{patient_id}/{safe_filename}"
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # If Supabase credentials are configured, upload to Supabase Storage
        remote_uploaded = False
        signed_url = None

        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            try:
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                    "Content-Type": mime_type,
                    "x-upsert": "true"
                }
                upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{self.bucket_name}/{storage_path}"
                res = requests.post(upload_url, headers=headers, data=file_bytes, timeout=10)
                if res.status_code in [200, 201]:
                    remote_uploaded = True
                    # Create 1-hour signed URL with application/json header
                    sign_url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{self.bucket_name}/{storage_path}"
                    json_headers = {
                        "apikey": settings.SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                        "Content-Type": "application/json"
                    }
                    sign_res = requests.post(sign_url, headers=json_headers, json={"expiresIn": 3600}, timeout=5)
                    if sign_res.status_code == 200:
                        data = sign_res.json()
                        signed_url = f"{settings.SUPABASE_URL}/storage/v1{data.get('signedURL')}"
            except Exception as e:
                print(f"[StorageService] Supabase upload failed, using local storage: {e}")

        # Always persist a local copy for local preview & offline demo reliability
        local_dest = os.path.join(self.local_storage_dir, patient_id)
        os.makedirs(local_dest, exist_ok=True)
        local_file_path = os.path.join(local_dest, safe_filename)
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)

        if not signed_url:
            # Local URL served by FastAPI backend
            port = os.getenv("PORT", "8001")
            signed_url = f"http://127.0.0.1:{port}/api/documents/raw/{storage_path}"

        return {
            "storage_path": storage_path,
            "file_size": len(file_bytes),
            "mime_type": mime_type,
            "file_hash_sha256": sha256_hash,
            "remote_uploaded": remote_uploaded,
            "signed_url": signed_url
        }

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> str:
        """
        Generates a short-lived signed URL for authorized viewing/downloading.
        """
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            try:
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                }
                sign_url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{self.bucket_name}/{storage_path}"
                sign_res = requests.post(
                    sign_url, 
                    headers=headers, 
                    json={"expiresIn": expires_in_seconds}, 
                    timeout=5
                )
                if sign_res.status_code == 200:
                    data = sign_res.json()
                    return f"{settings.SUPABASE_URL}/storage/v1{data.get('signedURL')}"
            except Exception as e:
                print(f"[StorageService] Failed generating remote signed URL: {e}")

        # Local signed fallback
        port = os.getenv("PORT", "8001")
        return f"http://127.0.0.1:{port}/api/documents/raw/{storage_path}"

    def get_local_file_path(self, storage_path: str) -> Optional[str]:
        """Returns physical path if file exists locally."""
        # Sanitize path to prevent path traversal
        clean_path = os.path.normpath(storage_path).replace("\\", "/")
        if clean_path.startswith("..") or "/../" in clean_path:
            return None
        parts = clean_path.split("/")
        if len(parts) >= 2 and parts[0] == "patients":
            p_id = parts[1]
            fname = parts[-1]
            full_p = os.path.join(self.local_storage_dir, p_id, fname)
            if os.path.exists(full_p):
                return full_p
        return None


storage_service = StorageService()
