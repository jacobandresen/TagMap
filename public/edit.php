<?php
require_once ("TagMap.php");
$t =new TagMap("/1/index.php");
?>
<!DOCTYPE HTML>
<html>
<head>
    <title>Tagmap edit</title>
<?php  print $t->getHeader(); ?>
</head>
<body>
    <table>
        <tr>
            <td>
            <div id="map" style="width: 500px; height: 500px; border: 1px solid #ccc"></div>
            </td>
            <td valign="top">
                <table>
                     <tr>
                         <td> filter:</td>
                         <td>
                              <div id="divs">
                                   <button id="edit">søg</button>
                                   <button id="clear">Rens kort</button>
                               </div>
                          </td>
                      </tr>
                      <tr><td>id:</td><td><input type="text" id="id"/></td></tr>
                      <tr><td>navn (da):</td><td><input type="text" id="name"/></td></tr>
                      <tr><td>navn (en):</td><td><input type="text" id="header_en"/></td></tr>
                      <tr><td>tags:</td><td><input type="text" id="tags"/> (krævet)</td></tr>
                      <tr><td>indhold (da):</td><td> <textarea id="content_da" style="width: 400px; height: 100px; border: 1px solid #ccc"> </textarea></td></tr>
                      <tr><td>indhold (en):</td><td> <textarea id="content_en" style="width: 400px; height: 100px; border: 1px solid #ccc"> </textarea></td></tr>
                      <tr><td></td><td><button id="saveButton">Gem</button> <button id="remove">slet</button> </td></tr>
                </table>
            </td>
        </tr>
    </table>

<?php
print $t->getJS();
?>
<script type="text/javascript">
$('#tags').val("default");
tagmap.edit("default");
$('#edit').on('click', function () {
    $('#id').val("");
    $('#header_en').val("");
    $('#content_da').val("");
    $('#content_en').val("");
    $('#name').val("");
    $('#tags').val($('#tagsQuery').val());
    tagmap.edit($('#tagsQuery').val());
});

$('#saveButton').on('click', function () { tagmap.updateInfo(); });
$('#id').attr("disabled", true);
$('#name').attr("disabled", true);
$('#header_en').attr("disabled", true);
$('#content_da').attr("disabled", true);
$('#content_en').attr("disabled", true);
$('#remove').attr("disabled", true);
$('#save').attr("disabled", true);
$('#remove').on('click', function () { tagmap.remove(); });
$('#clear').on('click', function () { tagmap.clear(); });
</script>
</body>
</html>
