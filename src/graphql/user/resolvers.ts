import UserService, { CreateUserPayload } from "../../services/user/UserService";

const query = {
  getUserToken: async (_: any, payload: { email: string, password: string }) => {
    const token = await UserService.getUserToken({
      email: payload.email,
      password: payload.password,
    });
    return token;
  },
};

const mutation = {
  createUser: async (_: any, payload: CreateUserPayload) => {
    const res = await UserService.createUser(payload);
    return res.id;
  },
};

export const resolvers = { query, mutation };
