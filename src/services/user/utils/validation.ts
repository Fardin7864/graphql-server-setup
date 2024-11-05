import { createHmac } from "crypto";

class ValidationService {
  // Cache the last password validated and its result
  private static passwordCache = new Map<string, { isValid: boolean; errorMessage: string }>();

  // Validate that required fields are present
  public static validateRequiredFields(fields: Record<string, any>): {isValid: boolean; errorMessage: string;} {
    const missingFields = Object.entries(fields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

   
      if (missingFields.length > 0) {
        return {
          isValid: false,
          errorMessage: `Missing required fields: ${missingFields.join(", ")}`,
        };
      }
  
      return { isValid: true, errorMessage: "" };
  }

  // Validate password strength with caching
  public static isValidPassword(password: string): {
    isValid: boolean;
    errorMessage: string;
  } {
    if (this.passwordCache.has(password)) {
      return this.passwordCache.get(password)!;
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let result: { isValid: boolean; errorMessage: string };
    if (password.length < minLength) {
      result = {
        isValid: false,
        errorMessage: "Password must be at least 8 characters long.",
      };
    } else if (!hasUpperCase) {
      result = {
        isValid: false,
        errorMessage: "Password must include at least one uppercase letter.",
      };
    } else if (!hasLowerCase) {
      result = {
        isValid: false,
        errorMessage: "Password must include at least one lowercase letter.",
      };
    } else if (!hasNumber) {
      result = {
        isValid: false,
        errorMessage: "Password must include at least one number.",
      };
    } else if (!hasSymbol) {
      result = {
        isValid: false,
        errorMessage: "Password must include at least one special character.",
      };
    } else {
      result = { isValid: true, errorMessage: "" };
    }

    // Cache the result
    this.passwordCache.set(password, result);
    return result;
  }

}

export default ValidationService;