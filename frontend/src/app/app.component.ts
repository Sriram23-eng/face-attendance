import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <nav class="navbar">
      <span class="brand">📸 Attendance System</span>
      <a (click)="tab='new'"      [class.active]="tab==='new'">Register User</a>
      <a (click)="tab='store'"    [class.active]="tab==='store'">Users</a>
      <a (click)="tab='log'"      [class.active]="tab==='log'">Attendance Logs</a>
      <a (click)="tab='settings'" [class.active]="tab==='settings'">Settings</a>
    </nav>
    <main>
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
