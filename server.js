var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var db = require('./js/database.js');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var multer = require('multer');
var flash = require('connect-flash');
var escape = require('escape-html');

const saltRounds = 10;

var engines = require('consolidate');
app.engine('html', engines.hogan);
var path = require('path');
var fs = require('fs');
app.set('views', __dirname);
app.set('view engine', 'html');
app.use(express.static(__dirname));

var unirest = require('unirest');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(expressValidator());

app.use(cookieParser());

app.use(session({
	secret: 'oiashdfbnjnjkjsdaoffgjngb',
	resave: false,
	saveUninitialized: false,
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function (username, password, done) {
	// console.log(username);
	// console.log(password);
	// get password hash corresponding to entered username
	db.connection.query('SELECT id, password FROM user WHERE username = ?', [username], function(err, results) {
		if (err) done(err);
		// if no results are found, user does not exist in database
		if (results.length === 0) {
			done(null, false);
		} else {
			// console.log(results[0].password.toString())
			const hash = results[0].password.toString();

			bcrypt.compare(password, hash, function(err, response) {
				if (response) {
					return done(null, {user_id: results[0].id})
				} else {
					return done(null, false);
				}
			});
		}
	});
}));

var queryGLOBAL = "";

app.use(function(req, res, next) {
	res.locals.isAuthenticated = req.isAuthenticated();
	res.locals.notAuthenticated = !req.isAuthenticated();
	next();
})

app.get('/', function(request, response) {
// 	console.log('home page');
// 	console.log(request.user);
// 	console.log(request.isAuthenticated());

 	  response.status(200).type('html');
 	  if(request.isAuthenticated()){
 	  	response.render('html/specialdishes.html', {profile: request.user.user_id});
 	  }else {
 	  	response.render('html/specialdishes.html');
 	  }

});

app.get('/search/:query', function(request, response) {
		  if(request.isAuthenticated()){
	response.render('html/search.html', {query: queryGLOBAL, profile: request.user.user_id});
} else {
	response.render('html/search.html', {query: queryGLOBAL});
}
});

app.get('/login', function(req, res) {
	res.render('html/login.html');
})

// handles a login request
app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));

app.get('/logout', function(req, res) {
	req.logout();
	req.session.destroy();
	res.redirect('/');
});

app.get('/register', function(req, res) {
	res.render('html/register.html');
});

app.post('/register', function(req, res) {

	req.checkBody('username', 'Username cannot be empty.').notEmpty();
	req.checkBody('username', 'Username must be between 4 and 15 characters in length.').len(4, 15);
	req.checkBody('password', 'Password must be between 8 and 50 characters in length.').len(8, 50);
	req.checkBody('confirmPassword', 'Passwords do not match, please try again.').equals(req.body.password);

	const errors = req.validationErrors();
	//console.log(req.body.terms);
	if (errors || (req.body.terms == undefined)) {
		//console.log(`errors: , ${JSON.stringify(errors)}`);
		res.render('html/register.html', {badinput: true, errors: errors});
	} else {
		//console.log('registering user');
		//console.log(req.body);
		var user = req.body.username;
		var pass = req.body.password;

		//console.log(user);
		//console.log(pass);
		db.connection.query('SELECT * FROM user WHERE username = ?', [user], function(err, result) {
			if (result.length == 0) {
				// user name is valid, hash plaintext password and add to database
				bcrypt.hash(pass, saltRounds, function(err, hash) {
					db.connection.query('INSERT INTO user (username, password) VALUES (?, ?)', [user, hash], function(err, results) {
						//if (err) console.log(err);

						db.connection.query('SELECT LAST_INSERT_ID() as user_id', function(error, results) {
							const user_id = results[0];
							var pref = 'INSERT INTO preferences (pesc, lactoveg, ovoveg, vegetarian, vegan, paleo, primal, intolerances) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

							db.connection.query(pref, ['false', 'false', 'false','false', 'false', 'false', 'false', 'None'], function(err, result3) {
								if (err) console.log(err);
								console.log(result3);
								req.login(user_id, function(err) {
									res.redirect('/');
								});
							});
						});
					});
				});
			} else {
				// username is already taken, redirect to registration
				res.render('html/register.html');
			}
		});
	}
});


