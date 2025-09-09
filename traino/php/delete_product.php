<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");


validateCorsMethod(['POST']);
$apikey = API_KEY;
validateAuthHeader($apikey);


// Read and decode the incoming JSON data
$rawInput = file_get_contents('php://input');

$data = json_decode($rawInput, true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}


$product = $data['product'];
$id = $data['id'];

$link = "";

if($product == "clipcard") {
  $link = $data['product_id_link'];
}

try {
    // Prepare the SQL statement
    $stmt = $pdo->prepare('UPDATE products SET deleted = 1 WHERE id = :id');
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    if ($product === "clipcard") {
        $stmt = $pdo->prepare('UPDATE products SET deleted = 1 WHERE id = :id');
        $stmt->bindParam(':id', $link);
        $stmt->execute();
    }

    if ($product === "trainingpass" || $product === "onlinetraining") {
        $stmt = $pdo->prepare('UPDATE products SET deleted = 1 WHERE product_id_link = :id');
        $stmt->bindParam(':id', $link);
        $stmt->execute();
    }

    $response = ["success" => "Product deleted"];
    $pdo = null;
    sendJson($response);

} catch (Exception $e) {
    sendJsonError("Error: " . $e->getMessage());
}


?>