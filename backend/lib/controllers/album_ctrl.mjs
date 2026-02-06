// Import local Cloud modules and DB models
import { Photo, Album } from "../db/models/model_index.mjs";
import { deleteImage } from "../cloudinary/cloud_utils.mjs";

// CREATE/POST requests
/**
 * @title Create Album
 * @description Creates a new album for the authenticated user with a generated slug from the title.
 * @route POST /api/albums
 * @access Private (requires authentication)
 * @param {String} req.body.title - Title of the album (required)
 * @param {String} [req.body.description] - Optional description of the album
 * @param {Number} [req.body.columns] - Optional column count for layout (default: 2)
 * @param {Number} [req.body.gap] - Optional gap size for layout (default: 20)
 * @param {Boolean} [req.body.showInNav] - Optional flag to show album in portfolio navigation (default: false)
 * @param {*} res - status 201 with created album if successful
 * @throws 500 if error during album creation
 * @returns 201 with created album data if successful
 */
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
/**
 * @title Get Own Albums
 * @description Fetches all albums belonging to the authenticated user, including photo count and cover photo.
 * @route GET /api/albums
 * @access Private (requires authentication)
 * @param {*} res - status 200 with array of albums including photoCount
 * @throws 500 if error during fetch
 * @returns 200 with albums array (each album includes photoCount and populated coverPhoto)
 */
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
/**
 * @title Update Album
 * @description Updates album metadata (title, description, layout, etc.) if the user is the owner. Auto-generates a new slug if title changes.
 * @route PUT /api/albums/:id
 * @access Private (requires authentication)
 * @param {String} req.params.id - ID of the album to update
 * @param {JSON} req.body - Fields to update (e.g. { title: "New Title", description: "Updated" })
 * @param {*} res - status 200 with updated album if successful
 * @throws 403 if user is not owner of the album, 404 if album not found, 500 if error during update
 * @returns 200 with updated album data if successful
 */
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
/**
 * @title Delete Album
 * @description Deletes an album if the user is the owner. Optionally deletes all photos in the album from Cloudinary and MongoDB, or unlinks them.
 * @route DELETE /api/albums/:id
 * @access Private (requires authentication)
 * @param {String} req.params.id - ID of the album to delete
 * @param {String} [req.query.deletePhotos] - If "true", also deletes all photos in the album; otherwise photos are unlinked
 * @param {*} res - status 200 with success message if successful
 * @throws 403 if user is not owner of the album, 404 if album not found, 500 if error during deletion
 * @returns 200 with deletion confirmation message
 */
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
