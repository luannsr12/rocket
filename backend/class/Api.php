<?php

 /**
  * Api
  */

 class Api {
    private $pdo;
    private $token;
    public function __construct(){
        $this->pdo = DB::getInstance();
   }

 public function milliseconds() {
    $mt = explode(' ', microtime());
    return intval( $mt[1] * 1E3 ) + intval( round( $mt[0] * 1E3 ) );
 }

   public function auth($req){

      $this->token = $req['token'];
        
      $query = $this->pdo->prepare("SELECT * FROM `user` WHERE token= :token LIMIT 1");
      $query->bindValue(':token', $this->token);
      if($query->execute()){
         $row = $query->fetchAll(PDO::FETCH_OBJ);
          if(count($row)>0){

             $milliseconds = $this->milliseconds();

              if($row[0]->expire_token > $milliseconds){
                echo json_encode(['erro' => false, 'message' => $milliseconds]);
              }else{
                $this->token = false;
                echo json_encode(['erro' => true, 'message' => 'erro na autenticação']);
              }

          }else{
            $this->token = false;
            echo json_encode(['erro' => true, 'message' => 'erro na autenticação']);
          }
      }else{
          $this->token = false;
          echo json_encode(['erro' => true, 'message' => 'erro na autenticação']);
      }
   }


   private function authenticate($token){
        $this->token = $token;
        $query = $this->pdo->prepare("SELECT * FROM `user` WHERE token= :token LIMIT 1");
        $query->bindValue(':token', $this->token);
        if($query->execute()){
        $row = $query->fetchAll(PDO::FETCH_OBJ);
            if(count($row)>0){
                return json_encode(['erro' => false, 'message' => 'autenticado']);
            }else{
            $this->token = false;
            return json_encode(['erro' => true, 'message' => 'erro na autenticação']);
            }
        }else{
            $this->token = false;
            return json_encode(['erro' => true, 'message' => 'erro na autenticação']);
        }
   }

   public function newRodada(){

    $isOnRodada = json_decode($this->getRodadaOn());

    if($isOnRodada->init){
        echo json_encode($isOnRodada); 
    }else{

        $createRodada = $this->createRodada();

        if($createRodada){
            echo json_encode(['erro' => false, 'token' => $createRodada['token'], 'id' => $createRodada['id']]);
        }else{
            echo json_encode(['erro' => true, 'message' => 'not created']);
        }

    }

   }

   public function createRodada(){
    $token = $this->generateToken(30, "", true);
    $query = $this->pdo->prepare("INSERT INTO rodada (token) VALUES (:token)");
    $query->bindValue(':token', $token);
    if($query->execute()){
        return ['token' => $token, 'id' => $this->pdo->lastInsertId()];
    }else{
        return false;
    }
   }

   public function generateToken($tamanho=10, $id="", $up=false) {
    $characters = $id.'abcdefghijklmnopqrstuvwxyz0123456789';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $tamanho; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    if($up === true) {
      return strtoupper($id.$randomString);
    } else {
      return $id.$randomString;
    }
  }

   public function getRodadaOn(){
    $query = $this->pdo->prepare("SELECT * FROM `rodada` WHERE status != :status");
    $query->bindValue(':status', 2);
    if($query->execute()){
        $row = $query->fetchAll(PDO::FETCH_OBJ);
        if(count($row)>0){
            return json_encode(['init' => true, 'token' => $row[0]->token]);
        }else{
        $this->token = false;
        return json_encode(['init' => false, 'message' => 'not init']);
        }
    }else{
        $this->token = false;
        return json_encode(['init' => false, 'message' => 'not init']);
    }
   }

   public function getOdd($req){
        $config = ODDS_SETTINGS;
        $rand = mt_rand(1, 100);
        $cumulativeProbability = 0;
        $odd = 1.00;
    
        foreach ($config as $range) {
            list($probability, $min, $max) = $range;
            $cumulativeProbability += $probability;
            if ($rand <= $cumulativeProbability) {
                $odd = mt_rand($min * 100, $max * 100) / 100;
                break;
            }
        }
        echo json_encode(['erro' => false, 'odd' => $odd]);

   }




 
}