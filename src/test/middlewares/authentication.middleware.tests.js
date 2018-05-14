const rootPath = require('rootpath')();
const chai = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const isAuthenticated = require('rewire')('middlewares/authentication.middleware.js');
const { mockReq, mockRes } = require('sinon-express-mock');

chai.should();

describe('middlewares/authentication.middleware', () => {

    before(function(done){
        this.payload = {value: 'mypayload'};
        this.privateKey = 'mysecretkey12345';
        this.error = {error: "Invalid or expired access token."};
        isAuthenticated.__set__('privateKey', 'mysecretkey12345');
        done();
    });

    describe('#isAuthenticated', function(){
        it('should pass the authentication middleware', function(){
            const next = sinon.spy();
            const res = mockRes();
            const req = mockReq({
                cookies: {
                    accessToken: jwt.sign(this.payload, this.privateKey)
                }
            });

            isAuthenticated(req, res, next);
            req.accessInfo.value.should.equal(this.payload.value);
            next.called.should.equal(true);
        });

        it('should fail the authentication middleware because of invalid secret', function(){
            const res = mockRes();
            const req = mockReq({
                cookies: {
                    accessToken: jwt.sign(this.payload, 'badsecret')
                }
            });

            isAuthenticated(req, res, () => {});
            res.status.calledWith(401).should.equal(true);
            res.json.calledWith(this.error).should.equal(true);
        });

        it('should fail the authentication middleware because of expired secret', function(){
            const res = mockRes();
            const req = mockReq({
                cookies: {
                    accessToken: jwt.sign(this.payload, this.privateKey, {expiresIn: '1 ms'})
                }
            });


            isAuthenticated(req, res, () => {});

            res.status.calledWith(401).should.equal(true);
            res.json.calledWith(this.error).should.equal(true);
        });
    });

});