passport.serializeUser(function(user_id, done) {
	done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
	done(null, user_id);
})

app.get('/profile', authenticationMiddleware(), function(request, response) {

	db.connection.query('SELECT username from user WHERE id = ?', [request.user.user_id], function (err, result) {
		response.render('html/profile.html', {user: result[0].username, profile: request.user.user_id});
	});
});


app.get('/preferences', authenticationMiddleware(), function(req, res) {
	var sql = 'SELECT pesc, lactoveg, ovoveg, vegetarian, vegan, paleo, primal, intolerances FROM preferences WHERE id = ?';
	//var sql = 'SELECT * FROM preferences WHERE user_id = ?';
	db.connection.query(sql, [req.user.user_id], function(err, result) {
		if (err) throw err;
		res.json([result]);
	});
});

app.post('/add-diet', authenticationMiddleware(), function(req, res){
	var user_id = req.body.user_id;
	var diet = req.body.diet;

	var sql = 'UPDATE preferences SET ' + diet + ' = true WHERE id = ?';

	db.connection.query(sql, [user_id], function(err, result) {
		if (err) throw err;
		res.end();
	});
});

app.post('/remove-diet', authenticationMiddleware(), function(req, res){
	var user_id = req.body.user_id;
	var diet = req.body.diet;


	var sql = 'UPDATE preferences SET ' + diet + ' = false WHERE id = ?';

	db.connection.query(sql, [user_id], function(err, result) {
		if (err) throw err;
		res.end();
	});
});

app.post('/add-intolerances', authenticationMiddleware(), function(req, res) {
	var user_id = req.body.user_id;
	var intolerances = escape(req.body.intol);

	var sql = 'UPDATE preferences SET intolerances = ? WHERE id = ?';

	db.connection.query(sql, [intolerances, user_id], function(err, result) {
		if (err) throw err;
		res.end();
	});
});

app.post('/fav/:id', authenticationMiddleware(), function(req, res) {
	// add to favorites database table

	var sql = "INSERT IGNORE INTO favs (recipe, user_id, name, image) VALUES (?, ?, ?, ?)";

	db.connection.query(sql, [req.params.id, req.user.user_id, req.body.title, req.body.image], function(error, result) {
		if (error) throw error;
		res.end();
	});
});

app.post('/unfav', authenticationMiddleware(), function(req, res) {

	var sql = "DELETE FROM favs WHERE recipe = ? AND user_id = ?";

	db.connection.query(sql, [req.body.recipe, req.user.user_id], function(err, res) {
		if (err) console.log(err);
	});
});

app.get('/fav', authenticationMiddleware(), function(req, res) {
	console.log(req.user.user_id);
	// get user's favorites from database
	var sql = "SELECT recipe, name, image FROM favs WHERE user_id = ?";

	db.connection.query(sql, [req.user.user_id], function(error, result) {
		if (error) throw error;

		res.json([result]);
	})
});

function authenticationMiddleware() {
	return (req, res, next) => {

		if (req.isAuthenticated()) return next();

		res.redirect('/');
	}
}

