import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';

interface TrendingCrypto {
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  image: string;
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  animations: [
    trigger('slideInOut', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('closed => open', [
        animate('200ms ease-out')
      ]),
      transition('open => closed', [
        animate('150ms ease-in')
      ])
    ])
  ]
})
export class HomePageComponent implements OnInit {
  isMenuOpen = false;
  emailSubscription: string = '';
  trendingCryptos: TrendingCrypto[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTrendingCryptos();
  }

  fetchTrendingCryptos() {
    const url = 'https://api.coingecko.com/api/v3/coins/markets';
    const params = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: '4',
      page: '1',
      sparkline: 'false'
    };

    this.http.get(url, { params }).subscribe({
      next: (response: any) => {
        this.trendingCryptos = response.map((coin: any) => ({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price,
          priceChange: coin.price_change_percentage_24h,
          image: coin.image
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching crypto data:', error);
        this.isLoading = false;
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  subscribeNewsletter() {
    if (this.emailSubscription) {
      // Implement newsletter subscription logic
      console.log('Subscribed:', this.emailSubscription);
      this.emailSubscription = '';
      // Add proper API call and success/error handling
    }
  }
}
