const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ").at(1);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {}
  if (!decoded) {
    req.isAuth = false;
    return next();
  }
  req.userId = decoded.userId;
  req.isAuth = true;
  next();
};
