<?php
require_once("db.php");
require_once("functions.php");
require_once("encryptkey.php");
require_once("apikey.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Read and decode the incoming JSON data
$rawInput = file_get_contents('php://input');

$data = json_decode($rawInput, true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

if(isset($data['id'])) {

  $user_id = $data['id'];
  
  // Check if this is just a pre-check request to show warnings
  if(isset($data['check_only']) && $data['check_only'] === true) {
    try {
      // Check for active bookings in trainingpass/onlinetraining with more than 24 hours left
      $sql_check_bookings = "SELECT 
        pb.id,
        pb.product_type,
        pb.booked_date,
        pb.starttime,
        pb.payment_intent_id,
        p.price,
        TIMESTAMPDIFF(HOUR, NOW(), CONCAT(pb.booked_date, ' ', pb.starttime)) AS hours_until_booking
      FROM pass_booked pb
      JOIN products p ON pb.product_id = p.id
      WHERE pb.user_id = :user_id 
        AND pb.canceled = 0 
        AND (pb.product_type = 'trainingpass' OR pb.product_type = 'onlinetraining')
        AND CONCAT(pb.booked_date, ' ', pb.starttime) > NOW()";
      
      $stmt_check = $pdo->prepare($sql_check_bookings);
      $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
      $stmt_check->execute();
      $active_bookings = $stmt_check->fetchAll(PDO::FETCH_ASSOC);
      
      $refundable_bookings = [];
      $non_refundable_bookings = [];
      $total_refund_amount = 0;
      
      foreach($active_bookings as $booking) {
        if($booking['hours_until_booking'] > 24) {
          $refundable_bookings[] = $booking;
          $total_refund_amount += $booking['price'];
        } else {
          $non_refundable_bookings[] = $booking;
        }
      }
      
      // Check for non-refundable products (trainprogram, dietprogram)
      $sql_check_products = "SELECT 
        ubp.product,
        p.price,
        p.product_type
      FROM user_bought_products ubp
      JOIN products p ON ubp.product_id = p.id
      WHERE ubp.user_id = :user_id 
        AND (ubp.product = 'trainprogram' OR ubp.product = 'dietprogram')";
      
      $stmt_products = $pdo->prepare($sql_check_products);
      $stmt_products->bindParam(':user_id', $user_id, PDO::PARAM_INT);
      $stmt_products->execute();
      $owned_programs = $stmt_products->fetchAll(PDO::FETCH_ASSOC);
      
      $response = [
        "has_active_bookings" => !empty($active_bookings),
        "refundable_bookings" => $refundable_bookings,
        "non_refundable_bookings" => $non_refundable_bookings,
        "owned_programs" => $owned_programs,
        "total_refund_amount" => $total_refund_amount
      ];
      
      sendJson($response);
      exit;
      
    } catch (Exception $e) {
      sendJsonError("Failed to check bookings: " . $e->getMessage());
      exit;
    }
  }

  // TODO: SECURITY RISK - Uncomment this line to validate user session
  // validateSessionID($pdo, $user_id, false);

  try {
      // First, retrieve user information for sending confirmation email
      $sql = "SELECT firstname, AES_DECRYPT(email, :key) as email, user_password FROM users WHERE id = :user_id";
      $stmt = $pdo->prepare($sql);
      $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
      $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
      $stmt->execute();
      
      $user = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if (!$user) {
          sendJsonError("User not found");
          exit;
      }
      
      $username = $user['firstname'];
      $email = $user['email'];
      $storedHashedPassword = $user['user_password'];

      $currentPassword = isset($data['currentPassword']) ? trim(validate_and_sanitize($data['currentPassword'], "password")) : null;
      
      if (empty($storedHashedPassword) || empty($currentPassword)) {
            sendJsonError("Password verification required");
            exit;
      }
      
      $isPasswordCorrect = password_verify($currentPassword, $storedHashedPassword);

      if ($isPasswordCorrect === false) {
          sendJsonError("Incorrect password");
          exit;
      }

    
      
      $pdo->beginTransaction();



      // Delete from 'user_train_categories' table
      $stmt = $pdo->prepare("DELETE FROM user_train_categories WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'user_bought_products' table
      $stmt = $pdo->prepare("UPDATE user_bought_products SET user_deleted = 1 WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'user_clipcards' table
      $stmt = $pdo->prepare("DELETE FROM user_clipcards WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'user_education' table
      $stmt = $pdo->prepare("DELETE FROM user_education WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'user_sessions' table
      $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'rating' table for user_id
      $stmt = $pdo->prepare("DELETE FROM rating WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'rating' table for rating_user_id
      $stmt = $pdo->prepare("DELETE FROM rating WHERE rating_user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Soft delete from 'products' table (set deleted = 1)
      $stmt = $pdo->prepare("UPDATE products SET deleted = 1 WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Soft delete from 'pass_set' table (set user_deleted = 1)
      $stmt = $pdo->prepare("UPDATE pass_set SET user_deleted = 1 WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'pass_booked' table for user_id
      $stmt = $pdo->prepare("UPDATE pass_booked SET user_deleted = 1 WHERE user_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'pass_booked' table for trainer_id
      $stmt = $pdo->prepare("UPDATE pass_booked SET user_deleted = 1 WHERE trainer_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'notifications' table for sender_id
      $stmt = $pdo->prepare("DELETE FROM notifications WHERE sender_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Delete from 'notifications' table for recipient_id
      $stmt = $pdo->prepare("DELETE FROM notifications WHERE recipient_id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();

      // Update users table to mark as deleted and clear sensitive data
      $stmt = $pdo->prepare("UPDATE users SET 
        deleted = 1,
        user_password = '',
        firstname = 'DELETED',
        lastname = '',
        email = '',
        alias = '',
        mobilephone = '',
        personalnumber = '',
        youtube_id = '',
        user_area = '',
        user_address = '',
        user_areacode = '',
        latitude = 0,
        longitude = 0,
        user_about = '',
        hashkey = '',
        subscriber = 0,
        confirmed = 0,
        stripe_account = 0,
        stripe_id = '',
        roll = '',
        verified = 0,
        thumbnail = 0,
        coverimage = 0
        WHERE id = :user_id");
      $stmt->bindParam(':user_id', $user_id);
      $stmt->execute();


      // Commit the transaction
      $pdo->commit();

      // Send deletion confirmation email
      $to = $email;
      $subject = "TRAINO - Vi kommer att sakna dig!";
      $message = "Hej,<br><br>Vi har nu raderat alla dina uppgifter från TRAINO. Om du vill registrera dig igen så är du varmt välkommen tillbaka!<br><br>MVH<br>TRAINO";
      
      // Send deletion confirmation email (after transaction is committed)
      try {
        sendEmail($to, $subject, $message, $headers = []);
      } catch (Exception $emailError) {
        // Log email error but don't fail the deletion process
        error_log("Failed to send deletion confirmation email: " . $emailError->getMessage());
      }

      $response = ["success" => "All records related to user with ID $user_id have been deleted successfully."];
     
      sendJson($response);
        
  } catch (Exception $e) {
      // Rollback the transaction if something failed
      $pdo->rollBack();
      sendJsonError("Failed to delete user data: " . $e->getMessage());
  }
 $pdo = null;
}