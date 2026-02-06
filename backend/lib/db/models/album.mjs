/**
 * @title Album Schema
 * @description Mongoose schema for photo albums. Each album belongs to a user (owner), has a unique slug per user, layout settings, and publishing/navigation flags.
 * @module db/models/album
 */

// Import statements
import mongoose from "mongoose";

// Album-schema definition
const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 500,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  coverPhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Photo",
  },
  layout: {
    columns: { type: Number, default: 2, min: 1, max: 4 },
    gap: { type: Number, default: 20 },
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  showInNav: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Ensure unique slug per user
albumSchema.index({ owner: 1, slug: 1 }, { unique: true });

export default mongoose.model("Album", albumSchema);