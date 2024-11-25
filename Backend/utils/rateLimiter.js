class RateLimiter {
    constructor(maxRequests = 50, timeWindow = 60000) { // Increased to 50 requests per minute
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
        this.waiting = [];
    }

    async acquireToken() {
        const now = Date.now();
        
        // Remove expired timestamps
        this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);

        if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return Promise.resolve();
        }

        // Calculate wait time with some buffer
        const oldestRequest = this.requests[0];
        const timeToWait = Math.max(oldestRequest + this.timeWindow - now + 1000, 1000);

        return new Promise(resolve => {
            setTimeout(() => {
                this.requests = this.requests.slice(1);
                this.requests.push(now + timeToWait);
                resolve();
            }, timeToWait);
        });
    }
}

module.exports = new RateLimiter(50, 60000); // 50 requests per minute