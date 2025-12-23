// Import statements
import express from "express";
import { uploadImage, getThumbnailURL } from "../cloudinary/cloudUtils.mjs";
const router = express.Router();

// Route to handle image upload
router.post("/upload", async (req, res) => {
  try {
    const { imageURL } = req.body;
    const result = await uploadImage(imageURL, "pins");

    res.json({
      message: "Image uploaded successfully",
      imageURL: result.url,
      thumbnailURL: getThumbnailURL(result.publicID),
      publicID: result.publicID,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Image upload failed", details: err.message });
  }
});

// Production route: Create pin (includes upload)
router.post("/pins", async (req, res) => {
  try {
    const { title, description, imageURL, boardID, userID, tags } = req.body;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(imageURL, "pins");

    // Save to MongoDB
    const newPin = await Pin.create({
      title,
      description,
      image: {
        url: uploadResult.url,
        publicID: uploadResult.publicID,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      thumbnailURL: getThumbnailURL(uploadResult.publicID),
      owner: userID,
      board: boardID || null,
      tags: tags || [],
    });

    // Add pin to board if specified
    if (boardID) {
      await Board.findByIdAndUpdate(boardID, { $push: { pins: newPin._id } });
    }
    res.status(201).json({ message: "Pin created successfully", pin: newPin });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create pin", details: err.message });
  }
});
export default router;
