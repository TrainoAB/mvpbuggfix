<?php
require("encryptkey.php");
require("apikey.php");
require("db.php");
require_once("functions.php");
require("milestones.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
$encryptionKey = ENCRYPTION_KEY;
validateAuthHeader($apikey);

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
            u.verified,
            u.stripe_id,
            u.stripe_account,
            AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
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
            u.id = :user_id AND (u.deleted IS NULL OR u.deleted = 0)
        GROUP BY 
            u.id";

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindValue(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            // Decode HTML entities in user_address
            $result['user_address'] = validate_and_sanitize($result['user_address'], "text");

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

            // Extract the personal number
            $personalNumber = $result['personalnumber'];

            $age = convertAge($personalNumber);

            // Replace the personal number with the age in the result
            $result['age'] = $age;
            unset($result['personalnumber']);


            $result['education'] = $education;
            $result['training'] = $training;

            $pdo = null;
            // Return user data as JSON
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
} else if (isset($_GET['alias'])) {
    // Get alias from GET request
    $getalias = urldecode(trim($_GET['alias']));
    $alias = validate_and_sanitize($getalias, 'alias');

if (empty($alias)) {
    sendJsonError( "Alias is invalid or empty after sanitization.");
    exit;
}


    try {
        // SQL query to retrieve user details by alias
        $sql = "SELECT 
            u.id,
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
            u.latitude, 
            u.longitude, 
            u.alias,
            u.registered,
            u.verified,
            u.stripe_id,
            u.stripe_account,
            AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
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
            u.alias = :alias AND (u.deleted IS NULL OR u.deleted = 0)
        GROUP BY 
            u.id";

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':alias', $alias, PDO::PARAM_STR);
        $stmt->bindValue(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);


        if ($result === false) {
            sendJsonError( "No user found with alias: " . $alias . ", or query failed.");
            exit;
        }

        $user_id = $result['id'];

        // Prepare the SQL query
        $sql2 = "SELECT SUM(price) AS total_income FROM transactions WHERE trainer_id = :user_id";
        $stmt2 = $pdo->prepare($sql2);

        $stmt2->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt2->execute();
        $result2 = $stmt2->fetch(PDO::FETCH_ASSOC);

        // Get the total income
        $totalIncome = $result2['total_income'];

        $milestoneName = '';

        // Sort milestones by the 'milestone' value in ascending order
        usort($milestones, function ($a, $b) {
            return $a['milestone'] - $b['milestone'];
        });

        foreach ($milestones as $milestone) {
            if ($totalIncome >= $milestone['milestone']) {
                $milestoneName = $milestone['name'];
            } else {
                break;
            }
        }


        if ($result) {
            // Decode HTML entities in user_address
            $result['user_address'] = validate_and_sanitize($result['user_address'], "text");

            // Process and return user data as JSON
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

            $result['age'] = $age;
            unset($result['personalnumber']);

            $result['education'] = $education;
            $result['training'] = $training;
            $result['milestone'] = $milestoneName;

            sendJson($result);
        } else {
            // Return error message if user not found
            sendJsonError('User not found.');
        }
    } catch (PDOException $e) {
        // Handle database errors
        http_response_code(500);
        sendJsonError('Database error: ' . $e->getMessage());
    }
} else if (isset($_GET['moreid']) && $_GET['moreid'] === 'true') {

    // Assume incoming data is JSON and decode it
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if the received data is valid JSON
    if ($data === null) {
        http_response_code(400); // Bad Request
        sendJsonError("Invalid JSON received");
    }

    // Check if the 'ids' property exists in the received data
    if (!isset($data['ids']) || !is_array($data['ids'])) {
        http_response_code(400); // Bad Request
        sendJsonError("Missing or invalid 'ids' property in JSON");
    }

    try {
        // Example SQL query to retrieve user details by multiple ids
        $placeholders = rtrim(str_repeat('?,', count($data['ids'])), ',');
        $sql = "SELECT 
            u.id,
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
            u.latitude, 
            u.longitude, 
            u.alias,
            u.registered,
            u.verified,
            u.stripe_id,
            u.stripe_account,
            AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
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
            u.id IN ($placeholders) AND (u.deleted IS NULL OR u.deleted = 0)
        GROUP BY 
            u.id";

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':key', $encryptionKey, PDO::PARAM_STR);
        $stmt->execute($data['ids']);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedResults = [];

        foreach ($results as $result) {
            // Decode HTML entities in user_address
            $result['user_address'] = validate_and_sanitize($result['user_address'], "text");

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
            $result['age'] = $age;
            unset($result['personalnumber']);

            $result['education'] = $education;
            $result['training'] = $training;

            $formattedResults[] = $result;
        }

        // Return user data as JSON
        if ($formattedResults) {
            sendJson($formattedResults);
        } else {
            // If no users were found, return an error message
            sendJsonError('No users found.');
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
                u.verified,
                u.stripe_id,
                u.stripe_account,
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
                AND (u.deleted IS NULL OR u.deleted = 0)
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
            $user['user_address'] = validate_and_sanitize($result['user_address'], "text");

            $user['training'] = explode(',', $user['training']);

                $personalNumber = $user['personalnumber'];

                $age = convertAge($personalNumber);
                $user['age'] = $age;
                unset($user['personalnumber']);
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
} else if (isset($_GET['querytrainer'])) {


    $query = isset($_GET['querytrainer']) ? rawurldecode($_GET['querytrainer']) : '';
    $query = !empty($query) ? validate_and_sanitize($query, "text") : '';

    // Pagination parameters
    $perPage = isset($_GET['perpage']) ? validate_and_sanitize($_GET['perpage'], "integer") : 25;
    $currentPage = isset($_GET['page']) ? validate_and_sanitize($_GET['page'], "integer") : 1; // Current page number


    try {
       // Split the query into an array of terms, trimming whitespace
        $queryTerms = array_filter(array_map('trim', explode(' ', $query)));

        // Build dynamic WHERE conditions for each term
        $conditions = [];
        foreach ($queryTerms as $index => $term) {
            $conditions[] = "(
                LOWER(u.firstname) LIKE CONCAT('%', LOWER(:term{$index}), '%') OR 
                LOWER(u.lastname) LIKE CONCAT('%', LOWER(:term{$index}), '%') OR 
                LOWER(u.alias) LIKE CONCAT('%', LOWER(:term{$index}), '%')
            )";
        }
        $dynamicWhere = implode(' AND ', $conditions); // Combine conditions with AND for all terms
        
        // Add deleted check to dynamic WHERE conditions
        if (!empty($dynamicWhere)) {
            $dynamicWhere .= ' AND (u.deleted IS NULL OR u.deleted = 0)';
        } else {
            $dynamicWhere = '(u.deleted IS NULL OR u.deleted = 0)';
        }

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
                u.verified,
                u.stripe_id,
                u.stripe_account,
                AES_DECRYPT(u.personalnumber, :key) AS personalnumber,
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
                {$dynamicWhere}
            GROUP BY
                u.id
            ORDER BY
                u.lastname
            LIMIT :offset, :perPage";

        // Calculate offset
        $offset = ($currentPage - 1) * $perPage;

        // Prepare and execute the query
        $stmt = $pdo->prepare($sql);

        // Bind dynamic terms to query
        foreach ($queryTerms as $index => $term) {
            $stmt->bindValue(":term{$index}", $term, PDO::PARAM_STR);
        }

        // Bind other parameters
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
        $user['user_address'] = validate_and_sanitize($user['user_address'], "text");

        // Safe explode
        $user['training'] = array_filter(explode(',', $user['training'] ?? ''));

        $personalNumber = $user['personalnumber'];
        $age = convertAge($personalNumber);
        $user['age'] = $age;
        unset($user['personalnumber']);
    }

    sendJson([
        'users' => $users,
        'totalResults' => $totalResults,
        'totalPages' => $totalPages
    ]);
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