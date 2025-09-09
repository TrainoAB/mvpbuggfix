<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Check if user_id is set
if (isset($_GET['id'])) {
    // Get user_id from GET request
    $user_id = isset($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;

    // Prepare the response object
    $response = [];

    try {
   // Fetch data for the user's bought products
    $stmt = $pdo->prepare("
        SELECT p.*, c.category_name, u.firstname, u.lastname, u.alias AS trainer_alias
        FROM user_bought_products ubp
        INNER JOIN products p ON ubp.product_id = p.id
        INNER JOIN categories c ON p.category_link = c.category_link
        INNER JOIN users u ON p.user_id = u.id
        WHERE ubp.user_id = :user_id
        AND ubp.product <> 'clipcard'
    ");
    $stmt->execute(['user_id' => $user_id]);
    $userProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $pdo->prepare("
        SELECT uc.id AS clipcard_id, 
            uc.user_id AS clipcard_userid, 
            uc.clipcard_amount AS clipcard_clipcard_amount, 
            p.*, 
            u.firstname, 
            u.lastname
        FROM user_clipcards uc
        LEFT JOIN products p ON uc.product_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE uc.user_id = :user_id
    ");
    $stmt2->execute(['user_id' => $user_id]);
    $userClipcards = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    if ($userProducts) {
        // Prepare the response as an associative array

        $response = [
            'user_id' => $user_id,
            'products' => $userProducts,
            'clipcards' => $userClipcards
        ];
    } else {
        // If no products found, return an empty array
        $response = [
            'user_id' => $user_id,
            'products' => []
        ];
    }
    } catch (PDOException $e) {
        sendJsonError($e->getMessage());
    }

    // Send the JSON response
    $pdo = null;
    sendJson($response);

} else {
    // If user_id is not set, return an error message
    sendJsonError('User ID is missing.');
}


?>