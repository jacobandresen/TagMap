<!DOCTYPE html>
<html>
<head>
    <title>TagMap show</title>
    <meta charset="UTF-8">

    <!-- enable hashbang indexing -->
    <meta name="fragment" content="!"/>

    <!-- leaflet -->
    <link rel="stylesheet" href="js/libs/Leaflet/leaflet.css" />
  	<link rel="stylesheet" href="js/libs/Leaflet-draw/dist/leaflet.draw.css" />
</head>
<body>

<?php
require_once("Router.php");
$f = new Router("/api/1/index.php");
if ($f->hasFragment()) {
    print $f->getText();
} else {
?>
    <table width="100%">
        <tr>
            <td>
                <div id="divs">
                     <button id="display">Søg</button>
                     <button id="clear">Rens kort</button>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div id="map" style="height: 500px; border: 1px solid #ccc"></div>
                <div id="info" style="width: 500px; height: 500px; border: 1px solid #ccc">
               </div>
            </td>
        </tr>
    </table>
<?php
}
?>

<script src="js/jquery.min.js"></script>
<script src="js/leaflet.js"></script>
<script src="js/leaflet.draw.js"></script>
<script src="js/TagMap.js"></script>
<script src="js/show.js"></script>

</body>
</html>
