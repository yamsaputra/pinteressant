import cloudinary from "./cloud_config.mjs";

// Upload image form URL or file path
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

// Delete image by public ID
export const deleteImage = async (publicID) => {
  try {
    const result = await cloudinary.uploader.destroy(publicID);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

// Get optimized URL
export const getOptimizedURL = (publicID) => {
    return cloudinary.url(publicID, {
        quality: "auto",
        fetch_format: "auto",
    });
};

// Get thumbnail URL
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