io.sockets.on('connection', function(socket){

	//on the "seasonal" request
  socket.on('seasonal', function(callback){
    var recipes = [];
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=shrimp&number=10&offset=0&")
    .header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {
      for(var i=0; i<result.body.results.length; i++){
        var recipe = {
          id: result.body.results[i].id,
          title: result.body.results[i].title,
          image: result.body.results[i].image,
          minutes: result.body.results[i].readyInMinutes,
        }
        recipes.push(recipe);
      }
      callback(recipes);
    });
  });

  //on the "recipe" request
  socket.on('recipe', function(query, callback){
    var recipes = [];
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + query + "&number=10&offset=0")
    .header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {
      for(var i=0; i<result.body.results.length; i++){
        var recipe = {
          id: result.body.results[i].id,
          title: result.body.results[i].title,
          image: result.body.results[i].image,
          minutes: result.body.results[i].readyInMinutes,
        }
        recipes.push(recipe);
      }
      callback(recipes);
    });
  });
	//on the "recipe" request
	socket.on('allRecipes', function(query,time,cost,vegetarian,vegan,glutenFree,fat,calories,sugar, protein, carbs, callback){
		var recipes = [];
		var recipesComplex = [];
		var count = 0;
		//search all recipes
    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + query + "&number=100&offset=0")
    .header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
    .end(function (result) {
      for(var i=0; i<result.body.results.length; i++){
        var recipeID = result.body.results[i].id;
        recipes.push(recipeID);
      }
			//get each recipes information, and delete it from list based on filters
			for(var j=0; j<recipes.length; j++){
				var recipeID = recipes[j];
				unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/"+ recipeID +"/information?includeNutrition=true")
				.header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
				.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
				.end(function (result) {
					var recipe = {
	          id: result.body.id,
	          title: result.body.title,
	          image: result.body.image,
						minutes: result.body.readyInMinutes,
	        }
					recipesComplex.push(recipe);
					//if. readyInMinutes > time && time != "null" pop it
					if (parseInt(result.body.readyInMinutes) > parseInt(time)) {
						recipesComplex.pop();
					}
					//if else. pricePerServing > cost && cost != "null" pop it
					else if (parseInt(result.body.pricePerServing) > parseInt(cost)) {
						recipesComplex.pop();
					}

					//if else. diet == false && diet != "null" pop it
					else if (result.body.vegetarian == false && vegetarian == true) {
						recipesComplex.pop();
					}
					else if (result.body.vegean == false && vegan == true) {
						recipesComplex.pop();
					}
					else if (result.body.glutenFree == false && glutenFree == true) {
						recipesComplex.pop();
					}

					//if else. fat < nutrition.nutrients[1].amount, pop it
					else if (fat != "" && result.body.nutrition.nutrients[1].amount > fat) {
						recipesComplex.pop();
					}
					//if else. calories < nutrition.nutrients[0]..amount, pop it
					else if (calories != "" && result.body.nutrition.nutrients[0].amount > calories) {
						recipesComplex.pop();
					}
					//if else. sugar < nutrition.nutrients[4]..amount, pop it
					else if (sugar != "" && result.body.nutrition.nutrients[4].amount > sugar) {
						recipesComplex.pop();
					}
					else if (protein != "" && result.body.nutrition.nutrients[7].amount > protein) {
						recipesComplex.pop();
					}
					else if (carbs != "" && result.body.nutrition.nutrients[3].amount > carbs) {
						recipesComplex.pop();
					}
					if(count == recipes.length-1){
						callback(recipesComplex);
					}
					count++;
				});
			}
    });
  });


	//for a complex search, with filters
	socket.on('complexRecipe', function(showingAll,intolerances,time,cost,vegetarian,vegan,pescetarian,lactovegetarian,ovovegetarian,paleo,primal,glutenFree,fat,calories,sugar, protein, carbs, callback){
    var recipes = [];
		var recipesComplex = [];
		var count = 0;
		if(showingAll == false){
			//search all recipes
			var intols = intolerances.split(",");
			var q = ""
			for (var i = 0; i < intols.length; i++) {
				q += intols[i] + '%2C+';
			}
			q = q.slice(0, q.length - 4);
	    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + queryGLOBAL + "&number=50&offset=0&intolerances=" + q)
	    .header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
	    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	    .end(function (result) {
	      for(var i=0; i<result.body.results.length; i++){
	        var recipeID = result.body.results[i].id;
	        recipes.push(recipeID);
	      }
				//get each recipes information, and delete it from list based on filters
				for(var j=0; j<recipes.length; j++){
					var recipeID = recipes[j];
					unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/"+ recipeID +"/information?includeNutrition=true")
					.header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
					.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
					.end(function (result) {
						var recipe = {
		          id: result.body.id,
		          title: result.body.title,
		          image: result.body.image,
							minutes: result.body.readyInMinutes,
		        }
						recipesComplex.push(recipe);
						//if. readyInMinutes > time && time != "null" pop it
						if (parseInt(result.body.readyInMinutes) > parseInt(time)) {
							recipesComplex.pop();
						}
						//if else. pricePerServing > cost && cost != "null" pop it
						else if (parseInt(result.body.pricePerServing) > parseInt(cost)) {
							recipesComplex.pop();
						}

						//if else. diet == false && diet != "null" pop it
						else if (result.body.vegetarian == false && vegetarian == true) {
							recipesComplex.pop();
						}
						else if (result.body.vegean == false && vegan == true) {
							recipesComplex.pop();
						}
						else if (result.body.glutenFree == false && glutenFree == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('pescetarian') == false && pescetarian == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('paleolithic') == false && paleo == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('primal') == false && primal == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('lacto ovo vegetarian') == false && (lactovegetarian == true || ovovegetarian == true)) {
							recipesComplex.pop();
						}

						//if else. fat < nutrition.nutrients[1].amount, pop it
						else if (fat != "" && result.body.nutrition.nutrients[1].amount > fat) {
							recipesComplex.pop();
						}
						//if else. calories < nutrition.nutrients[0]..amount, pop it
						else if (calories != "" && result.body.nutrition.nutrients[0].amount > calories) {
							recipesComplex.pop();
						}
						//if else. sugar < nutrition.nutrients[4]..amount, pop it
						else if (sugar != "" && result.body.nutrition.nutrients[4].amount > sugar) {
							recipesComplex.pop();
						}
						else if (protein != "" && result.body.nutrition.nutrients[7].amount > protein) {
							recipesComplex.pop();
						}
						else if (carbs != "" && result.body.nutrition.nutrients[3].amount > carbs) {
							recipesComplex.pop();
						}
						if(count == recipes.length-1){
							finalRecipes = [];
							for(var l=0; l<10; l++){
								finalRecipes.push(recipesComplex[l]);
							}
							callback(finalRecipes);
						}
						count++;
					});
				}
	    });
		}
		else if(showingAll == true){
			var intols = intolerances.split(",");
			var q = ""
			for (var i = 0; i < intols.length; i++) {
				q += intols[i] + '%2C+';
			}
			q = q.slice(0, q.length - 4);
			//search all recipes
	    unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?query=" + queryGLOBAL + "&number=100&offset=0&intolerances=" + q)
	    .header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
	    .header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	    .end(function (result) {
	      for(var i=0; i<result.body.results.length; i++){
	        var recipeID = result.body.results[i].id;
	        recipes.push(recipeID);
	      }
				//get each recipes information, and delete it from list based on filters
				for(var j=0; j<recipes.length; j++){
					var recipeID = recipes[j];
					unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/"+ recipeID +"/information?includeNutrition=true")
					.header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
					.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
					.end(function (result) {
						var recipe = {
		          id: result.body.id,
		          title: result.body.title,
		          image: result.body.image,
							minutes: result.body.readyInMinutes,
		        }
						recipesComplex.push(recipe);
						//if. readyInMinutes > time && time != "null" pop it
						if (parseInt(result.body.readyInMinutes) > parseInt(time)) {
							recipesComplex.pop();
						}
						//if else. pricePerServing > cost && cost != "null" pop it
						else if (parseInt(result.body.pricePerServing) > parseInt(cost)) {
							recipesComplex.pop();
						}

						//if else. diet == false && diet != "null" pop it
						else if (result.body.vegetarian == false && vegetarian == true) {
							recipesComplex.pop();
						}
						else if (result.body.vegean == false && vegan == true) {
							recipesComplex.pop();
						}
						else if (result.body.glutenFree == false && glutenFree == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('pescetarian') == false && pescetarian == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('paleolithic') == false && paleo == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('primal') == false && primal == true) {
							recipesComplex.pop();
						}
						else if (result.body.diets.includes('lacto ovo vegetarian') == false && (lactovegetarian == true || ovovegetarian == true)) {
							recipesComplex.pop();
						}

						//if else. fat < nutrition.nutrients[1].amount, pop it
						else if (fat != "" && result.body.nutrition.nutrients[1].amount > fat) {
							recipesComplex.pop();
						}
						//if else. calories < nutrition.nutrients[0]..amount, pop it
						else if (calories != "" && result.body.nutrition.nutrients[0].amount > calories) {
							recipesComplex.pop();
						}
						//if else. sugar < nutrition.nutrients[4]..amount, pop it
						else if (sugar != "" && result.body.nutrition.nutrients[4].amount > sugar) {
							recipesComplex.pop();
						}
						else if (protein != "" && result.body.nutrition.nutrients[7].amount > protein) {
							recipesComplex.pop();
						}
						else if (carbs != "" && result.body.nutrition.nutrients[3].amount > carbs) {
							recipesComplex.pop();
						}
						if(count == recipes.length-1){
							callback(recipesComplex);
						}
						count++;
					});
				}
	    });
		}

  });
});

