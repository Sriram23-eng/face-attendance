"""I2C 16x2 LCD wrapper."""
from RPLCD.i2c import CharLCD
import config


class LCD:
    def __init__(self):
        self.lcd = CharLCD(
            i2c_expander="PCF8574",
            address=config.LCD_I2C_ADDR,
            port=1,
            cols=config.LCD_COLS,
            rows=config.LCD_ROWS,
            charmap="A02",
            auto_linebreaks=True,
        )
        self.show("Attendance Sys", "Ready...")

    def show(self, line1: str, line2: str = ""):
        self.lcd.clear()
        self.lcd.write_string(line1[: config.LCD_COLS])
        if line2:
            self.lcd.crlf()
            self.lcd.write_string(line2[: config.LCD_COLS])

    def clear(self):
        self.lcd.clear()
