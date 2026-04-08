import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "http://localhost:5000/api";

@Component({
  selector: "app-data-logging",
  template: `
    <h2>Section 3 — Attendance Logs</h2>
    <label>Search by Employee ID:
      <input [(ngModel)]="search" (keyup.enter)="searchUser()">
    </label>
    <button (click)="searchUser()">Search</button>

    <div *ngIf="summary">
      <h3>{{summary.userId?.name}} ({{summary.userId?.employeeId}})</h3>
      <p>Working days: {{summary.workingDays}} |
         Present: <strong style="color:green">{{summary.present}}</strong> |
         Absent: <strong style="color:red">{{summary.absent}}</strong></p>
    </div>

    <h3>All recent scans</h3>
    <table border="1" cellpadding="6" style="border-collapse:collapse">
      <thead><tr><th>Time</th><th>User</th><th>Method</th><th>Device</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of records">
          <td>{{r.timestamp | date:'short'}}</td>
          <td>{{r.userId?.name}} ({{r.userId?.employeeId}})</td>
          <td>{{r.method}}</td>
          <td>{{r.deviceId}}</td>
        </tr>
      </tbody>
    </table>
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
      if (!u) { this.summary = null; return; }
      this.http.get(`${API}/attendance/summary/${u._id}`).subscribe((s: any) => {
        s.userId = u;
        this.summary = s;
      });
    });
  }
}
