import jwt from "jsonwebtoken";
import redisClient from "../config/redis.client.js";

import { JWT_SECRET } from "../config/env.js";
import User from "../models/user.model.js";

const authorize = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    const isBlacklisted = await redisClient.get(token);
    if (!token||isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Session expired or unauthorized. Please sign in again.",
      });
    }
   
   
   

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

export default authorize;
