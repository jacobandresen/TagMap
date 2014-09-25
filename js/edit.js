"use strict";
var tagmap = new TagMap({
    api           :  "/1/index.php",
    content       :  "content_da",
    mapDiv        :  'map',
    infoDiv       :  'info',
    tagSelectorDiv:  'divs',
    baseMaps      : {
        "OSM": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    },
    tagConfig : [{
        name: "test102",
        style: {
            radius      : 8,
            fillColor   : "#cccc47",
            color       : "#ffff00",
            weight      : 5,
            opacity     : 0.5,
            fillOpacity : 0.3
        }
    }],
    lat    : 55.63405,
    lng    : 12.59938,
    zoom   : 14
});

tagmap.createTagSelector();

$('#tags').val("default");
tagmap.edit("default");
$('#edit').on('click', function () {
    $('#id').val("");
    $('#header_en').val("");
    $('#content_da').val("");
    $('#content_en').val("");
    $('#name').val("");
    $('#tags').val($('#tagsQuery').val());
    tagmap.edit($('#tagsQuery').val());
});

$('#saveButton').on('click', function () { tagmap.updateInfo(); });
$('#id').attr("disabled", true);
$('#name').attr("disabled", true);
$('#header_en').attr("disabled", true);
$('#content_da').attr("disabled", true);
$('#content_en').attr("disabled", true);
$('#remove').attr("disabled", true);
$('#save').attr("disabled", true);
$('#remove').on('click', function () { tagmap.remove(); });
$('#clear').on('click', function () { tagmap.clear(); });
