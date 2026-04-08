import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { NewUserComponent } from "./pages/new-user/new-user.component";
import { DataStorageComponent } from "./pages/data-storage/data-storage.component";
import { DataLoggingComponent } from "./pages/data-logging/data-logging.component";
import { SettingsComponent } from "./pages/settings/settings.component";

@NgModule({
  declarations: [
    AppComponent,
    NewUserComponent,
    DataStorageComponent,
    DataLoggingComponent,
    SettingsComponent,
  ],
  imports: [BrowserModule, FormsModule, HttpClientModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
