<?php

require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Check if the 'email' and 'password' properties exist in the received data
if (!isset($data['trainer_id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing Trainer ID JSON.");
    exit;
}

$trainer_id = $data['trainer_id'];

try {
    $stmt = $pdo->prepare('SELECT stripe_id FROM users WHERE id = :id');
    $stmt->bindParam(':id', $trainer_id); // Corrected parameter binding
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        sendJsonError('Trainer not found');
        exit();
    }


    sendJson(['stripeId' => $result['stripe_id']]);
    exit();
} catch (PDOException $e) {
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
    exit();
}