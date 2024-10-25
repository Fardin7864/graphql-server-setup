export const typeDefs = `#graphql
type Query {
    hello: String
    say(name: String): String
  }

  type Mutation {
    createUser(firstName: String!, lastName: String!, email: String!, password: String!): CreateUserResponse
  }

  type CreateUserResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type User {
    firstName: String!
    lastName: String!
    email: String!
  }
`