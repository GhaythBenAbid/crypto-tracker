import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() { }

  setCache(key: string, data: any): void {
    const item = {
      data,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  getCache(key: string): any {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsedItem = JSON.parse(item);
    const now = new Date().getTime();

    // Check if cache is expired
    if (now - parsedItem.timestamp > this.CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedItem.data;
  }

  clearCache(key?: string): void {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  }
} 