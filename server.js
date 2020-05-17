'use strict';

require('dotenv').config()
var express = require('express');
var app = express();
const crypto = require('crypto');
const { CLIENT_ORIGIN } = require('./config')
const cors = require('cors');
const passport = require('passport');
const socketio = require('socket.io');
const passportInit = require('./lib/passport.init');
const authController = require('./lib/auth.controller');
const session = require('express-session');
const bcrypt = require('bcrypt');
const expressMongoDb = require('express-mongo-db');
const { introspectionQuery } = require('graphql');
const get_graphql_data = require('./graphql_util');
const {getNextSequenceValue, client} = require('./mongodb_util');
const con = require('./sql');
const MongoStore = require('connect-mongo')(session);
const util = require('util');
const fs = require('fs');
const fetch = require('node-fetch');

const query = util.promisify(con.query).bind(con);

const reddit_schema =  JSON.parse(fs.readFileSync('reddit_schema.json', 'utf8'));
const reddit_response =  JSON.parse(fs.readFileSync('reddit_response.json', 'utf8'));

app.use(express.json());
app.use(passport.initialize());
passportInit();

app.use(cors({
	origin: CLIENT_ORIGIN
})) 

app.use(session({ 
	secret: process.env.SESSION_SECRET, 
	resave: true, 
	saveUninitialized: true,
	store: new MongoStore({ client })
  }))

client.connect(async (err, client) => {
	const db = client.db('listenonline');

	try {
		const counter = await db.collection('counters').findOne({_id: "server_id"});

		if (!counter) {
			db.collection('counters').insertOne({_id:"server_id",sequence_value:0})
		}

	} catch (error) {
		throw error;
	}
  });


app.use(expressMongoDb('mongodb://localhost:27017/listenonline'));



app.all('*', checkUser);

function checkUser(req, res, next) {

  if ( req.path.startsWith('/app/api/auth')) {
	return next();
  }

  if (req.session.user_id) {
	  
	  if ((req.path.startsWith('/app/api/user') || req.path.startsWith('/app/api/server')) && !req.session.isAdmin) {
		  return res.sendStatus(403);
	  }
		return next();
	} else {
		return res.sendStatus(401);
	}
}

/* POTENTIAL REFACTOR TO ONE ENDPOINT */
app.get('/auth/twitter/callback', passport.authenticate('twitter'), authController.twitter);

app.get('/auth/youtube/callback', passport.authenticate('youtube'), authController.youtube);

app.get('/auth/reddit/callback', passport.authenticate('reddit'), authController.reddit);

app.get('/app/api/social-media-socket/:name', async (req, res, next) => {
	req.session.name = req.params.name
	req.session.socketId = req.query.socketId;

	try {
		const source = await req.db.collection('graphql_servers').findOne({name: req.params.name});

		if (source.slug === 'reddit') {
			req.session.state = crypto.randomBytes(32).toString('hex');
			passport.authenticate('reddit', {
			  state: req.session.state,
			  duration: 'permanent',
			})(req, res, next);
		} else {
			passport.authenticate(source.slug)(req, res, next)
		}
	} catch (err) {
		// TODO
	}
  });

////   Authentication Check    ////
app.post('/app/api/auth/login', async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	// send error
	let toSend = {
		data: {},
		error: {}
	};

	try {
		const output = await query("select id, email, name, isAdmin, password from users where email = ?", [email]);
		const isMatch = await bcrypt.compare(password, output[0].password);
		output[0].isAdmin = !!parseInt(output[0].isAdmin)
		toSend.data = {...output[0]};
		req.session.user_id = output[0].id
		req.session.isAdmin = output[0].isAdmin 
		res.send(toSend);

	} catch(err) {
		// TODO
	}

	// con.query("select id, email, name, isAdmin, password from users where email = ?", [email], function(err, output) {
	//   	if (err) {
	//   		throw err;
	// 	}
	//   	if (output.length == 0) {
	// 		console.log("fsdfsdd")
	//   		toSend.error = req.body;
	//   		res.send(toSend);
	// 	}

	// 	else {
	// 		bcrypt.compare(password, output[0].password, function(err, isMatch) {
	// 			if (err){
	// 				throw err;
	// 			}
	// 			if (isMatch) {
	// 				output[0].isAdmin = !!parseInt(output[0].isAdmin)
	// 				toSend.data = {...output[0]};
	// 				req.session.user_id = output[0].id
	// 				req.session.isAdmin = output[0].isAdmin 
	// 				res.send(toSend);
	// 			} else {
	// 				toSend.error = req.body;
	// 				res.send(toSend);
	// 			}
	// 			});
	// 	}
	//   });
});

