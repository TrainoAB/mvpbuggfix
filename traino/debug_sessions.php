<?php
require_once("php/dbconfig.php");

try {
    // Check what sessions exist in the database
    $stmt = $pdo->prepare("SELECT * FROM user_sessions ORDER BY registered DESC LIMIT 10");
    $stmt->execute();
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Recent sessions in database:\n";
    foreach ($sessions as $session) {
        echo "ID: " . $session['id'] . ", User ID: " . $session['user_id'] . ", Session ID: " . $session['session_id'] . ", Date: " . $session['registered'] . "\n";
    }
    
    // Check users table for debugging
    $stmt = $pdo->prepare("SELECT id, firstname, lastname FROM users ORDER BY id DESC LIMIT 5");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nRecent users:\n";
    foreach ($users as $user) {
        echo "ID: " . $user['id'] . ", Name: " . $user['firstname'] . " " . $user['lastname'] . "\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
}
?> 