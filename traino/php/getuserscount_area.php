<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Check if minlat, minlng, maxlat, and maxlng are set
if(isset($_GET['minlat'], $_GET['minlng'], $_GET['maxlat'], $_GET['maxlng'])) {

    // Get latitude and longitude from GET request
    $minLat = isset($_GET['minlat']) ? validate_and_sanitize($_GET['minlat'], "float") : null;
    $maxLat = isset($_GET['maxlat']) ? validate_and_sanitize($_GET['maxlat'], "float") : null;
    $minLng = isset($_GET['minlng']) ? validate_and_sanitize($_GET['minlng'], "float") : null;
    $maxLng = isset($_GET['maxlng']) ? validate_and_sanitize($_GET['maxlng'], "float") : null;

    try {
        // SQL query to retrieve the count of users within the specified bounding box
        $sql = "SELECT COUNT(*) as user_count FROM users
                WHERE latitude BETWEEN :minLat AND :maxLat
                  AND longitude BETWEEN :minLng AND :maxLng";

        // Prepare the statement
        $stmt = $pdo->prepare($sql);

        // Bind the parameters
        $stmt->bindParam(':minLat', $minLat);
        $stmt->bindParam(':maxLat', $maxLat);
        $stmt->bindParam(':minLng', $minLng);
        $stmt->bindParam(':maxLng', $maxLng);

        // Execute the statement
        $stmt->execute();

        // Fetch all matching users
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $pdo = null;
        // Return user data as JSON
        sendJson($users);

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }

} else {
    // If minlat, minlng, maxlat, or maxlng is not set, return an error message
    sendJsonError('Latitude and longitude parameters are missing.');
}


?>