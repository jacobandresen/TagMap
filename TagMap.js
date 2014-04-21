function TagMap (conf) {
    var me = this,
        layers = [],
        exports = {},
	activeLayer,
	eye;

    me.conf = conf; 
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

    me.map = new L.Map(conf.mapDiv, {
        center: new L.LatLng(me.conf.lat, me.conf.lng),
        zoom: conf.zoom,
        layers: layers
    });

    if (conf.showLayerControls) {
	L.control.layers(me.conf.baseMaps, me.conf.overlayMaps).addTo(me.map);
    }

    L.control.scale({imperial: false}).addTo(me.map);

    me.tagGroup = new L.FeatureGroup();
    me.map.addLayer(me.tagGroup);

    me.markerGroup = new L.FeatureGroup();
    me.map.addLayer(me.markerGroup);
}

TagMap.prototype.getTagStyle = function (tagsIn) {
    var me = this, tags = [];
    if (tagsIn) {
        tags = tagsIn.split(";"); //";" is used to split multiple tags
    }
    for (var t in me.conf.tagConfig) {
        if($.inArray(me.conf.tagConfig[t].name, tags) != -1) {
            return me.conf.tagConfig[t].style;
	}
    }

    return me.conf.tagConfig[0].style; //Returning default style if no match is found
}

TagMap.prototype.load = function (tags, cb, selectType) {
    var me = this;
    $.ajax( me.conf.api, {
        method: 'POST',
        dataType: 'jsonp',
        data: {
            type: "mapdata",
            tags: tags,
            selecttype: 'AND'
       },
       success: function (data)  {
          cb(data);
       }
   });
}

TagMap.prototype.createTagSelector = function (tags) {
    var me = this;
    $.ajax( me.conf.api, {
        method: 'POST',
        dataType: 'jsonp',
        data: {
            type: "mapdata",
          //  tags: tags,
            selecttype: 'AND'
       },
       success: function (data)  { 
           me.createSelectorWithTags(data);
       }
   });
};

TagMap.prototype.createSelectorWithTags = function (data) {
    var me = this, 
        referenceTags = [];

    data.splice(data.length-1,1);
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
    $("#" + me.conf.tagSelectorDiv).append(s);
}

TagMap.prototype.showSingle = function (id) {
    var me = this,
        l = me.findLayer(id);
    if (l) {
        me.highLight(id);
        $("#" + me.conf.infoDiv).html(l.layerData["content_" + me.conf.language]);
        me.enableTagLinks();
    } else {
        $.ajax( me.conf.api, {
            method    : 'POST',
            dataType  : 'jsonp',
            data: {
                type  : "mapdata",
                id    : id
            },
            success: function (data) {
                me.renderLayers( data, function (layer) {
	            me.tagGroup.addLayer(layer);
	            me.processLayer(layer);
	            me.markerGroup.clearLayers();
	            me.placeMarkerOnLayer(layer);
	            me.fitTagGroupInBounds();
	            $("#" + conf.infoDiv).html(layer.layerData["content_" + me.conf.language]);
	                me.enableTagLinks();
	           });
            }
        });
    }
}

TagMap.prototype.show = function(tags, selectedId, selecttype) {
    var me = this;
    me.clear();
    $("#" + me.conf.infoDiv).html("");
    me.load(tags, function (data) {
        me.render( data, function (layer) {
	    me.processLayer(layer);
        }, selectedId);
    },selecttype);
};

TagMap.prototype.processLayer = function ( layer ) {
    var me = this;
    layer.on("click", function (e) {
        me.highLight(layer.layerData.id);
	    $("#" + me.conf.infoDiv).html(layer.layerData["content_" + me.conf.language]);
	    me.enableTagLinks();
	    //Firing change event in case someone should be interested in knowing
	    //that the content has changed
	    $("#" + me.conf.infoDiv).change();
	    return false;
        }
    );

    if (me.conf.enableMouseover) {
        layer.on("mouseover", function (e) {
	    if (conf.language == "da") {
	        $("#" + me.conf.infoDiv).html(layer.layerData.name);
	    } else {
                $("#" + me.conf.infoDiv).html(layer.layerData.header_en);
            }
        });
    }
}

