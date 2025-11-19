<?php
require("apikey.php");
require_once("functions.php");

validateCorsMethod(['POST']);
validateAuthHeader(API_KEY);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'])) {
    echo json_encode([
        "valid" => false,
        "message" => "Missing email"
    ]);
    exit;
}

$email = strtolower(trim($data['email']));

// 1. Formatkoll i PHP (valfritt, du har redan i JS):
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "valid" => false,
        "message" => "Invalid email format"
    ]);
    exit;
}

// 2. Domänkoll
$domain = substr(strrchr($email, "@"), 1);

if (!checkdnsrr($domain, "MX")) {
    echo json_encode([
        "valid" => false,
        "message" => "The email domain is invalid. Please use a different email address."
    ]);
    exit;
}

// 3. Allt OK
echo json_encode([
    "valid" => true
]);
exit;
