import { Component, ElementRef, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

type EnrollState = "idle" | "waiting" | "done" | "failed";

@Component({
  selector: "app-new-user",
  template: `
    <div class="card">
      <h2>Register New User</h2>
      <p style="color:#718096;margin-top:-1rem;margin-bottom:1.5rem">
        Step 1: Fill in the user's details and click <strong>Create User</strong>.<br>
        Step 2: Enroll their biometrics by clicking the buttons below — each one activates the
        Raspberry Pi to capture face / fingerprint / RFID for this user.
      </p>

      <form (ngSubmit)="createUser()" #f="ngForm">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label>Full Name *</label>
            <input [(ngModel)]="user.name" name="name" required placeholder="John Doe" [disabled]="!!createdUser">
          </div>
          <div class="form-group">
            <label>Employee ID *</label>
            <input [(ngModel)]="user.employeeId" name="employeeId" required placeholder="EMP001" [disabled]="!!createdUser">
          </div>
          <div class="form-group">
            <label>Department</label>
            <input [(ngModel)]="user.department" name="department" placeholder="Engineering" [disabled]="!!createdUser">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input [(ngModel)]="user.email" name="email" type="email" placeholder="john@company.com" [disabled]="!!createdUser">
          </div>
        </div>

        <button type="submit" *ngIf="!createdUser" [disabled]="!f.valid">Create User</button>
      </form>

      <div *ngIf="createdUser">
        <div class="alert success">✅ User <strong>{{createdUser.name}}</strong> created. Now enroll biometrics:</div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem">
          <!-- FACE -->
          <div class="enroll-card">
            <div class="icon">📷</div>
            <h3>Face</h3>
            <p class="status" [class.done]="states.face==='done'" [class.failed]="states.face==='failed'">
              {{statusLabel('face')}}
            </p>
            <button (click)="enroll('face')" [disabled]="states.face==='waiting'">
              {{states.face==='done' ? 'Re-capture' : 'Activate Pi Camera'}}
            </button>
          </div>

          <!-- FINGER -->
          <div class="enroll-card">
            <div class="icon">👆</div>
            <h3>Fingerprint</h3>
            <p class="status" [class.done]="states.finger==='done'" [class.failed]="states.finger==='failed'">
              {{statusLabel('finger')}}
            </p>
            <button (click)="enroll('finger')" [disabled]="states.finger==='waiting'">
              {{states.finger==='done' ? 'Re-scan' : 'Activate Pi Sensor'}}
            </button>
          </div>

          <!-- RFID -->
          <div class="enroll-card">
            <div class="icon">💳</div>
            <h3>RFID Card</h3>
            <p class="status" [class.done]="states.rfid==='done'" [class.failed]="states.rfid==='failed'">
              {{statusLabel('rfid')}}
            </p>
            <button (click)="enroll('rfid')" [disabled]="states.rfid==='waiting'">
              {{states.rfid==='done' ? 'Re-tap' : 'Activate Pi Reader'}}
            </button>
          </div>
        </div>

        <div style="margin-top:2rem;display:flex;gap:0.5rem">
          <button class="secondary" (click)="reset()">Register Another User</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enroll-card {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
    }
    .enroll-card .icon { font-size: 2.5rem; }
    .enroll-card h3 { margin: 0.5rem 0; color: #2d3748; }
    .enroll-card .status { color: #718096; font-size: 0.85rem; min-height: 2.5em; }
    .enroll-card .status.done { color: #22543d; font-weight: 600; }
    .enroll-card .status.failed { color: #c53030; font-weight: 600; }
  `],
})
export class NewUserComponent {
  user: any = {};
  createdUser: any = null;
  states: Record<string, EnrollState> = { face: "idle", finger: "idle", rfid: "idle" };
  jobIds: Record<string, number | null> = { face: null, finger: null, rfid: null };
  values: Record<string, any> = {};

  constructor(private http: HttpClient) {}

  createUser() {
    this.http.post(`${API}/users`, this.user).subscribe({
      next: (u: any) => { this.createdUser = u; },
      error: (e) => alert("Error: " + (e.error?.error || e.message)),
    });
  }

  enroll(type: "face" | "finger" | "rfid") {
    this.states[type] = "waiting";
    this.http.post<any>(`${API}/enroll/request`, { type }).subscribe({
      next: (job) => {
        this.jobIds[type] = job.id;
        this.pollJob(type, job.id);
      },
      error: () => { this.states[type] = "failed"; },
    });
  }

  pollJob(type: string, id: number) {
    const iv = setInterval(() => {
      this.http.get<any>(`${API}/enroll/status/${id}`).subscribe({
        next: (s) => {
          if (s.status === "done") {
            clearInterval(iv);
            this.values[type] = s.value;
            this.states[type] = "done";
            this.attachToUser(type, s.value, s.slot);
          } else if (s.status === "failed" || s.status === "cancelled") {
            clearInterval(iv);
            this.states[type] = "failed";
          }
        },
        error: () => { clearInterval(iv); this.states[type] = "failed"; },
      });
    }, 1500);
    // 60s timeout
    setTimeout(() => {
      if (this.states[type] === "waiting") {
        clearInterval(iv);
        this.states[type] = "failed";
      }
    }, 60000);
  }

  attachToUser(type: string, value: any, slot: number | null) {
    const upd: any = {};
    if (type === "rfid") upd.rfid = value;
    if (type === "finger") upd.fingerId = slot;
    if (type === "face") upd.faceImageBase64 = value;
    this.http.put(`${API}/users/${this.createdUser._id}`, upd).subscribe();
  }

  statusLabel(type: string): string {
    const s = this.states[type];
    if (s === "idle")    return "Not enrolled";
    if (s === "waiting") return "⏳ Waiting for Pi...";
    if (s === "done")    return "✅ Enrolled" + (type === "rfid" && this.values[type] ? ` (${this.values[type]})` : "");
    return "❌ Failed or timed out";
  }

  reset() {
    this.user = {};
    this.createdUser = null;
    this.states = { face: "idle", finger: "idle", rfid: "idle" };
    this.values = {};
  }
}
