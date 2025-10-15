<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");
require("emailtemplate.php");

validateCorsMethod(['UPDATE']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

if (isset($_GET["id"])) {
    $id = $_GET["id"];

    validateSessionID($pdo, $id);

    // Assume incoming data is JSON and decode it
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if the received data is valid JSON
    if ($data === null) {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid JSON received");
        exit;
    }

    if(isset($data['currentPassword'])) {
        $currentPassword = $data['currentPassword'];
    }

    if(isset($data['verifyPassword'])) {
        $verifyPassword = $data['verifyPassword'];
    }

    try {
        // Initialize an array to hold the SQL parts
        $sqlParts = [];
        $params = [':id' => $id];

        // Iterate over each attribute in the data
        foreach ($data as $key => $value) {
            switch ($key) {
                case 'firstname':
                    $firstname = validate_and_sanitize($value, 'name');
                    if ($firstname !== null) {
                        $sqlParts[] = "firstname = :firstname";
                        $params[':firstname'] = ucfirst(strtolower($firstname));
                    }
                    break;
                case 'lastname':
                    $lastname = validate_and_sanitize($value, 'name');
                    if ($lastname !== null) {
                        $sqlParts[] = "lastname = :lastname";
                        $params[':lastname'] = ucfirst(strtolower($lastname));
                    }
                    break;
                case 'mobilephone':
                    $mobilephone = validate_and_sanitize($value, 'phone');
                    if ($mobilephone !== null) {
                        $sqlParts[] = "mobilephone = AES_ENCRYPT(:mobilephone, :key)";
                        $params[':mobilephone'] = $mobilephone;
                        $params[':key'] = $encryptionKey;
                    }
                    break;
                case 'email':
                    $email = validate_and_sanitize($value, "email");
                    if ($email !== null) {
                        $sqlParts[] = "email = AES_ENCRYPT(:email, :key)";
                        $params[':email'] = $email;
                        $params[':key'] = $encryptionKey;
                    }
                    break;
                case 'user_about':
                    $user_about = validate_and_sanitize($value, "text");
                    $sqlParts[] = "user_about = :user_about";
                    $params[':user_about'] = $user_about;
                    break;
                case 'alias':
                    $alias = validate_and_sanitize($value, "alias");
                    if ($alias !== null) {
                        $sqlParts[] = "alias = :alias";
                        $params[':alias'] = $alias;
                    }
                    break;
                case 'user_address':
                    $user_address = validate_and_sanitize($value, "text");
                    if ($user_address !== null) {
                        $sqlParts[] = "user_address = AES_ENCRYPT(:user_address, :key)";
                        $params[':user_address'] = $user_address;
                        $params[':key'] = $encryptionKey;
                    }
                    break;
                case 'newPassword':
                    $password = trim(validate_and_sanitize($value, "password"));
                    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                    if ($password !== null) {
                        $sqlParts[] = "user_password = :user_password";
                        $params[':user_password'] = $passwordHash;
                    }
                    break;
                case 'longitude':
                    $longitude = validate_and_sanitize($value, 'float');
                    if ($longitude !== null) {
                        $sqlParts[] = "longitude = :longitude";
                        $params[':longitude'] = $longitude;
                    }
                    break;
                case 'latitude':
                    $latitude = validate_and_sanitize($value, 'float');
                    if ($latitude !== null) {
                        $sqlParts[] = "latitude = :latitude";
                        $params[':latitude'] = $latitude;
                    }
                    break;
                    case 'education':
                        $education = validate_and_sanitize($value, "array");
                        if ($education !== null && count($education) > 0) {
                            // Store education entries for separate handling
                            $educationEntries = $education;
                        }
                        break;
                    case 'user_files':
                        $userFiles = validate_and_sanitize($value, "array");
                        $userFilesJson = json_encode($userFiles);
                        if ($userFiles !== null && count($userFiles) > 0) {
                            // Store education entries for separate handling
                            $uploadedFiles = $userFiles;
                        }
                        break;
                    case 'training':
                    $sports = validate_and_sanitize($value, "array");
                    if ($sports !== null && count($sports) > 0) {
                        // Store education entries for separate handling
                        $addedSports = $sports;
                    }
                    break;
                case 'verifyPassword':
                    $password = trim(validate_and_sanitize($value, "password"));
                    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                    if ($password !== null) {
                        $sqlParts[] = "user_password = :user_password";
                        $params[':user_password'] = $passwordHash;
                    }
                    break;
                case 'thumbnail':
                    $thumbnail = validate_and_sanitize($value, "integer");
                    if ($thumbnail !== null) {
                        $sqlParts[] = "thumbnail = :thumbnail";
                        $params[':thumbnail'] = $thumbnail;
                    }
                    break;
                case 'coverimage':
                    $coverimage = validate_and_sanitize($value, "integer");
                    if ($coverimage !== null) {
                        $sqlParts[] = "coverimage = :coverimage";
                        $params[':coverimage'] = $coverimage;
                    }
                    break;
            }
        }

        if (!empty($sqlParts)) {
            // Check if current password is correct
            if (isset($params[':user_password']) && $params[':user_password'] != null) {
                try {
                    // Prepare the SQL statement to retrieve the hashed password from the users table
                    $sql = "SELECT user_password FROM users WHERE id = :id";
                
                    // Prepare the query
                    $stmt = $pdo->prepare($sql);
                    
                    // Bind the :id parameter
                    $stmt->bindParam(':id', $params[':id'], PDO::PARAM_INT);
                    
                    // Execute the query
                    $stmt->execute();
                
                    // Fetch the result
                    $oldPassword = $stmt->fetch(PDO::FETCH_ASSOC);
                
                    if ($oldPassword) {
                        // Extract the hashed password from the result
                        $oldPasswordHash = trim($oldPassword['user_password']);
                
                        if (!empty($oldPasswordHash) && !empty($currentPassword)) {
                            $isPasswordCorrect = password_verify($currentPassword, $oldPasswordHash);
                
                            if ($isPasswordCorrect === false) {
                                sendJson("Incorrect password!");
                                return;
                            }
                        } else if (!empty($verifyPassword)) {
                            $isPasswordCorrect = password_verify($verifyPassword, $oldPasswordHash);
                
                            if ($isPasswordCorrect === true) {
                                sendJson("Correct password!");
                                return;
                            } else {
                                sendJson("Incorrect password!");
                                return;
                            }
                        } else {
                            sendJsonError("Empty password or hashed password!");
                        }
                    } else {
                        sendJsonError("User not found");
                    }
                
                } catch (PDOException $e) {
                    // Handle database errors
                    http_response_code(500); // Internal Server Error
                    error_log($e->getMessage()); // Log the error message
                    sendJsonError("Database error occurred");
                }
            }

            // Construct the SQL query
            $sql = "UPDATE users SET " . implode(", ", $sqlParts) . " WHERE id = :id";

            // Prepare the statement
            $stmt = $pdo->prepare($sql);

            // Bind parameters
            foreach ($params as $param => $value) {
                $stmt->bindValue($param, $value);
            }

            // Execute the statement
            $stmt->execute();

            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Prepare success response
                $response = ["success" => "Attributes updated successfully."];

                // Handle cascading updates for fields that exist in multiple tables
                // This ensures data consistency across related tables when user information is updated
                $cascadeUpdates = [];
                
                // Update alias in products table if alias was updated
                if (isset($params[':alias']) && $params[':alias'] != null) {
                    $cascadeUpdates[] = [
                        'sql' => "UPDATE products SET alias = :alias WHERE user_id = :user_id",
                        'params' => [':alias' => $params[':alias'], ':user_id' => $id]
                    ];
                }
                
                // Update latitude/longitude in products table if they were updated
                if ((isset($params[':latitude']) && $params[':latitude'] != null) || 
                    (isset($params[':longitude']) && $params[':longitude'] != null)) {
                    $updateParts = [];
                    $locationParams = [':user_id' => $id];
                    
                    if (isset($params[':latitude']) && $params[':latitude'] != null) {
                        $updateParts[] = "latitude = :latitude";
                        $locationParams[':latitude'] = $params[':latitude'];
                    }
                    
                    if (isset($params[':longitude']) && $params[':longitude'] != null) {
                        $updateParts[] = "longitude = :longitude";
                        $locationParams[':longitude'] = $params[':longitude'];
                    }
                    
                    if (!empty($updateParts)) {
                        $cascadeUpdates[] = [
                            'sql' => "UPDATE products SET " . implode(", ", $updateParts) . " WHERE user_id = :user_id",
                            'params' => $locationParams
                        ];
                    }
                }
                
                // Update address in products table if user_address was updated
                // Note: Only update products that are NOT trainingpass since they may have custom addresses
                if (isset($params[':user_address']) && $params[':user_address'] != null) {
                    $cascadeUpdates[] = [
                        'sql' => "UPDATE products SET address = AES_ENCRYPT(:address, :key) WHERE user_id = :user_id AND product_type != 'trainingpass'",
                        'params' => [
                            ':address' => $params[':user_address'], 
                            ':user_id' => $id,
                            ':key' => $encryptionKey
                        ]
                    ];
                }
                
                // Execute cascade updates
                foreach ($cascadeUpdates as $cascadeUpdate) {
                    try {
                        $cascadeStmt = $pdo->prepare($cascadeUpdate['sql']);
                        foreach ($cascadeUpdate['params'] as $param => $value) {
                            $cascadeStmt->bindValue($param, $value);
                        }
                        $cascadeStmt->execute();
                        if ($cascadeStmt->rowCount() > 0) {
                            error_log("Cascade update successful: " . $cascadeUpdate['sql'] . " affected " . $cascadeStmt->rowCount() . " rows");
                        }
                    } catch (PDOException $e) {
                        // Log cascade update errors but don't fail the main update
                        error_log("Cascade update error: " . $e->getMessage() . " SQL: " . $cascadeUpdate['sql']);
                    }
                }

                if (isset($params[':email']) && $params[':email'] != null) {
                    $email = $params[':email'];

                    $confirmationHash = generateEmailConfirmationHash($email);

                    $encodedEmail = urlencode($email);

                    $confirmationHashURL = urlencode($confirmationHash);
                    
                    $confirmLink = "https://traino.nu/confirm-email/" . $encodedEmail . "/" . $confirmationHashURL;

                    $header = "Verifiera din e-postadress";

                    $to = $email;
                    $subject = "TRAINO - Verifiera din e-postadress";
                    $content = '
                    <p>Tack för att du registrerat dig på TRAINO. Nu behöver du bara klicka på länken nedan för att bekräfta din e-postadress, sedan kan du logga in:</p>
                    <p><a href="' . $confirmLink . '" target="_blank">' . $confirmLink . '</a></p>
                    ';    
                    $username = $firstname;    
                    $emailTemplate = getEmailTemplate($header, $username, $content);
                    
                    sendEmail($to, $subject, $emailTemplate, $headers = []);
                }
                sendJson($response);
            } else {
                sendJsonError("No attributes were updated.");
            }
        } else if (!empty($educationEntries)) {
            foreach ($educationEntries as $entry) {
                $sql = "INSERT INTO user_education (user_id, education) VALUES (:user_id, :education)";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':user_id', $id, PDO::PARAM_INT);
                $stmt->bindParam(':education', $entry, PDO::PARAM_STR);
                $stmt->execute();
            }

            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Prepare success response
                $response = ["success" => "Educations updated successfully."];

                sendJson($response);
            } else {
                sendJsonError("No educations were updated.");
            }
        } else if (!empty($addedSports)) {
            foreach ($addedSports as $addedSport) {
                $sql = "INSERT INTO user_train_categories (user_id, category_id, category_link) VALUES (:user_id, :category_id, :category_link)";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':user_id', $id, PDO::PARAM_INT);
                $stmt->bindParam(':category_id', $addedSport['id'], PDO::PARAM_INT);
                $stmt->bindParam(':category_link', $addedSport['category_link'], PDO::PARAM_STR);
                $stmt->execute();
            }

            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Prepare success response
                $response = ["success" => "User sports updated successfully."];

                sendJson($response);
            } else {
                sendJsonError("No sports were updated.");
            }
        } else if (!empty($uploadedFiles)) {
            $sql = "INSERT INTO user_files (user_id, file_names, uploaded_at) VALUES (:user_id, :file_names, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':user_id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':file_names', $userFilesJson, PDO::PARAM_STR);
            $stmt->execute();

            // Check if the update was successful
            if ($stmt->rowCount() > 0) {
                // Prepare success response
                $response = ["success" => "User files updated successfully."];

                sendJson($response);
            } else {
                sendJsonError("No files were updated.");
            }
        } else {
            sendJsonError("No valid attributes found to update.");
        }

        $pdo = null;

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
    }
} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Bug report ID is missing.');
}
?>