app.get('/recipe/:id', function(request, response) {

	unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + request.params.id +"/information")
	.header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
	.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	.end(function (result) {

		if(request.isAuthenticated()){
			 response.render('html/inside-recipe.html', {id: request.params.id, RecipeName: result.body.title, Img: result.body.image, Min: result.body.readyInMinutes, Diff: 'Easy', TotIng: result.body.extendedIngredients.length , Serv: result.body.servings, profile: request.user.user_id});

			}else {
			  response.render('html/inside-recipe.html', {id: request.params.id, RecipeName: result.body.title, Img: result.body.image, Min: result.body.readyInMinutes, Diff: 'Easy', TotIng: result.body.extendedIngredients.length , Serv: result.body.servings});

			}

	});

});

app.get('/recipe-info/:id', function(request, response) {

	unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + request.params.id +"/information")
	.header("X-Mashape-Key", "4LiZhRuvt0mshAdSoWpfUtLojm7fp1PxLHBjsnTeyQcqdzbVvL")
	.header("X-Mashape-Host", "spoonacular-recipe-food-nutrition-v1.p.mashape.com")
	.end(function (result) {

		var ingredients = result.body.extendedIngredients;
		var instructions = result.body.analyzedInstructions;

		response.json([ingredients, instructions]);
	});
});


 var profile_storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./data/profile_images");
     },
     filename: function(req, file, callback) {
     	var name = req.user.user_id;

         callback(null, name + ".png");
     }
 });
