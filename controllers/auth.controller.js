import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

// what is a req body-> req.body is an object containing the data from client(in POST request we pass some data);

export const signUp = async (req, res, next) => {
  const session = await mongoose.startSession(); //session of a mongoose transaction, it has nothing to with the user session
  session.startTransaction(); // we are doing this because we want to perform something known as atomic updates
  // You're starting a new MongoDB session and beginning a transaction.
  // This tells MongoDB:“From here on, treat all DB operations as a single unit of work.”
  try {
    const { name, email, password } = req.body;

    // Check if a user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10); // complexity that we use for randomising our password
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUsers = await User.create(
      [{ name, email, password: hashedPassword }],
      { session }
    ); // we have added a session here it means that if something goes wrong before committing the session we will abort this step and no user would be there in the database
    const token = jwt.sign({ userId: newUsers[0]._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    // We generate a JWT (JSON Web Token) during signup so the user doesn't have to log in separately.
    // This provides a smooth user experience by automatically logging them in right after account creation.
    // The token contains the user's ID and is signed with a secret key to ensure it can't be tampered with.
    // 'expiresIn' sets how long the token remains valid (e.g., "1h", "7d").
    // The token is sent to the frontend, which stores it and includes it in future requests to access protected routes.
    //
    // 🔄 ALTERNATIVE APPROACH (If we *don't* generate the token now):
    // - After successful signup, we simply respond with a success message like:
    //     res.status(201).json({ success: true, message: "User created. Please log in." });
    // - The frontend will then redirect the user to the login page.
    // - During login, we verify the user's credentials and *then* generate the JWT token.
    // - This is useful when you want the user to verify their email or manually confirm their login before accessing protected features.
    

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        token,
        user: newUsers[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {};
