export const typeDefs = `#graphql
type Query {
    hello: String
  }

  type Mutation {
    createUser(firstName: String!, lastName: String!, email: String!, password: String!): CreateUserResponse
  }

  type CreateUserResponse {
    success: Boolean!
    status: Int!
    message: String!
    accessToken: String
    user: User
}

  type User {
    firstName: String!
    lastName: String!
    email: String!
    profileImageURL: String
  }


`