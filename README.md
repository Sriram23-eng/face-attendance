# Attendance Monitoring System

Three-way attendance system (Face + Fingerprint + RFID) using Raspberry Pi 3 Model B,
with a MEAN-stack web dashboard for user management and attendance logs.

## Folder Layout

```
face attendance/
├── hardware/      # Python code that runs ON the Raspberry Pi
├── backend/       # Node.js + Express + MongoDB REST API
└── frontend/      # Angular dashboard (4 sections on one page)
```

## Quick Start

### 1. Backend (run on your laptop / cloud server)
```bash
cd backend
cp .env.example .env        # edit Mongo URI
npm install
npm start                   # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
ng serve --host 0.0.0.0     # http://localhost:4200
```

### 3. Hardware (on Raspberry Pi 3 Model B)
```bash
# Copy this whole folder to the Pi:
scp -r "face attendance" pi@<pi-ip>:~

# On the Pi:
cd ~/"face attendance"/hardware
sudo apt update
sudo apt install -y python3-pip python3-opencv libatlas-base-dev
pip3 install -r requirements.txt

# Edit config.py — set BACKEND_URL to your server's IP
nano config.py

# Run
python3 main.py

# Or install as a service so it auto-starts on boot:
sudo cp attendance.service /etc/systemd/system/
sudo systemctl enable attendance
sudo systemctl start attendance
```

## Answers to Your Doubts

| Question | Answer |
|---|---|
| Do all three modules work on one Raspberry Pi? | Yes. Pi 3B has enough GPIO + USB + CSI for all three. See `hardware/wiring.md`. |
| Is Python suitable? | Yes — best language for Pi GPIO + OpenCV. |
| Is the website connected to the hardware? | Yes — Pi calls the backend REST API over Wi-Fi/Ethernet. |
| Which software to dump code? | None — Pi is a full Linux computer. Just `scp` files and run `python3 main.py`. Use VS Code Remote-SSH for editing. |
| Is Pi software needed? | Yes — flash **Raspberry Pi OS (64-bit)** to the SD card using **Raspberry Pi Imager**. |
| One SD card or two? | **One 32 GB SD card is enough.** It holds the OS + code + local SQLite cache + face images. The cloud DB is the master copy. |
| Database? | **MongoDB** (MEAN stack). Local SQLite on the Pi is used as an offline cache so attendance still works if Wi-Fi drops. |

## How it works (data flow)

```
[New User Registration on Website]
        │
        ▼
   Backend (Express) ──► MongoDB ──► Pi pulls user data on boot / on change
        ▲                                       │
        │                                       ▼
        │                              [Face / Finger / RFID Scan]
        │                                       │
        └───── POST /api/attendance ◄───────────┘
```

Any one of the three modules can mark attendance. If two scans happen
simultaneously, only the first is logged (de-dup window: 60 seconds).
