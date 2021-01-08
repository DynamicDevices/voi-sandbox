    console.debug(item);

var map;
var overlay;

// when jQuery has loaded the data, we can create features for each photo
function successHandler(data) {

  // we need to transform the geometries into the view's projection
//  var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');

  // loop over the items in the response
  data.forEach(function(item) {

    // create a new feature with the item as the properties
    var feature = new OpenLayers.Feature(item);
    // add a url property for later ease of access
//    feature.set('url', item.media.m);
    // create an appropriate geometry and add it to the feature

    console.debug(item)

    var myLocation = new OpenLayers.Geometry.Point(parseFloat(item.LON), parseFloat(item.LAT)).transform('EPSG:4326', 'EPSG:3857');

    console.debug(myLocation);

    var tiptext = ""
    if( "SCHNAME" in item )
      tiptext = item.SCHNAME;
    else if( "Institution Name" in item )
      tiptext = item["Institution Name"];
    else if( "School Name" in item )
      tiptext = item["School Name"];

    overlay.addFeatures([
        new OpenLayers.Feature.Vector(myLocation, {tooltip: tiptext})
    ]);


  });
}

function init() {

    // The overlay layer for our marker, with a simple diamond as symbol
    overlay = new OpenLayers.Layer.Vector('Overlay', {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: 'img/marker.png',
            graphicWidth: 20, graphicHeight: 24, graphicYOffset: -24,
            title: '${tooltip}'
        })
    });

    // The location of our marker and popup. We usually think in geographic
    // coordinates ('EPSG:4326'), but the map is projected ('EPSG:3857').
    var myLocation = new OpenLayers.Geometry.Point(-2.986221, 53.413420)
        .transform('EPSG:4326', 'EPSG:3857');

    // We add the marker with a tooltip text to the overlay
    overlay.addFeatures([
        new OpenLayers.Feature.Vector(myLocation, {tooltip: 'OpenLayers'})
    ]);

    // A popup with some information about our location
    var popup = new OpenLayers.Popup.FramedCloud("Popup",
        myLocation.getBounds().getCenterLonLat(), null,
        '<a target="_blank" href="http://openlayers.org/">We</a> ' +
        'could be in Liverpool.<br>Or elsewhere.', null,
        true // <-- true if we want a close (X) button, false otherwise
    );

    // Finally we create the map
    map = new OpenLayers.Map({
        div: "map", projection: "EPSG:3857",
        layers: [new OpenLayers.Layer.OSM(), overlay],
        center: myLocation.getBounds().getCenterLonLat(), zoom: 6
    });

    // and add the popup to it.
//    map.addPopup(popup);

    // pull json for NI
    $.ajax({
      url: 'resources/Northern_Ireland_Jan2021_latlon.json',
      success: successHandler,
      error: function () {
        alert("Error retrieving NI data");
      },
      complete: function () {
      }
    });

    // pull json for Scotland
    $.ajax({
      url: 'resources/Scotland_Oct2020_open_latlon.json',
      success: successHandler,
      error: function () {
        alert("Error retrieving Scotland data");
      },
      complete: function () {
      }
    });
    // pull json for England
    $.ajax({
      url: 'resources/England_2018_2019_latlon.json',
      success: successHandler,
      error: function () {
        alert("Error retrieving England data");
      },
      complete: function () {
      }
    });
}
