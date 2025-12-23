// Node-Fetch test script for the cloudinary image upload endpoint
const testImageUpload = async () => {
  const testImageURL = "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg";

  try {
    const response = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageURL: testImageURL }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Upload successful!");
      console.log("Image URL:", data.imageURL);
      console.log("Thumbnail URL:", data.thumbnailURL);
      console.log("Public ID:", data.publicID);
    } else {
      console.log("❌ Upload failed:", data.error);
      console.log("Details:", data.details);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
};

testImageUpload();