<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);


// Check if email and key parameters are set
if(isset($_GET['email']) && isset($_GET['code'])) {


    $getemail = urldecode($_GET['email']);
    $email = validate_and_sanitize($getemail, "email");
    $key = isset($_GET['code']) ? $_GET['code'] : null;

try {
    // Example SQL query to retrieve the 'confirmed' status by email
    $sql = "SELECT verified FROM users WHERE email = AES_DECRYPT(:email, :key)";

    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();
    $verified = $stmt->fetchColumn();

    if ($verified === '1') {  // Use '1' because fetchColumn returns data as string
        // If confirmed is 1, exit and send success response
        $response = ["success" => "User confirmed successfully."];
        sendJson($response);
        exit; // Important: Exit here to prevent further execution
    } else {
        // Example SQL query to retrieve user details by email and key
        $sql = "SELECT email, hashkey, verified FROM users WHERE CAST(AES_DECRYPT(email, :key) AS CHAR) = :email AND hashkey = :hashkey";

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':hashkey', $key, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user exists
        if ($user) {
            // Generate a new hash key for email confirmation
            $newHashKey = generateEmailConfirmationHash($email);

            // Update the user's hash key and set confirmed to 1
            $updateSql = "UPDATE users SET hashkey = :newHashKey, verified = 1 WHERE CAST(AES_DECRYPT(email, :key) AS CHAR) = :email  AND hashkey = :hashkey";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->bindParam(':newHashKey', $newHashKey, PDO::PARAM_STR);
            $updateStmt->bindParam(':email', $email, PDO::PARAM_STR);
            $updateStmt->bindParam(':hashkey', $key, PDO::PARAM_STR);
            $updateStmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
            $updateStmt->execute();

            // Prepare success response
            $response = ["success" => "User confirmed successfully."];
            
            $pdo = null;
            // Return success response as JSON
            sendJson($response);
        } else {
            // If user does not exist, return an error message
            sendJsonError('User not found.');
        }
    }
} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}

} else {
    // If email and key parameters are not set, return an error message
    sendJsonError('Missing email or key parameters.');
}


?>