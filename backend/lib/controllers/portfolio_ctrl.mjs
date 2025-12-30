// Import local Cloud modules and DB models
import { User, Photo, Album } from "../db/models/model_index.mjs";

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:4000";

// GET requests
// Get user's public portfolio
export const getPortfolio = async (req, res) => {
    try {
        const { username } = req.params;

        // Fetch user from auth server
        const userResponse = await 
