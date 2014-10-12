<!DOCTYPE html>
<html>
<head>
    <title>TagMap show</title>
    <meta charset="UTF-8">
    <meta name="fragment" content="!"/>
<?php
require_once("TagMap.php");
$f = new TagMap("http://localhost:8080/1/index.php");
print $f->getHeader();
?>
</head>
<body>

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
<div id="map" style="height: 500px; border: 1px solid #ccc">
<?php if ($f->hasFragment()) { print $f->getText(); } ?>
</div>
<div id="info" style="width: 500px; height: 500px; border: 1px solid #ccc">
               </div>
            </td>
        </tr>
    </table>

<?php
print $f->getJS();
?>

</body>
</html>
