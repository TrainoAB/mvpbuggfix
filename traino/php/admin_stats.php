<?php 

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

validateSessionID($pdo, null, true);

try {

  // Total transactions
    $sql_transactions = "SELECT COUNT(*) AS total_transactions,
                                COALESCE(SUM(CASE WHEN price >= 0 THEN price ELSE 0 END), 0) AS total_payment_in,
                                COALESCE(SUM(CASE WHEN price < 0 THEN -price ELSE 0 END), 0) AS total_payment_out,
                                COALESCE(SUM(CASE WHEN price >= 0 THEN price * 0.15 ELSE 0 END), 0) AS total_traino_percent
                         FROM transactions";

$stmt_transactions = $pdo->query($sql_transactions);
$transactions_stats = $stmt_transactions->fetch(PDO::FETCH_ASSOC);

    // Total users
$sql_users = "SELECT COUNT(*) AS total_users,
                     SUM(CASE WHEN u.gender = 'male' THEN 1 ELSE 0 END) AS total_males,
                     SUM(CASE WHEN u.gender = 'female' THEN 1 ELSE 0 END) AS total_females,
                     SUM(CASE WHEN u.usertype = 'trainer' THEN 1 ELSE 0 END) AS total_trainers,
                     SUM(CASE WHEN u.usertype = 'trainee' THEN 1 ELSE 0 END) AS total_trainees,
                     SUM(CASE WHEN u.usertype = 'trainer' AND u.gender = 'male' THEN 1 ELSE 0 END) AS total_male_trainers,
                     SUM(CASE WHEN u.usertype = 'trainer' AND u.gender = 'female' THEN 1 ELSE 0 END) AS total_female_trainers,
                     SUM(CASE WHEN u.usertype = 'trainee' AND u.gender = 'male' THEN 1 ELSE 0 END) AS total_male_trainees,
                     SUM(CASE WHEN u.usertype = 'trainee' AND u.gender = 'female' THEN 1 ELSE 0 END) AS total_female_trainees,
                     AVG(CASE WHEN u.usertype = 'trainer' THEN YEAR(CURRENT_DATE) - (SUBSTRING(u.personalnumber, 1, 2) + 1900) ELSE NULL END) AS avg_age_trainers,
                     AVG(CASE WHEN u.usertype = 'trainee' THEN YEAR(CURRENT_DATE) - (SUBSTRING(u.personalnumber, 1, 2) + 1900) ELSE NULL END) AS avg_age_trainees,
                     MIN(YEAR(CURRENT_DATE) - (SUBSTRING(u.personalnumber, 1, 2) + 1900)) AS min_age,
                     MAX(YEAR(CURRENT_DATE) - (SUBSTRING(u.personalnumber, 1, 2) + 1900)) AS max_age,
                     AVG(YEAR(CURRENT_DATE) - (SUBSTRING(u.personalnumber, 1, 2) + 1900)) AS avg_age_total
              FROM users u";

$stmt_users = $pdo->query($sql_users);
$users_stats = $stmt_users->fetch(PDO::FETCH_ASSOC);


// Separate query to get avg_rating from rating table
$sql_avg_rating = "SELECT AVG(rating) AS avg_rating FROM rating";

$stmt_avg_rating = $pdo->query($sql_avg_rating);
$avg_rating = $stmt_avg_rating->fetch(PDO::FETCH_ASSOC)['avg_rating'];


    // Total training passes
    $sql_trainingpass = "SELECT COUNT(*) AS total,
                                MIN(price) AS min_price,
                                MAX(price) AS max_price,
                                AVG(price) AS avg_price
                         FROM products WHERE product_type = 'trainingpass'";

    $stmt_trainingpass = $pdo->query($sql_trainingpass);
    $trainingpass_stats = $stmt_trainingpass->fetch(PDO::FETCH_ASSOC);


    // Total training passes
    $sql_onlinetraining = "SELECT COUNT(*) AS total,
                                MIN(price) AS min_price,
                                MAX(price) AS max_price,
                                AVG(price) AS avg_price
                         FROM products WHERE product_type = 'onlinetraining'";

    $stmt_onlinetraining = $pdo->query($sql_onlinetraining);
    $onlinetraining_stats = $stmt_onlinetraining->fetch(PDO::FETCH_ASSOC);

    // Total training programs
    $sql_trainprogram = "SELECT COUNT(*) AS total,
                                MIN(price) AS min_price,
                                MAX(price) AS max_price,
                                AVG(price) AS avg_price
                         FROM products WHERE product_type = 'trainprogram'";

    $stmt_trainprogram = $pdo->query($sql_trainprogram);
    $trainprogram_stats = $stmt_trainprogram->fetch(PDO::FETCH_ASSOC);

    // Total diet programs
    $sql_dietprogram = "SELECT COUNT(*) AS total,
                                MIN(price) AS min_price,
                                MAX(price) AS max_price,
                                AVG(price) AS avg_price
                         FROM products WHERE product_type = 'dietprogram'";

    $stmt_dietprogram = $pdo->query($sql_dietprogram);
    $dietprogram_stats = $stmt_dietprogram->fetch(PDO::FETCH_ASSOC);

    // Total clip cards
    $sql_clipcard = "SELECT COUNT(*) AS total,
                            MIN(clipcard_5_price) AS min_price,
                            MAX(clipcard_20_price) AS max_price,
                            AVG(clipcard_10_price) AS avg_price
                     FROM products WHERE product_type = 'clipcard'";

    $stmt_clipcard = $pdo->query($sql_clipcard);
    $clipcard_stats = $stmt_clipcard->fetch(PDO::FETCH_ASSOC);


    $pdo = null;

    sendJson(array(
            'users' => $users_stats,
             'avg_rating' => $avg_rating,
            'transactions' => $transactions_stats,
            'product_trainingpass' => $trainingpass_stats,
            'product_onlinetraining' => $onlinetraining_stats,
            'product_trainprogram' => $trainprogram_stats,
            'product_dietprogram' => $dietprogram_stats,
            'product_clipcard' => $clipcard_stats

            
        ));

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}



?>