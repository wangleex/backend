var express = require('express');
var app = express();
var util = require('util');
var mysql = require('mysql');
const axios = require('axios');

const bodyParser = require('body-parser')

app.use(express.json());

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/listenonline';
const client = new MongoClient(url);

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "anrMar#18",
  database: "hello_world"
});

con.connect(function(err) {
	if (err)
		throw err;
	console.log("Connected correctly to SQL");
});

app.get('/', function (req, res) {
	console.log('hiiiiAniii');
	res.send('helllooo!');
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
});

app.get('/check', function(req, res) {
	res.send('working');
})

app.get('/oauthtest', function(req, res) {
	axios({
		method:'get',
		url:`https://github.com/login/oauth/authorize?clientId=abc&redirect_uri=https://localhost:3000/`
	}).then((response) => {
		console.log('sending...');
		res.send('oops');
	})
})


////   Authentication Check    ////
app.get('/verifylogin', function (req, res) {
	var username = req.query.username;
	var password_encrypted = req.query.password;

	con.query("select * from users where name = " + username, function(err, output) {
	  	if (err)
	  		throw err;

	  	if (output.length == 0) {
	  		res.send("No such user exists!");
	  	} else if (password_encrypted == output.password) {
	  		res.send("Authenticated!");
	  	} else {
	  		res.send("Invalid password")
	  	}

	  });
});


////     graphql_servers table     ////
app.post('/addserver', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  db.collection('graphql_servers').insertOne(req.body, function(err, r) {
	  		console.log('inserted successfully!');
	  		//db.close();
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);
	  		res.send(body);
	  });

	});
});

app.get('/getallservers', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  //console.log(req.body);

	  db.collection('graphql_servers').find({}).toArray(function(err, r) {
	  		console.log('returning all servers!');
	  		//db.close();
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);
	  		res.send(r);
	  });

	});
});

app.put('/updateserver', function (req, res) {
	client.connect(function(err, client) {
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  var toUpdate = req.query.toUpdate;
	  console.log(toUpdate);
	  //console.log(req.body.email);
	  var newVals = {$set: {name:req.body.name, email:req.body.email, password:req.body.password, 
	  	isAdmin:req.body.isAdmin, quota:req.body.quota}};
	  db.collection('users').replaceOne({slug:toUpdate}, req.body, function(err, res) {
	    if (err) throw err;
	    console.log("GraphQL Server updated");
	  });
	});

	let body = {message: "Updated!!"}
	  		//res.sendStatus(200);
	  		res.send(body);
});



////     query_histories table     ////
app.post('/addqueryhistory', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  db.collection('query_histories').insertOne(req.body, function(err, r) {
	  		console.log('inserted successfully!');
	  		//client.close();
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);
	  		res.send(body);
	  });

	});
});


////     users table     ////
app.post('/adduser', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  db.collection('users').insertOne(req.body, function(err, r) {
	  		console.log('inserted successfully!');
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);
	  		res.send(body);
	  });

	});
});

app.put('/updateuser', function (req, res) {
	client.connect(function(err, client) {
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  var toUpdate = req.query.toUpdate;
	  console.log(toUpdate);

	  db.collection('users').replaceOne({name:toUpdate}, req.body, function(err, res) {
	    if (err) throw err;
	    console.log("1 document updated");
	  });
	});

	let body = {message: "Updated!!"}
	res.send(body);
});

////     queries table     ////
app.get('/getqueries', function (req, res) {
	con.query("select * from queries", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

app.post('/insertquery', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into queries values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.name + ',' + toSend.schedule + ',' + toSend.structure + ',' + toSend.description
	  + ',' + toSend.user_id + ',' + toSend.server_id + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});

////     runs table     ////
app.get('/getruns', function (req, res) {
	con.query("select * from runs", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

//
app.post('/addRun', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into runs values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.meta_query_id + ',' + toSend.topology + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     authorizations table     ////
app.get('/getallauthorizations', function (req, res) {
	con.query("select * from authorizations", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

app.get('/getauthorization', function (req, res) {
	con.query("select * from authorizations where server_id = " + req.query.serverId, function(err, output) {
	  	if (err)
	  		throw err;
	  	
	  	res.send(output);
	  });
});

//
app.post('/addauthorization', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into authorizations values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.access_token + ',' + toSend.refresh_token + ',' + toSend.meta
	  + ',' + toSend.user_id + ',' + toSend.server_id + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     applications table     ////
app.get('/getallapplications', function (req, res) {
	con.query("select * from applications", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

app.get('/getapplication', function (req, res) {
	con.query("select * from applications where name = " + req.query.name, function(err, output) {
	  	if (err)
	  		throw err;
	  	
	  	res.send(output);
	  });
});

//
app.post('/addapplication', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into applications values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.callback_url + ',' + toSend.home + ',' + toSend.name + ',' + toSend.description
	  + ',' + toSend.user_id + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     failed_jobs table     ////
app.get('/getallfailedjobs', function (req, res) {
	con.query("select * from failed_jobs", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

//
app.post('/addfailedjob', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into failed_jobs values (' + toSend.id + ',' + toSend.connection + ','
	 + toSend.queue + ',' + toSend.payload + ',' + toSend.exception + ',' + toSend.failed_at + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     interested_parties table     ////
app.get('/getallinterestedparties', function (req, res) {
	
	con.query("select * from interested_parties", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

//
app.post('/addinterestedparty', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into interested_parties values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.email + ',' + toSend.name + ',' + toSend.about + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     jobs table     ////
app.get('/getalljobs', function (req, res) {
	con.query("select * from jobs", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

//
app.post('/addnewjob', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into jobs values (' + toSend.id + ',' + toSend.queue + ','
	 + toSend.payload + ',' + toSend.attempts + ',' + toSend.reserved_at + ',' + toSend.available_at + ',' + toSend.created_at + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});

////     migrations table     ////
app.get('/getallmigrations', function (req, res) {
	con.query("select * from migrations", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

app.get('/getmigration', function (req, res) {
	con.query("select * from migrations where id = " + req.query.id, function(err, output) {
	  	if (err)
	  		throw err;
	  	
	  	res.send(output);
	  });
});

//
app.post('/addmigration', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into migrations values (' + toSend.id + ',' + toSend.migration + ','
	 + toSend.batch + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});


////     stages table     ////
app.get('/getallstages', function (req, res) {
	con.query("select * from stages", function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});

app.get('/getstage', function (req, res) {
	con.query("select * from stages where run_id = " + req.query.runId, function(err, output) {
	  	if (err)
	  		throw err;
	  	
	  	res.send(output);
	  });
});

app.post('/addStage', function (req, res) {
	var toSend = req.body;
	var sql = 'insert into stages values (' + toSend.id + ',' + toSend.created_at + ','
	 + toSend.updated_at + ',' + toSend.run_id + ')';
	con.query(sql, function(err, output) {
	  	if (err)
	  		throw err;
	  	res.send(output);
	  });
});



module.exports = server;

