import { createHmac, randomBytes } from "crypto";
import JWT from "jsonwebtoken";
import { prismaClient } from "../../lib/db";

const JWT_SECRET = "$supperScript";

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface GetUserTokenPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  profileImageURL: string;
}

class UserService {
  private static generateHash(salt: string, password: string) {
    const hashedPassword = createHmac("sha256", salt) // Corrected "sha256" here
      .update(password)
      .digest("hex");
    return hashedPassword;
  }

  // Private method for required fields validation
  private static validateRequiredFields(fields: Record<string, any>): {
    isValid: boolean;
    errorMessage: string;
  } {
    const missingFields = Object.entries(fields)
      .filter(([_, value]) => !value) // Check if value is falsy
      .map(([key]) => key); // Extract keys of missing fields

    if (missingFields.length > 0) {
      return {
        isValid: false,
        errorMessage: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    return { isValid: true, errorMessage: "" }; // All required fields are present
  }

  // Private method for password validation
  private static isValidPassword(password: string): {
    isValid: boolean;
    errorMessage: string;
  } {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        errorMessage: "Password must be at least 8 characters long.",
      };
    }
    if (!hasUpperCase) {
      return {
        isValid: false,
        errorMessage: "Password must include at least one uppercase letter.",
      };
    }
    if (!hasLowerCase) {
      return {
        isValid: false,
        errorMessage: "Password must include at least one lowercase letter.",
      };
    }
    if (!hasNumber) {
      return {
        isValid: false,
        errorMessage: "Password must include at least one number.",
      };
    }
    if (!hasSymbol) {
      return {
        isValid: false,
        errorMessage: "Password must include at least one special character.",
      };
    }

    return { isValid: true, errorMessage: "" }; // Valid password
  }

  public static async createUser(payload: CreateUserPayload) {
    const { firstName, lastName, email, password } = payload;

    const isExist = await prismaClient.user.findUnique({where: {email}});
    if(isExist){
      return {
        success: false,
        status: 400,
        message: "Register Faild!",
        details: "This email address already exist!",
      };
    }

    // Validate required fields
    const requiredFieldsValidation = this.validateRequiredFields({
      firstName,
      email,
      password,
    });
    if (!requiredFieldsValidation.isValid) {
      return {
        success: false,
        status: 400,
        message: requiredFieldsValidation.errorMessage,
      };
    }

    // Validate the password
    const passwordValidation = this.isValidPassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        status: 400,
        message: passwordValidation.errorMessage,
      };
    }
    const salt = randomBytes(32).toString("hex");
    const hashPassword = UserService.generateHash(salt, password);
    const user = await prismaClient.user.create({
      data: {
        firstName,
        lastName,
        email,
        salt,
        password: hashPassword,
      },
    });
    const token = JWT.sign({ id: user.id, email: user.email }, JWT_SECRET);
    if(!user){
      return {
        success: false,
        status: 400,
        message: "Register Faild!",
      };
    }
    return {
      success: true,
      status: 201,
      message: "Register successfull!",
      accessToken: token,
      user,
    };
  }

  public static getUserById(id: string) {
    return prismaClient.user.findUnique({ where: { id } });
  }

  private static getUserByEmail(email: string) {
    return prismaClient.user.findUnique({ where: { email } });
  }

  public static async login(payload: GetUserTokenPayload) {
    const { email, password } = payload;
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
        accessToken: null,
        user: null,
      };
    }

    const userSalt = user.salt;
    const userHashPassword = UserService.generateHash(userSalt, password);

    if (userHashPassword !== user.password) {
      return {
        success: false,
        status: 401,
        message: "Incorrect password",
        accessToken: null,
        user: null,
      };
    }

    const token = JWT.sign({ id: user.id, email: user.email }, JWT_SECRET);
    return {
      success: true,
      status: 200,
      message: "Login successful",
      accessToken: token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageURL: user.profileImageURL,
      },
    };
  }

  public static jwtDecode(token: string) {
    return JWT.verify(token, JWT_SECRET);
  }

  public static async getAllUsers() {
    return prismaClient.user.findMany();
  }
}

export default UserService;
