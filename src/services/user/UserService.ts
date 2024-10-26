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

  public static async createUser(payload: CreateUserPayload) {
    const { firstName, lastName, email, password } = payload;
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
    return {
        success: true,
        status: 201,
        message: "Register successfull!",
        accessToken: token,
        user
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
            user: null
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
            user: null
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
        }
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
