<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
require("db.php");
require("functions.php");

require("encryptkey.php");
$encryptionKey = ENCRYPTION_KEY;

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit();
}

$email = $data['email'] ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required email field']);
    exit();
}

// Normalize email (trim and lowercase)
$email = strtolower(trim($email));

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit();
}

try {
    // Find user by email and update stripe_account status
    $stmt = $pdo->prepare('UPDATE users SET stripe_account = 1 WHERE email = AES_ENCRYPT(:email, :key)');
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found with this email address or stripe_account already set to 1']);
        exit();
    }

    http_response_code(200);
    echo json_encode(['success' => 'stripe_account updated successfully via email', 'email' => $email]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
} 