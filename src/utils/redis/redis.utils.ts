import redisClient from "../../lib/redisClient";

export class RedisUtils {
  /**
   * Rate Limiter function to restrict the number of requests per user within a defined time window
   * @param userId - Unique identifier for the user or IP address
   * @param limit - Number of allowed requests per window
   * @param windowSeconds - Time window in seconds for rate limiting
   * @returns - Result indicating if rate limit was exceeded
   */
  public static async rateLimiter(
    userId: string,
    limit = 5,
    windowSeconds = 60
  ) {
    const key = `rate_limit:${userId}`;
    const requests = await redisClient.incr(key);

    // Set expiration time for the rate limit window
    if (requests === 1) await redisClient.expire(key, windowSeconds);

    // If requests exceed the limit, return a 429 error
    if (requests > limit) {
      return {
        success: false,
        status: 429,
        message: "Rate limit exceeded. Please try again later.",
      };
    }
    return { success: true };
  }
}
