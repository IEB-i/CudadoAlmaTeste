<?php
// Verificar se o caminho do arquivo foi enviado
if (!isset($_POST['filePath']) || empty($_POST['filePath'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Caminho do arquivo não especificado.'
    ]);
    exit;
}

$filePath = '../' . $_POST['filePath'];

// Verificar se o arquivo existe
if (!file_exists($filePath)) {
    echo json_encode([
        'success' => false,
        'message' => 'Arquivo não encontrado.'
    ]);
    exit;
}

// Tentar excluir o arquivo
if (unlink($filePath)) {
    echo json_encode([
        'success' => true,
        'message' => 'Arquivo excluído com sucesso.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao excluir arquivo.'
    ]);
}
?>
