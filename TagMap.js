function TagMap(options) {
    //Default configuration if no options var is given
    var conf = options || {
        api: "http://www.politietsregisterblade.dk/api/",
        content: "content_da",
        mapDiv: 'map',
        infoDiv: 'info',
        tagSelectorDiv: 'tagSelectorDiv',
        baseMaps: {
            "Historisk atlas": new L.TileLayer('http://tile.historiskatlas.dk/54/{z}/{x}/{y}.jpg'),
            "OSM": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            "cloudmade": new L.TileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png')
        },
        tagConfig: [
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
    
    //Creating the base layers
    var layers = [];
    $.each(conf.baseMaps, function(a, b) {
        layers.push(b);
    });

    //Getting the style of the tags based on the tag style
    function getTagStyle(tagsIn) {
        //Splitting the tags by ";", which is used with multiple tags
        var tags = tagsIn.split(";");        
        
        for (var t in conf.tagConfig) {
            if($.inArray(conf.tagConfig[t].name, tags) != -1)
            //if (tagsIn == conf.tagConfig[t].name) {
                return conf.tagConfig[t].style;
        }
    }
    
    //Creating the map, including base layers and overlay maps.
    //The var map is representing the whole map
    function createMap() {
        var map = new L.Map(conf.mapDiv, {
            center: new L.LatLng(conf.lat, conf.lng),
            zoom: conf.zoom, //15,
            layers: layers
        });
        L.control.layers(conf.baseMaps, conf.overlayMaps).addTo(map);
        return map;
    }
    
    //Private var used to access the map
    var map = createMap();

    var exports = {};
    var layerData;
    var layer;
    
    //Function used to load tags from the API
    function load(tags, cb) {
        $.ajax( conf.api, {
            method: 'POST', 
            dataType: 'jsonp',
            data: {
                type: "mapdata",
                tags: tags
             },
            success: cb
       });
    }
    
    //Sets the content of the tag in the infoDiv
    function info(layerData) {
        $("#" + conf.infoDiv).html(layerData[conf.content]);
    }
    //Sets the name of the tag in the infoDiv
    function overlay(layerData) {
        $("#" + conf.infoDiv).html(layerData.name);
    }

    //Public function that creates a drop down of tags based on all available tags
    exports.createTagSelector = function(){
	load([""], createSelectorWithTags);
    };
    
    //Creating a select list, placing it in an element identified by
    //config.TagSelectorDiv
    function createSelectorWithTags(data){
        data.splice(data.length-1,1);
        var referenceTags = [];
        referenceTags.push("");
        $.each(data, function(index, value){
            //Splitting the tags by ";", which is used with multiple tags
            var tags = value.tags.split(";");
            //Iterating through the tags for the data element
            $.each(tags, function(counter, item){
                //If tag is not recorded, add it to the reference arr
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
   
    //Displays the map and tags
    exports.show = function(tags) {
        var i;
        exports.clear();

        function pointToLayer (feature, latlng) {
            return L.circleMarker(latlng,
               getTagStyle(layerData[i].tags));
        }


        function registerEvents( geoJsonLayer ) {
             geoJsonLayer.on("click", function(e) { info(this.layerData); });
             geoJsonLayer.on("mouseover", function(e) { overlay(this.layerData); });
        }

        load(tags, function(data) {
            layerData = data;
            layerLatLngs = [];
            for (i = 0; i < layerData.length - 1; i++) {
                try {
                    var geo = $.parseJSON(layerData[i].geometry);
                    var geoJsonLayer;
                    if (geo.type == "Point") {
                        //Getting the latLng for each point, using it to focus the map later on
                        layerLatLngs.push(new L.LatLng(geo.coordinates[1], geo.coordinates[0]));
                        geoJsonLayer = L.geoJson(geo, {
                            style: getTagStyle(layerData[i].tags),
                            pointToLayer: pointToLayer
                        });
                    } else {
                        geoJsonLayer = L.geoJson(geo,
                                {style: getTagStyle(layerData[i].tags)}
                        );
                    }
                    geoJsonLayer.layerData = layerData[i];
                    registerEvents(geoJsonLayer);
                    map.addLayer(geoJsonLayer);
                    
                } catch (e) {
                    console.log("error:%o", e);
                }
            }
            
            //Focusing on the selected markers, if any
            if(layerLatLngs.length > 0){
                var bounds = new L.LatLngBounds(layerLatLngs);
                map.fitBounds(bounds);
            }
        });
    };
    
    //Clears of the map tags
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

    //Updates the marker info
    function updateInfo(layer) {
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

    //Sets the data of the marker in the GUI
    function editData(layerData) {
        $('#id').val(layerData.id);
        $('#name').val(layerData.name);
        $('#content_da').val(layerData.content_da);
        $('#content_en').val(layerData.content_en);
        $('#geometry').val(layerData.geometry);
        $('#tags').val(layerData.tags);
        //$('#id').removeAttr("disabled");
        $('#name').removeAttr("disabled");
        $('#content_da').removeAttr("disabled");
        $('#content_en').removeAttr("disabled");
        $('#saveButton').removeAttr("disabled"); 
        $('#remove').removeAttr("disabled");
    }
    
    //Registers the edit event
    function registerEditEvents (geoJsonLayer) {
	geoJsonLayer.on("click", function(ev) {
            layer = geoJsonLayer;
            editData(this.layerData);
	});
    }
    
    //Registers the click on marker event. TODO: Implement
    function registerMarkerClickEvent(geoJsonLayer){
        geoJsonLayer.on('click',function(e) {
        /*    var myIcon = L.icon({
                iconUrl: 'libs/images/marker-icon-selected.png',
                //iconRetinaUrl: 'my-icon@2x.png',
                //iconSize: [38, 95],
                //iconAnchor: [22, 94],
              //  popupAnchor: [-3, -76],
                shadowUrl: 'libs/images/marker-shadow.png',
              //  shadowRetinaUrl: 'my-icon-shadow@2x.png',
              //  shadowSize: [68, 95],
              //  shadowAnchor: [22, 94]
            });*/
            var selectedIcon = new L.Icon({iconUrl : 'libs/images/marker-icon-selected.png', iconAnchor: [12, 41]});
            
            e.target.setIcon(selectedIcon);
        });        
    }
    
    //Loads the map data including parsing of the GEOJSON loaded from the server
    function loadMapData (layerData) {
        for (i = 0; i < layerData.length - 1; i++) {
	    try {
	        if (layerData[i].geometry) {
		    var geo = $.parseJSON(layerData[i].geometry);
		    var geoJsonLayer = L.GeoJSON.geometryToLayer(geo);
		    geoJsonLayer.layerData = layerData[i];
		    registerEditEvents(geoJsonLayer);
                    //Test of marker click event
                    registerMarkerClickEvent(geoJsonLayer);
                    
		    map.addLayer(geoJsonLayer);
	        }
	    } catch (e) {
	        console.log("rendering failed:%o", e);
	    }
       }
    }
    
    //Reloads the markers after edit
    function reloadAfterEdit (tags) {
        exports.clear();
        load( tags, function (data) {
	    loadMapData( data);
            $('#tagsQuery').val(tags);
        });
    }
    
    //Edits a marker and adds tags
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
        //Updating the marker
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
        
        //Loads the markers
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
   
   //Updates the marker data on click
   $('#saveButton').on('click', function() {
       updateInfo(layer);
   });
   
   //Removes a marker by a given id
    exports.remove = function() {
        if ($('#id').val() === "") {
           alert("id skal være udfyldt før at du får lov til at slette!");
           return;
        }
        $.ajax(conf.api, {
           // dataType: 'json', //not json returned from server currently
            method: 'POST',
            dataType: 'jsonp',
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
            //map.removeLayer(layer);
            reloadAfterEdit($('#tags').val());
        }).fail(function(data, b) {
          alert("sletning fejlede!");
        //  console.log("delete failed:%o, %o", data, b);
          });
    };

    //Makes all exports functions public
    return exports;
}
