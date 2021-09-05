var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs290_nguyenbo',
  password        : '8248',
  database        : 'cs290_nguyenbo',
});

module.exports.pool = pool;
