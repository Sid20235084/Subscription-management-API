import User from "../models/user.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    // Check if the requested id matches the authenticated user's id
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not allowed to access this user's data.",
      });
    }

    const user = await User.findById(req.params.id).select("-password"); //req.params is a method to send the some data  through get request and it is used to get the data from the url. for example if we send a request to /user/1234 then req.params.id will be 1234. and select is used to select the fields that we want to return in the response. here we are excluding the password field from the response.

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
