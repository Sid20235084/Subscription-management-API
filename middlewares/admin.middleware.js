// middleware/isAdmin.js
import { ADMIN_EMAIL } from "../config/env.js";

const isAdmin = (req, res, next) => {
  const adminEmail = ADMIN_EMAIL;

  if (!req.user || adminEmail != req.user.email) {
    const error = new Error("Access denied. Admins only.");
    error.statusCode = 403;
    return next(error); // 🔁 Pass error to global error handler
  }

  next(); // User is admin, continue
};

export default isAdmin;
