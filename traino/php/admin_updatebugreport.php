<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['UPDATE']);
$apikey = API_KEY;
validateAuthHeader($apikey);

validateSessionID($pdo, null, true);

if(isset($_GET["id"])) {
    $id = $_GET["id"];

    // Assume incoming data is JSON and decode it
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if the received data is valid JSON
    if ($data === null) {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid JSON received");
        exit;
    }

    // Check if the 'completed' property exist in the received data
    if (!isset($data['completed'])) {
        http_response_code(400); // Bad Request
        sendJsonError("Missing data property in JSON.");
        exit;
    }

    try {
        // Sanitize and validate data
        $completed = filter_var($data['completed'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if (isset($completed)) {
            // SQL query to update completed
            $sql = "UPDATE bugreports SET completed = :completed WHERE id = :id";

            // Prepare the statement
            $stmt = $pdo->prepare($sql);

            // Bind parameters
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':completed', $completed, PDO::PARAM_BOOL);

            // Execute the statement
            $stmt->execute();

            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Prepare success response
                $response = ["success" => "Complete status updated."];

                sendJson($response);
            } else {
                sendJsonError("Complete status update failed.");
            }

        } else {
            sendJsonError("No update data found.");
        }

        $pdo = null;
        
    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
    }
} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Bug report ID is missing.');
}





?>