var express = require('express');
var app = express();
var util = require('util');
var mysql = require('mysql');
const axios = require('axios');
const passport = require('passport');
var RedditStrategy = require('passport-reddit').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy;

const QueryNode = require('./Query.js');
const fetch = require('node-fetch');
'use strict';

const fs = require('fs');


const jwt = require('jsonwebtoken');

const bodyParser = require('body-parser')

app.use(express.json());
/*app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});*/

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



/*passport.use(new GitHubStrategy({
    clientID: '73027a965065212c02ac',
    clientSecret: '3d3b581788e225f4e6bd9fe96bfe0d322c3a79c1',
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
));

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/check');
  });

passport.use(new RedditStrategy({
    clientID: 'M6oMtX6GmlXavQ',
    clientSecret: 'rQV1UTfMdWyHm1urW3TOLvRHlbQ',
    callbackURL: "http://localhost:3000/auth/reddit/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));


app.get('/auth/reddit',
  passport.authenticate('reddit'));

app.get('/auth/reddit/callback',
  passport.authenticate('reddit', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/check');
  });

passport.use(new TwitterStrategy({
    consumerKey: 'jHN4Bv29FP2762ZCexnoJpc0S',
    consumerSecret: '1Q1GYDnjMGWlW6i54W5lURfJj5L4zOVjqOXIW5cXEitwTgKDfd',
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, cb) {
    return cb(null, profile);
  }
));

app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/check');
  });

passport.use(new YoutubeV3Strategy({
    clientID: '111415140023-kkofs6setf4vceibocq185h8dbsga7b0.apps.googleusercontent.com',
    clientSecret: 'nUFvsPeihTrf3-4BLAQPr1RP',
    callbackURL: "http://localhost:3000/auth/youtube/callback",
    scope: ['https://www.googleapis.com/auth/youtube.readonly']
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

app.get('/auth/youtube',
  passport.authenticate('twitter'));

app.get('/auth/youtube/callback', 
  passport.authenticate('youtube', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/check');
  });*/

app.get('/', function (req, res) {
	console.log('hiiiiAniii');
	res.send('helllooo!');
})

app.get('/check', function(req, res) {
	res.send('working');
})


////   Authentication Check    ////
app.post('/app/api/auth/login', function (req, res) {
	var username = req.body.name;
	var pass = req.body.password;

	// send error
	let toSend = {
		data: {},
		errors: {}
	};

	con.query("select * from users where name = " + username, function(err, output) {
	  	if (err)
	  		throw err;

	  	if (output.length == 0) {
	  		toSend.errors = req.body;
	  		res.send(toSend);
	  	} else if (pass == output.password) {
	  		toSend.data = output;
	  		res.send(toSend);
	  	} else {
	  		toSend.errors = req.body;
	  		res.send(toSend);
	  	}

	  });
});

app.post('/app/api/auth/register', function (req, res) {
	var username = req.body.name;
	var pass = req.body.password;
	var email_ins = req.body.email;
	var invCode = req.body.invitationCode;

	let toSend = {
		data: {},
		errors: {}
	};

	con.query("insert into users(name, email, password, invitationCode) values ('" + username + "', '" + email_ins + "', '" 
		+ pass + "', " + invCode + ")", function(err, output) {
	  	if (err) {
	  		toSend.errors = req.body;
	  		res.send(toSend);
	  	} else {
	  		con.query("select email, name, isAdmin from User where name = '" + username + "'", function(err, output) {
	  			if (err) {
	  				throw err;
	  			}

	  			toSend.data = output[0];
	  			res.send(toSend);
	  		});
	  	}	  	

	  });
});

app.get('app/api/auth/logout', function (req, res) {
	res.sendStatus("Logged out");
});



// REGISTER & LOGIN?

////     graphql_servers table     ////
/*app.post('/addserver', function (req, res) {
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
});*/

// done
app.get('/app/api/servers', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  //console.log(req.body);
	  let toSend = {
		data: [],
		errors: {}
	  };


	  db.collection('graphql_servers').find({}).toArray(function(err, r) {
	  		console.log('returning all servers!');
	  		//db.close();
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);
	  		toSend.data = r;
	  		res.send(toSend);
	  });

	});

	/*var toSend = {
		data: [
		    {
		        name: 'reddit',
		        url: 'http://localhost:50190',
		        slug: 'reddit',
		        description: 'reddit sample',
		        requireAuthentication: true,
		        requireAuthorization: false
		    },
		    {
		        name: 'github',
		        url: 'http://localhost:53729',
		        slug: 'github',
		        description: 'github sample',
		        requireAuthentication: false,
		        requireAuthorization: true
		    }],
		errors: {}
	};

	res.send(toSend);*/


});

