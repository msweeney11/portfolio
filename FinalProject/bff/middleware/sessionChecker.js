// Session verification middleware for protected routes
// Checks for session cookie and extracts user information
// Currently uses mock user data - should be enhanced with proper JWT verification
export function verifySession(req, res, next) {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Optionally decode/verify token
  req.user = { id: "mockUser" }; // Add logic to extract user
  next();
}
