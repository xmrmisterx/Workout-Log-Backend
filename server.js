const { urlencoded } = require('body-parser');
var express = require('express');
var mysql = require('./dbcon.js');
var CORS = require('cors');
var axios = require('axios');

var app = express();

// set local port for testing

// app.set('port', 5125);

// set heroku port for deployment

var port = process.env.PORT || 8080;
app.set('port', port);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(CORS());

/* CS340 PROJECT CODE */

const dropProductsTableQuery = "DROP TABLE IF EXISTS `Products`";
const makeProductsTableQuery = `CREATE TABLE Products (
                                productID int(11) NOT NULL,
                                manufacturerID int(11) DEFAULT NULL,
                                productName varchar(255) NOT NULL,
                                price decimal(10,2) NOT NULL,
                                quantity int(3) NOT NULL 
                                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;`;

const getProductsQuery = 'SELECT * FROM Products';
const insertProductsQuery = "INSERT INTO Products (`manufacturerID`, `productName`, `price`, `quantity`) VALUES (?, ?, ?, ?)";

// function to get products data

const getProductsData = (res) => { 
  mysql.pool.query(getProductsQuery, (err, rows, fields) => {
    if (err){
      next(err);
      return;
    }
    res.json({ "rows": rows });
  })
}

// get products table data route

app.get('/get-products-data',function(req,res,next){
  var context = {};
  mysql.pool.query(getProductsQuery, (err, rows, fields) => {
    if(err){
      next(err);
      return;
    }
    context.results = JSON.stringify(rows);
    res.send(context);
  });
});

// reset products table route (deletes and recreates products table)

app.get('/reset-products-table',function(req,res,next){
  mysql.pool.query(dropProductsTableQuery, function(err){
    mysql.pool.query(makeProductsTableQuery, function(err){
      res.send("Products table reset...");
    })
  });
});

// add row to products table route

app.post('/add-product',function(req,res,next){
  var {productID, manufacturerID, productName, price, quantity} = req.body;
  mysql.pool.query(
    insertProductsQuery, 
    [productID, manufacturerID, productName, price, quantity],
    (err, result) => {
      if(err){
        next(err);
        return;
      }
      getProductsData(res); 
    }
  );
});

/* IMAGE SCRAPER FOR MOUNTAIN SITE CODE */

// set variables for image scraper

var item_number = 0;
var img_url = '';
var query_str = '';

// get request for image scraper

app.get('/scraper/:str', (req, res) => {

  // set query string

  query_str = req.params.str;

  (async () => {
    try {

      // get item number

      const response = await axios.get("https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=" + query_str + "&format=json&formatversion=2");
      item_number = response.data.query.pages[0].pageprops.wikibase_item;

    } catch (error) {
      console.log(error.response);
    }

    try {

      // get image name

      const response = await axios.get("https://www.wikidata.org/w/api.php?action=wbgetclaims&property=P18&entity=" + item_number + "&format=json");
      let image_name = response.data.claims.P18[0].mainsnak.datavalue.value;

      // replace spaces in image name with underscores

      let processed_image_name = "";

      for (let i=0; i <image_name.length; i++) {
        curr_letter = image_name[i];
        if (curr_letter == " "){
          curr_letter = "_";
        }
        processed_image_name += curr_letter;
      }

      // image url is wiki site plus image name

      img_url = "https://commons.wikimedia.org/w/thumb.php?width=400&f=" + processed_image_name;

    } catch (error) {
      console.log(error.response);
    }

    // send image url

    res.send(img_url);

  })();
});

/* WORKOUT LOG CODE */

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

// gets table data function

const getAllData = (res) => { 
  mysql.pool.query(getAllQuery, (err, rows, fields) => {
    if (err){
      next(err);
      return;
    }
    res.json({ "rows": rows });
  })
}

// create function to ping server every 30 mins to prevent Heroku app from sleeping (every 5 minutes is 300000 ms)

setInterval(function() {
  https.get("https://cryptic-dusk-31004.herokuapp.com");
}, 1800000);

// get request to get data

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

// post request to insert data

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

// delete request to delete row

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

// put request to edit row

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

// get request to reset table

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











