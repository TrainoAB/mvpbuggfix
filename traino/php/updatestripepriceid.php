<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['POST', 'GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonError('Invalid JSON payload');
    exit();
}

$priceId = $data['priceId'] ?? null;
$product_id = $data['product_id'] ?? null;

if (!$priceId || !$product_id) {
    sendJsonError('Missing required fields');
    exit();
}

try {
    $stmt = $pdo->prepare('UPDATE products SET priceId = :priceId WHERE id = :product_id');
    $stmt->bindParam(':priceId', $priceId);
    $stmt->bindParam(':product_id', $product_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendJsonError('Product not found');
        exit();
    }

    sendJson(['success' => 'Product updated successfully']);
} catch (PDOException $e) {
    sendJsonError('Database error: ' . $e->getMessage());
    exit();
}
