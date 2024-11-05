import { Currency } from "@prisma/client";

export interface CreateUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    promoCode: string;
    currency: Currency;
    mobile: string;
  }

  export interface CreateOneClickUserPayload {
    firstName: string;
    lastName: string;
    currency: Currency;
  }
  
  export interface GetUserTokenPayload {
    email: string;
    password: string;
  }
  
  export interface User {
    id: string;
    userId: string;
    encryptedUserId: string;
    firstName: string;
    lastName: string;
    profileImageURL: string;
    email: string;
    password: string;
    promoCode: string;
    currency: Currency;
  }