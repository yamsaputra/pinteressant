// Import statements
import express from "express";

// Import local modules
import { connectMongoDB } from "./lib/db/mongoDB.mjs";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Test Route
app.get("/test", (req, res) => {
  res.send("Hello, World!");
});

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
