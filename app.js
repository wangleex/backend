var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/listenonline';
/*MongoClient.connect(url, {useUnifiedTopology: true})
  .then(async function (db) { // <- db as first argument

    console.log(db.s.options.dbName);

    const result = await db.students.find({});
    console.log(result);
    
  })
  .catch(function (err) {console.log(err)});*/

  // Retrieve
/*var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/listenonline", { useUnifiedTopology: true }).then(async function(db) {

  console.log('connected!');

  const result = await db.graphql_servers.find({});
  console.log(result);

}).catch(function(err) {
	console.log(err);
});*/

const client = new MongoClient(url);

client.connect(function(err, client) {
  //assert.equal(null, err);
  console.log("Connected correctly to server");

  const db = client.db('listenonline');

  var fs = require('fs');

  let redditSchema = '';
  fs.readFile('redditSchema.txt', 'utf8', function(err, data) {
    redditSchema = data;
  });


  db.collection('graphql_servers').insertOne({'server_name' : 'Reddit', 
  	'URL' : 'http://localhost:51880/', 'slug': 'reddit', 'description' : 'Reddit GraphQL Server', 'schema' : redditSchema,
  	'requires_authorization' : 1, 'requires_authentication' : 0}, function(err, r) {

  		console.log('inserted successfully!');
  		//client.close();
  });

  db.collection('graphql_servers').insertOne({'server_name' : 'Github', 
  	'URL' : 'http://localhost:53339/', 'slug': 'github', 'description' : 'Github GraphQL Server', 'schema' : '',
  	'requires_authorization' : 1, 'requires_authentication' : 0}, function(err, r) {

  		console.log('inserted successfully!');
  		//client.close();
  });

});