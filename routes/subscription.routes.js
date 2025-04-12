import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import {
  createSubscription,
  getAllSubscription,
  getSubscriptionDetails,
  updateSubscription,
  deleteSubscription,
  cancelSubscription,
  getUserSubscriptions,
  upcomingRenewals,
} from "../controllers/subscription.controller.js";
import isAdmin from "../middlewares/admin.middleware.js";

const subscriptionRouter = Router();

// GET /api/subscriptions - Only admins may access all subscriptions
subscriptionRouter.get("/", authorize, isAdmin, getAllSubscription);

// ✅ Place static routes BEFORE dynamic `/:id`
subscriptionRouter.get("/upcoming-renewals", authorize, upcomingRenewals);
subscriptionRouter.get("/user/:id", authorize, getUserSubscriptions);
subscriptionRouter.put("/:id/cancel", authorize, cancelSubscription);

// GET /api/subscriptions/:id - Get details of a subscription by its ID
subscriptionRouter.get("/:id", authorize, getSubscriptionDetails);

// POST /api/subscriptions - Create a new subscription (logged-in users only)
subscriptionRouter.post("/", authorize, createSubscription);

// PUT /api/subscriptions/:id - Update a subscription (accessible by owner or admin)
subscriptionRouter.put("/:id", authorize, updateSubscription);

// DELETE /api/subscriptions/:id - Delete a subscription (accessible by owner or admin)
subscriptionRouter.delete("/:id", authorize, deleteSubscription);

export default subscriptionRouter;
