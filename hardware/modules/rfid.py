"""RC522 RFID reader (SPI)."""
from mfrc522 import SimpleMFRC522


class RFIDReader:
    def __init__(self):
        self.reader = SimpleMFRC522()

    def read_nonblocking(self):
        """Returns the card UID as string, or None if no card present."""
        try:
            uid, _ = self.reader.READER.MFRC522_Anticoll()  # type: ignore
            if uid:
                return "".join(str(x) for x in uid)
        except Exception:
            return None
        return None
