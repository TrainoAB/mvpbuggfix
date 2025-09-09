<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
// Session-based authentication instead of token-based
// $apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
// validateAuthHeader($apikey);

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonError('Invalid JSON payload');
}

$trainer_id = $data['trainer_id'] ?? null;

if (!$trainer_id) {
    sendJsonError('Missing required fields');
}

// validateSessionID($pdo, $trainer_id, false);

try {
    // Prepare the SQL statement to update the stripe_account field
    $stmt = $pdo->prepare('UPDATE users SET stripe_account = 1 WHERE id = :id');
    $stmt->bindParam(':id', $trainer_id); // Bind the trainer_id parameter
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendJsonError('Trainer not found or stripe_account already set to 1');
    }

    $pdo = null;
    sendJson(['success' => 'stripe_account updated successfully']);
} catch (PDOException $e) {
    sendJsonError('Database error: ' . $e->getMessage());
}