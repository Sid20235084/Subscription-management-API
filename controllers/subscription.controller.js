import Subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL, ADMIN_EMAIL } from "../config/env.js";

// GET /api/subscriptions (admin only)
// Retrieves all subscriptions with no filter
export const getAllSubscription = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
};

// POST /api/subscriptions
// Creates a new subscription for the logged-in user
export const createSubscription = async (req, res, next) => {
  try {
    // Create subscription by spreading req.body and adding the user field from the token
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        "content-type": "application/json",
      },
      retries: 0,
    });

    res
      .status(201)
      .json({ success: true, data: { subscription, workflowRunId } });
  } catch (e) {
    next(e);
  }
};

// GET /api/subscriptions/:id
// Retrieves details of a single subscription by its ID.
// Accessible by subscription owner or admin.
export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    // Check if the subscription belongs to the logged-in user or if the user is admin
    if (subscription.user.toString() !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this subscription",
      });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (e) {
    next(e);
  }
};

// PUT /api/subscriptions/:id
// Updates a subscription document. Only the owner or admin can update.
export const updateSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    // Retrieve the existing subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    // Check permission: subscription must belong to logged-in user or user must be admin
    if (subscription.user.toString() !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this subscription",
      });
    }

    // Update subscription using $set operator with validation and returning the new document
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId, // The subscription ID to update
      { $set: req.body }, // Use MongoDB's $set to update only the specified fields
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/subscriptions/:id
// Deletes a subscription. Only the owner or admin may perform deletion.
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    // Retrieve the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    // Check permission
    if (subscription.user.toString() !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this subscription",
      });
    }

    await Subscription.findByIdAndDelete(subscriptionId);
    res
      .status(200)
      .json({ success: true, message: "Subscription deleted successfully" });
  } catch (e) {
    next(e);
  }
};

// PUT /api/subscriptions/:id/cancel
// Cancels a subscription by updating its status and adding a cancellation date.
// Only accessible by the owner or an admin.
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    // Retrieve the subscription first
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    // Check permission: only owner or admin can cancel
    if (subscription.user.toString() !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this subscription",
      });
    }

    // Update the subscription status to 'cancelled' and add the cancellation date (current date)
    const cancelledSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $set: { status: "cancelled", cancellationDate: new Date() } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: cancelledSubscription,
    });
  } catch (e) {
    next(e);
  }
};

// GET /api/subscriptions/upcoming-renewals
// Retrieves subscriptions with upcoming renewal dates. If user is an admin, return all;
// otherwise, return only the subscriptions that belong to the logged-in user.
// For demonstration, we consider subscriptions with a renewalDate within the next 7 days.
export const upcomingRenewals = async (req, res, next) => {
  try {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    let query = {
      renewalDate: { $gte: now, $lte: next7Days },
    };

    // If the user is not an admin, filter the subscriptions by their user ID.
    if (!isAdmin) {
      query.user = loggedInUserId;
    }

    const subscriptions = await Subscription.find(query);
    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
};

// GET /api/subscriptions/user/:id
// Gets all the subscriptions of a particular user by ID (only accessible by the user themselves or an admin)
export const getUserSubscriptions = async (req, res, next) => {
  try {
    const requestedUserId = req.params.id;
    const loggedInUserId = req.user._id.toString();
    const isAdmin = req.user.email === ADMIN_EMAIL;

    if (requestedUserId !== loggedInUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized access. You can only view your own subscriptions.",
      });
    }

    const subscriptions = await Subscription.find({ user: requestedUserId });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
};

// all subscriptions routes have been verified and are working as expected.
