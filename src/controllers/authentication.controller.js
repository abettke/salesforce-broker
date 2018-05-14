const moment = require('moment');
const sforce = require('../services/salesforce.service.js').connection;
const authService = require('../services/authentication.service.js');

const loginPortalUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const users = await sforce.sobject('Portal_User__c').find({Email__c: email}).execute();
    const user = users.pop();
    if(user && user.Password__c === password){

        const portalAccessToken = authService.generateToken(user);
        res.cookie('accessToken', portalAccessToken, {
            httpOnly: true,
            expires: moment().add(1, 'd').toDate()
        }).send();

    } else {
        res.status(401).json({error: 'Invalid email/password.'});
    }
};

const logoutPortalUser = (req, res) => {
    if(req.cookies.accessToken){
        res.clearCookie('accessToken').json({data: "Logout Successful"});
    } else {
        res.status(404).json({error: "No access token present."});
    }
};

module.exports = {
    login: loginPortalUser,
    logout: logoutPortalUser
};