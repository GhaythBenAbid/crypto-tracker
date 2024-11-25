const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

module.exports = cache; 