<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST', 'GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

$encryptionKey = ENCRYPTION_KEY;

if (isset($_GET['trainerid']) || isset($_GET['traineeid'])) {
    $user_id = isset($_GET['trainerid']) ? validate_and_sanitize($_GET['trainerid'], "integer") : validate_and_sanitize($_GET['traineeid'], "integer");

    // Default pagination values
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10; // Limit max 100 records per page
    $offset = ($page - 1) * $limit;

    try {
        // Count total transactions for pagination
        $countQuery = "SELECT COUNT(*) as total FROM transactions t";
        if (isset($_GET['trainerid'])) {
            $countQuery .= " WHERE t.trainer_id = :user_id";
        } else {
            $countQuery .= " WHERE t.trainee_id = :user_id";
        }

        $countStmt = $pdo->prepare($countQuery);
        $countStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $countStmt->execute();
        $totalRecords = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $totalPages = ceil($totalRecords / $limit);

      /*   // Main query with pagination
        $sql = "SELECT 
                t.id AS transaction_id,
                t.trainee_id,
                t.trainer_id,
                t.price AS transaction_price,
                t.created_date AS transaction_date,
                t.status AS transaction_status,
                t.productinfo AS product_info,
                t.booked_date,  -- 🛠️ Fixed: Added missing comma here
                JSON_OBJECT(
                    'product_id', p.id,
                    'product_sport', p.category_link,
                    'product_type', p.product_type,
                    'product_description', p.description,
                    'product_price', p.price,
                    'product_duration', p.duration
                ) AS product,
                JSON_OBJECT(
                    'trainer_id', trainer.id,
                    'firstname', trainer.firstname,
                    'lastname', trainer.lastname,
                    'gender', trainer.gender,
                    'thumbnail', trainer.thumbnail
                ) AS trainer,
                JSON_OBJECT(
                    'trainee_id', trainee.id,
                    'firstname', trainee.firstname,
                    'lastname', trainee.lastname,
                    'gender', trainee.gender,
                    'thumbnail', trainee.thumbnail
                ) AS trainee
            FROM 
                transactions t
            LEFT JOIN 
                products p ON t.product_id = p.id  -- 🛠️ Fixed: Proper ON condition
            LEFT JOIN 
                users trainer ON t.trainer_id = trainer.id
            LEFT JOIN 
                users trainee ON t.trainee_id = trainee.id";

    if (isset($_GET['trainerid'])) {
        $sql .= " WHERE t.trainer_id = :user_id";
    } else {
        $sql .= " WHERE t.trainee_id = :user_id";
    }

        // Add pagination
        $sql .= " ORDER BY t.created_date DESC LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC); */



        $sql = "SELECT 
    t.id AS transaction_id,
    t.trainee_id AS t_trainee_id,
    t.trainer_id AS t_trainer_id,
    t.price AS transaction_price,
    t.created_date AS transaction_date,
    t.status AS transaction_status,
    t.productinfo AS product_info,
    t.booked_date,
    t.product_id AS t_product_id,
    -- Product fields
    p.id as p_product_id,
    p.category_link as product_sport,
    p.product_type,
    p.description as product_description,
    p.price as product_price,
    p.duration as product_duration,
    -- Trainer fields
    trainer.id as trainer_id,
    trainer.firstname as trainer_firstname,
    trainer.lastname as trainer_lastname,
    trainer.gender as trainer_gender,
    trainer.thumbnail as trainer_thumbnail,
    -- Trainee fields
    trainee.id as trainee_id,
    trainee.firstname as trainee_firstname,
    trainee.lastname as trainee_lastname,
    trainee.gender as trainee_gender,
    trainee.thumbnail as trainee_thumbnail
FROM transactions t
LEFT JOIN products p ON t.product_id = p.id
LEFT JOIN users trainer ON t.trainer_id = trainer.id
LEFT JOIN users trainee ON t.trainee_id = trainee.id";

if (isset($_GET['trainerid'])) {
    $sql .= " WHERE t.trainer_id = :user_id";
} else {
    $sql .= " WHERE t.trainee_id = :user_id";
}

$sql .= " ORDER BY t.created_date DESC LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
$stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Bygg JSON-strukturen i PHP:
foreach ($results as &$result) {
    $result['product'] = [
        'product_id' => $result['p_product_id'],
        'product_sport' => $result['product_sport'],
        'product_type' => $result['product_type'],
        'product_description' => $result['product_description'],
        'product_price' => $result['product_price'],
        'product_duration' => $result['product_duration']
    ];
    
    $result['trainer'] = [
        'trainer_id' => $result['trainer_id'],
        'firstname' => $result['trainer_firstname'],
        'lastname' => $result['trainer_lastname'],
        'gender' => $result['trainer_gender'],
        'thumbnail' => $result['trainer_thumbnail']
    ];
    
    $result['trainee'] = [
        'trainee_id' => $result['trainee_id'],
        'firstname' => $result['trainee_firstname'],
        'lastname' => $result['trainee_lastname'],
        'gender' => $result['trainee_gender'],
        'thumbnail' => $result['trainee_thumbnail']
    ];
    
    // Rensa bort de separata fälten
    unset($result['p_product_id'], $result['product_sport'], $result['product_type'], 
          $result['product_description'], $result['product_price'], $result['product_duration'],
          $result['trainer_id'], $result['trainer_firstname'], $result['trainer_lastname'],
          $result['trainer_gender'], $result['trainer_thumbnail'],
          $result['trainee_id'], $result['trainee_firstname'], $result['trainee_lastname'],
          $result['trainee_gender'], $result['trainee_thumbnail']);
}
/* 
        // Decode JSON strings into PHP arrays
        foreach ($results as &$result) {
            $result['product'] = json_decode($result['product'], true);
            $result['trainer'] = json_decode($result['trainer'], true);
            $result['trainee'] = json_decode($result['trainee'], true);
        }
 */
        // Send paginated response
        sendJson([
            "data" => $results,
            "pagination" => [
                "current_page" => $page,
                "total_pages" => $totalPages,
                "total_records" => $totalRecords,
                "limit" => $limit
            ]
        ]);
    } catch (Exception $e) {
        sendJsonError("SQL Error: " . $e->getMessage());
    }
}

