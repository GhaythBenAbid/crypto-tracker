require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');

const typeDefs = gql`
    type Comparison {
        symbol: String
        price_change: Float
        percentage_change: Float
        interval: String
    }

    type Query {
        compare(symbol1: String!, symbol2: String!, interval: String!): [Comparison]
    }
`;

const resolvers = {
    Query: {
        compare: async (_, { symbol1, symbol2, interval }) => {
            // Implement comparison logic
            return [];
        }
    }
};

async function startServer() {
    const app = express();
    app.use(cors());
    
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => {
        console.log(`Comparison service running on port ${PORT}`);
    });
}

startServer();