const { Schema, model, Types } = require("mongoose");

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  status: { type: String, default: "I am new!" },
  posts: [{ type: Types.ObjectId, ref: "Post" }],
});

module.exports = model("User", userSchema);
