var socket = io.connect();

$(document).ready(function() {

	//add season recipes
	socket.emit('seasonal', function(recipes){
      // display a newly-arrived message
			$("#main-dishes-list").empty();
			for(var i=0; i<recipes.length; i++){
				var title = recipes[i].title;
				//console.log(title);
				var image = recipes[i].image;
				var time = recipes[i].minutes;
				var id = recipes[i].id;
				var imageURL = "https://spoonacular.com/recipeImages/"+id+"-240x150.jpg";
				var li = "<li id='" + id + "' class='resultItem' onclick='gotoRecipe(" + id + ")'> <div id='resultImage'> <img src="+imageURL+" width=240px height=150px> </div> <div class='resultTitle'> <p>" + title + "</p> </div>";
				li += "<div class='prepTime'><p>" + time + " minutes</p></div></li>"
	    	$('#main-dishes-list').append(li);
      }
  });

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

	var form = document.getElementById('form');
	if(form){
		//console.log("hello");
		form.addEventListener('submit', submitHandler, false);
	}
});


function submitHandler(e) {
  e.preventDefault();
  //get the value of the search
  var query = $('#search_box').val();

  $.post("/search/" + query,function(response){
    window.location.assign('/search/'+ query);
  });

	$('#search_box').val('');

}

function gotoRecipe(recipe) {
	window.location.assign('/recipe/' + recipe);
}

function image1(){
	window.location.assign('/recipe/137649');
}
function image2(){
	window.location.assign('/recipe/837848');
}
function image3(){
	window.location.assign('/recipe/714551');
}
