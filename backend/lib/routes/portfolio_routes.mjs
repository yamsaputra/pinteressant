/**
 * @title Portfolio Routes
 * @description Defines public portfolio API routes for viewing user portfolios and albums.
 * @module routes/portfolio_routes
 */

// Import external libraries
import express from "express";

// Import local modules
import { getPortfolio, getPortfolioAlbum } from "../controllers/portfolio_ctrl.mjs";

const router = express.Router();

// Public portfolio routes
router.get("/portfolio/:username", getPortfolio);
router.get("/portfolio/:username/:slug", getPortfolioAlbum);

export default router;