const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    title: { type: String, reqiured: true },
    content: { type: String, reqiured: true },
    imageUrl: { type: String, reqiured: true },
    creator: { type: Object, reqiured: true },
  },
  { timestamps: true }
);

module.exports = model("Post", postSchema);
