export function handleError(err, req, res, next) {
  console.error("[BFF ERROR]", err.message);
  res.status(500).json({
    error: "BFF encountered an error",
    detail: err.message
  });
}
