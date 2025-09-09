<?php 

    // Include PHPMailer classes for sendEmail function
    require 'PHPMailer-master/src/Exception.php';
    require 'PHPMailer-master/src/PHPMailer.php';
    require 'PHPMailer-master/src/SMTP.php';

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;


require_once("errorlog.php");

$log = defined('ERRORLOG') && ERRORLOG === true;


// Prevent direct access to this file
if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) {
    $response = ["error" => "Direct access is forbidden."];
    sendJson($response);
}

function start_custom_session() {

    // Check if a session has not been started yet
    if (session_status() === PHP_SESSION_NONE) {
        // Set session parameters
        ini_set('session.lazy_write', '1');
        ini_set('session.cookie_httponly', 1); // Ensure session cookies are HTTP-only
        ini_set('session.cookie_secure', 1);   // Require secure connections for session cookies
        ini_set('session.cookie_samesite', 'Strict'); // Set SameSite attribute to Strict

        // Set a custom session name
        session_name('myapp_session_id');

        // Set secure session cookie parameters
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => 'traino.nu',
            'secure' => true,  // Ensure your site is fully served over HTTPS
            'httponly' => true,
            'samesite' => 'Strict'
        ]);

        // Start the session and check for errors
        if (!session_start()) {
            error_log("Failed to start session.");
            return false;  // Return false if session could not start
        }

        // error_log("Session started successfully. Session ID: " . session_id());
    } else {
        error_log("Session already active. Session ID: " . session_id());
    }

    // Security checks if session is active
    if (session_status() === PHP_SESSION_ACTIVE) {
        if (!isset($_SESSION['USER_AGENT'])) {
            $_SESSION['USER_AGENT'] = $_SERVER['HTTP_USER_AGENT'];
        } elseif ($_SESSION['USER_AGENT'] !== $_SERVER['HTTP_USER_AGENT']) {
            error_log("User agent mismatch. Destroying session.");
            session_unset();
            session_destroy();
            return false; // User agent changed, session terminated
        }

        if (!isset($_SESSION['IP_ADDRESS'])) {
            $_SESSION['IP_ADDRESS'] = $_SERVER['REMOTE_ADDR'];
        } elseif ($_SESSION['IP_ADDRESS'] !== $_SERVER['REMOTE_ADDR']) {
            error_log("IP address mismatch. Destroying session.");
            session_unset();
            session_destroy();
            return false; // IP address changed, session terminated
        }

        /*

        // Set last activity timestamp to manage session expiration
        if (!isset($_SESSION['LAST_ACTIVITY'])) {
            $_SESSION['LAST_ACTIVITY'] = time();
        }

        // Regenerate session ID periodically (e.g., every 30 minutes)
        if (time() - $_SESSION['LAST_ACTIVITY'] > 1800) {
            $_SESSION['LAST_ACTIVITY'] = time(); // Update last activity time stamp
            if (session_status() === PHP_SESSION_ACTIVE) { // Check if session is active before regenerating
                session_regenerate_id(true); // Regenerate session ID to avoid fixation attacks
                error_log("Session ID regenerated. New ID: " . session_id());
            }
        }
            */
    } else {
        error_log("No active session to secure.");
        return false;
    }

    return true; // Session started or resumed successfully
}


function validateCorsMethod($allowedMethods = ['GET']) {

    // error_log("INCOMING ORIGIN: " . ($_SERVER['HTTP_ORIGIN'] ?? 'NOT SET'));


    // Determine the origin of the request
    $allowedOrigins = array(
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:3000/',
        'https://localhost',
        'https://localhost:3000', // Remove or make a check that it only works for us working on it
        'https://localhost:3000/',
        'https://dev.traino.nu',
        'https://stage.traino.nu',
        'https://stage.traino.nu/',
        'https://prod.traino.nu',
        'https://traino.nu',
        'https://traino.nu/',
    );

    // Get the request origin from the headers
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    
    if ($origin === '') {
        // Om du vill, låt localhost test funka trots inget origin
         $origin = 'http://localhost:3000/'; // eller annan default du vill
    }

    // Check if the request origin is in the list of allowed origins
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    } else {
        // Logga blockering, svara med fel
        error_log("CORS BLOCKED ORIGIN: $origin");
        http_response_code(403);
        sendJsonError("CORS: Origin not allowed");
        exit;
    }

    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: " . implode(', ', $allowedMethods));
    header("Access-Control-Allow-Headers: Content-Type, Authorization");

    // Prevent direct access to this file
    if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) {
        sendJsonError("Server: Direct access is forbidden.");
        exit;
    }

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header("Access-Control-Max-Age: 3600");
        exit;
    }

    // Check if the request method is allowed
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        http_response_code(405); // Method Not Allowed
        sendJsonError("Server: Method is not allowed");
        exit;
    }
}

