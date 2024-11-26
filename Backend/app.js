const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const apiRoutes = require('./routes/api');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// GraphQL Schema Definition
const typeDefs = `
  type Crypto {
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
    cryptos: [Crypto!]!
    crypto(symbol: String!): Crypto
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    cryptos: async (_, __, { apiRoutes }) => {
      // Simulate a GET request to your REST endpoint
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
    context: { apiRoutes },
    graphiql: true, // Enable GraphQL Playground in development
  })
);

// Use REST routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`GraphQL Playground available at http://localhost:${PORT}/graphql`);
}); 