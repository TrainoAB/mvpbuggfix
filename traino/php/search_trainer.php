<?php
require_once("encryptkey.php");
require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);


// Check if user_id is set
if(isset($_GET['query'])) {


    // URL decode the query parameter
    $decoded_query = urldecode($_GET['query']);

    // Validate and sanitize the query parameter
    $query = validate_and_sanitize($decoded_query, 'text');

    // Split the query into an array by spaces
    $queryArray = explode(' ', $query);

    // Prepare the query for SQL LIKE clause
    $queryArray = array_map(function($item) {
        return '%' . $item . '%';
    }, $queryArray);

    // Join the array back into a single string for SQL query
    $query = implode(' ', $queryArray);
    
    // Pagination parameters with validation and sanitization
    $perPage = isset($_GET['perpage']) ? validate_and_sanitize($_GET['perpage'], 'integer') : 25;
    $currentPage = isset($_GET['page']) ? validate_and_sanitize($_GET['page'], 'integer') : 1;

    try {
        // Example SQL query to retrieve paginated user details by id
        // Construct the SQL query dynamically with multiple LIKE clauses
$whereClauses = [];
foreach ($queryArray as $index => $term) {
    $whereClauses[] = "(LOWER(u.firstname) LIKE LOWER(:query{$index}) OR LOWER(u.lastname) LIKE LOWER(:query{$index}) OR LOWER(u.alias) LIKE LOWER(:query{$index}))";
}
$whereSql = implode(' OR ', $whereClauses);

// Example SQL query to retrieve paginated user details by id
$sql = "SELECT 
                u.firstname, 
                u.lastname, 
                u.gender,
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
                u.alias,
                AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
                GROUP_CONCAT(DISTINCT c.category_name) AS training,
                ROUND(AVG(r.rating), 1) AS rating
            FROM 
                users u
            LEFT JOIN 
                user_train_categories utc ON u.id = utc.user_id
            LEFT JOIN 
                categories c ON utc.category_id = c.id
            LEFT JOIN 
                rating r ON u.id = r.rating_user_id
            WHERE 
                ($whereSql)
                AND u.usertype = 'trainer'
                AND u.deleted = 0
            GROUP BY 
                u.firstname
            LIMIT 
                :offset, :perPage"; // Limit query results based on pagination

        $offset = ($currentPage - 1) * $perPage;

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':query', $query, PDO::PARAM_STR);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':perPage', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate total number of pages
        $totalResults = count($users);
        $totalPages = ceil($totalResults / $perPage);

        // Check if users exist
        if ($users) {
            // Convert comma-separated string to array
            foreach ($users as &$user) {
                // Decode HTML entities in user_address
                $user['user_address'] = html_entity_decode($user['user_address'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

                $user['training'] = explode(',', $user['training']);

                // Extract the personal number
                $personalNumber = $user['personalnumber'];
            
                $age = convertAge($personalNumber);

                // Replace the personal number with the age in the result
                $user['age'] = $age;
                unset($user['personalnumber']);
            
            }

            $pdo = null;
            
            // Return user data as JSON
            sendJson(array(
                'users' => $users,
                'totalResults' => $totalResults,
                'totalPages' => $totalPages
            ));
        } else {
            // If users do not exist, return an error message
            sendJsonError('Users not found.');
        }

    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }
} else {
    // If user_id is not set, return an error message
    sendJsonError('User ID is missing.');
}

?>