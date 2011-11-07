$(function () {

    var map;
    var infoWindow;
    var infoTemplate = _.template($("#info-template").text());
    var personTemplate = _.template($("#person-template").text());
    var buildingMarkers = [];
    var peopleMarkers = [];
    var peopleLines = [];
    var ottoPositions = [];
    var currentDisplayedIndex = -1;
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
                map: map,
                zIndex: 1
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
        });

        map.fitBounds(bounds);
    }

    function processNetworkData (data) {
        var people = $(data).find("Document>Placemark");
        _.each(people, function (person) {
            var info = processInfo(person);
            var match = /Otto Koenigsberger \[([0-9]*)\-([0-9]*)\]/.exec(info.name);
            var coord = processLatLng(person);
            var markerOptions = {
                position: coord,
                icon: match ?
                    new google.maps.MarkerImage(
                        "img/ghost_web_99.png",
                        new google.maps.Size(99, 99),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(45, 45)
                    ) :
                    new google.maps.MarkerImage(
                        "http:////maps.gstatic.com/mapfiles/ms2/micons/man.png",
                        new google.maps.Size(32, 32)
                    ),
                zIndex: match ? 100 : 1
            };
            var marker = new google.maps.Marker(markerOptions);
            var content = personTemplate(info);
            google.maps.event.addListener(marker, "click", function () {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });
            if (match) {
                ottoPositions.push({ start: match[1], end: match[2], marker: marker });
            } else {
                peopleMarkers.push(marker);
            }
        });
        plotOtto();
        showPeriod(-1);
    }

    function eraseLines() {
        _.each(peopleLines, function (line) {
            line.setMap(null);
        });
        peopleLines = [];
    }

    function drawPeopleLines() {
        eraseLines();
        var item = currentDisplayedIndex === -1 ? null : ottoPositions[currentDisplayedIndex];
        if (!item || displayMode !== "people") {
            return;
        }
        _.each(peopleMarkers, function (m) {
            var line = new google.maps.Polyline({
                path: [item.marker.getPosition(), m.getPosition()],
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            line.setMap(map);
            peopleLines.push(line);
        });
    }

    function showPeriod(index) {
        if (currentDisplayedIndex === index) {
            return;
        }
        currentDisplayedIndex = index;
        var item = index === -1 ? null : ottoPositions[index];
        if (item) {
            _.each(ottoPositions, function (p) {
                if (p === item) {
                    if (!p.marker.getMap()) {
                        item.marker.setMap(map);
                    }
                } else {
                    p.marker.setMap(null);
                }
            });
        } else {
            _.each(ottoPositions, function (p) {
                if (!p.marker.getMap()) {
                    p.marker.setMap(map);
                }
            });
        }
        drawPeopleLines();
    }

    function addYearItem(text) {
        var el = $("<div><span>" + text + "</span></div>");
        $("#years").append(el);
        return el;
    }

    function plotOtto() {
        _.each(ottoPositions, function (item, index) {
            var el = addYearItem(item.start + " - " + item.end);
            el.mouseover(function () { showPeriod(index); });
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
        drawPeopleLines();
    });

    $.ajax({
       url: "data.kml",
       success: processPlaceData
    });

    $.ajax({
        url: "network.kml",
        success: processNetworkData
    });

    addYearItem("all").mouseover(function () { showPeriod(-1); });
});