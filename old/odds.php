<?php 


function gerarNumeroAleatorio($config) {
    $rand = mt_rand(1, 100);
    $cumulativeProbability = 0;

    foreach ($config as $range) {
        list($probability, $min, $max) = $range;

        $cumulativeProbability += $probability;

        if ($rand <= $cumulativeProbability) {
            return mt_rand($min * 100, $max * 100) / 100;
        }
    }

    return null;
}


$config = [
    [27, 1.00, 1.03, 'red'],
    [33, 1.03, 2.00, 'purple'],
    [20, 2.01, 4.00, 'blue'],
    [18, 6.01, 11.00, 'yellow'],
    [1, 11.01, 20.00, 'green'],
    [1, 20.01, 70.00, 'gray'],
];



$contagemIntervalos = array_fill(0, count($config), 0);
$totalIteracoes = 100;


 for ($i=1; $i < $totalIteracoes; $i++) { 
  
    $numEscolhido = gerarNumeroAleatorio($config);
    $alocado = false;
    
    foreach ($config as $index => $range) {
        $min = $range[1];
        $max = $range[2];
        if ($numEscolhido >= $min && $numEscolhido <= $max) {
            $contagemIntervalos[$index]++;
            $alocado = $index;
            break;
        }
    }


    echo '<span style="background-color:'.$config[$alocado]['3'].';" >'.$numEscolhido.'</span><br />';

 }


// Mostrar resultados em porcentagem
echo "<br /><br />Resultados em porcentagem: <br />";
foreach ($config as $index => $range) {
    list($probability, $min, $max) = $range;
    $porcentagem = ($contagemIntervalos[$index] / $totalIteracoes) * 100;
    echo "Intervalo entre $min e $max : [$porcentagem%] <br />";
}


?>