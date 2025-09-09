<?php 

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

try {
    $sql = "SELECT * FROM user_files ORDER BY uploaded_at DESC";
    
    // Prepare and execute the SQL statement
    $stmt = $pdo->prepare($sql);
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

?>