var uploadprofile = multer({
     storage: profile_storage
 }).array("imgUploader", 3); //Field name and max count

app.get("/uploadprofile", function(req, res) {
     res.sendFile(__dirname + "html/profile.html");
 });
 app.post("/uploadprofile", function(req, res) {
     uploadprofile(req, res, function(err) {
         if (err) {
             return res.end("Something went wrong! Press back in your browser!");
         }
         res.redirect('/profile');
     });
 });


var cover_storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./data/cover_photos");
     },
     filename: function(req, file, callback) {
     	var name = req.user.user_id;

         callback(null, name + ".png");
     }
 });
var uploadcover = multer({
     storage: cover_storage
 }).array("imgUploader", 3); //Field name and max count

app.get("/uploadcover", function(req, res) {

     res.sendFile(__dirname + "html/profile.html");
 });
 app.post("/uploadcover", function(req, res) {
     uploadcover(req, res, function(err) {
         if (err) {
             return res.end("Something went wrong! Press back in your browser!");
         }
         res.redirect('/profile');
     });
 });

app.post('/', function(request, response) {
	var protocol = request.protocol;
	var host = request.get('host');
	var newURL = protocol + '://' + host + '/';
	response.redirect(newURL);
});

app.post('/search/:query', function(request, response) {
	var q = request.params.query;
	var protocol = request.protocol;
	var host = request.get('host');
	queryGLOBAL = q;
	var newURL = protocol + '://' + host + '/search/' + q;
	response.redirect(newURL);
});

app.post('/profile', function(request, response) {
	var protocol = request.protocol;
	var host = request.get('host');
	var newURL = protocol + '://' + host + '/profile';
	response.redirect(newURL);
});

server.listen(8081, function(error, response) {
	if(error) {
		console.log('Error: ' + error);
	}
	else {
		console.log('Server listening on Port ' + this.address().port);
	}
});
