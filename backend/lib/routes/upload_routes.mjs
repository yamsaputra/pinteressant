import express from "express";
import { verifyToken } from "../services/fetch_auth.mjs";
import { uploadImage, getThumbnailURL } from "../cloudinary/cloud_utils.mjs";

const router = express.Router();

/**
 * POST /api/upload
 * body: { imageURL: "https://..." } ODER DataURL "data:image/png;base64,..."
 */
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const { imageURL } = req.body;
    if (!imageURL) return res.status(400).json({ error: "imageURL is required" });

    const userID = req.userId; // kommt aus verifyToken
    const uploaded = await uploadImage(imageURL, `portfolio/${userID}`);

    res.status(201).json({
      imageURL: uploaded.url,
      thumbnailURL: getThumbnailURL(uploaded.publicID),
      publicID: uploaded.publicID,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

export default router;
