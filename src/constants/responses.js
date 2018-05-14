const errors = {
    400: {error: 'Malformed query.'},
    401: {error: "Invalid or expired access token."},
    403: {error: 'Resource restricted. Proper authorization required.'},
    404: {error: 'Resource not found.'}
};

module.exports = {
    errors
};