// done
app.put('/app/api/server/update', function (req, res) {

	var toUpdate = req.body.data;
	var serverName = toUpdate.name;

	client.connect(function(err, client) {
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(toUpdate);

	  let toSend = {
		data: {},
		errors: {}
	  };

	  db.collection('graphql_servers').replaceOne({name:serverName}, toUpdate, function(err, res) {
	    if (err) {
	    	toSend.errors = toUpdate;
	    	res.send(toSend);
	    } else {
	    	toSend.data = toUpdate;
	    	res.send(toSend);
	    }
	  });
	});
});

///   social media platforms    ////
app.get('/app/api/social-media-platforms', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  //console.log(req.body);
	  let platforms = [];

	  db.collection('graphql_servers').find({}).toArray(function(err, r) {
	  		console.log('returning all servers!');
	  		//db.close();
	  		let body = {message: "Success!!"};
	  		//res.sendStatus(200);
	  		var i = 0;
	  		for (i = 0; i < r.length; i++) {
	  			platforms.push(r[i].slug);
	  		}
	  		//res.sendStatus(200);
	  		res.send(platforms);
	  });

	});


	/*var toSend = {
		data: [
			{
		        name: 'Reddit',
		        authURL: '/',
		        imageURL: '/brand_logos/Reddit_Mark_OnWhite.png',
		        isAuthenticated: true
		    },
		    {
		        name: 'GitHub',
		        authURL: '/',
		        imageURL: '/brand_logos/GitHub-Mark-120px-plus.png',
		        isAuthenticated: false
		    },
		    {
		        name: 'Twitter',
		        authURL: '/',
		        imageURL: '/brand_logos/Twitter_Logo_Blue.png',
		        isAuthenticated: true
		    },
		    {
		        name: 'YouTube',
		        authURL: '/',
		        imageURL: '/brand_logos/yt_logo_rgb_light.png',
		        isAuthenticated: false
		    }
		],
		errors: {}
	};

	res.send(toSend);*/
});



////     queries table     ////
// done
app.get('/app/api/queries', function (req, res) {
	let toSend = {
		data: [],
		errors: {}
	  };
	con.query("select * from queries", function(err, output) {
	  	if (err)
	  		throw err;

	  	toSend.data = output;
	  	res.send(toSend);
	  });
});

// returning all slugs
app.get('/app/api/query/sources', function (req, res) {
	let toSend = {
		data: [],
		errors: {}
	  };
	db.collection('graphql_servers').find({}).toArray(function(err, r) {
	  		//console.log('returning all servers!');
	  		//db.close();
	  		let body = {message: "Success!!"};
	  		//res.sendStatus(200);
	  		var i = 0;
	  		let platforms = [];
	  		for (i = 0; i < r.length; i++) {
	  			platforms.push(r[i].slug);
	  		}
	  		//res.sendStatus(200);

	  		toSend.data = platforms;
	  		res.send(toSend);
	  });


	/**/

});

// correct
app.get('/app/api/query/full-schema', function (req, res) {
	let toSend = {
		data: {},
		errors: {}
	  };
	con.query("select structure from queries limit 1", function(err, output) {
	  	if (err)
	  		throw err;

	  	toSend.data = output;
	  	res.send(toSend);
	  });
});



