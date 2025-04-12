import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "./env.js";
// import Redis from "ioredis";

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
});

// Handle connection error
redisClient.on("error", (err) => {
  console.error("❌ Failed to connect to Redis:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

export default redisClient;
