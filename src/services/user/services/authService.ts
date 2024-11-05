import { prismaClient } from "../../../lib/db";
import ValidationService from "../utils/validation";
import { PasswordService } from "./passwordService";
import { randomBytes } from "crypto";
import {
  CreateOneClickUserPayload,
  CreateUserPayload,
  GetUserTokenPayload,
} from "../interfaces/interfaces";
import EncryptionServices from "../utils/encryption";
import { UserService } from "./userService";
import redisClient from "../../../lib/redisClient"; // Import global Redis client
import { TokenUtils } from "../utils/token";
import { RedisUtils } from "../../../utils/redis/redis.utils";

export class AuthService {
  /**
   * Login function with rate limiting, caching, and session management
   * @param payload - Object containing email and password
   * @returns - Response object indicating login success, token, and user data
   */
  public static async login(payload: GetUserTokenPayload) {
    const { email, password } = payload;
    const userCacheKey = `user:${email}`;

    // Apply rate limiting for login attempts
    const rateLimit = await RedisUtils.rateLimiter(email);
    if (!rateLimit.success) return rateLimit;

    // Attempt to retrieve user data from Redis cache
    let cachedUser = await redisClient.get(userCacheKey);
    let user;

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      // If user data is not cached, query the database
      user = await UserService.getUserByCommonField(email);
      if (user)
        await redisClient.setEx(userCacheKey, 300, JSON.stringify(user)); // Cache for 5 minutes
    }

    // Return 404 if user is not found
    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found",
        accessToken: null,
        data: null,
      };
    }

    // Validate the provided password
    const userSalt = user.salt;
    const userHashPassword = EncryptionServices.generateHash(
      userSalt,
      password
    );
    if (userHashPassword !== user.password) {
      return {
        success: false,
        status: 401,
        message: "Incorrect password",
        accessToken: null,
        data: null,
      };
    }

    // Generate a new JWT token and store it in Redis as a session
    const token = TokenUtils.generateToken({ id: user.id, email: user.email });
    await redisClient.setEx(`session:${user.id}`, 3600, token); // Cache session token for 1 hour

    const data = { ...user } as Partial<typeof user>;
    delete data.password;
    delete data.iv;
    delete data.salt;

    // Return success response with user details and token
    return {
      success: true,
      status: 200,
      message: "Login successful",
      accessToken: token,
      data,
    };
  }

  /**
   * One-Click Register function with user data caching
   * @param payload - Object containing user registration details
   * @returns - Response indicating success or failure, along with new user credentials
   */
  public static async oneClickRegister(payload: CreateOneClickUserPayload) {
    const { firstName, lastName, currency } = payload;

    // Generate secure salt and IV for password encryption
    const salt = randomBytes(32).toString("hex");
    const iv = randomBytes(16).toString("hex");
    const encryptedUserId = EncryptionServices.encodeParams(
      salt,
      iv,
      firstName,
      currency
    );
    const userId = encryptedUserId.slice(0, 8);

    // Generate random password and hash it
    const password = PasswordService.generatePassword(12);
    const hashPassword = EncryptionServices.generateHash(salt, password);

    // Validate required fields
    const { isValid, errorMessage } = ValidationService.validateRequiredFields({
      firstName,
      lastName,
      currency,
    });
    if (!isValid) {
      return {
        success: false,
        status: 400,
        message: errorMessage,
      };
    }

    // Attempt to create the user in the database
    try {
      const user = await prismaClient.user.create({
        data: {
          userId,
          encryptedUserId,
          firstName,
          lastName,
          currency,
          salt,
          iv,
          password: hashPassword,
        },
      });

      // Cache the new user data in Redis
      await redisClient.setEx(`user:${user.email}`, 300, JSON.stringify(user)); // Cache for 5 minutes

      return {
        success: true,
        status: 201,
        message: "User created successfully.",
        data: {
          userId,
          password,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: "Failed to create user.",
      };
    }
  }

  /**
   * Register with email function with caching, rate limiting, and validation
   * @param payload - Object containing user registration details
   * @returns - Response object indicating registration success, token, and user data
   */
  public static async registerWithEmail(payload: CreateUserPayload) {
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      currency,
      promoCode,
    } = payload;
    const userCacheKey = `user:${email}`;

    // Apply rate limiting for registration attempts
    const rateLimit = await RedisUtils.rateLimiter(email);
    if (!rateLimit.success) return rateLimit;

    // Check if user already exists in the database
    const isExist = await redisClient.get(userCacheKey);
    let existingUser;
    if (!isExist) {
      existingUser = await prismaClient.user.findUnique({ where: { email } });
      if (existingUser)
        await redisClient.setEx(
          userCacheKey,
          300,
          JSON.stringify(existingUser)
        ); // Cache for 5 minutes
    } else {
      existingUser = JSON.parse(isExist);
    }

    if (existingUser) {
      return {
        success: false,
        status: 400,
        message: "Registration failed.",
        details: "This email address already exists.",
      };
    }

    // Validate required fields and password
    const requiredFieldsValidation = ValidationService.validateRequiredFields({
      firstName,
      lastName,
      email,
      password,
      currency,
    });
    if (!requiredFieldsValidation.isValid) {
      return {
        success: false,
        status: 400,
        message: requiredFieldsValidation.errorMessage,
      };
    }

    const passwordValidation = ValidationService.isValidPassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        status: 400,
        message: passwordValidation.errorMessage,
      };
    }

    // Generate secure salt, iv, and hashed password
    const salt = randomBytes(32).toString("hex");
    const iv = randomBytes(16).toString("hex");
    const hashPassword = EncryptionServices.generateHash(salt, password);

    // Create the new user in the database
    try {
      const user = await prismaClient.user.create({
        data: {
          firstName,
          lastName,
          email,
          mobile,
          promoCode,
          salt,
          iv,
          password: hashPassword,
        },
      });

      // Cache the new user data in Redis
      await redisClient.setEx(userCacheKey, 300, JSON.stringify(user)); // Cache for 5 minutes

      // Generate JWT token for session
      const token = TokenUtils.generateToken({
        id: user.id,
        email: user.email,
      });
      await redisClient.setEx(`session:${user.id}`, 3600, token); // Cache session token for 1 hour

      const data = { ...user } as Partial<typeof user>;
      delete data.password;
      delete data.iv;
      delete data.salt;

      return {
        success: true,
        status: 201,
        message: "Registration successful.",
        accessToken: token,
        data,
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: "Failed to create user.",
      };
    }
  }
}
