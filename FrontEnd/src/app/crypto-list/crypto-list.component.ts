// src/app/crypto-list/crypto-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../crypto.service';

@Component({
  selector: 'app-crypto-list',
  templateUrl: './crypto-list.component.html',
  styleUrls: ['./crypto-list.component.css'],
})
export class CryptoListComponent implements OnInit {
  cryptos: any[] = [];
  filteredCryptos: any[] = [];
  searchTerm: string = '';

  constructor(private cryptoService: CryptoService) {}

  ngOnInit(): void {
    this.cryptoService.getAllCryptos().subscribe((data) => {
      this.cryptos = data.map((crypto) => ({
        ...crypto,
        bgColor: this.getRandomColor(),
      }));

      this.filteredCryptos = this.cryptos;
    });
  }

  private getRandomColor(): string {
    const colors = [
      'from-green-300 via-blue-500 to-purple-600',
      'from-yellow-300 via-red-500 to-pink-600',
      'from-indigo-300 via-teal-500 to-cyan-600',
      // Add more gradient colors as needed
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  filterCryptos(): void {
    this.filteredCryptos = this.cryptos.filter((crypto) =>
      crypto.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

}
