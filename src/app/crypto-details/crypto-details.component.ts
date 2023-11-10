import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from '../crypto.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-crypto-details',
  templateUrl: './crypto-details.component.html',
  styleUrls: ['./crypto-details.component.css'],
})
export class CryptoDetailsComponent implements OnInit {
  cryptoId: string | null = null;
  cryptoDetails: any = {};
  public chart: any;
  public compareChart: any;
  selectedCompareCrypto: string | null = null;
  availableCryptos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private cryptoService: CryptoService
  ) {}

  ngOnInit(): void {
    this.cryptoService.getAllCryptos().subscribe((cryptos) => {
      this.availableCryptos = cryptos;
    });

    this.route.paramMap.subscribe((params) => {
      this.cryptoId = params.get('id');
      if (this.cryptoId) {
        this.loadCryptoDetails();
        this.loadCryptoMarketChart();
      }
    });
  }

  private loadCryptoDetails(): void {
    if (this.cryptoId) {
      this.cryptoService.getCryptoById(this.cryptoId).subscribe((details) => {
        this.cryptoDetails = details;
      });
    }
  }

  loadCryptoMarketChart(): void {
    if (this.cryptoId) {
      const days = 14;
      const interval = 'daily';

      // Load data for the default cryptocurrency
      this.cryptoService.getCryptoMarketChart(this.cryptoId, days, interval).subscribe((data) => {
        const timestamps = data.prices.map((point: any) => new Date(point[0]));
        const prices = data.prices.map((point: any) => point[1]);

        this.createProgressChart(timestamps, prices , null);

        // Load data for the selected cryptocurrency if selected
        if (this.selectedCompareCrypto) {
          console.log('selectedCompareCrypto', this.selectedCompareCrypto);
          this.cryptoService.getCryptoMarketChart(this.selectedCompareCrypto, days, interval).subscribe((compareData) => {
            const compareTimestamps = compareData.prices.map((point: any) => new Date(point[0]));
            const comparePrices = compareData.prices.map((point: any) => point[1]);

            this.createProgressChart(timestamps, prices , comparePrices);
          });
        }
      });
    }
  }

  // Function to update charts when the selected cryptocurrency changes
  updateCharts(): void {
    this.loadCryptoMarketChart();
  }

  private createProgressChart(timestamps: Date[], prices1: number[], prices2: number[] | null): void {
    // convert timestamps to strings
    const labels = timestamps.map((timestamp) => timestamp.toLocaleDateString());

    // Destroy the existing default chart if it exists
    if (this.chart) {
      this.chart.destroy();

    }

    // Create a new default chart
    this.chart = new Chart('MyChart', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: this.cryptoDetails.name || '',
            data: prices1,
            borderColor: '#3e95cd',
            fill: true,
            backgroundColor: 'rgba(62, 149, 205, 0.2)',
          },
          {
            label: this.selectedCompareCrypto || '',
            data: prices2,
            borderColor: '#8e5ea2',
            fill: true,
            backgroundColor: 'rgba(142, 94, 162, 0.2)',
          },
        ],
      },
      options: {
        aspectRatio: 2.5,
      },
    });
    //scroll to chart
    const element = document.querySelector('#MyChart');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

}