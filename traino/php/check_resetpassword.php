<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Check if the 'username' and 'password' properties exist in the received data
if (!isset($data['email'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing email property in JSON.");
}


try {
    // Decode URI components first
    $emailDecoded = isset($data['email']) ? urldecode($data['email']) : '';
    $hashkeyDecoded = isset($data['hashkey']) ? urldecode($data['hashkey']) : '';

    // Sanitize and validate email and hashkey after decoding
    $email = !empty($emailDecoded) ? validate_and_sanitize($emailDecoded, "email") : null;
    $hashkey = !empty($hashkeyDecoded) ? validate_and_sanitize($hashkeyDecoded, "text") : null; 



    // Prepare the SQL statement to retrieve the hashed password from the users table
    $sql = "SELECT hashkey FROM users WHERE email = AES_ENCRYPT(:email, :key)";

    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    // Fetch the result
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {

     $fetchedhashkey = $user['hashkey'];

     if($fetchedhashkey === $hashkey) {
          // Prepare success response
          $pdo = null;
          $response = ["success" => "User found"];
          sendJson($response);
     } else {
      sendJsonError("No user found");
     }

    } else {
      sendJsonError("No user found");
    }
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}


?>