<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST', 'GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Check if the 'grid' property exists in the received data
if (!isset($data['grid']) || !is_array($data['grid'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing or invalid grid property in JSON.");
    exit;
}



// Check if 'prod' and 'cat' are set
if (isset($_GET['prod']) && isset($_GET['cat'])) {
    // Initialize other variables with null if not set
    $product = validate_and_sanitize($_GET['prod'], "text");
    $categoryID = validate_and_sanitize($_GET['cat'], "integer");

    // Construct product table name
    $product_table = $product;

    // Prepare to gather user counts for each grid cell
    $results = [];

    try {
        // Base SQL query
        $sql_query = "SELECT COUNT(*) as product_count, 
                     COALESCE(SUM(p.latitude), 0) as lat_sum, 
                     COALESCE(SUM(p.longitude), 0) as lng_sum 
              FROM products AS p
              JOIN users AS u ON p.user_id = u.id";

        // Add conditional join for specific product types
        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            $sql_query .= " LEFT JOIN pass_set ps ON p.id = ps.product_id";

        }

        // Add the WHERE clause
        $sql_query .= " WHERE p.latitude BETWEEN :minLat AND :maxLat
                        AND p.longitude BETWEEN :minLng AND :maxLng
                        AND p.category_id = :categoryID
                        AND p.product_type = :productType
                        AND p.deleted = 0";

          
        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            if(isset($_GET['hasclipcard']) && $_GET['hasclipcard'] == "true") {
                $sql_query .= " AND p.hasclipcard = 1";
            }

        }
        

        // Ensure the condition for product types is consistent
        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            $sql_query .= " AND ps.product_id IS NOT NULL";
        }

        // Handle price range filter if provided
        if (isset($_GET['prmin']) && isset($_GET['prmax'])) {
            $sql_query .= " AND p.price BETWEEN :prmin AND :prmax";
        }

        // Handle duration filter for certain product types
        if (($product === "trainingpass" || $product === "onlinetraining") && isset($_GET['dura'])) {
            $sql_query .= " AND p.duration = :duration";
        }

        // Handle gender filter if provided
        if (isset($_GET['gen'])) {
            $sql_query .= " AND u.gender = :gender";
        }

        // Prepare the statement once
        $stmt = $pdo->prepare($sql_query);

        // Iterate over each grid cell
        foreach ($data['grid'] as $grid) {
            if (!isset($grid['latmin'], $grid['latmax'], $grid['lngmin'], $grid['lngmax'])) {
                continue; // Skip invalid grid cells
            }

            // Clear previous bound values
            $stmt->closeCursor();

            // Bind the parameters for the current grid cell dynamically
            $stmt->bindValue(':minLat', $grid['latmin'], PDO::PARAM_STR);
            $stmt->bindValue(':maxLat', $grid['latmax'], PDO::PARAM_STR);
            $stmt->bindValue(':minLng', $grid['lngmin'], PDO::PARAM_STR);
            $stmt->bindValue(':maxLng', $grid['lngmax'], PDO::PARAM_STR);
            $stmt->bindValue(':categoryID', $categoryID, PDO::PARAM_INT);
            $stmt->bindValue(':productType', $product_table, PDO::PARAM_STR);

            // Bind optional filters
            if (isset($_GET['prmin']) && isset($_GET['prmax'])) {
                $stmt->bindValue(':prmin', validate_and_sanitize($_GET['prmin'], "integer"), PDO::PARAM_INT);
                $stmt->bindValue(':prmax', validate_and_sanitize($_GET['prmax'], "integer"), PDO::PARAM_INT);
            }

            if (isset($_GET['dura'])) {
                $stmt->bindValue(':duration', validate_and_sanitize($_GET['dura'], "integer"), PDO::PARAM_INT);
            }

            if (isset($_GET['gen'])) {
                $stmt->bindValue(':gender', validate_and_sanitize($_GET['gen'], "text"), PDO::PARAM_STR);
            }

            // Execute the query
            $stmt->execute();

            // Fetch the count and sums
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if $result is false, indicating a failed fetch
            if ($result === false) {
                // Set counts and sums to 0
                $result = [
                    'product_count' => 0,
                    'lat_sum' => 0,
                    'lng_sum' => 0
                ];
            }

            // Append the result to the results array
            $results[] = [
                'grid' => $grid,
                'product_count' => $result['product_count'],
                'lat_sum' => $result['lat_sum'],
                'lng_sum' => $result['lng_sum']
            ];
        }

        // Close the connection
        $pdo = null;

        // Return the results as JSON
        sendJson($results);

    } catch (PDOException $e) {
        // Handle PDOException
        error_log("PDO Exception: " . $e->getMessage());
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }
} else {
    http_response_code(400); // Bad Request
    sendJsonError("Missing or invalid filter property in JSON.");
    exit;
}
?>