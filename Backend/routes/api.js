// routes/api.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/cryptos', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
      },
    });

    const data = response.data;
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from CoinGecko API:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
