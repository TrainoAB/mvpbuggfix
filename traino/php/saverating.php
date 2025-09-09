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

// Check if the required properties are in the data
if (!isset($data['userid']) || !isset($data['rateuserid']) || !isset($data['rating'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing required data properties in JSON.");
    exit;
}

// Validate and sanitize the incoming data
$user_id = validate_and_sanitize($data['userid'], "integer");
$rating_user_id = validate_and_sanitize($data['rateuserid'], "integer");
$rating = validate_and_sanitize($data['rating'], "integer");

try {
    // Check if a rating already exists for the given user and rating user
    $stmt = $pdo->prepare("SELECT * FROM rating WHERE user_id = :user_id AND rating_user_id = :rating_user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':rating_user_id', $rating_user_id);
    $stmt->execute();

    // If a rating exists, update it
    if ($stmt->rowCount() > 0) {
        $stmt = $pdo->prepare("UPDATE rating SET rating = :rating WHERE user_id = :user_id AND rating_user_id = :rating_user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':rating_user_id', $rating_user_id);
        $stmt->bindParam(':rating', $rating);
        $stmt->execute();

        $response = ['success' => true, 'message' => 'Rating updated successfully'];
    } else {
        // Otherwise, insert a new rating
        $stmt = $pdo->prepare("INSERT INTO rating (user_id, rating_user_id, rating) VALUES (:user_id, :rating_user_id, :rating)");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':rating_user_id', $rating_user_id);
        $stmt->bindParam(':rating', $rating);
        $stmt->execute();

        $response = ['success' => true, 'message' => 'Rating saved successfully'];
    }

    $pdo = null; // Close the database connection
    sendJson($response);
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError('Database error: ' . $e->getMessage());
}

?>