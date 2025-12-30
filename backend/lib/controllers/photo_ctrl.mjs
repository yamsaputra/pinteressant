// Import local Cloud modules and DB models
import { Photo, Album } from "../db/models/model_index.mjs";
import {
  uploadImage,
  deleteImage,
  getOptimizedURL,
  getThumbnailURL,
} from "../cloudinary/cloud_utils.mjs";

// Controller for uploading a photo
export const uploadPhoto = async (req, res) => {
  try {
    const {
      title,
      description,
      imageURL,
      albumID,
      tags,
      camera,
      location,
      dateTaken,
    } = req.body;
    const userID = req.user.Id; // Assuming user ID is set in req.user by auth middleware

    if (albumID) {
      const album = await Album.findById(albumID);
      if (!album || album.userID.toString() !== userID) {
        return res
          .status(403)
          .json({ error: "Album not found or unauthorized access." });
      }
    }

    const uploadResult = await uploadImage(imageURL, `portfolio/${userID}`);

    const newPhoto = await Photo.create({
      title,
      description,
      imageURL: uploadResult.url,
      publicID: uploadResult.publicID,
      width: uploadResult.width,
      height: uploadResult.height,
      thumbnailURL: getThumbnailURL(uploadResult.publicID),
      owner: userID,
      album: albumID || null,
      tags: tags || [],
      camera,
      location,
      dateTaken,
    });

    res
      .status(201)
      .json({ message: "Photo uploaded successfully.", photo: newPhoto });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to upload photo.", details: err.message });
  }
};

// Get own photos (dashboard)
export const getMyPhotos = async (req, res) => {
  try {
    const { page = 1, limit = 20, album } = req.query;
    const userID = req.user.Id;

    const query = { owner: userID };
    if (album) query.album = album;

    const photos = await Photo.find(query)
      .populate("album", "title")
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Photo.countDocuments(query);

    console.log(`photo_ctrl: Fetched ${photos.length} photos for user ${userID}`);
    res.json({
      photos,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("photo_ctrl: 500 Error fetching photos:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch photos.", details: err.message });
  }
};

// Update photo
export const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.Id;

    const photo = await Photo.findById(id);
    if (!photo) {
      console.error("photo_ctrl: 404 Photo not found for ID:", id);
      return res.status(404).json({ error: "Photo not found." });
    }

    const updatedPhoto = await Photo.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json({ message: "Photo updated.", photo: updatedPhoto });
  } catch (err) {
    console.error("photo_ctrl: 500 Error updating photo:", err);
    res
      .status(500)
      .json({ error: "Failed to update photo.", details: err.message });
  }
};

// Delete photo
export const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.Id;

    const photo = await Photo.findById(id);
    if (!photo) {
      console.error("photo_ctrl: 404 Photo not found for ID:", id);
      return res.status(404).json({ error: "Photo not found." });
    }

    if (photo.owner.toString() !== userID) {
      console.error(
        "photo_ctrl: 403 Unauthorized delete attempt by user:",
        userID
      );
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this photo." });
    }

    await deleteImage(photo.image.publicID);
    await Photo.findByIdAndDelete(id);

    console.log("photo_ctrl: 204 Photo deleted successfully for ID:", id);
    res.json({ message: "Photo deleted successfully.", status: 204 });
  } catch (err) {
    console.error("photo_ctrl: 500 Error deleting photo:", err);
    res
      .status(500)
      .json({ error: "Failed to delete photo.", details: err.message });
  }
};
