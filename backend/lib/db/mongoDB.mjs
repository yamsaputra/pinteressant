import mongoose from "mongoose";

/**
 * @title Connect to MongoDB
 * @description Establishes a connection to MongoDB using the MONGO_URL environment variable. Exits the process on failure.
 * @throws Exits process with code 1 if connection fails
 * @returns {Promise<void>} Resolves when connected successfully
 */
export const connectMongoDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`MongoDB failed to connect: ${error.message}\n ${error.stack}`);
    process.exit(1);
  }
};