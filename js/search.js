var socket = io.connect();
var time = 10000;
var cost = 10000;
var vegetarian = false;
var vegan = false;
var glutenFree = false;
var fat = 10000;
var calories = 10000;
var sugar = 10000;
var protein = 10000;
var carbs = 10000;
var showingAll = false;

$(document).ready(function() {

	//if user clicks the profile includeNutrition
	$("#profileIcon").click(function(){
		$.post("/profile",function(response){
	    window.location.assign('/profile');
	  });
	})

	//if user clicks on "mealmaker"
	$("#logo").click(function(){
		$.post("/",function(response){
	    window.location.assign('/');
	  });
	})

	var pathname = window.location.pathname; // Returns path only
	var url = window.location.href;     // Returns full URL
	var query = "";
	if(pathname.length > 7 ){
		var i;
		for (i = 8; i < pathname.length; i++) {
    	query = query + pathname[i];
		}
		searchRecipes(query);
	}
	$("#seeAll").click(function(){
		loadAllResults(query, time,cost,vegetarian,vegan,glutenFree,fat,calories,sugar, protein, carbs);
		showingAll = true;
		$("#seeAll").toggle();
		$("#seeAll2").toggle();
		$("#top10").html("All Results");
	})
	$("#seeAll2").click(function(){
		searchRecipes(query, carbs);
		showingAll = false;
		$("#seeAll").toggle();
		$("#seeAll2").toggle();
		$("#top10").html("Top 10 Results");

	})

	var form = document.getElementById('form');
	form.addEventListener('submit', submitHandler, false);

	var filters = document.getElementById('filters');
	filters.addEventListener('submit', filterHandler, false);
});

function filterHandler(e){
	e.preventDefault();
	time = document.getElementById('dropdownTime').value;
	cost = document.getElementById('dropdownMoney').value;
	vegetarian = document.getElementById('vegetarianCheckbox').checked;
	vegan = document.getElementById('veganCheckbox').checked;
	pescetarian = document.getElementById('pescetarianCheckbox').checked;
	lactovegetarian = document.getElementById('lactovegetarianCheckbox').checked;
	ovovegetarian = document.getElementById('ovovegetarianCheckbox').checked;
	paleo = document.getElementById('paleoCheckbox').checked;
	primal = document.getElementById('primalCheckbox').checked;
	preferences = false;
	glutenFree = document.getElementById('glutenFreeCheckbox').checked;

	fat = document.getElementById('fatFilter').value;
	calories = document.getElementById('caloriesFilter').value;
	sugar = document.getElementById('sugarFilter').value;
	protein = document.getElementById('proteinFilter').value;
	carbs = document.getElementById('carbsFilter').value;

	var meta = document.querySelector('meta[name=loggedin]');
	var loggedin = meta.content;

	console.log(loggedin);

	if (loggedin == "true") {
		preferences = document.getElementById('chk-pref').checked;
		console.log(preferences);
	}


	if (preferences) {

		$.get('/preferences', function(data) {
			var rows = data[0][0];

			vegetarian = rows['vegetarian'];
			vegan = rows['vegan'];
			pescetarain = rows['pesc'];
			lactovegetarian = rows['lactoveg'];
			ovovegetarian = rows['ovoveg'];
			paleo = rows['paleo'];
			primal = rows['primal'];
			var intolerances = rows['intolerances'];


			complexSearch(showingAll, intolerances, time, cost, vegetarian, vegan, pescetarian, lactovegetarian, ovovegetarian, paleo, primal, glutenFree, fat, calories, sugar, protein, carbs);

		});

	} else {
		complexSearch(showingAll, '', time, cost, vegetarian, vegan, pescetarian, lactovegetarian, ovovegetarian, paleo, primal, glutenFree, fat, calories, sugar, protein, carbs);
	}

}


function submitHandler(e) {
  e.preventDefault();
	var query = $('#search_box').val();

	//searchRecipes(query);
	$.post("/search/" + query,function(response){
    window.location.assign('/search/'+ query);
  });
	location.reload();
	//history.pushState(null, '', '/search/'+query);
	$('#search_box').val('');

}

function complexSearch(showingAll, intolerances, time, cost, vegetarian, vegan, pescetarian, lactovegetarian, ovovegetarian, paleo, primal, glutenFree, fat, calories, sugar, protein, carbs){
	socket.emit('complexRecipe', showingAll, intolerances, time,cost,vegetarian,vegan,pescetarian,lactovegetarian,ovovegetarian,paleo,primal,glutenFree,fat,calories,sugar, protein, carbs, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				var time = recipes[i].minutes;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+" width=240px height=150px> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#resultList').append(li);
      }
  });
}

//basic search
function searchRecipes(query){
	socket.emit('recipe', query, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				var time = recipes[i].minutes;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+" width=240px height=150px> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#resultList').append(li);
      }
  });
}

function loadAllResults(query,time,cost,vegetarian,vegan,glutenFree,fat,calories,sugar, protein, carbs){
	socket.emit('allRecipes', query,time,cost,vegetarian,vegan,glutenFree,fat,calories,sugar, protein, carbs, function(recipes){
      // display a newly-arrived message
			$("#resultList").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				var image = recipes[i].image;
				var id = recipes[i].id;
				var time = recipes[i].minutes;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+" width=240px height=150px> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#resultList').append(li);
      }
  });
}

function gotoRecipe(recipe) {
	window.location.assign('/recipe/' + recipe);

}
