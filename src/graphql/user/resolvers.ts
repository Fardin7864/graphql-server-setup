import UserService, { CreateUserPayload } from "../../services/user/UserService";

const query = {
  // Get all users
  getAllUsers: async () => { 
    try {
      const users = await UserService.getAllUsers();
      if(!users)
        throw new Error("No user found")

      return users;
    } catch (error) {
      console.log(error)
    }
   },

  // Get authentication token
  login: async (_: any, payload: { email: string, password: string }) => {
    const token = await UserService.login({
      email: payload.email,
      password: payload.password,
    });
    return token;
  },
  
  // Get logedin user
  getCurrentLoggedInUser: async (_: any, paramet: any, context: any) => { 
     
    if(context && context.user) {
      const id = context.user.id;
      const user = await UserService.getUserById(id)
      return user;
    }
    throw new Error("I don't know")
   }
};

const mutation = {
  createUser: async (_: any, { firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      const user = await UserService.createUser({ firstName, lastName, email, password });
      return user;
    } catch (error) {
      return {
        success: false,
        status: 400,
        message: "Failed to create user",
        user: null,
      };
    }
  },
};

export const resolvers = { query, mutation };
