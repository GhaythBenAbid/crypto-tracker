// market-service/server.js
require('dotenv').config();
const express = require('express');
const soap = require('soap');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const marketService = {
    MarketService: {
        MarketServicePort: {
            getMarketAnalysis: async function(args) {
                const { symbol } = args;
                return {
                    symbol,
                    analysis: {
                        marketCap: 1000000000,
                        volume24h: 500000000,
                        dominanceIndex: 45.5,
                        sentiment: "bullish",
                        rsi: 65,
                        macd: {
                            signal: "buy",
                            value: 0.245
                        },
                        support: 45000,
                        resistance: 48000,
                        timestamp: new Date().toISOString()
                    }
                };
            }
        }
    }
};

const wsdl = fs.readFileSync(path.join(__dirname, 'market-service.wsdl'), 'utf8');

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3004;

soap.listen(app, '/market-analysis', marketService, wsdl);

app.listen(PORT, () => {
    console.log(`Market SOAP service running on port ${PORT}`);
    console.log(`WSDL available at: http://localhost:${PORT}/market-analysis?wsdl`);
});