<?php
/**
 * Mark Payouts Completed Endpoint
 * 
 * Purpose: Update transactions after successful Stripe Transfer to trainer
 * Updates: payout_status, stripe_transfer_id, payout_date
 * 
 * Used by: Payout processing scripts after Stripe Transfer succeeds
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

require_once("db.php");
require_once("functions.php");
require_once("apikey.php");

// Validate CORS preflight
validateCorsMethod(['POST']);

// API key authentication
$apikey = API_KEY;
validateAuthHeader($apikey);

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    sendJsonError('Invalid JSON payload');
    exit();
}

// Validate required fields
$transactionIds = $data['transaction_ids'] ?? null;
$stripeTransferId = $data['stripe_transfer_id'] ?? null;

if (!$transactionIds || !is_array($transactionIds) || empty($transactionIds)) {
    http_response_code(400);
    sendJsonError('Missing or invalid transaction_ids array');
    exit();
}

if (!$stripeTransferId || !is_string($stripeTransferId)) {
    http_response_code(400);
    sendJsonError('Missing or invalid stripe_transfer_id');
    exit();
}

// Validate that stripe_transfer_id looks like a Stripe Transfer ID
if (!preg_match('/^tr_[a-zA-Z0-9]+$/', $stripeTransferId)) {
    http_response_code(400);
    sendJsonError('Invalid Stripe Transfer ID format. Expected format: tr_xxxxx');
    exit();
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Build placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($transactionIds), '?'));

    // Prepare UPDATE statement
    $sql = "UPDATE transactions 
            SET payout_status = 'completed',
                stripe_transfer_id = ?,
                payout_date = NOW()
            WHERE id IN ($placeholders)
              AND payout_status = 'pending'";

    $stmt = $pdo->prepare($sql);

    // Bind parameters: first the stripe_transfer_id, then all transaction IDs
    $params = array_merge([$stripeTransferId], $transactionIds);
    $stmt->execute($params);

    $updatedCount = $stmt->rowCount();

    // Commit transaction
    $pdo->commit();

    // Get updated transaction details
    $verifyPlaceholders = implode(',', array_fill(0, count($transactionIds), '?'));
    $verifySql = "SELECT id, trainer_id, trainer_amount, payout_status, stripe_transfer_id, payout_date
                  FROM transactions
                  WHERE id IN ($verifyPlaceholders)";
    
    $verifyStmt = $pdo->prepare($verifySql);
    $verifyStmt->execute($transactionIds);
    $updatedTransactions = $verifyStmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate totals
    $totalPaidOut = 0;
    foreach ($updatedTransactions as $tx) {
        $totalPaidOut += $tx['trainer_amount'];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'updated_count' => $updatedCount,
        'requested_count' => count($transactionIds),
        'stripe_transfer_id' => $stripeTransferId,
        'total_paid_out' => $totalPaidOut,
        'total_paid_out_sek' => number_format($totalPaidOut / 100, 2),
        'transactions' => $updatedTransactions,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
} catch (Exception $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    sendJsonError('Server error: ' . $e->getMessage());
}
