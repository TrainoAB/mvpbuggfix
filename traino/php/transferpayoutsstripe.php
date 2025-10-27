<?php
/**
 * Transfer pending payouts to trainers via Stripe Transfers.
 *
 * Intended to be run from the command line by cron on the 28th of each month.
 * - Finds pending payouts (transactions with payout_status='pending' and status='completed')
 *   where the transaction created_date is on or before the 27th of the current month.
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

// Cutoff: include transactions created on or before the 27th of the current month (end of day)
$cutoff = date('Y-m-27 23:59:59');

// Prepare query: group pending payouts by trainer
$sql = "
	SELECT
		t.trainer_id,
		u.firstname AS first_name,
		u.lastname AS last_name,
		u.email,
		u.stripe_id AS trainer_stripe_id,
		GROUP_CONCAT(t.id) AS transaction_ids,
		SUM(t.trainer_amount) AS total_owed
	FROM transactions t
	INNER JOIN users u ON t.trainer_id = u.id
	WHERE t.payout_status = 'pending'
	  AND t.status = 'completed'
	  AND t.booked_date <= :cutoff
	  AND u.stripe_id IS NOT NULL
	  AND u.stripe_id != ''
	GROUP BY t.trainer_id, u.firstname, u.lastname, u.email, u.stripe_id
	ORDER BY total_owed DESC
";

try {
	$stmt = $pdo->prepare($sql);
	$stmt->bindParam(':cutoff', $cutoff);
	$stmt->execute();
	$payoutGroups = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
	error_log('AutoStripeTransfer DB error: ' . $e->getMessage());
	fwrite(STDERR, "DB error: " . $e->getMessage() . "\n");
	exit(1);
}

if (empty($payoutGroups)) {
	fwrite(STDOUT, "No pending payouts found for cutoff $cutoff\n");
	exit(0);
}

$stripeClient = new \Stripe\StripeClient($stripeSecret);

$results = [];

foreach ($payoutGroups as $group) {
	$trainerId = $group['trainer_id'];
	$trainerStripeId = $group['trainer_stripe_id'];
	$transactionIds = array_filter(array_map('trim', explode(',', $group['transaction_ids'])));
	$totalOwed = (int) $group['total_owed'];

	if ($totalOwed <= 0 || empty($trainerStripeId) || empty($transactionIds)) {
		$results[] = [
			'trainer_id' => $trainerId,
			'status' => 'skipped',
			'reason' => 'invalid data',
			'total_owed' => $totalOwed,
			'trainer_stripe_id' => $trainerStripeId,
			'transaction_count' => count($transactionIds),
		];
		continue;
	}

	// Idempotency key: month and trainer to reduce duplicate transfers on retries
	$idempotencyKey = sprintf('payout_%s_trainer_%s', date('Y_m'), $trainerId);

	try {
		// Create transfer to connected account
		$transfer = $stripeClient->transfers->create([
			'amount' => $totalOwed,
			'currency' => 'sek',
			'destination' => $trainerStripeId,
			'description' => "Traino payout for trainer {$trainerId} - " . date('Y-m-d'),
		], [ 'idempotency_key' => $idempotencyKey ]);

		$stripeTransferId = $transfer->id ?? null;

		// Mark transactions in DB as completed (mirror markpayoutscompleted.php behavior)
		$placeholders = implode(',', array_fill(0, count($transactionIds), '?'));
		$updateSql = "UPDATE transactions
					  SET payout_status = 'completed',
						  stripe_transfer_id = ?,
						  payout_date = NOW()
					  WHERE id IN ($placeholders)
						AND payout_status = 'pending'";

		$updateStmt = $pdo->prepare($updateSql);
		$params = array_merge([$stripeTransferId], $transactionIds);
		$updateStmt->execute($params);
		$updatedCount = $updateStmt->rowCount();

		// Prepare result entry and then mirror markpayoutscompleted.php behaviour locally:
		$results[] = [
			'trainer_id' => $trainerId,
			'status' => 'success',
			'stripe_transfer_id' => $stripeTransferId,
			'total_owed' => $totalOwed,
			'transaction_count' => count($transactionIds),
			'updated_count' => $updatedCount,
		];

		// Wrap DB updates/verifications in a transaction to mirror markpayoutscompleted.php
		try {
			if (!$pdo->inTransaction()) {
				$pdo->beginTransaction();
				$beganTx = true;
			} else {
				$beganTx = false;
			}

			// Re-run the update within the transaction to be safe (idempotent because we only update pending)
			$updateStmt = $pdo->prepare($updateSql);
			$updateStmt->execute($params);
			$updatedCount = $updateStmt->rowCount();

			if ($beganTx) {
				$pdo->commit();
			}

			// Get updated transaction details for reporting
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

			// Attach verification info to last results entry
			$lastIndex = count($results) - 1;
			$results[$lastIndex]['updated_count'] = $updatedCount;
			$results[$lastIndex]['transactions'] = $updatedTransactions;
			$results[$lastIndex]['total_paid_out'] = $totalPaidOut;
			$results[$lastIndex]['total_paid_out_sek'] = number_format($totalPaidOut / 100, 2);

		} catch (PDOException $pe2) {
			// Rollback if in transaction
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}
			error_log('DB error during verification for trainer ' . $trainerId . ': ' . $pe2->getMessage());
			$results[] = [
				'trainer_id' => $trainerId,
				'status' => 'verification_db_error',
				'message' => $pe2->getMessage(),
			];
		}

	} catch (\Stripe\Exception\ApiErrorException $se) {
		error_log('Stripe error for trainer ' . $trainerId . ': ' . $se->getMessage());
		$results[] = [
			'trainer_id' => $trainerId,
			'status' => 'stripe_error',
			'message' => $se->getMessage(),
			'total_owed' => $totalOwed,
			'transaction_count' => count($transactionIds),
		];
	} catch (PDOException $pe) {
		error_log('DB error when marking payouts for trainer ' . $trainerId . ': ' . $pe->getMessage());
		$results[] = [
			'trainer_id' => $trainerId,
			'status' => 'db_error',
			'message' => $pe->getMessage(),
			'total_owed' => $totalOwed,
			'transaction_count' => count($transactionIds),
		];
	} catch (Exception $e) {
		error_log('General error for trainer ' . $trainerId . ': ' . $e->getMessage());
		$results[] = [
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
	'groups_count' => count($payoutGroups),
	'results' => $results,
];

$fmsg = json_encode($friendly, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
fwrite(STDOUT, $fmsg . "\n");
error_log('AutoStripeTransfer result: ' . $fmsg);

exit(0);

