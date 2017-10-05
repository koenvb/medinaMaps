//Some globals...

var map ;
var panorama = null;
var table = $('<table id="tbl_results" border="1"></table>').addClass('table tablesorter table-striped table-bordered table-hover table-condensed');

table.append('<thead><<th>Nr</th><th>Naam</th><th>Adres</th><th>Status</th><th>Tijd</th><th>Afstand</th></thead>')

//routing variables
var directionDisplay = null;
var startPoint = false;
var endPoint = false;
var bounds = new google.maps.LatLngBounds();
var address_count = 0;


infowindow = new google.maps.InfoWindow();

var patients = [];
var timeout = 1;



//Global infoWindow so only one is open at a time on a click event.
//http://stackoverflow.com/questions/12621274/close-infowindow-when-another-marker-is-clicked


//events
google.maps.event.addDomListener(window, 'load', initialize);


$(window).resize(function () {
    var w = $(window).width(),
        offsetRight = 100
    var h = $(window).height(),
        offsetTop = 150; // Calculate the top offset
    $('#map-canvas').css('height', (h - offsetTop));
    //$('#map-canvas').css('width', (w - offsetRight));
}).resize();



//Google maps initializ
function initialize() {

    //initialize map
    var latlng = new google.maps.LatLng(51.210211, 3.385516);
    var mapOptions = {
        zoom: 10 ,
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

    var imageHome = 'img/home_marker.png'
    var homeMarker = new google.maps.Marker({
        position: latlng,
        map:map,
        title: "Home",
        icon: imageHome

    });

    content = ['<div id="infoWindow">'+
    '<ul><li><strong>Thuis</strong></li>'+
    '<li><a href="#" onclick="toggleStreetView();">Show streetview</a></li></ul>'+
    '<button class="button" id="selectStart">Kies als startpunt</button></div>'].join('<br>');

    addInfoWindow(homeMarker,content);

    startPoint = homeMarker;
    bounds.extend(homeMarker.position);

    //direction/routing
    directionsService = new google.maps.DirectionsService();
    directionDisplay = new google.maps.DirectionsRenderer(
        {
            suppressMarkers: true, //suppress green A-B markers given by directions
            preserveViewport: true // do not change zoom level to fit the route

        }
    );
    directionDisplay.setMap(map);

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
    patients = [];
    var input = $('#txtinput').val();
    patients = filterAdobePDFpaste(input);


    window.console&&console.log(patients);

    // linking addresses with location
    // http://stackoverflow.com/questions/13067403/saving-geocoder-results-to-an-array-closure-trouble
    for (i=0; i<patients.length; i++)  {
        //Save array-data in String to pass to the Geocoder
        currAddress = patients[i]['address'];
        var coordinates;
        doGeocode(currAddress,i);
    }

    $('#inputForm').toggle();

    generateTable(patients);
    displayMap();
    setTableSort()

    $('#print').on('click',function(){
            printData();
    })

    $('#export').on('click',function(){
            exportData();
    })


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
    //pattern = /^(([A-Z'.* ]{2,} ){2,}[A-Z]{1,})(?=.*BSN)/;
    reBSN = /(N - Nuchter)|(NN - Niet nuchter)+/;
    //pattern to select all before the Gender.
    reAllBeforeGender = /(\w.+)( V | M )/gm;
    reGender = /( V | M )$/gm;
    nameRegEx = /^([-A-Z'*.]{2,} ){1,}[-A-Z.]{2,}/gm;
    reBeforeF = /.+?(?= F )/gm
    //for second run to only have ones with a postcode
    rePostcodeOnlyAddress = /.+?\d{4}/;
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
        temp = adres[i];



        if ( reBSN.test(temp)) {

            // names with a * in front of them will give problems so we first remove these so they do not bother us anymore

            //input:* VAN BESIEN KOEN V Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter BSN: 350724.206.52 1
            //output:VAN BESIEN KOEN V Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter BSN: 350724.206.52 1

            //temp = temp.replace(/^[^\w]+/,"");


            //Remove BSN in order to be able to use digits to sort out the postal code
            //temp = temp.replace( /BSN.*/g, "");

            // Example: VAN BESIEN KOEN V Sint-Margrietestraat 4 9981 Sint-Margriete F NN - Niet nuchter

            //Selection of the name, always take first part of the array

            var nameWithGender = temp.match(reAllBeforeGender);


            if (nameWithGender != null){

                var name = nameWithGender[0].replace(reGender,"");
                //remove the name from the string
                var gender = nameWithGender[0].match(reGender);
                temp = temp.replace(reAllBeforeGender, "");
            }

            else{
                 name = "unknown";
                 gender = "unknown";
            }
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

            //console.log("before address", temp);
            //Eindeken 20 9970 Kaprijke F NN - Niet nuchter
            // select everything before the " F " string as address.
            var address = temp.match(reBeforeF);

            //assemble into patient object.
            var patient={name: name + "", address: address + "", gender: gender +"", status:status + "", location:[] , marker:[]};
            result.push(patient);


        }
    }


    return result;
}




function generateTable(resultText){

    $("#tbl_results tbody tr").remove();

    for(var i=0; i < resultText.length; i++){
        var row = $('<tr>');
        var col0 = $('<td></td>').text((i+1) + "");
        var col1 = $('<td></td>').text(resultText[i]['name']);
        var col2 = $('<td></td>').text(resultText[i]['address']);
        var col3 = $('<td></td>').text(resultText[i]['status']);
        var col4 = $('<td></td>').text(' ');
        var col5 = $('<td></td>').text(' ');

        row.attr('id',""+ i);
        if(resultText[i]['status'] == 'Nuchter'){
            row.addClass('danger');
        }
        else if(resultText[i]['status'] == 'Dagcurve'){
            row.addClass('info');
        }

        row.append(col0,col1,col2,col3,col4,col5);
        row.append($('</tr>'))

        table.append(row);

    }
    $('#tableOverview').append(table);
    $('#tbl_results > tbody > tr').click(function(){
        var tableMarker = patients[this.id]['marker'][0];
        var i = this.id;

        content = [
            '<div id="infoWindow">'+
            '<ul><li><strong>'+patients[i]["name"]+'</strong></li>'+
            '<li>Adres: '+patients[i]["address"]+ '</li>'+
            '<li>Status: '+patients[i]["status"]+ '</li>'+
            '<li><a href="#" onclick="toggleStreetView();">Show streetview</a></li></ul>'+
            '<button class="button" id="selectStart">Kies als startpunt</button></div>'
        ].join('<br>');

        panorama.setPosition(tableMarker.position);
        infowindow.setContent(content);
        infowindow.open(map,tableMarker);
    });

}

$('#tableOverview tr td').text

var postcodeOnlyChecked = 0;
function doGeocode(currAddress,i) {

    var geocoder = new google.maps.Geocoder();
    var location= [];



    geocoder.geocode( { 'address': currAddress }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

            console.log(results[0].formatted_address);
            var latLong = results[0].geometry.location;
            // coordinates = latLong.lat() + "," + latLong.lng();

            map.setCenter(results[0].geometry.location);
            patients[i]['location'] = [latLong.lat(),latLong.lng()];
            patients[i]['address'] = results[0].formatted_address;

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

            content = [
                '<div id="infoWindow">'+
                '<ul><li><strong>'+patients[i]["name"]+'</strong></li>'+
                '<li>Adres: '+patients[i]["address"]+ '</li>'+
                '<li>Status: '+patients[i]["status"]+ '</li>'+
                '<li><a href="#" onclick="toggleStreetView();">Show streetview</a></li></ul>'+
                '<button class="button" id="selectStart">Kies als startpunt</button></div>'
            ].join('<br>');

            addInfoWindow(marker,content);
            //create marker per patient for later reference.
            patients[i]['marker'].push(marker);
            bounds.extend(marker.position);
            address_count++

            if(address_count == patients.length){
                afterGeocodingStuff();
            }

        }
        else
        {
            if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT)
            {
                //when hitting geocoding limit
                //http://stackoverflow.com/questions/7649155/avoid-geocode-limit-on-custom-google-map-with-multiple-markers
                setTimeout(function() { doGeocode(currAddress,i); }, (timeout));
            }



            else if (status == google.maps.GeocoderStatus.ZERO_RESULTS)
            {
                if(postcodeOnlyChecked < 1){
                    console.log('Address not found, trying postcode only lookup ' + currAddress);
                    postcodeOnlyChecked = postcodeOnlyChecked + 1;
                    postcodeOnlyAddress = currAddress.match(rePostcodeOnlyAddress)[0];
                    doGeocode(postcodeOnlyAddress,i);

                }
                else{
                    alert('Address was not found: ' + patients[i]['name'] + ' ' + currAddress );
                    console.log('Adress was not found: ' + patients[i]['name'] + ' ' + currAddress );
                }

            }
        }


    });

}

