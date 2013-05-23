//Some globals...

var map;
var panorama;
var patients = [];

var timeout = 600;



//Global infoWindow so only one is open at a time on a click event.
//http://stackoverflow.com/questions/12621274/close-infowindow-when-another-marker-is-clicked

infowindow = new google.maps.InfoWindow();

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

  var latlng = new google.maps.LatLng(51.210211, 3.385516);
  var mapOptions = {
    zoom: 8,
    center: latlng,
    scrollwheel: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  panorama = map.getStreetView();
  panorama.setPosition(latlng);
  panorama.setPov(/** @type {google.maps.StreetViewPov} */({
    heading: 265,
    pitch: 0
  }));

  var imageHome = '/p/img/home_marker.png'
  var homeMarker = new google.maps.Marker({
  	position: latlng,
  	map:map,
  	title: "Home",
  	icon: imageHome

  });

 }


function toggleStreetView() {
  var toggle = panorama.getVisible();
  if (toggle == false) {
    panorama.setVisible(true);
  } else {
    panorama.setVisible(false);
  }
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
  
  
  window.console&&console.log(patients);
  
  displayMap();

  // linking addresses with location
  // http://stackoverflow.com/questions/13067403/saving-geocoder-results-to-an-array-closure-trouble
  for (i=0; i<patients.length; i++)  {
  //Save array-data in String to pass to the Geocoder
  	currAddress = patients[i]['address'];
  	var coordinates;
    doGeocode(currAddress,i);
   }


  generateTable(patients);

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
					var patient={name: name + "", address: address + "", gender: gender +"", status:status + "", location:[] , marker:[]};		
  		       		result.push(patient);
  		   			}
  			}
		
		
  			return result;
}
 


 
 function generateTable(resultText){
 
  var table = $('<table></table>').addClass('table table-striped table-bordered table-hover table-condensed');
  table.append('<thead><tr><th>Nr</th><th>Naam</th><th>Adres</th><th>Status</th><tr><thead>')
 
 	for(var i=0; i < resultText.length; i++){
     	var row = $('<tr></tr>');
     		var col0 = $('<td></td>').text((i+1) + "");
 			var col1 = $('<td></td>').text(resultText[i]['name']);
 	    	var col2 = $('<td></td>').text(resultText[i]['address']);
 	    	var col3 = $('<td></td>').text(resultText[i]['status']);

 	    row.attr('id',""+ i);
 	    if(resultText[i]['status'] == 'Nuchter'){
 	    	row.addClass('error');
 	    }
 	    else if(resultText[i]['status'] == 'Dagcurve'){
 	    	row.addClass('info');
 	    }

 	    row.append(col0,col1,col2,col3);

     	table.append(row);
 
 	}
   $('#tableOverview').append(table);
   $('#tableOverview tr').click(function(){
   		var tableMarker = patients[this.id]['marker'][0];
   		panorama.setPosition(tableMarker.position);
   		infowindow.setContent("<ul><li>Patient: "+patients[this.id]['name']+"</li><li>Adres: "+patients[this.id]['address']+ "</li><li>Status: "+patients[this.id]['status']+ '</li><li><a href="#" onclick="toggleStreetView()"+)>Show streetview</a></li></ul>');
   		infowindow.open(map,tableMarker);
		map.panTo(tableMarker.position);
   	});
 }

$('#tableOverview tr td').text


function doGeocode(currAddress,i) {
	
	var geocoder = new google.maps.Geocoder();
 	var location= [];
 	
	    geocoder.geocode( { 'address': currAddress }, function (results, status) {
	    if (status == google.maps.GeocoderStatus.OK) {	      	
	      
	      var latLong = results[0].geometry.location;
       	 // coordinates = latLong.lat() + "," + latLong.lng();

       	  map.setCenter(results[0].geometry.location);
       	  patients[i]['location'] = [latLong.lat(),latLong.lng()];

       	  //create infowindow
       	  //infowindow = new google.maps.InfoWindow();

       	  var myLatLng = new google.maps.LatLng(patients[i]['location'][0],patients[i]['location'][1]);

       	  //create related marker object
       	  var marker = new google.maps.Marker({
       	  	position: myLatLng,
       	  	map: map,
       	  	title: ""+ patients[i]['name']
       	  });

       	  //setting marker color 
       	  //TODO: Change to nice icon.
       	  if (patients[i]['status'] == "Niet nuchter") {
			//http://stackoverflow.com/questions/11064081/javascript-change-google-map-marker-color
		  	marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
	  	  }
	  	  
	  	  else if (patients[i]['status'] == "Nuchter"){

	  	 	marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');

	  	  }
	  
	  	  else if (patients[i]['status'] == "Dagcurve") {
	  	
	  		marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
	  	  }


       	  //add eventlistener
       	  google.maps.event.addListener(marker, 'click', function() {
    		 panorama.setPosition(myLatLng);
    		 infowindow.setContent("<ul><li>Patient: "+patients[i]['name']+"</li><li>Adres: "+patients[i]['address']+ "</li><li>Status: "+patients[i]['status']+ '</li><li><a href="#" onclick="toggleStreetView()"+)>Show streetview</a></li></ul>')
    		 infowindow.open(map,marker);
    		 //map.panTo(marker.position);
  		  });

       	  //create marker per patient for later reference.
       	  patients[i]['marker'].push(marker);


		}
		else
        {
            if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT)
            {
            	//when hitting geocoding limit 
            	//http://stackoverflow.com/questions/7649155/avoid-geocode-limit-on-custom-google-map-with-multiple-markers
                setTimeout(function() { doGeocode(currAddress,i); }, (timeout));
            }
            else {
	          alert('Geocode was not successful for the following reason: ' + status);
	     	} 
        }

	    	   	
	   });
	   
}





