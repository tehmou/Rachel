$(function () {

    var map;

    var model = new Backbone.Model({
        architectureRealized: true,
        architectureNotRealized: true,
        planning: true,
        research: true,
        contacts: true
    });

    model.bind("change", update);

    function update (force) {
        _.each(force ? model.attributes : model.changedAttributes(), function (value, key) {
            _.each(map.markers[key], function (marker) {
                marker.setMap(value ? map.map : null);
            });
            if (value) {
                $("#" + key + "-button").addClass("selected");
            } else {
                $("#" + key + "-button").removeClass("selected");
            }
        });
    }

    function initialize () {
        _.each(model.attributes, function (value, key) {
            $("#" + key + "-button").click(function () {
                var values = {};
                values[key] = !model.get(key);
                model.set(values);
            });
        });
        update(true);
    }

    $.ajax({
       url: "data.kml",
       success: function (data) {
           $.ajax({
               url: "network.kml",
               success: function (network) {
                   map = createMap(data, network);
                   initialize();
               }
           });
       }
    });

});