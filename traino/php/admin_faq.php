<?php
// Include necessary files
require("apikey.php");  // Include your API key
require("db.php");      // Include your database connection settings
require_once("functions.php"); // Include your functions for validation and JSON response

validateCorsMethod(['POST', 'GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the 'crud' property exists in the received data
if (!isset($_GET['crud'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing 'crud' parameter.");
    exit;
}

// Check version parameter Try this as version management maybe?
if(isset($_GET['v'])) {
    $version = $_GET['v'];

    if($version === '1') {
        // Process CRUD operations based on 'crud' parameter
        try {
            // Check if the 'crud' property is set to 'create', 'update', or 'delete'
            switch ($_GET['crud']) {
                case 'create':
                    $question = validate_and_sanitize($data['question'], "text");
                    $answer = validate_and_sanitize($data['answer'], "text");

                    // Prepare and bind
                    $stmt = $pdo->prepare("INSERT INTO faq (question, answer) VALUES (?, ?)");
                    $stmt->bindParam(1, $question);
                    $stmt->bindParam(2, $answer);

                    // Execute the statement
                    if ($stmt->execute()) {
                        $response = ["success" => "FAQ created"];
                        sendJson($response);
                    } else {
                        throw new Exception("Error: " . implode(", ", $stmt->errorInfo()));
                    }
                    break;

                case 'update':
                    $id = validate_and_sanitize($data['id'], "integer");
                    $question = validate_and_sanitize($data['question'], "text");
                    $answer = validate_and_sanitize($data['answer'], "text");

                    // Prepare and bind
                    $stmt = $pdo->prepare("UPDATE faq SET question = ?, answer = ? WHERE id = ?");
                    $stmt->bindParam(1, $question);
                    $stmt->bindParam(2, $answer);
                    $stmt->bindParam(3, $id, PDO::PARAM_INT);

                    // Execute the statement
                    if ($stmt->execute()) {
                        $response = ["success" => "FAQ updated"];
                        sendJson($response);
                    } else {
                        throw new Exception("Error: " . implode(", ", $stmt->errorInfo()));
                    }
                    break;

                case 'delete':
                    $id = validate_and_sanitize($data['id'], "integer");

                    // Prepare and bind
                    $stmt = $pdo->prepare("DELETE FROM faq WHERE id = ?");
                    $stmt->bindParam(1, $id, PDO::PARAM_INT);

                    // Execute the statement
                    if ($stmt->execute()) {
                        $response = ["success" => "FAQ deleted"];
                        sendJson($response);
                    } else {
                        // Handle error
                        $errorInfo = $stmt->errorInfo();
                        $errorMessage = implode(", ", $errorInfo);
                        throw new Exception("Error: " . $errorMessage);

                    }
            }
        } catch (Exception $e) {    
        }
    }


} else {




// Process CRUD operations based on 'crud' parameter
try {
    switch ($_GET['crud']) {
        case 'create':
            $question = validate_and_sanitize($data['question'], "text");
            $answer = validate_and_sanitize($data['answer'], "text");

            // Prepare and bind
            $stmt = $pdo->prepare("INSERT INTO faq (question, answer) VALUES (?, ?)");
            $stmt->bindParam(1, $question);
            $stmt->bindParam(2, $answer);

            // Execute the statement
            if ($stmt->execute()) {
                $response = ["success" => "FAQ created"];
                sendJson($response);
            } else {
                throw new Exception("Error: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'update':
            $id = validate_and_sanitize($data['id'], "integer");
            $question = validate_and_sanitize($data['question'], "text");
            $answer = validate_and_sanitize($data['answer'], "text");

            // Prepare and bind
            $stmt = $pdo->prepare("UPDATE faq SET question = ?, answer = ? WHERE id = ?");
            $stmt->bindParam(1, $question);
            $stmt->bindParam(2, $answer);
            $stmt->bindParam(3, $id, PDO::PARAM_INT);

            // Execute the statement
            if ($stmt->execute()) {
                $response = ["success" => "FAQ updated"];
                sendJson($response);
            } else {
                throw new Exception("Error: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'delete':
            $id = validate_and_sanitize($data['id'], "integer");

            // Prepare and bind
            $stmt = $pdo->prepare("DELETE FROM faq WHERE id = ?");
            $stmt->bindParam(1, $id, PDO::PARAM_INT);

            // Execute the statement
            if ($stmt->execute()) {
                $response = ["success" => "FAQ deleted"];
                sendJson($response);
            } else {
                // Handle error
                $errorInfo = $stmt->errorInfo();
                $errorMessage = implode(", ", $errorInfo);
                throw new Exception("Error: " . $errorMessage);
            }
            break;

        default:
            http_response_code(400); // Bad Request
            sendJsonError("Invalid 'crud' parameter.");
            break;
    }
} catch (Exception $e) {
    // Send JSON error response
    sendJsonError("Error: " . $e->getMessage());
}

}

$pdo = null;
?>