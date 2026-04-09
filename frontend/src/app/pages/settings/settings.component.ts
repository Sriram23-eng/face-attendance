import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

const API = "https://face-attendance-chrs.onrender.com/api";

@Component({
  selector: "app-settings",
  template: `
    <div class="card">
      <h2>Schedule & Settings</h2>
      <div *ngIf="s">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label>Morning Start Time</label>
            <input [(ngModel)]="s.morningStart" placeholder="08:00">
          </div>
          <div class="form-group">
            <label>Morning Cutoff Time</label>
            <input [(ngModel)]="s.morningEnd" placeholder="09:30">
          </div>
          <div class="form-group">
            <label>Return Start Time</label>
            <input [(ngModel)]="s.returnStart" placeholder="13:00">
          </div>
          <div class="form-group">
            <label>Return End Time</label>
            <input [(ngModel)]="s.returnEnd" placeholder="14:00">
          </div>
        </div>

        <div class="form-group">
          <label>Working Days</label>
          <p style="color:#4a5568;margin:0">{{s.workingDays.join(', ')}} <span style="color:#a0aec0">(0=Sun, 6=Sat)</span></p>
        </div>

        <div class="form-group">
          <label>Holidays (comma-separated YYYY-MM-DD)</label>
          <input [ngModel]="s.holidays.join(',')" (ngModelChange)="s.holidays=$event.split(',')">
        </div>

        <button (click)="save()">💾 Save Settings</button>
        <div *ngIf="msg" class="alert success">{{msg}}</div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  s: any;
  msg = "";
  constructor(private http: HttpClient) {}
  ngOnInit() { this.http.get(`${API}/settings`).subscribe((d) => (this.s = d)); }
  save() {
    this.http.put(`${API}/settings`, this.s).subscribe(() => {
      this.msg = "✅ Settings saved";
      setTimeout(() => (this.msg = ""), 3000);
    });
  }
}
