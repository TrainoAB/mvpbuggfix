<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
}


// Check if the 'grid' property exists in the received data
if (!isset($data['grid']) || !is_array($data['grid'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing or invalid grid property in JSON.");
}
// Prepare to gather user counts for each grid cell
$results = [];

try {
    // SQL query to retrieve the count of users within the specified bounding box
    $sql = "SELECT COUNT(*) as user_count, 
                   COALESCE(SUM(latitude), 0) as lat_sum, 
                   COALESCE(SUM(longitude), 0) as lng_sum 
            FROM users
            WHERE latitude BETWEEN :minLat AND :maxLat
              AND longitude BETWEEN :minLng AND :maxLng";

    // Prepare the statement once
    $stmt = $pdo->prepare($sql);

    // Iterate over each grid cell
    foreach ($data['grid'] as $grid) {
        if (!isset($grid['latmin'], $grid['latmax'], $grid['lngmin'], $grid['lngmax'])) {
            continue; // Skip invalid grid cells
        }

        // Bind the parameters for the current grid cell
        $latmin = isset($grid['latmin']) ? validate_and_sanitize($grid['latmin'], "float") : null;
        $latmax = isset($grid['latmax']) ? validate_and_sanitize($grid['latmax'], "float") : null;
        $lngmin = isset($grid['lngmin']) ? validate_and_sanitize($grid['lngmin'], "float") : null;
        $lngmax = isset($grid['lngmax']) ? validate_and_sanitize($grid['lngmax'], "float") : null;

        // Execute the statement
        $stmt->execute();

        // Fetch the count and sums
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // Append the result to the results array
        $results[] = [
            'grid' => $grid,
            'user_count' => $result['user_count'],
            'lat_sum' => $result['lat_sum'],
            'lng_sum' => $result['lng_sum']
        ];
    }

    $pdo = null;
    // Return the results as JSON
    sendJson($results);

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}


?>