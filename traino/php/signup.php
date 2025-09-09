<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
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
if (!isset($data['type'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}

// Sanitize 
$firstname = isset($data['firstname']) ? validate_and_sanitize($data['firstname'], 'name') : null;
$lastname = isset($data['lastname']) ? validate_and_sanitize($data['lastname'], 'name') : null;
$gender = isset($data['gender']) ? validate_and_sanitize($data['gender'], "gender") : null;
$mobilephone = isset($data['mobilephone']) ? validate_and_sanitize($data['mobilephone'], 'phone') : null;
$thumbnail = isset($data['thumbnail']) ? validate_and_sanitize($data['thumbnail'], 'boolean') : 0;
$passwordData = isset($data['password']) ? trim(validate_and_sanitize($data['password'], "password")) : null;
$email = isset($data['email']) ? validate_and_sanitize($data['email'], "email") : null;


// Firstname and lastname to uppercase first letter
$firstname = ucfirst(strtolower($firstname));
$lastname = ucfirst(strtolower($lastname));
$email = strtolower($email);

if(!isValidEmail($email)) {
  sendJsonError("Email not valid.");
}

// Check if the email exists (only verified accounts)
if (isEmailExists($email, $pdo, $encryptionKey)) {
  $response = ["message" => "Email already exists in the database."];
  sendJson($response);
} 

// If there's an unverified account with this email, remove it to allow re-registration
if (hasUnverifiedAccount($email, $pdo, $encryptionKey)) {
  $deletedCount = removeUnverifiedAccount($email, $pdo, $encryptionKey);
  error_log("Cleaned up $deletedCount unverified account(s) for re-registration: $email");
} 

$passwordHash = password_hash($passwordData, PASSWORD_DEFAULT);

$confirmationHash = generateEmailConfirmationHash($email);

/*
try {
    // First, check if the email already exists in the 'users' table
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email);

    $stmt->execute();
    $emailCount = $stmt->fetchColumn();

    if ($emailCount > 0) {
        // More than one email found (unexpected scenario)
        sendJsonError("More than one occurrence of email found in the database.");
        exit;
    } 

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}
    */

// Check type of user to signup
if ($data['type'] === "trainee") {

  $type = "trainee";

  try {


      // Prepare the SQL statement with named placeholders
        $sql = "INSERT INTO users (usertype, firstname, lastname, gender, mobilephone, thumbnail, user_password, email, hashkey) 
                VALUES (:usertype, :firstname, :lastname, :gender, AES_ENCRYPT(:mobilephone, :key), :thumbnail, :user_password, AES_ENCRYPT(:email, :key), :hashkey)";

        // Prepare the statement
        $stmt = $pdo->prepare($sql);

        // Bind the parameters
        $stmt->bindParam(':usertype', $type, PDO::PARAM_STR);
        $stmt->bindParam(':firstname', $firstname, PDO::PARAM_STR);
        $stmt->bindParam(':lastname', $lastname, PDO::PARAM_STR);
        $stmt->bindParam(':gender', $gender, PDO::PARAM_STR);
        $stmt->bindParam(':mobilephone', $mobilephone, PDO::PARAM_STR);
        $stmt->bindParam(':thumbnail', $thumbnail, PDO::PARAM_BOOL);
        $stmt->bindParam(':user_password', $passwordHash, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':hashkey', $confirmationHash, PDO::PARAM_STR);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);

        // Execute the statement
        $stmt->execute();
      
      // Check if insertion was successful
      if ($stmt->rowCount() > 0) {

        $user_id = $pdo->lastInsertId();

        $response = [
            "success" => "User inserted successfully",
            "user_id" => $user_id
        ];
        
        require("emailtemplate.php");
        
        $encodedEmail = urlencode($email);


        $confirmationHashURL = urlencode($confirmationHash);
        
        $confirmLink = "https://stage.traino.nu/confirm-email/" . $encodedEmail . "/" . $confirmationHashURL;

        $header = "Verifiera din e-postadress";

        $to = $email;
        $subject = "TRAINO - Verifiera din e-postadress";
        $content = '
        <p>Tack för att du registrerat dig på Traino. Nu behöver du bara klicka på länken nedan för att bekräfta din e-postadress, sedan kan du logga in:</p>

        <p><a href="' . $confirmLink . '" target="_blank">' . $confirmLink . '</a></p>

        <h3>Så här bokar du din aktivitet på eventdagen</h3>
        <p>För att testa TRAINO-plattformen har vi öppnat upp bokningssystemet exklusivt för er!</p>
        <p>Så här fungerar det:</p>
        <ol>
            <li>Skapa ett konto (det tar mindre än en minut).</li>
            <li>Välj aktivitet och tid i schemat för eventdagen.</li>
            <li>Boka som vanligt – priset är alltid 5 kr.</li>
            <li>Vid betalningen anger du testkortnummer: <strong>4242 4242 4242 4242</strong> (alla andra fält fyller du med valfria siffror/datum).</li>
            <li>Klart – din bokning är registrerad!</li>
        </ol>
        <p>OBS! Ingen riktig betalning sker just nu. Detta är endast för att simulera hur bokningssystemet fungerar.</p>
        ';    
        $username = $firstname;    
        $emailTemplate = getEmailTemplate($header, $username, $content);

        $pdo = null;
        
        sendEmail($to, $subject, $emailTemplate, $headers = []);
      } else {
          sendJsonError("Failed to insert user");
      }
  } catch (PDOException $e) {
    sendJsonError("Database error: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
  }

} 

if ($data['type'] === "trainer") {

  $type = "trainer";

  // Sanitize
  $alias = isset($data['alias']) ? validate_and_sanitize($data['alias'], "alias") : null;
  $personalnumber = isset($data['personalnumber']) ? validate_and_sanitize((int)trim($data['personalnumber']), "integer") : null;
  $address = isset($data['address']) ? validate_and_sanitize($data['address'], "text") : null;
  $education = isset($data['education']) ? validate_and_sanitize($data['education'], "text") : null;
  $sports = isset($data['sports']) ? validate_and_sanitize($data['sports'], "array") : null;
  $newsports = isset($data['newsport']) ? validate_and_sanitize($data['newsport'], "array") : null;

  $longitude = isset($data['longitude']) ? validate_and_sanitize($data['longitude'], 'float') : null;
  $latitude = isset($data['latitude']) ? validate_and_sanitize($data['latitude'], 'float') : null;

  try {
    // Prepare the SQL statement with named placeholders
    $sql = "INSERT INTO users (
            usertype, firstname, lastname, gender, alias, email, mobilephone, personalnumber, user_address, thumbnail, user_password, hashkey, longitude, latitude
        ) VALUES (
            :usertype, :firstname, :lastname, :gender, :alias, AES_ENCRYPT(:email, :key), 
            AES_ENCRYPT(:mobilephone,:key), 
            AES_ENCRYPT(:personalnumber, :key), 
            AES_ENCRYPT(:user_address, :key), 
            :thumbnail, :user_password, :hashkey, :longitude, :latitude
        )";

    // Prepare the statement
    $stmt = $pdo->prepare($sql);

    // Bind the parameters
    $stmt->bindParam(':usertype', $type, PDO::PARAM_STR);
    $stmt->bindParam(':firstname', $firstname, PDO::PARAM_STR);
    $stmt->bindParam(':lastname', $lastname, PDO::PARAM_STR);
    $stmt->bindParam(':gender', $gender, PDO::PARAM_STR);
    $stmt->bindParam(':alias', $alias, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':mobilephone', $mobilephone, PDO::PARAM_STR);
    $stmt->bindParam(':personalnumber', $personalnumber, PDO::PARAM_STR);
    $stmt->bindParam(':user_address', $address, PDO::PARAM_STR);
    $stmt->bindParam(':thumbnail', $thumbnail, PDO::PARAM_BOOL);
    $stmt->bindParam(':user_password', $passwordHash, PDO::PARAM_STR);
    $stmt->bindParam(':hashkey', $confirmationHash, PDO::PARAM_STR);
    $stmt->bindParam(':latitude', $latitude, PDO::PARAM_STR);
    $stmt->bindParam(':longitude', $longitude, PDO::PARAM_STR);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR); 

    // Execute the statement
    $stmt->execute();
    
      // Check if insertion was successful
      if ($stmt->rowCount() > 0) {
        // Get the ID of the last inserted row
        $user_id = $pdo->lastInsertId();

        // Begin the transaction
        $pdo->beginTransaction();
        
        // Insert data into 'user_education' table
        if (!empty($education)) {
            $stmt = $pdo->prepare("INSERT INTO user_education (user_id, education) VALUES (:user_id, :education)");
            foreach ($education as $edu) {
                $stmt->execute([':user_id' => $user_id, ':education' => $edu]);
            }
        }

        // Insert data into 'user_files' table
        if (!empty($files)) {
            $stmt = $pdo->prepare("INSERT INTO user_files (user_id, uploaded_filename, file_link) VALUES (:user_id, :filename, :link)");
            foreach ($files as $file) {
                $stmt->execute([':user_id' => $user_id, ':filename' => $file['name'], ':link' => $file['link']]);
            }
        }

        // Insert data into 'user_train_categories' table
        if (!empty($sports)) {
            $stmt = $pdo->prepare("INSERT INTO user_train_categories (user_id, category_id, category_link) VALUES (:user_id, :category_id, :category_link)");
            foreach ($sports as $sport) {
                $stmt->execute([':user_id' => $user_id, ':category_id' => $sport['id'], ':category_link' => $sport['category_link']]);
            }
        }

        // Insert data into 'categories_wanted' table
        if (!empty($newsports)) {
            $stmt = $pdo->prepare("INSERT INTO categories_wanted (sport) VALUES (:sport)");
            foreach ($newsports as $newsport) {
                $stmt->execute([':sport' => $newsport]);
            }
        }
        
        // Commit the transaction
        $pdo->commit();


        $response = [
            "success" => "User inserted successfully",
            "user_id" => $user_id
        ];

        $encodedEmail = urlencode($email);
        
        $confirmLink = "https://stage.traino.nu/confirm-email/" . $encodedEmail . "/" . $confirmationHash; //TODO: Change to traino.nu
        $to = $email;
        $subject = "TRAINO - Verifiera din e-postadress";
        $message = "Hej,<br><br>Tack för att du registrerat dig som tränare på Traino. Nu behöver du bara klicka på länken nedan för att bekräfta din e-postadress, sedan kan du logga in:<br><br><a href=" . $confirmLink . " target='_blank'>"  . $confirmLink . "</a><br><br>MVH<br>Traino";
        
        $pdo = null;
        
        sendEmail($to, $subject, $message, $headers = []);

        
      } else {
          sendJsonError("Failed to insert user");
      }
  } catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage()); // Logga felet
    http_response_code(500);
    sendJsonError("Database error: " . $e->getMessage());
}

} 

$pdo = null;

sendJson($response);


?>