elseif (isset($_GET['crud'])) {

    if ($_GET['crud'] === "create") {
        // Assume incoming data is JSON and decode it
        $data = json_decode(file_get_contents('php://input'), true);

        // Check if the received data is valid JSON
        if ($data === null) {
            http_response_code(400); // Bad Request
            sendJsonError("Invalid JSON received");
            exit;
        }
        // Check if the 'session_id' property exists in the received data
        if (!isset($data['session_id'])) {
            http_response_code(400); // Bad Request
            sendJsonError("Missing data property in JSON.");
            exit;
        }

        $session_id = validate_and_sanitize($data['session_id'], "text");
        // Validate and sanitize data
        $productInfo = json_decode($data['productinfo'], true);
        $trainee_id = validate_and_sanitize($data['trainee_id'], "integer");
        $trainer_id = validate_and_sanitize($data['trainer_id'], "integer");
        $charge_id = validate_and_sanitize($data['charge_id'], "text");
        $payment_intent_id = validate_and_sanitize($data['payment_intent_id'], "text");
        $status = validate_and_sanitize($data['status'], "text");
        $productInfoJson = json_encode(validate_and_sanitize($productInfo, "array"));
        $email = validate_and_sanitize($data['email'], "email");

        // Check if JSON decoding was successful
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data.');
        }

        try {
            // Prepare the SQL statement
            $sql = "INSERT INTO transactions 
                    (trainee_id, trainer_id, session_id, charge_id, payment_intent_id, status, productinfo, email) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, AES_ENCRYPT(?, :key))";

            // Prepare the statement
            $stmt = $pdo->prepare($sql);

            // Bind the parameters
            $stmt->bindParam(1, $trainee_id, PDO::PARAM_INT);
            $stmt->bindParam(2, $trainer_id, PDO::PARAM_INT);
            $stmt->bindParam(3, $session_id, PDO::PARAM_STR);
            $stmt->bindParam(4, $charge_id, PDO::PARAM_STR);
            $stmt->bindParam(5, $payment_intent_id, PDO::PARAM_STR);
            $stmt->bindParam(6, $status, PDO::PARAM_STR);
            $stmt->bindParam(7, $productInfoJson, PDO::PARAM_STR); // Ensure $productInfo is JSON encoded
            $stmt->bindParam(8, $email, PDO::PARAM_STR);
            $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);

            // Execute the statement
            $stmt->execute();

            // Check if insertion was successful
            if ($stmt->rowCount() > 0) {
                $pdo = null;
                $response = ["success" => "Successfully inserted."];
                sendJson($response);
            } else {
                throw new Exception("Error: Insertion failed.");
            }
        } catch (Exception $e) {
            sendJsonError("Error: " . $e->getMessage());
        }
    }

    elseif ($_GET['crud'] === "mark_refunded") {
        // Update a transaction and related booking to refunded/canceled state (used by webhooks)
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data === null) {
            http_response_code(400);
            sendJsonError("Invalid JSON received");
        }

        $payment_intent_id = isset($data['payment_intent_id']) ? validate_and_sanitize($data['payment_intent_id'], 'text') : null;
        if (!$payment_intent_id) {
            http_response_code(400);
            sendJsonError('Missing payment_intent_id');
        }

        $refund_id = isset($data['refund_id']) ? validate_and_sanitize($data['refund_id'], 'text') : null;
        $refund_amount = isset($data['refund_amount']) ? (int)validate_and_sanitize($data['refund_amount'], 'integer') : null; // öre
        $refund_receipt_url = isset($data['refund_receipt_url']) ? validate_and_sanitize($data['refund_receipt_url'], 'text') : null;
        $refunded_at = isset($data['refunded_at']) ? validate_and_sanitize($data['refunded_at'], 'text') : gmdate('c');
        $reason = isset($data['reason']) ? validate_and_sanitize($data['reason'], 'text') : 'refunded_via_webhook';

        try {
            $pdo->beginTransaction();

            // Update transactions table
            $info = json_encode([
                'refund_id' => $refund_id,
                'refund_amount' => $refund_amount,
                'refund_receipt_url' => $refund_receipt_url,
                'refunded_at' => $refunded_at,
            ]);

            $status = 'refunded';
            $payoutStatus = 'failed';
            $txUp = $pdo->prepare("UPDATE transactions SET status = :status, payout_status = :payout, info = :info WHERE payment_intent_id = :pi");
            $txUp->bindParam(':status', $status, PDO::PARAM_STR);
            $txUp->bindParam(':payout', $payoutStatus, PDO::PARAM_STR);
            $txUp->bindParam(':info', $info, PDO::PARAM_STR);
            $txUp->bindParam(':pi', $payment_intent_id, PDO::PARAM_STR);
            $txUp->execute();

            // Update pass_booked by payment_intent_id
            $pbUp = $pdo->prepare("UPDATE pass_booked SET canceled = 1, reason = COALESCE(reason, :reason) WHERE payment_intent_id = :pi");
            $pbUp->bindParam(':reason', $reason, PDO::PARAM_STR);
            $pbUp->bindParam(':pi', $payment_intent_id, PDO::PARAM_STR);
            $pbUp->execute();

            $pdo->commit();
            sendJson(['success' => true, 'payment_intent_id' => $payment_intent_id, 'status' => 'refunded']);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            sendJsonError('Refund update failed: ' . $e->getMessage());
        }
    }
    
} else {
    sendJsonError("Missing GET properties.");
}