
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function showTemplate(template, data){
	var html = template(data);
	$('#content').html(html);
}

function initDropdownMenu() {
  var template = Handlebars.compile($("#classes-dropdown-template").html()),
      html = template({ classes: animals.class});
  $('#classesDropdown').html(html);
}

function showAllAnimals(template) {
  var animalsTemplate = allAnimals = [];
  for (var i = 0 ; i < animals.class.length ; ++i) {
    allAnimals = allAnimals.concat(animals.class[i].animals.map(
      function(animal) {
        animal.class = i;
        return animal;
      })
    );
  }
  showTemplate(template, { animals: allAnimals});
}

function showClass(template, classIdx) {
  var classAnimals = animals.class[classIdx].animals.map(function(animal) {
    animal.class = classIdx;
    return animal;
  });
  showTemplate(template, { animals: classAnimals});
}

function showAnimal(template, classIdx, animalIdx) {
  showTemplate(template, animals.class[classIdx].animals[animalIdx]);
}

$(document).ready(function(){

  var animalsTemplate = Handlebars.compile($("#animals-template").html()),
      animalTemplate = Handlebars.compile($("#animal-template").html());

  initDropdownMenu();

  var classIdx = getParameterByName('classIdx'),
      animalIdx = getParameterByName('animalIdx');

  if (animalIdx) {
    showAnimal(animalTemplate, classIdx, animalIdx);
  } else if (classIdx) {
    showClass(animalsTemplate, classIdx);
  } else {
    showAllAnimals(animalsTemplate);
  }
});