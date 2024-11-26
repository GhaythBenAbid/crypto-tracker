const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { router: apiRouter } = require('./routes/api');  // Import the router specifically
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// GraphQL Schema Definition
const typeDefs = `
  type Image {
    thumb: String!
    small: String!
    large: String!
  }

  type MarketData {
    current_price: PriceData!
    market_cap: PriceData!
    total_volume: PriceData!
    high_24h: PriceData!
    low_24h: PriceData!
    price_change_24h: Float!
    price_change_percentage_24h: Float!
    circulating_supply: Float!
    total_supply: Float
    max_supply: Float
    last_updated: String!
  }

  type PriceData {
    usd: String!
  }

  type AdditionalData {
    trading_status: String!
    base_asset_precision: Int!
    quote_asset_precision: Int!
  }

  type DetailedCrypto {
    id: String!
    symbol: String!
    name: String!
    image: Image!
    market_data: MarketData!
    additional_data: AdditionalData!
  }

  type SimpleCrypto {
    id: String!
    symbol: String!
    name: String!
    current_price: String!
    market_cap: Float!
    total_volume: Float!
    price_change_24h: Float!
    price_change_percentage_24h: Float!
    circulating_supply: Float!
    image: String!
    last_updated: String!
  }

  type Query {
    cryptos: [SimpleCrypto!]!
    crypto(symbol: String!): DetailedCrypto
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    cryptos: async (_, __, { apiRoutes }) => {
      const req = {};
      const res = {
        json: (data) => data,
      };
      return apiRoutes.getCryptos(req, res);
    },
    crypto: async (_, { symbol }, { apiRoutes }) => {
      const req = { params: { symbol } };
      const res = {
        json: (data) => data,
      };
      return apiRoutes.getCrypto(req, res);
    },
  },
};

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// GraphQL endpoint with playground
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    context: { apiRoutes: require('./routes/api') },
    graphiql: true,
  })
);

// Use the API routes
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('Hello, this is your Express API!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`GraphQL Playground available at http://localhost:${port}/graphql`);
});
