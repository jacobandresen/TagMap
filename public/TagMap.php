<?php
class TagMap
{
   public function TagMap ($endpoint)
   {
       $this->endpoint = $endpoint;
       $this->fragment = "";
       if( (isset($_REQUEST['_escaped_fragment']))) {
           $this->fragment = $_REQUEST['_escaped_fragment'];
       }
       $this->params   = $this->getParameters();
   }

   public function hasFragment ()
   {
       return ($this->fragment <> '');
   }

   public function getText ( )
   {
       return fgets($this->endpoint."?".$this->fragment);
   }

   public function getParameters ()
   {
       $out     = array();
       if ($this->fragment <> "") {
           foreach (explode("&", $this->fragment) as $var) {
               $keyval = explode("=", $var);
               $out[$keyval[0]] = $keyval[1];
           };
       }
       return $out;
   }

   public function getParameter($name, $default) {
       if ($_REQUEST[$name]) {
          return $_REQUEST[$name];
       } else {
          return $default;
       }
   }

   public function getHeader() {
       $h  = <<< CSS
<meta name="fragment"  content="!">
<link rel="stylesheet" href="/vendor/leaflet.css" />
<link rel="stylesheet" href="/vendor/leaflet.draw.css" />
CSS;
       return $h;
   }

   public function getJS() {
       $h  = <<< JS
<script src="vendor/jquery.min.js"></script>
<script src="vendor/leaflet.js"></script>
<script src="vendor/leaflet.draw.js"></script>
<script src="TagMap.js"></script>
<script type="text/javascript">
var tagmap = new TagMap({
    api               : "$this->endpoint",
    language          : "da",
    showLayerControls : true,
    enableMouseover   : false,
    enableTagSelector : true,
    baseMaps: { "OSM": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png') },
    tagConfig : [{
       name: "default",
       style: {
           radius     : 8,
           fillColor  : "#ffcc47",
           color      : "#ff0000",
           weight     : 5,
           opacity    : 1,
           fillOpacity: 0.8
       }
    }],
    lat              : 55.67899,
    lng              : 12.57522,
    zoom             : 12
});
</script>
JS;
       return $h;
   }

}
?>
