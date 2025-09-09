<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

start_custom_session();

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
if (!isset($data['user_id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}


try {
    $user_id = isset($data['user_id']) ? validate_and_sanitize($data['user_id'], "integer") : null;
    $session_id = isset($data['session_id']) ? validate_and_sanitize($data['session_id'], "text") : null;


    // Prepare the SQL statement with placeholders for user_id and session_id
    $sql = "DELETE FROM user_sessions WHERE user_id = :user_id";
    // Prepare the statement
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);


    // Execute the statement
    $stmt->execute();

   

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}


// Now you should explicitly start the session again if it was closed
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start(); // Reopen the session if it was previously closed
}

// Your logout logic here
if (session_status() === PHP_SESSION_ACTIVE) {
    session_unset();    // Unset all session variables
    session_destroy();  // Destroy the session
} else {
    error_log("No active session to destroy.");
}

$pdo = null;

// Prepare success response
$response = ["success" => "User logged out."];

sendJson($response);

exit;

?>