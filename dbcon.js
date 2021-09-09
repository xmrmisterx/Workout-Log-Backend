var mysql = require('mysql');

var pool = mysql.createPool({
  host            : 'us-cdbr-east-04.cleardb.com',
  user            : 'ba78fb274f2846',
  password        : 'e7c84551',
  database        : 'heroku_2502c22c3414591',
});

module.exports.pool = pool;
