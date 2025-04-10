// Global Error Handling Middleware for Express.js apps
// Catches errors thrown in routes, controllers, or other middleware
// and formats them into a user-friendly JSON response.

const errorMiddleware = (err, req, res, next) => {
  try {
    // Create a shallow copy of the error object
    let error = { ...err }; // destructuring the error that we are getting through routes

    // Ensure the error message is preserved
    error.message = err.message;

    // Log full error details including stack trace
    console.error(err);

    // 🔹 Handle specific Mongoose-related errors

    // ✳️ Mongoose CastError (e.g., invalid MongoDB ObjectId like /user/123)
    // This typically happens when the provided ID doesn't match the 24-character hex format
    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = new Error(message);
      error.statusCode = 404; // Not Found
    }

    // ✳️ Mongoose duplicate key error (e.g., trying to register with an email that already exists)
    // Error code 11000 indicates violation of a unique index
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = new Error(message);
      error.statusCode = 400; // Bad Request
    }

    // ✳️ Mongoose validation errors (e.g., required fields missing, wrong data types, etc.)
    // Collects all validation error messages and joins them
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = new Error(message.join(', '));
      error.statusCode = 400; // Bad Request
    }

    // 🔹 Send structured error response to the client
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
    });

  } catch (error) {
    // In case the error handler itself throws an error,
    // pass it to the next error middleware (if any)
    next(error);
  }
};

export default errorMiddleware;

/*
💡 How it works in our app:
1. Any route/controller that throws an error OR calls next(err) will be forwarded here.
2. The middleware checks for common Mongoose errors and returns meaningful messages.
3. Ends the request-response cycle with a JSON response like:
   {
     success: false,
     error: "Resource not found" // or whatever the specific error is
   }
4. Makes debugging easier by logging to console and prevents app from crashing on unhandled errors.
*/
