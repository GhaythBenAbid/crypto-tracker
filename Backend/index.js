const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

//cors

app.use(cors());

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello, this is your Express API!');
});

//call the routes


app.use('/api', require('./routes/api'));
app.use('/charts', require('./routes/charts'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
