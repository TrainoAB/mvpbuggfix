<?php
/**
 * Get Pending Payouts Endpoint
 * 
 * Purpose: Query all transactions awaiting trainer payout
 * Returns: List of trainers with pending amounts grouped by trainer_id
 * 
 * Used by: Admin dashboard or payout processing scripts
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

require_once("db.php");
require_once("functions.php");
require_once("apikey.php");

// Validate CORS preflight
validateCorsMethod(['GET', 'POST']);

// API key authentication
$apikey = API_KEY;
validateAuthHeader($apikey);

try {
    // Query to get pending payouts grouped by trainer
    $sql = "
        SELECT 
            t.trainer_id,
            u.first_name,
            u.last_name,
            u.email,
            u.stripe_id as trainer_stripe_id,
            COUNT(t.id) as booking_count,
            SUM(t.trainer_amount) as total_owed,
            SUM(t.gross_amount) as total_gross,
            SUM(t.platform_fee) as total_platform_fee,
            MIN(t.created_date) as oldest_transaction,
            MAX(t.created_date) as newest_transaction
        FROM transactions t
        INNER JOIN users u ON t.trainer_id = u.id
        WHERE t.payout_status = 'pending'
          AND t.status = 'completed'
          AND u.stripe_id IS NOT NULL
          AND u.stripe_id != ''
        GROUP BY t.trainer_id, u.first_name, u.last_name, u.email, u.stripe_id
        ORDER BY total_owed DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $pendingPayouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate totals across all trainers
    $totalTrainers = count($pendingPayouts);
    $totalBookings = 0;
    $totalOwed = 0;
    $totalGross = 0;
    $totalPlatformFee = 0;

    foreach ($pendingPayouts as $payout) {
        $totalBookings += $payout['booking_count'];
        $totalOwed += $payout['total_owed'];
        $totalGross += $payout['total_gross'];
        $totalPlatformFee += $payout['total_platform_fee'];
    }

    // Format amounts for display (convert öre to SEK)
    foreach ($pendingPayouts as &$payout) {
        $payout['total_owed_sek'] = number_format($payout['total_owed'] / 100, 2);
        $payout['total_gross_sek'] = number_format($payout['total_gross'] / 100, 2);
        $payout['total_platform_fee_sek'] = number_format($payout['total_platform_fee'] / 100, 2);
    }

    // Build response
    $response = [
        'success' => true,
        'summary' => [
            'total_trainers' => $totalTrainers,
            'total_bookings' => $totalBookings,
            'total_owed' => $totalOwed,
            'total_owed_sek' => number_format($totalOwed / 100, 2),
            'total_gross' => $totalGross,
            'total_gross_sek' => number_format($totalGross / 100, 2),
            'total_platform_fee' => $totalPlatformFee,
            'total_platform_fee_sek' => number_format($totalPlatformFee / 100, 2),
        ],
        'trainers' => $pendingPayouts,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
} catch (Exception $e) {
    http_response_code(500);
    sendJsonError('Server error: ' . $e->getMessage());
}
