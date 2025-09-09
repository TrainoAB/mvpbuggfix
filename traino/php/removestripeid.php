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
$user_id = $data['user_id'] ?? null;

if (!$email && !$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Email or user_id is required']);
    exit();
}

try {
    if ($user_id) {
        // Remove stripe_id by user_id
        $stmt = $pdo->prepare('UPDATE users SET stripe_id = NULL WHERE id = :user_id');
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
    } else {
        // Remove stripe_id by email
        $email = strtolower(trim($email));
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            exit();
        }
        
        $stmt = $pdo->prepare('UPDATE users SET stripe_id = NULL WHERE email = AES_ENCRYPT(:email, :key)');
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':key', $encryptionKey);
        $stmt->execute();
    }

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found or stripe_id already null']);
        exit();
    }

    http_response_code(200);
    echo json_encode(['success' => 'Stripe ID removed successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
}
?> 