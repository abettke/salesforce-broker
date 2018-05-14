const API_ROOT = require('../constants/apiRoot');
const router = require('express').Router();
const authenticationController = require('../controllers/authentication.controller.js');

router.post(`${API_ROOT}/login`, authenticationController.login);
router.get(`${API_ROOT}/logout`, authenticationController.logout);

module.exports = router;