function recalcRoute(){
    if(startPoint != false && endPoint != false){
        var request = {
            origin: startPoint.getPosition(),
            destination: endPoint.getPosition(),
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };
        directionsService.route(request, function(response, status){
            if(status == google.maps.DirectionsStatus.OK){
                $('#route-details').parent().fadeIn();
                directionDisplay.setDirections(response);
                var summaryPanel = document.getElementById('route-details');
                summaryPanel.innerHTML = 'Van: ';
                summaryPanel.innerHTML += startPoint.title + '<br>';
                summaryPanel.innerHTML += 'Naar: ' + endPoint.title + '<br>';
                summaryPanel.innerHTML += 'Afstand: '+ response.routes[0].legs[0].distance.text + '<br>';
                summaryPanel.innerHTML += 'Tijd: ' +response.routes[0].legs[0].duration.text + '<br><br>';
                directionDisplay.setMap(map);
            }
        });
    }else{
        directionDisplay.setMap(null);
    }
}

function addInfoWindow(marker, content) {
    google.maps.event.addListener(marker, 'click', function () {
        endPoint = marker;
        recalcRoute();
        panorama.setPosition(marker.getPosition());
        infowindow.setContent(content);
        infowindow.open(map, marker);
    });
}

google.maps.event.addListener(infowindow, 'domready', function() {
    $('#infoWindow button').on('click',function(){
        console.log(infowindow.anchor.position);
        if($(this).attr('id') == 'selectStart'){
            startPoint = infowindow.anchor;
            endPoint = false;
        }
        recalcRoute();
    });
});

