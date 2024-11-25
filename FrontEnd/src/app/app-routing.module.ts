import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CryptoListComponent } from './crypto-list/crypto-list.component';
import { HomePageComponent } from './home-page/home-page.component';
import { CryptoDetailsComponent } from './crypto-details/crypto-details.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'cryptos', component: CryptoListComponent },
  { path: 'crypto/:id', component: CryptoDetailsComponent },
  { path: 'crypto-details/:id', redirectTo: 'crypto/:id', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
