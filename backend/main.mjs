// Import statements
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

// Import local modules, routes and database connection
import { connectMongoDB } from "./lib/db/mongoDB.mjs";
import auth_routes from "./lib/routes/auth_routes.mjs";
import portfolio_routes from "./lib/routes/portfolio_routes.mjs";
import photo_routes from "./lib/routes/photo_routes.mjs";

/**
 * Backend server class
 */
class backendServer {
  constructor(port) {
    this.app = express();
    this.port = port;
  }

  loadMiddlewares() {
    this.app.use(cors({
      origin: true,
      credentials: true,
    }));

    // JSON Body Parser (WICHTIG für req.body beim Upload)
    // Limit hoch, weil Base64-DataURLs sonst zu groß sind (sonst 413 / req.body = undefined)
    this.app.use(express.json({ limit: "25mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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

  setupRoutes() {
   this.app.use("/api", auth_routes);
    this.app.use("/api", portfolio_routes);
     this.app.use("/api", photo_routes);
  }
  
  // Starts the backend server
  async start() {
    this.loadMiddlewares();
    this.testRoute();
    this.setupRoutes();

    this.app.listen(this.port, async () => {
      console.log(`Backend server is running on port ${this.port}`);

      try {
        await connectMongoDB();
        console.log("Connected to MongoDB successfully.");
      } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
      }
    });
  }
}

// Start backend server
const backendStart = new backendServer(process.env.BACKEND_PORT || 3000);
backendStart.start();
