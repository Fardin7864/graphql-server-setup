export const typeDefs = `#graphql
type Query {
    hello: String
  }

  type Mutation {
    createUser(firstName: String!, lastName: String!, email: String!, password: String!): CreateUserResponse
  }

  type CreateUserResponse {
    success: Boolean!
    status: Number!
    message: String!
    user: User
  }

  type User {
    firstName: String!
    lastName: String!
    email: String!
  }
`