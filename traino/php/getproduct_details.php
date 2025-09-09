<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

// Check if either user_id or alias is set
if (isset($_GET['id'])) {
    // Get product_id and get_table from GET request
    $product_id = isseT($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;
    /*
    // Remove "product_" prefix if it exists
    if (strpos($get_table, 'product_') === 0) {
        $get_table = substr($get_table, strlen('product_'));
    }
    */
    
    try {
        // Example SQL query to retrieve user details from specified product table and left join with users table
        $sql = "SELECT 
                    p.*,
                    u.id AS user_id,
                    u.firstname,
                    u.lastname,
                    u.gender,
                    AES_DECRYPT(u.email, :key) AS email,
                    AES_DECRYPT(u.mobilephone, :key) AS mobilephone,
                    u.hourly_price,
                    u.thumbnail,
                    u.coverimage,
                    u.youtube_id,
                    u.user_about,
                    AES_DECRYPT(u.user_address, :key) AS user_address,
                    AES_DECRYPT(u.user_area, :key) AS user_area,
                    AES_DECRYPT(u.user_areacode, :key) AS user_areacode,
                    u.usertype,
                    u.latitude AS user_latitude,
                    u.longitude AS user_longitude,
                    u.alias,
                    u.registered,
                    AES_DECRYPT(u.personalnumber, :key) AS personalnumber,

                    GROUP_CONCAT(DISTINCT CONCAT_WS(':', c.id, c.category_name, c.category_link) SEPARATOR '|') AS training,
                    ROUND(AVG(r.rating), 1) AS rating,
                    GROUP_CONCAT(DISTINCT ue.education SEPARATOR '|') AS education
                FROM 
                    products p
                LEFT JOIN 
                    users u ON p.user_id = u.id
                LEFT JOIN 
                    user_train_categories utc ON u.id = utc.user_id
                LEFT JOIN 
                    categories c ON utc.category_id = c.id
                LEFT JOIN 
                    rating r ON u.id = r.rating_user_id
                LEFT JOIN 
                    user_education ue ON u.id = ue.user_id
                WHERE 
                    p.id = :product_id
                AND p.deleted = 0
                AND u.id IS NOT NULL
                GROUP BY 
                    p.id, u.id";

        // Prepare the SQL statement
        $stmt = $pdo->prepare($sql);
        
        // Bind parameters
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        
        // Execute the query
        $stmt->execute();
        
        // Fetch the result
        $result = $stmt->fetch(PDO::FETCH_ASSOC);


         if (is_array($result) && !empty($result)) {
            // Decode HTML entities in user_address
            $result['user_address'] = html_entity_decode($result['user_address'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

            // Parse the training field into an array of training categories
            $training = [];
            if (!empty($result['training'])) {
                $trainingParts = explode('|', $result['training']);
                foreach ($trainingParts as $trainingPart) {
                    list($id, $name, $link) = explode(':', $trainingPart);
                    $training[] = [
                        'id' => $id,
                        'category_name' => $name,
                        'category_link' => $link
                    ];
                }
        
            }
            // Parse the education field into an array of education entries
            $education = [];
            if (!empty($result['education'])) {
                $educationParts = explode('|', $result['education']);
                foreach ($educationParts as $educationPart) {
                    $trimmedEducation = trim($educationPart);
                    if (!empty($trimmedEducation)) {
                        $education[] = $trimmedEducation;
                    }
                }
            }

            $personalNumber = $result['personalnumber'];
            
            $age = convertAge($personalNumber);

            // Replace the personal number with the age in the result
            $result['age'] = $age;
            unset($result['personalnumber']);
        
            $result['education'] = $education;

            $result['training'] = $training;

            // Return product data as JSON

            $pdo = null;
            sendJson($result);
        } else {
            // If user does not exist, return an error message
            sendJsonError('Product not found.');
        }
    

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }

} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('Product ID is missing.');
}


?>