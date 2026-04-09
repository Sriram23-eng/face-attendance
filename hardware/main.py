"""
Attendance Monitoring System — main loop.

Default mode: all 3 scanners run 24/7 marking attendance.
On demand:    when the web UI requests an enrollment, the matching scanner
              briefly switches to enrollment mode, captures the value, posts
              it back, then resumes attendance.
"""
import time
import threading
from datetime import datetime

import config
import state
from api_client import APIClient
from modules.leds import LEDs
from modules.lcd_display import LCD
from modules.rfid import RFIDReader
from modules.fingerprint import FingerprintReader
from modules.face_recog import FaceRecognizer


api  = APIClient()
leds = LEDs()
lcd  = LCD()

_last_marked = {}      # user_id -> last attendance timestamp


def mark(user_id, name, method):
    """Thread-safe attendance marker with de-dup."""
    now = time.time()
    with state.lock:
        if now - _last_marked.get(user_id, 0) < config.DEDUP_WINDOW_SEC:
            return
        _last_marked[user_id] = now

    print(f"[{method}] {name} ({user_id}) @ {datetime.now():%H:%M:%S}")
    lcd.show(f"Hi {name[:14]}", method.upper() + " OK")
    api.post_attendance(user_id, method)
    leds.success()
    time.sleep(0.5)
    lcd.show("Attendance Sys", "Ready...")


def fail(reason):
    lcd.show("Not recognized", reason[:16])
    leds.fail()
    lcd.show("Attendance Sys", "Ready...")


# =================== ENROLLMENT POLLER ===================
def enroll_poll_loop():
    """Polls backend for enrollment requests from the web UI."""
    while True:
        req = api.get_pending_enroll()
        if req:
            with state.lock:
                state.enroll_id = req["id"]
                if req["type"] == "rfid":
                    state.enroll_rfid = True
                    lcd.show("ENROLL MODE", "Tap RFID card")
                elif req["type"] == "finger":
                    state.enroll_slot = req["slot"]
                    state.enroll_finger = True
                    lcd.show("ENROLL MODE", f"Slot {req['slot']}")
                elif req["type"] == "face":
                    state.enroll_face = True
                    lcd.show("ENROLL MODE", "Look at camera")
            print(f"[enroll] received {req}")
        time.sleep(1)


# =================== SCANNER THREADS ===================
def rfid_loop():
    rfid = RFIDReader()
    while True:
        try:
            uid = rfid.read_nonblocking()
            if uid:
                with state.lock:
                    enrolling = state.enroll_rfid
                    eid = state.enroll_id

                if enrolling:
                    # ENROLLMENT path
                    api.post_enroll_result(eid, uid, ok=True)
                    with state.lock:
                        state.enroll_rfid = False
                        state.enroll_id = None
                    lcd.show("RFID enrolled", uid[:16])
                    leds.success()
                    lcd.show("Attendance Sys", "Ready...")
                else:
                    # ATTENDANCE path
                    row = api.get_user_by_rfid(uid)
                    if row:
                        mark(row[0], row[1], "rfid")
                    else:
                        fail("Unknown card")
        except Exception as e:
            print(f"[rfid] {e}")
        time.sleep(0.2)


def finger_loop():
    try:
        fp = FingerprintReader()
    except Exception as e:
        print(f"[finger] disabled: {e}")
        return

    while True:
        try:
            with state.lock:
                enrolling = state.enroll_finger
                slot = state.enroll_slot
                eid  = state.enroll_id

            if enrolling:
                # ENROLLMENT path — capture two prints, store at slot
                ok = fp.enroll(slot)
                api.post_enroll_result(eid, slot, ok=ok)
                with state.lock:
                    state.enroll_finger = False
                    state.enroll_slot = None
                    state.enroll_id = None
                if ok:
                    lcd.show("Finger enrolled", f"slot {slot}")
                    leds.success()
                else:
                    fail("Enroll failed")
                lcd.show("Attendance Sys", "Ready...")
                continue

            # ATTENDANCE path
            fid = fp.scan()
            if fid is not None:
                row = api.get_user_by_finger(fid)
                if row:
                    mark(row[0], row[1], "finger")
                else:
                    fail("Unknown finger")
        except Exception as e:
            print(f"[finger] {e}")
        time.sleep(0.2)


def face_loop():
    import base64, io
    try:
        face = FaceRecognizer()
    except Exception as e:
        print(f"[face] disabled: {e}")
        return
    face.load_known(api.all_users_full())
    last_reload = time.time()
    while True:
        try:
            with state.lock:
                enrolling = state.enroll_face
                eid = state.enroll_id

            if enrolling:
                # ENROLLMENT path — capture a frame and send back as base64 data URL
                frame = face.capture_jpeg()  # returns JPEG bytes
                if frame:
                    b64 = base64.b64encode(frame).decode("ascii")
                    data_url = f"data:image/jpeg;base64,{b64}"
                    api.post_enroll_result(eid, data_url, ok=True)
                    lcd.show("Face enrolled", "OK")
                    leds.success()
                else:
                    api.post_enroll_result(eid, None, ok=False)
                    fail("No face")
                with state.lock:
                    state.enroll_face = False
                    state.enroll_id = None
                lcd.show("Attendance Sys", "Ready...")
                time.sleep(1)
                continue

            uid = face.scan()
            if uid:
                mark(uid, api.get_name(uid), "face")
            if time.time() - last_reload > config.SYNC_INTERVAL_SEC:
                face.load_known(api.all_users_full())
                last_reload = time.time()
        except Exception as e:
            print(f"[face] {e}")
        time.sleep(0.1)


def sync_loop():
    while True:
        api.sync_users()
        time.sleep(config.SYNC_INTERVAL_SEC)


# =================== MAIN ===================
def main():
    print("== Attendance Monitoring System ==")
    api.sync_users()

    threads = [
        threading.Thread(target=sync_loop,        daemon=True, name="sync"),
        threading.Thread(target=enroll_poll_loop, daemon=True, name="enroll"),
        threading.Thread(target=rfid_loop,        daemon=True, name="rfid"),
        threading.Thread(target=finger_loop,      daemon=True, name="finger"),
        threading.Thread(target=face_loop,        daemon=True, name="face"),
    ]
    for t in threads:
        t.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        lcd.clear()
        leds.cleanup()


if __name__ == "__main__":
    main()
