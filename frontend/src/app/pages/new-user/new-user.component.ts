import { Component, ElementRef, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-new-user",
  template: `
    <div class="card">
      <h2>Register New User</h2>
      <p style="color:#718096;margin-top:-1rem;margin-bottom:1.5rem">
        Add a new employee to the attendance system. Capture their face from webcam, or let the
        Raspberry Pi camera enroll them later.
      </p>

      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-group">
          <label>Full Name *</label>
          <input [(ngModel)]="user.name" name="name" required placeholder="John Doe">
        </div>

        <div class="form-group">
          <label>Employee ID *</label>
          <input [(ngModel)]="user.employeeId" name="employeeId" required placeholder="EMP001">
        </div>

        <div class="form-group">
          <label>Department</label>
          <input [(ngModel)]="user.department" name="department" placeholder="Engineering">
        </div>

        <div class="form-group">
          <label>Email</label>
          <input [(ngModel)]="user.email" name="email" type="email" placeholder="john@company.com">
        </div>

        <div class="form-group">
          <label>RFID Card Number (optional)</label>
          <input [(ngModel)]="user.rfid" name="rfid" placeholder="Tap card on Pi or enter manually">
        </div>

        <div class="form-group">
          <label>Fingerprint Slot ID (optional)</label>
          <input [(ngModel)]="user.fingerId" name="fingerId" type="number" placeholder="1-200">
        </div>

        <div class="form-group">
          <label>Face Photo</label>
          <div class="webcam-box">
            <video #video *ngIf="!captured" autoplay playsinline></video>
            <img *ngIf="captured" [src]="captured" alt="Captured face">
            <div style="display:flex;gap:0.5rem">
              <button type="button" *ngIf="!cameraOn" (click)="startCamera()">📷 Start Camera</button>
              <button type="button" *ngIf="cameraOn && !captured" (click)="capture()">📸 Capture</button>
              <button type="button" *ngIf="captured" class="secondary" (click)="retake()">🔄 Retake</button>
            </div>
          </div>
        </div>

        <button type="submit" [disabled]="!f.valid">Register User</button>
        <div *ngIf="msg" class="alert" [class.success]="!isError" [class.error]="isError">{{msg}}</div>
      </form>
    </div>
  `,
})
export class NewUserComponent {
  @ViewChild("video") videoEl!: ElementRef<HTMLVideoElement>;
  user: any = {};
  cameraOn = false;
  captured: string | null = null;
  msg = "";
  isError = false;
  stream?: MediaStream;

  constructor(private http: HttpClient) {}

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.cameraOn = true;
      setTimeout(() => { if (this.videoEl) this.videoEl.nativeElement.srcObject = this.stream!; }, 100);
    } catch (e) {
      this.msg = "Camera access denied or not available";
      this.isError = true;
    }
  }

  capture() {
    const video = this.videoEl.nativeElement;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    this.captured = canvas.toDataURL("image/jpeg");
    this.stream?.getTracks().forEach((t) => t.stop());
    this.cameraOn = false;
  }

  retake() {
    this.captured = null;
    this.startCamera();
  }

  submit() {
    const fd = new FormData();
    Object.entries(this.user).forEach(([k, v]) => fd.append(k, v as any));
    if (this.captured) {
      const blob = this.dataURLtoBlob(this.captured);
      fd.append("faceImage", blob, "face.jpg");
    }
    this.http.post(`${API}/users`, fd).subscribe({
      next: () => {
        this.msg = "✅ User registered successfully";
        this.isError = false;
        this.user = {};
        this.captured = null;
      },
      error: (e) => { this.msg = "❌ Error: " + (e.error?.error || e.message); this.isError = true; },
    });
  }

  dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bin = atob(arr[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }
}
