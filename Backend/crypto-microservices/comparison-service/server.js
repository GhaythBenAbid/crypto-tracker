require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');

// Updated Type Definitions
const typeDefs = gql`
  type Comparison {
    symbol: String
    price_change: Float
    percentage_change: Float
    interval: String
    market_cap: Float
    volume_24h: Float
  }

  type Query {
    compare(symbol1: String!, symbol2: String!, interval: String!): [Comparison]
  }
`;

// Updated Resolvers
const resolvers = {
  Query: {
    compare: async (_, { symbol1, symbol2, interval }) => {
      try {
        // Mock data for testing
        return [
          {
            symbol: symbol1,
            price_change: 1200.50,
            percentage_change: 2.5,
            interval: interval,
            market_cap: 1000000000,
            volume_24h: 500000000
          },
          {
            symbol: symbol2,
            price_change: 85.30,
            percentage_change: 3.2,
            interval: interval,
            market_cap: 500000000,
            volume_24h: 250000000
          }
        ];
      } catch (error) {
        console.error('Comparison error:', error);
        throw new Error('Failed to compare cryptocurrencies');
      }
    }
  }
};

async function startServer() {
  const app = express();
  app.use(cors());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground: true
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Comparison service running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);