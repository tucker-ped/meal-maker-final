var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'mealmakerdb.cot7rifqev7a.us-east-1.rds.amazonaws.com',
  user: 'mealmaker',
  password: 'mealmakerpassword',
  port: 3306
});

connection.connect(function(err) {
  if (err) {
    console.log('Database connection failed: ', err.stack);
    return;
  }

  console.log('Connected to database');

  connection.query("CREATE DATABASE mmdb", function(err, result) {
    if (err) throw err;

    console.log('database created');
  });
});
