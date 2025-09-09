<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

try {
    // Validera CORS och autentisering
    validateCorsMethod(['GET']);
    $apikey = API_KEY;
    $encryptionKey = ENCRYPTION_KEY;
    validateAuthHeader($apikey);

    // Kontrollera om 'id' är satt
    if (!isset($_GET['id'])) {
        sendJsonError("Missing required parameter: id", 400); // Returnera fel om 'id' saknas
        exit;
    }

    $user_id = validate_and_sanitize($_GET['id'], "integer");
    
    if (!$user_id || $user_id <= 0) {
        sendJsonError("Invalid user ID provided", 400);
        exit;
    }

    // SQL-fråga
    $sql = "SELECT 
    pb.id AS id,
    pb.booked_date AS date,
    pb.starttime AS starttime,
    pb.endtime AS endtime,
    pb.paid AS paid,
    pb.canceled AS canceled,
    pb.reason AS reason,
    pb.payment_intent_id AS payment_intent_id,

    -- Sport Info
    p.category_id AS sport_category_id,
    c.category_link AS sport_category_link,
    c.category_name AS sport_category_name,
    c.category_image AS sport_category_image,

    -- Trainer Details
    t.id AS trainer_id,
    CONCAT(t.firstname, ' ', t.lastname) AS trainer_name,
    t.thumbnail AS trainer_thumbnail,
    t.alias AS trainer_alias,

    -- User (who booked) Details
    u.id AS user_id,
    CONCAT(u.firstname, ' ', u.lastname) AS user_name,
    AES_DECRYPT(u.email, :key) AS user_email,

    -- Product Details
    p.duration AS time,
    p.address AS address,
    p.product_type AS product,
    p.description AS description

FROM 
    pass_booked pb
LEFT JOIN 
    products p ON pb.product_id = p.id
LEFT JOIN 
    categories c ON p.category_id = c.id
LEFT JOIN 
    users u ON pb.user_id = u.id
LEFT JOIN 
    users t ON p.user_id = t.id
WHERE 
    pb.user_id = :user_id
    AND pb.booked_date >= CURDATE()
    AND (u.deleted IS NULL OR u.deleted = 0)
    AND (t.deleted IS NULL OR t.deleted = 0)
    AND pb.user_deleted = 0";

    // Exekvera SQL-frågan
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();

    // Hämta all data från frågan
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: logga antal hittade rader
    error_log("getbooking.php: Found " . count($rows) . " rows for user_id: " . $user_id);

    // Kontrollera om resultatet är tomt
    if (empty($rows)) {
        sendJsonError("No bookings found for the given user ID.", 404);
        exit;
    }

    $data = [];

// Bygg upp resultatet baserat på hämtade rader
foreach ($rows as $row) {
    $data[] = [
        'id' => (int) $row['id'],
        'date' => $row['date'] ?? null,
        'time' => $row['time'] ?? null,
        'address' => $row['address'] ?? null,
        'starttime' => $row['starttime'] ?? null,
        'endtime' => $row['endtime'] ?? null,
        'paid' => (bool) ($row['paid'] ?? false),
        'canceled' => (bool) ($row['canceled'] ?? false),
        'reason' => $row['reason'] ?? null,
        'payment_intent_id' => $row['payment_intent_id'] ?? null,

        'sport' => [
            'category_id' => (int) ($row['sport_category_id'] ?? 0),
            'category_link' => $row['sport_category_link'] ?? null,
            'category_name' => $row['sport_category_name'] ?? null,
            'category_image' => $row['sport_category_image'] ?? null,
        ],

        'trainer' => [
            'trainer_id' => (int) ($row['trainer_id'] ?? 0),
            'trainer_name' => $row['trainer_name'] ?? null,
            'thumbnail' => $row['trainer_thumbnail'] ?? null,
            'alias' => $row['trainer_alias'] ?? null,
        ],

        'user' => [
            'user_id' => (int) ($row['user_id'] ?? 0),
            'user_name' => $row['user_name'] ?? null,
            'email' => $row['user_email'] ?? null,
        ],

        'details' => [
            'product' => $row['product'] ?? null,
            'description' => $row['description'] ?? null,
        ],
    ];
}

    // Om ingen data kunde byggas av någon anledning
    if (empty($data)) {
        sendJsonError("No bookings found for the given user ID.", 404);
        exit;
    }

    // Skicka framgångsresultat
    $response = ['success' => true, 'message' => "Bookings fetched successfully.", 'data' => $data];
    sendJson($response);

} catch (PDOException $e) {
    // Fångar SQL-relaterade fel
    sendJsonError("Database error: " . $e->getMessage(), 500);
} catch (Exception $e) {
    // Fångar andra generella fel
    sendJsonError("An unexpected error occurred: " . $e->getMessage(), 500);
}
