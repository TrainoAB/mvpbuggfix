<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Assume incoming data is JSON and decode it
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if the received data is valid JSON
    if ($data === null) {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid JSON received");
        exit;
    }

    error_log("Received data: " . print_r($data, true));

    try {
        // Validate and sanitize inputs
        $payment_intent_id = validate_and_sanitize($data['payment_intent_id'], "text");

        // Prepare SQL statement to update the status
        $sql = "UPDATE transactions SET status = 'completed' WHERE payment_intent_id = :payment_intent_id";

        // Prepare the statement
        $stmt = $pdo->prepare($sql);

        // Bind parameters
        $stmt->bindParam(':payment_intent_id', $payment_intent_id, PDO::PARAM_STR);

        // Execute the statement
        $stmt->execute();

        // Check if any row was updated
        if ($stmt->rowCount() > 0) {
            // Send success response
            $response = ['success' => true, 'message' => "Transaction status updated successfully."];
            sendJson($response);
        } else {
            // No rows updated, send error response
            http_response_code(404); // Not Found
            sendJsonError("No transaction found with the provided payment_intent_id.");
        }

        // Close the PDO connection
        $pdo = null;
    } catch (PDOException $e) {
        // Handle database errors
        error_log('Database error: ' . $e->getMessage());
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
    }
}
