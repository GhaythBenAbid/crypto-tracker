// routes/api.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/:id', async (req, res) => {

    const id = req.params.id;
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/'+id+'/market_chart' , {
            //vs_currency=usd&days=14&interval=daily
            params: {
                vs_currency: 'usd',
                days: '14',
                interval: 'daily'
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
