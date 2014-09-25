<!DOCTYPE HTML>
<html>
<head>
    <title>Tagmap edit</title>
    <meta charset="UTF-8"/>
    <link rel="stylesheet" href="js/leaflet.css" />
    <link rel="stylesheet" href="js/leaflet.draw.css" />
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
    <script src="js/jquery.min.js"></script>
    <script src="js/leaflet.js"></script>
    <script src="js/leaflet.draw.js"></script>
    <script src="js/TagMap.js"></script>
    <script src="js/edit.js"></script>
</body>
</html>
