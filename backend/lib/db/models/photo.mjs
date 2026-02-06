/**
 * @title Photo Schema
 * @description Mongoose schema for photos. Stores image URLs, Cloudinary public IDs, metadata (tags, camera, location), and references to owner and album.
 * @module db/models/photo
 */

// Import statements
import mongoose from "mongoose";

// Photo-schema definition
const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
    default: "",
  },
  image: {
    url: { type: String, required: true },
    publicID: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
  },
  thumbnailURL: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Album",
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  camera: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  dateTaken: {
    type: Date,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("Photo", photoSchema);