function validateAuthHeader($apikey) {
    
    // Perform the authorization check
    $headers = apache_request_headers();

    // Check if Authorization header exists
    if (!isset($headers['Authorization'])) {
        http_response_code(401); // Unauthorized
        sendJsonError("Server: Auth Header - Authorization header is missing");
        exit;
    }

    // Retrieve Authorization header
    $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? trim($_SERVER['HTTP_AUTHORIZATION']) : null;

    // Check if "TrainoStarPower" is somewhere in the string
    if (strpos($authHeader, 'TrainoStarPower') === false) {
        http_response_code(401);
        sendJsonError('Server: Auth Header - Invalid authorization header');
        
    }

    // Initialize token
    $token = "";

    // Find the position of "TrainoStarPower"
    $position = strpos($authHeader, 'TrainoStarPower');

    if ($position !== false) {
        // Extract everything after "TrainoStarPower"
        $token = substr($authHeader, $position + strlen('TrainoStarPower'));
    }

    // Validate the extracted API key using a function like validateToken
    if (!validateToken($token, $apikey)) {
        http_response_code(401);
        sendJsonError('Server: Auth Header - Invalid key');
        exit();
    }
}


function validateSessionID($pdo, $user_id = null, $admin = false) {
    // Retrieve Authorization header
    $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? trim($_SERVER['HTTP_AUTHORIZATION']) : null;
    if (!$authHeader) {
        sendJsonError('Server: Invalid Session ID - Missing Authorization header');
    }

    $cookies = [];
    if (isset($_SERVER['HTTP_XCOOKIE'])) {
        parse_str(strtr($_SERVER['HTTP_XCOOKIE'], ['; ' => '&']), $cookies);
        error_log("Parsed cookies from xcookie header: " . print_r($cookies, true));
    } else {
        error_log("No xcookie header received.");
    }

    $enudata_json = $cookies['enudata'] ?? null;

    if ($enudata_json === null) {
        sendJsonError('Server: Missing enudata cookie');
        exit;
    }

    // Decode the JSON inside enudata cookie
    $enudata = json_decode($enudata_json, true);
    if ($enudata === null) {
        sendJsonError('Server: Invalid JSON in enudata cookie');
        exit;
    }

$session_id = $enudata['session_id'] ?? null;
$cookieuser_id = $enudata['id'] ?? null;

if ($session_id === null) {
    sendJsonError('Server: Invalid Session ID - Missing session ID');
}

if ($cookieuser_id === null) {
    sendJsonError('Server: Invalid Cookie User ID - Missing user ID');
}

// Assuming you have $user_id from somewhere (e.g. request parameter)
if ($cookieuser_id != $user_id && $user_id != null) {
    sendJsonError('Server: Invalid User ID - User ID does not match');
}

 /*    // Find the position of "TrainoStarPower"
    $position = strpos($authHeader, 'TrainoStarPower');

    if ($position !== false) {      
        // Extract everything before "TrainoStarPower" as the session ID
        $session_id = substr($authHeader, 0, $position);
        
        error_log("Extracted session_id from auth header: " . $session_id);
        
        if (empty($session_id)) {
            sendJsonError('Server: Invalid Session ID - Missing session ID');
        } 

    } else {
        sendJsonError('Server: Invalid Session ID - Incorrect Auth Header');
    }
*/
    try {
        // Prepare and execute query to find session and user info
        $stmt = $pdo->prepare("
            SELECT us.*, u.roll as role, u.id as user_id
            FROM user_sessions us
            LEFT JOIN users u ON us.user_id = u.id
            WHERE us.session_id = :session_id AND (u.deleted IS NULL OR u.deleted = 0)
        ");
        $stmt->bindParam(':session_id', $session_id);
        $stmt->execute();
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            // Debug: Let's see what sessions actually exist
            $debugStmt = $pdo->prepare("SELECT session_id, user_id, registered FROM user_sessions ORDER BY registered DESC LIMIT 10");
            $debugStmt->execute();
            $allSessions = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Looking for session_id: " . $session_id);
            error_log("Looking for user_id: " . $user_id);
            error_log("Available sessions: " . json_encode($allSessions));
            
            // Also check if session exists for any user
            $checkStmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_id = :session_id");
            $checkStmt->bindParam(':session_id', $session_id);
            $checkStmt->execute();
            $foundSession = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if ($foundSession) {
                error_log("Session ID exists but for different user: " . $foundSession['user_id']);
            } else {
                error_log("Session ID does not exist in database at all");
            }
            
            sendJsonError('Server: Invalid Session ID - No session found');
        }

        // Check if admin validation is required
        if ($admin) {
            $role = $session['role'];
            if ($role !== "admin") {
                sendJsonError('Server: Invalid Session ID - Not admin role');
            }
        }
        
        // Validate user_id if provided
        if ($user_id !== null && $session['user_id'] != $user_id) {
            sendJsonError('Server: Invalid Session ID - User ID does not match');
        }

        // Return the session data for use by calling code
        return $session;
        
    } catch (PDOException $e) {
        // Handle DB connection errors
        sendJsonError("Server: Database error: " . $e->getMessage());
    }
}

