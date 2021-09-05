const { urlencoded } = require('body-parser');
var express = require('express');
var mysql = require('./dbcon.js');
var CORS = require('cors');

var app = express();

// set local port for testing

// app.set('port', 5125);

// set heroku port for deployment

var port = process.env.PORT || 8080;
app.set('port', port);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(CORS());

const getAllQuery = 'SELECT * FROM workout';
const insertQuery = "INSERT INTO workout (`name`, `reps`, `weight`, `unit`, `date`) VALUES (?, ?, ?, ?, ?)";
const updateQuery = "UPDATE workout SET name=?, reps=?, weight=?, unit=?, date=? WHERE id=?";
const deleteQuery = "DELETE FROM workout WHERE id=?";
const dropTableQuery = "DROP TABLE IF EXISTS workout";
const makeTableQuery = `CREATE TABLE workout(
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        name VARCHAR(255) NOT NULL,
                        reps INT,
                        weight INT,
                        unit BOOLEAN, 
                        date DATE);`;

// Unit of 0 is lbs and unit of 1 is kgs

const getAllData = (res) => { 
  mysql.pool.query(getAllQuery, (err, rows, fields) => {
    if (err){
      next(err);
      return;
    }
    res.json({ "rows": rows });
  })
}

app.get('/',function(req,res,next){
  var context = {};
  mysql.pool.query(getAllQuery, (err, rows, fields) => {
    if(err){
      next(err);
      return;
    }
    context.results = JSON.stringify(rows);
    res.send(context);
  });
});

app.post('/',function(req,res,next){
  var {name, reps, weight, unit, date, id} = req.body;
  mysql.pool.query(
    insertQuery, 
    [name, reps, weight, unit, date, id],
    (err, result) => {
      if(err){
        next(err);
        return;
      }
      getAllData(res); 
    }
  );
});

app.delete('/',function(req,res,next){
  var {id} = req.body;
  var context = {};
  mysql.pool.query(deleteQuery, [id], (err, result) => {
    if(err){
      next(err);
      return;
    }
    getAllData(res);
  });
});

app.put('/',function(req,res,next){
  var context = {};
  var {name, reps, weight, unit, date, id} = req.body;
  mysql.pool.query(updateQuery,
      [name, reps, weight, unit, date, id],
    (err, result) => {
    if(err){
      next(err);
      return;
    }
    context.results = "Updated " + result.changedRows + " rows.";
    res.send(context);
  });
});

app.get('/reset-table',function(req,res,next){
  var context = {};
  mysql.pool.query(dropTableQuery, function(err){
    mysql.pool.query(makeTableQuery, function(err){
      console.log("table reset");
    })
  });
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});











