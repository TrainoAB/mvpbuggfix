<?php 
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

if(isset($_GET['cat'])) {

  $sport = validate_and_sanitize($_GET['cat'], "integer");

$currentDate = date('Y-m-d');
    try {

      $sql = "SELECT 
    -- trainingpass
    SUM(CASE 
        WHEN p.product_type = 'trainingpass' 
         AND p.duration = 15 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS trainingpass_15,

    SUM(CASE 
        WHEN p.product_type = 'trainingpass' 
         AND p.duration = 30 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS trainingpass_30,

    SUM(CASE 
        WHEN p.product_type = 'trainingpass' 
         AND p.duration = 60 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS trainingpass_60,

    SUM(CASE 
        WHEN p.product_type = 'trainingpass' 
         AND p.duration > 60 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS trainingpass_70,

    -- onlinetraining
    SUM(CASE 
        WHEN p.product_type = 'onlinetraining' 
         AND p.duration = 15 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS onlinetraining_15,

    SUM(CASE 
        WHEN p.product_type = 'onlinetraining' 
         AND p.duration = 30 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS onlinetraining_30,

    SUM(CASE 
        WHEN p.product_type = 'onlinetraining' 
         AND p.duration = 60 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS onlinetraining_60,

    SUM(CASE 
        WHEN p.product_type = 'onlinetraining' 
         AND p.duration > 60 
         AND ps.id IS NOT NULL
         AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        THEN 1 ELSE 0 END) AS onlinetraining_70,

    -- others (no join needed)
    SUM(CASE WHEN p.product_type = 'dietprogram' THEN 1 ELSE 0 END) AS total_dietprogram,
    SUM(CASE WHEN p.product_type = 'trainprogram' THEN 1 ELSE 0 END) AS total_trainprogram

FROM products p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN pass_set ps ON ps.product_id = p.id AND ps.user_deleted = 0
WHERE p.category_id = :sport
  AND p.deleted = 0
  AND u.id IS NOT NULL";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':sport', $sport, PDO::PARAM_INT);
    $stmt->bindValue(':currentDate', $currentDate, PDO::PARAM_STR);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

   // Handle case where no results are returned or all results are null
if (!$result || array_filter($result, fn($value) => $value !== null) === []) {
  $result = [
    "trainingpass" => [
      15 => 0,
      30 => 0,
      60 => 0,
      70 => 0
    ],
    "onlinetraining" => [
      15 => 0,
      30 => 0,
      60 => 0,
      70 => 0
    ],
    "trainprogram" => [
      "total" => 0
    ],
    "dietprogram" => [
      "total" => 0
    ]
  ];
}

    $formattedResult = [
    'trainingpass' => [
        15 => (int) $result['trainingpass_15'],
        30 => (int) $result['trainingpass_30'],
        60 => (int) $result['trainingpass_60'],
        70 => (int) $result['trainingpass_70'],
    ],
    'onlinetraining' => [
        15 => (int) $result['onlinetraining_15'],
        30 => (int) $result['onlinetraining_30'],
        60 => (int) $result['onlinetraining_60'],
        70 => (int) $result['onlinetraining_70'],
    ],
    'trainprogram' => [
        'total' => (int) $result['total_trainprogram'],
    ],
    'dietprogram' => [
        'total' => (int) $result['total_dietprogram'],
    ],
];

// Output the formatted result as JSON
sendJson($formattedResult);
 
    } catch (PDOException $e) {
      // Handle database errors
      http_response_code(500);
      sendJsonError('Database error: ' . $e->getMessage());
    }
  } 