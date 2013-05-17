//Some globals...

var map;
var patients = [];

//events

google.maps.event.addDomListener(window, 'load', initialize);

$(window).resize(function () {
    window.console&&console.log('resize');
    var w = $(window).width(),
    	offsetRight = 60
    var h = $(window).height(),
        offsetTop = 100; // Calculate the top offset
    window.console&&console.log(h);
    $('#map-canvas').css('height', (h - offsetTop));
    $('map-canvas').css('width', (w - offsetRight));
}).resize();



//Google maps initializ
function initialize() {

  var latlng = new google.maps.LatLng(51.2418916, 3.5412300000000414);
  var mapOptions = {
    zoom: 8,
    center: latlng,
    scrollwheel: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
 }


//table was constantly dissappearing so had to add the preventDefault 
//http://stackoverflow.com/questions/2112708/jquery-insert-new-dom-element-disappears

//show - hide input textbox editor
$('#editor-btn').click(function()
{
    window.console&&console.log('btnclicked');
    $('#inputForm').toggle();

});

//submit pasted text
$('#submit').click(function(e) {
  e.preventDefault();
    
  var input = $('#txtinput').val();
  patients = filterAdobePDFpaste(input);
  
  generateTable(patients);
  
  window.console&&console.log(patients);
  
  displayMap();

  // linking addresses with location
  // http://stackoverflow.com/questions/13067403/saving-geocoder-results-to-an-array-closure-trouble
  for (i=0; i<patients.length; i++)  {
  	//Save array-data in String to pass to the Geocoder
  	currAddress = patients[i]['address'];
  	var coordinates;
  	doGeocode(currAddress, i); 
  }

  window.console&&console.log(patients);


  $('#inputForm').toggle();
  

 });
 
 
//============== FUNCTIONS ==========================



function displayMap() {
  $('#map-canvas').removeClass('hidden')  
  google.maps.event.trigger(map, 'resize');
}


//parse the pasted text coming from a pdf file.
function filterAdobePDFpaste(inputText)
{
		var adres = new Array();
		var result= new Array();
		var pattern = new RegExp();
		var postcode = new RegExp();
		var searchNuchter = new RegExp();
		var searchNietNuchter = new RegExp();
		var searchDagCurve = new RegExp();

		
		//Regular expressions
		
		//Filter all lines which start with at least two UPPERCASE words following a space
		pattern = /^([A-Z'.* ]{2,} ){2,}[A-Z]{1,}/;
		//for second run to only have ones with a postcode
		postcode = /\d{4}/;
		searchNuchter= /(N - Nuchter)+/;
		searchNietNuchter= /(NN - Niet nuchter)+/;
		searchDagCurve= /(DC - Dagcurve)+/;
						
		adres = inputText.split('\n');
			
			//nuchter -- niet nuchter routine

			
			for (var i = 0; i < adres.length; i++) {
				
				// Als er in 1 lijn, EN een postcode te vinden is EN which starts with at least 
				// two UPPERCASE words following a space
				//Example string: 
				//VAN BESIEN KOEN V Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter BSN: 350724.206.52 1
				temp = adres[i]
				
				if (  pattern.test(temp) && postcode.test(temp)) {
					
					//Remove BSN in order to be able to use digits to sort out the postal code
					temp = temp.replace( /BSN.*/g, "");
					
					// Example: VAN BESIEN KOEN V Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter

					//Selection of the name, always take first part of the array
					var name = temp.match(/^([A-Z'*.]{2,} ){1,}[A-Z]{2,}/)[0];
					
					
					//remove the name from the string
					temp = temp.replace(/^([A-Z'*.]{2,} ){1,}[A-Z]{2,}/, "");
					
					//filter out gender
					//Using jquery trim for whitespace trimming
					var gender = $.trim(temp.match(/^( [A-Z'*.]{1} )/)[0]);
					
					//remove gender
					temp = temp.replace(/^( [A-Z'*.]{1} )/, "");
					
					//String leftover: Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter
					//looking for status
					
					var status = "unknown";
					if ( searchNietNuchter.test(temp) ) {
						status = "Niet nuchter";
					}
					else if ( searchNuchter.test(temp) ) {
						status = "Nuchter";
						
					}
					else if (searchDagCurve.test(temp) ) {
						status = "Dagcurve";
						
					}
					else {
						status = "unknown";
					}
																		   
					//Selection of the address /^.*[0-9]{4}.[\w-]{2,40}/
					var address = $.trim(temp.match(/^.*[0-9]{4}.[\w-]{2,40}/gm));
					
					//assemble into patient object.										
					var patient={name: name + "", address: address + "", gender: gender +"", status:status + "", location:""};		
  		       		result.push(patient);
  		   			}
  			}
		
		
  			return result;
}
 
 
 function generateTable(resultText){
 
  var table = $('<table></table>').addClass('table table-striped table-bordered table-hover table-condensed');
  table.append('<thead><tr><th>Naam</th><th>Adres</th><th>Status</th><tr><thead>')
 
 	for(var i=0; i < resultText.length; i++){
     	var row = $('<tr></tr>');
 			var col1 = $('<td></td>').text(resultText[i]['name'])
 	    	var col2 = $('<td></td>').text(resultText[i]['address'])
 	    	var col3 = $('<td></td>').text(resultText[i]['status'])
 	    row.append(col1,col2,col3)
     	table.append(row);
 
 	}
   $('#tableOverview').append(table);
 }

function doGeocode(currAddress,i) {
	
	var geocoder = new google.maps.Geocoder();
 	var location= [];
 	
	//for(var i = 0; i < patients.length;i++){
	  //currAddress = patients[i]['address'];
	  geocoder.geocode( { 'address': currAddress }, function (results, status) {
	    if (status == google.maps.GeocoderStatus.OK) {	      	
	      
	      var latLong = results[0].geometry.location;
       	  coordinates = latLong.lat() + "," + latLong.lng();

       	  patients[i]['location'] = coordinates;
	      //location.push(results[0].geometry.location);
	      
	     // window.console&&console.log(results);

	      //if (location.length == patients.length){
	      //		storeResult(location,patients);
	      //}
		}
	    else {
	         alert('Geocode was not successful for the following reason: ' + status);
	    } 
	    	   	
	   });
	   
	//}//for
}



function storeResult(location,patients){	

	  window.console&&console.log(location);
	  window.console&&console.log(patients);



}



function doGeocodeOld(inputAddress) {
 
for(var i = 0; i < inputAddress.length-1;i++){

  geocoder.geocode( { 'address': inputAddress[i]['address']}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
     
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });

      if (inputAddress[i]['status'] == "Niet nuchter") {
 			
			//http://stackoverflow.com/questions/11064081/javascript-change-google-map-marker-color
		  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
	  }
	  else if (inputAddress[i]['status'] == "Nuchter"){

	  	 marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');

	  }
	  else if (inputAddress[i]['status'] == "Dagcurve") {
	  	
	  	marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
	  }
	  
	  var label = inputAddress[i]['name'] +"" + "\n" + 
	  			   inputAddress[i]['address'] +"" +"\n" +
	  			   	inputAddress[i]['status'] +"";
	  
	  google.maps.event.addListener(marker, 'click', function() {
	  	infowindow = new google.maps.InfoWindow({content: label });
	  	infowindow.open(map,marker);
	  });

    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}
}





