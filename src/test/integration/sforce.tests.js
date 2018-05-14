const rootPath = require('rootpath')();
const chai = require('chai');
const sinon = require('sinon');
const sforce = require('rewire')('services/salesforce.service.js');

chai.should();


describe('sforce integration (LIVE)', () => {

    before(function(done){
        this.env = require('env');
        done();
    });

    describe('connection', function(){
        it('should successfully establish a valid connection on initialization', async function(){
            await sforce.initialize();
            const user = await sforce.connection.identity();
            user.username.should.equal(this.env.SF_USER);
        });

        it('should successfully refresh the connection on accessToken expiration', async function(){
            const refreshFn = sinon.spy(sforce.connection._refreshDelegate, '_refreshFn');
            let accounts = null;
            await sforce.initialize();

            accounts = await sforce.connection.sobject('Account').find().limit(1);
            accounts.should.be.an('array');

            // Fake an expired token
            sforce.connection.accessToken = 'bogus';

            accounts = await sforce.connection.sobject('Account').find().limit(1);
            accounts.should.be.an('array');

            refreshFn.calledOnce.should.equal(true);
            refreshFn.restore();
        });
    });

});