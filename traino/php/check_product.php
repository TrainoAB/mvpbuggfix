<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

try {
   
    // Prepare the SQL statement with placeholders
    $sql = "SELECT * 
        FROM products
        WHERE product_type = :type
        AND category_id = :cat
        AND duration = :dur";
    // Prepare the statement
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':type', $data['product'], PDO::PARAM_STR);
    $stmt->bindParam(':cat', $data['category_id'], PDO::PARAM_STR);
    $stmt->bindParam(':dur', $data['duration'], PDO::PARAM_STR);

    // Execute the statement
    $stmt->execute();
    // Fetch the result
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $pdo = null;
    
    // Optionally, you can check if any rows were affected
    if ($result) {
            sendJsonError("Already exists");
    } else {
        $response = ["success" => "Product does not exist"];
        sendJson($response); 
    }

    

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}

?>