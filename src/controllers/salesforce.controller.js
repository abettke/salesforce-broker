const rootPath = require('rootpath')();
const sforce = require('../services/salesforce.service').connection;
const { errors } = require('../constants/responses');
const { createSOQL } = require('jsforce/lib/soql-builder');

const getSObject = (req, res) => {
    return sforce
        .sobject(req.params.sObject)
        .retrieve(req.params.id)
        .then(record => {
            if(record.Portal_Access_Control__c === req.accessInfo.accessControl){
                res.json(clean(record))
            } else {
                res.status(403).json(errors[403]);
            }
        })
        .catch(() => res.status(404).json(errors[404]));
};

const getSObjectList = async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const fields = req.query.fields ? JSON.parse(req.query.fields) : null;
    const sort = req.query.sort || {CreatedDate: -1};
    const limit = req.query.limit || 20;
    const offset = (req.query.page - 1) * req.query.limit;
    const page = req.query.page || 1;

    // Manually build a SOQL query to get the the total using JSON-based filter
    const soql = createSOQL({fields: ['COUNT()'], table: req.params.sObject, conditions: filter});
    let total;
    try {
        const result = await sforce.query(soql);
        total = result.totalSize;
    } catch(e) {
        res.status(400).json(errors[400]);
    }


    const meta = {
        total: total,
        page: page,
        limit: limit,
        sort: sort
    };

    // Assign authorization filtering
    filter['Portal_Access_Control__c'] = req.accessInfo.accessControl;

    return sforce.sobject(req.params.sObject)
        .find(filter, fields)
        .sort(sort)
        .limit(limit)
        .offset(offset)
        .execute()
        .then(records => {
            res.json({
                meta: meta,
                objects: clean(records)
            });
        })
        .catch(err => {
            if(err.errorCode === 'INVALID_FIELD'){
                res.status(403).json(errors[403]);
            } else {
                res.status(400).json(errors[400]);
            }
        });
};

const getSObjectSchema = (req, res) => {
    return sforce
        .sobject(req.params.sObject)
        .describe()
        .then(record => res.json(clean(record)))
        .catch(() => res.status(404).json(errors[404]));
};

const clean = data => {
    if(Array.isArray(data)){
        return data.map(obj => pruneProps(obj));
    } else {
        return pruneProps(data);
    }
};

const pruneProps = (obj) => {
    delete obj.attributes;
    delete obj.Portal_Access_Control__c;
    return obj;
}

module.exports = {
    getSObject,
    getSObjectList,
    getSObjectSchema
};