TagMap.prototype.enableTagLinks = function () {
    var me = this,
        tagLinks = $("#" + me.conf.infoDiv).find('a.tagLink');

    $.each(tagLinks , function (idx, lnk) {
        $(lnk).on("click", function () {
	    var id = lnk.getAttribute('data-id');
	    me.showSingle(id);
  	    return false;
        });
    });
};

TagMap.prototype.findLayer = function ( id ) {
    var me = this, l;
    me.tagGroup.eachLayer (function (layer) {
        if (layer.layerData.id == id) {
            l = layer;
        }
    });
    return l;
}

TagMap.prototype.highLight = function (tagId) {
    var me = this;
    me.markerGroup.clearLayers();
    var l = me.findLayer(tagId);
    if (l) me.placeMarkerOnLayer(l);
};

TagMap.prototype.placeMarkerOnLayer = function (layer) {
    var me = this,
        geometry = $.parseJSON(layer.layerData.geometry);

    activeLayer = layer;
    if (geometry.type=="Point"){
        me.placePointMarker (layer);
    } else {
        me.placePolygonMarker (layer);
    }
}

TagMap.prototype.placePointMarker = function (layer) {
    var me = this,
        icon,
        iconUrl,
        geometry = $.parseJSON(layer.layerData.geometry),
        coords = geometry.coordinates,
        eye =  L.marker([coords[1], coords[0]] ),
        style = me.getTagStyle(layer.layerData.tags);

    me.markerGroup.addLayer(eye);
    me.map.panTo(new L.LatLng(coords[1], coords[0]));
}

TagMap.prototype.placePolygonMarker = function (layer) {
    var me = this,
        coords = [],
        lat = 0.0,
        lng = 0.0,
        cnt = 0,
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
    me.markerGroup.addLayer(eye);
    me.map.panTo(new L.LatLng(coords[1], coords[0]));
}

TagMap.prototype.edit = function (tags, reload) {
    var me = this;
    if (!reload) {
	me.disableSave();
	me.enableEditing();
    }

    me.load(tags, function (data) {
	me.render(data, function (layer) {
	    layer.on("click", function (ev) {
	        me.activeLayer = layer;
		me.editData(layer.layerData);
	    });
	});
    });
};

