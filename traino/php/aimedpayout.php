<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Check if the script is being run from the command line (cron job)
if (php_sapi_name() !== 'cli') {
    http_response_code(403); // Forbidden
    echo json_encode(['error' => 'This script can only be run as a cron job.']);
    exit();
}

require_once("db.php");
require_once("encryptkey.php");
require_once("stripekey.php");
require 'vendor/autoload.php';

$encryptionKey = ENCRYPTION_KEY;
$stripeKey = STRIPE_KEY;

\Stripe\Stripe::setApiKey($stripeKey);

error_log("Running aimedpayout.php cronjob... " . date('Y-m-d H:i:s'));

class Transaction
{
    public $payment_intent_id;

    public function createPayment($payment_intent_id)
    {
        $this->payment_intent_id = $payment_intent_id;
    }
}

$response = [];
try {
    $account = \Stripe\Account::retrieve();
    $stripeConnectionStatus = [
        'id' => $account->id ?? 'N/A',
        'email' => $account->email ?? 'N/A',
        'business_name' => $account->business_profile->name ?? 'N/A',
    ];
    if ($stripeConnectionStatus['id'] == 'N/A') {
        error_log("Stripe account not connected");
    }
} catch (\Stripe\Exception\ApiErrorException $e) {
    error_log("Stripe API error: " . $e->getMessage());
    $stripeConnectionStatus = ['error' => $e->getMessage()];
}

try {

    // Delete all login attempts
    $deleteSql = "DELETE FROM login_attempts";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute();


    $stmt = $pdo->prepare('
        SELECT * 
        FROM transactions 
        WHERE booked_date IS NOT NULL 
        AND endtime < NOW() 
        AND status = :status 
        AND productinfo IN (:productinfo1, :productinfo2)
    ');

    $status = "pending";
    $productinfo1 = "trainingpass";
    $productinfo2 = "onlinetraining";
    $stmt->bindParam(':status', $status, PDO::PARAM_STR);
    $stmt->bindParam(':productinfo1', $productinfo1, PDO::PARAM_STR);
    $stmt->bindParam(':productinfo2', $productinfo2, PDO::PARAM_STR);

    $stmt->execute();
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($sessions)) {
        http_response_code(404);
        echo json_encode('No pending payment for passes found.');
        exit();
    }

    $stripePayments = [];
    $paymentStatuses = [];

    foreach ($sessions as $session) {
        if (empty($session['payment_intent_id'])) {
            $log ? error_log("Missing payment_intent_id for session ID: " . $session['id']) : null;
            continue;
        }

        $payment = new Transaction();
        $payment->createPayment($session['payment_intent_id']);
        $stripePayments[] = $payment;
    }

    foreach ($stripePayments as $payment) {
        try {
            $paymentIntentId = $payment->payment_intent_id;
            $paymentIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);
            $paymentIntent->capture();

            $log ? error_log("Payment captured for payment intent ID: " . $paymentIntentId) : null;

            $sql = "UPDATE transactions SET status = 'completed', info = 'cronjob completed' WHERE payment_intent_id = :payment_intent_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':payment_intent_id', $paymentIntentId, PDO::PARAM_STR);
            $stmt->execute();

            $rowsUpdated = $stmt->rowCount();
            $paymentStatuses[] = [
                'payment_intent_id' => $paymentIntentId,
                'status' => $rowsUpdated > 0 ? 'captured and updated' : 'captured but update failed',
            ];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log('Stripe API error: ' . $e->getMessage());
            $paymentStatuses[] = [
                'payment_intent_id' => $payment->payment_intent_id,
                'status' => 'failed',
                'error' => $e->getMessage()
            ];
        }
    }

    $response = [
        'sessions' => $sessions,
        'stripePayments' => $stripePayments,
        'stripeConnectionStatus' => $stripeConnectionStatus,
        'paymentStatuses' => $paymentStatuses
    ];
    http_response_code(200);
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    $response = ['error' => 'Database error: ' . $e->getMessage()];
} catch (Exception $e) {
    error_log('General error: ' . $e->getMessage());
    http_response_code(500);
    $response = ['error' => 'General error: ' . $e->getMessage()];
}

echo json_encode($response);