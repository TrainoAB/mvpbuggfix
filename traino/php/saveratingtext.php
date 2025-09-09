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

// Check if required properties are in the data
if (!isset($data['userid']) || !isset($data['rateuserid'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing required data properties in JSON.");
    exit;
}

// Validate and sanitize the feedback
$feedback = isset($data['feedback']) ? validate_and_sanitize($data['feedback'], "text") : null;

if ($feedback !== null && strlen($feedback) < 10) {
    http_response_code(400); // Bad Request
    $response = ['error' => 'Feedback must be at least 10 characters long'];
    sendJson($response);
    exit;
}

// Assuming user_id is available from the session or JWT token
$user_id = validate_and_sanitize($data['userid'], "integer");
$rating_user_id = validate_and_sanitize($data['rateuserid'], "integer");

try {
    // Check if feedback already exists for the user and rating user
    $stmt = $pdo->prepare("SELECT * FROM rating WHERE user_id = :user_id AND rating_user_id = :rating_user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':rating_user_id', $rating_user_id);
    $stmt->execute();

    // If feedback exists, update it
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->prepare("UPDATE rating SET description = :feedback WHERE user_id = :user_id AND rating_user_id = :rating_user_id");
        $stmt->bindParam(':feedback', $feedback);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':rating_user_id', $rating_user_id);
        $stmt->execute();

        $response = ['success' => true, 'message' => 'Feedback updated successfully'];
    } else {
        // If no feedback exists, insert new feedback
        $stmt = $pdo->prepare("INSERT INTO rating (user_id, rating_user_id, description) VALUES (:user_id, :rating_user_id, :feedback)");
        $stmt->bindParam(':feedback', $feedback);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':rating_user_id', $rating_user_id);
        $stmt->execute();

        $response = ['success' => true, 'message' => 'Feedback saved successfully'];
    }

    $pdo = null; // Close the database connection
    sendJson($response);
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError('Database error: ' . $e->getMessage());
}

?>