import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";
export const MONGODB_URI =
  process.env.MONGODB_URI ||
  "";
