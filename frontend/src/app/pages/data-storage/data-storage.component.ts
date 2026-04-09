import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";
const HOST = "https://face-attendance-chrs.onrender.com";

@Component({
  selector: "app-data-storage",
  template: `
    <div class="card">
      <h2>Registered Users</h2>
      <div class="stats">
        <div class="stat-card"><div class="label">Total Users</div><div class="value">{{users.length}}</div></div>
        <div class="stat-card green"><div class="label">With Face</div><div class="value">{{withFace()}}</div></div>
        <div class="stat-card"><div class="label">With RFID</div><div class="value">{{withRfid()}}</div></div>
      </div>

      <table>
        <thead>
          <tr><th>Photo</th><th>Emp ID</th><th>Name</th><th>Department</th><th>RFID</th><th>Finger</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of users">
            <td><img *ngIf="u.facePath" [src]="HOST + '/uploads/' + u.facePath" class="avatar"></td>
            <td><strong>{{u.employeeId}}</strong></td>
            <td>{{u.name}}</td>
            <td>{{u.department || '-'}}</td>
            <td>{{u.rfid || '-'}}</td>
            <td>{{u.fingerId ?? '-'}}</td>
            <td><button class="danger" (click)="remove(u._id)">Delete</button></td>
          </tr>
          <tr *ngIf="users.length === 0">
            <td colspan="7" style="text-align:center;color:#a0aec0;padding:2rem">No users registered yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class DataStorageComponent implements OnInit {
  users: any[] = [];
  HOST = HOST;
  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }
  load() { this.http.get<any[]>(`${API}/users`).subscribe((u) => (this.users = u)); }
  remove(id: string) {
    if (!confirm("Delete this user?")) return;
    this.http.delete(`${API}/users/${id}`).subscribe(() => this.load());
  }
  withFace() { return this.users.filter((u) => u.facePath).length; }
  withRfid() { return this.users.filter((u) => u.rfid).length; }
}
