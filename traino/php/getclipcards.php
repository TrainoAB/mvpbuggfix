<?php 

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

if(isset($_GET['product_id'])) {
  
    $product_id = validate_and_sanitize($_GET['product_id'], "text");
    

try {
        $sql = "SELECT * FROM products WHERE id = :product_id";

        // Prepare and execute the SQL statement
        $selectStmt = $pdo->prepare($sql);
        $selectStmt->bindParam(':product_id', $product_id);
        $selectStmt->execute();

        // Fetch the results
        $results = $selectStmt->fetchAll(PDO::FETCH_ASSOC);

        if($results) {
            $link = $results[0]['id'];

            // Second query: Select all clipcards where product_id_link matches the product_id
            $sql2 = "SELECT * FROM products WHERE product_id_link = :product_id_link";
            $selectStmt2 = $pdo->prepare($sql2);
            $selectStmt2->bindParam(':product_id_link', $link);
            $selectStmt2->execute();

            $results2 = $selectStmt2->fetchAll(PDO::FETCH_ASSOC);
      

        if(isset($_GET['user_id'])) {

            $user_id = validate_and_sanitize($_GET['user_id'], "integer");

            $sql3 = "SELECT * FROM user_clipcards WHERE user_id = :user_id AND product_id = :product_id_link";

            // Prepare and execute the SQL statement
            $selectStmt3 = $pdo->prepare($sql3);
            $selectStmt3->bindParam(':product_id_link', $link);
            $selectStmt3->bindParam(':user_id', $user_id);
            $selectStmt3->execute();

            // Fetch the results
            $results3 = $selectStmt3->fetchAll(PDO::FETCH_ASSOC);

            $pdo = null;

        }
          }

        $response = [
            "product" => $results[0] ?? null, 
            "clipcards" => $results2 ?? null, 
            "bought" => $results3[0] ?? null,    
        ];

        sendJson($response);  // Corrected to send the whole response array

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }

} else {
    http_response_code(400);
    sendJsonError("Missing product_id parameter.");
}


?>