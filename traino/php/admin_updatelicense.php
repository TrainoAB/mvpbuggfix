<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['UPDATE']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// validateSessionID($pdo, null, true);

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

    // Check if the 'accepted' property exist in the received data
    if (!isset($data['accepted'])) {
        http_response_code(400); // Bad Request
        sendJsonError("Missing data property in JSON.");
        exit;
    }

    try {
        // Sanitize and validate data
        $accepted = filter_var($data['accepted'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if (isset($accepted)) {
            // SQL query to update accepted in user_files
            $sql = "UPDATE user_files SET accepted = :accepted WHERE id = :id";
            
            // Prepare the statement
            $stmt = $pdo->prepare($sql);
        
            // Bind parameters
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':accepted', $accepted, PDO::PARAM_BOOL);
        
            // Execute the statement
            $stmt->execute();
        
            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Get user_id from the updated user_files entry
                $sqlGetUserId = "SELECT user_id FROM user_files WHERE id = :id";
                $stmtGetUserId = $pdo->prepare($sqlGetUserId);
                $stmtGetUserId->bindParam(':id', $id, PDO::PARAM_INT);
                $stmtGetUserId->execute();
        
                // Fetch the user_id
                $user = $stmtGetUserId->fetch(PDO::FETCH_ASSOC);
        
                if ($user && isset($user['user_id'])) {
                    $userId = $user['user_id'];
        
                    // Update verified in users table using the user_id
                    $sqlUpdateVerified = "UPDATE users SET verified = :accepted WHERE id = :user_id";
                    $stmtVerified = $pdo->prepare($sqlUpdateVerified);
        
                    // Bind parameters
                    $stmtVerified->bindParam(':user_id', $userId, PDO::PARAM_INT);
                    $stmtVerified->bindParam(':accepted', $accepted, PDO::PARAM_BOOL);
        
                    // Execute the statement for updating verified
                    $stmtVerified->execute();
        
                    // Check if the verified update was successful
                    if ($stmtVerified->rowCount() > 0) {
                        $response = ["success" => "Accepted and verified status updated."];
                    } else {
                        $response = ["success" => "Accepted status updated, but verified update failed."];
                    }
        
                    sendJson($response);
                } else {
                    sendJsonError("User ID not found.");
                }
            } else {
                sendJsonError("Accepted status update failed.");
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
    sendJsonError('License ID is missing.');
}





?>