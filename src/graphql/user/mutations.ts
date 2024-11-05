export const mutations = `#graphql
    registerWithEmail(firstName: String!, lastName: String!, email: String!, password: String!, currency: Currency!, promoCode: String, mobile: String,): CreateUserResponse
    registerOnOneclick(
      firstName: String!
      lastName: String!
      currency: Currency!
    ): OneClickRegisterResponse
`;
