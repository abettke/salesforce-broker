const rootPath = require('rootpath')();
const env = require('../env');
const logger = require('utils/logging.js').logger;

logger.info('Setting up testing environment');

env.PORT = 9090;
logger.clear();
