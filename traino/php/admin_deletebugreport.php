<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['DELETE']);
$apikey = API_KEY;
validateAuthHeader($apikey);
validateSessionID($pdo, null, true);

if(isset($_GET["id"])) {
    $id = $_GET["id"];

    // Prepare the SQL statement
    $sql = "DELETE FROM bugreports WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    // Bind parameters
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    // Execute the SQL statement
    if ($stmt->execute()) {
        // Check if rows were affected
        if ($stmt->rowCount() > 0) {
            // Insert successful
            $response = [
                "success" => "Bug report deleted successfully.",
                "report_id" => $id
            ];
        
            $pdo = null;
            sendJson($response);
        } else {
            // No rows affected, handle error
            sendJsonError("Error: Failed to delete bug report. No rows affected.");
        }
    } else {
        // SQL execution failed, handle error
        sendJsonError("Error: SQL execution failed - " . implode(" - ", $stmt->errorInfo()));
    }

} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Bug report ID is missing.');
}

?>