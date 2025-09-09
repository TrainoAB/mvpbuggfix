<?php

require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

start_custom_session();

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
if (!isset($data['email']) || !isset($data['passwordtrim'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing email or password property in JSON.");
    exit;
}

try {

    $email = isset($data['email']) ? validate_and_sanitize($data['email'], "email") : null;
    $password = isset($data['passwordtrim']) ? trim(validate_and_sanitize($data['passwordtrim'], "password")) : null;

    // Check rate limiting
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (isRateLimited($clientIP, $email, $pdo, $encryptionKey)) {
        sendJsonError("Too many login attempts. Please try again later.");
    }

    // Prepare the SQL statement to retrieve the hashed password from the users table
    $sql = "SELECT id, firstname, lastname, usertype, alias, AES_DECRYPT(user_address, :key) AS user_address, longitude, latitude, user_password, roll, thumbnail, coverimage, verified, stripe_account
            FROM users
            WHERE email = AES_ENCRYPT(:email, :key) AND (deleted IS NULL OR deleted = 0)";

    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':key', $encryptionKey);
    $stmt->execute();

    // Fetch the result
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Extract the hashed password from the result
        $verified = $user['verified'];
        if($verified == 0) {
            sendJsonError("User not verified");
            exit;
        }
        
        $hashedPassword = trim($user['user_password']);
        $user_id = $user['id'];
        $alias = $user['alias'];
        $usertype = $user['usertype'];

        // Decode HTML entities in user_address
        $user_address = validate_and_sanitize($user['user_address'], "text");
        
        $user_longitude = $user['longitude'];
        $user_latitude = $user['latitude'];
        $firstname = $user['firstname'];
        $lastname = $user['lastname'];
        $roll = $user['roll'];
        $thumbnail = $user['thumbnail'];
        $coverimage = $user['coverimage'];
        $stripe_account = $user['stripe_account'];

      


        // Check if the password is null
        if ($hashedPassword === null) {
            sendJsonError("Invalid login credentials.");
            exit;
        }

        if (!empty($password) && !empty($hashedPassword)) {
            $isPasswordCorrect = password_verify($password, $hashedPassword);

            if ($isPasswordCorrect === false) {
                recordFailedAttempt($clientIP, $email, $pdo, $encryptionKey);
                sendJsonError("Incorrect password");
            } else {
                // Regenerate session ID to prevent session fixation attacks
                session_regenerate_id(true);

                // Set user ID session variables
                $_SESSION['user_id'] = $user_id;
                $_SESSION['email'] = $email;

                session_write_close(); // Close the session to prevent blocking

                // Generate a session ID
                $session_id = bin2hex(random_bytes(32));

                // Delete all earlier rows where the email exists
                $deleteSql = "DELETE FROM user_sessions WHERE email = AES_ENCRYPT(:email, :key)";
                $deleteStmt = $pdo->prepare($deleteSql);
                $deleteStmt->bindParam(':email', $email);
                $deleteStmt->bindParam(':key', $encryptionKey);
                $deleteStmt->execute();

                // Insert user ID, email, and session ID into sessions table
                $insertSql = "INSERT INTO user_sessions (user_id, email, session_id) VALUES (:user_id, AES_ENCRYPT(:email, :key), :session_id)";
                $insertStmt = $pdo->prepare($insertSql);
                $insertStmt->bindParam(':user_id', $user_id);
                $insertStmt->bindParam(':email', $email);
                $insertStmt->bindParam(':session_id', $session_id);
                $insertStmt->bindParam(':key', $encryptionKey);
                $insertStmt->execute();

                // Reset failed attempts on successful login
                resetFailedAttempts($clientIP, $email, $pdo, $encryptionKey);

                // Prepare success response
                $response = [
                    "success" => "Password verified.", 
                    "id" => $user_id, 
                    "usertype" => $usertype, 
                    "firstname" => $firstname,
                    "lastname" => $lastname,
                    "roll" => $roll ? $roll : null,
                    "thumbnail" => $thumbnail,
                    "coverimage" => $coverimage,
                    "email" => $email, 
                    "alias" => $alias,
                    "user_address" => $user_address ? $user_address : null,  
                    "user_longitude" => $user_longitude ? $user_longitude : null,
                    "user_latitude" => $user_latitude ? $user_latitude : null,
                    "session_id" => $session_id,
                    "stripe_account" => $stripe_account
                ];

                foreach ($response as $key => $value) {
                    if (is_string($value)) {
                        $response[$key] = mb_convert_encoding($value, 'UTF-8', 'auto');
                    }
                }

                /*
                error_log("Constructed Response: " . print_r($response, true)); // Check array content

                $jsonResponse = json_encode($response);
                error_log("JSON Encoded Response: " . $jsonResponse); // Check JSON encoding

                // Check for errors
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("JSON Encode Error: " . json_last_error_msg());
                } else {
                    error_log("JSON Encoded Response: " . $jsonResponse);
                }
                */

                $pdo = null; // Close the database connection
                 
                sendJson($response);
            } 
        } else {
        // Handle empty password or hashed password
        recordFailedAttempt($clientIP, $email, $pdo, $encryptionKey);
        sendJsonError("Empty password or hashed password!");
    }
    } else {
        recordFailedAttempt($clientIP, $email, $pdo, $encryptionKey);
        sendJsonError("User not found");
    }

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal Server Error
    error_log($e->getMessage()); // Log the error message
    sendJsonError("Database error occurred");
}


// Rate limiting functions
function recordFailedAttempt($clientIP, $email, $pdo, $encryptionKey) {
    $stmt = $pdo->prepare("INSERT INTO login_attempts (ipaddress, email, attempt_time) VALUES (AES_ENCRYPT(:ipaddress, :key), AES_ENCRYPT(:email, :key), NOW())");
    $stmt->execute([':ipaddress' => $clientIP, ':email' => $email, ':key' => $encryptionKey]);
}

function isRateLimited($clientIP, $email, $pdo, $encryptionKey) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM login_attempts WHERE ipaddress = AES_DECRYPT(:ipaddress, :key) AND email = AES_DECRYPT(:email, :key) AND attempt_time > (NOW() - INTERVAL 15 MINUTE)");
    $stmt->execute([':ipaddress' => $clientIP, ':email' => $email, ':key' => $encryptionKey]);
    return $stmt->fetchColumn() >= 5;
}

function resetFailedAttempts($clientIP, $email, $pdo, $encryptionKey) {
    $stmt = $pdo->prepare("DELETE FROM login_attempts WHERE ipaddress = AES_DECRYPT(:ipaddress, :key) AND email = AES_DECRYPT(:email, :key)");
    $stmt->execute([':ipaddress' => $clientIP, ':email' => $email, ':key' => $encryptionKey]);
}

?>