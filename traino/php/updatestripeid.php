<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
require_once("db.php");
require_once("functions.php");

require_once("encryptkey.php");
$encryptionKey = ENCRYPTION_KEY;

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit();
}

// Check if required fields exist in the payload
if (!array_key_exists('stripe_id', $data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required stripe_id field']);
    exit();
}

if (!array_key_exists('email', $data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required email field']);
    exit();
}

$stripe_id = $data['stripe_id']; // Can be null for sign out
$email = $data['email'];

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email cannot be empty']);
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
    // First, check if user exists with this email
    $checkStmt = $pdo->prepare('SELECT id FROM users WHERE email = AES_ENCRYPT(:email, :key)');
    $checkStmt->bindParam(':email', $email);
    $checkStmt->bindParam(':key', $encryptionKey);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found with this email address']);
        exit();
    }
    
    // Update the stripe_id (can be null for sign out)
    $stmt = $pdo->prepare('UPDATE users SET stripe_id = :stripe_id WHERE email = AES_ENCRYPT(:email, :key)');
    $stmt->bindParam(':stripe_id', $stripe_id);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update Stripe ID. It might already be set to the same value.']);
        exit();
    }

    http_response_code(200);
    echo json_encode([
        'success' => 'Stripe ID updated successfully', 
        'stripe_id' => $stripe_id,
        'action' => $stripe_id === null ? 'signed_out' : 'updated'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
}
