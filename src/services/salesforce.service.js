const rootPath = require('rootpath')();
const fs = require('fs');
const jsforce = require('jsforce');
const jwt = require('jsonwebtoken');
const request = require('request-promise-native');
const logger = require('../utils/logging.js').logger;


const connection = new jsforce.Connection({
    refreshFn: async (conn, cb) => {
        const accessToken = await requestAccessToken();
        cb(null, accessToken.access_token, null);
    }
});


const initialize = async () => {
    const accessToken = await requestAccessToken();

    connection.initialize({
        instanceUrl: accessToken.instance_url,
        accessToken: accessToken.access_token
    });
};


const requestAccessToken = async function() {
    const options = {
        algorithm: 'RS256',
        issuer: process.env.SF_CLIENT_ID,
        audience: process.env.SF_INSTANCE_URL,
        expiresIn: '3 minutes'
    };

    const privateKey = fs.readFileSync(process.env.SF_CLIENT_SECRET_KEY_PATH, 'utf-8');
    const requestToken = jwt.sign({ prn: process.env.SF_USER }, privateKey, options);

    return await request({
        uri: `${process.env.SF_INSTANCE_URL}/services/oauth2/token`,
        method: 'POST',
        form: {
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			'assertion':  requestToken
        }
    }).then(response => {
        logger.info(`Successfully authenticated with Salesforce.`);
        logger.info(`Connection open with user ${process.env.SF_USER}.`);
        return JSON.parse(response);
    }).catch(response => {
        logger.error(`Unable to authenticate with Salesforce. ${response}`);
        return {};
    });
};

module.exports = {
    connection: connection,
    initialize: initialize
};