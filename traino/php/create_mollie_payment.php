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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['totalCost']) || !isset($input['selectedProducts'])) {
  http_response_code(400);
  echo "Ogiltiga data";
  exit;
}

$totalCost = $input['totalCost'];
$products = $input['selectedProducts'];

$formattedCost = number_format($totalCost, 2, '.', '');

// 7. Skapa en beskrivning från produkterna
$productNames = array_map(function($product) {
  return $product['name'];
}, $products);

$description = "Köp: " . implode(", ", $productNames);


// Skapa betalning
$payment = $mollie->payments->create([
    "amount" => [
        "currency" => "SEK",
        "value" => $formattedCost // måste vara string med 2 decimaler
    ],
    "description" => $description,
    "redirectUrl" => "https://localhost:3000/",
    "webhookUrl" => "https://webshop.example.org/payments/webhook/",
    "metadata" => [
        "order_id" => uniqid("order_"), // Valfri metadata
       "products" => $products, // Valfri metadata
       "total" => $formattedCost // Valfri metadata
    ],
]);

// Få checkout URL
$checkoutUrl = $payment->getCheckoutUrl();

// Skicka vidare användaren till Mollies betalningssida
// header("Location: " . $checkoutUrl);
echo $checkoutUrl;
exit;