/////   *******    /////
app.put('/app/api/query/update',  function (req, res) {
	

	let param = req.body;
	if (param.type == 'ADD') {
		let toInsert = param.data;
		let serv_id = 0;
		if (toInsert.source == 'reddit') {
			serv_id = 1;
		} else if (toInsert.source == 'twitter') {
			serv_id = 3;
		} else if (toInsert.source == 'github') {
			serv_id = 2;
		}
		con.query("insert into queries(name, schedule, user_id, server_id) values ('" + toInsert.name + "', " + toInsert.schedule + ", 1, " + serv_id + ")"
			, function(err, output) {
		  	if (err)
		  		throw err;

		  	res.send("values successfully inserted!");
		  });
	} else if (param.type == 'DELETE') {
		con.query("delete from queries where name = '" + param.data.name + "'", function(err, output) {
		  	if (err)
		  		throw err;

		  	res.send("values successfully deleted!");
		  });
	} else if (param.type == 'EXECUTE') {
		
		/*let rawdata = fs.readFileSync('fakeQuery.json');
		let queryJson = JSON.parse(rawdata);
		console.log(queryJson);

		let querynode = new QueryNode(queryJson.name, queryJson.inputs, queryJson.output, queryJson.children, queryJson.selected);
		let gql_string = querynode.toGraphQLQueryString();
		console.log(gql_string);*/



		const data = {
	      variables: null,
	      query: '{ top (subreddit: "uiuc") { data { children { data { title } } } } }',
	    };

	    fetch('http://localhost:4000/', {
	      method: 'POST',
	      body: JSON.stringify(data),
	      headers: {
	        'Content-Type': 'application/json',
	      },
	    }).then((response) => response.json())
	    .then((result) => {
	    	console.log(result);
	    	res.send(result);
	    })
	}

	/*const QuerySchedule = {
		AD_HOC: 0,
		PER_DAY: 1
	}


	var toSend = {
		data: [
			{
		        name: 'tetris',
		        source: 'Reddit',
		        schedule: QuerySchedule.AD_HOC,
		        schema: fakeGitHubQuery
		    }, {
		        name: 'ball',
		        source: 'Twitter',
		        schedule: QuerySchedule.PER_DAY,
		        schema: fakeGitHubQuery
		    }
		],
		errors: {}
	};

	res.send(toSend);*/


});

/*app.get('/query/selected-schema', function (req, res) {
	con.query("select structure from queries where name = " + req.query.source, function(err, output) {
	  	if (err)
	  		throw err;

	  	res.send(output);
	  });
});*/




////     query_histories table     ////
app.get('/app/api/query/history-records', function (req, res) {
	let qName = req.body.queryName;
	let toSend = [{
		data: {},
		runtime: {},
		executionTimestamp: {}
	  }];
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');

	  console.log(req.body);

	  db.collection('query_histories').find({name:qName}).toArray(function(err, r) {
	  		console.log('inserted successfully!');
	  		//client.close();
	  		let body = {message: "Success!!"}
	  		//res.sendStatus(200);

	  		for (let i = 0; i < r.length; i = i + 1) {

	  		}
	  		res.send();
	  });

	});

	/*var fakeGitHubQueryResponse = fs.readFileSync('fakeGithubQuery.json');

	var toSend = {
		data: [
			{
		        executionTimestamp: '2020-01-31 02:23:32',
		        runtime: 1009,
		        data: fakeGitHubQueryResponse
		    }, {
		        executionTimestamp: '2020-01-31 02:21:22',
		        runtime: 1576,
		        data: fakeGitHubQueryResponse
		    }, {
		        executionTimestamp: '2020-01-31 02:13:35',
		        runtime: 222,
		        data: fakeGitHubQueryResponse
		    }, {
		        executionTimestamp: '2020-01-31 02:23:32',
		        runtime: 1009,
		        data: fakeGitHubQueryResponse
		    }
		]
	};

	res.send(toSend);*/

});


////     users table     ////
// done
app.get('/app/api/users', function (req, res) {
	client.connect(function(err, client) {
	  //assert.equal(null, err);
	  console.log("Connected correctly to server");

	  const db = client.db('listenonline');
	  let toSend = {
		data: [],
		errors: {}
	  };
	  db.collection('users').find({}, {name:1, isAdmin:1, email:1, quota:1, usedQuota:1}).toArray(function(err, r) {
	  		console.log('returning all users!');
	  		toSend.data = r;
	  		res.send(toSend);
	  });

	});

	/*
	var toSend = {
		data: [
			{name: `Start from App`, isAdmin: true, email: `user1@email.com`, quota: 1, usedQuota: 0.5}
		],
		errors: {}
	};

	res.send(toSend);
	*/
});

