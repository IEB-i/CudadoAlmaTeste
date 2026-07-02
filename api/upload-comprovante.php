<?php
// Permitir requisições de qualquer origem
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido. Use POST.']);
    exit;
}

// Diretório para salvar os comprovantes
$uploadDir = '../uploads/comprovantes/';

// Criar diretório se não existir
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Verificar se o arquivo foi enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Erro no upload do arquivo.']);
    exit;
}

// Obter informações do arquivo
$file = $_FILES['file'];
$fileName = isset($_POST['fileName']) ? $_POST['fileName'] : time() . '_' . basename($file['name']);
$acampanteNome = isset($_POST['acampanteNome']) ? $_POST['acampanteNome'] : 'Sem nome';

// Caminho completo do arquivo
$filePath = $uploadDir . $fileName;

// Mover o arquivo para o diretório de destino
if (move_uploaded_file($file['tmp_name'], $filePath)) {
    echo json_encode([
        'success' => true, 
        'message' => 'Arquivo enviado com sucesso!',
        'filePath' => $filePath,
        'fileName' => $fileName
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Falha ao salvar o arquivo.']);
}
?>
