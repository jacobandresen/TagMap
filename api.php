<?php
$base = "http://politietsregisterblade.dk/api/1/";
$query = $base."?".$_SERVER['QUERY_STRING'];
$response = file_get_contents($query);
print $response;
?>
