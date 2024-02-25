const fs = require("node:fs");
const path = require("node:path");

const clearImage = (filePath) => {
  const updatedPath = path.join(path.dirname(require.main.filename), filePath);
  fs.unlink(updatedPath, (err) => console.error(err));
};

module.exports = {
  clearImage,
};
