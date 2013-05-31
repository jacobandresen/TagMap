//2013 TagMap. ksa.kk.dk <jacob.andresen@gmail.com>
function TagMap (mapDiv, infoDiv) {

    //begin:config
    var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png');
    var OSM       = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    var baseMaps = { "cloudmade": cloudmade, "OSM": OSM };
    function getTagStyle ( tags ) {
            switch (tags) {
                case 'test101':
                    return {
                        radius: 8,
                        fillColor : "#ffcc47",
                        color: "#ff0000",
                        weight: 5,
                        opacity: 1,
                        fillOpacity: 0.8
                    };

                default:
                    return {
                        radius: 8,
                        fillColor: "#cccccc",
                        color: "#444",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
            }
    }

    var map = new L.Map(mapDiv, {
        center: new L.LatLng(55.63405, 12.59938),
        zoom: 15,
        layers: [cloudmade, OSM],
    });
    L.control.layers(baseMaps).addTo(map);
    //end:config

    var exports = {};
    var proxy = "api.php";
    var layerData;
    var layer;

    function load (tags, cb) {
        $.get( proxy, {
            type: "mapdata", tags: tags }).done( function (data) {
            cb($.parseJSON(data));
        });
    }

    function info (layerData) { $("#" + infoDiv).html(layerData.content); }
    function overlay (layerData) { $("#" + infoDiv).html(layerData.id); }

    exports.show = function (tags) {
        var i;
         load ( tags, function (data) {
            layerData = data;
             for(i = 0 ; i < layerData.length ; i++) {
                try {
                    var geo = $.parseJSON(layerData[i].geometry);
                    var geoJsonLayer;
                    if (geo.type == "Point") {
                        geoJsonLayer = L.geoJson(geo, {
                            pointToLayer: function (feature, latlng) {
                               return L.circleMarker(latlng,
                                   getTagStyle(layerData[i].tags));
                            }
                        })
                    } else {
                    geoJsonLayer = L.geoJson(geo,
                        { style:   getTagStyle(layerData[i].tags) }
                      );
                    }
                    geoJsonLayer.layerData = layerData[i];
                    geoJsonLayer.on("click", function (e) { info(this.layerData); });
                    geoJsonLayer.on("mouseover", function (e) { overlay(this.layerData); });
                   map.addLayer(geoJsonLayer);
                }catch (e){
                    console.log("error:%o", e);
                }
            }
        });
    };

    exports.clear = function () {

        map.eachLayer( function (a, b) {
            console.log("map:%o", a);
        });

    };


    exports.edit = function (tags) {
        var drawnItems = new L.FeatureGroup();
        function edit (layerData) {
            $('#id').val( layerData.id );
            $('#name').val( layerData.name );
            $('#content').val( layerData.content );
            $('#geometry').val( layerData.geometry);
            $('#tags').val( layerData.tags);
        }

        function remove (layer) {
            console.log("TODO: remove data on the server: %o", layer);
        }

        function create (layer, cb) {
           $('#id').val("");
           $('#name').val("");
           $('#content').val("");
           $('#tags').val(tags);
           $.get( proxy, {
                type: "createmapdata",
                name: $('#name').val(),
                content: $('#content').val(),
                geometry: JSON.stringify(layer.toGeoJSON()),
                tags: $('#tags').val()
            }).done( function (data) {
                cb(data);
            });
         }

         function updateInfo (layer) {
             $.get( proxy, {
                id : $("#id").val(),
                type: "createmapdata",
                name: $('#name').val(),
                content: $('#content').val(),
                geometry: JSON.stringify(layer.toGeoJSON()),
                tags: $('#tags').val()
            }).done(function (data) {
                console.log("update success:%o", data);
            });
         }

        function updateLayer( layer) {
            layer = layer;
            layerData = layer.layerData;
            updateInfo(layer);
        }

        if (!map.editStarted) {
            var drawControl = new L.Control.Draw({ edit: { featureGroup: drawnItems } });
            map.addControl(drawControl);
            map.editStarted = true;
        }

        load( tags, function (data) {
            layerData = data;
            var i;
            for(i = 0 ; i < layerData.length ; i++) {
                if (layerData[i].content !== undefined) {
                    try {
                       var geo = $.parseJSON(layerData[i].geometry);
                       var geoJsonLayer = L.geoJson(geo,
                         { style:   getTagStyle(layerData[i].tags) }
                       );
                       geoJsonLayer.layerData = layerData[i];
                       geoJsonLayer.on("click", function (e) {
                            edit(this.layerData);
                            layer = e.layer;
                        });
                       map.addLayer(geoJsonLayer);
                    }catch (e){
                       // console.log("rendering failed:%o", e);
                    }
                }
            }

            map.addLayer(drawnItems);
            map.on('draw:created', function (e) {
                var type = e.layerType,
                    drawnLayer = e.layer;
                drawnItems.addLayer(drawnLayer);
                create(drawnLayer,  function cb(data) {
                     drawnLayer.layerData = $.parseJSON(data)[0];
                     layer = drawnLayer;
                     drawnLayer.on("click", function (e) {
                         edit(this.layerData);
                         layer = e.layer;
                     });
                });
            });

            map.on('draw:edited' , function (e) {
                e.layers.eachLayer( function (layer) {
                   updateLayer(layer);
                });
            });

            map.on('draw:deleted', function (e) { });
         });
         $('#saveButton').on('click', function () { updateInfo(layer); });
    };
    return exports;
}
