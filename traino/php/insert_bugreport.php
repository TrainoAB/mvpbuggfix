<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
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
if (!isset($data['area'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}


// Sanitize 
$user_id = isset($data['user_id']) ? validate_and_sanitize($data['user_id'], "integer") : null;
$areaArray = isset($data['area']) ? validate_and_sanitize($data['area'], "array") : null;
$description = isset($data['description']) ? validate_and_sanitize($data['description'], "text") : null;
$browser = isset($data['browser']) ? validate_and_sanitize($data['browser'], "text") : null;
$logs = isset($data['logs']) ? validate_and_sanitize($data['logs'], "text") : null;
$os = isset($data['os']) ? validate_and_sanitize($data['os'], "text") : null;
$platform = isset($data['platform'][0]) ? validate_and_sanitize($data['platform'][0],"text") : null; // Extracting the first element from 'platform'
$resolution = isset($data['resolution']) ? validate_and_sanitize($data['resolution'], "text") : null;
$screenshot = null;
$severity = isset($data['severity'][0]) ? validate_and_sanitize($data['severity'][0], "text") : null; // Extracting the first element from 'severity'

$area = isset($areaArray) ? validate_and_sanitize(implode(",", $areaArray), "text") : null; // Create string from area array

// Prepare the SQL statement
$sql = "INSERT INTO bugreports 
        (user_id, area, description, browser, logs, os, platform, resolution, screenshot, severity) 
        VALUES 
        (:user_id, :area, :description, :browser, :logs, :os, :platform, :resolution, :screenshot, :severity)";

$stmt = $pdo->prepare($sql);

// Bind parameters
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->bindParam(':area', $area, PDO::PARAM_STR);
$stmt->bindParam(':description', $description, PDO::PARAM_STR);
$stmt->bindParam(':browser', $browser, PDO::PARAM_STR);
$stmt->bindParam(':logs', $logs, PDO::PARAM_STR);
$stmt->bindParam(':os', $os, PDO::PARAM_STR);
$stmt->bindParam(':platform', $platform, PDO::PARAM_STR);
$stmt->bindParam(':resolution', $resolution, PDO::PARAM_STR);
$stmt->bindParam(':screenshot', $screenshot, PDO::PARAM_STR); // Assuming screenshot is VARCHAR or NULL
$stmt->bindParam(':severity', $severity, PDO::PARAM_STR);

// Execute the SQL statement
if ($stmt->execute()) {
    // Check if rows were affected
    if ($stmt->rowCount() > 0) {
        // Insert successful
        $reportid = $pdo->lastInsertId();

        $response = [
            "success" => "Bug report inserted successfully.",
            "report_id" => $reportid
        ];
       
        $pdo = null;
        sendJson($response);
    } else {
        // No rows affected, handle error
        sendJsonError("Error: Failed to insert bug report. No rows affected.");
    }
} else {
    // SQL execution failed, handle error
    sendJsonError("Error: SQL execution failed - " . implode(" - ", $stmt->errorInfo()));
}

?>