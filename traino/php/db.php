<?php
// Include your database configuration file
require_once("dbconfig.php");
require_once("functions.php");
require_once("errorlog.php");

$log = defined('ERRORLOG') && ERRORLOG === true;

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    // Direct access to this file is not allowed
    sendJsonError('Direct access is forbidden.');
    exit();
}

/*
 WHEN WE ARE DONE WORKING FROM LOCALHOST
// Set CORS headers
$allowed_origin = 'https://development.traino.nu'; // Replace with your Vercel deployment URL

// Allow requests only from specific origin and credentials
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // Adjust allowed methods as needed
    header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token'); // Adjust allowed headers as needed
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
    header('Access-Control-Max-Age: 86400'); // Cache preflight requests for 1 day
    header('Content-Length: 0');
    header('Content-Type: text/plain');
    exit();
}
*/

try {

    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(255) NULL,
        category_link VARCHAR(255) NULL,
        category_image VARCHAR(255) NULL,
        bought INT(11) NOT NULL DEFAULT 0
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS categories_wanted (
        sport VARCHAR(255) NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
       
    $pdo->exec("CREATE TABLE IF NOT EXISTS chat (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        one_user_id INT(30) NULL,
        two_user_id INT(30) NULL,
        text_message LONGTEXT NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS groups (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        groupname VARCHAR(255) NULL,
        groupalias VARCHAR(255) NULL,
        email VARCHAR(100) NULL,
        thumbnail TINYINT(1) NOT NULL DEFAULT 0,
        coverimage TINYINT(1) NOT NULL DEFAULT 0,
        website VARCHAR(255) NULL,
        group_area VARCHAR(255) NULL,
        group_address VARCHAR(255) NULL,
        group_areacode VARCHAR(255) NULL,
        latitude DECIMAL(10, 8), 
        longitude DECIMAL(11, 8),
        group_password VARCHAR(255) NULL,
        group_about TEXT NULL,
        hashkey VARCHAR(255) NULL,
        subscriber TINYINT(1) NOT NULL DEFAULT 0,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS groupmembers (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        group_id INT(30) NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        email VARBINARY(255) NULL,
        ipaddress VARBINARY(255) NULL,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        type VARCHAR(50),
        entity_id INT,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS notifyme (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        email VARBINARY(255) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pass_booked (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        product_type VARCHAR(255) NULL,
        product_id CHAR(40) NULL,
        trainer_id INT(30) NULL,
        pass_set_id INT(30) NULL,
        pass_set_repeat_id CHAR(40) NULL,
        rrule JSON NULL,
        booked_date DATE NULL,
        starttime TIME NULL,
        endtime TIME NULL,
        paid TINYINT(1) NOT NULL DEFAULT 0,
        canceled TINYINT(1) NOT NULL DEFAULT 0,
        ispause TINYINT(1) NOT NULL DEFAULT 0,
        reason VARCHAR(255) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        stripe_order_id VARCHAR(255) NULL,
        payment_intent_id VARCHAR(255) NULL,
        user_deleted TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_userid (user_id),
        INDEX idx_product_id (product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

     $pdo->exec("CREATE TABLE IF NOT EXISTS pass_set (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        product_type VARCHAR(255) NULL,
        product_id INT(30) NULL,
        category_link VARCHAR(255) NULL,
        pass_repeat_id CHAR(40) NULL,
        rrule LONGTEXT NULL,
        exrules LONGTEXT NULL,
        startdate DATE NULL,
        enddate DATE NULL,
        intervals LONGTEXT NULL,
        singeldayrepeat VARCHAR(30) NULL,
        isrepeat TINYINT(1) NOT NULL DEFAULT 0,
        autorepeat TINYINT(1) NOT NULL DEFAULT 0,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_deleted TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_userid (user_id),
        INDEX idx_product_id (product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        priceId VARCHAR(30) NULL,
        product_type VARCHAR(255) NULL,
        product_id CHAR(40) NULL,
        user_id INT(30) NULL,
        alias VARCHAR(255) NULL,
        gender VARCHAR(55) NULL,
        price INT(11) NULL,
        latitude DECIMAL(10,8) NULL,
        longitude DECIMAL(11,8),
        category_id INT(30) NULL,
        category_link VARCHAR(255) NULL,
        category_name VARCHAR(255) NULL, 
        address VARCHAR(255) NULL,
        type VARCHAR(255) NULL,
        duration INT(20) NULL,
        conversations INT(10) NULL,
        product_sessions INT(10) NULL,
        description LONGTEXT NULL,
        title VARCHAR(255) NULL,
        diet VARCHAR(255) NULL,
        hasfile TINYINT(1) NOT NULL DEFAULT 0,
        hasimage TINYINT(1) NOT NULL DEFAULT 0,
        hasclipcard BOOLEAN NOT NULL DEFAULT FALSE,
        product_id_link CHAR(40) NULL,
        clipcard_5_price INT(20) NULL,
        clipcard_10_price INT(20) NULL,
        clipcard_20_price INT(20) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_product_id (product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS rating (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        rating_user_id INT(30) NULL,
        rating_group_id INT(30) NULL,
        rating TINYINT(1) NULL,
        description LONGTEXT NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (user_id),
        INDEX idx_rating (rating),
        INDEX idx_rating_user_id (rating_user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

     $pdo->exec("CREATE TABLE IF NOT EXISTS rating_products (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        product_id INT(30) NULL,
        rating TINYINT(1) NULL,
        description LONGTEXT NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (user_id),
        INDEX idx_rating (rating),
        INDEX idx_product_id (product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        trainee_id INT(30) NULL,
        trainer_id INT(30) NULL,
        product_id VARCHAR(255) NULL,
        session_id VARCHAR(255) NULL,
        charge_id VARCHAR(255) NULL,
        payment_intent_id VARCHAR(255) NULL,
        status VARCHAR(255) NULL DEFAULT 'pending',
        info VARCHAR(255) NULL,
        receipt_url VARCHAR(255) NULL,
        productinfo LONGTEXT NULL,
        price INT(30) NULL,
        email VARCHAR(255) NULL,
        booked_date VARCHAR(255) NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        usertype VARCHAR(255) NULL,
        firstname VARCHAR(255) NULL,
        lastname VARCHAR(255) NULL,
        gender VARCHAR(255) NULL,
        email VARBINARY(255) NULL,
        alias VARCHAR(255) NULL,
        mobilephone VARBINARY(100) NULL,
        personalnumber VARBINARY(50) NULL,
        youtube_id VARCHAR(255) NULL,
        hourly_price INT(30) NOT NULL DEFAULT 0,
        user_area VARBINARY(255) NULL,
        user_address VARBINARY(255) NULL,
        user_areacode VARBINARY(255) NULL,
        latitude DECIMAL(10, 8), 
        longitude DECIMAL(11, 8),
        user_password VARCHAR(1000) NULL,
        user_about TEXT NULL,
        hashkey VARCHAR(255) NULL,
        subscriber TINYINT(1) NOT NULL DEFAULT 0,
        confirmed TINYINT(1) NOT NULL DEFAULT 0,
        stripe_account TINYINT(1) NOT NULL DEFAULT 0,
        stripe_id VARCHAR(255) NULL,
        roll VARCHAR(255) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        thumbnail TINYINT(1) NOT NULL DEFAULT 0,
        coverimage TINYINT(1) NOT NULL DEFAULT 0,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        deleted TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_lat_lng (latitude, longitude),
        INDEX idx_alias (alias)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_bought_products (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        product VARCHAR(255) NULL,
        product_id INT(30) NULL,
        product_id_link VARCHAR(255) NULL,
        clipcard_amount INT(10) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_deleted TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_userid (user_id),
        INDEX idx_product_id (product_id),
        INDEX idx_product_id_link (product_id_link)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_clipcards (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        product_id INT(30) NULL,
        clipcard_amount INT(10) NULL,
        INDEX idx_userid (user_id),
        INDEX idx_product_id (product_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_education (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        education VARCHAR(255) NULL,
        INDEX idx_userid (user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_files (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        file_names LONGTEXT NOT NULL,
        uploaded_at TIMESTAMP NOT NULL,
        accepted TINYINT(1) NOT NULL DEFAULT 0
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        email VARBINARY(255) NULL,
        session_id VARCHAR(255) NULL,
        registered DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userid (user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_train_categories (
        id INT(30) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(30) NULL,
        category_id INT(30) NULL,
        category_link VARCHAR(255) NULL,
        INDEX idx_userid (user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

} catch (PDOException $e) {
    // If an error occurs, add the error message to the $errors array
    $errors[] = $e->getMessage();
}

?>