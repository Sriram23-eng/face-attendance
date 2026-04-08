"""Red / Green status LEDs."""
import time
import RPi.GPIO as GPIO
import config


class LEDs:
    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(config.GREEN_LED_PIN, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(config.RED_LED_PIN,   GPIO.OUT, initial=GPIO.LOW)

    def success(self):
        GPIO.output(config.GREEN_LED_PIN, GPIO.HIGH)
        time.sleep(1.0)
        GPIO.output(config.GREEN_LED_PIN, GPIO.LOW)

    def fail(self):
        GPIO.output(config.RED_LED_PIN, GPIO.HIGH)
        time.sleep(1.0)
        GPIO.output(config.RED_LED_PIN, GPIO.LOW)

    def cleanup(self):
        GPIO.cleanup()
