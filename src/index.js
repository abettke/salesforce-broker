const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const env = require('./env');
const logging = require('./utils/logging.js');
const sforce = require('./services/salesforce.service.js');
const authRoutes = require('./routes/authentication.routes.js');
const apiRoutes = require('./routes/api.routes.js');


server = express();
server.use(bodyParser.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, 'public')));
server.use(logging.transactionLogger);
server.use(router);

router.use([
    authRoutes,
    apiRoutes
]);

server.use(logging.errorLogger);

async function init(){
    await sforce.initialize();
    return server.listen(env.PORT, () => logging.logger.info(`Express running at http://localhost:${env.PORT}`));
}


module.exports = init();
