// Import external libraries
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

import authRoutes from "./lib/routes.mjs";

const AUTH_PORT = process.env.AUTH_PORT || 4000;

/**
 * Auth server class
 */
class authServer {
  constructor(port) {
    this.app = express();
    this.port = port;
    this.authRoutes = authRoutes;
  }

  loadMiddlewares() {
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: [process.env.FRONTEND_URL, process.env.BACKEND_URL],
        credentials: true,
      })
    );
  }

  setupRoutes() {
    this.app.get("/auth/test", (req, res) => {
      res.send("Greetings, world. The auth server of Pinteressant is running.");
      console.log("Auth test route accessed.");
    });
    this.app.use("/auth", this.authRoutes);
  }

  // Starts the auth server
  async start() {
    this.loadMiddlewares();
    this.setupRoutes();

    this.app.listen(this.port, () => {
      console.log(`Auth server for Pinteressant is running on port ${this.port}`);
    });
  }
}

// Start auth server
const authStart = new authServer(AUTH_PORT);
authStart.start();
