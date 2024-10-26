import { ApolloServer } from "@apollo/server";
import { User } from "./user";

async function createApolloGraphqlServer() {
    
     
  const server = new ApolloServer({
    typeDefs:`#graphql
    ${User.typeDefs}
    type Query{
        ${User.queries}
    }

    type Mutation {
        ${User.mutations}
    }
    `, //Schema
    resolvers: {
        Query: {
            ...User.resolvers.query,
        },
        Mutation: {
            ...User.resolvers.mutation,
        },
    }
  });

  await server.start();
  return server;

}

export default createApolloGraphqlServer;