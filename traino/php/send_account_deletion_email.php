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

// Check if the 'user_id' property exists in the received data
if (!isset($data['user_id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing user_id property in JSON.");
    exit;
}

try {
    $user_id = isset($data['user_id']) ? validate_and_sanitize($data['user_id'], "int") : null;

    // Prepare the SQL statement to retrieve user information
    $sql = "SELECT firstname, AES_DECRYPT(email, :key) as email FROM users WHERE id = :user_id";
    
    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();

    // Fetch the result
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $username = $user['firstname'];
        $email = $user['email'];

        require("emailtemplate.php");
        
        $header = "Ditt konto har raderats";

        $to = $email;
        $subject = "TRAINO - Kontots bekräftelse";
        $content = "<p>Vi har raderat ditt konto som du begärde.</p>
            <p>Vi kommer verkligen att sakna dig! Du är alltid välkommen tillbaka när du känner dig redo igen.</p>
            <p>Tack för att du var en del av Traino-communityn. Vi hoppas att vi ses igen snart!</p>";

        $emailTemplate = getEmailTemplate($header, $username, $content);
        
        $emailSent = sendEmail($to, $subject, $emailTemplate, $headers = []);

        if ($emailSent) {
            // Prepare success response
            $response = ["success" => "Account deletion confirmation email sent"];
            $pdo = null;
            sendJson($response);
        } else {
            sendJsonError("Failed to send email");
        }

    } else {
        sendJsonError("No user found with that ID");
    }
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}

?> 