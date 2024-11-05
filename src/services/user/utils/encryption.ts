import { createCipheriv, createDecipheriv, createHmac } from "crypto";
import ValidationService from "./validation";

class EncryptionServices {
  // Static method for encoding parameters with user-specific salt and IV
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

    let encrypted = cipher.update(concatenatedParams, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  }

  // Static method for decoding an encrypted string with user-specific salt and IV
  public static decodeParams(
    salt: string,
    iv: string,
    encodedString: string
  ): string {
    const key = Buffer.from(salt, "hex").slice(0, 32); // Ensure key is 256-bit (32 bytes)
    const ivBuffer = Buffer.from(iv, "hex");

    const decipher = createDecipheriv("aes-256-cbc", key, ivBuffer);

    let decrypted = decipher.update(encodedString, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  // Generate a SHA-256 hash of a password using a salt
  public static generateHash(salt: string, password: string): string {
    ValidationService.validateRequiredFields({ salt, password }); // Ensure salt and password are provided

    const hashCacheKey = `${salt}-${password}`;
    if (this.hashCache.has(hashCacheKey)) {
      return this.hashCache.get(hashCacheKey)!;
    }

    const hashedPassword = createHmac("sha256", salt)
      .update(password)
      .digest("hex");

    // Cache the hashed result for optimization
    this.hashCache.set(hashCacheKey, hashedPassword);
    return hashedPassword;
  }

  // Cache for hashed passwords to avoid rehashing the same inputs
  private static hashCache = new Map<string, string>();
}

export default EncryptionServices;