import User from "../models/user.model.js";
import { ADMIN_EMAIL } from "../config/env.js";

// GET /api/users (admin only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id (user can access own data or admin)
export const getUser = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;

    const loggedInUserId = req.user._id.toString();
    console.log("req.user", req.user.email);

    const isAdmin = req.user.email === ADMIN_EMAIL;

    if (requestedUserId != loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,

        message: "You are not authorized to view this user's data",
      });
    }

    const user = await User.findById(requestedUserId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id (update user or admin)
export const updateUser = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUserId = req.user._id.toString();

    const isAdmin = req.user.email === ADMIN_EMAIL;

    if (requestedUserId !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this user's data",
      });
    }

    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      requestedUserId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id (delete user or admin)
export const deleteUser = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUserId = req.user._id.toString();

    const isAdmin = req.user.email === ADMIN_EMAIL;

    if (requestedUserId !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this user",
      });
    }

    const deletedUser = await User.findByIdAndDelete(requestedUserId);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
