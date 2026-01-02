// Import DB models
import { User, Album, Photo } from "../db/models/model_index.mjs";

/**
 * @description Get public portfolio data for a user.
 * @param {Headers} req 
 * @param {Headers} res 
 * @returns 
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
 * @description Get a specific album and its photos from a user's portfolio.
 * @param {Headers} req 
 * @param {Headers} res 
 * @returns 
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