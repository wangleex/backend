const MongoClient = require('mongodb').MongoClient;

module.exports = {
    getNextSequenceValue:  async function (sequenceName, db) {
        const sequenceDocument = await db.collection('counters').findOneAndUpdate(
           {_id: sequenceName },
           {$inc:{sequence_value:1}},
           {returnNewDocument:true}
        );
        return sequenceDocument.value.sequence_value
    },

    client: new MongoClient('mongodb://localhost:27017/listenonline')
}