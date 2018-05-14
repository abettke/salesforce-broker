const rootPath = require('rootpath')();
const chai = require('chai');
const sforce = require('rewire')('services/salesforce.service.js');
const jsforce = require('jsforce');

chai.should();


describe('services/salesforce.service', () => {

    before(function(done){
        this.env = require('env');
        this.requestAccessToken = sforce.__get__('requestAccessToken');
        done();
    });

    describe('function requestAccessToken()', function(){
        it('should successfully fetch a Salesforce Access Token', async function(){
            const fakeResponse = '{"instance_url": "fakeInstanceUrl", "accessToken": "fakeAccessToken"}';
            sforce.__set__('request', () => Promise.resolve(fakeResponse));

            const accessToken = await this.requestAccessToken();
            accessToken.should.have.property('instance_url');
            accessToken.should.have.property('accessToken');
        });

        it('should fail to fetch a Salesforce Access Token', async function(){
            const fakeResponse = '{"error": "Could not get access token."}';
            sforce.__set__('request', () => Promise.reject(fakeResponse));

            const accessToken = await this.requestAccessToken();
            accessToken.should.be.empty;
        });
    });

    describe('controller method initialize()', function(){
        it('should successfully initialize the jsforce connection', async function(){
            sforce.__set__('requestAccessToken', () => ({
                instance_url: 'testInstanceUrl',
                access_token: 'testAccessToken'
            }));

            await sforce.initialize();

            sforce.connection.instanceUrl.should.equal('testInstanceUrl');
            sforce.connection.accessToken.should.equal('testAccessToken');
        });
    });

    describe('controller method connection()', function(){
        it('should return a jsforce connection object', function(){
            sforce.connection.should.be.an.instanceof(jsforce.Connection);
        });
    });
});