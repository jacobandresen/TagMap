function TagMap(conf) {
    var layers = [];
    var exports = {};
    var activeLayer;

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

    exports.show = function(tags) {
        exports.clear();
        load(tags, function(data) {
            render( data, function (layer) {
                layer.on("click", function(e) {
                    $("#" + conf.infoDiv).html(layer.layerData[conf.content]);
                });
                layer.on("mouseover", function(e) {
                    $("#" + conf.infoDiv).html(layer.layerData.name);
                });
            });
        });
    };

    exports.edit = function(tags, reload) {
        if (!reload) {
            disableSave();
            enableEditing();
        }
        load(tags, function(data) {
            render(data, function (layer) {
                layer.on("click", function (ev) {
                    activeLayer = layer;
                    editData(layer.layerData);
                });
            });
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

   function disableSave () {
       $('#id').attr("disabled", true);
       $('#name').attr("disabled", true);
       $('#content_da').attr("disabled", true);
       $('#content_en').attr("disabled", true);
       $('#remove').attr("disabled", true);
       $('#saveButton').attr("disabled", true);
   }

   function enableEditing () {
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

        map.on('draw:created', function(e) {
            layer = e.layer;
            map.addLayer(layer);
            create(layer, function cb(data) {
                layer.layerData = data[0];
                activeLayer = layer;
                layer.on("click", function(e) {
                    editData(layer.layerData);
                });
                editData(layer.layerData);
            });
        });
   };

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

    function layerFromData(layerData) {
        var layer;
        var geo = $.parseJSON(layerData.geometry);

        function pointToLayer (feature, latlng) {
             return L.circleMarker(latlng,
                getTagStyle(layerData.tags));
        }

        if (geo.type == "Point") {
             layer = L.geoJson(geo, {
                 style: getTagStyle(layerData.tags),
                 pointToLayer: pointToLayer
             });
         } else {
             layer = L.geoJson(geo,
                 {style: getTagStyle(layerData.tags)}
             );
        }
        layer.layerData = layerData;
        return layer;
    }

    function render (layerData, registerEventsCallback) {
        for (i = 0; i < layerData.length - 1; i++) {
            var layer = layerFromData(layerData[i]);
            registerEventsCallback(layer);
            map.addLayer(layer);
         }

        //TODO:#22
    }

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

   $('#saveButton').on('click', function() {
       updateInfo();
   });

   function updateInfo() {
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
                geometry: JSON.stringify(activeLayer.toGeoJSON()),
                tags: $('#tags').val()
            }
        }).done(function(data) {
            activeLayer.layerData = data[0];
            alert('gemte data');
            exports.edit( $('#tags').val(), true);
        }).fail(function (data){
            alert('gemning fejlede!');
        });
   }

   exports.remove = function() {
       if ($('#id').val() === "") {
           alert("id skal være udfyldt før at du får lov til at slette!");
           return;
        }
        $.ajax(conf.api, {
            method: 'POST',
            data: {
                id: $("#id").val(),
                type: "deletemapdata",
                name: $('#name').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                geometry: JSON.stringify(activeLayer.toGeoJSON()),
                tags: $('#tags').val()
            }
        }).done(function(data) {
            alert("slettede data");
            exports.edit($('#tags').val(), true);
        }).fail(function(data, b) {
          alert("sletning fejlede!");
          });
    };

    return exports;
}
