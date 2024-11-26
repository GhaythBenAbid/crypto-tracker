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
            .slice(0, 100); // Get top 100 by market cap

        cache.set(cacheKey, cryptos, 300); // Cache for 5 minutes
        res.json(cryptos);
    } catch (error) {
        console.error('Error fetching cryptocurrencies:', error);
        res.status(500).json({ 
            message: 'Error fetching cryptocurrency data',
            error: error.message 
        });
    }
};

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
                circulating_supply: parseFloat(lastKline[5]), // Volume from kline data
                total_supply: null, // Binance doesn't provide this
                max_supply: null, // Binance doesn't provide this
                last_updated: new Date(ticker.data.closeTime).toISOString()
            },
            additional_data: {
                trading_status: symbolInfo.status,
                base_asset_precision: symbolInfo.baseAssetPrecision,
                quote_asset_precision: symbolInfo.quotePrecision
            }
        };

        cache.set(cacheKey, cryptoData, 300); // Cache for 5 minutes
        res.json(cryptoData);
    } catch (error) {
        console.error('Error fetching crypto details:', error);
        res.status(error.response?.status || 500).json({ 
            message: 'Error fetching crypto details',
            error: error.message 
        });
    }
};

// Get coin price history
router.get('/crypto/:symbol/history', async (req, res) => {
    try {
        const symbol = (req.params.symbol + 'USDT').toUpperCase();
        const { interval = '1d', limit = 365 } = req.query;
        
        const cacheKey = `history_${symbol}_${interval}_${limit}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData);
        }

        // Get klines (candlestick) data from Binance
        const response = await apiClient.get('/klines', {
            params: {
                symbol: symbol,
                interval: interval,
                limit: limit
            }
        });

        // Format the data for the frontend
        // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
        const prices = response.data.map(candle => [
            candle[0], // timestamp
            parseFloat(candle[4]) // closing price
        ]);

        // Calculate additional statistics
        const priceData = {
            prices: prices,
            market_caps: prices.map(price => [
                price[0],
                price[1] * (response.data.find(candle => candle[0] === price[0])?.[5] || 0) // price * volume
            ]),
            total_volumes: response.data.map(candle => [
                candle[0], // timestamp
                parseFloat(candle[5]) // volume
            ]),
            statistics: {
                highest_price: Math.max(...prices.map(p => p[1])),
                lowest_price: Math.min(...prices.map(p => p[1])),
                price_change: prices[prices.length - 1][1] - prices[0][1],
                price_change_percentage: ((prices[prices.length - 1][1] - prices[0][1]) / prices[0][1]) * 100,
                total_volume: response.data.reduce((sum, candle) => sum + parseFloat(candle[5]), 0)
            }
        };

        cache.set(cacheKey, priceData, 300); // Cache for 5 minutes
        res.json(priceData);
    } catch (error) {
        console.error('Error fetching coin history:', error);
        res.status(error.response?.status || 500).json({ 
            message: 'Error fetching coin history',
            error: error.message 
        });
    }
});

// Add interval options endpoint
router.get('/intervals', (req, res) => {
    const intervals = [
        { value: '1m', label: '1 minute' },
        { value: '3m', label: '3 minutes' },
        { value: '5m', label: '5 minutes' },
        { value: '15m', label: '15 minutes' },
        { value: '30m', label: '30 minutes' },
        { value: '1h', label: '1 hour' },
        { value: '2h', label: '2 hours' },
        { value: '4h', label: '4 hours' },
        { value: '6h', label: '6 hours' },
        { value: '8h', label: '8 hours' },
        { value: '12h', label: '12 hours' },
        { value: '1d', label: '1 day' },
        { value: '3d', label: '3 days' },
        { value: '1w', label: '1 week' },
        { value: '1M', label: '1 month' }
    ];
    res.json(intervals);
});

// Add time range options endpoint
router.get('/timeranges', (req, res) => {
    const timeRanges = [
        { value: '1', label: '24 hours' },
        { value: '7', label: '7 days' },
        { value: '30', label: '30 days' },
        { value: '90', label: '90 days' },
        { value: '180', label: '180 days' },
        { value: '365', label: '1 year' },
        { value: 'max', label: 'All time' }
    ];
    res.json(timeRanges);
});

// Compare two cryptocurrencies
router.get('/crypto/compare/:coin1/:coin2', async (req, res) => {
    try {
        const symbol1 = (req.params.coin1 + 'USDT').toUpperCase();
        const symbol2 = (req.params.coin2 + 'USDT').toUpperCase();
        
        const cacheKey = `compare_${symbol1}_${symbol2}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData);
        }

        // Get historical data for both coins
        const [klines1, klines2, exchangeInfo] = await Promise.all([
            apiClient.get('/klines', {
                params: {
                    symbol: symbol1,
                    interval: '1d',
                    limit: 365
                }
            }),
            apiClient.get('/klines', {
                params: {
                    symbol: symbol2,
                    interval: '1d',
                    limit: 365
                }
            }),
            apiClient.get('/exchangeInfo')
        ]);

        // Get symbol information
        const symbol1Info = exchangeInfo.data.symbols.find(s => s.symbol === symbol1);
        const symbol2Info = exchangeInfo.data.symbols.find(s => s.symbol === symbol2);

        if (!symbol1Info || !symbol2Info) {
            return res.status(404).json({ message: 'One or both cryptocurrencies not found' });
        }

        // Normalize the data (convert to percentage change from initial price)
        const coin1Prices = klines1.data.map(candle => parseFloat(candle[4])); // closing prices
        const coin2Prices = klines2.data.map(candle => parseFloat(candle[4]));

        const coin1Initial = coin1Prices[0];
        const coin2Initial = coin2Prices[0];

        const comparisonData = {
            dates: klines1.data.map(candle => new Date(candle[0]).toLocaleDateString()),
            coin1Prices: coin1Prices,
            coin2Prices: coin2Prices,
            coin1Name: symbol1Info.baseAsset,
            coin2Name: symbol2Info.baseAsset,
            normalizedData: {
                coin1: coin1Prices.map(price => ((price - coin1Initial) / coin1Initial) * 100),
                coin2: coin2Prices.map(price => ((price - coin2Initial) / coin2Initial) * 100)
            },
            statistics: {
                coin1: {
                    highestPrice: Math.max(...coin1Prices),
                    lowestPrice: Math.min(...coin1Prices),
                    priceChange: coin1Prices[coin1Prices.length - 1] - coin1Prices[0],
                    priceChangePercentage: ((coin1Prices[coin1Prices.length - 1] - coin1Prices[0]) / coin1Prices[0]) * 100
                },
                coin2: {
                    highestPrice: Math.max(...coin2Prices),
                    lowestPrice: Math.min(...coin2Prices),
                    priceChange: coin2Prices[coin2Prices.length - 1] - coin2Prices[0],
                    priceChangePercentage: ((coin2Prices[coin2Prices.length - 1] - coin2Prices[0]) / coin2Prices[0]) * 100
                },
                correlation: calculateCorrelation(coin1Prices, coin2Prices)
            }
        };

        cache.set(cacheKey, comparisonData, 300); // Cache for 5 minutes
        res.json(comparisonData);
    } catch (error) {
        console.error('Error comparing cryptocurrencies:', error);
        res.status(error.response?.status || 500).json({ 
            message: 'Error comparing cryptocurrencies',
            error: error.message 
        });
    }
});

// Helper function to calculate correlation between two arrays
function calculateCorrelation(array1, array2) {
    const n = array1.length;
    const mean1 = array1.reduce((a, b) => a + b) / n;
    const mean2 = array2.reduce((a, b) => a + b) / n;

    const variance1 = array1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / n;
    const variance2 = array2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / n;

    const covariance = array1.reduce((a, b, i) => a + (b - mean1) * (array2[i] - mean2), 0) / n;

    return covariance / Math.sqrt(variance1 * variance2);
}

// Add comparison intervals endpoint
router.get('/compare/intervals', (req, res) => {
    const intervals = [
        { value: '1d', label: 'Daily' },
        { value: '1w', label: 'Weekly' },
        { value: '1M', label: 'Monthly' }
    ];
    res.json(intervals);
});

// Add comparison periods endpoint
router.get('/compare/periods', (req, res) => {
    const periods = [
        { value: '30', label: 'Last Month' },
        { value: '90', label: 'Last 3 Months' },
        { value: '180', label: 'Last 6 Months' },
        { value: '365', label: 'Last Year' }
    ];
    res.json(periods);
});

module.exports = {
    router,
    getCryptos,
    getCrypto
};
