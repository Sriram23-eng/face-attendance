import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { forkJoin } from "rxjs";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-data-logging",
  template: `
    <div class="card">
      <h2>Today's Working Hours</h2>
      <table>
        <thead><tr><th>Employee</th><th>First In</th><th>Last Out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>
          <tr *ngFor="let h of hoursToday">
            <td><strong>{{h.user.employeeId}}</strong> — {{h.user.name}}</td>
            <td>{{h.firstIn ? (h.firstIn | date:'shortTime') : '-'}}</td>
            <td>{{h.lastOut && h.scans > 1 ? (h.lastOut | date:'shortTime') : '-'}}</td>
            <td><strong>{{h.hours}} hrs</strong></td>
            <td>
              <span *ngIf="h.present" style="background:#c6f6d5;color:#22543d;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.85rem">Present</span>
              <span *ngIf="!h.present" style="background:#fed7d7;color:#742a2a;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.85rem">Absent</span>
            </td>
          </tr>
          <tr *ngIf="hoursToday.length === 0">
            <td colspan="5" style="text-align:center;color:#a0aec0;padding:2rem">No users registered yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Recent Scans</h2>
      <table>
        <thead><tr><th>Time</th><th>User</th><th>Method</th><th>In/Out</th><th>Device</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of records">
            <td>{{r.timestamp | date:'short'}}</td>
            <td>{{r.userId?.name || '-'}} ({{r.userId?.employeeId || '-'}})</td>
            <td><span style="background:#e9d8fd;color:#553c9a;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.85rem">{{r.method}}</span></td>
            <td>
              <span [style.background]="r.type==='in'?'#c6f6d5':'#fed7d7'"
                    [style.color]="r.type==='in'?'#22543d':'#742a2a'"
                    style="padding:0.2rem 0.6rem;border-radius:12px;font-size:0.85rem;text-transform:uppercase">
                {{r.type || 'in'}}
              </span>
            </td>
            <td>{{r.deviceId || '-'}}</td>
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
  hoursToday: any[] = [];
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>(`${API}/attendance`).subscribe((r) => (this.records = r));
    this.loadHours();
  }

  loadHours() {
    this.http.get<any[]>(`${API}/users`).subscribe((users) => {
      if (users.length === 0) return;
      const reqs = users.map((u) =>
        this.http.get<any>(`${API}/attendance/hours/${u._id}`)
      );
      forkJoin(reqs).subscribe((results) => {
        this.hoursToday = users.map((u, i) => ({ user: u, ...results[i] }));
      });
    });
  }
}
