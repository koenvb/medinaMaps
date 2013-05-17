//Some globals...



/*

http://stackoverflow.com/questions/5292060/google-maps-v3-geocoding-and-markers-in-loop
http://stackoverflow.com/questions/11467070/how-to-set-a-popup-on-markers-with-google-maps-api
http://jsfiddle.net/yV6xv/163/

[" Breydelhofstraat 108 8900 Brielen", 
" Kestelstraat 11 9880 Aalter", 
" Dorpsstraat 40 201 9980 Sint-Laureins", 
" Dorpsstraat 92 9980 Sint-Laureins", 
" Moershoofdeweg 12 9980 Sint-Laureins", 
" Rommelsweg 12 9980 Sint-Laureins", 
" Vlamingstraat 11 A 9980 Sint-Laureins", 
" Sint-Margrietestraat 104 9981 Sint-Margriete", 
" Kerselaarstraat 29 9982 Sint-Jan-in-Eremo"]


["(50.8670699, 2.846530600000051)", 
"(51.0825279, 3.4525158999999803)", 
"(51.2428959, 3.520958000000064)", 
"(51.2418916, 3.524733400000059)", 
"(51.240989, 3.5122882000000573)", 
"(51.2394006, 3.520488699999987)", 
"(51.2422419, 3.5288984000000028)", 
"(51.2844784, 3.5412300000000414)"]

*/


var countNuchter = 0
var countNietNuchter = 0
var dagCurve = 0

var geocoder;
var map;

var addressesList = new Array()

$("#map-canvas").width('100%').height('100%').gmap3();


$(window).resize(function () {
    window.console&&console.log('resize');
    var h = $(window).height(),
        offsetTop = 60; // Calculate the top offset
    window.console&&console.log(h);
    $('#map_canvas').css('height', (h - offsetTop));
}).resize();


