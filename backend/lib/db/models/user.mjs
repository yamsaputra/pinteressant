/**
 * @title User Schema
 * @description Mongoose schema for users. Stores credentials, profile info (displayName, bio, avatar), social links, and portfolio settings.
 * @module db/models/user
 */

// Import statements
import mongoose from "mongoose";

// User-schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  displayName: {
    type: String,
    trim: true,
  },
  tagline: {
    type: String,
    maxlength: 100,
    default: "photographer.",
  },
  avatar: {
    url: { type: String, default: "" },
    publicID: { type: String, default: "" },
  },
  bio: {
    type: String,
    maxlength: 2000,
    default: "",
  },
  socialLinks: {
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    website: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  portfolioSettings: {
    defaultColumns: { type: Number, default: 2, min: 1, max: 4 },
    defaultGap: { type: Number, default: 20 },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);