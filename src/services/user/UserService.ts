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

class UserService {
    private static generateHash(salt: string, password: string) {
        const hashedPassword = createHmac('sha256', salt)  // Corrected "sha256" here
            .update(password)
            .digest('hex');
        return hashedPassword;
    }

    public static createUser(payload: CreateUserPayload) {
        const { firstName, lastName, email, password } = payload;
        const salt = randomBytes(32).toString('hex');
        const hashPassword = UserService.generateHash(salt, password);  // Corrected variable name
        return prismaClient.user.create({
            data: {
                firstName,
                lastName,
                email,
                salt,
                password: hashPassword,  // Corrected variable name
            }
        });
    }

    private static getUserByEmail(email: string) {
        return prismaClient.user.findUnique({ where: { email } });
    }

    public static async getUserToken(payload: GetUserTokenPayload) { 
        const { email, password } = payload;
        const user = await UserService.getUserByEmail(email);

        if (!user) 
            throw new Error("User not found");

        const userSalt = user.salt;
        const userHashPassword = UserService.generateHash(userSalt, password);

        if (userHashPassword !== user.password)
            throw new Error("Incorrect password");

        const token = JWT.sign({ id: user.id, email: user.email }, JWT_SECRET);
        return token;
    }
}

export default UserService;
