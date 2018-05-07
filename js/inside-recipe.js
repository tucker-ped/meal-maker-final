
function addInfo(info) {
  var ingredients = info[0];
  var instructions = info[1];

  for (var i = 0; i < ingredients.length; i++) {
    var li = $('<li class="ingredient">' + ingredients[i].original + '</li>');
    $('#ingredient-list').append(li);
  }

  for (var j = 0; j < instructions[0].steps.length; j++) {
    var li  = $('<li class="step"></li>');
    li.html('<div class="step-header">Step ' + instructions[0].steps[j].number + '</div><div class"step-content">' + instructions[0].steps[j].step + '</div>');
    $('#prep-list').append(li);
  }
}

$(document).ready(function() {
  var id = document.querySelector('meta[name=id]');
  $.get('/recipe-info/' + id.content, function(data, status) {
    console.log(status);
    addInfo(data);
  });
});
