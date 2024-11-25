import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CryptoListComponent } from './crypto-list/crypto-list.component';
import { HomePageComponent } from './home-page/home-page.component';
import { CryptoDetailsComponent } from './crypto-details/crypto-details.component';

@NgModule({
  declarations: [
    AppComponent,
    CryptoListComponent,
    HomePageComponent,
    CryptoDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
