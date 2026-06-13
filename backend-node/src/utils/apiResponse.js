function timestamp() {
  return new Date().toISOString();
}

function ok(data, message = null) {
  return {
    success: true,
    message,
    data,
    timestamp: timestamp(),
  };
}

function errorResponse(message) {
  return {
    success: false,
    message,
    data: null,
    timestamp: timestamp(),
  };
}

module.exports = {
  ok,
  errorResponse,
};
