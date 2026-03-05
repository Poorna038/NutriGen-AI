import mongoose from "mongoose"

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/nutrigenai")

    console.log("MongoDB connected")
  } catch (err) {
    console.error("Mongo connection error:", err)
  }
}