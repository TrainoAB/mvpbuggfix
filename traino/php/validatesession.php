<?php 

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

$user_id = isset($data['user_id']) ? $data['user_id'] : null;

if($user_id === null) {
  sendJsonError("Invalid Session ID");
}

// validateSessionID($pdo, null, false);

$pdo = null;

$response = ["success" => "Valid Session ID."];
sendJson($response);

?>