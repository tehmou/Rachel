function createMap (data, network) {
    var map;
    var infoWindow;
    var infoTemplate = _.template($("#info-template").text());
    var personTemplate = _.template($("#person-template").text());

    var markers = {
        architectureRealized: [],
        architectureNotRealized: [],
        planning: [],
        research: [],
        contacts: []
    };

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
        var bounds = new google.maps.LatLngBounds();
        $(data).find("Placemark").each(function () {

            var coord = processLatLng(this);
            var info = processInfo(this);
            var markerOptions = {
                position: coord,
                zIndex: 1
            };
            var type = resolveType(info);
            var iconFile = "img/" + type + ".png";
            markerOptions.icon = new google.maps.MarkerImage(
                iconFile,
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

            markers[type].push(marker);
        });

        map.fitBounds(bounds);
    }

    function resolveType (info) {
        var type = info["project type"] ? info["project type"].toLowerCase() : "";
        if (type === "planning") {
            return "planning";
        } else if (type === "publication") {
            return "research";
        } else if (type === "architecture") {
            if (info.realised === "Yes") {
                return "architectureRealized";
            } else {
                return "architectureNotRealized";
            }
        }
        return "contacts";
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
                        "img/man.png",
                        new google.maps.Size(32, 32)
                    ),
                zIndex: match ? 100 : 1
            };
            var marker = new google.maps.Marker(markerOptions);
            var content = personTemplate(info);
            if (match) {
                //ottoPositions.push({ start: match[1], end: match[2], marker: marker });
            } else {
                google.maps.event.addListener(marker, "click", function () {
                    infoWindow.setContent(content);
                    infoWindow.open(map, marker);
                });
                markers.contacts.push(marker);
            }
        });
    }

    createMap();
    processPlaceData(data);
    processNetworkData(network);

    return {
        markers: markers,
        map: map
    }
}