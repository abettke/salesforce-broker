const rootPath = require('rootpath')();
const chai = require('chai');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const authenticationService = require('services/authentication.service.js');

chai.should();


describe('services/authentication.service', () => {
    before(function(done) {
        this.user = {Id: 'testUserId', Account__c: 'testAccountId'};
        this.invalidUser = {Id: 'testUserId'};

        process.env.SECRET = 'myjwtsecret12345';

        done();
    });

    describe('#generateToken()', function(){
        it('should generate a valid user access token', function(){
            const accessToken = authenticationService.generateToken(this.user);
            const decodedAccessToken = jwt.verify(accessToken, process.env.SECRET);

            decodedAccessToken.userId.should.equal = this.user.id;
            decodedAccessToken.accessControl.should.equal = this.user.Account__c;
            decodedAccessToken.exp.should.equal = moment().add(1, 'day');
        });

        it('should throw error for invalid user', function(){
            (() => authenticationService.generateToken(this.invalidUser)).should.throw();
        });
    });

});