const rootPath = require('rootpath')();
const chai = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authenticationController = require('rewire')('controllers/authentication.controller.js');
const { mockReq, mockRes } = require('sinon-express-mock');

chai.should();

describe('controllers/authentication.controller', () => {

    before(function(done){
        this.user = {Id: 'myTestUserId', Email__c: 'test.user@gmail.com', Password__c: 'password'};
        this.fakeSforce = {find: () => null, execute: () => null};
        this.authService = authenticationController.__get__('authService');
        this.loginError = {error: 'Invalid email/password.'};
        this.logoutResponse = {data: "Logout Successful"};
        this.logoutError = {error: "No access token present."};

        this.sforceSobject = sinon.stub(authenticationController.__get__('sforce'), 'sobject').returns(this.fakeSforce);
        this.sforceFind = sinon.stub(this.fakeSforce, 'find').returns(this.fakeSforce);
        this.sforceExecute = sinon.stub(this.fakeSforce, 'execute').returns([this.user]);
        this.generateToken = sinon.stub(this.authService, 'generateToken').returns('myFakeToken');

        done();
    });

    describe('#loginPortalUser', function(){
        it('should successfully login the user', async function(){
            const res = mockRes();
            const req = mockReq({
                body: {
                    email: this.user.Email__c,
                    password: this.user.Password__c
                }
            });

            await authenticationController.login(req, res);

            this.sforceFind.calledWith({Email__c: this.user.Email__c}).should.equal(true);

            res.cookie.calledWith('accessToken', 'myFakeToken').should.equal(true);
            res.send.called.should.equal(true);

        });

        it('should fail to login the user because of a bad password', async function(){
            const res = mockRes();
            const req = mockReq({
                body: {
                    email: this.user.Email__c,
                    password: 'badPassword'
                }
            });

            await authenticationController.login(req, res);

            this.sforceFind.calledWith({Email__c: this.user.Email__c}).should.equal(true);

            res.status.calledWith(401).should.equal(true);
            res.json.calledWith(this.loginError).should.equal(true);
        });

        it('should fail to login the user because of bad email', async function(){
            const res = mockRes();
            const req = mockReq({
                body: {
                    email: 'badEmail',
                    password: this.user.Password__c
                }
            });

            this.sforceExecute.restore();
            this.sforceExecute = sinon.stub(this.fakeSforce, 'execute').returns([]);

            await authenticationController.login(req, res);

            this.sforceFind.calledWith({Email__c: 'badEmail'}).should.equal(true);

            res.status.calledWith(401).should.equal(true);
            res.json.calledWith(this.loginError).should.equal(true);
        });

    });

    describe('#logoutPortalUser', function(){
        it('should successfully logout the user', async function(){
            const res = mockRes();
            const req = mockReq({
                cookies: {
                    accessToken: 'myAccessToken'
                }
            });

            await authenticationController.logout(req, res);

            res.clearCookie.calledWith('accessToken').should.equal(true);
            res.json.calledWith(this.logoutResponse).should.equal(true);
        });

        it('should fail to logout the user because user is not logged in', async function(){
            const res = mockRes();
            const req = mockReq({
                cookies: {}
            });

            await authenticationController.logout(req, res);

            res.status.calledWith(404).should.equal(true);
            res.json.calledWith(this.logoutError).should.equal(true);
        });
    });

    after(function(done){
        this.sforceSobject.restore();
        this.sforceFind.restore();
        this.sforceExecute.restore();
        this.generateToken.restore();
        done();
    });

});