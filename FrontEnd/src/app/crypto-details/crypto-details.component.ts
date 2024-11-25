import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from '../crypto.service';
import Chart from 'chart.js/auto';
import { CryptoDetail, CryptoListItem } from '../interfaces/crypto.interface';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-crypto-details',
  templateUrl: './crypto-details.component.html',
  styleUrls: ['./crypto-details.component.css']
})
export class CryptoDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('priceChart') priceChart!: ElementRef;
  @ViewChild('comparisonChart') comparisonChart!: ElementRef;

  coinData: CryptoDetail | null = null;
  historicalData: any;
  priceChartInstance: any;
  comparisonChartInstance: any;
  selectedComparisonCoin: string = '';
  availableCoins: any[] = [];
  comparisonData: any;
  chartInitialized: boolean = false;
  dataLoaded: boolean = false;
  private destroy$ = new Subject<void>();

  private chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e5e5'  // Light text for dark theme
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'  // Subtle grid lines
        },
        ticks: {
          color: '#e5e5e5'  // Light text for dark theme
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'  // Subtle grid lines
        },
        ticks: {
          color: '#e5e5e5'  // Light text for dark theme
        }
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private cryptoService: CryptoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['id']) {
        this.loadData(params['id']);
      }
    });
  }

  ngAfterViewInit() {
    this.chartInitialized = true;
    if (this.dataLoaded && this.historicalData?.prices) {
      this.createPriceChart();
    }
  }

  ngOnDestroy() {
    if (this.priceChartInstance) {
      this.priceChartInstance.destroy();
    }
    if (this.comparisonChartInstance) {
      this.comparisonChartInstance.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(coinId: string) {
    forkJoin({
      details: this.cryptoService.getCoinDetails(coinId),
      history: this.cryptoService.getCoinHistory(coinId),
      coins: this.cryptoService.getCoins()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.coinData = data.details;
        this.historicalData = data.history;
        this.availableCoins = data.coins;
        this.dataLoaded = true;

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (this.chartInitialized && this.historicalData?.prices) {
            this.createPriceChart();
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error loading data:', error);
      }
    });
  }

  createPriceChart() {
    if (!this.historicalData?.prices?.length || !this.priceChart?.nativeElement) {
      console.log('Missing data or chart element');
      return;
    }

    try {
      const ctx = this.priceChart.nativeElement.getContext('2d');
      
      if (this.priceChartInstance) {
        this.priceChartInstance.destroy();
      }

      const prices = this.historicalData.prices;
      const dates = prices.map((price: any[]) => {
        const date = new Date(price[0]);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      });
      const values = prices.map((price: any[]) => price[1]);

      const minPrice = Math.min(...values);
      const maxPrice = Math.max(...values);
      const priceMargin = (maxPrice - minPrice) * 0.1;

      this.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Price (USD)',
            data: values,
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          ...this.chartOptions,
          scales: {
            x: {
              ...this.chartOptions.scales.x,
              ticks: {
                color: '#e5e5e5',
                maxTicksLimit: 8
              }
            },
            y: {
              ...this.chartOptions.scales.y,
              min: minPrice - priceMargin,
              max: maxPrice + priceMargin,
              ticks: {
                color: '#e5e5e5',
                callback: function(value) {
                  return '$' + Number(value).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                }
              }
            }
          },
          plugins: {
            ...this.chartOptions.plugins,
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += '$' + context.parsed.y.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                  }
                  return label;
                }
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    } catch (error) {
      console.error('Error creating price chart:', error);
    }
  }

  compareCoins() {
    if (!this.selectedComparisonCoin) return;
    
    const currentCoinId = this.route.snapshot.paramMap.get('id');
    if (currentCoinId) {
        // Create a loading indicator
        let loadingDiv: HTMLDivElement;
        const comparisonContainer = document.querySelector('#comparison-container');
        
        if (comparisonContainer) {
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'text-center py-4';
            loadingDiv.innerHTML = 'Loading comparison data...';
            comparisonContainer.appendChild(loadingDiv);

            // Scroll to comparison section
            comparisonContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
        }

        this.cryptoService.compareCoins(currentCoinId, this.selectedComparisonCoin)
            .subscribe({
                next: (data) => {
                    console.log('Received comparison data:', data);
                    this.comparisonData = data;
                    
                    // Ensure we have the comparison chart container
                    setTimeout(() => {
                        this.createComparisonChart();
                        // Remove loading message if it exists
                        if (loadingDiv) {
                            loadingDiv.remove();
                        }
                    }, 0);
                },
                error: (error) => {
                    console.error('Error comparing coins:', error);
                    if (loadingDiv) {
                        loadingDiv.innerHTML = 'Error loading comparison data. Please try again.';
                    }
                }
            });
    }
  }

  createComparisonChart() {
    const ctx = this.comparisonChart.nativeElement.getContext('2d');
    
    if (this.comparisonChartInstance) {
      this.comparisonChartInstance.destroy();
    }

    // Add console logs for debugging
    console.log('Comparison Data:', this.comparisonData);

    this.comparisonChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.comparisonData.dates,
        datasets: [
          {
            label: this.comparisonData.coin1Name,
            data: this.comparisonData.coin1Prices,
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderWidth: 2,
            tension: 0.4
          },
          {
            label: this.comparisonData.coin2Name,
            data: this.comparisonData.coin2Prices,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderWidth: 2,
            tension: 0.4
          }
        ]
      },
      options: {
        ...this.chartOptions,
        plugins: {
          ...this.chartOptions.plugins,
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        hover: {
          mode: 'nearest',
          intersect: true
        }
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/default-crypto.png';
  }
} 