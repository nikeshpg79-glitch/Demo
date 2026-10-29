import os
import json
from typing import Dict, Any, Optional
from app.services.crypto_service import crypto_service

KEYSTORE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "..",
    "data",
    "pqc_keystore.json"
)

class PQCKeyManager:
    def __init__(self, keystore_path: str = KEYSTORE_PATH):
        self.keystore_path = os.path.abspath(keystore_path)
        os.makedirs(os.path.dirname(self.keystore_path), exist_ok=True)
        self.keystore: Dict[str, Dict[str, Any]] = self._load_or_initialize()

    def _load_or_initialize(self) -> Dict[str, Dict[str, Any]]:
        """Load persistent keys from disk or generate authentic lattice keypairs for known entities."""
        if os.path.exists(self.keystore_path):
            try:
                with open(self.keystore_path, "r", encoding="utf-8") as f:
                    store = json.load(f)
                    # Verify required entities exist
                    required = ["pat-001", "pat-002", "doc-101", "lab-301", "adm-001"]
                    if all(uid in store for uid in required):
                        return store
            except Exception as e:
                print(f"[PQCKeyManager] Warning reading keystore: {e}")

        # Initialize fresh authentic NIST FIPS 203 & 204 keys
        store: Dict[str, Dict[str, Any]] = {}
        entities = [
            ("pat-001", "Ananya Sharma", "patient"),
            ("pat-002", "Kavita Menon", "patient"),
            ("doc-101", "Dr. Vikramaditya Sen", "doctor"),
            ("lab-301", "Rajesh Verma", "lab_technician"),
            ("adm-001", "Suresh Menon", "admin"),
        ]

        print("[PQCKeyManager] Initializing persistent NIST Post-Quantum lattice keystore...")
        for uid, name, role in entities:
            kem_keys = crypto_service.generate_kem_keypair()
            dsa_keys = crypto_service.generate_dsa_keypair()
            store[uid] = {
                "id": uid,
                "name": name,
                "role": role,
                "kem": kem_keys,
                "dsa": dsa_keys
            }

        self._save(store)
        return store

    def _save(self, store: Optional[Dict[str, Dict[str, Any]]] = None) -> None:
        data = store if store is not None else self.keystore
        with open(self.keystore_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def get_or_create_user(self, user_id: str, name: str = "", role: str = "patient") -> Dict[str, Any]:
        """Retrieve existing user lattice keys or generate fresh permanent pair."""
        if user_id in self.keystore:
            return self.keystore[user_id]

        kem_keys = crypto_service.generate_kem_keypair()
        dsa_keys = crypto_service.generate_dsa_keypair()
        self.keystore[user_id] = {
            "id": user_id,
            "name": name or user_id,
            "role": role,
            "kem": kem_keys,
            "dsa": dsa_keys
        }
        self._save()
        return self.keystore[user_id]

    def get_kem_public_key(self, user_id: str) -> Optional[str]:
        user = self.get_or_create_user(user_id)
        return user.get("kem", {}).get("public_key")

    def get_kem_private_key(self, user_id: str) -> Optional[str]:
        user = self.get_or_create_user(user_id)
        return user.get("kem", {}).get("private_key")

    def get_dsa_public_key(self, user_id: str) -> Optional[str]:
        user = self.get_or_create_user(user_id)
        return user.get("dsa", {}).get("public_key")

    def get_dsa_private_key(self, user_id: str) -> Optional[str]:
        user = self.get_or_create_user(user_id)
        return user.get("dsa", {}).get("private_key")

    def get_public_directory(self) -> Dict[str, Dict[str, str]]:
        """Public key directory safe for untrusted clients (no private keys)."""
        res = {}
        for uid, data in self.keystore.items():
            res[uid] = {
                "id": uid,
                "name": data.get("name", uid),
                "role": data.get("role", "patient"),
                "pqcPublicKey": data.get("kem", {}).get("public_key", ""),
                "pqcDsaPublicKey": data.get("dsa", {}).get("public_key", "")
            }
        return res

key_manager = PQCKeyManager()

