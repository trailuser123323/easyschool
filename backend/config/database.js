import mongoose from "mongoose";

export async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    console.warn("MongoDB skipped: MONGO_URI is not configured.");
    return null;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB Connected");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    return null;
  }
}
