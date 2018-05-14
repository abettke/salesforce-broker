const API_ROOT = require('../constants/apiRoot');
const router = require('express').Router({caseSensitive: true});
const authenticationPolicy = require('../middlewares/authentication.middleware.js');
const salesforceController = require('../controllers/salesforce.controller.js');
const currentUserController = require('../controllers/currentUser.controller.js');

router.use(authenticationPolicy);
router.get(`${API_ROOT}/user`, currentUserController.getCurrentUser);
router.get(`${API_ROOT}/:sObject/describe`, salesforceController.getSObjectSchema);
router.get(`${API_ROOT}/:sObject/:id`, salesforceController.getSObject);
router.get(`${API_ROOT}/:sObject`, salesforceController.getSObjectList);

module.exports = router;