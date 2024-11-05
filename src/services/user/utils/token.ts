

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "$superSecretKey";


export class TokenUtils {
      /**
   * Generate JWT token for session management
   * @param payload - Object to encode within the JWT
   * @returns - Signed JWT token
   */
  public static generateToken(payload: Record<string, any>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  }

  /**
   * Decode and verify JWT token
   * @param token - JWT token to decode
   * @returns - Decoded token data
   * @throws Error if the token is invalid or expired
   */
  public static decodeToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new Error("Invalid or expired token.");
    }
  }
}