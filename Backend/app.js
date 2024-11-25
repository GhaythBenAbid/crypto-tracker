const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Use routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 