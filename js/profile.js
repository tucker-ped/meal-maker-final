$(document).ready(function() {
	var edit = document.getElementById('edit-preferences');
	edit.style.display = 'none';
	// get user's favorite recipes
	$.get('/fav', function(data, res) {
		if (data) {
			$('#fav_list').empty();

			for (var i = 0; i < data[0].length; i++) {
				var id = data[0][i].recipe;
				var title = data[0][i].name;
				var image = "https://spoonacular.com/recipeImages/"+ id +"-240x150.jpg";

				var li = "<li id='" + id + "' class='resultItem'> <div id='resultImage'> <img src="+image+"> </div> <div class='resultTitle' onclick='gotoRecipe(" + id + ")'> <p>" + title + "</p> </div>";
				li += "<button onclick='unfavorite(" + id + ")' class='unfavorite'>unfavorite</button></li>"
	    	$('#fav_list').append(li);
			}
		}
	});

	getPreferences();
	const compliments =["You look great day!", "Hope you are enjoying your day!", "What a great time to make a meal!", "Cooking is an art.", "When cooking, go by your own taste.", "Isn't food just the best!", "Eating with friends is time well spent", "If there's a whisk, there's a way.", "People who love to eat are always the best people.", "Nothing brings people together like good food.", "Worries go down better with soup.", "Good food is good mood.", "Good food is wise medicine.", "Life is a combination of passion + pasta", "Breakfast is the most important meal of the day!", "Life is uncertain; eat dessert first!" ];

	var comp = compliments[Math.floor(Math.random()*compliments.length)];

$(date).text(comp);

});

function getPreferences() {
	$.get('/preferences', function(data) {
		if (data) {
			renderPreferences(data);
		}
	});
}

function renderPreferences(data) {
	var rows = data[0][0];
	var list = $('#chosen-list');
	list.empty();

	if (rows['pesc'] == 1) {
		var li = '<li>Pescetarian</li>';
		list.append(li);
	}

	if (rows['lactoveg'] == 1) {
		var li = '<li>Lacto Vegetarain</li>';
		list.append(li);
	}

	if (rows['ovoveg'] == 1) {
		var li = '<li>Ovo Vegetarian</li>';
		list.append(li);
	}

	if (rows['vegetarian'] == 1) {
		var li = '<li>Vegetarian</li>';
		list.append(li);
	}

	if (rows['vegan'] == 1) {
		var li = '<li>Vegan</li>';
		list.append(li);
	}

	if (rows['paleo'] == 1) {
		var li = '<li>Paleo</li>';
		list.append(li);
	}

	if (rows['primal'] == 1) {
		var li = '<li>Primal</li>';
		list.append(li);
	}

	document.getElementById('intolerances-field').value = rows['intolerances'];
	$('#established-intolerances').html('Intolerances: ' + rows['intolerances']);

}

function gotoRecipe(recipe) {
	window.location.assign('/recipe/' + recipe);

}

function unfavorite(recipe) {
	var toUnfavorite = document.getElementById(recipe);
	toUnfavorite.style.display = "none";
	$.post('/unfav', {recipe: recipe});
}

function toggleEdit() {
	var edit = document.getElementById('edit-preferences');
	var chosen = document.getElementById('chosen-preferences');

	if (edit.style.display === 'none') {
		edit.style.display = 'block';
		chosen.style.display = 'none';

	} else {
		edit.style.display = 'none';
		chosen.style.display = 'block';

	}
}

function submitIntolerances() {
	var meta = document.querySelector('meta[name=user]');
	var id = meta.content;

	var intol = document.getElementById('intolerances-field').value;

	$.post('/add-intolerances', {user_id: id, intol: intol}, function() {
		getPreferences();
	});
}

function submitDiet(diet) {
	var meta = document.querySelector('meta[name=user]');
	var id = meta.content;
	console.log(id);

	$.post('/add-diet', {user_id: id, diet: diet}, function() {
		getPreferences();
	});
}

function removeDiet(diet) {
	var meta = document.querySelector('meta[name=user]');
	var id = meta.content;

	$.post('/remove-diet', {user_id: id, diet: diet}, function() {
		getPreferences();
	});
}


$(window).resize(function() {

	if($(window).width() <= 100){
		alert("Please enlargen your browser!");
	}
});


// $(document).ready(function() {
// 	document.getElementById("Login-Main").display = "block";

// });
