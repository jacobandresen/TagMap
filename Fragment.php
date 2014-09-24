<?php
class Fragment
{
   public function Fragment ($endpoint)
   {
       $this->endpoint = $endpoint;
       $this->fragment = $_REQUEST['_escaped_fragment'];
       $this->params = $this->getParameters();
   }

   public function hasFragment ($params)
   {
       return (isset($params['_escaped_fragment_']));
   }

   public function map ()
   {
       return fgets($this->endpoint."?".$this->fragment);
   }

   public function getParameters ()
   {
       $escaped = $_REQUEST['_escaped_fragment_'];
       $out     = array();
       foreach (explode("&", $escaped) as $var) {
           $keyval = explode("=", $var);
           $out[$keyval[0]] = $keyval[1];
       };
       return $out;
   }

   public function getParameter($name, $default) {
       if ($_REQUEST[$name]) {
          return $_REQUEST[$name];
       } else {
          return $default;
       }
   }
}
?>
