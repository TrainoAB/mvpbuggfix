<?php

require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Check if the 'session_id' property exists in the received data
if (!isset($data['product_id'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property 'session_id' in JSON.");
    exit;
}

// Additional code here
$clipcard_id = validate_and_sanitize($data['clipcard_id'], "integer");
$product_id = validate_and_sanitize($data['product_id'], "integer");
$user_id = validate_and_sanitize($data['user_id'], "integer");
$trainer_id = validate_and_sanitize($data['booking']['trainer_id'], "integer");
$pass_set_id = validate_and_sanitize($data['booking']['pass_set_id'], "integer");
$pass_set_repeat_id = validate_and_sanitize($data['booking']['pass_set_repeat_id'], "integer");
$product_type = validate_and_sanitize($data['booking']['product_type'], "text");
$booked_date_start = $data['booking']['start'];
$booked_date_end = $data['booking']['end'];

// Create a DateTime object from the input string
$dateTimeStart = new DateTime($booked_date_start);
$dateTimeEnd = new DateTime($booked_date_end);
$starttime = $dateTimeStart->format('H:i:s'); // Format as HH:MM:SS
$endtime = $dateTimeEnd->format('H:i:s'); // Format as HH:MM:SS
$date = $dateTimeStart->format('Y-m-d'); // Format as YYYY-MM-DD

try {
    // Check for overlapping bookings - prevent conflicts
    $sql = "SELECT * FROM pass_booked 
            WHERE trainer_id = :trainer_id 
            AND booked_date = :booked_date 
            AND canceled = 0
            AND ispause = 0
            AND (
                -- New booking starts before existing ends AND new booking ends after existing starts
                (:starttime < endtime AND :endtime > starttime)
            )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
    $stmt->bindParam(':booked_date', $date, PDO::PARAM_STR);
    $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
    $stmt->bindParam(':endtime', $endtime, PDO::PARAM_STR);
    $stmt->execute();
    
    $overlappingBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($overlappingBookings) > 0) {
        $conflictDetails = [];
        foreach ($overlappingBookings as $booking) {
            $conflictDetails[] = "Existing booking: {$booking['starttime']} - {$booking['endtime']}";
        }
        
        http_response_code(409); // Conflict
        // Create multilingual error message
        $errorMessages = [
            'en' => "Time slot conflict detected. The requested time ({$starttime} - {$endtime}) overlaps with existing bookings: " . implode(", ", $conflictDetails),
            'sv' => "Tidskonflikt upptäckt. Den begärda tiden ({$starttime} - {$endtime}) överlappar med befintliga bokningar: " . implode(", ", $conflictDetails)
        ];
        sendJsonError(json_encode($errorMessages));
        exit;
    }

    // Insert the booking into the database
    $stmt = $pdo->prepare("INSERT INTO pass_booked (user_id, product_id, product_type, trainer_id, pass_set_id, pass_set_repeat_id, booked_date, starttime, endtime) VALUES (:user_id, :product_id, :product_type, :trainer_id, :pass_set_id, :pass_set_repeat_id, :booked_date, :starttime, :endtime)");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $stmt->bindParam(':product_type', $product_type, PDO::PARAM_INT);
    $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
    $stmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_INT);
    $stmt->bindParam(':pass_set_repeat_id', $pass_set_repeat_id, PDO::PARAM_INT);
    $stmt->bindParam(':booked_date', $date, PDO::PARAM_STR);
    $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
    $stmt->bindParam(':endtime', $endtime, PDO::PARAM_STR);

    $stmt->execute();

    // Deduct one clipcard from the user
    $stmt = $pdo->prepare("UPDATE user_clipcards SET clipcard_amount = clipcard_amount - 1 WHERE user_id = :user_id AND product_id = :product_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $stmt->execute();

    // Insert the transaction into the transactions table
    $stmt = $pdo->prepare("INSERT INTO transactions (trainee_id, trainer_id, product_id, status, clipcard_amount, booked_date, payment_method) VALUES (:trainee_id, :trainer_id, :product_id, 'complete', 1, :booked_date, 'clipcard')");
    $stmt->bindParam(':trainee_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
    $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $stmt->bindParam(':booked_date', $date, PDO::PARAM_STR);
    $stmt->execute();

    sendJson(["success" => "Booking successfully created"]);
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    sendJsonError("Database error: " . $e->getMessage());
}