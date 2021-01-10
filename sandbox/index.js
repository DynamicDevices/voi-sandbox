var _map;
var _overlay;

var _niSchoolData;
var _scotlandSchoolData;
var _englandSchoolData;

var _homeLocation;
var _maxDistanceMiles = 20;

var _geographicProj  = new OpenLayers.Projection("EPSG:4326");
var _mapProj  = new OpenLayers.Projection("EPSG:3857");
var _mercatorProj = new OpenLayers.Projection("EPSG:900913");

// Find distance between two points on the map
//
// TODO: I am not convinced that this is giving the right distances...
//
function distanceBetweenPointsMiles(p1Map, p2Map){
  var p1Merc = p1Map.transform(_mapProj, _mercatorProj);
  var p2Merc = p2Map.transform(_mapProj, _mercatorProj);
  return p1Merc.distanceTo(p2Merc) * 0.000621371;
}

// when jQuery has loaded the data, we can create features for each photo
function jsonSuccessHandler(data) {

  this.indexValue.target = data;

  // we need to transform the geometries into the view's projection
//  var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');

  // loop over the items in the response
  data.forEach(function(item) {

    // create a new feature with the item as the properties
    var feature = new OpenLayers.Feature(item);
    // add a url property for later ease of access
//    feature.set('url', item.media.m);
    // create an appropriate geometry and add it to the feature

//    console.debug(item)

    var thisLocation = new OpenLayers.Geometry.Point(parseFloat(item.LON), parseFloat(item.LAT)).transform('EPSG:4326', 'EPSG:3857');

//    console.debug(thisLocation);
    var distanceMiles = distanceBetweenPointsMiles(_homeLocation, thisLocation);

    if(distanceMiles < _maxDistanceMiles) {
      var tiptext = ""
      if( "SCHNAME" in item )
        tiptext = item.SCHNAME;
      else if( "Institution Name" in item )
        tiptext = item["Institution Name"];
      else if( "School Name" in item )
        tiptext = item["School Name"];

      tiptext = tiptext + " " + distanceMiles;

      _overlay.addFeatures([
          new OpenLayers.Feature.Vector(thisLocation, {tooltip: tiptext})
      ]);
    }

  });
}

function updateFeatures() {

    // The overlay layer for our marker, with a simple diamond as symbol
    _overlay = new OpenLayers.Layer.Vector('Overlay', {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: 'img/marker.png',
            graphicWidth: 20, graphicHeight: 24, graphicYOffset: -24,
            title: '${tooltip}'
        })
    });

    // We add the marker with a tooltip text to the overlay
    _overlay.addFeatures([
        new OpenLayers.Feature.Vector(_homeLocation, {tooltip: 'You are here'})
    ]);

    // TODO: Are these resources cached? Hope so...

    // pull json for NI
    $.ajax({
      url: 'resources/Northern_Ireland_Jan2021_latlon.json',
      success: jsonSuccessHandler,
      indexValue: { target:_niSchoolData },
      error: function () {
        alert("Error retrieving NI data");
      },
      complete: function () {
      }
    });

    _map.addLayer(_overlay);

    // pull json for Scotland
    $.ajax({
      url: 'resources/Scotland_Oct2020_open_latlon.json',
      success: jsonSuccessHandler,
      indexValue: { target:_scotlandSchoolData },
      error: function () {
        alert("Error retrieving Scotland data");
      },
      complete: function () {
      }
    });
    // pull json for England
    $.ajax({
      url: 'resources/England_2018_2019_latlon.json',
      success: jsonSuccessHandler,
      indexValue: { target:_englandSchoolData },
      error: function () {
        alert("Error retrieving England data");
      },
      complete: function () {
      }
    });
}

function initMap() {

    // The location of our marker and popup. We usually think in geographic
    // coordinates ('EPSG:4326'), but the map is projected ('EPSG:3857').
    _homeLocation = new OpenLayers.Geometry.Point(-2.986221, 53.413420)
        .transform('EPSG:4326', 'EPSG:3857');

    // Create the map
    _map = new OpenLayers.Map({
        div: "map", projection: "EPSG:3857",
        layers: [new OpenLayers.Layer.OSM()],
        center: _homeLocation.getBounds().getCenterLonLat(), zoom: 6
    });

    updateFeatures();
}

// Do setup on ready...
$(document).ready(function(){

  // Setup distance combo
  var data = { '1': '1m', '5': '5m', '10': '10m', '25': '25m'};
  var s = $('<select id="combo" />');
        //iterate through each key/value in 'data' and create an option tag out of it
        for(var val in data) {
            $('<option />', {value: val, text: data[val]}).appendTo(s);
        }
  s.appendTo('#addCombo')
  $(document).on('change',"#combo", function(){

    // Set new max distance
    _maxDistanceMiles = parseInt(this.value);
    // Clear current features
    _map.removeLayer(_overlay);
    // Update them...
    updateFeatures();
  });

  initMap();

});

