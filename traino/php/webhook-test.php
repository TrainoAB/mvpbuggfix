<?php
require_once __DIR__ . '/vendor/autoload.php'; // Justera sökvägen om du ligger i annan mapp

$mollie = new \Mollie\Api\MollieApiClient();
$mollie->setApiKey("test_7ejguQfAvzQGegfFmv5D7NaE4FuRa8"); // Byt till live_ sen

// Mollie skickar bara ett "id" i POST-data
$paymentId = $_POST["id"] ?? null;

if (!$paymentId) {
    http_response_code(400);
    echo "Missing payment ID";
    exit;
}

try {
    // Hämta betalningsinfo från Mollie
    $payment = $mollie->payments->get($paymentId);

    // Kolla betalningsstatus
    if ($payment->isPaid()) {
        // ✅ Betalning lyckades
        // TODO: Uppdatera order i databas med status "betald"
        error_log("✅ Betalning lyckades för order: " . $payment->metadata->order_id);
    } elseif ($payment->isCanceled()) {
        // ❌ Kunden avbröt betalningen
        error_log("❌ Betalning avbröts");
    } elseif ($payment->isExpired()) {
        // ⏰ Tiden för betalning gick ut
        error_log("⌛ Betalning gick ut");
    } else {
        // Något annat hände
        error_log("ℹ️ Betalningstatus: " . $payment->status);
    }

    http_response_code(200); // Viktigt! Mollie kräver 200 OK
} catch (Exception $e) {
    http_response_code(500);
    error_log("Webhook error: " . $e->getMessage());
    echo "Error";
    exit;
}
