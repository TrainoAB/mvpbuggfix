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
        $trainee_id = validate_and_sanitize($data['trainee_id'], "integer");
        $product_id = validate_and_sanitize($data['booking']['product_id'], "text");
        $trainer_id = validate_and_sanitize($data['booking']['trainer_id'], "integer");
        $payment_intent_id = validate_and_sanitize($data['payment_intent_id'], "text");
        $payment_method = validate_and_sanitize($data['payment_method'], "text");

        // $rrule = json_encode($data['booking']['rrule'], true);
        error_log("payment_intent_id: " . $payment_intent_id);

        // Handle date and time
        $start = $data['booking']['start']; // Ensure $start is defined
        $newdatestart = new DateTime($start);
        $booked_date = $newdatestart->format('Y-m-d');

        // Prepare SQL statement
        $sql = "INSERT INTO transactions (trainee_id, product_id, trainer_id, booked_date, payment_intent_id, payment_method)
                VALUES (:trainee_id, :product_id, :trainer_id, :booked_date, :payment_intent_id, :payment_method)";

        // Prepare the statement
        $stmt = $pdo->prepare($sql);

        // Bind parameters
        $stmt->bindParam(':trainee_id', $trainee_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        // $stmt->bindParam(':rrule', $rrule, PDO::PARAM_STR);
        $stmt->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
        $stmt->bindParam(':payment_intent_id', $payment_intent_id, PDO::PARAM_STR);
        $stmt->bindParam(':payment_method', $payment_method, PDO::PARAM_STR);

        // Execute the statement
        $stmt->execute();

        // Close the PDO connection
        $pdo = null;

        // Send success response
        $response = ['success' => true, 'message' => "Booking saved successfully."];
        sendJson($response);
    } catch (PDOException $e) {
        // Handle database errors
        error_log('Database error: ' . $e->getMessage());
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
    }
}
