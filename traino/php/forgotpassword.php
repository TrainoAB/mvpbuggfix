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
if (!isset($data['email'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}

try {
    $email = isset($data['email']) ? validate_and_sanitize($data['email'], "email") : null;

    // Prepare the SQL statement to retrieve the hashed password from the users table
    $sql = "SELECT firstname, hashkey FROM users WHERE email = AES_ENCRYPT(:email, :key)";
    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();

    // Fetch the result
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {

      $confirmationHash = urlencode($user['hashkey']);

      $username = $user['firstname'];

      require("emailtemplate.php");
      
      $encodedEmail = urlencode($email);
        
      $passwordLink = "https://traino.nu/forgot-password/" . $encodedEmail . "/" . $confirmationHash;

      $header = "Återställ ditt lösenord";

      $to = $email;
      $subject = "TRAINO - Återställ ditt lösenord";
      $content = "<p>Klicka på länken för att återställa ditt lösenord:<br><br>
        <a href=\"" . $passwordLink . "\" target=\"_blank\" 
        style=\"word-break: break-all; overflow-wrap: break-word;\">" . $passwordLink . "</a></p>";

      
      $emailTemplate = getEmailTemplate($header, $username, $content);
      
      sendEmail($to, $subject, $emailTemplate, $headers = []);

      // Prepare success response
      $response = ["success" => "Email sent"];

      $pdo = null;
      
      sendJson($response);

    } else {
      sendJsonError("No user with that email found");
    }
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}


?>