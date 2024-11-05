export const typeDefs = `#graphql
  enum Currency {
    USD
    BDT
    INR
  }

  type Query {
    hello: String
  }

  # type Mutation {
  #   createUser(
  #     firstName: String!
  #     lastName: String!
  #     email: String!
  #     password: String!
  #     currency: Currency!
  #   ): CreateUserResponse

  #   registerOnOneclick(
  #     firstName: String!
  #     lastName: String!
  #     currency: Currency!
  #   ): OneClickRegisterResponse
  # }

  type CreateUserResponse {
    success: Boolean!
    status: Int!
    message: String!
    details: String
    accessToken: String
    data: User
  }

  type OneClickRegisterResponse {
    success: Boolean!
    status: Int!
    message: String!
    details: String
    data: OneClickUserData
  }

  type OneClickUserData {
    userId: String!
    password: String!
  }

  type User {
    id: String
    userId: String
    firstName: String!
    lastName: String
    profileImageURL: String
    mobile: String
    currency: Currency
    promoCode: String
    email: String
  }
`;
