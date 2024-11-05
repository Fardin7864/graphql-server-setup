import { prismaClient } from "../../../lib/db";
import redisClient from "../../../lib/redisClient";

export class UserService {
  /**
   * Retrieve single user by common field with caching
   * @param value - Value to search (e.g., email or userId)
   * @returns - User object if found
   */
  public static async getUserByCommonField(value: string) {
    const cacheKey = `user:${value}`;
    
    // Attempt to retrieve user data from Redis cache
    let user = await redisClient.get(cacheKey);
  
    // If the user data is found in the cache, parse and return it
    if (user) {
      return JSON.parse(user);
    }
  
    // If not cached, retrieve the user from the database
    try {
      const userFromDb = await prismaClient.user.findFirst({
        where: {
          OR: [{ email: value }, { userId: value }, { id: value }],
        },
      });
  
      // Cache retrieved user data if found
      if (userFromDb) {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(userFromDb)); // Cache for 5 minutes
      }
      return userFromDb;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

    /**
   * Retrieve all users with caching
   * @returns - Array of all user objects
   */
    public static async getAllUsers() {
      const cacheKey = "users:all";
    
      // Check Redis cache for all users data
      let users = await redisClient.get(cacheKey);
    
      // If users are found in the cache, parse and return them
      if (users) {
        return JSON.parse(users);
      }
    
      // If not cached, retrieve users from database
      const usersFromDb = await prismaClient.user.findMany();
    
      // Cache result for 5 minutes and convert to JSON string for Redis
      await redisClient.setEx(cacheKey, 300, JSON.stringify(usersFromDb));
    
      return usersFromDb;
    }

    
}