app.post('/app/api/auth/register', async (req, res) => {
	var username = req.body.name;
	var pass = req.body.password;
	var email_ins = req.body.email;
	var invCode = req.body.invitationCode;

	let toSend = {
		data: {},
		error: {}
	};

	try {
		query("insert into users(name, email, password, invitationCode) values (?,?,?,?)", 
		[username, email_ins, await bcrypt.hash(pass, 12), invCode ]);

		const output = await query("select id, email, name, isAdmin from users where name = ?", [username]);

		output[0].isAdmin = !!parseInt(output[0].isAdmin)
		toSend.data = {...output[0]};
		req.session.user_id = output[0].id
		req.session.isAdmin = output[0].isAdmin 
		res.send(toSend);
	} catch(err) {
		// TODO
	}

	// con.query("insert into users(name, email, password, invitationCode) values (?,?,?,?)", 
	// 		[username, email_ins, await bcrypt.hash(pass, 12), invCode ], function(err, output) {
	//   	if (err) {
	//   		toSend.error = req.body;
	//   		res.send(toSend);
	//   	} else {
	//   		con.query("select id, email, name, isAdmin from users where name = ?", [username], function(err, output) {
	//   			if (err) {
	//   				throw err;
	// 			}
				
	// 			output[0].isAdmin = !!parseInt(output[0].isAdmin)
	// 			toSend.data = {...output[0]};
	// 			req.session.user_id = output[0].id
	// 			req.session.isAdmin = output[0].isAdmin 
	//   			res.send(toSend);
	//   		});
	//   	}	  	
	//   });
});

app.get('/app/api/auth/logout', (req, res) => {
	let toSend = {
		data: '',
	};
	req.session.destroy(err => {
		req.logOut();
		if (err) {
			toSend.error = {}
			toSend.error.generalError = ['Error: Could not logout'];
			res.send(toSend);
		} else {
			toSend.data = "Success logging out";
			res.send(toSend);
		}
	});
});

// done
app.get('/app/api/servers', async (req, res) => {
	let toSend = {
		data: [],
		error: {}
	};

	try {
		const result = await req.db.collection('graphql_servers').find({}, {_id: 0, name: 1, url: 1, slug: 1, description: 1, requireAuthentication: 1, requireAuthorization: 1 }).toArray();
		toSend.data = result;
		res.send(toSend);
	} catch (err) {
		// TODO
	}
});

// done
app.put('/app/api/server/update', async (req, res) => {
	const body = req.body.data;
	const type = req.body.type;
	
	let toSend = {
		data: {},
		error: {}
	};

	const schema = await get_graphql_data(body.url, introspectionQuery);

	try {
		// ADD
		if (type === 0) {
			req.db.collection('graphql_servers').insertOne({_id: await getNextSequenceValue('server_id', req.db), ...body, schema});
		}

		// DELETE
		else if (type === 1) {
			// delete cascade
			req.db.collection('graphql_servers').deleteOne({"name": body.name});
		}

		// UPDATE
		else if (type === 2) {
			req.db.collection('graphql_servers').updateOne({"name": body.name},{...body, schema});
		}

		toSend.data = body;
		res.send(toSend)
	} catch(err) {
		// TODO
	}
});

app.get('/app/api/server/refresh', async (req, res) => {
	const name = req.query.name;
	let toSend = {
		data: name,
		error: {}
	};

	try {
		const server = await req.db.collection('graphql_servers').findOne({"name": name});

		const new_schema = await get_graphql_data(server.url, introspectionQuery);
	
		req.db.collection('graphql_servers').updateOne(  { _id:server._id} , { $set: { schema: new_schema } });

		res.send(toSend);
	} catch (err) {
		toSend.error = err;
		res.send(toSend)
	}
});

