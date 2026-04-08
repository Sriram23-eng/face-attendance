"""R307 / R503 fingerprint sensor over UART."""
import serial
import adafruit_fingerprint
import config


class FingerprintReader:
    def __init__(self):
        uart = serial.Serial(config.FINGERPRINT_PORT,
                             baudrate=config.FINGERPRINT_BAUD, timeout=1)
        self.finger = adafruit_fingerprint.Adafruit_Fingerprint(uart)

    def scan(self):
        """Returns matched template id (int) or None."""
        if self.finger.get_image() != adafruit_fingerprint.OK:
            return None
        if self.finger.image_2_tz(1) != adafruit_fingerprint.OK:
            return None
        if self.finger.finger_search() != adafruit_fingerprint.OK:
            return None
        return self.finger.finger_id

    def enroll(self, template_id: int) -> bool:
        """Enroll a new fingerprint at slot `template_id`. Used during registration."""
        for fingerimg in (1, 2):
            print(f"Place finger ({'first' if fingerimg == 1 else 'again'})")
            while self.finger.get_image() != adafruit_fingerprint.OK:
                pass
            if self.finger.image_2_tz(fingerimg) != adafruit_fingerprint.OK:
                return False
            if fingerimg == 1:
                print("Remove finger")
                while self.finger.get_image() != adafruit_fingerprint.NOFINGER:
                    pass
        if self.finger.create_model() != adafruit_fingerprint.OK:
            return False
        return self.finger.store_model(template_id) == adafruit_fingerprint.OK
