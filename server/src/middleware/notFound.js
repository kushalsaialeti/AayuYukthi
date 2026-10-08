export function notFoundHandler(_req, res) {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Resource not found',
    requestId: _req.requestId ?? null,
  });
}