///   social media platforms    ////
app.get('/app/api/social-media-platforms', async (req, res) => {

	let toSend = {
		data: [],
		error: {}
	  };

	try {
		
		const authorizations = await query('SELECT server_id FROM authorizations WHERE user_id = ?',[req.session.user_id]);

		const servers = await req.db.collection('graphql_servers').find({}).toArray();
		servers.forEach(server => {
			toSend.data.push({
				name: server.name,
				imageURL: '',
				isAuthenticated: authorizations.some(auth => auth.server_id === server._id)
			})
		})
		
		res.send(toSend);
	} catch (err) {
		// TODO
	}
});



////     queries table     ////
// done
app.get('/app/api/queries', async (req, res) => {
	let toSend = {
		data: [],
		error: {}
	  };

	try {
		const queries = await req.db.collection('queries').find({}, {_id: 0, name: 1, source: 1, schedule: 1, schema: 1}).toArray();
		toSend.data = queries;
		res.send(toSend);

	} catch (err) {
		// TODO
	}
});

app.get('/app/api/query/sources', async (req, res) => {
	let toSend = {
		data: [],
		error: {}
	};

	try {
		const sources = await req.db.collection('graphql_servers').find({}, {_id: 0, name: 1}).toArray();
		toSend.data = sources.map(source => source.name);
		res.send(toSend);
	} catch(err) {
		// TODO
	}
});

app.get('/app/api/query/full-schema', async (req, res) => {
	const source = req.query.source;

	let toSend = {
		data: {}
	  };

	try {
		const result = await req.db.collection('graphql_servers').findOne({name: source}, {_id: 0, schema: 1});
		toSend.data = result.schema;
		res.send(toSend);
	} catch(err) {
		// TODO
	}
});


function toGraphQLQueryString(result, node) {
	result += node.name;

	if (result.length > 0) {
		result += "{";
		node.inputs.forEach((input, index, inputs) => {
			if (input.inputType == 'String') {
				if (input.value) {
					result += input.name + ":" + (input.value ? JSON.stringify(input.value) : '""');
					if (index != inputs.length - 1) {
						result += ", ";
					}
				}
			} else {
				result += input.name + ":" + input.value;
				if (index != inputs.length - 1) {
					result += ", ";
				}
			}
		});

		result += ") ";
	}

	if (node.children.length > 0) {
		result += "{";

		node.children.forEach((child) => {
			if (child.selected) {
				result += toGraphQLQueryString(result + child.name + " ", child);
			}
		});

		result += "} ";
	}

	return result;
}


