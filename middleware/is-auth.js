const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      const error = new Error("Authentication Failed!");
      error.statusCode = 401;
      throw error;
    }
    const token = authHeader.split(" ").at(1);
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      const error = new Error("Authentication Failed!");
      error.statusCode = 401;
      throw error;
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    next(err);
  }
};
