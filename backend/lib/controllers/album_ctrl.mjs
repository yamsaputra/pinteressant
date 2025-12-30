// Import local Cloud modules and DB models
import { Photo, Album } from "../db/models/model_index.mjs";
import { deleteImage } from "../cloudinary/cloud_utils.mjs";

// CREATE/POST requests
// Create album
export const createAlbum = async (req, res) => {
  try {
    const { title, description, columns, gap, showInNav } = req.body;
    const userID = req.userId; // Assuming user ID is set in req.userId by auth middleware

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newAlbum = await Album.create({
      title,
      slug,
      description,
      owner: userID,
      layout: { columns: columns || 2, gap: gap || 20 },
      showInNav: showInNav || false,
    });

    console.log(
      `album_ctrl: 201 Album created successfully for user: ${userID}`
    );
    res
      .status(201)
      .json({ message: "Album created successfully.", album: newAlbum });
  } catch (err) {
    console.error("album_ctrl: 500 Error creating album:", err);
    res
      .status(500)
      .json({ error: "Failed to create album.", details: err.message });
  }
};

// READ/GET requests
// Get own album
export const getOwnAlbums = async (req, res) => {
  try {
    const userID = req.userId; // Assuming user ID is set in req.userId by auth middleware

    const albums = await Album.find({ owner: userID })
      .populate("coverPhoto", "thumbnailURL")
      .sort({ order: 1, createdAt: -1 });

    const albumsWithCount = await Promise.all(
      albums.map(async (album) => {
        const photoCount = await Photo.countDocuments({ album: album._id });
        return { ...album.toObject(), photoCount };
      })
    );

    console.log(
      `album_ctrl: Fetched ${albumsWithCount.length} albums for user ${userID}`
    );
    res.json({ albums: albumsWithCount });
  } catch (err) {
    console.error("album_ctrl: 500 Error fetching albums:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch albums.", details: err.message });
  }
};

// UPDATE/PUT requests
// Update album
export const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.userId;

    const album = await Album.findById(id);
    if (!album) {
      console.error("album_ctrl: 404 Album not found for ID:", id);
      return res.status(404).json({ error: "Album not found" });
    }

    if (album.owner.toString() !== userID) {
      console.error(
        "album_ctrl: 403 Unauthorized update attempt by user:",
        userID
      );
      return res.status(403).json({ error: "Not authorized" });
    }

    const updates = { ...req.body };
    if (updates.title) {
      updates.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const updatedAlbum = await Album.findByIdAndUpdate(id, updates, {
      new: true,
    });
    console.log(`album_ctrl: 200 Album updated successfully for ID: ${id}`);
    res.json({ message: "Album updated", album: updatedAlbum });
  } catch (err) {
    console.log(`album_ctrl: 500 Error updating album:`, err);
    res
      .status(500)
      .json({ error: "Failed to update album", details: err.message });
  }
};

// DELETE requests
// Delete album
export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletePhotos } = req.query;
    const userID = req.userId;

    const album = await Album.findById(id);
    if (!album) {
      console.error("album_ctrl: 404 Album not found for ID:", id);
      return res.status(404).json({ error: "Album not found" });
    }

    if (album.owner.toString() !== userID) {
      console.error(
        "album_ctrl: 403 Unauthorized delete attempt by user:",
        userID
      );
      return res.status(403).json({ error: "Not authorized" });
    }

    if (deletePhotos === "true") {
      const photos = await Photo.find({ album: id });
      for (const photo of photos) {
        await deleteImage(photo.image.publicID);
        await Photo.findByIdAndDelete(photo._id);
      }
    } else {
      await Photo.updateMany({ album: id }, { album: null });
    }

    await Album.findByIdAndDelete(id);
    console.log(`album_ctrl: 204 Album deleted successfully for ID: ${id}`);
    res.json({ message: "Album deleted successfully" });
  } catch (err) {
    console.error("album_ctrl: 500 Error deleting album:", err);
    res
      .status(500)
      .json({ error: "Failed to delete album", details: err.message });
  }
};
