const axios = require('axios');
const rateLimiter = require('./rateLimiter');
const https = require('https');

class ApiClient {
    constructor(baseURL, maxRetries = 3) {
        this.baseURL = baseURL;
        this.maxRetries = maxRetries;
        this.pendingRequests = new Map();
        this.axiosInstance = axios.create({
            baseURL: baseURL,
            timeout: 30000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                keepAlive: true
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
    }

    async request(config, retryCount = 0) {
        const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;

        try {
            if (this.pendingRequests.has(requestKey)) {
                return this.pendingRequests.get(requestKey);
            }

            await rateLimiter.acquireToken();
            
            const promise = this.axiosInstance({
                ...config,
                url: config.url
            });

            this.pendingRequests.set(requestKey, promise);
            const response = await promise;
            this.pendingRequests.delete(requestKey);
            return response;
        } catch (error) {
            this.pendingRequests.delete(requestKey);
            console.error('API Request Error:', error.message);
            
            if (retryCount < this.maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying request after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.request(config, retryCount + 1);
            }
            throw error;
        }
    }

    async get(url, config = {}) {
        return this.request({ ...config, method: 'GET', url });
    }
}

const binanceClient = new ApiClient('https://api1.binance.com/api/v3');
module.exports = binanceClient; 