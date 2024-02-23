const { Schema, model, Types } = require("mongoose");

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, required: true },
    creator: { type: Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
