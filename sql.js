const mysql = require('mysql');
const util = require('util');

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

con.connect((err) => {
  if (err) throw err;
  console.log('Connected correctly to SQL');
});

module.exports = util.promisify(con.query).bind(con);
