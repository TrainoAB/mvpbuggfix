<?php
// Not using anymore i think...
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);


// Check if lat, lng, and radius are set
if(isset($_GET['lat'], $_GET['lng'], $_GET['radius'])) {

    // Get latitude, longitude, and radius from GET request
    $lat = isset($_GET['lat']) ? validate_and_sanitize($_GET['lat'], "float") : null;
    $lng = isset($_GET['lng']) ? validate_and_sanitize($_GET['lng'], "float") : null;

    $radius = isset($_GET['radius']) ? validate_and_sanitize($_GET['radius'], "integer") : null;

try {
    // Example SQL query to retrieve users within a certain radius
    $sql = "SELECT id, hourly_price, latitude, longitude, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM users
        HAVING distance <= ?";

    // Example parameters: latitude, longitude, radius
    $params = array($lat, $lng, $lat, $radius);


    // Execute the query and fetch users
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
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
    // If lat, lng, or radius is not set, return an error message
    sendJsonError('Latitude, longitude, or radius is missing.');
}


?>