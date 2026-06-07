const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId: "..." } now available in all protected routes
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware;
