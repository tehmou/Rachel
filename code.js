$(function () {

    var map;
    var infoWindow;
    var infoTemplate = _.template($("#info-template").text());
    var personTemplate = _.template($("#person-template").text());
    var buildingMarkers = [];
    var peopleMarkers = [];
    var displayMode = "buildings";

    function createMap () {
        var latlng = new google.maps.LatLng(-34.397, 150.644);
        var myOptions = {
          zoom: 8,
          center: latlng,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        infoWindow = new google.maps.InfoWindow({
                content: "ll"
            });
    }

    function nullChecker(name) {
        return this.hasOwnProperty(name) ? this[name] : "";
    }

    function processInfo(element) {
        var result = { t: nullChecker };
        result.name = $(element).find("name").text();

        var description = $(element).find("description").text();
        description = description.replace('<div dir="ltr">', '');
        description = description.replace('</div>', '');
        var lines = description.split("<br>");
        _.each(lines, function (line) {
            var arr = line.match(/^(.*)\s*:\s*(.*)$/);
            if (arr) {
                result[arr[1].toLowerCase()] = arr[2].replace(/\s*$/, "");
            }
        });
        return result;
    }

    function processLatLng (element) {
        var latlngArr = $(element).find("coordinates").text().split(",");
        return new google.maps.LatLng(latlngArr[1], latlngArr[0]);
    }

    function processPlaceData (data) {
        $("#title").text($(data).find("Document>name").text());
        var bounds = new google.maps.LatLngBounds();
        $(data).find("Placemark").each(function () {

            var coord = processLatLng(this);
            var info = processInfo(this);
            var markerOptions = {
                position: coord,
                map: map
            };
            markerOptions.icon = new google.maps.MarkerImage(
                //"http://timotuominen.fi/rachel/thumbnails/" + info.image + ".jpg",
                info.iconfile ? info.iconfile : (info.built ? "building.png" : "planed_building.png"),
                new google.maps.Size(64, 64),
                new google.maps.Point(0, 0),
                new google.maps.Point(32, 32)
            );

            var marker = new google.maps.Marker(markerOptions);
            var content = infoTemplate(info);
            google.maps.event.addListener(marker, "click", function () {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });
            bounds.extend(coord);
            buildingMarkers.push(marker);
            //$("#years").append("<span>" + $(this).find("name").text() + "</span>");
        });

        map.fitBounds(bounds);
    }



    function processNetworkData (data) {
        var people = $(data).find("Document>Placemark");
        _.each(people, function (person) {
            var info = processInfo(person);
            var coord = processLatLng(person);
            var markerOptions = {
                position: coord,
                icon: new google.maps.MarkerImage(
                    "http:////maps.gstatic.com/mapfiles/ms2/micons/man.png",
                    new google.maps.Size(32, 32)
                )
            };
            var marker = new google.maps.Marker(markerOptions);
            var content = personTemplate(info);
            google.maps.event.addListener(marker, "click", function () {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });
            peopleMarkers.push(marker);
        });
    }

    createMap();

    $("#toggle-button").click(function () {
        if (displayMode === "buildings") {
            displayMode = "people";
        } else {
            displayMode = "buildings";
        }
        _.each(peopleMarkers, function (marker) {
            marker.setMap(displayMode === "people" ? map : null);
        });
        _.each(buildingMarkers, function (marker) {
            marker.setMap(displayMode === "buildings" ? map : null);
        });
    });

    $.ajax({
       url: "data.kml",
       success: processPlaceData
    });

    $.ajax({
        url: "network.kml",
        success: processNetworkData
    });

});