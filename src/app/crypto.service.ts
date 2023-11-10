// src/app/crypto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable , map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
  private marketChartBaseUrl = 'https://api.coingecko.com/api/v3/coins';


  constructor(private http: HttpClient) {}

  getAllCryptos(): Observable<any[]> {
    const params = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      // per_page: '40', 
      // page: '1',
      // sparkline: 'false',
    };

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getCryptoById(id: string): Observable<any> {
    const params = {
      vs_currency: 'usd',
      ids: id,
      order: 'market_cap_desc',
      sparkline: 'false',
    };

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((cryptoDetails) => {
        return cryptoDetails[0];
      })
    );
  }

  getCryptoMarketChart(id: string, days: number, interval: string): Observable<any> {
    const params = {
      vs_currency: 'usd',
      days: days.toString(),
      interval,
    };

    const marketChartUrl = `${this.marketChartBaseUrl}/${id}/market_chart`;

    return this.http.get<any>(marketChartUrl, { params });
  }
}
