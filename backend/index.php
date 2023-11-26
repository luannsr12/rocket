<?php 

header('Content-Type: application/json');

require_once 'lib/env/vendor/autoload.php';

// Carrega as variáveis de ambiente do arquivo .env
$dotenv = Dotenv\Dotenv::createImmutable('../' );
$dotenv->load();


// define settings odds ['propabilidade', 'min', 'max', 'cor']
$config = [
    [27, 1.00, 1.03, 'red'],
    [33, 1.03, 2.00, 'purple'],
    [20, 2.01, 4.00, 'blue'],
    [18, 6.01, 11.00, 'yellow'],
    [1, 11.01, 20.00, 'green'],
    [1, 20.01, 70.00, 'gray'],
];


define('ODDS_SETTINGS', $config);
define('DB_HOST', $_ENV['DB_HOST']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_PORT', $_ENV['DB_PORT']);

require_once 'class/conn.php';
require_once 'class/Api.php';

if(isset($_GET['url'])){

    $explo_request = explode('/',$_GET['url']);
    $function_name = $explo_request[0];

    $api = new Api();

    if(method_exists($api,$function_name)){
      $request_parms = $_REQUEST;
      $function_exec = $api->$function_name($request_parms);
      if($function_exec){
        echo $function_exec;
      }
    }else{
      echo json_encode(array('erro' => '404', 'msg' => 'method not found'));
    }


}else{
  echo json_encode(array('erro' => '404', 'msg' => 'Not found'));
}
