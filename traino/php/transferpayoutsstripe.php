<?php
/**
 * Transfer pending payouts to trainers via Stripe Transfers.
 *
 * Intended to be run from the command line by cron on the 28th of each month.
 * - Finds pending payouts (transactions with payout_status='pending')
 *   where the transaction booked_date is on or before the 27th of the current month.
 * - Groups transactions by trainer, sums trainer_amount and sends a Stripe Transfer to the
 *   trainer's connected Stripe account (users.stripe_id).
 * - Marks the affected transactions as completed (payout_status='completed') and sets
 *   stripe_transfer_id and payout_date in the DB.
 *
 * Notes:
 * - Uses the Stripe PHP library (composer autoload in php/vendor/autoload.php).
 * - Reads Stripe API key from environment variable STRIPE_SECRET_KEY.
 */

// Run only from CLI
if (php_sapi_name() !== 'cli') {
	fwrite(STDERR, "This script is intended to be run from the command line.\n");
	exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';

// Load Stripe key from environment
$stripeSecret = getenv('STRIPE_SECRET_KEY') ?: null;
if (!$stripeSecret) {
	error_log("AutoStripeTransfer: Missing STRIPE_SECRET_KEY environment variable");
	fwrite(STDERR, "Missing STRIPE_SECRET_KEY environment variable\n");
	exit(1);
}

// Guard: Only run on the 28th by default (cron should call it on 28th). Allow override via CLI --force
$force = in_array('--force', $argv, true);
$todayDay = (int) date('j');
if (!$force && $todayDay !== 28) {
	// Allow a short window for manual runs in dev: also allow day 1 when testing with --test
	fwrite(STDOUT, "Skipping run because today is not the 28th. Use --force to override.\n");
	exit(0);
}

// Cutoff: include transactions created before the 27th of the current month (end of day)
$cutoff = date('Y-m-27 00:00:00');

// Prepare query: select each pending transaction as separate payout unit
$sql = "
	SELECT
		t.id AS transaction_id,
		t.trainer_id,
		t.trainer_amount,
		t.product_id,
		t.payment_intent_id,
		t.booked_date,
		u.firstname AS first_name,
		u.lastname AS last_name,
		u.email,
		u.stripe_id AS trainer_stripe_id
	FROM transactions t
	INNER JOIN users u ON t.trainer_id = u.id
	WHERE t.payout_status = 'pending'
	  AND t.booked_date <= :cutoff
	  AND u.stripe_id IS NOT NULL
	  AND u.stripe_id != ''
	ORDER BY t.trainer_id, t.id
";

try {
	$stmt = $pdo->prepare($sql);
	$stmt->bindParam(':cutoff', $cutoff);
	$stmt->execute();
	$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
	error_log('AutoStripeTransfer DB error: ' . $e->getMessage());
	fwrite(STDERR, "DB error: " . $e->getMessage() . "\n");
	exit(1);
}

if (empty($transactions)) {
	fwrite(STDOUT, "No pending transactions found for cutoff $cutoff\n");
	exit(0);
}

$stripeClient = new \Stripe\StripeClient($stripeSecret);

$results = [];

foreach ($transactions as $tx) {
	$transactionId = $tx['transaction_id'];
	$trainerId = $tx['trainer_id'];
	$trainerStripeId = $tx['trainer_stripe_id'];
	$trainerAmount = $tx['trainer_amount'];
	$currency = $tx['currency'] ?? 'SEK';
	$paymentIntentId = $tx['payment_intent_id'] ?? null;

	// Convert to smallest unit (assume numeric value stored in main currency units)
	$amountSmallest = (int) round($trainerAmount * 100);

	if ($amountSmallest <= 0 || empty($trainerStripeId) || empty($paymentIntentId)) {
		$results[] = [
			'transaction_id' => $transactionId,
			'trainer_id' => $trainerId,
			'status' => 'skipped',
			'reason' => 'invalid data or missing payment_intent',
			'amount' => $amountSmallest,
			'trainer_stripe_id' => $trainerStripeId,
			'payment_intent_id' => $paymentIntentId,
		];
		continue;
	}

	// Idempotency key per transaction
	$idempotencyKey = 'tx-' . $transactionId . '-' . bin2hex(random_bytes(8));

	fwrite(STDOUT, "Creating transfer for transaction $transactionId (trainer $trainerId) idempotency: $idempotencyKey\n");

	try {
		// Resolve PaymentIntent -> Charge ID (Stripe transfers expect a charge id as source_transaction)
		$sourceChargeId = null;
		try {
			// Retrieve the PaymentIntent from Stripe
			$pi = $stripeClient->paymentIntents->retrieve($paymentIntentId, []);
            var_dump($pi);
			if (!empty($pi->latest_charge)) {
				$sourceChargeId = $pi->latest_charge;
			} else {
				throw new \Exception("No charges found on PaymentIntent {$paymentIntentId}");
			}
		} catch (\Stripe\Exception\ApiErrorException $pie) {
			// If Stripe API returns an error while retrieving the PaymentIntent, record and skip this transaction
			error_log('Stripe PaymentIntent retrieve error for transaction ' . $transactionId . ': ' . $pie->getMessage());
			$results[] = [
				'transaction_id' => $transactionId,
				'trainer_id' => $trainerId,
				'status' => 'stripe_payment_intent_error',
				'message' => $pie->getMessage(),
				'payment_intent_id' => $paymentIntentId,
			];
			continue;
		} catch (\Exception $pe) {
			error_log('Error resolving charge for PaymentIntent ' . $paymentIntentId . ': ' . $pe->getMessage());
			$results[] = [
				'transaction_id' => $transactionId,
				'trainer_id' => $trainerId,
				'status' => 'no_charge_on_payment_intent',
				'message' => $pe->getMessage(),
				'payment_intent_id' => $paymentIntentId,
			];
			continue;
		}

		$transferParams = [
			'amount' => $amountSmallest,
			'currency' => strtoupper($currency),
			'destination' => $trainerStripeId,
			'description' => "Traino payout tx {$transactionId} for trainer {$trainerId} - " . date('Y-m-d'),
			'source_transaction' => $sourceChargeId,
		];

		$transfer = $stripeClient->transfers->create($transferParams, ['idempotency_key' => $idempotencyKey]);
		$stripeTransferId = $transfer->id ?? null;

		// Retrieve transfer to get destination_payment and update its description on connected account
		try {
			$transferFull = $stripeClient->transfers->retrieve($stripeTransferId, []);
			$destinationPaymentId = $transferFull->destination_payment ?? null;
			if (!empty($destinationPaymentId)) {
				// Lookup product category_link and duration using transaction.product_id
				$prodInfo = [];
				try {
					$prodStmt = $pdo->prepare("SELECT category_link, duration FROM products WHERE id = ? OR product_id = ? LIMIT 1");
					$prodStmt->execute([$tx['product_id'] ?? null, $tx['product_id'] ?? null]);
					$prodInfo = $prodStmt->fetch(PDO::FETCH_ASSOC) ?: [];
				} catch (PDOException $ppe) {
					error_log('Product lookup failed for transaction ' . $transactionId . ': ' . $ppe->getMessage());
				}

				$categoryLink = $prodInfo['category_link'] ?? '';
				$duration = $prodInfo['duration'] ?? '';
				$bookedDate = $tx['booked_date'] ?? '';
				$description = sprintf('Utbetalning för: %s %s min datum: %s', $categoryLink, $duration, $bookedDate);

				try {
					$updatedCharge = $stripeClient->charges->update($destinationPaymentId, ['description' => $description], ['stripe_account' => $trainerStripeId]);
					$results[] = ['transaction_id' => $transactionId, 'destination_payment' => $destinationPaymentId, 'description_set' => $updatedCharge->description ?? null];
				} catch (Exception $ce) {
					error_log('Failed to update destination payment ' . $destinationPaymentId . ': ' . $ce->getMessage());
					$results[] = ['transaction_id' => $transactionId, 'destination_payment' => $destinationPaymentId, 'error' => $ce->getMessage()];
				}
			} else {
				// No destination_payment present
				$results[] = ['transaction_id' => $transactionId, 'note' => 'no_destination_payment_on_transfer', 'transfer_id' => $stripeTransferId];
			}
		} catch (Exception $te) {
			error_log('Failed to retrieve transfer ' . ($stripeTransferId ?? '') . ': ' . $te->getMessage());
			$results[] = ['transaction_id' => $transactionId, 'transfer_retrieve_error' => $te->getMessage()];
		}

		// Update this single transaction as completed
		$updateSql = "UPDATE transactions
					  SET payout_status = 'completed',
						  stripe_transfer_id = ?,
						  payout_date = NOW()
					  WHERE id = ?
						AND payout_status = 'pending'";
		$updateStmt = $pdo->prepare($updateSql);
		$updateStmt->execute([$stripeTransferId, $transactionId]);
		$updatedCount = $updateStmt->rowCount();

		// Fetch updated row for verification
		$verifyStmt = $pdo->prepare("SELECT id, trainer_id, trainer_amount, payout_status, stripe_transfer_id, payout_date FROM transactions WHERE id = ?");
		$verifyStmt->execute([$transactionId]);
		$updatedRow = $verifyStmt->fetch(PDO::FETCH_ASSOC);

		$results[] = [
			'transaction_id' => $transactionId,
			'trainer_id' => $trainerId,
			'status' => 'success',
			'stripe_transfer_id' => $stripeTransferId,
			'amount' => $amountSmallest,
			'updated_count' => $updatedCount,
			'transaction' => $updatedRow,
		];

	} catch (\Stripe\Exception\ApiErrorException $se) {
		error_log('Stripe error for transaction ' . $transactionId . ': ' . $se->getMessage());
		$results[] = [
			'transaction_id' => $transactionId,
			'trainer_id' => $trainerId,
			'status' => 'stripe_error',
			'message' => $se->getMessage(),
			'amount' => $amountSmallest,
			'payment_intent_id' => $paymentIntentId,
		];
	} catch (PDOException $pe) {
		error_log('DB error when marking payout for transaction ' . $transactionId . ': ' . $pe->getMessage());
		$results[] = [
			'transaction_id' => $transactionId,
			'trainer_id' => $trainerId,
			'status' => 'db_error',
			'message' => $pe->getMessage(),
		];
	} catch (Exception $e) {
		error_log('General error for transaction ' . $transactionId . ': ' . $e->getMessage());
		$results[] = [
			'transaction_id' => $transactionId,
			'trainer_id' => $trainerId,
			'status' => 'error',
			'message' => $e->getMessage(),
		];
	}
}

// Print a summary
$friendly = [
	'run_date' => date('Y-m-d H:i:s'),
	'cutoff' => $cutoff,
	'groups_count' => count($transactions),
	'results' => $results,
];

$fmsg = json_encode($friendly, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
fwrite(STDOUT, $fmsg . "\n");
error_log('AutoStripeTransfer result: ' . $fmsg);

exit(0);

