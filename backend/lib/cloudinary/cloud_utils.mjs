import cloudinary from "./cloud_config.mjs";

/**
 * @title Upload Image
 * @description Uploads an image to Cloudinary from a URL, file path, or base64 data URL.
 * @param {String} imagePath - Image source (URL, file path, or base64 data URL)
 * @param {String} [folder="pins"] - Cloudinary folder to upload into
 * @throws Error if Cloudinary upload fails
 * @returns {Object} Upload result with url, publicID, width, and height
 */
export const uploadImage = async (imagePath, folder = "pins") => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
        folder: folder,
        resource_type: "image",
      });
    return {
        url: result.secure_url,
        publicID: result.public_id,
        width: result.width,
        height: result.height,
        };
    } catch (error) {
  console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * @title Delete Image
 * @description Deletes an image from Cloudinary by its public ID.
 * @param {String} publicID - Cloudinary public ID of the image to delete
 * @throws Error if Cloudinary deletion fails
 * @returns {Object} Cloudinary destruction result
 */
export const deleteImage = async (publicID) => {
  try {
    const result = await cloudinary.uploader.destroy(publicID);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

/**
 * @title Get Optimized URL
 * @description Generates an optimized Cloudinary URL with automatic quality and format.
 * @param {String} publicID - Cloudinary public ID of the image
 * @returns {String} Optimized image URL
 */
export const getOptimizedURL = (publicID) => {
    return cloudinary.url(publicID, {
        quality: "auto",
        fetch_format: "auto",
    });
};

/**
 * @title Get Thumbnail URL
 * @description Generates a cropped thumbnail URL from Cloudinary with automatic gravity and quality.
 * @param {String} publicID - Cloudinary public ID of the image
 * @param {Number} [width=300] - Thumbnail width in pixels
 * @param {Number} [height=300] - Thumbnail height in pixels
 * @returns {String} Thumbnail image URL
 */
export const getThumbnailURL = (publicID, width = 300, height = 300) => {
    return cloudinary.url(publicID, {
        width: width,
        height: height,
        crop: "fill",
        gravity: "auto",
        quality: "auto",
        fetch_format: "auto",
    });
};