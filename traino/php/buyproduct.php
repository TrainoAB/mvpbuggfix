<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");
require_once("lib/money.php");

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

    // Check if the received data contains clipcard or other product
    if($data['item']['product_type'] === "clipcard") {

      try {
        // Set variabels
        $product = "clipcard";
        $clipcard_amount = validate_and_sanitize($data['amount'], "integer");
        $total = validate_and_sanitize($data['total'], "integer");

        $product_id = validate_and_sanitize($data['item']['id'], "integer");
        $cat = validate_and_sanitize($data['item']['category_link'], "text");
        $product_id_link = validate_and_sanitize($data['item']['product_id_link'], "integer");
        
        $user_id = validate_and_sanitize($data['buyer_id'], "integer");
        $trainer_id = validate_and_sanitize($data['item']['user_id'], "integer");

        $email = validate_and_sanitize($data['buyer_email'], "email");
        
        // Ensure email is properly encoded as UTF-8
        $email = mb_convert_encoding($email, 'UTF-8', 'auto');

        // SQL to insert the bought product into the database
        $sql = "INSERT INTO `user_bought_products` (`user_id`, `product`, `product_id`, `product_id_link`, `clipcard_amount`) VALUES (:user_id, :product, :product_id, :product_id_link, :amount);";

        $stmt = $pdo->prepare($sql);
        // Bindparams
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product', $product, PDO::PARAM_STR);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $stmt->bindParam(':product_id_link', $product_id_link, PDO::PARAM_INT);
        $stmt->bindParam(':amount', $clipcard_amount, PDO::PARAM_INT);

        $stmt->execute();

        // SQL to get any existing clipcards
        $getclipcards = "SELECT id FROM user_clipcards WHERE user_id = :user_id AND product_id = :product_id";

        $stmt = $pdo->prepare($getclipcards);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $product_id_link, PDO::PARAM_STR);

        $stmt->execute();

        $clipcard = $stmt->fetch(PDO::FETCH_ASSOC);

        // If the user already has a clipcard, update the amount, else insert a new row
        if($clipcard) {
          // Update clipcard
          $updateclipcards = "UPDATE user_clipcards SET clipcard_amount = clipcard_amount + :clipcard_amount WHERE user_id = :user_id AND product_id = :product_id";

          $stmt = $pdo->prepare($updateclipcards);
          $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
          $stmt->bindParam(':product_id', $product_id_link, PDO::PARAM_STR);
          $stmt->bindParam(':clipcard_amount', $clipcard_amount, PDO::PARAM_INT);

          $stmt->execute();
        } else {
          // Insert new clipcard
          $insertclipcards = "INSERT INTO user_clipcards (user_id, product_id, clipcard_amount) VALUES (:user_id, :product_id, :clipcard_amount)";

          $stmt = $pdo->prepare($insertclipcards);
          $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
          $stmt->bindParam(':product_id', $product_id_link, PDO::PARAM_STR);
          $stmt->bindParam(':clipcard_amount', $clipcard_amount, PDO::PARAM_INT);

          $stmt->execute();
        }

        // Calculate 85/15 split for payout tracking (total is in öre)
        $grossAmount = $total; // Full amount paid by customer (in öre)
        $trainerAmount = round($total * 0.85); // 85% to trainer
        $platformFee = $total - $trainerAmount; // Remainder to platform

        // Insert the transaction into the transactions table with payout split
        $transactions = "INSERT INTO `transactions` 
                         (`trainee_id`, `trainer_id`, `product_id`, `price`, `email`, `clipcard_amount`,
                          `gross_amount`, `trainer_amount`, `platform_fee`, `payout_status`) 
                         VALUES 
                         (:trainee_id, :trainer_id, :product_id, :price, AES_ENCRYPT(:email, :key), :clipcard_amount,
                          :gross_amount, :trainer_amount, :platform_fee, 'pending');";


        $stmt = $pdo->prepare($transactions);
        $stmt->bindParam(':trainee_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $stmt->bindParam(':price', $total, PDO::PARAM_INT);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':clipcard_amount', $clipcard_amount, PDO::PARAM_INT);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->bindParam(':gross_amount', $grossAmount, PDO::PARAM_INT);
        $stmt->bindParam(':trainer_amount', $trainerAmount, PDO::PARAM_INT);
        $stmt->bindParam(':platform_fee', $platformFee, PDO::PARAM_INT);

        $stmt->execute();

        // Update the categories table to increment the bought column
        $sql = "UPDATE categories SET bought = bought + 1 WHERE category_link = :category_link";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':category_link', $cat, PDO::PARAM_STR);
        $stmt->execute();

        $sql3 = "SELECT * FROM user_clipcards WHERE user_id = :user_id AND product_id = :product_id";

        // Prepare and execute the SQL statement
        $selectStmt3 = $pdo->prepare($sql3);
        $selectStmt3->bindParam(':product_id', $product_id_link);
        $selectStmt3->bindParam(':user_id', $user_id);
        $selectStmt3->execute();

        // Fetch the results
        $results3 = $selectStmt3->fetchAll(PDO::FETCH_ASSOC);

        $pdo = null;

        sendJson([
          "success" => "Product bought, inserted into database successfully",
          "bought" => $results3[0],
        ]);
        
        exit;

      } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
        exit;
      }

    } elseif ($data['product'] === "trainprogram" || $data['product'] === "dietprogram") {

       try {
        // Set variabels
        $product = $data['product'];
        $total = validate_and_sanitize($data['price'], "integer");
        $product_id = validate_and_sanitize($data['item']['id'], "integer");
        
        $user_id = validate_and_sanitize($data['buyer_id'], "integer");
        $trainer_id = validate_and_sanitize($data['item']['user_id'], "integer");

        $email = validate_and_sanitize($data['buyer_email'], "email");
        
        // Ensure email is properly encoded as UTF-8
        $email = mb_convert_encoding($email, 'UTF-8', 'auto');

        // Check if the product already exists in user_bought_products
        $checkProduct = "SELECT id FROM user_bought_products WHERE user_id = :user_id AND product_id = :product_id";

        $stmt = $pdo->prepare($checkProduct);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);

        $stmt->execute();

        $productExists = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($productExists) {
          sendJson(["productfound" => "Product already bought by the user"]);
          exit;
        }

        // SQL to insert the bought product into the database
        $sql = "INSERT INTO `user_bought_products` (`user_id`, `product`, `product_id`) VALUES (:user_id, :product, :product_id);";

        $stmt = $pdo->prepare($sql);
        // Bindparams
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product', $product, PDO::PARAM_STR);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);

        if(!$stmt->execute()) {
          $pdo = null;
          http_response_code(500); // Internal Server Error
          sendJsonError("Database error: Failed to insert product");
          exit;
        }

        // Calculate 85/15 split for payout tracking (total is in öre)
        $grossAmount = $total; // Full amount paid by customer (in öre)
        $trainerAmount = round($total * 0.85); // 85% to trainer
        $platformFee = $total - $trainerAmount; // Remainder to platform

        // Insert the transaction into the transactions table with payout split
        $transactions = "INSERT INTO `transactions` 
                         (`trainee_id`, `trainer_id`, `product_id`, `price`, `email`, 
                          `gross_amount`, `trainer_amount`, `platform_fee`, `payout_status`) 
                         VALUES 
                         (:trainee_id, :trainer_id, :product_id, :price, :email, 
                          :gross_amount, :trainer_amount, :platform_fee, 'pending');";

        $stmt2 = $pdo->prepare($transactions);
        $stmt2->bindParam(':trainee_id', $user_id, PDO::PARAM_INT);
        $stmt2->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        $stmt2->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $stmt2->bindParam(':price', $total, PDO::PARAM_INT);
        $stmt2->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt2->bindParam(':gross_amount', $grossAmount, PDO::PARAM_INT);
        $stmt2->bindParam(':trainer_amount', $trainerAmount, PDO::PARAM_INT);
        $stmt2->bindParam(':platform_fee', $platformFee, PDO::PARAM_INT);

        // Execute the transaction insert only once
        if(!$stmt2->execute()) {
          $pdo = null;
          http_response_code(500); // Internal Server Error
          sendJsonError("Database error: Failed to insert transaction");
          exit;
        }

        // Get trainer email for notification
        $getemail = "SELECT AES_DECRYPT(email, :key) AS email FROM users WHERE id = :trainer_id";

        $stmt4 = $pdo->prepare($getemail);
        $stmt4->bindParam(':key', $encryptionKey, PDO::PARAM_STR);  // Fixed: use $encryptionKey instead of $key
        $stmt4->bindParam(':trainer_id', $trainer_id, PDO::PARAM_INT);
        $stmt4->execute();
        $resultemail = $stmt4->fetch(PDO::FETCH_ASSOC);
        
        // Convert binary result to readable string
        $traineremail = $resultemail ? $resultemail['email'] : null;

        $producttype = ($data['product'] === 'trainprogram') ? "träningsprogram" : "kostprogram";

        // Format amounts from database (already calculated and stored in öre)
        // Use the exact values that were just inserted into the database
        $grossAmountFormatted = format_sek_from_ore($grossAmount);
        $trainerAmountFormatted = format_sek_from_ore($trainerAmount);
        
        $subject = "TRAINO - Bekräftnings e-mail";
        $message = "Hej,<br><br>Detta bekräftar ditt köp av ett ". $producttype . " nyligen via TRAINO, du betalade " . $grossAmountFormatted . ".<br><br>MVH<br>TRAINO";

        $subject2 = "TRAINO - Någon har köpt din produkt";
        $message2 = "Hej,<br><br>Detta bekräftar att en användare har köpt ett ". $producttype . " nyligen via TRAINO, för " . $grossAmountFormatted . ".<br>
        Efter avgifter från Stripe och TRAINO (15%), får du behålla <strong>$trainerAmountFormatted</strong>.<br><br><br><br>MVH<br>TRAINO";

        // Send emails (if function exists)
        if (function_exists('sendEmail')) {
          sendEmail($email, $subject, $message, $headers = []);
          if ($traineremail) {
            sendEmail($traineremail, $subject2, $message2, $headers = []);
          }
        }

        $pdo = null;

        sendJson(["success" => "Product bought, inserted into database successfully"]);

       } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        sendJsonError("Database error: " . $e->getMessage());
        exit;
       }
      } else {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid product type");
        exit;
      }
    } 
?>