function TagMap (options) {
    var conf = options ||{
        key: 'abracdabra',
        api: "api.php",
        content: "content_da",
        mapDiv: 'map',
        infoDiv: 'info',
        baseMaps: {
            "Historisk atlas": new L.TileLayer('http://tile.historiskatlas.dk/54/{z}/{x}/{y}.jpg'),
            "OSM": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            "cloudmade": new L.TileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png')
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
        },
        {
            name: "test102",
            style: {
                radius: 8,
                fillColor: "#cccc47",
                color: "#ffff00",
                weight: 5,
                opacity: 0.5,
                fillOpacity: 0.3
            }
        }
       ],
       lat: 55.63405,
       lng: 12.59938,
       zoom: 14
    };

    var layers = [];
    $.each( conf.baseMaps, function (a, b) { layers.push(b); });

    var drawnItems;
    function getTagStyle ( tagsIn ) {
          for( var t in conf.tagConfig) {
              if (tagsIn == conf.tagConfig[t].name) {
                  return conf.tagConfig[t].style ;
              }
          };
    }

    function createMap () {
        var map = new L.Map(conf.mapDiv, {
            center: new L.LatLng(conf.lat, conf.lng),
            zoom: conf.zoom, //15,
            layers: layers,
        });
        L.control.layers(conf.baseMaps).addTo(map);
        return map;
    }
    var map = createMap();

    var exports = {};
    var layerData;
    var layer;

    function load (tags, cb) {
        $.get( conf.api, {
            type: "mapdata", tags: tags }).done( function (data) {
            cb($.parseJSON(data));
        });
    }

    function info (layerData) { $("#" + conf.infoDiv).html(layerData[conf.content]); }
    function overlay (layerData) { $("#" + conf.infoDiv).html(layerData.name); }

    exports.show = function (tags) {
        var i;
        exports.clear();
        load ( tags, function (data) {
            layerData = data;
             for(i = 0 ; i < layerData.length-1 ; i++) {
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
                    geoJsonLayer.on("click", function (e) {
                        info(this.layerData);
                    });
                    geoJsonLayer.on("mouseover", function (e) { overlay(this.layerData); });
                    map.addLayer(geoJsonLayer);
                }catch (e){
                    console.log("error:%o", e);
                }
            }
        });
    };

    exports.clear = function () {
        map.eachLayer( function (layer) {
            if (layer.layerData){
                map.removeLayer(layer);
            }
        });
    };

    exports.edit = function (tags) {
        drawnItems = new L.FeatureGroup();

        function editData (layerData) {
            $('#id').val( layerData.id );
            $('#name').val( layerData.name );
            $('#content_da').val( layerData.content_da );
            $('#content_en').val( layerData.content_en );
            $('#geometry').val( layerData.geometry);
            $('#tags').val( layerData.tags);
        }

        function create (layer, cb) {
           $('#id').val("");
           $('#name').val("");
           $('#content_da').val("");
           console.log("create:%o", layer);
           if ($('#tags').val() == "")  {
               alert('mangler værdi for tag');
               drawnItems.removeLayer(layer);
           }else {
               $.get( conf.api, {
                   type: "createmapdata",
                   name: $('#name').val(),
                   content_da: $('#content_da').val(),
                   geometry: JSON.stringify(layer.toGeoJSON()),
                   tags: $('#tags').val()
                }).done( function (data) {
                    cb(data);
                });
            }
         }

         function updateInfo (layer) {
             if ($('#tags').val() == "") {
                 alert('mangler værdi for tag');
                 return;
             }
            $.get( conf.api, {
                id : $("#id").val(),
                type: "createmapdata",
                name: $('#name').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                geometry: JSON.stringify(layer.toGeoJSON()),
                tags: $('#tags').val(),
                key: conf.key
            }).done(function (data) {
                console.log("updateInfo:%o", data);
                data = $.parseJSON(data);
                //console.log("update success:%o", data[0]);
                layer.layerData = data[0];
            });
       }

        function updateLayer( layer) {
            layer = layer;
            layerData = layer.layerData;
            updateInfo(layer);
        }

        if (!map.editStarted) {
            var drawControl = new L.Control.Draw({
                draw: {
                    //polygon: false,
                    //rectangle: false//,
                    circle: false
                },
                edit: false
             //   edit: {
             //       featureGroup: drawnItems,
             //       remove: true
             //  }
            });
            map.addControl(drawControl);
            map.editStarted = true;
        }

        load( tags, function (data) {
            exports.clear();
            layerData = data;
            var i;
            for(i = 0 ; i < layerData.length-1 ; i++) {
                try {
                    if (layerData[i].geometry) {
                        var geo = $.parseJSON(layerData[i].geometry);
                        var geoJsonLayer  = L.GeoJSON.geometryToLayer(geo);
                        geoJsonLayer.layerData = layerData[i];
                        geoJsonLayer.on("click", function (ev) {
                            layer = geoJsonLayer;
                            editData(this.layerData);
                        });
                        drawnItems.addLayer(geoJsonLayer);
                    }
                }catch (e){
                    console.log("rendering failed:%o", e);
                }
            }

            map.on('draw:created', function (e) {
                var type = e.layerType, drawnLayer = e.layer;
                drawnItems.addLayer(drawnLayer);
                create(drawnLayer,  function cb(data) {
                     drawnLayer.layerData = $.parseJSON(data)[0];
                     layer = drawnLayer;
                     editData(drawnLayer.layerData);
                     drawnLayer.on("click", function (e) {
                         editData(drawnLayer.layerData);
                     });
                });
            });

            map.on('draw:edited' , function (e) {
                e.layers.eachLayer( function (layer) {
                $.get( conf.api, {
                    id : layer.layerData.id,
                    type: "createmapdata",
                    name: layer.layerData.name,
                    content_da: layer.layerData.content_da,
                    content_en: layer.layerData.content_en,
                    geometry: JSON.stringify(layer.toGeoJSON()),
                    tags: layer.layerData.tags,
                    key: conf.key
                }).done(function (data) {
                    console.log("update success:%o", data);
                });
                });
            });

            map.on('draw:deleted', function (e) {
                e.layers.eachLayer( function (layer) {
                    console.log("delete:%o", layer.layerData);
                    $.get( conf.api, {
                       id : layer.layerData.id,
                       type: "deletemapdata",
                       name: layer.layerData.name,
                       content_da: layer.layerData.content_da,
                       content_en: layer.layerData.content_en,
                       geometry: JSON.stringify(layer.toGeoJSON()),
                       tags: layer.layerData.tags,
                       key: conf.key
                    }).done(function (data) {
                       console.log("delete :%o", data);
                       drawnItems.removeLayer(layer);
                   });
                });
            });
         });
         $('#saveButton').on('click', function () {
             updateInfo(layer);
         });
         map.addLayer(drawnItems);
    };

    exports.remove = function () {
        $.get( conf.api, {
            id : $("#id").val(),
            type: "deletemapdata",
            name: $('#name').val(),
            content_da: $('#content_da').val(),
            content_en: $('#content_en').val(),
            geometry: JSON.stringify(layer.toGeoJSON()),
            tags: $('#tags').val(),
            key: conf.key
        }).done(function (data) {
           console.log("delete success:%o", data);
           drawnItems.removeLayer(layer);
        });
    };

    return exports;
}
