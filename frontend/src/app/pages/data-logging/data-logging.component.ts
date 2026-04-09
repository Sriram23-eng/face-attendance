import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-data-logging",
  template: `
    <div class="card">
      <h2>Attendance Logs</h2>

      <div class="form-group" style="display:flex;gap:0.5rem;align-items:flex-end">
        <div style="flex:1">
          <label>Search by Employee ID</label>
          <input [(ngModel)]="search" (keyup.enter)="searchUser()" placeholder="EMP001">
        </div>
        <button (click)="searchUser()">Search</button>
      </div>

      <div *ngIf="summary" class="stats">
        <div class="stat-card">
          <div class="label">{{summary.userId?.name}}</div>
          <div class="value" style="font-size:1rem">{{summary.userId?.employeeId}}</div>
        </div>
        <div class="stat-card green">
          <div class="label">Present</div>
          <div class="value">{{summary.present}}</div>
        </div>
        <div class="stat-card red">
          <div class="label">Absent</div>
          <div class="value">{{summary.absent}}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Recent Scans</h2>
      <table>
        <thead><tr><th>Time</th><th>User</th><th>Employee ID</th><th>Method</th><th>Device</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of records">
            <td>{{r.timestamp | date:'short'}}</td>
            <td>{{r.userId?.name || '-'}}</td>
            <td>{{r.userId?.employeeId || '-'}}</td>
            <td><span style="background:#e9d8fd;color:#553c9a;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.85rem">{{r.method}}</span></td>
            <td>{{r.deviceId}}</td>
          </tr>
          <tr *ngIf="records.length === 0">
            <td colspan="5" style="text-align:center;color:#a0aec0;padding:2rem">No scans yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class DataLoggingComponent implements OnInit {
  records: any[] = [];
  search = "";
  summary: any = null;
  constructor(private http: HttpClient) {}
  ngOnInit() { this.http.get<any[]>(`${API}/attendance`).subscribe((r) => (this.records = r)); }

  searchUser() {
    this.http.get<any[]>(`${API}/users`).subscribe((users) => {
      const u = users.find((x) => x.employeeId === this.search);
      if (!u) { this.summary = null; alert("User not found"); return; }
      this.http.get(`${API}/attendance/summary/${u._id}`).subscribe((s: any) => {
        s.userId = u;
        this.summary = s;
      });
    });
  }
}
