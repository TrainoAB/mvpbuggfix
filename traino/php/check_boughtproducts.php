<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Check if user_id is set
if (isset($_GET['id']) && isset($_GET['trainer_id'])) {
    // Get user_id from GET request
    $user_id = isset($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;
    $trainer_id = isset($_GET['trainer_id']) ? validate_and_sanitize($_GET['trainer_id'], "integer") : null;

    // Prepare the response object
    $response = [];

    try {
      // Fetch data for the user's bought products
      $stmt = $pdo->prepare("
          SELECT COUNT(ubp.product_id) AS product_count
          FROM user_bought_products ubp
          LEFT JOIN products p ON ubp.product_id = p.id
          WHERE ubp.user_id = :user_id
          AND p.user_id = :trainer_id
      ");

      // Bind the parameters
      $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
      $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);

      // Execute the statement
      $stmt->execute();

      // Fetch the results
      $userProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

      // Fetch data for the user's bought products
      $stmt2 = $pdo->prepare("
          SELECT * FROM rating WHERE user_id = :user_id AND rating_user_id = :trainer_id
      ");

      // Bind the parameters
      $stmt2->bindParam(':user_id', $user_id, PDO::PARAM_INT);
      $stmt2->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);

      // Execute the statement
      $stmt2->execute();

      // Fetch the results
      $rating = $stmt2->fetch(PDO::FETCH_ASSOC);

      // Prepare the response as an associative array
      $productCount = isset($userProducts[0]['product_count']) ? $userProducts[0]['product_count'] : 0;

        // Updated response structure to include product_count directly
        $response = [
            "product_count" => $productCount,
            "user_rated" => $rating,
        ];
  

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