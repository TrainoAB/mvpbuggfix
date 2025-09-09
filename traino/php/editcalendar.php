<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['POST']);
/* $apikey = API_KEY;
validateAuthHeader($apikey); */

// Read and decode the incoming JSON data
$rawInput = file_get_contents('php://input');

$data = json_decode($rawInput, true);

// Check if the received data is valid JSON
if ($data === null) {
    http_response_code(400); // Bad Request
    sendJsonError("Invalid JSON received");
    exit;
}

// MARK: Edit interval
if($_GET['type'] === "editinterval") {
  // Extract values from the JSON data
  $isrepeat = isset($data['isrepeat']) && $data['isrepeat'] === true;
  $id = $data['id']; 
  $start = $data['start']; 
  $end = $data['end']; 
  $pass_amount = $data['pass_amount'];
  $pass_set_id = $data['pass_set_id'];
  $day = $data['day'] ? $day = $data['day'] : null;

    // Fetch the current JSON data
    
    // Query for flat JSON array
    $stmt = $pdo->prepare("
        SELECT intervals 
        FROM pass_set 
        WHERE id = :pass_set_id
    ");
    
    $stmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_STR);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // Ensure a row was found
    if (!$row) {
        sendJsonError("No matching interval found.");
        exit;
    }

    $currentData = $row['intervals'];

    error_log(print_r($currentData, true));
    
    // Decode the JSON to a PHP array
    $jsonData = json_decode($currentData, true);

    // Define a function to update the interval
    function updateInterval(&$data, $id, $start, $end, $pass_amount, $isrepeat, $day = null) {
        foreach ($data as &$item) {
            if (!$isrepeat) {
                // Update flat array intervals
                if (isset($item['id']) && $item['id'] === $id) {
                    $item['start'] = $start;
                    $item['end'] = $end;
                    $item['pass_amount'] = $pass_amount;
                    return true;
                }
            } else {
                // Update nested intervals under `day`
                if (isset($item['day']) && $item['day'] === $day && isset($item['intervals'])) {
                    foreach ($item['intervals'] as &$interval) {
                        if ($interval['id'] === $id) {
                            $interval['start'] = $start;
                            $interval['end'] = $end;
                            $interval['pass_amount'] = $pass_amount;
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Attempt to update the interval
    if (!updateInterval($jsonData, $id, $start, $end, $pass_amount, $isrepeat, $day)) {
        sendJsonError("ID not found in the JSON structure.");
        exit;
    }

    // Encode the updated data back to JSON
    $updatedJson = json_encode($jsonData);

 
    // Update the database using the row's `id`
    $updateStmt = $pdo->prepare("UPDATE pass_set SET intervals = :updatedJson WHERE id = :pass_set_id");
    $updateStmt->bindParam(':updatedJson', $updatedJson, PDO::PARAM_STR);
    $updateStmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_INT);
    $updateStmt->execute();


    // Check if the update was successful
    if ($updateStmt->rowCount() > 0) {
        sendJson(["success" => "JSON updated successfully."]);
    } else {
        sendJsonError("Failed to update the database.");
    }

     

} //MARK: Add interval
elseif ($_GET['type'] === "addinterval") {
    // Extract data from the request
    $isrepeat = isset($data['isrepeat']) && $data['isrepeat'] === true;
    $id = $data['id']; 
    $start = $data['start']; 
    $end = $data['end']; 
    $pass_amount = $data['pass_amount'];
    $day = isset($data['day']) ? $day = $data['day'] : null;
    $pass_set_id = $data['pass_set_id'];

    // Fetch the current JSON data
    $stmt = $pdo->prepare("SELECT intervals FROM pass_set WHERE id = :pass_set_id");
    
    $stmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_STR);
    $stmt->execute();
    $currentData = $stmt->fetchColumn();

    if (!$currentData) {
        sendJsonError("No existing intervals found.");
        exit;
    }

    // Decode the JSON to a PHP array
    $jsonData = json_decode($currentData, true);

    // Define a function to add the interval
    function addInterval(&$data, $id, $start, $end, $pass_amount, $isrepeat, $day) {
      $newInterval = [
          "id" => $id,
          "start" => $start,
          "end" => $end,
          "pass_amount" => $pass_amount
      ];

      if ($isrepeat) {
          // Add to the flat structure
          $data[] = $newInterval;
      } else {
          // Add to the correct day or create a new day entry if necessary
          $added = false;
          foreach ($data as &$item) {
              // Check if the current item has the 'day' key and matches the specified day
              if (isset($item['day']) && $item['day'] === $day) {
                  // Ensure `intervals` is an array
                  if (!isset($item['intervals']) || !is_array($item['intervals'])) {
                      $item['intervals'] = [];
                  }
                  // Add the new interval to the existing day's intervals
                  $item['intervals'][] = $newInterval;
                  $added = true;
                  break;
              }
          }
          
          // If the day is not found, create a new entry for that day
          if (!$added) {
              $data[] = [
                  "day" => $day,
                  "intervals" => [$newInterval]
              ];
          }
      }
  }

    // Add the new interval
    addInterval($jsonData, $id, $start, $end, $pass_amount, $isrepeat, $day);

    // Encode the updated data back to JSON
    $updatedJson = json_encode($jsonData);

    
    // Update the database
    $updateStmt = $pdo->prepare("UPDATE pass_set SET intervals = :updatedJson WHERE id = :pass_set_id");
    $updateStmt->bindParam(':updatedJson', $updatedJson, PDO::PARAM_STR);
    $updateStmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_INT);
    $updateStmt->execute();

    // Check if the update affected any rows
    if ($updateStmt->rowCount() > 0) {
        // Send success response with the updated JSON
        sendJson([
            "success" => "Interval added successfully.",
            "updatedIntervals" => json_decode($updatedJson, true) // Send decoded JSON for easier use
        ]);
    } else {
        // If no rows were updated, send an error
        sendJsonError("Update failed. No rows were affected.");
    }
} // MARK: Delete interval
elseif ($_GET['type'] === "deleteinterval") {
    // Extract the ID and isrepeat from the request
    $id = $data['id'];
    $isrepeat = isset($data['isrepeat']) && $data['isrepeat'] === true;

    // Fetch the current JSON data
    if ($isrepeat) {
        // Query for flat JSON array
        $stmt = $pdo->prepare("
            SELECT id, intervals 
            FROM pass_set 
            WHERE JSON_CONTAINS(intervals, JSON_OBJECT('id', :id))
        ");
    } else {
        // Query for nested JSON structure
        $stmt = $pdo->prepare("
            SELECT id, intervals 
            FROM pass_set 
            WHERE JSON_CONTAINS(
                JSON_EXTRACT(intervals, '$[*].intervals'), 
                JSON_OBJECT('id', :id)
            )
        ");
    }
    $stmt->bindParam(':id', $id, PDO::PARAM_STR);
    $stmt->execute();
    // Fetch the row
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        sendJsonError("No matching interval found.");
        exit;
    }

    // Now you can get the ID of the row
    $pass_set_id = $row['id']; // Get the ID of the row
    $currentData = $row['intervals']; // Get the intervals JSON

    // Decode the intervals JSON
    $jsonData = json_decode($currentData, true);

    if (!$jsonData) {
        sendJsonError("Failed to decode JSON data.");
        exit;
    }

    function deleteInterval(&$data, $id, $isrepeat) {
        foreach ($data as $key => &$item) {
            if ($isrepeat) {
                // Flat array logic
                if (isset($item['id']) && (string)$item['id'] === (string)$id) { // Use $item instead of $interval
                    unset($data[$key]); // Remove the matching interval
                    $data = array_values($data); // Re-index the array
                    return true; // Successfully deleted
                }
            } else {
                // Nested array with days and intervals
                if (isset($item['intervals']) && is_array($item['intervals'])) {
                    foreach ($item['intervals'] as $iKey => $interval) {
                        // Match the interval `id`
                        if (isset($interval['id']) && (string)$interval['id'] === (string)$id) {
                            // Remove the matching interval
                            unset($item['intervals'][$iKey]);

                            // Re-index the `intervals` array to maintain numeric keys
                            $item['intervals'] = array_values($item['intervals']);

                            // If no intervals are left, optionally remove the day
                            if (empty($item['intervals'])) {
                                unset($data[$key]);
                            }

                            return true; // Successfully found and deleted
                        }
                    }
                }
            }
        }
        return false; // ID not found
    }

    // Remove empty days if `isrepeat` is true
    function cleanEmptyDays(&$data) {
        $data = array_filter($data, function ($day) {
            return !(isset($day['intervals']) && empty($day['intervals']));
        });
        $data = array_values($data); // Re-index days
    }

    // error_log(print_r($jsonData, true));

    // Attempt to delete the interval
    if (!deleteInterval($jsonData, $id, $isrepeat)) {
        sendJsonError("ID not found in the JSON structure.");
        exit;
    }

    // Remove empty days if `isrepeat` is true
    if ($isrepeat) {
        cleanEmptyDays($jsonData);
    }

    // Encode the updated data back to JSON
    $updatedJson = json_encode($jsonData);

    // Ensure your SQL query is properly updating the data
    $updateStmt = $pdo->prepare("UPDATE pass_set SET intervals = :updatedJson WHERE id = :pass_set_id");
    $updateStmt->bindParam(':updatedJson', $updatedJson, PDO::PARAM_STR);
    $updateStmt->bindParam(':pass_set_id', $pass_set_id, PDO::PARAM_INT);
    $updateStmt->execute();

    // Check if the update was successful
    if ($updateStmt->rowCount() > 0) {
        sendJson(["success" => "Interval deleted successfully."]);
    } else {
        sendJsonError("Failed to update the database.");
    }
} else {
    sendJsonError("Invalid type specified.");
}
?>