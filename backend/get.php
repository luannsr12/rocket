<?php
header('Content-Type: application/json');

// Gera um número aleatório entre 1.00 e 70.00
$numero = number_format(mt_rand(100, 7000) / 100, 2);

echo json_encode(['numero' => $numero]);
