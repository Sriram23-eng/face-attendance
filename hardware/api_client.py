"""Talks to the Express backend in the cloud. Falls back to local SQLite when offline."""
import sqlite3
import os
import requests
from datetime import datetime
import config


class APIClient:
    def __init__(self):
        self.base = config.BACKEND_URL.rstrip("/")
        self.headers = {
            "X-API-Key": config.API_KEY,
            "X-Device-Id": config.DEVICE_ID,
        }
        # Full user docs (including base64 face) — kept in memory for face recognition
        self.users_full = []
        self._init_cache()

    # ---------- local cache ----------
    def _init_cache(self):
        os.makedirs(os.path.dirname(config.LOCAL_DB_PATH), exist_ok=True)
        self.db = sqlite3.connect(config.LOCAL_DB_PATH, check_same_thread=False)
        self.db.execute("""CREATE TABLE IF NOT EXISTS users(
            user_id TEXT PRIMARY KEY,
            name    TEXT,
            rfid    TEXT,
            finger_id INTEGER
        )""")
        self.db.execute("""CREATE TABLE IF NOT EXISTS pending(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            method TEXT,
            ts TEXT
        )""")
        self.db.commit()

    # ---------- users ----------
    def sync_users(self):
        """Pull full user list (including base64 faces) from /api/users/sync."""
        try:
            r = requests.get(f"{self.base}/api/users/sync",
                             headers=self.headers, timeout=15)
            r.raise_for_status()
            users = r.json()
            self.users_full = users
            cur = self.db.cursor()
            cur.execute("DELETE FROM users")
            for u in users:
                cur.execute(
                    "INSERT INTO users VALUES (?,?,?,?)",
                    (u["_id"], u.get("name", ""), u.get("rfid", "") or "",
                     u.get("fingerId", -1) if u.get("fingerId") is not None else -1),
                )
            self.db.commit()
            print(f"[sync] {len(users)} users updated")
            return users
        except Exception as e:
            print(f"[sync] offline – using cache ({e})")
            return None

    def get_user_by_rfid(self, rfid):
        cur = self.db.execute("SELECT user_id, name FROM users WHERE rfid=?", (rfid,))
        return cur.fetchone()

    def get_user_by_finger(self, finger_id):
        cur = self.db.execute("SELECT user_id, name FROM users WHERE finger_id=?", (finger_id,))
        return cur.fetchone()

    def all_users_full(self):
        """Returns list of full dicts (used by face recognizer)."""
        return self.users_full

    def get_name(self, user_id):
        cur = self.db.execute("SELECT name FROM users WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        return row[0] if row else user_id

    # ---------- attendance ----------
    def post_attendance(self, user_id, method):
        ts = datetime.utcnow().isoformat()
        payload = {"userId": user_id, "method": method, "timestamp": ts,
                   "deviceId": config.DEVICE_ID}
        try:
            r = requests.post(f"{self.base}/api/attendance",
                              json=payload, headers=self.headers, timeout=10)
            r.raise_for_status()
            self._flush_pending()
            return True
        except Exception as e:
            print(f"[attendance] queued offline ({e})")
            self.db.execute(
                "INSERT INTO pending(user_id, method, ts) VALUES (?,?,?)",
                (user_id, method, ts))
            self.db.commit()
            return False

    def _flush_pending(self):
        cur = self.db.execute("SELECT id, user_id, method, ts FROM pending")
        for row in cur.fetchall():
            try:
                requests.post(
                    f"{self.base}/api/attendance",
                    json={"userId": row[1], "method": row[2],
                          "timestamp": row[3], "deviceId": config.DEVICE_ID},
                    headers=self.headers, timeout=10).raise_for_status()
                self.db.execute("DELETE FROM pending WHERE id=?", (row[0],))
                self.db.commit()
            except Exception:
                break

    # ---------- enrollment ----------
    def get_pending_enroll(self):
        try:
            r = requests.get(f"{self.base}/api/enroll/pending",
                             headers=self.headers, timeout=10)
            r.raise_for_status()
            return r.json()
        except Exception:
            return None

    def post_enroll_result(self, req_id, value, ok=True):
        try:
            requests.post(f"{self.base}/api/enroll/result",
                          json={"id": req_id, "value": value, "ok": ok},
                          headers=self.headers, timeout=10)
        except Exception as e:
            print(f"[enroll] failed to post result: {e}")
