info.ottokoenigsberger.placeParser = {

    processInfo: function (element) {
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
    },

    processData: function (data) {
        $("#title").text($(data).find("Document>name").text());

        var bounds = new google.maps.LatLngBounds();

        $(data).find("Placemark").each(function () {
            var latlngArr = $(this).find("coordinates").text().split(",");
            var coord = new google.maps.LatLng(latlngArr[1], latlngArr[0]);

            var info = processInfo(this);

            var markerOptions = {
                position: coord,
                map: map
            };
            if (info.hasOwnProperty("image") && info.image !== "") {
                markerOptions.icon = new google.maps.MarkerImage(
                    "http://timotuominen.fi/rachel/thumbnails/" + info.image + ".jpg",
                    new google.maps.Size(50, 50)
                );
                markerOptions.shadow = new google.maps.MarkerImage(
                    "http://timotuominen.fi/rachel/thumbshadow.png",
                    new google.maps.Size(54, 54),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(27, 52)
                );
            }
            var marker = new google.maps.Marker(markerOptions);

            var content = infoTemplate(info);

            google.maps.event.addListener(marker, "click", function () {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });
            bounds.extend(coord);
            //$("#years").append("<span>" + $(this).find("name").text() + "</span>");
        });

        map.fitBounds(bounds);
    }
};