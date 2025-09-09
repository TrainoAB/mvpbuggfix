<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Check if minlat, minlng, maxlat, maxlng, cat, and prod are set
if (isset($_GET['minlat'], $_GET['minlng'], $_GET['maxlat'], $_GET['maxlng'], $_GET['cat'], $_GET['prod'])) {
    try {
        // Get latitude and longitude from GET request
        $minLat = $_GET['minlat'];
        $maxLat = $_GET['maxlat'];
        $minLng = $_GET['minlng'];
        $maxLng = $_GET['maxlng'];

        $product = validate_and_sanitize($_GET['prod'], "text");
        $categoryID = validate_and_sanitize($_GET['cat'], "integer");

        // Construct product table name
        $product_table = $product;

        $prmin = isset($_GET['prmin']) ? validate_and_sanitize($_GET['prmin'], "integer") : null;
        $prmax = isset($_GET['prmax']) ? validate_and_sanitize($_GET['prmax'], "integer") : null;
        $dura = isset($_GET['dura']) ? validate_and_sanitize($_GET['dura'], "integer") : null;
        $gen = isset($_GET['gen']) ? validate_and_sanitize($_GET['gen'], "gender") : null;

        // Prepare SQL query to retrieve products within the specified bounding box
        $sql_query = "SELECT p.id AS product_id, 
            p.latitude, 
            p.longitude, 
            p.price, 
            u.id AS user_id, 
            u.thumbnail, 
            u.coverimage,
            u.firstname, 
            u.lastname,
            u.alias,
            (YEAR(CURDATE()) - YEAR(STR_TO_DATE(AES_DECRYPT(u.personalnumber, :key), '%y%m%d')) - 
                (DATE_FORMAT(CURDATE(), '00-%m-%d') < DATE_FORMAT(STR_TO_DATE(AES_DECRYPT(u.personalnumber, :key), '%y%m%d'), '00-%m-%d'))) AS age,
            (
                    SELECT ROUND(AVG(r.rating), 1)
                    FROM rating r
                    WHERE r.rating_user_id = u.id
                ) AS rating
        FROM products p 
        LEFT JOIN users u ON p.user_id = u.id 
        LEFT JOIN rating r ON u.id = r.user_id";

        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            $sql_query .= " LEFT JOIN pass_set ps ON p.id = ps.product_id";
        }

        $sql_query .= " WHERE p.latitude BETWEEN :minLat AND :maxLat 
        AND p.longitude BETWEEN :minLng AND :maxLng
        AND p.category_id = :categoryID
        AND p.product_type = :productType
        AND p.deleted = 0
        AND u.id IS NOT NULL";

        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            if(isset($_GET['hasclipcard']) && $_GET['hasclipcard'] == "true") {
                $sql_query .= " AND p.hasclipcard = 1";
            }

        }

        // Initialize query parameters array
        $query_params = [
            ':minLat' => $minLat,
            ':maxLat' => $maxLat,
            ':minLng' => $minLng,
            ':maxLng' => $maxLng,
            ':categoryID' => $categoryID,
            ':productType' => $product_table
        ];

        if ($product_table === "trainingpass" || $product_table === "onlinetraining") {
            $sql_query .= " AND ps.product_id IS NOT NULL AND ps.user_deleted = 0";
        }

        // Handle price range filter if prmin and prmax are provided
        if (isset($_GET['prmin']) && isset($_GET['prmax'])) {
            $sql_query .= " AND p.price BETWEEN :prmin AND :prmax";
            $query_params[':prmin'] = $prmin;
            $query_params[':prmax'] = $prmax;
        }

        // Add additional conditions based on product type
        if (($product === "trainingpass" || $product === "onlinetraining") && isset($_GET['dura'])) {
            $sql_query .= " AND p.duration = :duration";
            $query_params[':duration'] = $dura;
        }

        // Handle gender filter if provided
        if (isset($_GET['gen'])) {
            $sql_query .= " AND u.gender = :gender";
            $query_params[':gender'] = $gen;
        }

        // Group by product to avoid single result due to aggregation
        $sql_query .= " GROUP BY p.id";


        $stmt = $pdo->prepare($sql_query);

        // Bind parameters dynamically
        foreach ($query_params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->bindParam(":key", $encryptionKey);

        // Execute the statement
        $stmt->execute();

        // Fetch all matching products and their associated users
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Prepare final response structure
        $response = [
            'product_table' => $product_table,
            'results' => $results,
        ];

        $pdo = null;
        // Return data as JSON
        sendJson($response);

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }
} else {
    // If minlat, minlng, maxlat, maxlng, cat, or prod is not set, return an error message
    sendJsonError('Latitude, longitude, category, or product parameters are missing.');
}

?>