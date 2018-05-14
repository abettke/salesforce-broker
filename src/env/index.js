const dotenv = require('dotenv-extended');
const dotenvParse = require('dotenv-parse-variables');
const environment = dotenv.load({
    path: `${__dirname}/.env`,
    defaults: `${__dirname}/.env.defaults`,
    schema: `${__dirname}/.env.schema`,
    errorOnMissing: true
});

module.exports = dotenvParse(environment);