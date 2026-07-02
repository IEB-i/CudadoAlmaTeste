<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$directory = 'Rifa/Envios/';
$count = 0;

// Verificar se o diretório existe
if (is_dir($directory)) {
    // Obter todos os arquivos PNG
    $files = glob($directory . '*.png');
    $count = count($files);
}

echo json_encode([
    'rifasEntregues' => $count,
    'valorPrevisto' => $count * 250
]);
?>
