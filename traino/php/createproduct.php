<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
// Session-based authentication instead of token-based
$apikey = API_KEY;
validateAuthHeader($apikey);

// Read and decode the incoming JSON data
$rawInput = file_get_contents('php://input');
// error_log("Raw Input: " . $rawInput); // Log the raw input for debugging

$data = json_decode($rawInput, true);
// error_log("Decoded Data: " . print_r($data, true)); // Log the decoded data for debugging

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Mapping of product types with names and required fields
$productTables = [
    "trainprogram" => [
        "required_fields" => ["user_id", "alias", "category_id", "category_link",  "product_sessions", "conversations", "price", "longitude", "latitude", "description", "address", "hasfile", "hasimage"]
    ],
    "dietprogram" => [
        "required_fields" => ["user_id", "alias", "category_id", "category_link", "product_sessions", "conversations", "price", "longitude", "latitude", "description", "address"]
    ],
    "trainingpass" => [
        "required_fields" => ["user_id", "alias", "category_id", "category_link", "duration", "price", "hasclipcard", "description", "longitude", "latitude",  "address"]
    ],
    "onlinetraining" => [
        "required_fields" => ["user_id", "alias", "category_id", "category_link", "duration", "price", "hasclipcard", "description", "longitude", "latitude", "address"]
    ],
    "clipcard" => [
        "required_fields" => ["user_id", "alias", "category_id", "category_link", "product_id_link", "longitude", "latitude", "address"]
    ]
];



// Validate the product type
$productType = $data['product'] ?? null;  // Use null coalescing operator
// error_log("Product Type Received: " . $productType); // Log the product type for debugging

if (!isset($productType) || !isset($productTables[$productType])) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid product type.");
    exit;
}

// Add optional fields for clipcard
if ($productType === 'clipcard') {
    $optionalFields = ["clipcard_5_price", "clipcard_10_price", "clipcard_20_price"];
    foreach ($optionalFields as $field) {
        if (!empty($data[$field])) { // Check that the field is not empty
            $productTables['clipcard']['required_fields'][] = $field;
        }
    }
}

error_log("Creating product for user_id: " . $data['user_id']);
error_log("Authorization header: " . $_SERVER['HTTP_AUTHORIZATION']);

/* 
try {
    // $session = validateSessionID($pdo, $data['user_id'], false);
    //error_log("Session validation successful, session user_id: " . $session['user_id']);
} catch (Exception $e) {
    //error_log("Session validation failed: " . $e->getMessage());
    //throw $e;
}
 */
try {

    // Prepare the SQL statement
    $stmt = $pdo->prepare('SELECT * FROM products WHERE user_id = :user_id AND product_type = :product AND category_id = :category AND duration = :duration AND deleted = 0');
    $stmt->bindParam(':user_id', $data['user_id']);
    $stmt->bindParam(':product', $data['product']);
    $stmt->bindParam(':category', $data['category_id']);
    $stmt->bindParam(':duration', $data['duration']);
    // Execute the query
    $stmt->execute();

    // Fetch all results as an associative array
    $results = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($results != null) {
        // Prepare error response
        $response = ["error" => "Product already exists"];
        sendJson($response);
    }
} catch (PDOException $e) {
    // Handle the error
    sendJsonError("Error: " . $e->getMessage());
}


// Function to generate a pseudo-UUID
function generateUUID()
{
    // Generate random segments
    $segment1 = substr(md5(uniqid('', true)), 0, 8);
    $segment2 = substr(md5(uniqid('', true)), 0, 8);
    $segment3 = substr(md5(uniqid('', true)), 0, 8);
    $segment4 = substr(md5(uniqid('', true)), 0, 8);

    // Concatenate segments without hyphens
    $uuid = $segment1 . $segment2 . $segment3 . $segment4;

    return $uuid;
}

// Function to check if UUID already exists in any product table
function isUUIDUnique($uuid, $pdo)
{
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products WHERE product_id = :uuid");
    $stmt->execute(['uuid' => $uuid]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($result['count'] > 0) {
        return false; // Not unique
    }
    return true; // Unique
}

// Generate a unique UUID
$uuid = generateUUID();
while (!isUUIDUnique($uuid, $pdo)) {
    $uuid = generateUUID();
}

// Before processing the required fields, check if 'hasclipcard' is set for the relevant product types
if (($productType === 'trainingpass' || $productType === 'onlinetraining') && !isset($data['hasclipcard'])) {
    $data['hasclipcard'] = false; // Set 'hasclipcard' to 0 if it is not provided
}

// Extract necessary fields from $data (assuming these are available in $data)
$fieldsToInsert = [];

foreach ($productTables[$productType]['required_fields'] as $field) {
    if ($field === 'address') {
        if ($productType === 'trainingpass') {
            if (isset($data['address'])) {
                $fieldsToInsert[$field] = $data['address'];
            } else {
                http_response_code(400); // Bad Request
                sendJsonError("Missing required field: $field.");
                exit;
            }
        } else {
            if (isset($data['user_address']) && !empty($data['user_address'])) {
                $fieldsToInsert[$field] = $data['user_address'];
            } else if (isset($data['address'])) {
                $fieldsToInsert[$field] = $data['address'];
            } else {
                http_response_code(400); // Bad Request
                sendJsonError("Missing required field: $field.");
                exit;
            }
        }
    } elseif ($field === 'longitude' || $field === 'latitude') {
        $dataField = "user_" . $field;
        if ($productType !== 'trainingpass') {
            if (isset($data[$dataField]) && !empty($data[$dataField])) {
                $fieldsToInsert[$field] = $data[$dataField];
            } else {
                http_response_code(400); // Bad Request
                sendJsonError("Missing required field: $dataField.");
                exit;
            }
        } else {
            if (isset($data[$field]) && !empty($data[$field])) {
                $fieldsToInsert[$field] = $data[$field];
            } else {
                http_response_code(400); // Bad Request
                sendJsonError("Missing required field: $field.");
                exit;
            }
        }
    } else {
        // Handling other fields
        if (array_key_exists($field, $data) && $data[$field] !== '') {
            $fieldsToInsert[$field] = $data[$field];
        } else {
            http_response_code(400); // Bad Request
            sendJsonError("Missing required field: $field.");
            exit;
        }
    }
}



try {

    // Adjust the insert SQL statement
    $insertSql = "INSERT INTO products (product_id, product_type, " . implode(", ", array_keys($fieldsToInsert)) . ") ";
    $insertSql .= "VALUES (:product_id, :product_type, :" . implode(", :", array_keys($fieldsToInsert)) . ")";

    $insertStmt = $pdo->prepare($insertSql);
    // Bind parameters, including product_type
    $insertStmt->bindParam(":product_id", $uuid);
    $insertStmt->bindParam(":product_type", $data['product']);
    foreach ($fieldsToInsert as $field => &$value) {
        $insertStmt->bindParam(":$field", $value);
    }

    // Execute the statement
    $insertStmt->execute();

    // Fetch the registered timestamp using lastInsertId
    $lastInsertId = $pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
    $stmt->bindParam(':id', $lastInsertId);
    $stmt->execute();
    $registered = $stmt->fetch();

    // Prepare success response with product_id and registered timestamp
    $response = [
        "success" => "Product created.",
        "product_id" => $registered['id'],
        "registered" => $registered['registered'],
        "product" => $registered
    ];

    $pdo = null; // Close the database connection

    sendJson($response);
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    error_log("SQL Query: " . $insertSql);
    error_log("Error Message: " . $e->getMessage());
    sendJsonError("Database error: " . $e->getMessage());
}