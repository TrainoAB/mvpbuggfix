<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
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
if (!isset($data['id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing User ID property in JSON.");
    exit;
}


    try {
        // Sanitize the inputs
        $id = validate_and_sanitize($data['id'], "integer");
        $youtube_id = validate_and_sanitize($data['youtube_id'], "text") ?? null;

        // Prepare and execute the update statement
        $sql = "UPDATE users SET youtube_id = :youtube_id WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':youtube_id', $youtube_id, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        // Close the connection
        $pdo = null;

        sendJson("success", "YouTube cover updated successfully");
    } catch (PDOException $e) {
        sendJsonError("Error: " . $e->getMessage());
    }