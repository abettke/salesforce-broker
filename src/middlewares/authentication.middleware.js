const rootPath = require('rootpath')();
const jwt = require('jsonwebtoken');
const privateKey = process.env.SECRET;
const { errors } = require('../constants/responses');

const isAuthenticated = (req, res, next) => {
    try {
        req.accessInfo = jwt.verify(req.cookies.accessToken, privateKey);
        next();
    } catch(err) {
        res.status(401).json(errors[401]);
    }
};

module.exports = isAuthenticated;