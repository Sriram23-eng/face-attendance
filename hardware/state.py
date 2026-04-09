"""Shared mutable state across scanner threads."""
import threading

lock = threading.Lock()

# enrollment requests pulled from backend
enroll_rfid    = False    # True => next RFID tap is for enrollment, not attendance
enroll_finger  = False
enroll_face    = False    # True => next face capture is for enrollment
enroll_id      = None     # backend request id
enroll_slot    = None     # finger template slot (assigned by backend)
