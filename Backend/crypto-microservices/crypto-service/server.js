require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Validation middleware
const validateSymbol = (req, res, next) => {
    const { symbol } = req.params;
    if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ error: 'Invalid symbol parameter' });
    }
    // Check if symbol follows valid format (e.g., BTCUSDT)
    if (!/^[A-Za-z0-9]+$/.test(symbol)) {
        return res.status(400).json({ error: 'Invalid symbol format' });
    }
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'crypto-service'
    });
});

// Get all cryptocurrencies with pagination
app.get('/api/cryptos', async (req, res) => {
    try {
        const { page = 1, per_page = 100 } = req.query;
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page,
                page,
                sparkline: false
            },
            timeout: 5000
        });
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch cryptocurrencies' });
    }
});

// Get specific cryptocurrency data
app.get('/api/crypto/:symbol', validateSymbol, async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`, {
            timeout: 5000
        });
        
        const formattedData = {
            symbol: response.data.symbol,
            price: parseFloat(response.data.lastPrice),
            change_24h: parseFloat(response.data.priceChange),
            change_percentage_24h: parseFloat(response.data.priceChangePercent),
            volume: parseFloat(response.data.volume),
            timestamp: new Date().toISOString()
        };
        
        res.json(formattedData);
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response?.status === 400) {
            res.status(400).json({ error: 'Invalid symbol' });
        } else {
            res.status(500).json({ error: 'Failed to fetch crypto data' });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Crypto service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});