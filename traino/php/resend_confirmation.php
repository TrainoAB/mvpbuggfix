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

// Check if the 'email' property exists in the received data
if (!isset($data['email'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing email property in JSON.");
    exit;
}

$email = validate_and_sanitize($data['email'], "email");
$email = strtolower($email);

if(!isValidEmail($email)) {
    sendJsonError("Email not valid.");
    exit;
}

try {
    // Check if there's an unverified account with this email
    $sql = "SELECT id, firstname, lastname, usertype, hashkey FROM users WHERE email = AES_ENCRYPT(:email, :key) AND verified = 0";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // No unverified account found
        sendJsonError("No unverified account found for this email address.");
        exit;
    }

    // Generate a new confirmation hash
    $confirmationHash = generateEmailConfirmationHash($email);
    
    // Update the user's hash key
    $updateSql = "UPDATE users SET hashkey = :hashkey WHERE id = :user_id";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->bindParam(':hashkey', $confirmationHash, PDO::PARAM_STR);
    $updateStmt->bindParam(':user_id', $user['id'], PDO::PARAM_INT);
    $updateStmt->execute();

    // Send the confirmation email
    require("emailtemplate.php");
    
    $encodedEmail = urlencode($email);
    $confirmationHashURL = urlencode($confirmationHash);
    $confirmLink = "https://stage.traino.nu/confirm-email/" . $encodedEmail . "/" . $confirmationHashURL;

    $header = "Verifiera din e-postadress";
    $to = $email;
    $subject = "TRAINO - Verifiera din e-postadress (Skickas igen)";
    
    if ($user['usertype'] === 'trainee') {
        $content = '
        <p>Här är din nya bekräftelselänk för att verifiera din e-postadress:</p>
        <p><a href="' . $confirmLink . '" target="_blank">' . $confirmLink . '</a></p>
        <p>Om länken fortfarande inte fungerar, vänligen kontakta oss för support.</p>
        ';
    } else {
        $content = '
        <p>Här är din nya bekräftelselänk för att verifiera din tränarkonto:</p>
        <p><a href="' . $confirmLink . '" target="_blank">' . $confirmLink . '</a></p>
        <p>Om länken fortfarande inte fungerar, vänligen kontakta oss för support.</p>
        ';
    }
    
    $username = $user['firstname'];    
    $emailTemplate = getEmailTemplate($header, $username, $content);
    
    $emailSent = sendEmail($to, $subject, $emailTemplate, $headers = []);

    if ($emailSent) {
        $response = ["success" => "Confirmation email resent successfully."];
        error_log("Resent confirmation email to: $email");
    } else {
        sendJsonError("Failed to send confirmation email.");
        error_log("Failed to resend confirmation email to: $email");
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
    error_log("Database error in resend_confirmation.php: " . $e->getMessage());
}

$pdo = null;

sendJson($response);
?> 