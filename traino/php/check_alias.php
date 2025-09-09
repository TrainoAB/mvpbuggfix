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

// Check if the 'username' and 'password' properties exist in the received data
if (!isset($data['alias'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing alias property in JSON.");
}

try {
    $alias = isset($data['alias']) ? validate_and_sanitize(trim($data['alias']), "alias") : null;

    // Prepare the SQL statement with placeholders for user_id and session_id
    $sql = "SELECT * FROM users WHERE alias = :alias";
    // Prepare the statement
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':alias', $alias, PDO::PARAM_STR);

    // Execute the statement
    $stmt->execute();
    // Fetch the result
    $result = $stmt->fetch(PDO::FETCH_ASSOC);


    $pdo = null;

    // Optionally, you can check if any rows were affected
    if ($result) {
            $response = ["success" => "Alias found"];
            sendJson($response);

    } else {
        sendJsonError("Alias not found");
    }

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}


?>