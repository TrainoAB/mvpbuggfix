<?php
// Include necessary files
require_once("zippassword.php");
require_once("apikey.php");  // Include your API key
require_once("db.php");      // Include your database connection settings
require_once("functions.php"); // Include your functions for validation and JSON response


try {


    // Delete all ended pass_set
    $currentDate = date('Y-m-d'); // Get the current date in 'YYYY-MM-DD' format

    $deleteSql = "DELETE FROM pass_set WHERE enddate < :currentDate AND enddate IS NOT NULL";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->bindParam(':currentDate', $currentDate);
    $deleteStmt->execute();

    // Delete all user_session duplicates, save the latest version
    $deleteSql = "
        DELETE FROM user_sessions
        WHERE (user_id, registered) NOT IN (
            SELECT user_id, MAX(registered)
            FROM user_sessions
            GROUP BY user_id
        );
    ";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute();

    // Delete any user session records that does not match users email
    $deleteSql = "DELETE FROM user_sessions 
              WHERE email NOT IN (SELECT email FROM users)";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute();

/* 
    // Delete all related pass_set records before deleting products
    $deletePassSetSql = "
        DELETE FROM pass_set 
        WHERE product_id IN (
            SELECT id FROM products p
            WHERE p.deleted = 1 
            AND (p.product_type = 'trainingpass' OR p.product_type = 'onlinetraining')
            AND NOT EXISTS (
                SELECT 1 FROM pass_booked pb 
                WHERE pb.product_id = p.id 
                AND pb.booked_date >= :currentDate
            )
        )
    ";
    $deletePassSetStmt = $pdo->prepare($deletePassSetSql);
    $deletePassSetStmt->bindParam(':currentDate', $currentDate);
    $deletePassSetStmt->execute();

    // Delete all deleted products that are not used any more
    $deleteProductSql = "
        DELETE p
        FROM products p
        WHERE p.deleted = 1 
        AND (p.product_type = 'trainingpass' OR p.product_type = 'onlinetraining')
        AND NOT EXISTS (
            SELECT 1 FROM pass_booked pb 
            WHERE pb.product_id = p.id 
            AND pb.booked_date >= :currentDate
        )
    ";
    $deleteProductStmt = $pdo->prepare($deleteProductSql);
    $deleteProductStmt->bindParam(':currentDate', $currentDate);
    $deleteProductStmt->execute();


      // Delete all deleted products that are not used any more
    $deleteProduct2Sql = "
        DELETE p
        FROM products p
        WHERE p.deleted = 1 
        AND (p.product_type = 'trainprogram' OR p.product_type = 'dietprogram')
        AND NOT EXISTS (
            SELECT 1 FROM user_bought_products pb 
            WHERE pb.product_id = p.id
        )
    ";
    $deleteProduct2Stmt = $pdo->prepare($deleteProduct2Sql);
    $deleteProduct2Stmt->bindParam(':currentDate', $currentDate);
    $deleteProduct2Stmt->execute(); */


    $pdo = null;

   /*      
    // Paths and filenames
    $backupDir = '/domains/traino.nu/logs/backup/';  // Make sure this path is writable
    $sqlFile = $backupDir . 'database.sql';
    $encryptedFile = $backupDir . 'database.sql.enc';
    $zipPassword = ZIP_PASSWORD;


    // Step 1: Export database to SQL file
    $command = "mysqldump --host={$host} --user={$username} --password={$password} {$dbname} > {$sqlFile}";
    exec($command, $output, $return_var);
    if ($return_var !== 0) {
        die("Error exporting database to SQL file.");
    }

    // Step 2: Encrypt the SQL file using OpenSSL
    $plaintext = file_get_contents($sqlFile);
    if ($plaintext === false) {
        die("Error reading SQL file.");
    }

    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-cbc', $zipPassword, 0, $iv);
    if ($ciphertext === false) {
        die("Error encrypting SQL file.");
    }

    // Combine IV and ciphertext for storage
    $encryptedData = base64_encode($iv . $ciphertext);

    if (file_put_contents($encryptedFile, $encryptedData) === false) {
        die("Error writing encrypted file.");
    }

    // Step 3: Remove the temporary SQL file
    unlink($sqlFile);

 */

    // Construct the path to the cron_logs folder relative to the current directory
    $cronLogFile = __DIR__ . '/../cron_logs/cronlog.log';

    // Check if the file exists and delete it
    if (file_exists($cronLogFile)) {
        unlink($cronLogFile);
        error_log("Log file deleted successfully.");
    } else {
        error_log("Log file does not exist:" . $cronLogFile);
    }

    error_log("Daily Duty Cron Job Executed Successfully!");

} catch (PDOException $e) {
    // Handle any errors
    error_log("Database error: " . $e->getMessage());
} 

$pdo = null;

?>