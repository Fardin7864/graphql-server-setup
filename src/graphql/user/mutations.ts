export const mutations = `#graphql
    createUser(firstName: String!, lastName: String!, email: String!, password: String!, currency: Currency!): CreateUserResponse
    registerOnOneclick(
      firstName: String!
      lastName: String!
      currency: Currency!
    ): OneClickRegisterResponse
`;
