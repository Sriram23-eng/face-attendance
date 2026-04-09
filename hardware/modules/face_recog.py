"""Face recognition using picamera2 (CSI camera) + face_recognition (dlib)."""
import base64
import numpy as np
import cv2
import face_recognition
from picamera2 import Picamera2
import config


class FaceRecognizer:
    def __init__(self):
        self.cam = Picamera2()
        cfg = self.cam.create_preview_configuration(
            main={"size": (config.CAMERA_WIDTH, config.CAMERA_HEIGHT),
                  "format": "RGB888"})
        self.cam.configure(cfg)
        self.cam.start()
        self.known_encodings = []
        self.known_user_ids = []

    def load_known(self, users_full):
        """users_full: list of dicts with {_id, name, faceImage(dataURL)}."""
        self.known_encodings.clear()
        self.known_user_ids.clear()
        for u in users_full:
            face_data = u.get("faceImage")
            if not face_data:
                continue
            # decode "data:image/jpeg;base64,..." -> bytes -> ndarray
            if "," in face_data:
                b64 = face_data.split(",", 1)[1]
            else:
                b64 = face_data
            try:
                img_bytes = base64.b64decode(b64)
                arr = np.frombuffer(img_bytes, np.uint8)
                bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if bgr is None:
                    continue
                rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                encs = face_recognition.face_encodings(rgb)
                if encs:
                    self.known_encodings.append(encs[0])
                    self.known_user_ids.append(u["_id"])
            except Exception as e:
                print(f"[face] decode failed for {u.get('name')}: {e}")
        print(f"[face] loaded {len(self.known_encodings)} known faces")

    def scan(self):
        """Capture one frame from CSI camera, return matched user_id or None."""
        frame = self.cam.capture_array()       # picamera2 returns RGB ndarray
        locs = face_recognition.face_locations(frame, model="hog")
        if not locs:
            return None
        encs = face_recognition.face_encodings(frame, locs)
        for enc in encs:
            if not self.known_encodings:
                return None
            distances = face_recognition.face_distance(self.known_encodings, enc)
            best = int(np.argmin(distances))
            if distances[best] <= config.FACE_MATCH_TOLERANCE:
                return self.known_user_ids[best]
        return None

    def capture_jpeg(self):
        """Capture a frame, verify a face is present, return JPEG bytes (or None)."""
        frame = self.cam.capture_array()
        locs = face_recognition.face_locations(frame, model="hog")
        if not locs:
            return None
        bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        ok, buf = cv2.imencode(".jpg", bgr)
        return buf.tobytes() if ok else None

    def release(self):
        self.cam.stop()
