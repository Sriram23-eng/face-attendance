"""Central configuration for the Raspberry Pi attendance node."""

# ---- Backend (CLOUD URL — set to your Render URL after deployment) ----
# Example:  https://attendx-backend.onrender.com
BACKEND_URL = "https://face-attendance-chrs.onrender.com"
DEVICE_ID   = "pi-node-01"
API_KEY     = "change-me-shared-secret"     # not enforced server-side yet

# ---- Sync ----
SYNC_INTERVAL_SEC = 60
DEDUP_WINDOW_SEC  = 60

# ---- GPIO (BCM numbering) ----
GREEN_LED_PIN = 23
RED_LED_PIN   = 24

# ---- Fingerprint (UART) ----
FINGERPRINT_PORT = "/dev/serial0"
FINGERPRINT_BAUD = 57600

# ---- RFID (RC522, SPI) ----
RFID_RST_PIN = 25

# ---- LCD (I2C 16x2) ----
LCD_I2C_ADDR = 0x27
LCD_COLS     = 16
LCD_ROWS     = 2

# ---- Camera (Pi CSI camera via picamera2) ----
CAMERA_WIDTH         = 320
CAMERA_HEIGHT        = 240
FACE_MATCH_TOLERANCE = 0.5

# ---- Local cache ----
LOCAL_DB_PATH = "/home/pi/attendance_cache.sqlite3"
