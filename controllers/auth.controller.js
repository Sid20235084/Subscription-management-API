import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.client.js";
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
      const error = new Error("Invalid Username or Password");
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); // bcrypt.compare() is used to compare the plain text password with the hashed password stored in the database.

    if (!isPasswordValid) {
      const error = new Error("Invalid Username or Password");
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

//Client handled JWT Sign Out;

// export const signOut = async (req, res, next) => {
//   try {
//     // Since JWTs are stateless, we don't need to do much on the server.
//     // Just instruct the frontend to clear the token.
//     res.status(200).json({
//       success: true,
//       message: "User signed out successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//server side signout handling;

export const signOut = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "No token found" });
    }

    const decoded = jwt.decode(token);
    const expiresInSec = 60 * 60 * 24; // 1 day in seconds
    // Store the token in Redis with an expiration time

    await redisClient.set(token, "blacklisted", "EX", expiresInSec);

    res
      .status(200)
      .json({ success: true, message: "User signed out successfully" });
  } catch (error) {
    next(error);
  }
};

// HTTP Authorization Header Explained

/*
  ✅ What is the Authorization Header?

  The Authorization header is part of HTTP metadata. It carries authentication credentials —
  most commonly, a JWT (JSON Web Token) — so the backend can identify and authorize the client.

  Example:
    Authorization: Bearer <your_token_here>

  This is used in APIs where users log in and receive a token to access protected resources.
*/

/*
  🔐 Common Format for JWT:

  When using JWTs (Bearer Tokens), the Authorization header typically looks like:

    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  - "Bearer" is the authentication scheme.
  - The token follows the scheme after a space.
*/

/*
  💡 How the Flow Works:

  1. Frontend: User logs in and gets a token (JWT).
  2. Frontend: Sends a request to a protected API route and attaches the token:

     fetch('/api/protected', {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

  3. Backend: Middleware reads the Authorization header:
     - Extracts the token.
     - Verifies it's valid and not blacklisted.
     - Grants access to protected data.
*/

/*
  ✅ What is Metadata in an HTTP Request?

  Metadata = data *about* the request — not the main content.
  It's used to give the server context on how to handle the request.

  🔍 Examples of HTTP Headers (Metadata):

    - Content-Type: type of the request body (e.g., application/json)
    - Authorization: contains login credentials like JWT
    - User-Agent: info about the client's browser or app
    - Accept: what kind of responses the client can handle
    - Host: domain of the request
    - Content-Length: size of the body in bytes
*/

/*
  🧠 Example HTTP Request with Metadata:

    POST /dashboard HTTP/1.1
    Host: api.example.com
    Authorization: Bearer eyJhbGciOiJIUzI1...
    Content-Type: application/json

    Body:
    {
      "data": "user info or something else"
    }

  ➤ The Authorization header is part of the metadata — it's not the main data (body), but info
    that the server uses to know how to handle the request.
*/
