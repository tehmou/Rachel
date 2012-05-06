$(function () {

    var map;

    function update () {

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