/////   *******    /////
app.put('/app/api/query/update',  async (req, res) => {
	const data = req.body.data;
	const type = req.body.type;

	let toSend = {
		data: {},
	  };

	try {
		const {_id, url, slug} = await req.db.collection('graphql_servers').findOne({name: data.source}, {url: 1, slug: 1})
		const server_id = _id

		// ADD
		if (type === 0) {
			req.db.collection('queries').insertOne({...data, server_id , user_id: req.session.user_id})
		}

		// DELETE
		else if (type === 1) {
			// TODO
		}

		// EXECUTE
		else if (type === 2) {

			const access_token = (await query('SELECT access_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, server_id]))[0].access_token;

			const data = {
				variables: null,
				query: '{ popular { data { children { data { title id name } } } } }',
			};

			const result = await fetch(url, {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const json = await result.json();



			if (json.errors[0].extensions.statusCode === 401) {
				const refresh_token = (await query('SELECT refresh_token FROM authorizations WHERE user_id = ? AND server_id = ?', [req.session.user_id, server_id]))[0].refresh_token;
				let access_token = null;

				if (slug === 'youtube') {
					const url = new URL('https://oauth2.googleapis.com/token')

					const params = {
						client_id: process.env.YOUTUBE_KEY,
						client_secret: process.env.YOUTUBE_SECRET,
						refresh_token: refresh_token,
						grant_type: 'refresh_token'
					}
		
					url.search = new URLSearchParams(params).toString();
	

					const res = await fetch(url, { method: 'POST' });

					access_token = (await res.json()).access_token;
				}

				else if (slug === 'reddit') {
					const auth = Buffer.from(process.env.REDDIT_KEY + ':' + process.env.REDDIT_SECRET).toString('base64');

					const res = await fetch('https://www.reddit.com/api/v1/access_token', {
						method: 'POST',
						body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
						headers: {
							'Authorization': `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
							'User-Agent' : 'Test Client v/1.0 '
						},
					});

					access_token = (await res.json()).access_token;
				}

				console.log(access_token);

				query("update authorizations set access_token = ? WHERE user_id = ? AND server_id = ?", 
				[access_token, req.session.user_id, server_id])


			} else {
				const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				req.db.collection('query_histories').insertOne({query_name: data.name, executionTimestamp: timestamp, runtime: 1000, data: json, user_id: req.session.user_id})
			}
		}

		toSend.data = query;
		res.send(toSend);
	} catch (err) {
		console.log(err);
	}
});

////     query_histories table     ////
app.get('/app/api/query/history-records', async (req, res) => {
	let qName = req.query.queryName;
	let toSend = {
		data: [],
		error: {}
	  };

	try {
		const history = await req.db.collection('query_histories').find({query_name: qName, user_id: req.session.user_id}, {_id: 0, executionTimestamp: 1, runtime: 1, data: 1}).toArray()
		toSend.data = history;
		res.send(toSend)
	} catch (err) {
		// TODO
		console.log(err);
	}
});


////     users table     ////
// done
app.get('/app/api/users', async (req, res) => {

	let toSend = {
		data: [],
		error: {}
	  };

	try {
		const users = await query('SELECT name, isAdmin, email, quota FROM users');

		toSend.data = users.map(user => ({ ...user, usedQuota: 0 }));
		res.send(toSend);
	} catch (err) {
		// TODO
	}
});

app.put('/app/api/user/update', (req, res) => {

	const toUpdate = req.body.data;
	const type = req.body.type;

	let toSend = {
		data: [],
		error: {}
	};

	try {
		// DELETE
		if (type == 0) {
			// emails are unique
			query("delete from users where email = ?", [toUpdate.name, toUpdate. email]);
			
		} 
		
		// UPDATE
		else if (type == 1) {
			// emails are unique
			query("update users set isAdmin = ?, quota = ? WHERE email = ?", 
					[toUpdate.isAdmin, toUpdate.quota, toUpdate.name, toUpdate.email])
		}
		toSend.data = toUpdate;
		res.send(toSend);
	} catch (err) {
		// TODO
	}


});


////     applications table     ////
// done 1
app.get('/app/api/applications', async (req, res) => {
	let toSend = {
		data: [],
	};

	try {
		const result = await query("select callback_url as callbackURL, home, name, description, cast(id as char) as id from applications WHERE user_id = ?",[req.session.user_id]);
		toSend.data = result
		res.send(toSend)
	} catch (err) {
		// TODO
	}
});

// done 1
app.put('/app/api/application/update', async (req, res) => {
	const toUpdate = req.body.data;
	const type = req.body.type;

	let toSend = {
		data: {},
	};

	try {
		// UPDATE
		if (type === 0) {
			query("update applications set name = ?, callback_url = ?, home = ?, description = ? WHERE id = ?", 
			[toUpdate.name, toUpdate.callbackURL, toUpdate.home, toUpdate.description, parseInt(toUpdate.id)])
		} 
		
		// DELETE
		else if (type === 1) {
			await query("delete from applications where id = ?", 
			[parseInt(toUpdate.id)]);
		} 
		
		// CREATE
		else if (type === 2) {
			const result = await query('insert into applications(name, callback_url, home, description, user_id) values (?,?,?,?,?)', 
			[toUpdate.name, toUpdate.callbackURL, toUpdate.home, toUpdate.description, req.session.user_id]);

			toUpdate.id = result.insertId.toString()
		}

		toSend.data = toUpdate;
		res.send(toSend);

	} catch(err) {
		console.log(err);
	}

});

var server = app.listen(3000, () => {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
});

const io = socketio(server)
app.set('io', io)

module.exports = server;