function convertAge($personalNumber) {
    try {
        // Ensure $personalNumber is always a string (convert null to empty string)
        $personalNumber = (string) $personalNumber;

        // Validate the personal number format (12 digits)
        if (preg_match('/^(\d{4})(\d{2})(\d{2})(\d{4})$/', $personalNumber, $matches)) {
            // Extract YYYY, MM, DD from personal number
            $birthYear = $matches[1];
            $birthMonth = $matches[2];
            $birthDay = $matches[3];

            // Check if the extracted date components form a valid date
            if (checkdate((int)$birthMonth, (int)$birthDay, (int)$birthYear)) {
                // Create a DateTime object for the birth date
                $birthDate = new DateTime("$birthYear-$birthMonth-$birthDay");

                // Get the current date
                $currentDate = new DateTime();

                // Calculate the age
                return $currentDate->diff($birthDate)->y;
            }
        }

        return null; // Return null if validation fails
    } catch (Exception $e) {
        return null;
    }
}


function validateToken($token, $key) {

    $decryptedToken = decryptToken($token, $key);
    // error_log("Decrypted token: " . $decryptedToken);

    // Split the decrypted token and timestamp
    $parts = explode(':', $decryptedToken);
    // error_log("Parts after explode: " . json_encode($parts));

    if (count($parts) !== 2) {
        // Log detailed information about the error
        error_log("Decrypted token: " . $decryptedToken);
        error_log("Wrong format. Parts: " . json_encode($parts));
        
        return false;
    }

    list($token, $timestamp) = $parts;

        // Validate the timestamp
    $currentTimestamp = time();
    $tokenAge = $currentTimestamp - $timestamp;

    // error_log("Current timestamp: $currentTimestamp");
    // error_log("Token timestamp: $timestamp");
    // error_log("Token age: $tokenAge seconds");

    if ($tokenAge > 1200) { // 20 minutes = 1200 seconds
        error_log("Old token: $tokenAge seconds");
        return false;
    }

    $lettersOnlyToken = preg_replace("/[^a-zA-Z]/", "", $token);
    $numbersOnlyToken = preg_replace("/[^0-9]/", "", $token);

    $lettersOnlyKey = preg_replace("/[^a-zA-Z]/", "", $key);
    $numbersOnlyKey = preg_replace("/[^0-9]/", "", $key);

    if($lettersOnlyToken != $lettersOnlyKey) {
        error_log("Letters dont match", $lettersOnlyToken, $lettersOnlyKey);
        return false;
    }

    // Step 1: Remove 15 characters from start
    $trimmedStart = substr($numbersOnlyToken, 15);
    
    // Step 2: Remove 15 characters from end
    $trimmedEnd = substr($trimmedStart, 0, -15);
    
    // Step 3: Extract first 2 digits as randomtwodigit
    $randomtwodigit = substr($trimmedEnd, 0, 2);
    
    // Step 4: Remove the extracted digits to get leftoverpart
    $leftoverpart = substr($trimmedEnd, 2);
    
    // Step 5: Convert to integers
    $randomtwodigit = (int) $randomtwodigit;
    $leftoverpart = (int) $leftoverpart;
    
    // Step 6: Divide leftoverpart by randomtwodigit
    $result = $leftoverpart / $randomtwodigit;
    
    // Step 7: Check if result equals key
    return ($result == $numbersOnlyKey);
}


