<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
require("db.php");

require("encryptkey.php");
$encryptionKey = ENCRYPTION_KEY;

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo 'Invalid JSON payload';
    exit();
}

$email = $data['email'] ?? null;

if (!$email) {
    http_response_code(400);
    echo 'Missing required fields';
    exit();
}

try {
    $stmt = $pdo->prepare('UPDATE users SET stripe_id = NULL WHERE email = AES_ENCRYPT(:email, :key)');
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo 'Profile not found';
        exit();
    }

    http_response_code(200);
    echo json_encode(['Success' => 'Stripe ID removed successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database error: ' . $e->getMessage();
    exit();
}
