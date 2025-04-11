import express from "express";
import cookieParser from "cookie-parser";

import { PORT } from "./config/env.js";

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";
import workflowRouter from "./routes/workflow.routes.js";

const app = express();
// Initializes an Express application instance called 'app'.

app.use(express.json());
// Middleware to parse incoming requests with JSON payloads.
// It populates req.body with the parsed data if the Content-Type is application/json.

app.use(express.urlencoded({ extended: false }));
// Middleware to parse URL-encoded data (e.g., form submissions).
// `extended: false` means it uses the querystring library (not qs) to parse nested objects.

app.use(cookieParser());
// Middleware to parse the Cookie header and populate req.cookies with an object of cookie key-value pairs.

app.use(arcjetMiddleware);
// Custom or third-party middleware (e.g., security, rate-limiting, bot protection, etc.).
// 'arcjetMiddleware' needs to be defined/imported before this line.

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter);

app.use(errorMiddleware); //error middleware after all the routes; global error handling middleware

app.get("/", (req, res) => {
  res.send("Welcome to the Subscription Tracker API!");
});

app.listen(PORT, async () => {
  console.log(
    `Subscription Tracker API is running on http://localhost:${PORT}`
  );

  await connectToDatabase();
});

export default app;
