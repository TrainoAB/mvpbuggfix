<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/vendor/autoload.php'; // Viktigt!

$mollie = new \Mollie\Api\MollieApiClient();
$mollie->setApiKey("test_7ejguQfAvzQGegfFmv5D7NaE4FuRa8");

// Skapa betalning
$payment = $mollie->payments->create([
    "amount" => [
        "currency" => "SEK",
        "value" => "100.00" // måste vara string med 2 decimaler
    ],
    "description" => "Order #12345",
    "redirectUrl" => "https://localhost:3000/",
    "webhookUrl" => "https://webshop.example.org/payments/webhook/",
    "metadata" => [
        "order_id" => "12345"
    ]
]);

// Få checkout URL
$checkoutUrl = $payment->getCheckoutUrl();

// Skicka vidare användaren till Mollies betalningssida
// header("Location: " . $checkoutUrl);
echo $checkoutUrl;
exit;