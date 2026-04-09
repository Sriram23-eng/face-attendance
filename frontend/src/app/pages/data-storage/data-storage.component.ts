import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";
const HOST = "https://face-attendance-chrs.onrender.com";

@Component({
  selector: "app-data-storage",
  template: `
    <h2>Section 2 — Data Storage</h2>
    <p>Total users: <strong>{{users.length}}</strong></p>
    <table border="1" cellpadding="6" style="border-collapse:collapse">
      <thead>
        <tr><th>Emp ID</th><th>Name</th><th>RFID</th><th>Finger</th><th>Face</th><th></th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let u of users">
          <td>{{u.employeeId}}</td><td>{{u.name}}</td>
          <td>{{u.rfid || '-'}}</td><td>{{u.fingerId ?? '-'}}</td>
          <td><img *ngIf="u.facePath" [src]="HOST + '/uploads/' + u.facePath" width="40"></td>
          <td><button (click)="remove(u._id)">Delete</button></td>
        </tr>
      </tbody>
    </table>
  `,
})
export class DataStorageComponent implements OnInit {
  users: any[] = [];
  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }
  load() { this.http.get<any[]>(`${API}/users`).subscribe((u) => (this.users = u)); }
  remove(id: string) { this.http.delete(`${API}/users/${id}`).subscribe(() => this.load()); }
}