/*
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
});*/
// done 1
app.put('/app/api/user/update', function (req, res) {

	var toUpdate = req.body.data;

	let toSend = {
			data: [],
			errors: {}
		  };

	if (toUpdate.type == 0) {
		con.query("delete from users where name = " + toUpdate.name, function(err, output) {
		  	if (err) {
		  		toSend.errors = {quota: toUpdate.quota};
		  		res.send(toSend);
		  	}

		  });

		con.query("select * from users ", function(err, output) {
		  	if (err) {
		  		toSend.errors = {quota: toUpdate.quota};
		  		res.send(toSend);
		  	} else {
		  		toSend.data = output;
		  		res.send(toSend);
		  	}
		  });		

	} else if (toUpdate.type == 1) {
		con.query("update users set name = " + toUpdate.name + ", email = '" + toUpdate.email + 
			"', isAdmin = " + toUpdate.isAdmin + ", quota = " + toUpdate.quota + ", usedQuota = " + toUpdate.usedQuota, function(err, output) {
		  	if (err){
		  		toSend.errors = {quota: toUpdate.quota};
		  		res.send(toSend);
		  	}

		  });

		
		con.query("select * from users ", function(err, output) {
		  	if (err) {
		  		toSend.errors = {quota: toUpdate.quota};
		  		res.send(toSend);
		  	} else {
		  		toSend.data = output;
		  		res.send(toSend);
		  	}

		  });
	}
});


////     applications table     ////
// done 1
app.get('/app/api/applications', function (req, res) {
	let toSend = {
		data: [],
		errors: {}
	};
	con.query("select * from applications", function(err, output) {
	  	if (err) {
	  		throw err;
	  	} else {
	  		toSend.data = output;
	  		res.send(toSend);
	  	}
	  });
	
	/*
	  var toSend = {
		data: [
			{
		        name: 'xxx', callbackURL: 'www.google.com', home: 'anything'
		    }
		],
		errors: {}
	  };

	  res.send(toSend);
	  */

});

// done 1
app.put('/app/api/application/update', function (req, res) {
	var toUpdate = req.body;

	let toSend = {
		data: [],
		errors: {}
	};

	var updatebody = toUpdate.data;
	if (toUpdate.type == 1) {
		con.query('delete from applications where name = toSend.data.name', function(err, output) {
		  	if (err) {
		  		let errObj = {
		  			fieldError: {
		  				callbackURL: updatebody.callbackURL,
		  				home: updatebody.home,
		  				name: updatebody.name
		  			}
		  		}
		  		res.send(toSend);
		  	} else {
		  		con.query("select * from applications", function(err, output) {
				  	if (err) {
				  		let errObj = {
				  			fieldError: {
				  				callbackURL: updatebody.callbackURL,
				  				home: updatebody.home,
				  				name: updatebody.name
				  			}
				  		}
				  		res.send(toSend);
				  	} else {
				  		toSend.data = output;
				  		res.send(toSend);
				  	}
				});
		  	}

	  });
	} else if (toUpdate.type == 2) {
		con.query('insert into applications(callback_url, home, name, description, user_id) values (' + toUpdate.callbackURL,
			+ ', ' + toUpdate.home + ', ' + toUpdate.name + 
			', ' + toUpdate.description + ', ' + toUpdate.user_id + ')', function(err, output) {
			  	if (err) {
			  		let errObj = {
				  			fieldError: {
				  				callbackURL: updatebody.callbackURL,
				  				home: updatebody.home,
				  				name: updatebody.name
				  			}
				  		}
				  		res.send(toSend);
			  	} else {
			  		con.query("select * from applications", function(err, output) {
					  	if (err) {
					  		let errObj = {
					  			fieldError: {
					  				callbackURL: updatebody.callbackURL,
					  				home: updatebody.home,
					  				name: updatebody.name
					  			}
					  		}
					  		res.send(toSend);
					  	} else {
					  		toSend.data = output;
					  		res.send(toSend);
					  	}
					});
			  	}
	  });

	} else if (toUpdate.type == 0) {
		con.query('update applications set callback_url = ' + toUpdate.callback_url + ', home = ' + toUpdate.home + ', name = ' + toUpdate.name + 
	', description = ' + toUpdate.description + ', user_id = ' + toUpdate.user_id, function(err, output) {
	  	if (err) {
	  		let errObj = {
				  			fieldError: {
				  				callbackURL: updatebody.callbackURL,
				  				home: updatebody.home,
				  				name: updatebody.name
				  			}
				  		}
				  		res.send(toSend);
	  	} else {
			  		con.query("select * from applications", function(err, output) {
					  	if (err) {
					  		let errObj = {
					  			fieldError: {
					  				callbackURL: updatebody.callbackURL,
					  				home: updatebody.home,
					  				name: updatebody.name
					  			}
					  		}
					  		res.send(toSend);
					  	} else {
					  		toSend.data = output;
					  		res.send(toSend);
					  	}
					});
			  	}
	  });
	}
});


/*

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
});*/

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
});

module.exports = server;

