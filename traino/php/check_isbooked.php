<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Check if required parameters are set
if (isset($_GET['id']) && isset($_GET['date']) && isset($_GET['starttime'])) {
    
  $product_id = validate_and_sanitize($_GET['id'], "integer");
  $booked_date = validate_and_sanitize($_GET['date'], "text");
  $starttime = validate_and_sanitize($_GET['starttime'], "text");
  
  // Check if endtime is provided for overlap checking (optional for backward compatibility)
  $endtime = isset($_GET['endtime']) ? validate_and_sanitize($_GET['endtime'], "text") : null;

  // Prepare the response object
  $response = [];

  if ($endtime) {
    // Enhanced overlap checking - find any bookings that would conflict with the time range
    $sql = "SELECT * FROM pass_booked 
            WHERE product_id = :product_id 
            AND booked_date = :booked_date 
            AND canceled = 0
            AND ispause = 0
            AND (
                -- New booking starts before existing ends AND new booking ends after existing starts
                (:starttime < endtime AND :endtime > starttime)
            )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $stmt->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
    $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
    $stmt->bindParam(':endtime', $endtime, PDO::PARAM_STR);
  } else {
    // Legacy exact match checking for backward compatibility
    $sql = "SELECT * FROM pass_booked WHERE product_id = :product_id AND booked_date = :booked_date AND starttime = :starttime";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $stmt->bindParam(':booked_date', $booked_date, PDO::PARAM_STR);
    $stmt->bindParam(':starttime', $starttime, PDO::PARAM_STR);
  }
  
  $stmt->execute();
  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($result) {
    $response = [
      "is_booked" => true,
      "overlap_type" => $endtime ? "time_range_conflict" : "exact_match",
      "conflicting_booking" => [
        "starttime" => $result['starttime'],
        "endtime" => $result['endtime']
      ],
      "message" => $endtime ? [
        'en' => "Time slot conflict! The requested time ($starttime - $endtime) overlaps with existing booking ({$result['starttime']} - {$result['endtime']}).",
        'sv' => "Tidskonflikt! Den begärda tiden ($starttime - $endtime) överlappar med befintlig bokning ({$result['starttime']} - {$result['endtime']})."
      ] : [
        'en' => "This exact time slot is already booked.",
        'sv' => "Denna exakta tid är redan bokad."
      ]
    ];
  } else {
    $response = [
      "is_booked" => false
    ];
  }

  $pdo = null;

  sendJson($response);
} else {
  // Return an error if required parameters are not set
  sendJsonError("Product ID, date and starttime must be set");
}
?>