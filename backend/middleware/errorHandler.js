export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error?.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, value]) => [field, value.message]),
    );
    return res.status(400).json({ success: false, message: "Validation failed.", errors });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid resource id." });
  }

  console.error(error);
  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || "Internal server error.",
  });
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
