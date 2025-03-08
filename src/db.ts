import mongoose from "mongoose";
import { model, Schema } from "mongoose";
import { z } from "zod";
import { MONGODB_URI } from "./config";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: { type: String },
  email: { type: String, unique: true },
});

export const UserModel = model("User", UserSchema);

const signSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  email: z.string().email("Email is not valid"),
});

export const signupschema = signSchema;

const ContentSchema = new Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  type: { type: String },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userid: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const ContentModel = model("content", ContentSchema);

const linkSchema = new Schema({
  hash: String,
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export const linkModel = model("link", linkSchema);
