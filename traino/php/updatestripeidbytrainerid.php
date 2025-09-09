<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
require("db.php");
require("functions.php");

$data = json_decode(file_get_contents('php://input'), true);

// Add debugging
error_log("updatestripeidbytrainerid.php called with data: " . print_r($data, true));

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit();
}

$stripe_id = $data['stripe_id'] ?? null;
$trainer_id = $data['trainer_id'] ?? null;

if (!$stripe_id || !$trainer_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: stripe_id and trainer_id']);
    exit();
}

try {
    // First, check if user exists with this trainer_id
    $checkStmt = $pdo->prepare('SELECT id, email FROM users WHERE id = :trainer_id');
    $checkStmt->bindParam(':trainer_id', $trainer_id);
    $checkStmt->execute();
    
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found with this trainer_id']);
        exit();
    }
    
    // Update the stripe_id for this trainer
    $stmt = $pdo->prepare('UPDATE users SET stripe_id = :stripe_id WHERE id = :trainer_id');
    $stmt->bindParam(':stripe_id', $stripe_id);
    $stmt->bindParam(':trainer_id', $trainer_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update Stripe ID for trainer']);
        exit();
    }

    http_response_code(200);
    echo json_encode([
        'success' => 'Stripe ID updated successfully for trainer',
        'stripe_id' => $stripe_id,
        'trainer_id' => $trainer_id,
        'user_email' => $user['email']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
} 