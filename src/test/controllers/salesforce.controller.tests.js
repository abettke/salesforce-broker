const rootPath = require('rootpath')();
const chai = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const salesforceController = require('rewire')('controllers/salesforce.controller.js');
const { mockReq, mockRes } = require('sinon-express-mock');

chai.should();

describe('controllers/salesforce.controller', () => {

    before(function(done){
        this.clean = salesforceController.__get__('clean');
        this.pruneProps = salesforceController.__get__('pruneProps');
        this.retrieveError = {error: 'Resource not found.'};
        this.authorizationError = {error: 'Resource restricted. Proper authorization required.'};
        this.findError = {error: 'Malformed query.'};
        this.fakeSforce = {
            retrieve: () => null,
            find: () => null,
            sort: () => null,
            limit: () => null,
            offset: () => null,
            execute: () => null
        };

        done();
    });

    beforeEach(function(done){
        this.fakeSObject = {attributes: true, Portal_Access_Control__c: 'myAccessControl', Id: 'myId'};
        this.sforceSobject = sinon.stub(salesforceController.__get__('sforce'), 'sobject').returns(this.fakeSforce);

        done();
    });

    describe('controller method getSObject', function(){
        it('should successfully retrieve a single SObject', async function(){
            const res = mockRes();
            const req = mockReq({
                params: {
                    sObject: 'SObject__c',
                    id: '123456789'
                },
                accessInfo: {
                    accessControl: 'myAccessControl'
                }
            });

            const retrieveStub = sinon.stub(this.fakeSforce, 'retrieve').resolves(this.fakeSObject);
            const cleanStub = sinon.stub(this, 'clean').returns(this.fakeSObject);

            await salesforceController.getSObject(req, res);
            res.json.calledWith(this.fakeSObject).should.equal(true);

            retrieveStub.restore();
            cleanStub.restore();
        });

        it('should fail to retrieve a single SObject because it does not exist', async function(){
            const res = mockRes();
            const req = mockReq({
                params: {
                    sObject: 'SObject__c',
                    id: 'thisDoesNotExist'
                }
            });

            const retrieveStub = sinon.stub(this.fakeSforce, 'retrieve').rejects(new Error('jsforce could not retrieve object by id'));

            await salesforceController.getSObject(req, res);
            res.status.calledWith(404).should.equal(true);
            res.json.calledWith(this.retrieveError).should.equal(true);

            retrieveStub.restore();
        });

        it('should fail to retrieve a single SObject becuause the user is unauthorized to view it', async function(){
            const res = mockRes();
            const req = mockReq({
                params: {
                    sObject: 'SObject__c',
                    id: 'thisDoesNotExist'
                },
                accessInfo: {
                    accessControl: 'wrongAccessControl'
                }
            });

            const retrieveStub = sinon.stub(this.fakeSforce, 'retrieve').resolves(this.fakeSObject)

            await salesforceController.getSObject(req, res);
            res.status.calledWith(403).should.equal(true);
            res.json.calledWith(this.authorizationError).should.equal(true);

            retrieveStub.restore();
        });
    });

    describe('controller method getSObjectList', function(){
        beforeEach(function(done){
            this.findStub = sinon.stub(this.fakeSforce, 'find').returns(this.fakeSforce);
            this.sortStub = sinon.stub(this.fakeSforce, 'sort').returns(this.fakeSforce);
            this.limitStub = sinon.stub(this.fakeSforce, 'limit').returns(this.fakeSforce);
            this.offsetStub = sinon.stub(this.fakeSforce, 'offset').returns(this.fakeSforce);
            this.cleanStub = sinon.stub(this, 'clean').returns(Array(5).fill(this.fakeSObject));
            this.queryStub = sinon.stub(salesforceController.__get__('sforce'), 'query').resolves({totalSize: 5});

            this.sObjectListReq = {
                param: {
                    sObject: 'SObject__c'
                },
                query: {
                    filter: JSON.stringify({id: 'mySObjectId'}),
                    fields: JSON.stringify([{id: 1}]),
                    sort: '-id',
                    limit: '20',
                    page: '2'
                },
                accessInfo: {
                    accessControl: '123456789'
                }
            };

            this.sObjectListPayload = {
                meta: {
                    total: 5,
                    page: this.sObjectListReq.query.page,
                    limit: this.sObjectListReq.query.limit,
                    sort: this.sObjectListReq.query.sort
                },
                objects: Array(5).fill(this.fakeSObject)
            };

            done();
        });

        it('should successfully retrieve an sObject list', async function(){
            const res = mockRes();
            const req = mockReq(this.sObjectListReq);

            const executeStub = sinon.stub(this.fakeSforce, 'execute').resolves(this.sObjectListPayload.objects);

            await salesforceController.getSObjectList(req, res);
            res.json.calledWith(this.sObjectListPayload).should.equal(true);

            executeStub.restore();
        });

        it('should fail to retrieve an sObject list', async function(){
            const res = mockRes();
            const req = mockReq(this.sObjectListReq);

            const executeStub = sinon.stub(this.fakeSforce, 'execute').rejects(new Error('malformed query'));

            await salesforceController.getSObjectList(req, res);
            res.status.calledWith(400).should.equal(true);
            res.json.calledWith(this.findError).should.equal(true);

            executeStub.restore();
        });

        afterEach(function(done){
            this.findStub.restore();
            this.sortStub.restore();
            this.limitStub.restore();
            this.offsetStub.restore();
            this.cleanStub.restore();
            this.queryStub.restore();
            done();
        });
    });

    describe('function clean', function(){
        it('should clean an array of records', function(){
            const prunePropsStub = sinon.stub().returns({})
            const arrayOfSObjects = Array(3).fill(this.fakeSObject);
            salesforceController.__set__('pruneProps', prunePropsStub);

            const cleanedData = this.clean(arrayOfSObjects);

            cleanedData.should.be.an('array');
            prunePropsStub.calledThrice.should.equal(true);
        });

        it('should clean a single record', function(){
            const prunePropsStub = sinon.stub().returns({})
            salesforceController.__set__('pruneProps', prunePropsStub);

            const cleanedData = this.clean(this.fakeSObject);
            cleanedData.should.be.an('object');
            prunePropsStub.calledOnce.should.equal(true);
        });
    });

    describe('function pruneProps', function(){
        it('should remove unnecessary or sensitive properties from records', function(){
            const prunedObject = this.pruneProps(this.fakeSObject);

            prunedObject.should.not.have.property('attributes');
            prunedObject.should.not.have.property('Portal_Access_Control__c');
            prunedObject.should.have.property('Id');
        });
    });

    afterEach(function(done){
        this.fakeSObject = {attributes: true, Portal_Access_Control__c: 'accessControl', Id: 'myId'};
        this.sforceSobject.restore();

        done();
    });

});