TagMap.prototype.clear = function () {
    var me = this;

    me.tagGroup.clearLayers();
    me.markerGroup.clearLayers();

    me.map.eachLayer(function(layer) {
        if (layer.layerData) {
	    me.map.removeLayer(layer);
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

TagMap.prototype.disableSave = function () {
    $('#id').attr("disabled", true);
    $('#name').attr("disabled", true);
    $('#header_en').attr("disabled", true);
    $('#content_da').attr("disabled", true);
    $('#content_en').attr("disabled", true);
    $('#remove').attr("disabled", true);
    $('#saveButton').attr("disabled", true);
}

TagMap.prototype.enableEditing = function () {
    var me = this;
    if (!me.map.editStarted) {
	var drawControl = new L.Control.Draw({
            draw: {
                circle: false
            },
            edit: false
        });
        me.map.addControl(drawControl);
        me.map.editStarted = true;
    }

    me.map.on('draw:created', function (e) {
        var layer = e.layer;
        me.tagGroup.addLayer(layer);
        me.create(layer, function cb(data) {
            layer.layerData = data[0];
	    activeLayer = layer;
	    layer.on("click", function(e) {
	        editData(layer.layerData);
	    });
	    me.editData(layer.layerData);
        });
    });
};

TagMap.prototype.editData = function (layerData) {
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

TagMap.prototype.geoJsonLayerFromTagData = function (layerData) {
    var me = this,
    geoJson = $.parseJSON(layerData.geometry),
        layer = new  L.geoJson( geoJson,  {
            style: me.getTagStyle(layerData.tags),
            pointToLayer: function ( feature, latlng) {
                return L.circleMarker(latlng, me.getTagStyle(layerData.tags));
            }
        });

    layer.layerData = layerData;
    layer.type = geoJson.type;
    return layer;
}

TagMap.prototype.render = function (layerData, registerEventsCallback, selectedId) {
    var me = this;
    me.clear();
    me.renderLayers(layerData, registerEventsCallback);
    me.fitTagGroupInBounds();
    if (selectedId) {
        me.highLight(selectedId);
    }
}

TagMap.prototype.renderLayers = function ( layerData, registerEventsCallback) {
    var me = this;
    if (layerData)
    for (i = 0; i < layerData.length - 1; i++) {
        var layer = me.geoJsonLayerFromTagData(layerData[i]);
	registerEventsCallback(layer);
	me.tagGroup.addLayer(layer);
    }
}

TagMap.prototype.fitTagGroupInBounds = function () {
    var me = this,
        latMin = 1000,
        latMax=-1000,
        lngMin = 1000,
        lngMax = -1000;

    me.tagGroup.eachLayer( function (layer) {
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
    me.fitBounds(myBounds);
}

TagMap.prototype.fitBounds = function (bounds, paddingTopLeft, paddingBottomRight) { // (LatLngBounds || ILayer[, Point, Point])

    var me = this;
    bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);
    paddingTopLeft = L.point(paddingTopLeft || [0, 0]);
    paddingBottomRight = L.point(paddingBottomRight || paddingTopLeft);

    var zoom = me.map.getBoundsZoom(bounds, false, paddingTopLeft.add(paddingBottomRight)),
        paddingOffset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2),
        swPoint = me.map.project(bounds.getSouthWest(), zoom),
	    nePoint = me.map.project(bounds.getNorthEast(), zoom),
	    center = me.map.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
	me.map.panTo(center);
	me.map.setZoom(zoom);
}

TagMap.prototype.create = function (layer, cb) {
    var me = this;
    $('#id').val("");
    $('#name').val("");
    $('#content_da').val("");
    if ($('#tags').val() === "") {
        alert('mangler værdi for tag');
	me.tagGroup.removeLayer(layer);
    } else {
	$.ajax(me.conf.api, {
            dataType: 'jsonp',
            method: 'POST',
            data: {
                type          : "createmapdata",
                name          : $('#name').val(),
                content_da    : $('#content_da').val(),
                geometry      : JSON.stringify(layer.toGeoJSON()),
                tags          : $('#tags').val()
            }
       }).done(function(data) {
           cb(data);
        });
    }
}

TagMap.prototype.updateInfo = function () {
    var me = this;

    if ($('#tags').val() === "") {
        alert('mangler værdi for tag');
	return;
    }

    $.ajax(me.conf.api, {
        method: 'POST',
        dataType: 'jsonp',
        data: {
            id          : $("#id").val(),
            type        : "createmapdata",
            name        : $('#name').val(),
            header_en   : $('#header_en').val(),
            content_da  : $('#content_da').val(),
            content_en  : $('#content_en').val(),
            geometry    : me.activeLayer.layerData.geometry,
            tags        : $('#tags').val()
       }
    }).done(function(data) {
        me.activeLayer.layerData = data[0];
	alert('gemte data');
	me.edit( $('#tags').val(), true);
	}).fail(function (data){
	    alert('gemning fejlede!');
    });

    me.remove = function() {
        if ($('#id').val() === "") {
	    alert("id skal være udfyldt før at du får lov til at slette!");
	    return;
	}
	$.ajax(conf.api, {
            method: 'POST',
            data: {
                id         : $("#id").val(),
                type       : "deletemapdata",
                name       : $('#name').val(),
                header_en  : $('#header_en').val(),
                content_da : $('#content_da').val(),
                content_en : $('#content_en').val(),
                geometry   : JSON.stringify(activeLayer.toGeoJSON()),
                tags       : $('#tags').val()
           }
        }).done(function(data) {
	    alert("slettede data");
	    me.edit($('#tags').val(), false);
	}).fail(function(data, b) {
	    alert("sletning fejlede!");
	});
   };
}
