import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    category: {
      type: String,
      enum: [
        "sports",
        "news",
        "entertainment",
        "lifestyle",
        "technology",
        "finance",
        "politics",
        "other",
      ],
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(), //new Date() is the current date
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      //how to validate a property before it is saved in the database
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },

    //cross reference to user model,This enables Mongoose population, which lets you fetch full user data from the user ID.
    //This is useful for getting user details without having to query the User collection separately.
    // if you call Subscription.find().populate("user");
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //Assuming that we have a User model defined in the same way
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate renewal date if missing.
// this is a Mongoose middleware function that runs before saving a document to MongoDB.
//This is called a pre-save hook in Mongoose
// subscriptionSchema.pre('save', function (next) {
//   // logic...
//   next();
// });
// This tells Mongoose: "Before saving a subscription document, run this function."

// this inside the function refers to the document being saved.

// next() is a callback to move to the next middleware or complete the save.

subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(
      this.renewalDate.getDate() + renewalPeriods[this.frequency]
    );
  }

  // Auto-update the status if renewal date has passed
  if (this.renewalDate < new Date()) {
    this.status = "expired";
  }

  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
