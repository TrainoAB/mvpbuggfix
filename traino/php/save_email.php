<?php
require("encryptkey.php");
require("db.php");
require_once("functions.php");

$encryptionKey = ENCRYPTION_KEY;

header("Access-Control-Allow-Origin: https://traino.nu");


// Prevent direct access to this file
if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) {
    $response = ["error" => "Direct access is forbidden."];
    sendJson($response);
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["email"])) {
    // Retrieve and sanitize the email from the POST data
    $email = validate_and_sanitize($_POST["email"], "email");

    // Check if the email is valid
    if (!isValidEmail($email)) {
        // Invalid email address
        sendJsonError("Email is invalid.");
    }

    try {
        // Prepare the SQL statement to insert the email into the notifyme table
        $sql = "INSERT INTO notifyme (email) VALUES (AES_ENCRYPT(:email, :key))";
        $stmt = $pdo->prepare($sql);

        // Bind the email parameter
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);

        $pdo = null;

        // Execute the statement
        if ($stmt->execute()) {
            // Redirect to the registered.html page
            header("Location: /registered.html"); // Use absolute path
            exit();
            
        } else {
            sendJsonError("An error occured when inserting into database.");
        }



        exit;
    } catch (PDOException $e) {
        // If connection fails or query execution fails, handle the exception
        sendJsonError("Database error: " . $e->getMessage());
    }
}
?>