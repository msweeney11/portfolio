// Global error handler middleware for Express application
// Logs errors to console and returns standardized 500 error response
// Used to catch and handle unhandled errors throughout the BFF application
export function handleError(err, req, res, next) {
  console.error("[BFF ERROR]", err.message);
  res.status(500).json({
    error: "BFF encountered an error",
    detail: err.message
  });
}
