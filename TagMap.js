var TagIcon = L.Icon.extend({
    options: {
       shadowUrl: 'images/leaf-shadow.png',
       iconSize: [38,95],
       shadowSize: [50,64],
       iconAnchor: [22, 94],
       shadowAnchor: [4,62],
       popupAnchor: [-3, -76]
    }
});

function TagMap(conf) {
    var layers = [];
    var exports = {};
    var activeLayer;

    var eye;

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

    var tagGroup = new L.FeatureGroup();
    map.addLayer(tagGroup);
    var markerGroup = new L.FeatureGroup();
    map.addLayer(markerGroup);

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

    function load(tags, cb, selectType) {
        var st = selectType || 'AND';
        $.ajax( conf.api, {
            method: 'POST',
            dataType: 'jsonp',
            data: {
                type: "mapdata",
                tags: tags,
                selecttype: st
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

    function showSingle (id) {
        var l = findLayer(id);
        if (l) {
            highLight(id);
            $("#" + conf.infoDiv).html(l.layerData["content_"+conf.language]);
        } else {
            $.ajax( conf.api, {
                method: 'POST',
                dataType: 'jsonp',
                data: {
                    type: "mapdata",
                    id: id
                },
                success: function (data) {
                    renderLayers( data, function (layer) {
                        tagGroup.addLayer(layer);
                        processLayer(layer);
                        markerGroup.clearLayers();
                        placeMarkerOnLayer(layer);
                        fitTagGroupInBounds();
                        $("#" + conf.infoDiv).html(layer.layerData["content_"+conf.language]);
                   });
               }
          });
       }
    }

    exports.show = function(tags, selectedId, selecttype) {
        exports.clear();
        $("#" + conf.infoDiv).html("");
        load(tags, function(data) {
            render( data, function (layer) {
                 processLayer(layer);
              }, selectedId);
        },selecttype);
    };

    function processLayer( layer ) {
       layer.on("click", function(e) {
          highLight(layer.layerData.id);
          $("#" + conf.infoDiv).html(layer.layerData["content_"+conf.language]);
          enableTagLinks();
       });
       if(conf.enableMouseover){
           layer.on("mouseover", function(e) {
              if (conf.language == "da") {
                 $("#" + conf.infoDiv).html(layer.layerData.name);
              } else {
                 $("#" + conf.infoDiv).html(layer.layerData.header_en);
              }
          });
       }
    }

    function enableTagLinks () {
        var tagLinks = $("#" + conf.infoDiv).find('a');
        $.each(tagLinks , function (idx, lnk) {
            $(lnk).on("click", function () {
                 var id = lnk.getAttribute('data-id');
                 showSingle(id);
                 return false;
            });
        });
    };

    function findLayer (id ) {
        var l;
        tagGroup.eachLayer (function (layer) {
            if (layer.layerData.id == id) {
                l = layer;
            }
        });
        return l;
    }

    function highLight (tagId) {
        markerGroup.clearLayers();
        var l = findLayer(tagId);
        if (l) placeMarkerOnLayer(l);
    };

    function placeMarkerOnLayer (layer) {
       activeLayer = layer;
       var geometry = $.parseJSON(layer.layerData.geometry);

       if (geometry.type=="Point"){
          placePointMarker (layer);
       } else {
          placePolygonMarker (layer);
       }
    }

    function placePointMarker (layer) {
         var iconUrl, eye, geometry = $.parseJSON(layer.layerData.geometry),
             coords = geometry.coordinates,
             style = getTagStyle(layer.layerData.tags);

         if (style == undefined || style.iconUrl == undefined || style.iconUrl == "") {
            eye =  L.marker([coords[1], coords[0]] );
         } else {
            var iconUrl = style.iconUrl;
            var icon = new TagIcon({iconUrl:iconUrl });
            eye =  L.marker([coords[1], coords[0]], {icon: icon} );
         }
         markerGroup.addLayer(eye);
         map.panTo(new L.LatLng(coords[1], coords[0]));
     }

    function placePolygonMarker(layer) {
        var coords = [], lat = 0.0,lng = 0.0,cnt = 0,
             geometry = $.parseJSON(layer.layerData.geometry);

        $.each( geometry.coordinates[0], function (idx, coords) {
             lat = lat + coords[0];
             lng = lng  + coords[1];
             cnt++;
        })
        lat = lat / cnt;
        lng = lng / cnt;
        coords = [ lat, lng];
        eye =  L.marker([coords[1], coords[0]]);
        markerGroup.addLayer(eye);
        map.panTo(new L.LatLng(coords[1], coords[0]));
    }

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
        tagGroup.clearLayers();
        markerGroup.clearLayers();
        map.eachLayer(function(layer) {
            if (layer.layerData) {
                map.removeLayer(layer);
            }
        });
        $("#id").val("");
        $('#id').attr("disabled", true);
        $("#name").val("");
        $('#name').attr("disabled", true);
        $('#header_en').attr("disabled", true);
        $('#header_en').val("");
        $('#content_da').val("");
        $('#content_da').attr("disabled", true);
        $('#content_en').attr("disabled", true);
        $('#content_en').val("");
   };

   function disableSave () {
       $('#id').attr("disabled", true);
       $('#name').attr("disabled", true);
       $('#header_en').attr("disabled", true);
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
            tagGroup.addLayer(layer);
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
       $('#header_en').val(layerData.header_en);
       $('#content_da').val(layerData.content_da);
       $('#content_en').val(layerData.content_en);
       $('#geometry').val(layerData.geometry);
       $('#tags').val(layerData.tags);
       $('#name').removeAttr("disabled");
       $('#header_en').removeAttr("disabled");
       $('#content_da').removeAttr("disabled");
       $('#content_en').removeAttr("disabled");
       $('#saveButton').removeAttr("disabled");
       $('#remove').removeAttr("disabled");
   }

   function geoJsonLayerFromTagData(layerData) {
       var geoJson = $.parseJSON(layerData.geometry);
       var layer = new  L.geoJson( geoJson,  {
            style: getTagStyle(layerData.tags),
            pointToLayer: function ( feature, latlng) {
                 return L.circleMarker(latlng,
                     getTagStyle(layerData.tags)
                     );
            }
       });
       layer.layerData = layerData;
       layer.type = geoJson.type;
       return layer;
    }

    function render (layerData, registerEventsCallback, selectedId) {
       exports.clear();
       renderLayers(layerData, registerEventsCallback);
       fitTagGroupInBounds();
       if (selectedId) {
           highLight(selectedId);
       }
    }

    function renderLayers ( layerData, registerEventsCallback) {
        for (i = 0; i < layerData.length - 1; i++) {
            var layer = geoJsonLayerFromTagData(layerData[i]);
            registerEventsCallback(layer);
            tagGroup.addLayer(layer);
         }
    }

    function fitTagGroupInBounds () {
        var latMin = 1000, latMax=-1000, lngMin = 1000, lngMax = -1000;
        tagGroup.eachLayer( function (layer) {
            var geometry = $.parseJSON(layer.layerData.geometry);
            function grow( coords ) {
               if (latMin > coords[0]) latMin = coords[0];
               if (latMax < coords[0]) latMax = coords[0];
               if (lngMin > coords[1]) lngMin = coords[1];
               if (lngMax < coords[1]) lngMax = coords[1];
            }
            if (layer.type == "Point") {
                grow( geometry.coordinates );
            } else {
                try {
                $.each(geometry.coordinates[0], function (idx, coords) {
                   grow(coords);
               });
                }catch (Exception){
                  console.log("failed on:%o", geometry);
                }
            }
         });

         var myBounds = new L.LatLngBounds( [ [lngMax, latMax], [lngMin, latMin]]);
         fitBounds(myBounds);
    }

    function fitBounds(bounds, paddingTopLeft, paddingBottomRight) { // (LatLngBounds || ILayer[, Point, Point])
       bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);
       paddingTopLeft = L.point(paddingTopLeft || [0, 0]);
       paddingBottomRight = L.point(paddingBottomRight || paddingTopLeft);
       var zoom = map.getBoundsZoom(bounds, false, paddingTopLeft.add(paddingBottomRight)),
           paddingOffset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2),
           swPoint = map.project(bounds.getSouthWest(), zoom),
           nePoint = map.project(bounds.getNorthEast(), zoom),
           center = map.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
       map.panTo(center);
       map.setZoom(zoom);
    }

    function create(layer, cb) {
        $('#id').val("");
        $('#name').val("");
        $('#content_da').val("");
        if ($('#tags').val() === "") {
            alert('mangler værdi for tag');
            tagGroup.removeLayer(layer);
        } else {
            $.ajax(conf.api, {
                dataType: 'jsonp',
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
            dataType: 'jsonp',
            data: {
                id: $("#id").val(),
                type: "createmapdata",
                name: $('#name').val(),
                header_en: $('#header_en').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                //geometry: stringify(activeLayer.toGeoJSON()),
                geometry: activeLayer.layerData.geometry,
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
                header_en: $('#header_en').val(),
                content_da: $('#content_da').val(),
                content_en: $('#content_en').val(),
                geometry: JSON.stringify(activeLayer.toGeoJSON()),
                tags: $('#tags').val()
            }
        }).done(function(data) {
            alert("slettede data");
            exports.edit($('#tags').val(), false);
        }).fail(function(data, b) {
          alert("sletning fejlede!");
          });
    };

    return exports;
}
