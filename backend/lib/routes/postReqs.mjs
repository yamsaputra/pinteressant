// Import statements
import express from 'express';
import { uploadImage, getThumbnailURL } from '../cloudinary/cloudUtils.mjs';
const router = express.Router();

// Route to handle image upload
router.post('/upload', async (req, res) => {
    try {
        const  { imageURL } = req.body;
        const result = await uploadImage(imageURL, "pins");

        res.json({
            message: "Image uploaded successfully",
            imageURL: result.url,
            thumbnailURL: getThumbnailURL(result.publicID),
            publicID: result.publicID

        });
    } catch (err) {
        res.status(500).json({ error: 'Image upload failed', details: err.message });
    }
});

export default router;