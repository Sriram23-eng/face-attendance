import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-settings",
  template: `
    <h2>Section 4 — Date / Time / Schedule</h2>
    <div *ngIf="s">
      <label>Morning attendance start <input [(ngModel)]="s.morningStart"></label><br>
      <label>Morning attendance end (cutoff) <input [(ngModel)]="s.morningEnd"></label><br>
      <label>Return start <input [(ngModel)]="s.returnStart"></label><br>
      <label>Return end <input [(ngModel)]="s.returnEnd"></label><br>
      <p>Working days (0=Sun..6=Sat): {{s.workingDays.join(', ')}}</p>
      <label>Holidays (comma-separated YYYY-MM-DD):
        <input [ngModel]="s.holidays.join(',')" (ngModelChange)="s.holidays=$event.split(',')">
      </label><br>
      <button (click)="save()">Save</button>
      <p *ngIf="msg">{{msg}}</p>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  s: any;
  msg = "";
  constructor(private http: HttpClient) {}
  ngOnInit() { this.http.get(`${API}/settings`).subscribe((d) => (this.s = d)); }
  save() {
    this.http.put(`${API}/settings`, this.s).subscribe(() => (this.msg = "Saved"));
  }
}
