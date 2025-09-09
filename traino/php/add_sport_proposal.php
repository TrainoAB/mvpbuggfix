<?php
require_once("db.php");
require_once("functions.php");
require_once("encryptkey.php");
require_once("apikey.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Read and decode the incoming JSON data
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400);
    sendJsonError("Invalid JSON received");
    exit;
}

// Validate required fields
if (!isset($data['sport_name']) || empty(trim($data['sport_name']))) {
    sendJsonError("Sport name is required");
    exit;
}

$sport_name = trim(validate_and_sanitize($data['sport_name'], "text"));

// Additional validation
if (strlen($sport_name) < 2) {
    sendJsonError("Sport name must be at least 2 characters long");
    exit;
}

if (strlen($sport_name) > 50) {
    sendJsonError("Sport name must be less than 50 characters");
    exit;
}

try {

    


    // Check if sport already exists in categories
    $categoryStmt = $pdo->prepare("SELECT id FROM categories WHERE category_name = :sport_name");
    $categoryStmt->bindParam(':sport_name', $sport_name);
    $categoryStmt->execute();

    if ($categoryStmt->fetch()) {
        sendJsonError("This sport proposal already exists in our system");
        exit;
    }

    // Check if sport proposal already exists
    $checkStmt = $pdo->prepare("SELECT id, amount FROM categories_wanted WHERE sport = :sport_name");
    $checkStmt->bindParam(':sport_name', $sport_name);
    $checkStmt->execute();
    
    $row = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        $category_id = $row['id'];
        $newamount = $row['amount'] + 1;

        // Update amount by 1
        $updateStmt = $pdo->prepare("UPDATE categories_wanted SET amount = amount + 1 WHERE id = :id");
        $updateStmt->bindParam(':id', $category_id);
        $updateStmt->execute();

        sendJson(["success" => "Sport already proposed earlier. Increased proposal count to " . $newamount]);
 
        exit;
    } else {

        // Insert the sport proposal
        $insertStmt = $pdo->prepare("
            INSERT INTO categories_wanted (sport, amount) 
            VALUES (:sport_name, amount + 1)
        ");
        
        $insertStmt->bindParam(':sport_name', $sport_name);
        
        if ($insertStmt->execute()) {
            $proposal_id = $pdo->lastInsertId();
            
            sendJson([
                "success" => "Sport proposal submitted successfully",
                "proposal_id" => $proposal_id,
                "sport_name" => $sport_name,
                "status" => "pending"
            ]);
        } else {
            sendJsonError("Failed to submit sport proposal");
        }
        }
} catch (PDOException $e) {
    error_log("Database error in add_sport_proposal.php: " . $e->getMessage());
    sendJsonError("Database error occurred");
} catch (Exception $e) {
    error_log("General error in add_sport_proposal.php: " . $e->getMessage());
    sendJsonError("An error occurred while processing your request");
}
?>
