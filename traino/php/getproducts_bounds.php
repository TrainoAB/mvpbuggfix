<?php
// Enable gzip compression if client supports it
if (!ob_start("ob_gzhandler")) {
    ob_start();
}
require_once("apikey.php");
require_once("encryptkey.php");
require_once("db.php");
require_once("functions.php");
require_once("lib/money.php");

validateCorsMethod(['POST', 'GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Get the raw input and decode it
$rawData = file_get_contents('php://input');

// Decode the stringified JSON first
$data = json_decode($rawData, true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Ensure the data is an array and validate its structure
if (!is_array($data)) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON structure");
    exit;
}

// Extract pagination parameters
$categoryid = isset($_GET['cat']) ? (int)$_GET['cat'] : 1;
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, min(1000, (int)$_GET['limit'])) : 100;
$offset = ($page - 1) * $limit;
$queryParts = [];
$params = [];

// Expect bounds under the 'bounds' key
$boundsArray = isset($data['bounds']) && is_array($data['bounds']) ? $data['bounds'] : [];

foreach ($boundsArray as $index => $boundData) {
    // Convert values to numeric types (float or int) before checking
    $latMin = isset($boundData['latMin']) ? (float)$boundData['latMin'] : null;
    $latMax = isset($boundData['latMax']) ? (float)$boundData['latMax'] : null;
    $lngMin = isset($boundData['lngMin']) ? (float)$boundData['lngMin'] : null;
    $lngMax = isset($boundData['lngMax']) ? (float)$boundData['lngMax'] : null;

    // Check if all the required bounds are valid numbers
    if (
        $latMin === null || $latMax === null || $lngMin === null || $lngMax === null ||
        !is_numeric($latMax) || !is_numeric($latMin) ||
        !is_numeric($lngMax) || !is_numeric($lngMin)
    ) {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid bounds data at index $index");
        exit;
    }

    // Build query parts
    $queryParts[] = "(p.latitude <= :latmax$index AND p.latitude >= :latmin$index
                    AND p.longitude <= :lngmax$index AND p.longitude >= :lngmin$index)";

    $params["latmax$index"] = $latMax;
    $params["latmin$index"] = $latMin;
    $params["lngmax$index"] = $lngMax;
    $params["lngmin$index"] = $lngMin;
}

// Add optional product exclusion
$excludeIds = isset($data['excludeIds']) && is_array($data['excludeIds']) ? $data['excludeIds'] : [];
$expandedIds = [];

// Function to expand the compressed ID range
function expandCompressedIds($compressedIds) {
    $expanded = [];
    foreach ($compressedIds as $compressed) {
        if (strpos($compressed, '-') !== false) {
            // If it contains a hyphen, it's a range (e.g., "5-10")
            list($start, $end) = explode('-', $compressed);
            for ($i = (int)$start; $i <= (int)$end; $i++) {
                $expanded[] = $i;
            }
        } else {
            // Otherwise, it's a single ID
            $expanded[] = (int)$compressed;
        }
    }
    return $expanded;
}

// If excludeIds are provided, expand them
if (!empty($excludeIds)) {
    $excludeIds = expandCompressedIds($excludeIds);
}

// Generate the exclusion query
$excludeQuery = '';
if (!empty($excludeIds)) {
    $placeholders = [];
    foreach ($excludeIds as $index => $id) {
        $placeholder = ":excludeId$index";
        $placeholders[] = $placeholder;
        $params["excludeId$index"] = (int)$id;
    }
    $excludeQuery = "AND p.id NOT IN (" . implode(', ', $placeholders) . ")";
}

$currentDate = date('Y-m-d');


try {
    // Build SQL query
    $sql = "SELECT DISTINCT p.id,
        p.*,
        u.firstname,
        u.lastname,
        u.gender,
        u.thumbnail,
        TIMESTAMPDIFF(YEAR, DATE(AES_DECRYPT(u.personalnumber, :key)), CURDATE()) AS age,
        (SELECT ROUND(AVG(r.rating), 1)
         FROM rating r
         WHERE r.rating_user_id = u.id
        ) AS rating
FROM products p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN rating r ON u.id = r.user_id
LEFT JOIN pass_set ps ON ps.product_id = p.id
    AND (p.product_type IN ('trainingpass', 'onlinetraining'))
    AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
WHERE (
        (" . implode(' OR ', $queryParts) . ")
        AND (
            p.product_type NOT IN ('trainingpass', 'onlinetraining')
            OR (ps.id IS NOT NULL AND ps.user_deleted = 0)
        )
    )
    AND p.category_id = :categoryid
    AND p.deleted != 1
    AND u.id IS NOT NULL
    $excludeQuery
ORDER BY p.registered DESC
LIMIT :limit OFFSET :offset";

        // Prepare the statement
    $stmt = $pdo->prepare($sql);

    // Bind the encryption key for AES_DECRYPT
    $stmt->bindValue(':key', $encryptionKey); // Use bindValue instead of bindParam for consistency
    $stmt->bindValue(':currentDate', $currentDate, PDO::PARAM_STR);
    $stmt->bindValue(':categoryid', $categoryid, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    // Bind dynamic parameters (bounds and excludeIds)
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }


    // Execute the query
    $stmt->execute();

    // Fetch results
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countSql = "
SELECT COUNT(*) FROM products p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN pass_set ps ON ps.product_id = p.id
    AND (p.product_type IN ('trainingpass', 'onlinetraining'))
    AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
    AND ps.user_deleted = 0
WHERE (" . implode(' OR ', $queryParts) . ")
AND p.category_id = :categoryid
AND p.deleted != 1
AND u.id IS NOT NULL
";

$countStmt = $pdo->prepare($countSql);

// Bind all same values as above (bounds and :currentDate)
foreach ($params as $key => $value) {
    if (strpos($key, 'excludeId') !== 0) {
        $countStmt->bindValue(":$key", $value);
    }
}

$countStmt->bindValue(':currentDate', $currentDate, PDO::PARAM_STR);
$countStmt->bindValue(':categoryid', $categoryid, PDO::PARAM_INT);
$countStmt->execute();

$totalRows = $countStmt->fetchColumn();
$totalPages = ceil($totalRows / $limit);

    // Add new field for formatted price
    foreach ($products as &$product) {
        if (isset($product['price'])) {
            $product['formatted_price'] = format_sek_from_kr($product['price']);
        } else {
            $product['formatted_price'] = null;
        }
    }

    $pdo = null;

    // Send the fetched data as a JSON response
    sendJson([
    'results' => $products,
    'page' => $page,
    'limit' => $limit,
    'total' => (int)$totalRows,
    'totalPages' => (int)$totalPages
]);

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}
