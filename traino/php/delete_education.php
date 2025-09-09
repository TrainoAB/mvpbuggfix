<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['DELETE']);
// Session-based authentication instead of token-based
// $apikey = API_KEY;
// validateAuthHeader($apikey);

if(isset($_GET["id"])) {
    $id = $_GET["id"];

    // First validate session and get user info
    // $session = validateSessionID($pdo, null, false);
    $user_id = $session['user_id'];

    // Verify that the education belongs to the authenticated user
    $checkStmt = $pdo->prepare("SELECT user_id FROM user_education WHERE id = :id");
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    $education = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$education) {
        sendJsonError("Education not found.");
    }

    if ($education['user_id'] != $user_id) {
        sendJsonError("You don't have permission to delete this education.");
    }

    // Prepare the SQL statement
    $sql = "DELETE FROM user_education WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    // Bind parameters
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    // Execute the SQL statement
    if ($stmt->execute()) {
        // Check if rows were affected
        if ($stmt->rowCount() > 0) {
            // Insert successful
            $response = [
                "success" => "Education deleted successfully.",
                "education_id" => $id
            ];
        
            $pdo = null;
            sendJson($response);
        } else {
            // No rows affected, handle error
            sendJsonError("Error: Failed to delete education. No rows affected.");
        }
    } else {
        // SQL execution failed, handle error
        sendJsonError("Error: SQL execution failed - " . implode(" - ", $stmt->errorInfo()));
    }

} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Education ID is missing.');
}

?>