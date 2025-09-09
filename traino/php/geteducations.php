<?php 

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

if(isset($_GET['user_id'])) {
    $user_id = validate_and_sanitize($_GET['user_id'], "integer");

    try {
        $sql = "SELECT * FROM user_education WHERE user_id = :user_id";

        // Prepare and execute the SQL statement
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        // Fetch the results
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if the update was successful
        if ($stmt->rowCount() > 0 && !empty($results)) {
            sendJson($results);
        } else {
            sendJsonError('No educations found.');
        }

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }

} else {
    http_response_code(400);
    sendJsonError("Missing user_id parameter.");
}

// Can easily add logic for getting all users educations here.

?>