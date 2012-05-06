$(function () {

    var map;

    var model = new Backbone.Model({
        architectureRealized: true,
        architectureNotRealized: true,
        planning: true,
        research: true,
        contacts: true
    });

    function update () {
        _.each(map.buildingMarkers, function (marker) {
            marker.setMap(map.map);
        });
        _.each(map.peopleMarkers, function (marker) {
            marker.setMap(map.map);
        });
    }


    $.ajax({
       url: "data.kml",
       success: function (data) {
           $.ajax({
               url: "network.kml",
               success: function (network) {
                   map = createMap(data, network);
                   update();
               }
           });
       }
    });

});