function afterGeocodingStuff(){

    map.fitBounds(bounds);

}


function printData()
{
   var divToPrint=document.getElementById("tbl_results");
   var htmlToPrint = '' +
        '<style type="text/css">' +
        'table {border-collapse:collapse;};' +
        'table th, table td {' +
        'border: 1px solid black;' +
        'padding:0.5em;' +
        '}' +
        '</style>';
   htmlToPrint += divToPrint.outerHTML;
   newWin= window.open("");
   newWin.document.write(htmlToPrint);
   console.log(htmlToPrint);
   newWin.print();
   newWin.close();
}


function s2ab(s) {
    if(typeof ArrayBuffer !== 'undefined') {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    } else {
        var buf = new Array(s.length);
        for (var i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
}

function export_table_to_excel(id, type, fn) {
    var wb = XLSX.utils.table_to_book(document.getElementById(id), {sheet:"Sheet JS"});
    var wbout = XLSX.write(wb, {bookType:type, bookSST:true, type: 'binary'});
    var fname = fn || 'test.' + type;
    try {
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fname);
    } catch(e) { if(typeof console != 'undefined') console.log(e, wbout); }
    return wbout;
}

function exportData(type, fn) { return export_table_to_excel('tbl_results', type || 'xlsx', fn); }


function setTableSort(){

    $("#tbl_results")
    .tablesorter({
      theme : 'blue',

      widgets: ['editable'],
      widgetOptions: {
        editable_columns       : [0,4,5],       // or "0-2" (v2.14.2); point to the columns to make editable (zero-based index)
        editable_enterToAccept : true,          // press enter to accept content, or click outside if false
        editable_autoAccept    : true,          // accepts any changes made to the table cell automatically (v2.17.6)
        editable_autoResort    : false,         // auto resort after the content has changed.
        editable_validate      : null,          // return a valid string: function(text, original, columnIndex){ return text; }
        editable_focused       : function(txt, columnIndex, $element) {
          // $element is the div, not the td
          // to get the td, use $element.closest('td')
          $element.addClass('focused');
        },
        editable_blur          : function(txt, columnIndex, $element) {
          // $element is the div, not the td
          // to get the td, use $element.closest('td')
          $element.removeClass('focused');
        },
        editable_selectAll     : function(txt, columnIndex, $element){
          // note $element is the div inside of the table cell, so use $element.closest('td') to get the cell
          // only select everthing within the element when the content starts with the letter "B"
          return /^b/i.test(txt) && columnIndex === 0;
        },
        editable_wrapContent   : '<div>',       // wrap all editable cell content... makes this widget work in IE, and with autocomplete
        editable_trimContent   : true,          // trim content ( removes outer tabs & carriage returns )
        editable_noEdit        : 'no-edit',     // class name of cell that is not editable
        editable_editComplete  : 'editComplete' // event fired after the table content has been edited
      }
    })
    // config event variable new in v2.17.6
    .children('tbody').on('editComplete', 'td', function(event, config){
      var $this = $(this),
        newContent = $this.text(),
        cellIndex = this.cellIndex, // there shouldn't be any colspans in the tbody
        rowIndex = $this.closest('tr').attr('id'); // data-row-index stored in row id

      // Do whatever you want here to indicate
      // that the content was updated
      $this.addClass( 'editable_updated' ); // green background + white text
      setTimeout(function(){
        $this.removeClass( 'editable_updated' );
      }, 500);

      /*
      $.post("mysite.php", {
        "row"     : rowIndex,
        "cell"    : cellIndex,
        "content" : newContent
      });
      */
    });



}










