const { Schema, model, Types } = require("mongoose");

const postSchema = new Schema(
  {
    title: { type: String, reqiured: true },
    content: { type: String, reqiured: true },
    imageUrl: { type: String, reqiured: true },
    creator: { type: Types.ObjectId, reqiured: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
