// src/lib/redisClient.ts
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL, // Set to Redis URL
});

// Handle connection errors
redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

export default redisClient;
