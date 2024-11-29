const express = require('express');
const router = express.Router();
const cache = require('../cache/cryptoCache');
const apiClient = require('../utils/apiClient');

// Helper function to format price with appropriate decimals
const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return numPrice > 1 ? numPrice.toFixed(2) : numPrice.toFixed(6);
};

// Helper function to format market data
const formatCryptoData = (ticker, symbolInfo) => {
    const baseAsset = symbolInfo?.baseAsset || ticker.symbol.replace('USDT', '');
    const priceChangePercent = parseFloat(ticker.priceChangePercent);
    const lowercaseSymbol = baseAsset.toLowerCase();
    
    return {
        id: lowercaseSymbol,
        symbol: baseAsset,
        name: symbolInfo?.baseAsset || baseAsset,
        current_price: formatPrice(ticker.lastPrice),
        market_cap: parseFloat(ticker.quoteVolume),
        total_volume: parseFloat(ticker.volume),
        price_change_24h: parseFloat(ticker.priceChange),
        price_change_percentage_24h: priceChangePercent,
        circulating_supply: parseFloat(ticker.volume),
        image: `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${lowercaseSymbol}.svg`,
        last_updated: new Date(ticker.closeTime).toISOString()
    };
};

// Define getCryptos function
const getCryptos = async (req, res) => {
    try {
        const cacheKey = 'all_cryptos';
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData);
        }

        // Get exchange information and 24hr ticker data
        const [exchangeInfo, tickers] = await Promise.all([
            apiClient.get('/exchangeInfo'),
            apiClient.get('/ticker/24hr')
        ]);

        // Create a map of symbol information
        const symbolsMap = {};
        exchangeInfo.data.symbols.forEach(symbol => {
            if (symbol.symbol.endsWith('USDT')) {
                symbolsMap[symbol.symbol] = {
                    baseAsset: symbol.baseAsset,
                    quoteAsset: symbol.quoteAsset,
                    status: symbol.status
                };
            }
        });

        // Filter and format the data
        const cryptos = tickers.data
            .filter(ticker => 
                ticker.symbol.endsWith('USDT') && 
                symbolsMap[ticker.symbol]?.status === 'TRADING'
            )
            .map(ticker => formatCryptoData(ticker, symbolsMap[ticker.symbol]))
            .sort((a, b) => parseFloat(b.market_cap) - parseFloat(a.market_cap))
            .slice(0, 100);

        cache.set(cacheKey, cryptos, 300);
        res.json(cryptos);
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        res.status(500).json({ 
            message: 'Error fetching cryptocurrency data',
            error: error.message 
        });
    }
};

// Define getCrypto function
const getCrypto = async (req, res) => {
    try {
        const symbol = (req.params.symbol + 'USDT').toUpperCase();
        const cacheKey = `crypto_${symbol}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData);
        }

        // Get multiple data points
        const [ticker, exchangeInfo, klines] = await Promise.all([
            apiClient.get(`/ticker/24hr?symbol=${symbol}`),
            apiClient.get('/exchangeInfo'),
            apiClient.get('/klines', {
                params: {
                    symbol: symbol,
                    interval: '1d',
                    limit: 1
                }
            })
        ]);

        // Get symbol information
        const symbolInfo = exchangeInfo.data.symbols.find(s => s.symbol === symbol);
        if (!symbolInfo) {
            return res.status(404).json({ message: 'Cryptocurrency not found' });
        }

        const baseAsset = symbolInfo.baseAsset;
        const lowercaseSymbol = baseAsset.toLowerCase();
        const lastKline = klines.data[0];

        // Format the response
        const cryptoData = {
            id: lowercaseSymbol,
            symbol: lowercaseSymbol,
            name: baseAsset,
            image: {
                thumb: `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${lowercaseSymbol}.svg`,
                small: `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${lowercaseSymbol}.svg`,
                large: `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${lowercaseSymbol}.svg`
            },
            market_data: {
                current_price: {
                    usd: formatPrice(ticker.data.lastPrice)
                },
                market_cap: {
                    usd: parseFloat(ticker.data.quoteVolume)
                },
                total_volume: {
                    usd: parseFloat(ticker.data.volume)
                },
                high_24h: {
                    usd: parseFloat(ticker.data.highPrice)
                },
                low_24h: {
                    usd: parseFloat(ticker.data.lowPrice)
                },
                price_change_24h: parseFloat(ticker.data.priceChange),
                price_change_percentage_24h: parseFloat(ticker.data.priceChangePercent),
                circulating_supply: parseFloat(lastKline[5]),
                total_supply: null,
                max_supply: null,
                last_updated: new Date(ticker.data.closeTime).toISOString()
            },
            additional_data: {
                trading_status: symbolInfo.status,
                base_asset_precision: symbolInfo.baseAssetPrecision,
                quote_asset_precision: symbolInfo.quotePrecision
            }
        };

        cache.set(cacheKey, cryptoData, 300);
        res.json(cryptoData);
    } catch (error) {
        console.error('Error fetching crypto details:', error);
        res.status(error.response?.status || 500).json({ 
            message: 'Error fetching crypto details',
            error: error.message 
        });
    }
};

// Set up routes
router.get('/cryptos', getCryptos);
router.get('/crypto/:symbol', getCrypto);

// ... rest of your route handlers ...

// Export everything at the bottom
module.exports = {
    router,
    getCryptos,
    getCrypto
};
