var tagmap = new TagMap({
    api               : "/1/index.php",
    language          : "da",
    mapDiv            : 'map',
    infoDiv           : 'info',
    tagSelectorDiv    : 'divs',
    showLayerControls : true,
    enableMouseover   : false,
    baseMaps: {
        "OSM": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    },
    tagConfig : [
    {
       name: "default",
       style: {
           radius: 8,
           fillColor: "#ffcc47",
           color: "#ff0000",
           weight: 5,
           opacity: 1,
           fillOpacity: 0.8
      }
    }
    ],
    lat              : 55.67899,
    lng              : 12.57522,
    zoom             : 12
});

tagmap.createTagSelector();
$('#display').on('click', function () { tagmap.show( $('#tagsQuery').val() ); });
$('#clear').on('click', function () { tagmap.clear(); });

var id = tagmap.getMapLink();
console.log("id:[%o]", id);
if (id && id != "") { tagmap.showSingle(id); }
