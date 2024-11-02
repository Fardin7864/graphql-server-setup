import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "crypto";
import JWT from "jsonwebtoken";
import { prismaClient } from "../../lib/db";
import { Currency } from "@prisma/client";

const JWT_SECRET = "$supperScript";

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  profileImageURL?: string;
  email?: string;
  password?: string;
  promoCode?: string;
  currency: Currency;
}

export interface GetUserTokenPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  profileImageURL?: string;
  email?: string;
  password?: string;
  promoCode?: string;
  currency: Currency;
}

class PasswordGenerator {
  private lowercase = "abcdefghijklmnopqrstuvwxyz";
  private uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private numbers = "0123456789";
  private symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

  // Method to generate a strong password
  public generatePassword(length: number = 12): string {
    const getRandom = (chars: string) =>
      chars[Math.floor(Math.random() * chars.length)];

    // Ensure password has at least one of each required character type
    const passwordChars = [
      getRandom(this.lowercase),
      getRandom(this.uppercase),
      getRandom(this.numbers),
      getRandom(this.symbols),
    ];

    // Fill the remaining length with random characters from all types
    const allChars =
      this.lowercase + this.uppercase + this.numbers + this.symbols;
    for (let i = passwordChars.length; i < length; i++) {
      passwordChars.push(getRandom(allChars));
    }

    // Shuffle the characters to ensure randomness
    return passwordChars.sort(() => Math.random() - 0.5).join("");
  }
}

class UserService {
  // Encode parameters with salt as the encryption key and take IV as a parameter
  public static encodeParams(
    salt: string,
    iv: string,
    ...params: string[]
  ): string {
    const concatenatedParams = params.join("|");

    // Convert the salt to a 256-bit key and the IV to a Buffer
    const key = Buffer.from(salt, "hex").slice(0, 32); // Ensure key is 256-bit (32 bytes)
    const ivBuffer = Buffer.from(iv, "hex");

    const cipher = createCipheriv("aes-256-cbc", key, ivBuffer);

    // Encrypt and get the result in hexadecimal
    let encrypted = cipher.update(concatenatedParams, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return just the encrypted data; IV will be stored separately
    return encrypted;
  }

  // Decode the encoded string using salt as the decryption key and take IV as a parameter
  public static decodeParams(
    salt: string,
    iv: string,
    encodedString: string
  ): string {
    // Convert the salt to a 256-bit key and the IV to a Buffer
    const key = Buffer.from(salt, "hex").slice(0, 32); // Ensure key is 256-bit (32 bytes)
    const ivBuffer = Buffer.from(iv, "hex");

    const decipher = createDecipheriv("aes-256-cbc", key, ivBuffer);

    // Decrypt the encrypted text
    let decrypted = decipher.update(encodedString, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

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
    const { firstName, lastName, email } = payload;
    const password = payload.password || new PasswordGenerator().generatePassword(12); // Generate a default password if undefined


    const isExist = await prismaClient.user.findUnique({ where: { email } });
    if (isExist) {
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
    const iv = randomBytes(16).toString("hex");
    const hashPassword = UserService.generateHash(salt, password);
    const user = await prismaClient.user.create({
      data: {
        firstName,
        lastName,
        email,
        salt,
        iv,
        password: hashPassword,
      },
    });
    const token = JWT.sign({ id: user.id, email: user.email }, JWT_SECRET);
    if (!user) {
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

  // One Click register
  public static async oneClickRegister(payload: CreateUserPayload) {
    const { firstName, lastName, currency } = payload;

    const salt = randomBytes(32).toString("hex");
    const iv = randomBytes(16).toString("hex");
    const userId = this.encodeParams(salt, iv, firstName, currency);

    // Create password
    const generator = new PasswordGenerator();
    const password = generator.generatePassword(12);
    const hashPassword = UserService.generateHash(salt, password);


    // Validate required fields
    const requiredFieldsValidation = this.validateRequiredFields({
      firstName,
      lastName,
      currency,
    });
    if (!requiredFieldsValidation.isValid) {
      return {
        success: false,
        status: 400,
        message: requiredFieldsValidation.errorMessage,
      };
    }

    const user = await prismaClient.user.create({
      data: {
        userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        currency: payload.currency,
        salt,
        iv,
        password: hashPassword,
      },
    });

    if (!user) {
      return {
        success: false,
        status: 400,
        message: "Faild to create user on one click!",
      };
    }

    return {
      success: true,
      status: 201,
      message: "User created successfully in one click!",
      data:{
        userId,
        password
      }
    };
  }
}

export default UserService;
