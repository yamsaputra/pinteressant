// Import DB models
import { User, Album, Photo } from "../db/models/model_index.mjs";

/**
 * @title Get Portfolio
 * @description Fetches public portfolio data for a user by username, including profile info and published albums.
 * @route GET /api/portfolio/:username
 * @access Public
 * @param {String} req.params.username - Username of the portfolio owner
 * @param {*} res - status 200 with user profile and albums
 * @throws 404 if portfolio not found (user does not exist or is inactive), 500 if fetch fails
 * @returns 200 with user (profile fields) and albums (published, navigable, with cover photos)
 */
export const getPortfolio = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      username: username.toLowerCase(), 
      isActive: true 
    }).select("username displayName tagline avatar bio socialLinks portfolioSettings");

    if (!user) {
      console.error("portfolio_ctrl: 404 Get portfolio error: Portfolio not found for username", username);
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const albums = await Album.find({ 
      owner: user._id, 
      isPublished: true, 
      showInNav: true 
    })
      .populate("coverPhoto", "thumbnailURL")
      .sort({ order: 1 });

    res.json({ user, albums });
  } catch (err) {
    console.error("Get portfolio error:", err);
    res.status(500).json({ error: "Failed to get portfolio", details: err.message });
  }
};

/**
 * @title Get Portfolio Album
 * @description Fetches a specific published album and its published photos from a user's public portfolio.
 * @route GET /api/portfolio/:username/:slug
 * @access Public
 * @param {String} req.params.username - Username of the portfolio owner
 * @param {String} req.params.slug - URL slug of the album
 * @param {*} res - status 200 with album, photos, and user data
 * @throws 404 if portfolio or album not found, 500 if fetch fails
 * @returns 200 with album, photos array, and user object
 */
export const getPortfolioAlbum = async (req, res) => {
  try {
    const { username, slug } = req.params;

    const user = await User.findOne({ 
      username: username.toLowerCase(), 
      isActive: true 
    });

    if (!user) {
      console.error(`portfolio_ctrl: 404 Get portfolio album error: Portfolio not found for username: ${username}`);
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const album = await Album.findOne({
      owner: user._id,
      slug,
      isPublished: true,
    });

    if (!album) {
      console.error("portfolio_ctrl: 404 Get portfolio album error: Album not found for slug", slug);
      return res.status(404).json({ error: "Album not found" });
    }

    const photos = await Photo.find({
      album: album._id,
      isPublished: true,
    }).sort({ order: 1, createdAt: -1 });

    res.json({ album, photos, user });
  } catch (err) {
    console.error("portfolio_ctrl: 500 Get portfolio album error:", err);
    res.status(500).json({ error: "Failed to get album", details: err.message });
  }
};