function encrypt($text, $key) {
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypted = openssl_encrypt($text, 'aes-256-cbc', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decrypt($encryptedData, $key) {
    // Check if $encryptedData is an array
    if (is_array($encryptedData)) {
        $decryptedData = [];

        foreach ($encryptedData as $encryptedText) {
            if (is_string($encryptedText)) {
                $data = base64_decode($encryptedText);
                if ($data === false) {
                    error_log("Base64 decoding failed for: " . $encryptedText);
                    continue; // Skip to next iteration or handle error
                }
                $iv = substr($data, 0, openssl_cipher_iv_length('aes-256-cbc'));
                $encryptedText = substr($data, openssl_cipher_iv_length('aes-256-cbc'));

                $decrypted = openssl_decrypt($encryptedText, 'aes-256-cbc', $key, 0, $iv);
                if ($decrypted === false) {
                    error_log("Decryption failed for: " . $encryptedText);
                    continue; // Skip to next iteration or handle error
                }

                $decryptedData[] = $decrypted;
            }
        }

        return $decryptedData;
    } elseif (is_string($encryptedData)) {
        $data = base64_decode($encryptedData);
        if ($data === false) {
            error_log("Base64 decoding failed for: " . $encryptedData);
            return null; // Handle base64 decoding failure
        }
        $iv = substr($data, 0, openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedText = substr($data, openssl_cipher_iv_length('aes-256-cbc'));

        $decrypted = openssl_decrypt($encryptedText, 'aes-256-cbc', $key, 0, $iv);
        if ($decrypted === false) {
            error_log("Decryption failed for: " . $encryptedText);
            return null; // Handle decryption failure
        }

        return $decrypted;
    } else {
        // Handle unsupported data type
        error_log("Unsupported data type: " . gettype($encryptedData));
        return null;
    }
}

function decryptToken($encrypted, $key) {
    // Convert the base64 encoded string back to bytes
    $encrypted = base64_decode($encrypted);

    // Extract the salt and IV
    $salt = substr($encrypted, 8, 8);
    $ciphertext = substr($encrypted, 16);

    // Generate the key and IV
    $rounds = 3;
    $data00 = $key . $salt;
    $md5_hash = array();
    $md5_hash[0] = md5($data00, true);
    $result = $md5_hash[0];
    for ($i = 1; $i < $rounds; $i++) {
        $md5_hash[$i] = md5($md5_hash[$i - 1].$data00, true);
        $result .= $md5_hash[$i];
    }
    $key = substr($result, 0, 32);
    $iv  = substr($result, 32, 16);

    // Decrypt
    $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

    return $decrypted;
}

// Check valid email
function isValidEmail($email) {
    $email = strtolower(trim($email));
    // Check if the email address is valid using regular expression
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return true;
    } else {
        return false;
    }
}

// Hash password with salt
function hashPassword($password, $salt) {
    // Hash the password with the salt using bcrypt algorithm
    $hashedPassword = password_hash($password . $salt, PASSWORD_DEFAULT);
    
    return $hashedPassword;
}

// Function to verify password with salt
function verifyPassword($password, $hashedPassword, $salt) {
    // Concatenate the password and salt with a delimiter
    $passwordWithSalt = $password . $salt;
    
    // Hash the input password with the provided salt
    $hashedInputPassword = password_hash($passwordWithSalt, PASSWORD_DEFAULT);
    
    // Compare the hashed input password with the provided hashed password
    if (password_verify($passwordWithSalt, $hashedPassword)) {
        return true; // Passwords match
    } else {
        return false; // Passwords don't match
    }
}

function sendJson($response) {
    header('Content-Type: application/json');
    echo json_encode($response);
    exit(); // Exit script after sending JSON response
}

function sendJsonError(string $errorMessage) {
    $response = ["error" => $errorMessage];
    header('Content-Type: application/json');
    echo json_encode($response);
    exit(); // Exit script after sending JSON response
}

function generateEmailConfirmationHash($email)
{
    // Generate a unique string for the hash using email and current timestamp
    $uniqueString = $email . time();

    // Generate the hash using the unique string
    $hash = password_hash($uniqueString, PASSWORD_DEFAULT);

    // Remove any special characters from the hash
    $cleanedHash = preg_replace('/[^a-zA-Z0-9]/', '', $hash);

    return $cleanedHash;
}

function isEmailExists($email, $pdo, $encryptionKey)
{
    try {
        // Only check for verified emails - this allows re-registration of unverified accounts
        $stmt = $pdo->prepare("SELECT COUNT(*) AS count FROM users WHERE email = AES_ENCRYPT(:email, :key) AND verified = 1");
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if the count is greater than 0 (verified email exists)
        if ($result && $result['count'] > 0) {
            return true;
        } else {
            return false;
        }
    } catch (PDOException $e) {
        // Handle database errors
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

/**
 * Remove unverified accounts for a given email address
 * This allows users to re-register if they never verified their initial account
 */
function removeUnverifiedAccount($email, $pdo, $encryptionKey)
{
    try {
        // Delete unverified accounts with this email
        $stmt = $pdo->prepare("DELETE FROM users WHERE email = AES_ENCRYPT(:email, :key) AND verified = 0");
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        
        $deletedCount = $stmt->rowCount();
        
        if ($deletedCount > 0) {
            error_log("Removed $deletedCount unverified account(s) for email: $email");
        }
        
        return $deletedCount;
    } catch (PDOException $e) {
        // Handle database errors
        error_log("Database error while removing unverified account: " . $e->getMessage());
        return 0;
    }
}

/**
 * Check if there are any unverified accounts for an email address
 */
function hasUnverifiedAccount($email, $pdo, $encryptionKey) {
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) AS count FROM users WHERE email = AES_ENCRYPT(:email, :key) AND verified = 0");
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return ($result && $result['count'] > 0);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}

function sendEmail($to, $subject, $message, $headers = "", $attachment = null) {

    require_once("emailpass.php");

    $emailpass = EMAIL_PASSWORD;

    $mail = new PHPMailer(true);

    $plainTextMessage = strip_tags($message);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'ns15.inleed.net'; // Set the SMTP server to send through
        $mail->SMTPAuth   = true;
        $mail->Username   = 'no-reply@traino.nu'; // SMTP username
        $mail->Password   =  $emailpass; // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // Enable SSL encryption
        $mail->Port       = 465; // SSL port

        // Charset settings
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        // Recipients
        $mail->setFrom('no-reply@traino.nu', 'Traino');
        $mail->addAddress($to); // Add a recipient

        /* Attachments for future
        if($attachment !== null) {
            //$mail->addAttachment('/var/tmp/file.tar.gz'); // Add attachments
            //$mail->addAttachment('/tmp/image.jpg', 'new.jpg'); // Optional name
        }
        */

        // Content
        $mail->isHTML(true); // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $message;
        $mail->AltBody = $plainTextMessage;

        /* Add custom headers
        $mail->addCustomHeader('X-Custom-Header', 'CustomHeaderValue');
        $mail->addCustomHeader('X-Another-Custom-Header', 'AnotherCustomValue');
        */

        if ($mail->send()) {
            $log ? error_log("Mail sent successfully to: $to") : null;
        } else {
            $log ? error_log("Failed to send mail to: $to. Error: " . $mail->ErrorInfo) : null;
        }

        return true;
    } catch (Exception $e) {
        // Optionally log the error message
        $errorMessage = "Mailer Error: " . $mail->ErrorInfo;
        echo $errorMessage; // Show error in browser
        error_log($errorMessage, 3, __DIR__ . "/php_error.log");
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }

  
     /* OLD WAY
    // Set additional headers
    $headers = "From: TRAINO <no-reply@traino.nu>" . "\r\n";
    $headers .= "Reply-To: no-reply@traino.nu\r\n";
    $headers .= "Sender: TRAINO <no-reply@traino.nu>\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit" . "\r\n";


    ini_set('max_execution_time', 2);
    
    // Set SMTP settings
    ini_set("SMTP", "par1.inleed.net");
    ini_set("smtp_port", "465");
    ini_set("sendmail_from", "no-reply@traino.nu");
    ini_set("username", "no-reply@traino.nu");
    ini_set("password", $emailpass);
    // ini_set("mail.add_x_header", "On"); // Add X-Headers for debugging

    // Set the transport layer encryption
    ini_set("smtp_ssl", "ssl");

    // Send the email
    return mail($to, $subject, $message, $headers);
  */
  
}


function validate_and_sanitize($input, $type) {
    if (is_array($input)) {
        // Handle the array case
        $sanitizedArray = [];
        foreach ($input as $key => $value) {
            $sanitizedArray[$key] = validate_and_sanitize($value, $type);
        }
        return $sanitizedArray;
    }

    if ($input === null || $input === '') {
        return null;
    }

    // Trim the input
    $value = trim($input);

    // FIX: Dubbelkolla att $value inte är tom efter trim
    if ($value === '') {
        return null;
    }

    // Define regex patterns and sanitization filters for different types
    $patterns = [
        'email' => [
            'pattern' => '/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,6}$/',
            'filter' => FILTER_SANITIZE_EMAIL
        ],
        'age' => [
            'pattern' => '/^\d{1,3}$/',
            'filter' => FILTER_SANITIZE_NUMBER_INT
        ],
        'phone' => [
            'pattern' => '/^\+?[0-9\s\-]{7,15}$/',
            'filter' => FILTER_SANITIZE_NUMBER_INT
        ],
        'gender' => [
            'pattern' => '/^(male|female|other)$/i',
            'filter' => FILTER_SANITIZE_FULL_SPECIAL_CHARS
        ],
        'boolean' => [
            'pattern' => '/^(true|false|1|0)$/i',
            'filter' => FILTER_VALIDATE_BOOLEAN,
            'flags' => FILTER_NULL_ON_FAILURE
        ],
        'name' => [
            'pattern' => '/^[a-zA-ZÅÄÖÉÚàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+$/u',
            'filter' => FILTER_UNSAFE_RAW
        ],
        'alias' => [
            'pattern' => '/^[\w\s\-.,!?\'åäöèéüû]*$/u',
            'filter' => FILTER_UNSAFE_RAW
        ],
        'text' => [
            'pattern' => '/^[\w\s\-.,!?\'åäöèéüû*`+?!=&%$#@:;"_\/€´]*$/u',
            'filter' => FILTER_UNSAFE_RAW
        ],
        'password' => [
            'pattern' => '/^[\w\-.!,?\'@#$€&%åäöèéüû()\[\]{}*+=^~`|\/:";<>]*$/u',
            'filter' => FILTER_UNSAFE_RAW
        ],
        'integer' => [
            'pattern' => '/^\d+$/',
            'filter' => FILTER_SANITIZE_NUMBER_INT
        ],
        'float' => [
            'pattern' => '/^\d+(\.\d+)?$/',
            'filter' => FILTER_SANITIZE_NUMBER_FLOAT,
            'flags' => FILTER_FLAG_ALLOW_FRACTION
        ],
        'date' => [
            'pattern' => '/^\d{4}-\d{2}-\d{2}$/',
            'filter' => FILTER_SANITIZE_FULL_SPECIAL_CHARS
        ],
        'array' => [
            'pattern' => null,
            'filter' => FILTER_SANITIZE_SPECIAL_CHARS
        ]
    ];

    // Check if the type is valid
    if (!array_key_exists($type, $patterns)) {
        return null;
    }

    try {
        // Validate input against regex if pattern is defined
        if (!empty($patterns[$type]['pattern']) && !preg_match($patterns[$type]['pattern'], $value)) {
            return null;
        }

        // Boolean special case
        if ($type === 'boolean') {
            $booleanValue = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            return $booleanValue;
        }

        // For password: don't alter input, just return trimmed version
        if ($type === 'password') {
            return $value;
        }

        // Sanitize other input
        $sanitized_value = filter_var($value, $patterns[$type]['filter'], $patterns[$type]['flags'] ?? 0);

        return $sanitized_value;
    } catch (Exception $e) {
        return null;
    }
}



function generateUniqueID() {
    $random_string = uniqid('', true); // Generate a unique identifier based on the current time with microseconds
    $random_string .= bin2hex(random_bytes(10)); // Add additional randomness
    
    // Ensure the length is exactly 36 characters
    if (strlen($random_string) < 36) {
        $random_string .= bin2hex(random_bytes(36 - strlen($random_string)));
    }
    
    // Trim to ensure exactly 36 characters
    return substr($random_string, 0, 36);
}

function encryptCookieData($data, $key) {
    $cipher = "aes-256-cbc";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $encrypted = openssl_encrypt($data, $cipher, $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decryptCookieData($encryptedData, $key) {
    $cipher = "aes-256-cbc";
    $data = base64_decode($encryptedData);
    $iv = substr($data, 0, openssl_cipher_iv_length($cipher));
    $encrypted = substr($data, openssl_cipher_iv_length($cipher));
    return openssl_decrypt($encrypted, $cipher, $key, 0, $iv);
}


// Function to fetch pass_set and pass_booked data for a user within a date range
function fetchPassData($pdo, $user_id, $trainer, $encryptionKey){
    $today = date('Y-m-d');
    $ninetyDaysForward = date('Y-m-d', strtotime('+90 days'));

    try {
        // Get pass_set data
        $passSetQuery = "
            SELECT 
                pa.id AS pass_set_id,
                pa.pass_repeat_id,
                pa.rrule,
                pa.exrules,
                pa.startdate,
                pa.enddate,
                pa.intervals,
                pa.singeldayrepeat,
                CASE 
                    WHEN pa.isrepeat = 0 THEN false 
                    WHEN pa.isrepeat = 1 THEN true 
                END AS isrepeat,
                CASE 
                    WHEN pa.autorepeat = 0 THEN false 
                    WHEN pa.autorepeat = 1 THEN true 
                END AS autorepeat,
                pa.registered AS passcreated,
                p.id AS productrow,
                p.product_type,
                p.id AS product_id,
                p.user_id AS pa_userid,
                p.alias AS pa_alias,
                p.price,
                p.latitude,
                p.longitude,
                AES_DECRYPT(p.address, :key) AS address,
                p.type,
                p.duration,
                p.conversations,
                p.product_sessions,
                p.description,
                p.registered AS productcreated,
                c.id AS category_id,
                c.category_link,
                c.category_name,
                c.category_image               
            FROM pass_set pa
            LEFT JOIN products p ON pa.product_id = p.id
            
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE pa.user_id = :user_id
            AND (pa.startdate <= :ninetyDaysForward)
            AND (pa.enddate >= :today OR pa.enddate IS NULL);
        ";
        $passSetStmt = $pdo->prepare($passSetQuery);
        // Bind parameters using bindParam
        $passSetStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $passSetStmt->bindParam(':today', $today, PDO::PARAM_STR); 
        $passSetStmt->bindParam(':ninetyDaysForward', $ninetyDaysForward, PDO::PARAM_STR);
        $passSetStmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR); 

        // Execute the statement
        $passSetStmt->execute();
        $pass_set = $passSetStmt->fetchAll();

        // Decode the intervals field for each pass_set entry and cast isrepeat and autorepeat to boolean
        foreach ($pass_set as &$entry) {
            if (isset($entry['intervals'])) {
                $entry['intervals'] = json_decode($entry['intervals'], true);
            }
             // Decode the rrule JSON, if it exists
            if (isset($entry['rrule'])) {
                $entry['rrule'] = json_decode($entry['rrule'], true);
            }

            // Decode the exrules JSON, if it exists
            if (isset($entry['exrules'])) {
                $entry['exrules'] = json_decode($entry['exrules'], true);
            }

            // Explicitly cast isrepeat and autorepeat to boolean
            $entry['isrepeat'] = (bool) $entry['isrepeat'];
            $entry['autorepeat'] = (bool) $entry['autorepeat'];
        }

        if ($trainer) {
            // Get pass_booked data with join to users, products, and categories
            $passBookedQuery = "
                SELECT pb.*, 
                    u.firstname, 
                    u.lastname, 
                    AES_DECRYPT(u.email, :key) AS email,
                    u.thumbnail, 
                    u.gender,
                    pt.id AS pt_pass_id,
                    pt.product_id AS pt_product_id,
                    pt.user_id AS pt_user_id,
                    pt.alias AS pt_alias,
                    pt.category_id AS pt_category_id,
                    pt.category_link AS pt_category_link,
                    pt.duration AS pt_duration,
                    pt.price AS pt_price,
                    AES_DECRYPT(pt.address, :key) AS pt_address,
                    pt.description AS pt_description,
                    pt.registered AS pt_registered,
                    pt.latitude AS pt_latitude,
                    pt.longitude AS pt_longitude,
                    c.category_name,
                    c.category_image
                FROM pass_booked pb
                LEFT JOIN users u ON pb.user_id = u.id
                LEFT JOIN products pt ON pb.product_id = pt.id
                LEFT JOIN categories c ON pt.category_id = c.id
                WHERE pb.trainer_id = :user_id
                AND pb.booked_date BETWEEN :today AND :ninetyDaysForward;
            ";
            $stmt = $pdo->prepare($passBookedQuery);
            // Bind parameters using bindParam
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':today', $today, PDO::PARAM_STR); 
            $stmt->bindParam(':ninetyDaysForward', $ninetyDaysForward, PDO::PARAM_STR);
            $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);

            // Execute the statement
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Process results to create nested product array
            $processedResults = [];
            foreach ($results as $row) {
                $passId = $row['id'];      // Use the actual 'id' from pass_booked table

                // Initialize the entry if it doesn't exist
                if (!isset($processedResults[$passId])) {
                    $processedResults[$passId] = [
                        'pass_id' => $row['id'],
                        'user_id' => $row['user_id'],
                        'trainer_id' => $row['trainer_id'],
                        'booked_date' => $row['booked_date'],
                        'starttime' => $row['starttime'],
                        'endtime' => $row['endtime'],
                        'rrule' => !empty($row['rrule']) ? json_decode($row['rrule'], true) : null,
                        'paid' => $row['paid'],
                        'canceled' => $row['canceled'],
                        'ispause' => $row['ispause'],
                        // Add other fields from pass_booked as needed
                        'user' => [
                            'firstname' => $row['firstname'],
                            'lastname' => $row['lastname'],
                            'email' => $row['email'],
                            'thumbnail' => $row['thumbnail'],
                            'gender' => $row['gender']
                        ],
                        'product' => []
                    ];
                }

                // Add product details to the products array
                $processedResults[$passId]['product'][] = [
                    'product_id' => $row['pt_product_id'],
                    'user_id' => $row['pt_user_id'],  // Use the user_id from products table
                    'alias' => $row['pt_alias'],      // Use the alias from products table
                    'category_id' => $row['pt_category_id'],
                    'category_link' => $row['pt_category_link'],
                    'category_name' => $row['category_name'],
                    'category_image' => $row['category_image'],
                    'duration' => $row['pt_duration'],
                    'price' => $row['pt_price'],
                    'address' => $row['pt_address'],
                    'description' => $row['pt_description'],
                    'registered' => $row['pt_registered'],
                    'latitude' => $row['pt_latitude'],
                    'longitude' => $row['pt_longitude']
                ];
            }

            // Convert to a non-associative array if necessary
            $finalResults = array_values($processedResults);

            // Prepare the response structure
            $response = [
                'pass_set' => $pass_set,
                'pass_booked' => $finalResults,
            ];
        } else {
            // Get pass_booked data without join to users, products, and categories
            $passBookedQuery = "
                SELECT * FROM pass_booked
                WHERE trainer_id = :user_id
                AND booked_date BETWEEN :today AND :ninetyDaysForward
            ";
            $passBookedStmt = $pdo->prepare($passBookedQuery);
            $passBookedStmt->execute([
                ':user_id' => $user_id,
                ':today' => $today,
                ':ninetyDaysForward' => $ninetyDaysForward
            ]);
            $pass_booked = $passBookedStmt->fetchAll();

            // Prepare the response structure
            $response = [
                'pass_set' => $pass_set,
                'pass_booked' => $pass_booked,
            ];
        }

        return $response;
    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }
}


function checkRateLimit($action, $limit = 5, $interval = 900) { // $interval in seconds (900 seconds = 15 minutes)
    if (!isset($_SESSION['request_times'])) {
        $_SESSION['request_times'] = [];
    }

    if (!isset($_SESSION['request_times'][$action])) {
        $_SESSION['request_times'][$action] = [];
    }

    $currentTime = time();
    $_SESSION['request_times'][$action] = array_filter($_SESSION['request_times'][$action], function($timestamp) use ($currentTime, $interval) {
        return ($currentTime - $timestamp) < $interval;
    });

    if (count($_SESSION['request_times'][$action]) >= $limit) {
        return false;
    }

    $_SESSION['request_times'][$action][] = $currentTime;
    return true;
}



/*
// Usage example for "forgot email" action
$action = 'forgot_email';
$limit = 5;
$interval = 15 * 60; // 15 minutes in seconds

if (!checkRateLimit($action, $limit, $interval)) {
    http_response_code(429); // Too Many Requests
    echo json_encode(['error' => 'Too many requests. Please try again later.']);
    exit;
}

*/




?>