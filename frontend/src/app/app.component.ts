import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <nav style="display:flex;gap:1rem;padding:1rem;background:#222;color:#fff">
      <strong>Attendance Monitoring</strong>
      <a (click)="tab='new'"     [style.fontWeight]="tab==='new'?'bold':'normal'"     style="cursor:pointer">New User</a>
      <a (click)="tab='store'"   [style.fontWeight]="tab==='store'?'bold':'normal'"   style="cursor:pointer">Data Storage</a>
      <a (click)="tab='log'"     [style.fontWeight]="tab==='log'?'bold':'normal'"     style="cursor:pointer">Data Logging</a>
      <a (click)="tab='settings'"[style.fontWeight]="tab==='settings'?'bold':'normal'"style="cursor:pointer">Settings</a>
    </nav>
    <main style="padding:1.5rem;font-family:sans-serif">
      <app-new-user      *ngIf="tab==='new'"></app-new-user>
      <app-data-storage  *ngIf="tab==='store'"></app-data-storage>
      <app-data-logging  *ngIf="tab==='log'"></app-data-logging>
      <app-settings      *ngIf="tab==='settings'"></app-settings>
    </main>
  `,
})
export class AppComponent {
  tab: "new" | "store" | "log" | "settings" = "new";
}
