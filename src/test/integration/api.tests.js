const rootPath = require('rootpath')();
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('index.js');
const generateAccessToken = require('services/authentication.service.js').generateToken;
const sforce = require('services/salesforce.service').connection;

chai.should();
chai.use(chaiHttp);

describe('api integration (LIVE)', () => {

    before(async function(){
        this.server = await app;
        this.validUser = {email: 'test.user@domain.com', password: 'password'};
        this.invalidUser = {email: 'test.user@domain.com', password: 'wrongPassword'};
        this.validAuthToken = generateAccessToken({Id: 'myUserId', Account__c: 'myAccessControl'});
    });

    describe('authentication', function(){
        it('should successfully login a given user', function(done){
            chai.request(this.server)
                .post('/api/login')
                .send(this.validUser)
                .then(res => {
                    res.should.have.status(200);
                    res.should.have.cookie('accessToken');
                    done();
                });
        });

        it('should fail to login a given user', function(done){
            chai.request(this.server)
                .post('/api/login')
                .send(this.invalidUser)
                .catch(res => {
                    res.should.have.status(401);
                    done();
                });
        });

        it('should successfully logout a given user', function(done){
            chai.request(this.server)
                .get('/api/logout')
                .set('Cookie', `accessToken=${this.validAuthToken}`)
                .then(res => {
                    res.should.have.status(200);
                    res.should.not.have.cookie('accessToken');
                    done();
                });
        });

        it('should fail to logout a given user', function(done){
            chai.request(this.server)
                .get('/api/logout')
                .catch(res => {
                    res.should.have.status(404);
                    done();
                });
        });
    });

    describe('sObject', function(){
        before(async function() {
            this.client = chai.request.agent(this.server);

            // Login the client to recieve an active session
            const res = await this.client.post('/api/login').send(this.validUser);
            res.should.have.status(200);
            res.should.have.cookie('accessToken');

            // Validate we have at least one sObject to work with
            const thirdPartyRequests = await sforce.sobject('Third_Party_Request__c').find().execute();
            if(thirdPartyRequests.length !== 0){
                this.sObject = thirdPartyRequests.shift();
            } else {
                throw new Error('Cannot run sObject tests without at least 1 Third_Party_Request__c in Salesforce');
            }

        });

        it('should successfully fetch an sObject list', function(done){
            this.client
                .get('/api/Third_Party_Request__c')
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.have.property('meta');
                    res.body.should.have.property('objects');
                    res.body.objects.should.be.an('array');
                    done();
                });
        });

        it('should successfully fetch an sObject list with query parameters', function(done){
            this.client
                .get('/api/Third_Party_Request__c')
                .query({
                    filter: JSON.stringify({Name: 'Seth Test 1'}),
                    fields: JSON.stringify({Id: 1, Name: 1}),
                    sort: '-Name',
                    limit: 1,
                    page: 1
                })
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.have.property('meta');
                    res.body.should.have.property('objects');
                    res.body.objects.should.be.an('array');
                    done();
                });
        });

        it('should successfully fetch an sObject by id', function(done){
            this.client
                .get(`/api/Third_Party_Request__c/${this.sObject.Id}`)
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    res.body.Id.should.equal(`${this.sObject.Id}`);
                    done();
                });
        });

    });

    after(async function(){
        this.server.close();
    });

});