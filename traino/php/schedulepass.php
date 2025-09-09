<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Assume incoming data is JSON and decode it
$data = json_decode(file_get_contents('php://input'), true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// Check if properties exist in the received data
if (!isset($data['passes'])) {
    http_response_code(400); // Bad Request
    sendJsonError("Missing data property in JSON.");
    exit;
}



if (isset($_GET['crud']) && $_GET['crud'] === "create") {
    
    // Validate and sanitize data
    $user_id = validate_and_sanitize($data['user_id'], "integer");

    $autorepeat = true;
    $isrepeat = isset($data['isRepeat']) ? validate_and_sanitize($data['isRepeat'], "boolean") : false;
    $passes = validate_and_sanitize($data['passes'], "array");
    $startdate = validate_and_sanitize($data['startDate'], "date"); 
    $enddate = isset($data['endDate']) ? validate_and_sanitize($data['endDate'], "date") : null;

    if (isset($data['endDate']) && !empty($data['endDate'])) {
        $autorepeat = false;
    } else {
        $autorepeat = true;
    }

    $pass_repeat_id = generateUniqueID();

    // Prepare SQL statement to check if the ID exists in pass_set table
$stmt = $pdo->prepare("SELECT COUNT(*) FROM pass_set WHERE pass_repeat_id = :pass_repeat_id");

// Bind the parameter
$stmt->bindParam(':pass_repeat_id', $pass_repeat_id, PDO::PARAM_STR); // Use PARAM_STR if the ID is not purely numeric

// Execute the statement
$stmt->execute();

// Fetch the result
$count = $stmt->fetchColumn();

// If ID already exists, regenerate and check again
while ($count > 0) {
    $pass_repeat_id = generateUniqueID(); // Update the variable
    $stmt->execute(); // Re-execute without passing arguments
    $count = $stmt->fetchColumn();
}


    // OVERLAP VALIDATION - Check for conflicts before creating any schedules
    foreach($passes as $pass) {
        $passIntervals = [];
        
        if($isrepeat) {
            // For repeating schedules, check each day's intervals
            foreach($pass['days'] as $day) {
                foreach($day['intervals'] as $interval) {
                    $passIntervals[] = [
                        'start' => $interval['start'],
                        'end' => $interval['end'],
                        'day' => $day['day']
                    ];
                }
            }
        } else {
            // For non-repeating schedules, check single day intervals
            // Convert PHP day abbreviation to our format
            $dayMapping = [
                'sun' => 'sun', 'mon' => 'mon', 'tue' => 'tue', 'wed' => 'wed',
                'thu' => 'thu', 'fri' => 'fri', 'sat' => 'sat'
            ];
            $phpDay = strtolower(date('D', strtotime($startdate))); // Returns 'sun', 'mon', etc
            $dayKey = $dayMapping[$phpDay] ?? $phpDay;
            
            foreach($pass['intervals'] as $interval) {
                $passIntervals[] = [
                    'start' => $interval['start'],
                    'end' => $interval['end'],
                    'day' => $dayKey
                ];
            }
        }
        
        // Check for conflicts with existing schedules for this trainer
        foreach($passIntervals as $newInterval) {
            // Query to find overlapping existing schedules
            $overlapQuery = "
                SELECT ps.*, p.address
                FROM pass_set ps
                JOIN products p ON ps.product_id = p.id
                WHERE ps.user_id = :user_id 
                AND (
                    (ps.enddate IS NULL OR ps.enddate >= :startdate)
                    AND ps.startdate <= :checkdate
                )
            ";
            
            $checkdate = $enddate ?: date('Y-m-d', strtotime($startdate . ' + 1 year'));
            
            $stmt = $pdo->prepare($overlapQuery);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':startdate', $startdate, PDO::PARAM_STR);
            $stmt->bindParam(':checkdate', $checkdate, PDO::PARAM_STR);
            $stmt->execute();
            
            $existingSchedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
         /*    
            foreach($existingSchedules as $existing) {
                $existingIntervals = json_decode($existing['intervals'], true);
                
                if($existing['isrepeat']) {
                    // Check against repeating schedule
                    foreach($existingIntervals as $existingDay) {
                        if($existingDay['day'] === $newInterval['day']) {
                            foreach($existingDay['intervals'] as $existingInterval) {
                                if($newInterval['start'] < $existingInterval['end'] && 
                                   $newInterval['end'] > $existingInterval['start']) {
                                    http_response_code(409);
                                    // Create multilingual error message
                                    $errorMessages = [
                                        'en' => "Time slot conflict detected! Your new schedule ({$newInterval['start']} - {$newInterval['end']}) on {$newInterval['day']} overlaps with existing schedule ({$existingInterval['start']} - {$existingInterval['end']}) at {$existing['address']}.",
                                        'sv' => "Tidskonflikt upptäckt! Ditt nya schema ({$newInterval['start']} - {$newInterval['end']}) på {$newInterval['day']} överlappar med befintligt schema ({$existingInterval['start']} - {$existingInterval['end']}) på {$existing['address']}."
                                    ];
                                    sendJsonError(json_encode($errorMessages));
                                    exit;
                                }
                            }
                        }
                    }
                } else {
                    // Check against single day schedule
                    if($existing['singeldayrepeat'] === $newInterval['day']) {
                        foreach($existingIntervals as $existingInterval) {
                            if($newInterval['start'] < $existingInterval['end'] && 
                               $newInterval['end'] > $existingInterval['start']) {
                                http_response_code(409);
                                // Create multilingual error message
                                $errorMessages = [
                                    'en' => "Time slot conflict detected! Your new schedule ({$newInterval['start']} - {$newInterval['end']}) on {$newInterval['day']} overlaps with existing schedule ({$existingInterval['start']} - {$existingInterval['end']}) at {$existing['address']}.",
                                    'sv' => "Tidskonflikt upptäckt! Ditt nya schema ({$newInterval['start']} - {$newInterval['end']}) på {$newInterval['day']} överlappar med befintligt schema ({$existingInterval['start']} - {$existingInterval['end']}) på {$existing['address']}."
                                ];
                                sendJsonError(json_encode($errorMessages));
                                exit;
                            }
                        }
                    }
                }
            } */
        }
    }

    foreach($passes as $pass) {

    // Initialize $interval as null
      $intervals = null;
      $singeldayrepeat = null;
      // Get exepctions per each pass, if set
      $exeptions = isset($pass['exceptions']) ? validate_and_sanitize($pass['exceptions'], "array") : null;

      $rrule = isset($pass['rrule']) ? validate_and_sanitize($pass['rrule'], "array") : null;
      $exrules = isset($pass['exrules']) ? validate_and_sanitize($pass['exrules'], "array") : null;

      $rrule = json_encode($rrule);
      $exrules = json_encode($exrules);

      if($isrepeat) {
        $singeldayrepeat = null;
        $intervals = json_encode($pass['days']);
      } else {
         // Convert $startdate to timestamp (if not already in timestamp format)
        $start_timestamp = strtotime($startdate);

        // Get the day of the week as an abbreviation in lowercase (e.g., "sun", "mon")
        $day_of_week = strtolower(date('D', $start_timestamp));
        $singeldayrepeat = $day_of_week;

        $intervals = json_encode($pass['intervals']);
      }

      $autorepeatValue = $autorepeat ? 1 : 0;
      $isrepeatValue = $isrepeat ? 1 : 0;


       try {
    
            // Prepare the SQL statement
            $stmt = $pdo->prepare("INSERT INTO pass_set (user_id, product_type, product_id, category_link, pass_repeat_id, rrule, exrules, startdate, enddate, intervals, singeldayrepeat, isrepeat, autorepeat) 
                                    VALUES (:user_id, :product_type, :product_id, :category_link, :pass_repeat_id, :rrule, :exrules, :startdate, :enddate, :intervals, :singeldayrepeat, :isrepeat, :autorepeat)");

            // Bind parameters
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':product_type', $pass['product_type']);
            $stmt->bindParam(':product_id', $pass['product_id']);
            $stmt->bindParam(':category_link', $pass['category_link']);
            $stmt->bindParam(':pass_repeat_id', $pass_repeat_id);
            $stmt->bindParam(':rrule', $rrule);
            $stmt->bindParam(':exrules', $exrules);
            $stmt->bindParam(':startdate', $startdate);
            $stmt->bindParam(':enddate', $enddate);
            $stmt->bindParam(':intervals', $intervals);
            $stmt->bindParam(':singeldayrepeat', $singeldayrepeat);
            $stmt->bindParam(':isrepeat', $isrepeatValue);
            $stmt->bindParam(':autorepeat', $autorepeatValue);

            // Execute the statement
            $result = $stmt->execute();

            // Check if insertion was successful
            /*
            if ($result) {
                // If there are any exceptions run next insert
                if($exceptions !== null) {
                    // Get the ID of the last inserted row
                     $lastInsertId = $pdo->lastInsertId();

                     foreach($exceptions as $exeption) {
                        // Prepare the SQL statement
                        $stmt = $pdo->prepare("INSERT INTO pass_exceptions (pass_set_id, pass_set_repeat_id, start, end, remove) 
                                                VALUES (:pass_set_id, :start, :end, :remove)");

                        // Bind parameters
                        $stmt->bindParam(':pass_set_id', $lastInsertId);
                        $stmt->bindParam(':pass_set_repeat_id', $exeption['pass_set_repeat_id']);
                        $stmt->bindParam(':start', $exeption['start']);
                        $stmt->bindParam(':end', $exeption['end']);
                        $stmt->bindParam(':remove', $exeption['remove']);
                    }
              
                 }
         
              
            } else {
                throw new Exception("Error: Insertion failed.");
            }

            */
        } catch (Exception $e) {
            error_log($e->getMessage());
            sendJsonError("Error: " . $e->getMessage());
        }
    }

    $trainer = true;
            
    try {
        // Call the function to fetch pass data
        $passData = fetchPassData($pdo, $user_id, $trainer, $encryptionKey);

          $response = [
          "success" => "Successfully inserted.",
          "data" => $passData,
        ];

        $pdo = null;
        sendJson($response);
    } catch (Exception $e) {
        // Handle exceptions
        error_log('Error: ' .$e->getMessage());
        sendJsonError('Error: ' . $e->getMessage());
    }

  

} elseif(isset($_GET['crud']) && isset($_GET['crud']) === "update") {

   

} elseif(isset($_GET['crud']) && isset($_GET['crud']) === "delete") {

}