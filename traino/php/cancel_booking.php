<?php
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");
require_once("encryptkey.php");
require 'vendor/autoload.php';

// Try to load Stripe secret key from local include (deployment-specific) or env var
if (file_exists(__DIR__ . '/stripekey.php')) {
  require_once("stripekey.php");
}

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

  // Assume incoming data is JSON and decode it
  $data = json_decode(file_get_contents('php://input'), true);

  // Check if the received data is valid JSON
  if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
  }

  if(!isset($data['booking_id'])) {
    sendJsonError("Missing required field: booking_id");
    exit;
  }
    
  $id = (int)$data['booking_id'];
  $reason = isset($data['reason']) ? trim($data['reason']) : '';

  // Optional: booking data from frontend (for emails only)
  $frontendBooking = $data['booking'] ?? null;

  // Debug logging
  error_log("Cancel booking request - ID: " . $id . ", Reason: " . $reason);

  try {

    // Fetch booking incl. emails and PI id
    $sqlSelect = "SELECT 
  pb.*, 
  pb.user_id AS user_id,
  pb.trainer_id AS trainer_id,
  AES_DECRYPT(t.email, :key) AS trainer_email,
  AES_DECRYPT(u.email, :key) AS user_email
FROM 
  pass_booked pb
LEFT JOIN users t ON pb.trainer_id = t.id
LEFT JOIN users u ON pb.user_id = u.id
WHERE 
  pb.id = :id
LIMIT 1";
    $stmtSelect = $pdo->prepare($sqlSelect);
    $stmtSelect->bindParam(':id', $id, PDO::PARAM_INT);
    $stmtSelect->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmtSelect->execute();
    $booking = $stmtSelect->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
      http_response_code(404);
      sendJsonError("Booking not found");
    }

    $email = $booking['user_email'];
    $traineremail = $booking['trainer_email'];
    $trainerId = (int)$booking['trainer_id'];
    $userId = (int)$booking['user_id'];
    $payment_intent_id = $booking['payment_intent_id'] ?? null;

    // Authz: only trainee (owner) or admin may cancel
    $session = validateSessionID($pdo, null); // returns array incl. role & user_id from cookie session
    $cookie_user_id = isset($session['user_id']) ? (int)$session['user_id'] : null;
    $roleFromSession = $session['role'] ?? null;
    $isAdmin = ($roleFromSession === 'admin');

    // Determine actor: trainee, trainer, or admin
    $actor = null;
    if ($isAdmin) {
      $actor = 'admin';
    } elseif ($cookie_user_id !== null && $cookie_user_id === $userId) {
      $actor = 'trainee';
    } elseif ($cookie_user_id !== null && $cookie_user_id === $trainerId) {
      $actor = 'trainer';
    }

    if ($actor === null) {
      http_response_code(403);
      sendJsonError("Unauthorized: You do not have permission to cancel this booking.");
    }

    // Idempotency: if already canceled, return success with existing refund info if any
    if ((int)$booking['canceled'] === 1) {
      $existingRefundId = null;
      if ($payment_intent_id) {
        try {
          $st = $pdo->prepare("SELECT info FROM transactions WHERE payment_intent_id = :pi LIMIT 1");
          $st->bindParam(':pi', $payment_intent_id, PDO::PARAM_STR);
          $st->execute();
          $row = $st->fetch(PDO::FETCH_ASSOC);
          if ($row && !empty($row['info'])) {
            $infoJson = json_decode($row['info'], true);
            if (is_array($infoJson) && isset($infoJson['refund_id'])) {
              $existingRefundId = $infoJson['refund_id'];
            }
          }
        } catch (Exception $e) { /* ignore */ }
      }
      sendJson([
        'success' => true,
        'canceled' => true,
        'message' => 'Booking already canceled',
        'booking_id' => $id,
        'payment_intent_id' => $payment_intent_id,
        'refund_id' => $existingRefundId,
      ]);
    }

    // Time rule using Europe/Stockholm timezone
    $tz = new DateTimeZone('Europe/Stockholm');
    $now = new DateTimeImmutable('now', $tz);
    $startDateStr = trim(($booking['booked_date'] ?? '') . ' ' . ($booking['starttime'] ?? ''));
    if ($startDateStr === '') {
      http_response_code(400);
      sendJsonError('Invalid booking date/time');
    }
    $startDateTime = new DateTimeImmutable($startDateStr, $tz);
    if ($actor === 'trainee') {
      // Trainee must cancel at least 24h before start
      $limit = $startDateTime->sub(new DateInterval('P1D'));
      if ($now >= $limit) {
        http_response_code(409);
        sendJsonError('Cancellation window has passed (must be at least 24h before start).');
      }
    } elseif ($actor === 'trainer') {
      // Trainer may cancel any time before start
      if ($now >= $startDateTime) {
        http_response_code(409);
        sendJsonError('Cancellation not allowed after the session has started.');
      }
    } else {
      // Admin may cancel regardless of start time
    }

    // Default reason based on actor when not provided
    if ($reason === '') {
      $reason = ($actor === 'trainee') ? 'canceled_by_user_24h' : 'canceled_by_trainer';
    }

    // Must have a payment to refund
    if (!$payment_intent_id) {
      http_response_code(409);
      sendJsonError('No payment found for this booking');
    }

    // Check transactions & payout eligibility
    $txStmt = $pdo->prepare("SELECT * FROM transactions WHERE payment_intent_id = :pi LIMIT 1");
    $txStmt->bindParam(':pi', $payment_intent_id, PDO::PARAM_STR);
    $txStmt->execute();
    $tx = $txStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tx) {
      http_response_code(409);
      sendJsonError('Transaction not found for this payment');
    }

    if (isset($tx['payout_status']) && $tx['payout_status'] !== 'pending') {
      http_response_code(409);
      sendJsonError('Refund not allowed: payout in progress or completed');
    }

    // Verify PaymentIntent state via Stripe
    try {
      $stripeSecret = null;
      if (defined('STRIPE_KEY')) {
        $stripeSecret = STRIPE_KEY;
      } elseif (getenv('STRIPE_SECRET_KEY')) {
        $stripeSecret = getenv('STRIPE_SECRET_KEY');
      }
      if (!$stripeSecret) {
        http_response_code(500);
        sendJsonError('Stripe secret key not configured on server');
      }

      \Stripe\Stripe::setApiKey($stripeSecret);
      $pi = \Stripe\PaymentIntent::retrieve($payment_intent_id);
      if (!$pi || !isset($pi->status) || $pi->status !== 'succeeded') {
        http_response_code(409);
        sendJsonError('Payment not eligible for refund');
      }
    } catch (\Stripe\Exception\ApiErrorException $e) {
      http_response_code(400);
      sendJsonError('Stripe API error: ' . $e->getMessage());
    }

    // Create full refund with idempotency key
    try {
      $refund = \Stripe\Refund::create(
        [ 'payment_intent' => $payment_intent_id ],
        [ 'idempotency_key' => 'refund_booking_' . $id ]
      );
    } catch (\Stripe\Exception\ApiErrorException $e) {
      // If idempotent collision or already refunded, proceed to mark DB if appropriate
      // Re-fetch existing refunds for PI could be done, but for minimal changes, surface error
      http_response_code(400);
      sendJsonError('Stripe refund error: ' . $e->getMessage());
    }

    // Persist DB updates transactionally
    try {
      $pdo->beginTransaction();

      // Update booking
      $up1 = $pdo->prepare("UPDATE pass_booked SET canceled = 1, reason = :reason WHERE id = :id");
      $up1->bindParam(':id', $id, PDO::PARAM_INT);
      $up1->bindParam(':reason', $reason, PDO::PARAM_STR);
      $up1->execute();

      // Prepare info JSON (keep short to fit VARCHAR)
      $info = json_encode([
        'refund_id' => $refund->id ?? null,
        'refunded_at' => isset($refund->created) ? gmdate('c', $refund->created) : gmdate('c'),
        'refund_amount' => $refund->amount ?? null,
      ]);

      $status = 'refunded';
      $payoutStatus = 'failed';
      $up2 = $pdo->prepare("UPDATE transactions SET status = :status, payout_status = :payout, info = :info WHERE payment_intent_id = :pi");
      $up2->bindParam(':status', $status, PDO::PARAM_STR);
      $up2->bindParam(':payout', $payoutStatus, PDO::PARAM_STR);
      $up2->bindParam(':info', $info, PDO::PARAM_STR);
      $up2->bindParam(':pi', $payment_intent_id, PDO::PARAM_STR);
      $up2->execute();

      $pdo->commit();
    } catch (Exception $e) {
      $pdo->rollBack();
      http_response_code(500);
      sendJsonError('Database error during cancellation: ' . $e->getMessage());
    }

    // Extract email data - prefer frontend data if available, fallback to database
    $booking_date = $frontendBooking['booked_date'] ?? $booking['booked_date'] ?? null;
    $starttime = $frontendBooking['starttime'] ?? $booking['starttime'] ?? null;
    $endtime = $frontendBooking['endtime'] ?? $booking['endtime'] ?? null;
    $sport = $frontendBooking['sport']['category_name'] ?? $booking['category_name'] ?? null;
    $sportimage = $frontendBooking['sport']['category_image'] ?? $booking['category_image'] ?? null;
    $trainer_name = $frontendBooking['trainer']['trainer_name'] ?? $booking['trainer_name'] ?? null;
    $trainer_alias = $frontendBooking['trainer']['alias'] ?? $booking['trainer_alias'] ?? null;
    $address = $frontendBooking['address'] ?? $booking['address'] ?? null;
    $user_name = $frontendBooking['user']['user_name'] ?? $booking['user_name'] ?? null;

    // Send emails (best-effort; ignore failures)
    $subject = "TRAINO - Avbokat pass";
    $message = "
  <html>
  <body>
  <p>Hej,</p>
  <p>Detta mail indikerar att ett pass har blivit <strong>avbokat</strong> via TRAINO.</p>

  <h3>📄 Bokningsinformation</h3>
  <table cellpadding='6' cellspacing='0' border='0' style='border-collapse: collapse;'>
    <tr>
    <td><strong>Boknings-ID:</strong></td>
    <td>{$id}</td>
    </tr>
    <tr>
    <td><strong>Datum:</strong></td>
    <td>{$booking_date}</td>
    </tr>
    <tr>
    <td><strong>Tid:</strong></td>
    <td>{$starttime} – {$endtime}</td>
    </tr>
    <tr>
    <td><strong>Sport:</strong></td>
    <td>{$sport}</td>
    </tr>
    <tr>
    <td><strong>Adress:</strong></td>
    <td>{$address}</td>
    </tr>
    <tr>
    <td><strong>Tränare:</strong></td>
    <td>{$trainer_name} @{$trainer_alias}</td>
    </tr>
    <tr>
    <td><strong>Trainee:</strong></td>
    <td>{$user_name}</td>
    </tr>
    <tr>
    <td><strong>Anledning:</strong></td>
    <td>{$reason}</td>
    </tr>
  </table>";

    if (!empty($sportimage)) {
      $message .= "
  <p><img src='{$sportimage}' alt='Sportbild' style='max-width:300px; border:1px solid #ccc; margin-top:10px;' /></p>";
    }

    $message .= "
  <br>
  <p>Med vänlig hälsning,<br><strong>TRAINO</strong></p>
  </body>
  </html>
";

    // Try send emails, but don't fail request if they error
    try { if ($email) { sendEmail($email, $subject, $message, $headers = []); } } catch (Exception $e) {}
    try { if ($traineremail) { sendEmail($traineremail, $subject, $message, $headers = []); } } catch (Exception $e) {}

    sendJson([
      'success' => true,
      'canceled' => true,
      'booking_id' => $id,
      'payment_intent_id' => $payment_intent_id,
      'refund_id' => $refund->id ?? null,
    ]);

  } catch (PDOException $e) {
    http_response_code(500);
    sendJsonError("Error: " . $e->getMessage());
  }

}
