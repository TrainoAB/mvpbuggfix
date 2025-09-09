<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);
// validateSessionID($pdo, null, true);

// Check if either user_id or alias is set
if (isset($_GET['id'])) {
    // Get user_id from GET request
    $user_id = isset($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;
    
    try {
        // Example SQL query to retrieve user details by id
        $sql = "SELECT 
            u.id,
            u.firstname, 
            u.lastname, 
            u.gender,
            AES_DECRYPT(u.email, :key) AS email,
            AES_DECRYPT(u.mobilephone, :key) AS mobilephone,
            AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
            u.hourly_price, 
            u.thumbnail, 
            u.coverimage, 
            u.youtube_id,
            u.user_about, 
            AES_DECRYPT(u.user_address, :key) AS user_address,
            AES_DECRYPT(u.user_area, :key) AS user_area,
            AES_DECRYPT(u.user_areacode, :key) AS user_areacode,
            u.usertype, 
            u.latitude, 
            u.longitude, 
            u.alias,
            u.registered,
            u.subscriber,
            u.confirmed,
            u.verified,
            GROUP_CONCAT(DISTINCT CONCAT_WS(':', c.id, c.category_name, c.category_link) SEPARATOR '|') AS training,
            ROUND(AVG(r.rating), 1) AS rating,
            GROUP_CONCAT(DISTINCT ue.education SEPARATOR '|') AS education
        FROM 
            users u
        LEFT JOIN 
            user_train_categories utc ON u.id = utc.user_id
        LEFT JOIN 
            categories c ON utc.category_id = c.id
        LEFT JOIN 
            rating r ON u.id = r.rating_user_id
        LEFT JOIN 
            user_education ue ON u.id = ue.user_id
        WHERE 
            u.id = :user_id
        GROUP BY 
            u.id";

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        // Bind the parameter using bindParam
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':key', $encryptionKey, PDO::PARAM_STR);
        // Execute the statement
        $stmt->execute();
        // Fetch the result
        $result = $stmt->fetch(PDO::FETCH_ASSOC);


         if ($result) {
            // Decode HTML entities in user_address
            $result['user_address'] = html_entity_decode((string) $result['user_address'], ENT_QUOTES | ENT_HTML5, 'UTF-8');


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
        
            $result['education'] = $education;

            $result['training'] = $training;

            // Return user data as JSON
            $pdo = null;
            sendJson($result);
        } else {
            // If user does not exist, return an error message
            sendJsonError('User not found.');
        }
    

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }


} else if (isset($_GET['query'])) {

    $query = isset($_GET['query']) ? rawurldecode($_GET['query']) : '';
    $query = !empty($query) ? validate_and_sanitize($query, "text") : '';

    // Pagination parameters
    $perPage = isset($_GET['perpage']) ? validate_and_sanitize($_GET['perpage'], "integer") : 25;
    $currentPage = isset($_GET['page']) ? validate_and_sanitize($_GET['page'], "integer") : 1; // Current page number


 try {
    // SQL query to fetch user data with pagination and total count
    $sql = "SELECT
                SQL_CALC_FOUND_ROWS
                u.id,
                u.firstname,
                u.lastname,
                u.gender,
                u.alias,
                AES_DECRYPT(u.email, :key) AS email,
                AES_DECRYPT(u.mobilephone, :key) AS mobilephone,
                AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
                u.hourly_price,
                u.thumbnail,
                u.coverimage,
                u.user_about,
                AES_DECRYPT(u.user_address, :key) AS user_address,
                AES_DECRYPT(u.user_area, :key) AS user_area,
                AES_DECRYPT(u.user_areacode, :key) AS user_areacode,
                u.usertype,
                u.latitude,
                u.longitude,
                u.subscriber,
                u.confirmed,
                GROUP_CONCAT(DISTINCT c.category_name) AS training,
                (
                    SELECT ROUND(AVG(r.rating), 1)
                    FROM rating r
                    WHERE r.rating_user_id = u.id
                ) AS rating
            FROM
                users u
            LEFT JOIN
                user_train_categories utc ON u.id = utc.user_id
            LEFT JOIN
                categories c ON utc.category_id = c.id
            WHERE
                CONCAT(LOWER(u.firstname), ' ', LOWER(u.lastname), ' ', LOWER(u.alias)) LIKE CONCAT('%', LOWER(:query), '%')
            GROUP BY
                u.id
            ORDER BY
                u.lastname
            LIMIT :offset, :perPage";

    // Calculate offset
    $offset = ($currentPage - 1) * $perPage;

    // Prepare and execute the query
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':query', $query, PDO::PARAM_STR);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':perPage', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':key', $encryptionKey, PDO::PARAM_STR);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch total results count using FOUND_ROWS()
    $totalResultsStmt = $pdo->query("SELECT FOUND_ROWS()");
    $totalResults = $totalResultsStmt->fetchColumn();

    // Calculate total pages
    $totalPages = ceil($totalResults / $perPage);

    // Check if users exist and return JSON response
    if ($users) {
        foreach ($users as &$user) {
            // Decode HTML entities in user_address
            $user['user_address'] = html_entity_decode($user['user_address'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            
            $user['training'] = explode(',', $user['training']);

            $personalNumber = $user['personalnumber'];
            
            $age = convertAge($personalNumber);
            // Replace the personal number with the age in the result
            $user['age'] = $age;
        }
        sendJson(array(
            'users' => $users,
            'totalResults' => $totalResults,
            'totalPages' => $totalPages
        ));
    } else {
        sendJsonError('Users not found.');
    }

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}
} else {
    // If neither id nor alias is set, return an error message
    sendJsonError('User ID or alias or query is missing.');
}

?>