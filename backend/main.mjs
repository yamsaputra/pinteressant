// Import statements
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Load environment variables from .env file
dotenv.config();

// Import local modules
import { connectMongoDB } from "./lib/db/mongoDB.mjs";
import { backendRoutes } from "./index.mjs";

/**
 * Backend server class
 */
class backendServer {
  constructor(port) {
    this.app = express();
    this.port = port;
    this.backendRoutes = new backendRoutes(this.app);
  }

  loadMiddlewares() {
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  testRoute() {
    this.app.get("/test", (req, res) => {
      res.send(
        "Greetings, world. The backend server of Pinteressant is running."
      );
      console.log("Test route accessed.");
    });
  }

  // Starts the backend server
  async start() {
    this.loadMiddlewares();
    this.testRoute();
    this.backendRoutes.setupRoutes();

    this.app.listen(this.port, async () => {
      console.log(`Backend server is running on port ${this.port}`);

      try {
        await connectMongoDB();
        console.log("Connected to MongoDB successfully.");
      } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
      }
    });
  }
}

// Start backend server
const backendStart = new backendServer(process.env.BACKEND_PORT || 3000);
backendStart.start();
