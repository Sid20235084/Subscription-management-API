import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";
import {
  getUser,
  getUsers,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const userRouter = Router();

// Dummy route (optional)
// userRouter.get('/', (req, res) => res.send({ title: 'get users' }));

// Admin-only: Get all users
userRouter.get("/", authorize, isAdmin, getUsers); // you can also implement isAdmin logic in get users

// Authenticated: Get specific user by ID (only self or admin)
userRouter.get("/:id", authorize, getUser);

// Authenticated: Update user (only self or admin)
userRouter.put("/:id", authorize, updateUser);

// Authenticated: Delete user (only self or admin)
userRouter.delete("/:id", authorize, deleteUser);

// Optional sign-up placeholder
userRouter.post("/", (req, res) => res.send({ title: "Please Sign-up" }));

export default userRouter;

// All user routes have been verified and are working as expected.
