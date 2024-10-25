// resolvers.ts

import { prismaClient } from "../lib/db";

const resolvers = {
  Query: {
    hello: () => "Hey there, I am a GraphQL server",
    say: (_: any, { name }: { name: string }) => `Hey ${name}, Welcome to GraphQL!`,
  },
  Mutation: {
    createUser: async (
      _: any,
      { firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }
    ) => {
      try {

        const existingUser = await prismaClient.user.findUnique({
          where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          status:403,
          message: "This email already exist!",
          user: null,
        };
      }

        await prismaClient.user.create({
          data: {
            firstName,
            lastName,
            email,
            password, // Remember to hash this in production!
            salt: "random_salt", // Replace with proper salt generation
          },
        });

        return {
          success: true,
          message: "User created successfully!",
          user: {
            firstName,
            lastName,
            email,
          },
        };
      } catch (error) {
        console.error("Error creating user:", error);
        return {
          success: false,
          message: "Failed to create user.",
          user: null,
        };
      }
    },
  },
};

export default resolvers;
