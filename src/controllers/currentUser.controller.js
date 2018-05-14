const rootPath = require('rootpath')();
const sforce = require('../services/salesforce.service').connection;
const { errors } = require('../constants/responses')

const getCurrentUser = (req, res) => {
    return sforce
        .sobject('Portal_User__c')
        .select('*, Account__r.Name')
        .where(`Id = '${req.accessInfo.userId}'`)
        .execute()
        .then(users => {
            user = users.pop();
            delete user.Password__c;
            delete user.attributes;
            delete user.Account__r.attributes;
            res.json(user);
        })
        .catch(err => {
            res.status(404).json(errors[404]);
        });
};

module.exports = {
    getCurrentUser
};