// Import statements
import mongoose from "mongoose";

// Pin Schema definition
const pinSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
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
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
  },
  sourceURL: {
    type: String,
    default: "",
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],
  repinCount: {
    type: Number,
    default: 0,
  },
  originalPin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pin",
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("Pin", pinSchema);
