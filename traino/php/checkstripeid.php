<?php
$headers = getallheaders();
error_log('PHP received headers: ' . print_r($headers, true));
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once("db.php");
require_once("encryptkey.php");
$encryptionKey = ENCRYPTION_KEY;

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit();
}

$email = isset($data['email']) ? strtolower(trim($data['email'])) : null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT stripe_id FROM users WHERE email = AES_ENCRYPT(:email, :key)');
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(['stripe_id' => $user['stripe_id']]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