//Google maps initializ
function initialize() {
  geocoder = new google.maps.Geocoder();

  var latlng = new google.maps.LatLng(-34.397, 150.644);
  var mapOptions = {
    zoom: 8,
    center: latlng,
    scrollwheel: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);



//table was constantly dissappearing so had to add the preventDefault 
//http://stackoverflow.com/questions/2112708/jquery-insert-new-dom-element-disappears

$('#editor-btn').click(function()
{
    window.console&&console.log('btnclicked');
    $('#inputForm').toggle();

});


$('#submit').click(function(e) {
  e.preventDefault();
  window.console&&console.log('btnclicked');
  
  var input = $('#txtinput').val();
//  window.console&&console.log(input);
  var result = filterText(input);

  generateTable(result);
  window.console&&console.log('startgeo');
  geocodeAddress(result);
  $('#inputForm').toggle();


 });

function geocodeAddress(inputAddress){
    
    window.console&&console.log('insidegeo');			
	var temp = new Array();
	var output= new Array();
	var printstr = "";
	var replaceStr= "";
	var interval = 0;
	var i = 0;		
			
	for(var j = 0; j<inputAddress.length ; j++){
 	   printstr += inputAddress[j]["adres"] + "\n";  			   
	}

    //remove the name and gender and other rubbish to get only the adress string left over
    replaceStr = printstr.replace( /^([A-Z'*.]{2,} ){2,}[A-Z]{1,}/gm , "" );			   
    
    //Remove BSN in order to be able to use digits to sort out the postal code		   
	replaceStr = replaceStr.replace( /BSN.*/gm, "");
				   
	//Selection of the address /^.*[0-9]{4}.[\w-]{2,40}/
	temp = replaceStr.match(/^.*[0-9]{4}.[\w-]{2,40}/gm);
	window.console&&console.log(temp);

    for(var i = 0; i < temp.length-1;i++){
        doGeocode(temp[i].toString(), inputAddress[i]["adres"] + "\n" + inputAddress[i]["toestand"]);
    }

			 
//	interval = setInterval( function () {
//			 	    	//for(var j:int = 0; j<temp.length-1 ; j++){
//							//var labelString:String
//				doGeocode(temp[i].toString(), inputAddress[i]["adres"] + "\n" + inputAddress[i]["toestand"]);
//				//doGeocode(temp[i].toString());
//
//			 	    		//trace("interval" + i);
//			 	i++;
//			 	if (i >= temp.length-1){
//			 		clearInterval(interval);
//			 	}
//
//			 	},500);
}

//only geocoding, no mapping or markers done.
//TODO => Geocode and save adress and lat/long in a db
function doGeocodeAddress(address,label){

   //window.console&&console.log(label);
   geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      
      addressesList.push(results[0].geometry.location.toString());
      window.console&&console.log(addressesList);
 
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
} 


function doGeocode(address , label) {
   
  var searchNietNuchter = new RegExp() ;
  searchNietNuchter = /(Niet Nuchter)+/;	


  window.console&&console.log(label);
 
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });

      if (searchNietNuchter.test(label)) {
 			
 			// See this trehad for more info about the icons     	
			//http://stackoverflow.com/questions/11064081/javascript-change-google-map-marker-color
		  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
	  }
	  else{

	  	 marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')

	  }

	  google.maps.event.addListener(marker, 'click', function() {
	  	infowindow = new google.maps.InfoWindow({content: label });
	  	infowindow.open(map,marker);
	  });

    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

/*function doGeocode(address, label) {
		var searchNietNuchter = new RegExp() ;
		searchNietNuchter = /(Niet Nuchter)+/;		
        
		//start callback - closure via eventlistener
        geocoder.addEventListener(GeocodingEvent.GEOCODING_SUCCESS, 
        	//closure function

		      function(event:GeocodingEvent):void {
					
		          var placemarks:Array = event.response.placemarks;
				  var mapLabel:String = label; 


				  
				  if (placemarks.length > 0) {
		            
					var marker:Marker = new Marker(placemarks[0].point);
					if (searchNietNuchter.test(mapLabel)){
						marker.setOptions(optionsNietNuchter);
					}
					else{
						marker.setOptions(optionsNuchter)
					}
					
					//map.setCenter(placemarks[0].point);
		            marker.addEventListener(MapMouseEvent.CLICK, 
						function (event:MapMouseEvent):void 
							{
		            		marker.openInfoWindow(new InfoWindowOptions({contentHTML: mapLabel}));
		            		}
					);
		            
					map.addOverlay(marker);

		          }
		        });
        geocoder.addEventListener(
          GeocodingEvent.GEOCODING_FAILURE,
          function(event:GeocodingEvent):void {
            trace("Geocode failed!");
          });
        geocoder.geocode(address);
      }
*/


function filterText(inputText)
{
		var adres = new Array();
		var result= new Array();
		var pattern = new RegExp();
		var postcode = new RegExp();
		var searchNuchter = new RegExp();
		var searchNietNuchter = new RegExp();
		var searchDagCurve = new RegExp();


		//Filter all lines which start with at least two UPPERCASE words following a space
		pattern = /^([A-Z'.* ]{2,} ){2,}[A-Z]{1,}/;
		//for second run to only have ones with a postcode
		postcode = /\d{4}/;
		searchNuchter= /(N - Nuchter)+/;
		searchNietNuchter= /(NN - Niet nuchter)+/;
		searchDagCurve= /(DC - Dagcurve)+/;

		var temp="";

						
		adres = inputText.split('\n');
			
			for (var i = 0; i < adres.length; i++) {
				temp = adres[i].toString();
				
				//count aantal nuchter, eerste countNuchter namen zijn nuchtere mensen
				// Tel aantal mensen om zeker te zijn!
					
				if ( searchNuchter.test(temp)) {
					countNuchter++;
				}
                // count niet nuchter
				if ( searchNietNuchter.test(temp)) {
					countNietNuchter++;
				}
				if ( searchDagCurve.test(temp)){
					dagCurve++;
				}
			}
			
			for (var i = 0; i < adres.length; i++) {
				temp = adres[i].toString()
				//Filter on pattern
				if (  pattern.test(temp) && postcode.test(temp)) {
					
					//Remove BSN in order to be able to use digits to sort out the postal code
					temp = temp.replace( /BSN.*/g, "");
					
					//Selection of the address /^.*[0-9]{4}.[\w-]{2,40}/
					
					//temp = temp.match(/^.*[0-9]{4}.[\w-]{2,40}/);
					
  		       		result.push({adres:''+ temp ,toestand:'' + getToestand()});
  		   			}
  			}
		
		
  			return result;
}


function getToestand(){
	while(countNuchter != 0){
		countNuchter--;
		return "Nuchter"
	}
			
	while(dagCurve != 0){
		dagCurve--;
		return "Dagcurve"
	}
			
	return "Niet Nuchter"								
}



function generateTable(resultText){

 var table = $('<table></table>').addClass('table table-striped table-bordered');
 table.append('<thead><tr><th>Adres</th><th>Toestand</th><tr><thead>')

	for(var i=0; i < resultText.length; i++){
    	var row = $('<tr></tr>');

	    	var col1 = $('<td></td>').text(resultText[i]['adres'])
	    	var col2 = $('<td></td>').text(resultText[i]['toestand'])
	    row.append(col1,col2)
    	table.append(row);

	}
  $('#tableOverview').append(table);
}

