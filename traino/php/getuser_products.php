<?php

require("apikey.php");
require("db.php");
require_once("functions.php");
require_once("lib/money.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

if (isset($_GET['check']) && $_GET['check'] === 'true' && isset($_GET['id']) && isset($_GET['cat']) && isset($_GET['dur'])) {

    $user_id = $_GET['id'];
    $category = $_GET['cat'];
    $duration = $_GET['dur'];

} elseif (isset($_GET['onlypass']) && $_GET['onlypass'] === 'true' && isset($_GET['id'])) {

    $user_id = isset($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;

    try {

        $stmt = $pdo->prepare("
                SELECT p.*, c.category_name, u.firstname, u.lastname
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.user_id = :user_id
                AND (p.product_type = 'onlinetraining' OR p.product_type = 'trainingpass')
                AND p.deleted = 0
                AND u.id IS NOT NULL
                ORDER BY p.registered DESC;

            ");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add results to the response object
        $response = [
            'count' => count($results),
            'data' => $results,
        ];

        // Format monetary values
        foreach ($response['data'] as &$item) {
            $item['price'] = format_sek_from_kr($item['price']);
        }

      } catch (Exception $e) {
              sendJsonError("Error: " . $e->getMessage());
    }
    // Send the JSON response

    $pdo = null;

    sendJson($response);


} elseif (isset($_GET['alias'])) {
        // Get alias from GET request
    $alias = isset($_GET['alias']) ? validate_and_sanitize($_GET['alias'], "alias") : null;

    // Define the tables and their corresponding product types
    $tables = [
        'product_clipcard' => 'clipcard',
        'product_dietprogram' => 'dietprogram',
        'product_onlinetraining' => 'onlinetraining',
        'product_trainingpass' => 'trainingpass',
        'product_trainprogram' => 'trainprogram',
    ];

    // Prepare the response object
    $response = [];

    try {
    // Fetch data from each table
    foreach ($tables as $table => $productType) {
        $stmt = $pdo->prepare("
            SELECT p.*, c.category_name, u.firstname, u.lastname
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.alias = :alias
            AND p.product_type = :product_type
            AND p.deleted = 0
            AND u.id IS NOT NULL;
        ");
        $stmt->bindParam(':alias', $alias, PDO::PARAM_STR);
        $stmt->bindParam(':product_type', $productType, PDO::PARAM_STR);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add product type to each result
        foreach ($results as &$result) {
            $result['product'] = $productType;
        }

        // Add results to the response object
        $response[$table] = [
            'count' => count($results),
            'data' => $results,
        ];

        // Format monetary values
        foreach ($response[$table]['data'] as &$item) {
            $item['price'] = format_sek_from_kr($item['price']);
        }
    }
      } catch (Exception $e) {
              sendJsonError("Error: " . $e->getMessage());
          }

    // Send the JSON response
    header('Content-Type: application/json');
    sendJson($response);

} else {
    // If alias is not set, return an error message
    sendJsonError('Alias is missing.');
}

?>
