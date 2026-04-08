# Cloud Deployment Guide

This guide deploys the **backend** to **Render** (free) with **MongoDB Atlas** (free) as the database, and points the **Raspberry Pi** at the resulting public HTTPS URL.

After deployment you'll be able to:
- Open the dashboard from **anywhere** in the world via the public URL
- Have the Raspberry Pi run **anywhere** with internet — it will mark attendance to the same backend
- Update users / settings remotely; the Pi syncs every 60 seconds automatically

---

## Step 1 — Create a free MongoDB Atlas database (3 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up.
2. Create a **free M0 cluster** (any region near you).
3. **Database Access** → Add Database User
   - Username: `attendx`
   - Password: generate a strong one and **copy it**
4. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`).
   *(Required because Render's IPs change.)*
5. **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://attendx:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password you copied in step 3, and add the database name `attendance` after the slash:
   ```
   mongodb+srv://attendx:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/attendance?retryWrites=true&w=majority
   ```
   **Save this string — you'll paste it into Render.**

---

## Step 2 — Push the project to GitHub

```bash
cd "/home/sriram/Documents/face attendance"
git init
git add .
git commit -m "Initial attendance system"
```

Then go to https://github.com/new, create an empty repository (e.g. `face-attendance`), and follow the "push an existing repository" instructions. Roughly:

```bash
git remote add origin https://github.com/YOUR-USERNAME/face-attendance.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy to Render (free)

1. Sign up at https://render.com (use your GitHub account — easiest).
2. Click **New +** → **Web Service**.
3. **Connect** your `face-attendance` repository.
4. Fill the form:
   - **Name**: `attendx-backend` (or anything)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**
5. Scroll to **Environment Variables** → click **Add Environment Variable**:
   - Key: `MONGO_URI`
   - Value: *(paste the MongoDB Atlas string from Step 1)*
6. Click **Create Web Service**.

Render will install dependencies and deploy. After ~2 minutes you'll get a public URL like:
```
https://attendx-backend.onrender.com
```

**Open it in a browser.** You should see the AttendX dashboard. Try registering a user — the camera should work (HTTPS makes browser webcam available).

> **Note about Render's free tier:** the service goes to sleep after 15 minutes of inactivity and takes ~30 seconds to wake on the next request. Data persists in MongoDB Atlas, so nothing is lost. The Pi's polling will keep it awake during working hours.

---

## Step 4 — Point the Raspberry Pi at the cloud

On the Pi:

```bash
# 1. Copy the project to the Pi (from your laptop)
scp -r "/home/sriram/Documents/face attendance" pi@<pi-ip>:~

# 2. SSH in
ssh pi@<pi-ip>

# 3. One-time setup
cd ~/"face attendance"/hardware
sudo apt update
sudo apt install -y python3-pip python3-picamera2 python3-libcamera \
                    python3-opencv libatlas-base-dev
pip3 install -r requirements.txt

# 4. Enable interfaces
sudo raspi-config
#  Interface Options →
#    Camera → Enable
#    SPI    → Enable
#    I2C    → Enable
#    Serial → "No" login shell, "Yes" hardware
sudo reboot

# 5. Edit the backend URL
nano config.py
#   BACKEND_URL = "https://attendx-backend.onrender.com"   ← your Render URL
```

Run it:
```bash
python3 main.py
```

You should see:
```
== Attendance Monitoring System ==
[sync] 0 users updated
[face] loaded 0 known faces
```

Now register a user from the dashboard (browser anywhere in the world). Within 60 seconds the Pi will sync the new user and start recognizing them.

### Auto-start on boot

```bash
sudo cp attendance.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable attendance
sudo systemctl start attendance
sudo journalctl -u attendance -f      # watch live logs
```

---

## Step 5 — Test the full flow

1. Open your Render URL → register a new user:
   - Click **📷 Open Camera** → snap a photo of yourself
   - Click **💳 RFID Card** → tap an RFID card on the Pi (anywhere in the world) → UID appears in the form
   - Click **👆 Fingerprint** → place finger on the Pi → slot id appears
   - Fill name + employee ID → **Register User**
2. Wait 60 seconds for the Pi to sync.
3. Walk past the Pi camera → green LED + LCD says "Hi <Your Name>"
4. Refresh the dashboard → **Logs** tab → your attendance scan is there.

---

## Architecture (deployed)

```
        ┌─────────────────────────┐
        │  Anywhere in the world  │
        │  (Browser dashboard)    │
        └──────────┬──────────────┘
                   │ HTTPS
                   ▼
   ┌───────────────────────────────┐       ┌────────────────────┐
   │  Render (free web service)    │ ◄──── │  MongoDB Atlas     │
   │  https://attendx.onrender.com │       │  (free M0 cluster) │
   │  - Express API                │       │  - Users           │
   │  - Static dashboard           │       │  - Attendance      │
   │  - Enrollment queue           │       │  - Settings        │
   └───────────────┬───────────────┘       └────────────────────┘
                   │ HTTPS
                   ▼
        ┌─────────────────────────┐
        │  Raspberry Pi 3B        │
        │  (anywhere with WiFi)   │
        │  - CSI camera (face)    │
        │  - Fingerprint sensor   │
        │  - RFID RC522           │
        │  - LCD + LEDs           │
        │  - Offline cache        │
        └─────────────────────────┘
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Render build fails: "MONGO_URI is not set" | Add the env var in Render → Environment tab, then redeploy |
| Atlas auth error: "bad auth" | Wrong password in connection string — replace `<password>` with the actual password |
| Atlas error: "IP not whitelisted" | Atlas → Network Access → Add `0.0.0.0/0` |
| Browser camera not opening | Make sure you're using the **HTTPS** Render URL, not `http://` |
| Pi error: "ModuleNotFoundError: picamera2" | `sudo apt install -y python3-picamera2` (don't pip install it) |
| Pi error: "No module named adafruit_fingerprint" | `pip3 install adafruit-circuitpython-fingerprint` |
| Render says the app is sleeping | Free tier: 15-min idle timeout. Visit the URL or have the Pi poll to keep it awake. |
| Pi can't reach backend | Check `BACKEND_URL` in `config.py` uses **https://** and the correct subdomain |

---

## Updating the deployed code

Whenever you change anything in `backend/`:

```bash
git add .
git commit -m "describe the change"
git push
```

Render auto-detects the push and redeploys in ~2 minutes. The Pi doesn't need to restart — it just keeps polling and picks up the new behavior.
