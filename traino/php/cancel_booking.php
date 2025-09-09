<?php
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");
require_once("encryptkey.php");


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

    if(!isset($data['booking_id']) || !isset($data['reason'])) {
        sendJsonError("Missing required fields.");
        exit;
    }
    
    $id = $data['booking_id'];
    $reason = $data['reason'];

    // Get booking data from frontend if provided (for email data)
    $frontendBooking = $data['booking'] ?? null;

    // Debug logging
    error_log("Cancel booking - ID: " . $id . ", Reason: " . $reason);
    error_log("Cancel booking - Frontend booking data: " . json_encode($frontendBooking));


    try {

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
    pb.id = :id;";
        $stmtSelect = $pdo->prepare($sqlSelect);
        $stmtSelect->bindParam(':id', $id, PDO::PARAM_INT);
        $stmtSelect->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmtSelect->execute();
        $booking = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            sendJsonError("Booking not found.");
            exit;
        }

        // Check if booking is already canceled
        if ($booking['canceled'] == 1) {
            sendJsonError("Booking is already canceled.");
            exit;
        }

        $email = $booking['user_email'];
        $traineremail = $booking['trainer_email'];

        $trainerId = $booking['trainer_id'];
        $userId = $booking['user_id'];

       // Get cookie data from xcookie header instead of $_COOKIE
$headers = getallheaders();
$xcookieHeader = $headers['xcookie'] ?? $headers['Xcookie'] ?? null;

error_log("XCOOKIE HEADER: " . $xcookieHeader);

$enudata = null;
$cookieuser_id = null;

if ($xcookieHeader) {
    // Parse the cookie string to extract enudata
    parse_str($xcookieHeader, $cookieArray);
    if (isset($cookieArray['enudata'])) {
        $enudata = json_decode($cookieArray['enudata'], true);
        $cookieuser_id = $enudata['id'] ?? null;
    }
}

error_log("PARSED ENUDATA: " . json_encode($enudata));
error_log("Trainer ID: " . $trainerId . " (" . gettype($trainerId) . ")");
error_log("User ID: " . $userId . " (" . gettype($userId) . ")");
error_log("Cookie User ID: " . $cookieuser_id . " (" . gettype($cookieuser_id) . ")");

// Convert to integers for comparison
$trainerId = (int)$trainerId;
$userId = (int)$userId;
$cookieuser_id = (int)$cookieuser_id;

if ($cookieuser_id === $trainerId) {
    $matchedId = $trainerId;
    $role = 'trainer';
} elseif ($cookieuser_id === $userId) {
    $matchedId = $userId;
    $role = 'trainee';
} else {
    error_log("Authorization failed - Trainer ID: {$trainerId}, User ID: {$userId}, Cookie User ID: {$cookieuser_id}");
    sendJsonError("Unauthorized: You do not have permission to cancel this booking.");
    exit;
}

        // Continue with validated user
        validateSessionID($pdo, $matchedId);


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


      // Prepare the SQL statement
      $sql = "UPDATE pass_booked SET reason = :reason, canceled = 1 WHERE id = :id";
      
      // Prepare the statement with PDO
      $stmt = $pdo->prepare($sql);
      
      // Bind the parameters
      $stmt->bindParam(':id', $id, PDO::PARAM_INT);
      $stmt->bindParam(':reason', $reason, PDO::PARAM_STR);
      
      // Execute the statement
      $stmt->execute();
    
      $pdo = null;

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

    
      sendEmail($email, $subject, $message, $headers = []);
      sendEmail($traineremail, $subject, $message, $headers = []);


      sendJson(["success" => "Booking canceled and reason updated successfully."]);

    } catch (PDOException $e) {
        sendJsonError("Error: " . $e->getMessage());
    }

  }