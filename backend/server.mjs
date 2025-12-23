// Import statements
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Load environment variables from .env file
dotenv.config();

// Import local modules
import { connectMongoDB } from "./lib/db/mongoDB.mjs";

// Import routes
import postReqs from "./lib/routes/postReqs.mjs";

// Initialize Express app
const app = express();
const PORT = process.env.PORT;

// Load middlewares
app.use(express.json());
app.use(cookieParser());

// Initialize Express Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Connect to MongoDB when the server starts
  connectMongoDB()
    .then(() => {
      console.log("Connected to MongoDB successfully.");
    })
    .catch((error) => {
      console.error("Failed to connect to MongoDB:", error);
    });
});

// Test Route
app.get("/test", (req, res) => {
  res.send("Hello, World!");
});

// POST Routes
app.use("/api", postReqs);
