const { MongoClient } = require('mongodb');
const jsonSize = require('json-size')

module.exports = {
  getNextSequenceValue: async (sequenceName, db) => {
    const sequenceDocument = await db.collection('counters').findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnNewDocument: true },
    );
    return sequenceDocument.value.sequence_value;
  },

  calculateQuotaUsed: async (userId, db) => {
    const queries = await db.collection('query_histories').find({ user_id: userId }, { _id: 0, data: 1 }).toArray();

    if (!queries.length) {
      return 0;
    }

    return jsonSize(queries) / (1024 * 1024);
  },

  client: new MongoClient('mongodb://localhost:27017/listenonline'),
};
