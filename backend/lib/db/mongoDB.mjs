import mongoose from "mongoose";

const MONGO_URI = "mongodb://127.0.0.1:27017/pinteressant";

export const connectMongoDB = async () => {
  try {
    const connect = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`MongoDB failed to connect: ${error.message}\n ${error.stack}`);
    process.exit(1);
  }
};