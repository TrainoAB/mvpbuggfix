<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
// Session-based authentication instead of token-based
// $apikey = API_KEY;
// validateAuthHeader($apikey);

// Get the raw POST data
$data = json_decode(file_get_contents('php://input'), true);

if(isset($data["id"]) && isset($data["user_id"])) {
    $id = $data["id"];
    $userId = $data["user_id"];

    // validateSessionID($pdo, $userId, false);

    // Prepare the SQL statement
    $sql = "DELETE FROM user_train_categories WHERE category_id = :id AND user_id = :user_id";

    $stmt = $pdo->prepare($sql);

    // Bind parameters
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    // Execute the SQL statement
    if ($stmt->execute()) {
        // Check if rows were affected
        if ($stmt->rowCount() > 0) {
            // Insert successful
            $response = [
                "success" => "User sport deleted successfully.",
                "category_id" => $id,
                "user_id" => $userId,
            ];
        
            $pdo = null;
            sendJson($response);
        } else {
            // No rows affected, handle error
            sendJsonError("Error: Failed to delete user sport. No rows affected.");
        }
    } else {
        // SQL execution failed, handle error
        sendJsonError("Error: SQL execution failed - " . implode(" - ", $stmt->errorInfo()));
    }

} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Category ID is missing.');
}

?>