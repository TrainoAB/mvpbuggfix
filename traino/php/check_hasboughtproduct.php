<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Check if user_id is set
if (isset($_GET['id']) && isset($_GET['user_id'])) {
    
  $product_id = validate_and_sanitize($_GET['id'], "integer");
  $user_id = validate_and_sanitize($_GET['user_id'], "integer");

  // Prepare the response object
  $response = [];

  $sql = "SELECT * FROM user_bought_products WHERE user_id = :user_id AND product_id = :product_id";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
  $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
  $stmt->execute();
  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($result) {
    $response = [
      "has_bought" => true
    ];
  } else {
    $response = [
      "has_bought" => false
    ];
  }

  $pdo = null;

  sendJson($response);
} else {
  // Return an error if user_id is not set
  sendJsonError("Product ID and trainer ID must be set");

}
?>