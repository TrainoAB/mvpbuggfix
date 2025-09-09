<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Check if either user_id or alias is set
if (isset($_GET['id'])) {
    $user_id = validate_and_sanitize($_GET['id'], "integer"); 

    if(isset($_GET['bookedonly']) && $_GET['bookedonly'] === "true") {
        $today = date('Y-m-d');
        $ninetyDaysForward = date('Y-m-d', strtotime('+90 days'));
        
        $passBookedQuery = "
          SELECT 
    pb.*,
    p.product_type,
    p.id AS product_id,
    p.user_id AS product_owner_id,
    p.description,
    p.latitude,
    p.longitude,
    p.address,
    p.duration,

    c.category_name,
    c.id AS category_id,
    c.category_link,
    c.category_image,

    u.firstname AS user_firstname,
    u.lastname AS user_lastname,
    AES_DECRYPT(u.email, :key) AS user_email,

    trainer.firstname AS trainer_firstname,
    trainer.lastname AS trainer_lastname,
    trainer.alias AS trainer_alias

FROM 
    pass_booked pb

LEFT JOIN products p ON pb.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON pb.user_id = u.id
LEFT JOIN users trainer ON pb.trainer_id = trainer.id

WHERE 
    pb.trainer_id = :user_id
    AND pb.booked_date BETWEEN :today AND :ninetyDaysForward
    AND pb.ispause = 0

ORDER BY 
    pb.booked_date ASC";
        $passBookedStmt = $pdo->prepare($passBookedQuery);
        // Bind the parameters
        $passBookedStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $passBookedStmt->bindParam(':today', $today);
        $passBookedStmt->bindParam(':ninetyDaysForward', $ninetyDaysForward);
        $passBookedStmt->bindParam(':key', $encryptionKey);

        // Execute the statement
        $passBookedStmt->execute();

        // Fetch all results
        $pass_booked = $passBookedStmt->fetchAll(PDO::FETCH_ASSOC);

        $pdo = null;
        // Prepare the response structure
        $response = $pass_booked;
        sendJson($response);

    } elseif(isset($_GET['cat']) && isset($_GET['prod']) && isset($_GET['dur'])) {

        $today = date('Y-m-d');
        $ninetyDaysForward = date('Y-m-d', strtotime('+90 days'));

        $category = isset($_GET['cat']) ? $_GET['cat'] : null;
        $product_id = isset($_GET['prod']) ? $_GET['prod'] : null;
        $duration = isset($_GET['dur']) ? $_GET['dur'] : null;


         // Get pass_set data
        $passSetQuery = "
            SELECT 
    pa.id AS pass_set_id,
    pa.pass_repeat_id,
    pa.startdate,
    pa.enddate,
    pa.intervals,
    pa.singeldayrepeat,
    CASE 
        WHEN pa.isrepeat = 0 THEN false 
        WHEN pa.isrepeat = 1 THEN true 
    END AS isrepeat,
    CASE 
        WHEN pa.autorepeat = 0 THEN false 
        WHEN pa.autorepeat = 1 THEN true 
    END AS autorepeat,
    pa.registered AS passcreated,
    p.id,
    p.product_type,
    p.user_id AS pa_userid,
    p.alias AS pa_alias,
    p.duration,
    p.registered AS productcreated,
    c.id AS category_id,
    c.category_link,
    c.category_name,
    COUNT(pb.id) AS booked_count
FROM pass_set pa
LEFT JOIN products p ON pa.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN pass_booked pb ON pa.id = pb.pass_set_id
WHERE pa.user_id = :user_id
  AND pa.product_id = :product_id
  AND p.duration = :duration
  AND (pa.startdate <= :ninetyDaysForward)
  AND (pa.enddate >= :today OR pa.enddate IS NULL)
  AND (pb.canceled = 0 OR pb.canceled IS NULL)
GROUP BY pa.id";
        $passSetStmt = $pdo->prepare($passSetQuery);
        $passSetStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $passSetStmt->bindParam(':product_id', $product_id, PDO::PARAM_STR);
        $passSetStmt->bindParam(':duration', $duration, PDO::PARAM_INT);
        $passSetStmt->bindParam(':today', $today, PDO::PARAM_STR);
        $passSetStmt->bindParam(':ninetyDaysForward', $ninetyDaysForward, PDO::PARAM_STR);
        $passSetStmt->execute();
        $pass_set = $passSetStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get pass_booked data with product information
        $passBookedQuery = "
            SELECT 
                pb.*,
                p.product_type,
                p.id AS product_id,
                p.user_id AS product_owner_id,
                p.description,
                p.latitude,
                p.longitude,
                AES_DECRYPT(p.address, :key) AS address,
                p.duration,
                c.category_name,
                c.id AS category_id,
                c.category_link,
                c.category_image,
                u.firstname AS user_firstname,
                u.lastname AS user_lastname,
                AES_DECRYPT(u.email, :key) AS user_email,
                trainer.firstname AS trainer_firstname,
                trainer.lastname AS trainer_lastname,
                trainer.alias AS trainer_alias
            FROM pass_booked pb
            LEFT JOIN products p ON pb.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON pb.user_id = u.id
            LEFT JOIN users trainer ON pb.trainer_id = trainer.id
            WHERE pb.trainer_id = :user_id
            AND pb.booked_date BETWEEN :today AND :ninetyDaysForward
            AND pb.ispause = 0
            ORDER BY pb.booked_date ASC
        ";
        $passBookedStmt = $pdo->prepare($passBookedQuery);
        $passBookedStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $passBookedStmt->bindParam(':today', $today, PDO::PARAM_STR);
        $passBookedStmt->bindParam(':ninetyDaysForward', $ninetyDaysForward, PDO::PARAM_STR);
        $passBookedStmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        $passBookedStmt->execute();
        $resultsBooked = $passBookedStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Debug query to check product_ids in pass_booked vs products table structure
        $debugQuery = "
            SELECT 
                pb.product_id as pb_product_id, 
                p.id as products_id,
                p.product_id as products_product_id,
                p.alias as products_alias
            FROM pass_booked pb 
            LEFT JOIN products p ON pb.product_id = p.id 
            WHERE pb.trainer_id = :user_id 
            LIMIT 3
        ";
        $debugStmt = $pdo->prepare($debugQuery);
        $debugStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $debugStmt->execute();
        $debugResults = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("JOIN DEBUG - pb.product_id = p.id: " . json_encode($debugResults));
        
        // Try alternative JOIN
        $debugQuery2 = "
            SELECT 
                pb.product_id as pb_product_id, 
                p.id as products_id,
                p.product_id as products_product_id,
                p.alias as products_alias
            FROM pass_booked pb 
            LEFT JOIN products p ON pb.product_id = p.id 
            WHERE pb.trainer_id = :user_id 
            LIMIT 3
        ";
        $debugStmt2 = $pdo->prepare($debugQuery2);
        $debugStmt2->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $debugStmt2->execute();
        $debugResults2 = $debugStmt2->fetchAll(PDO::FETCH_ASSOC);
        error_log("JOIN DEBUG - pb.product_id = p.id: " . json_encode($debugResults2));
        
        // Debug logging
        error_log("Pass booked query executed. Found " . count($resultsBooked) . " results");
        if (!empty($resultsBooked)) {
            error_log("First result sample: " . json_encode($resultsBooked[0]));
        }

        // Decode the JSON intervals for each pass set
        foreach ($pass_set as &$pass) {
            if (isset($pass['intervals']) && !empty($pass['intervals'])) {
                $pass['intervals'] = json_decode($pass['intervals'], true);
            }
        }
        // Prepare the response
        $response = [
            'pass_set' => $pass_set,
            'pass_booked' => $resultsBooked,
        ];

        // Send the JSON response
        sendJson($response);

    } else {

      // Check if trainer is set in the GET request
      $trainer = isset($_GET['trainer']) ? $_GET['trainer'] === 'true' : false;

      try {
          // Call the function to fetch pass data
          $passData = fetchPassData($pdo, $user_id, $trainer, $encryptionKey);

          // Output or further process $passData
          sendJson($passData);
      } catch (Exception $e) {
          // Handle exceptions
          sendJsonError('Error: ' . $e->getMessage());
      }
    }
} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('User ID is missing.');
}