const jwt = require('jsonwebtoken');

const generateToken = user => {
    if(!user.Id || !user.Account__c){
        throw new Error(`Cannot generate access token without both a user Id and user Account.`);
    }

    const payload = {userId: user.Id, accessControl: user.Account__c};
    const privateKey = process.env.SECRET;

    return jwt.sign(payload, privateKey, { expiresIn: '1 day'});
};

module.exports = {
    generateToken: generateToken
};