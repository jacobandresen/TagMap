function TagMap(conf) {
    var layers = [];
    var exports = {};
    var layerData;
    var layer;

    if (conf.baseMaps) {
        $.each(conf.baseMaps, function(a, b) {
            layers.push(b);
        });
    }

    if (conf.overlayMaps) {
        $.each(conf.overlayMaps, function (a, b) {
            layers.push(b);
        });
    }

    var map = new L.Map(conf.mapDiv, {
        center: new L.LatLng(conf.lat, conf.lng),
        zoom: conf.zoom,
        layers: layers
    });

    if (conf.showLayerControls) {
        L.control.layers(conf.baseMaps, conf.overlayMaps).addTo(map);
    }

    L.control.scale({imperial: false}).addTo(map);

    function getTagStyle(tagsIn) {
        var tags = [];
        if (tagsIn) {
           tags = tagsIn.split(";"); //";" is used to split multiple tags
        }
        for (var t in conf.tagConfig) {
            if($.inArray(conf.tagConfig[t].name, tags) != -1) {
                return conf.tagConfig[t].style;
            }
        }
    }

    function load(tags, cb) {
        $.ajax( conf.api, {
            method: 'POST',
            dataType: 'json',
            data: {
                type: "mapdata",
                tags: tags
             },
            success: cb
       });
    }

    exports.createTagSelector = function(){
        load([""], createSelectorWithTags);
    };

    function createSelectorWithTags(data){
        data.splice(data.length-1,1);
        var referenceTags = [];
        referenceTags.push("");
        $.each(data, function(index, value){
            var tags = value.tags.split(";");
            $.each(tags, function(counter, item){
                if($.inArray(item, referenceTags) === -1){
                    referenceTags.push(item);
                }
            });
        });

        var s = $("<select id=\"tagsQuery\" />");
        $.each(referenceTags, function(index, value){
            $("<option />", {value: value, text: value}).appendTo(s);
        });
        $("#" + conf.tagSelectorDiv).append(s);
    }

    function layerFromData(layerData) {
         var geoJsonLayer;
         var geo = $.parseJSON(layerData.geometry);
         if (geo.type == "Point") {
             geoJsonLayer = L.geoJson(geo, {
                 style: getTagStyle(layerData.tags),
                 pointToLayer: pointToLayer
             });
         } else {
             geoJsonLayer = L.geoJson(geo,
                 {style: getTagStyle(layerData.tags)}
             );
        }
        geoJsonLayer.layerData = layerData;
        return geoJsonLayer;
    }

    function pointToLayer (feature, latlng) {
        return L.circleMarker(latlng,
            getTagStyle(layerData[i].tags));
    }

    exports.show = function(tags) {
        var i;
        exports.clear();

        function registerEvents( geoJsonLayer ) {
            geoJsonLayer.on("click", function(e) {
                $("#" + conf.infoDiv).html(this.layerData[conf.content]);
            });

            geoJsonLayer.on("mouseover", function(e) {
                 $("#" + conf.infoDiv).html(this.layerData.name);
             });
        }

        load(tags, function(data) {
            layerData = data;
            for (var i = 0; i < layerData.length - 1; i++) {
                try {
                    var geoJsonLayer = layerFromData(layerData[i]);
                    registerEvents(geoJsonLayer);
                    map.addLayer(geoJsonLayer);
                } catch (e) {
                    console.log("error:%o", e);
                }
            }
        });
    };

    exports.clear = function() {
        map.eachLayer(function(layer) {
            if (layer.layerData) {
                map.removeLayer(layer);
            }
        });
        $("#id").val("");
        $('#id').attr("disabled", true);
        $("#name").val("");
        $('#name').attr("disabled", true);
        $("#content_da").val("");
        $('#content_da').attr("disabled", true);
        $("#content_en").val("");
        $('#content_en').attr("disabled", true);
    };

    function updateInfo(layer) {
        if ($('#tags').val() === "") {
            alert('mangler værdi for tag');
            return;
        }
        $.ajax(conf.api, {
            method: 'POST',
            dataType: 'json',
            data: {
                id: $("#id").val(),
                type: "createmapdata",
                name: $('#name').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                geometry: JSON.stringify(layer.toGeoJSON()),
                tags: $('#tags').val()
            }
        }).done(function(data) {
            layer.layerData = data[0];
            alert('gemte data');
            reloadAfterEdit( $('#tags').val());
            editData(layer.layerData);
        }).fail(function (data){
            alert('gemning fejlede!');
        });
    }

    function editData(layerData) {
        $('#id').val(layerData.id);
        $('#name').val(layerData.name);
        $('#content_da').val(layerData.content_da);
        $('#content_en').val(layerData.content_en);
        $('#geometry').val(layerData.geometry);
        $('#tags').val(layerData.tags);
        $('#name').removeAttr("disabled");
        $('#content_da').removeAttr("disabled");
        $('#content_en').removeAttr("disabled");
        $('#saveButton').removeAttr("disabled");
        $('#remove').removeAttr("disabled");
    }

    function loadMapData (layerData) {
        for (i = 0; i < layerData.length - 1; i++) {
            try {
                if (layerData[i].geometry) {
                    var geoJsonLayer = layerFromData(layerData[i]);
                    geoJsonLayer.on("click", function(ev) {
                        layer = geoJsonLayer;
                        editData(this.layerData);
                    });
                    map.addLayer(geoJsonLayer);
                }
             } catch (e) {
                 console.log("rendering failed:%o", e);
             }
         }
    }

    function reloadAfterEdit (tags) {
        exports.clear();
        load( tags, function (data) {
            loadMapData( data);
            $('#tagsQuery').val(tags);
        });
    }

    exports.edit = function(tags) {
        function create(layer, cb) {
            $('#id').val("");
            $('#name').val("");
            $('#content_da').val("");
            if ($('#tags').val() === "") {
                alert('mangler værdi for tag');
                map.removeLayer(layer);
            } else {
                $.ajax(conf.api, {
                    dataType: 'json',
                    method: 'POST',
                    data: {
                        type: "createmapdata",
                        name: $('#name').val(),
                        content_da: $('#content_da').val(),
                        geometry: JSON.stringify(layer.toGeoJSON()),
                        tags: $('#tags').val()
                    }
                }).done(function(data) {
                    cb(data);
                });
            }
        }
        function updateLayer(layer) {
            layer = layer;
            layerData = layer.layerData;
            updateInfo(layer);
        }

        if (!map.editStarted) {
            var drawControl = new L.Control.Draw({
                draw: {
                    circle: false
                },
                edit: false
            });
            map.addControl(drawControl);
            map.editStarted = true;
        }

        load(tags, function(data) {
            exports.clear();
            layerData = data;
            var i;
            loadMapData( layerData);
            map.on('draw:created', function(e) {
                var type = e.layerType, drawnLayer = e.layer;
                map.addLayer(drawnLayer);
                create(drawnLayer, function cb(data) {
                    drawnLayer.layerData = data[0];
                    layer = drawnLayer;
                    editData(drawnLayer.layerData);
                    drawnLayer.on("click", function(e) {
                        layer = drawnLayer;
                        editData(drawnLayer.layerData);
                    });
                });
            });

            $('#id').attr("disabled", true);
            $('#name').attr("disabled", true);
            $('#content_da').attr("disabled", true);
            $('#content_en').attr("disabled", true);
            $('#remove').attr("disabled", true);
            $('#saveButton').attr("disabled", true);
        });
   };

   $('#saveButton').on('click', function() {
       updateInfo(layer);
   });

   exports.remove = function() {
        if ($('#id').val() === "") {
           alert("id skal være udfyldt før at du får lov til at slette!");
           return;
        }
        $.ajax(conf.api, {
           // dataType: 'json', //not json returned from server currently
            method: 'POST',
            data: {
                id: $("#id").val(),
                type: "deletemapdata",
                name: $('#name').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                geometry: JSON.stringify(layer.toGeoJSON()),
                tags: $('#tags').val()
            }
        }).done(function(data) {
            alert("slettede data");
            reloadAfterEdit($('#tags').val());
        }).fail(function(data, b) {
          alert("sletning fejlede!");
          });
    };

    return exports;
}
