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
$stripe_account = $data['stripe_account'] ?? null; 


if (!$trainer_id || !isset($stripe_account)) {
    sendJsonError('Missing required fields');
}

if (!in_array($stripe_account, [0, 1], true)) {
    sendJsonError('Invalid stripe_account value');
}
// validateSessionID($pdo, $trainer_id, false);

try {
    // Prepare the SQL statement to update the stripe_account field
    $stmt = $pdo->prepare('UPDATE users SET stripe_account = :stripe_account WHERE id = :id');
    $stmt->bindParam(':id', $trainer_id, PDO::PARAM_INT);
    $stmt->bindParam(':stripe_account', $stripe_account, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendJsonError('Trainer not found or no changes made');
    }

    $pdo = null;
    sendJson(['success' => "stripe_account updated to $stripe_account for trainer_id $trainer_id"]);
} catch (PDOException $e) {
    sendJsonError('Database error: ' . $e->getMessage());
}