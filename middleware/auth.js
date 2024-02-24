const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    console.log("No Auth Header provided");
    return next();
  }
  const token = authHeader.split(" ").at(1);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {}
  if (!decoded) {
    req.isAuth = false;
    return next();
  }
  console.log(token);
  req.userId = decoded.userId;
  req.isAuth = true;
  next();
};
