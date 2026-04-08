# Raspberry Pi 3 Model B — Wiring Guide

## Power
- Pi 3B needs **5V / 2.5A** via micro-USB.
- Use a **Buck converter** (e.g. LM2596) to step 12V → 5V if powering from a wall adapter through a barrel jack.
- All modules share GND with the Pi.

## Pin Map (BCM numbering)

| Module               | Pi Pin (BCM) | Pi Pin (Physical) | Notes |
|----------------------|--------------|-------------------|-------|
| **Camera (CSI)**     | CSI ribbon   | Camera port        | Enable via `sudo raspi-config` → Interface → Camera |
| **Fingerprint R307** | TXD=GPIO14, RXD=GPIO15 | 8, 10  | UART. Disable serial console: `sudo raspi-config` → Interface → Serial → No login, Yes hardware |
| **RFID RC522 (SPI)** | MOSI=10, MISO=9, SCK=11, SDA/CS=8, RST=25 | 19, 21, 23, 24, 22 | Enable SPI in raspi-config |
| **LCD 16x2 (I2C)**   | SDA=GPIO2, SCL=GPIO3 | 3, 5     | Enable I2C in raspi-config. I2C address usually 0x27 |
| **Green LED**        | GPIO23       | 16                 | Through 220Ω resistor to GND |
| **Red LED**          | GPIO24       | 18                 | Through 220Ω resistor to GND |
| **5V**               | —            | 2, 4               | To buck output / module VCC |
| **3.3V**             | —            | 1, 17              | RFID RC522 VCC (NOT 5V — it will burn) |
| **GND**              | —            | 6, 9, 14, 20, 25, 30, 34, 39 | Common ground |

## Power Tree
```
12V Adapter ──► Buck Converter ──► 5V rail ──┬── Pi 3B (micro-USB)
                                              ├── Fingerprint VCC (5V)
                                              └── LCD VCC (5V)
                                3.3V from Pi ──── RFID RC522 VCC
```

## Enable interfaces (one-time setup on the Pi)
```bash
sudo raspi-config
# Interface Options → enable: Camera, SPI, I2C, Serial Hardware (no login shell)
sudo reboot
```
