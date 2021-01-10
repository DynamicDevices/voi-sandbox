var _map;
var _overlay;

var _niSchoolData;
var _scotlandSchoolData;
var _englandSchoolData;

var _homeLocation;
var _maxDistanceMiles = 20;

var _geographicProj  = new ol.proj.Projection("EPSG:4326");
var _mapProj  = new ol.proj.Projection("EPSG:3857");
var _mercatorProj = new ol.proj.Projection("EPSG:900913");

// Find distance between two points on the map
//
// TODO: I am not convinced that this is giving the right distances...
//
function distanceBetweenPointsMiles(p1, p2){
  return ol.sphere.getDistance(p1, p2) * 0.000621371;
}

function styleFunction(feature, resolution) {
  return [
    new ol.style.Style({
        fill: new ol.style.Fill({
        color: 'rgba(255,255,255,0.4)'
      }),
      stroke: new ol.style.Stroke({
        color: '#3399CC',
        width: 1.25
      }),
      text: new ol.style.Text({
        font: '14px Calibri,sans-serif',
        fill: new ol.style.Fill({ color: '#000' }),
        stroke: new ol.style.Stroke({
          color: '#fff', width: 2
        }),
        // get the text from the feature - `this` is ol.Feature
        // and show only under certain resolution
        text: (_map.getView().getZoom() > 14) || (feature.get('hover') == true) ? feature.get('name') : ''
      }),
      image: new ol.style.Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: 'img/marker.png'
      })
    })
  ];
}

// when jQuery has loaded the data, we can create features for each photo
function jsonSuccessHandler(data) {

  this.indexValue.target = data;

  // we need to transform the geometries into the view's projection
//  var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');

  // loop over the items in the response
  data.forEach(function(item) {

    // create a new feature with the item as the properties
    var feature = new ol.Feature(item);
    // add a url property for later ease of access
//    feature.set('url', item.media.m);
    // create an appropriate geometry and add it to the feature

//    console.debug(item)

    var distanceMiles = distanceBetweenPointsMiles(_homeLocation, [ item.LON, item.LAT] );

//    console.debug(distanceMiles);

    if(distanceMiles < _maxDistanceMiles) {
      var tiptext = ""
      if( "SCHNAME" in item )
        tiptext = item.SCHNAME;
      else if( "Institution Name" in item )
        tiptext = item["Institution Name"];
      else if( "School Name" in item )
        tiptext = item["School Name"];

//      tiptext = tiptext + " " + distanceMiles;
      tiptext = tiptext;

      var marker = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.transform([item.LON, item.LAT], 'EPSG:4326', 'EPSG:3857')),
        name: tiptext
      });

      marker.setStyle(styleFunction);

      _overlay.getSource().addFeature(marker);
    }

  });
}

function updateFeatures() {

    // We add the marker with a tooltip text to the overlay
    var homeFeature = new ol.Feature(
	ol.proj.transform(_homeLocation, 'EPSG:4326', 'EPSG:3857'),
	{tooltip: 'You are here'}
    );

    // The overlay layer for our marker, with a simple diamond as symbol
    _overlay = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [homeFeature]
      }),
      style: new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: 'img/marker.png'
        })
      })
    })

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

var _highlighted;

var displayFeatureInfo = function (pixel) {
    _overlay.getFeatures(pixel).then(function (features) {
    var feature = features.length ? features[0] : undefined;
    if (features.length) {
      feature.set('hover',true);
      feature.setStyle(styleFunction);
      _highlighted = feature;
    } else {
      if(_highlighted != null) {
        _highlighted.set('hover',false);
        _highlighted.setStyle(styleFunction);
      }
      _highlighted = null;
    }
  });
}

function initMap() {

    // The location of our marker and popup. Coordinates ('EPSG:4326')
    _homeLocation = [-2.986221, 53.413420];

    // Create the map
    _map = new ol.Map({
        target: "map",
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          projection: "EPSG:3857",
          center: ol.proj.fromLonLat(_homeLocation),
          zoom: 6
        })
    });

    _map.on('pointermove', function (evt) {
      if (evt.dragging) {
      return;
      }
      var pixel = _map.getEventPixel(evt.originalEvent);
      displayFeatureInfo(pixel);
    });

    var geocoder = new Geocoder('nominatim', {
      provider: 'osm', //change it here
      lang: 'en-GB',
      placeholder: 'Search for ...',
      targetType: 'text-input',
      limit: 5,
      keepOpen: true,
      preventDefault: true
    });

    _map.addControl(geocoder);

    geocoder.on('addresschosen', function(evt){

      var feature = evt.feature,
        coord = evt.coordinate,
        address = evt.address;

      // Clear current features
      _map.removeLayer(_overlay);

      _map.getView().setCenter(coord);

      // Coordinates are in map projection so transform back to 4326 for home
      _homeLocation = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')

      updateFeatures();
    })

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

