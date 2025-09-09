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
if (!isset($data['user_id']) || !isset($data['session_id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing user id or session id property in JSON.");
}

try {
    $user_id = isset($data['user_id']) ? validate_and_sanitize(trim($data['user_id']), "integer") : null;
    $session_id = isset($data['session_id']) ? validate_and_sanitize(trim($data['session_id']), "text") : null;

    // Prepare the SQL statement with placeholders for user_id and session_id
    $sql = "SELECT * FROM user_sessions WHERE user_id = :user_id AND session_id = :session_id";
    // Prepare the statement
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':session_id', $session_id, PDO::PARAM_STR);

    // Execute the statement
    $stmt->execute();
    // Fetch the result
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Optionally, you can check if any rows were affected
    if ($result) {
   
        $sql = "UPDATE user_sessions SET registered = NOW() WHERE user_id = :user_id AND session_id = :session_id";
        // Prepare the statement
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':session_id', $session_id, PDO::PARAM_STR);

        $stmt->execute();
        $response = ["success" => "Time updated"];

        $pdo = null;
        
        sendJson($response);
   

    } else {
        sendJsonError("Session not found");
    }

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}


?>