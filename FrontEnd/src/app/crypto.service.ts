import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CacheService } from './services/cache.service';
import { CryptoListItem, CryptoDetail } from './interfaces/crypto.interface';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getAllCryptos(): Observable<CryptoListItem[]> {
    const cachedData = this.cacheService.getCache('all_cryptos');
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<CryptoListItem[]>(`${this.baseUrl}/cryptos`).pipe(
      map(data => data.map(crypto => ({
        ...crypto,
        current_price: Number(crypto.current_price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        }),
        market_cap: Number(crypto.market_cap).toLocaleString('en-US'),
        total_volume: Number(crypto.total_volume).toLocaleString('en-US')
      }))),
      tap(data => this.cacheService.setCache('all_cryptos', data))
    );
  }

  getCoinDetails(coinId: string): Observable<CryptoDetail> {
    const cacheKey = `coin_details_${coinId}`;
    const cachedData = this.cacheService.getCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<CryptoDetail>(`${this.baseUrl}/crypto/${coinId}`).pipe(
      map(data => ({
        ...data,
        market_data: {
          ...data.market_data,
          current_price: {
            usd: Number(data.market_data.current_price.usd)
          },
          market_cap: {
            usd: Number(data.market_data.market_cap.usd)
          },
          total_volume: {
            usd: Number(data.market_data.total_volume.usd)
          }
        }
      })),
      tap(data => this.cacheService.setCache(cacheKey, data))
    );
  }

  getCoinHistory(coinId: string, days: number = 365): Observable<any> {
    const cacheKey = `coin_history_${coinId}_${days}`;
    const cachedData = this.cacheService.getCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get(`${this.baseUrl}/crypto/${coinId}/history`, {
      params: { days: days.toString() }
    }).pipe(
      map(data => {
        if (!data || !Array.isArray((data as any).prices)) {
          throw new Error('Invalid historical data format');
        }
        return data;
      }),
      tap(data => this.cacheService.setCache(cacheKey, data)),
      catchError(error => {
        console.error('Error fetching historical data:', error);
        throw error;
      })
    );
  }

  compareCoins(coinId1: string, coinId2: string): Observable<any> {
    const cacheKey = `compare_${coinId1}_${coinId2}`;
    const cachedData = this.cacheService.getCache(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get(`${this.baseUrl}/crypto/compare/${coinId1}/${coinId2}`)
      .pipe(
        tap(data => this.cacheService.setCache(cacheKey, data)),
        catchError(error => {
          console.error('Error in compareCoins:', error);
          throw error;
        })
      );
  }

  getCoins(): Observable<CryptoListItem[]> {
    return this.getAllCryptos();
  }
}