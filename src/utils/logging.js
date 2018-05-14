const rootPath = require('rootpath')();
const winston = require('winston');
const expressWinston = require('express-winston');
const env = require('../env');

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            stderrLevels: ['error','warn'],
            colorize: true
        }),
        new winston.transports.File({
            timestamp: true,
            filename: 'src/logs/transactions.log'
        })
    ]
});

const transactionLogger = expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    expressFormat: true
});

const errorLogger = expressWinston.errorLogger({
    transports: [
        new winston.transports.File({
            timestamp: true,
            filename: 'src/logs/errors.log'
        })
    ]
});

module.exports = {
    logger,
    transactionLogger,
    errorLogger
};