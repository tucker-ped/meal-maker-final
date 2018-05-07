var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'mealmakerdb.cot7rifqev7a.us-east-1.rds.amazonaws.com',
  user: 'mealmaker',
  password: 'mealmakerpassword',
  port: 3306,
  database: 'mmdb'
});

connection.connect(function(err) {
  if (err) {
    console.log('Database connection failed: ', err.stack);
    return;
  }

  console.log('Connected to database');
/*
  connection.query('DROP TABLE user, favs, preferences');

*/
  var createTable = "CREATE TABLE IF NOT EXISTS user ( id INTEGER PRIMARY KEY AUTO_INCREMENT, ";
  createTable += "username CHAR(255), password CHAR(255) )";

  connection.query(createTable, function(err, result) {
    if (err) throw err;
    console.log('User table created');
  });


  var createTable2 = "CREATE TABLE IF NOT EXISTS favs ( recipe INTEGER, user_id INTEGER, ";
  createTable2 += "name CHAR(255), image CHAR(255), PRIMARY KEY (recipe, user_id))";

  connection.query(createTable2, function(err, result) {
    if (err) throw err;
    console.log('Favorites table created');
  });

  var createTable3 = "CREATE TABLE IF NOT EXISTS preferences (id INTEGER PRIMARY KEY AUTO_INCREMENT, ";
  createTable3 += "pesc BOOLEAN, lactoveg BOOLEAN, ovoveg BOOLEAN, vegetarian BOOLEAN, ";
  createTable3 += "vegan BOOLEAN, paleo BOOLEAN, primal BOOLEAN, intolerances TEXT)"

  connection.query(createTable3, function(err, result) {
    if (err) throw err;
    console.log('Preferences table created');
  });
});

exports.connection = connection;
