<?php

 class DB{

   public $host;
   public $user;
   public $senha;
   public $bd;
   public $port;
   public $access_token = "";

   private static $instance = null;
   private $pdo;

   private function __construct(){

      $this->host   = DB_HOST;
      $this->user   = DB_USER;
      $this->senha  = DB_PASS;
      $this->bd     = DB_NAME;
      $this->port   = DB_PORT;

      $this->pdo = new PDO("mysql:host=$this->host:$this->port;dbname=$this->bd", $this->user, $this->senha, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES UTF8MB4"));

   }

   public static function getInstance(){
       if (self::$instance === null) {
           self::$instance = new self();
       }
       return self::$instance->pdo;
   }
 }

 ?>
