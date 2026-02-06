// Import local Cloud modules and DB models
import { Photo, Album } from "../db/models/model_index.mjs";
import {
  uploadImage,
  deleteImage,
  getOptimizedURL,
  getThumbnailURL,
} from "../cloudinary/cloud_utils.mjs";

/**
 * @title Upload Photo
 * @description Uploads a photo to Cloudinary and saves metadata in MongoDB. Optionally assigns it to an album.
 * @route POST /api/upload
 * @access Private (requires authentication)
 * @param {String} req.body.title - Title of the photo
 * @param {String} req.body.description - Description of the photo
 * @param {String} req.body.imageURL - Base64 data URL or external URL of the image to upload
 * @param {String} [req.body.albumID] - Optional album ID to assign the photo to
 * @param {Array} [req.body.tags] - Optional array of tags
 * @param {String} [req.body.camera] - Optional camera information
 * @param {String} [req.body.location] - Optional location information
 * @param {Date} [req.body.dateTaken] - Optional date when the photo was taken
 * @param {*} res - status 201 with created photo if successful
 * @throws 403 if album not found or unauthorized, 500 if upload or save fails
 * @returns 201 with uploaded photo data if successful
 */
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
    const userID = req.userId; // Assuming user ID is set in req.userId by auth middleware

    console.log("photo_ctrl: uploadPhoto called by user:", userID);
    console.log("photo_ctrl: Received data:", req.body.title)

    if (albumID) {
      const album = await Album.findById(albumID);

      console.log("photo_ctrl: Verifying album ownership for albumID:", albumID);
      if (!album || album.userID.toString() !== userID) {
        return res
          .status(403)
          .json({ error: "Album not found or unauthorized access." });
      }
    }

    const uploadResult = await uploadImage(imageURL, `portfolio/${userID}`);

    console.log("photo_ctrl: Image uploaded to Cloudinary:", uploadResult);

    const newPhoto = await Photo.create({
      title,
  description,
  image: {
    url: uploadResult.url,
    publicID: uploadResult.publicID,
  },
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

/**
 * @title Get My Photos
 * @description Fetches the authenticated user's own photos with pagination and optional album filter.
 * @route GET /api/photos
 * @access Private (requires authentication)
 * @param {Number} [req.query.page=1] - Page number for pagination
 * @param {Number} [req.query.limit=20] - Number of photos per page
 * @param {String} [req.query.album] - Optional album ID to filter photos by
 * @param {*} res - status 200 with paginated photos array
 * @throws 500 if error during fetch
 * @returns 200 with photos, totalPages, and currentPage
 */
export const getMyPhotos = async (req, res) => {
  try {
    const { page = 1, limit = 20, album } = req.query;
    const userID = req.userId;

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

/**
 * @title Update Photo
 * @description TODO: Updates photo metadata (title, description, tags, etc.) if the user is the owner.
 * @route PUT /api/photos/:id
 * @access Private (requires authentication)
 * @param {String} req.params.id - ID of the photo to update
 * @param {JSON} req.body - fields to update (e.g. { title: "New Title", tags: ["tag1", "tag2"] })
 * @param {*} res - status 200 with updated photo if successful
 * @throws 403 if user is not owner of the photo, 404 if photo not found, 500 if error during update
 * @returns 200 with updated photo if successful
 */
export const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.userId;

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

/**
 * @title Delete Photo
 * @description Deletes a photo from Cloudinary and MongoDB if the user is the owner.
 * @route DELETE /api/photos/:publicID
 * @access Private (requires authentication)
 * @param {String} req.params.publicID - publicID of the photo to delete (e.g. "portfolio/user123/abc") 
 * @param {JSON} res - status 204 if deleted
 * @throws 403 if user is not owner of the photo, 404 if photo not found, 500 if error during deletion
 * @returns 204 if photo deleted successfully
 */
export const deletePhoto = async (req, res) => {
  try {
    const { publicID } = req.params;
    const userID = req.userId;

    // Decode the publicID (it contains slashes like "portfolio/user123/abc")
    const decodedPublicID = decodeURIComponent(publicID);

    console.log("photo_ctrl: deletePhoto called by user:", userID, "for publicID:", decodedPublicID);

    // 1. Erst Photo aus MongoDB suchen (nach image.publicID)
    // 1. Search for the photo in MongoDB by matching the image.publicID with the decoded publicID
    const photo = await Photo.findOne({ "image.publicID": decodedPublicID });
    
    if (!photo) {
      console.error("photo_ctrl: 404 Photo not found for publicID:", decodedPublicID);
      return res.status(404).json({ error: "Photo not found." });
    }

    // 2. Ownership prüfen
    // 2. Check ownership
    if (photo.owner.toString() !== userID) {
      console.error("photo_ctrl: 403 Unauthorized delete attempt by user:", userID);
      return res.status(403).json({ error: "Unauthorized to delete this photo." });
    }

    // 3. Aus Cloudinary löschen
    // 3. Delete from Cloudinary
    await deleteImage(decodedPublicID);

    // 4. Aus MongoDB löschen
    // 4. Delete from MongoDB
    await Photo.findByIdAndDelete(photo._id);

    console.log("photo_ctrl: 204 Photo deleted successfully for publicID:", decodedPublicID);
    res.status(204).json({ message: "Photo deleted successfully." });
  } catch (err) {
    console.error("photo_ctrl: 500 Error deleting photo:", err);
    res.status(500).json({ error: "Failed to delete photo.", details: err.message });
  }
};
