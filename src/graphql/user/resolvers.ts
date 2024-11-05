import { Currency } from "@prisma/client";
import { AuthService } from "../../services/user/services/authService";

const query = {
  // Get authentication token
  login: async (_: any, payload: { email: string; password: string }) => {
    const token = await AuthService.login({
      email: payload.email,
      password: payload.password,
    });
    return token;
  },

};

const mutation = {
  registerWithEmail: async (
    _: any,
    {
      firstName,
      lastName,
      currency,
      email,
      password,
      promoCode,
      mobile,
    }: {
      firstName: string;
      lastName: string;
      currency: Currency;
      email: string;
      password: string;
      promoCode: string;
      mobile: string;
    }
  ) => {
    try {
      const user = await AuthService.registerWithEmail({
        firstName,
        lastName,
        currency,
        email,
        password,
        promoCode,
        mobile,
      });
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
  registerOnOneclick: async (
    _: any,
    {
      firstName,
      lastName,
      currency,
    }: { firstName: string; lastName: string; currency: Currency }
  ) => {
    try {
      const user = await AuthService.oneClickRegister({
        firstName,
        lastName,
        currency,
      });
      return user;
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: "Failed to create user on one click!",
        user: null,
      };
    }
  },
};

export const resolvers = { query, mutation };
