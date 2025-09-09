<?php
require("db.php");
require_once("functions.php");

// Increase maximum execution time and set up output buffering
ini_set('max_execution_time', 0); // 300 seconds (5 minutes)
ob_end_flush();
ob_start(); // Start output buffering

// Function to generate random data
function generateRandomUser() {

    $firstnames = ['Agneta', 'Jenny', 'Malin', 'Lotta', 'Magnus', 'Kevin', 'Anders', 'Jens', 'Birger', 'Robert', 'Erik', 'John', 'Jane', 'Alex', 'Emily', 'Chris', 'Katie', 'Michael', 'Laura', 'Kevin', 'Fredrik', 'Johan', 'Lennart', 'Daniel'];
    $lastnames = ['McFlurry', 'Smith', 'Doe', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Andersson', 'Svensson', 'Danielsson', 'Berglund', 'Björnsson', 'Martinsson'];
    $genders = ['male', 'female'];

    $firstname = $firstnames[array_rand($firstnames)];
    $lastname = $lastnames[array_rand($lastnames)];
    $gender = $genders[array_rand($genders)];
    $email = strtolower($firstname) . '.' . strtolower($lastname) . '@example.com';
    $alias = strtolower($firstname) . strtolower($lastname) . rand(100, 999);
    $mobilephone = '+4670' . rand(1000000, 9999999);
    $personalnumber = rand(1000000000, 9999999999);
    $hourly_price = rand(100, 10000);
    $thumbnail = 0;
    $coverimage = 0;

    /*
    $latitude = 55.0 + mt_rand() / mt_getrandmax() * (69.0 - 55.0);  // Latitude range for Sweden
    $longitude = 11.0 + mt_rand() / mt_getrandmax() * (24.0 - 11.0); // Longitude range for Sweden
    */

    /*
    // Latitude range for Europe, Russia, and Asia
    $latitude = 34.5 + mt_rand() / mt_getrandmax() * (70.0 - 34.5);
    // Longitude range for Europe, Russia, and Asia
    $longitude = -10.0 + mt_rand() / mt_getrandmax() * (180.0 - (-10.0));
    */

    $latitude = -90.0 + mt_rand() / mt_getrandmax() * (90.0 - (-90.0));

    // Longitude range for the entire world
    $longitude = -180.0 + mt_rand() / mt_getrandmax() * (180.0 - (-180.0));

    $passwordDecrypted = bin2hex(random_bytes(10));
    $hashkey = bin2hex(random_bytes(10));

    $password = password_hash($passwordDecrypted, PASSWORD_DEFAULT);

    $user_about = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    return [
        'usertype' => 'trainer',
        'firstname' => $firstname,
        'lastname' => $lastname,
        'gender' => $gender,
        'email' => $email,
        'alias' => $alias,
        'thumbnail' => $thumbnail,
        'coverimage' => $coverimage,
        'hourly_price' => $hourly_price,
        'mobilephone' => $mobilephone,
        'personalnumber' => $personalnumber,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'user_password' => $password,
        'user_about' => $user_about,
        'hashkey' => $hashkey,
        'roll' => 'user'
    ];
}

// Prepare the SQL insert statement
$sql = "INSERT INTO users (usertype, firstname, lastname, gender, email, alias, mobilephone, thumbnail, coverimage, hourly_price, personalnumber, latitude, longitude, user_password, user_about, hashkey, roll) 
        VALUES (:usertype, :firstname, :lastname, :gender, :email, :alias, :mobilephone, :thumbnail, :coverimage, :hourly_price, :personalnumber, :latitude, :longitude, :user_password, :user_about, :hashkey, :roll)";
$stmt = $pdo->prepare($sql);

// Insert users in batches
$batchSize = 50; // Number of users to insert per batch
$totalUsers = 1000; // Total number of users to insert
$batches = ceil($totalUsers / $batchSize);

$successMessage = "All users inserted successfully.";

// Start transaction
$pdo->beginTransaction();

try {
    for ($batch = 0; $batch < $batches; $batch++) {
        for ($i = 0; $i < $batchSize; $i++) {
            $user = generateRandomUser();
            $stmt->execute($user);
        }
        echo "Inserted " . (($batch + 1) * $batchSize) . " users.\n";
    }

    $pdo->commit(); // Commit all changes at once

} catch (Exception $e) {
    $pdo->rollBack();
    $successMessage = "Failed to insert users: " . $e->getMessage();
}

// Output all messages at once
ob_end_flush();
echo $successMessage;
?>