import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-new-user",
  template: `
    <h2>Section 1 — Register New User</h2>
    <form (ngSubmit)="submit()" #f="ngForm" enctype="multipart/form-data">
      <div><label>Name <input [(ngModel)]="user.name" name="name" required></label></div>
      <div><label>Employee ID <input [(ngModel)]="user.employeeId" name="employeeId" required></label></div>
      <div><label>Department <input [(ngModel)]="user.department" name="department"></label></div>
      <div><label>Email <input [(ngModel)]="user.email" name="email" type="email"></label></div>

      <fieldset><legend>Face</legend>
        <input type="file" (change)="onFile($event)" accept="image/*">
      </fieldset>

      <fieldset><legend>RFID</legend>
        <input [(ngModel)]="user.rfid" name="rfid" placeholder="Tap card on enrollment reader">
      </fieldset>

      <fieldset><legend>Fingerprint</legend>
        <input [(ngModel)]="user.fingerId" name="fingerId" type="number"
               placeholder="Template slot id (1-200)">
      </fieldset>

      <button type="submit" [disabled]="!f.valid">Register</button>
      <p *ngIf="msg">{{msg}}</p>
    </form>
  `,
})
export class NewUserComponent {
  user: any = {};
  file?: File;
  msg = "";

  constructor(private http: HttpClient) {}

  onFile(e: any) { this.file = e.target.files[0]; }

  submit() {
    const fd = new FormData();
    Object.entries(this.user).forEach(([k, v]) => fd.append(k, v as any));
    if (this.file) fd.append("faceImage", this.file);
    this.http.post(`${API}/users`, fd).subscribe({
      next: () => { this.msg = "User registered"; this.user = {}; this.file = undefined; },
      error: (e) => { this.msg = "Error: " + e.error?.error; },
    });
  }
}
