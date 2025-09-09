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

// Check if the 'email' and 'password' properties exist in the received data
if (!isset($data['hashkey'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}


try {
   // Sanitize and validate email
    $email = isset($data['email']) ? validate_and_sanitize($data['email'], "email") : null;

    // Sanitize and validate hashkey (assuming it's 32 characters long alphanumeric)
    $hashkey = isset($data['hashkey']) ? validate_and_sanitize($data['hashkey'], "text") : null;

    // Sanitize password (assuming it's already validated separately or directly hashed)
    $passwordData = isset($data['password']) ? trim(validate_and_sanitize($data['password'], "password")) : null;

    $password = password_hash($passwordData, PASSWORD_DEFAULT);

    // Generate new hashkey for email confirmation (optional)
    $newhashkey = generateEmailConfirmationHash($email);

    // Prepare the SQL statement to retrieve the hashed password from the users table
    $sql = "SELECT hashkey FROM users WHERE email = AES_ENCRYPT(:email, :key)";

    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();

    // Fetch the result
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {

     $fetchedhashkey = $user['hashkey'];

     if($fetchedhashkey === $hashkey) {
        
          // SQL query to update user_password
          $sql = "UPDATE users SET user_password = :password, hashkey = :newhashkey WHERE email = AES_ENCRYPT(:email, :key)";

          // Prepare the statement
          $stmt = $pdo->prepare($sql);

          // Bind parameters
          $stmt->bindParam(':password', $password, PDO::PARAM_STR);
          $stmt->bindParam(':newhashkey', $newhashkey, PDO::PARAM_STR);
          $stmt->bindParam(':email', $email, PDO::PARAM_STR);
          $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);

          // Execute the statement
          $stmt->execute();

          // Check if the update was successful
          if ($stmt->rowCount() > 0) {
              // Prepare success response
              $response = ["success" => "New password set"];

              sendJson($response);
          } else {
              sendJsonError("Password update failed.");
          }
     }

    } else {
      sendJsonError("No user with that email found");
    }

    $pdo = null;
    
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}



?>