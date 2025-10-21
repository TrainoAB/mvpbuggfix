<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");
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

    error_log("Received data: " . print_r($data, true));

    try {
        // Validate and sanitize inputs
        $user_id = validate_and_sanitize($data['user_id'], "integer");
        $cat = validate_and_sanitize($data['booking']['category_link'], "text");
        $product_type = validate_and_sanitize($data['booking']['product_type'], "text");
        $price = validate_and_sanitize($data['booking']['price'], "integer");
        $product_id = validate_and_sanitize($data['booking']['product_id'], "integer");
        $trainer_id = validate_and_sanitize($data['booking']['trainer_id'], "integer");
        
        $pass_set_id = validate_and_sanitize($data['booking']['pass_set_id'], "integer");
        $pass_set_repeat_id = validate_and_sanitize($data['booking']['pass_repeat_id'], "text");
        $start = $data['booking']['start'];
        $end = $data['booking']['end'];
        // $stripe_order_id = validate_and_sanitize($data['stripe_order_id'], "text");

        $payment_intent_id = validate_and_sanitize($data['booking']['payment_intent_id'], "text");
        if (empty($payment_intent_id)) {
            http_response_code(400);
            sendJsonError("Missing payment_intent_id");
        }
  

        // $rrule = json_encode($data['booking']['rrule'], true);

        // error_log("stripe_order_id: " . $stripe_order_id);

        // Handle date and time - dates now come in YYYY-MM-DD HH:MM:SS format
        $newdatestart = DateTime::createFromFormat('Y-m-d H:i:s', $start);
        $newdateend = DateTime::createFromFormat('Y-m-d H:i:s', $end);
        
        // Check if parsing was successful
        if (!$newdatestart || !$newdateend) {
            error_log("Failed to parse dates. Start: $start, End: $end");
            http_response_code(400);
            sendJsonError("Invalid date format received");
            exit;
        }
        
        $booked_date = $newdatestart->format('Y-m-d');
        $starttime = $newdatestart->format('H:i:s');
        $endtime = $newdateend->format('H:i:s');

        // Verify payment with Stripe before making any DB mutations
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

            if (!$pi || !isset($pi->status)) {
                http_response_code(400);
                sendJsonError('Unable to verify payment status');
            }

            if ($pi->status !== 'succeeded') {
                // Only allow booking creation if funds have settled
                http_response_code(402); // Payment Required
                sendJsonError('Payment not completed. Current status: ' . $pi->status);
            }
        } catch (\Stripe\Exception\ApiErrorException $e) {
            http_response_code(400);
            sendJsonError('Stripe API error: ' . $e->getMessage());
        } catch (Exception $e) {
            http_response_code(500);
            sendJsonError('Unexpected error during payment verification: ' . $e->getMessage());
        }

        // Idempotency/deduplication: if this payment_intent_id already booked, return success
        try {
            $dupCheck = $pdo->prepare("SELECT id FROM pass_booked WHERE payment_intent_id = :pid LIMIT 1");
            $dupCheck->bindParam(':pid', $payment_intent_id, PDO::PARAM_STR);
            $dupCheck->execute();
            $existing = $dupCheck->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                // Already processed booking for this payment intent
                sendJson(['success' => true, 'message' => 'Booking already exists for this payment', 'booking_id' => $existing['id']]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            sendJsonError('Database error during idempotency check: ' . $e->getMessage());
        }

        // Check for overlapping bookings - improved validation
        // This query finds any existing bookings that would overlap with the new booking
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
        $stmt->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
        $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
        $stmt->bindParam(':endtime', $endtime, PDO::PARAM_STR);

        // Execute the query
        $stmt->execute();

        // Fetch all results
        $overlappingBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if any overlapping bookings were found
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
        
        // Prepare SQL statement
        $sql_bookedinsert = "INSERT INTO pass_booked (user_id, product_type, product_id, trainer_id, pass_set_id, pass_set_repeat_id, booked_date, starttime, endtime, payment_intent_id)
                VALUES (:user_id, :product_type, :product_id, :trainer_id, :pass_set_id, :pass_set_repeat_id, :booked_date, :starttime, :endtime, :payment_intent_id)";

        // Prepare the statement
        $stmt = $pdo->prepare($sql_bookedinsert);

        // Bind parameters
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_type', $product_type, PDO::PARAM_STR);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
        $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        $stmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_INT);
        $stmt->bindParam(':pass_set_repeat_id', $pass_set_repeat_id, PDO::PARAM_STR);
        // $stmt->bindParam(':rrule', $rrule, PDO::PARAM_STR);
        $stmt->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
        $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
        $stmt->bindParam(':endtime', $endtime, PDO::PARAM_STR);
  
        // $stmt->bindParam(':stripe_order_id', $stripe_order_id, PDO::PARAM_STR);
        $stmt->bindParam(':payment_intent_id', $payment_intent_id, PDO::PARAM_STR);

    // Execute the statement
    $stmt->execute();

        $datetime_combined = $booked_date . ' ' . $endtime;

        $datetime = DateTime::createFromFormat('Y-m-d H:i:s', $datetime_combined);
        if (!$datetime) {
            die("Error: Invalid datetime format - " . $datetime_combined);
        }

        $datetime_formatted = $datetime->format('Y-m-d H:i:s'); // Ensures correct format

       // Prepare SQL statement for transactions, with idempotency guard
    $existsTx = $pdo->prepare("SELECT id FROM transactions WHERE payment_intent_id = :pid LIMIT 1");
    $existsTx->bindParam(':pid', $payment_intent_id, PDO::PARAM_STR);
    $existsTx->execute();
    $existingTx = $existsTx->fetch(PDO::FETCH_ASSOC);

    if (!$existingTx) {
        $sql_transactions = "INSERT INTO transactions (trainee_id, product_id, trainer_id, booked_date, endtime, productinfo, price, payment_intent_id)
            VALUES (:trainee_id, :product_id, :trainer_id, :booked_date, :endtime, :productinfo, :price, :payment_intent_id)";

        // Prepare the statement
        $stmt2 = $pdo->prepare($sql_transactions);

        // Bind parameters
        $stmt2->bindParam(':trainee_id', $user_id, PDO::PARAM_INT);
        $stmt2->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $stmt2->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        $stmt2->bindParam(':productinfo', $product_type, PDO::PARAM_STR);
        $stmt2->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
        $stmt2->bindParam(':endtime', $datetime_formatted, PDO::PARAM_STR);
        $stmt2->bindParam(':price', $price, PDO::PARAM_INT);
        $stmt2->bindParam(':payment_intent_id', $payment_intent_id, PDO::PARAM_STR);

        // Execute the statement
        $stmt2->execute();
    }

        // Update the categories table to increment the bought column
        $sql3 = "UPDATE categories SET bought = bought + 1 WHERE category_link = :category_link";
        $stmt3 = $pdo->prepare($sql3);
        $stmt3->bindParam(':category_link', $cat, PDO::PARAM_STR);
        $stmt3->execute();

         // Get trainer email for notification
         $getemail = "SELECT AES_DECRYPT(email, :key) AS email FROM users WHERE id = :trainer_id";

         $stmt4 = $pdo->prepare($getemail);
         $stmt4->bindParam(':key', $encryptionKey, PDO::PARAM_STR);  // Make sure $key is defined
         $stmt4->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
         $stmt4->execute();
         $resultemail = $stmt4->fetch(PDO::FETCH_ASSOC);
         
         // Convert binary result to readable string
         $traineremail = $resultemail ? $resultemail['email'] : null;

        $pdo = null; // Close the database connection
                // Definiera översättning av product_type
        $productNames = [
            'trainingpass' => 'träningspass',
            'onlinetraining' => 'online träningspass'
        ];

        // Hämta korrekt namn eller visa original om det inte finns i listan
        $translatedProductType = isset($productNames[$product_type]) ? $productNames[$product_type] : $product_type;

        // Beräkna vad användaren får efter 15% avgift (Traino + Stripe)
        $amountAfterFees = round($price * 0.85, 2); // behåller 2 decimaler
        $subject = "";
        if($translatedProductType === 'träningspass') {
             $subject = "TRAINO - Någon har bokat ett pass";
        }  elseif($translatedProductType === 'online träningspass') {
             $subject = "TRAINO - Någon har bokat ett online pass";
        }
       
        $message = "
        Hej,<br><br>
        Detta bekräftar att en användare har bokat ett <strong>$translatedProductType</strong> nyligen via TRAINO, för <strong>$price kr</strong>.<br>
        Efter avgifter från Stripe och TRAINO (15%), får du behålla <strong>$amountAfterFees kr</strong>. Betalningen till ditt Striåe konto sker inom 2 timmar efter att ditt träningspass är över.<br><br>
        MVH<br>
        <strong>TRAINO</strong>";

    sendEmail($traineremail, $subject, $message, $headers = []);

        // Send success response
        $response = ['success' => true, 'message' => "Booking saved successfully."];
        sendJson($response);
    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
    }
}