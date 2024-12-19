require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

// Proxy routes
app.use('/api/crypto', createProxyMiddleware({
    target: process.env.CRYPTO_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true
}));

app.use('/graphql', createProxyMiddleware({
    target: process.env.COMPARISON_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true
}));

app.use('/api/cache', createProxyMiddleware({
    target: process.env.CACHE_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
});