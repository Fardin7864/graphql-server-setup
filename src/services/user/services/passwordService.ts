export class PasswordService {
    private static lowercase = "abcdefghijklmnopqrstuvwxyz";
    private static uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static numbers = "0123456789";
    private static symbols = "!@#$%^&*()_+[]{}|;:,.<>?";
  
    public static generatePassword(length: number = 12): string {
      const getRandomChar = (chars: string) =>
        chars[Math.floor(Math.random() * chars.length)];
  
      const passwordChars = [
        getRandomChar(this.lowercase),
        getRandomChar(this.uppercase),
        getRandomChar(this.numbers),
        getRandomChar(this.symbols),
      ];
  
      const allChars = this.lowercase + this.uppercase + this.numbers + this.symbols;
      for (let i = passwordChars.length; i < length; i++) {
        passwordChars.push(getRandomChar(allChars));
      }
  
      return passwordChars.sort(() => Math.random() - 0.5).join("");
    }
  
    public static validatePassword(password: string): { isValid: boolean; errorMessage: string } {
      const minLength = 8;
      if (password.length < minLength) return { isValid: false, errorMessage: "Password must be at least 8 characters long." };
      if (!/[A-Z]/.test(password)) return { isValid: false, errorMessage: "Password must include an uppercase letter." };
      if (!/[a-z]/.test(password)) return { isValid: false, errorMessage: "Password must include a lowercase letter." };
      if (!/\d/.test(password)) return { isValid: false, errorMessage: "Password must include a number." };
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, errorMessage: "Password must include a special character." };
  
      return { isValid: true, errorMessage: "" };
    }
  }
  