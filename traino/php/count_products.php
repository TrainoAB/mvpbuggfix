<?php
require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);


if(isset($_GET['alias']) && isset($_GET['cat'])) {

try {


    // Variables
    $alias = urldecode($_GET['alias']); 
    $category = $_GET['cat'];

    // Prepare the SQL statement
    $sql1 = "SELECT id, firstname, lastname FROM users WHERE alias = :alias";
    $stmt1 = $pdo->prepare($sql1);

    // Bind the :alias parameter to the actual alias value
    $stmt1->bindParam(':alias', $alias, PDO::PARAM_STR);

    // Execute the query
    $stmt1->execute();

    // Fetch the result
    $user = $stmt1->fetch(PDO::FETCH_ASSOC);

    $userid = $user['id'];
    $firstname = $user['firstname'];
    $lastname = $user['lastname'];

    // SQL query
    $sql = "
    SELECT product_type, COUNT(*) as count
    FROM products 
    WHERE user_id = :userid 
    AND deleted = 0
    AND category_link = :category
    AND product_type IN ('trainprogram', 'dietprogram')
    GROUP BY product_type";
    
    // Prepare and execute
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':userid', $userid, PDO::PARAM_INT);
    $stmt->bindParam(':category', $category, PDO::PARAM_STR);
    $stmt->execute();

    // Fetch results
    $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);


    // SQL query
    $sql2 = "
    SELECT p.product_type, COUNT(DISTINCT p.id) as count
    FROM products p
    INNER JOIN pass_set ps ON p.id = ps.product_id
    WHERE p.user_id = :userid 
    AND p.deleted = 0
    AND ps.user_deleted = 0
    AND p.category_link = :category
    AND p.product_type IN ('trainingpass', 'onlinetraining')

    GROUP BY p.product_type";
    
    // Prepare and execute
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->bindParam(':userid', $userid, PDO::PARAM_INT);
    $stmt2->bindParam(':category', $category, PDO::PARAM_STR);
    $stmt2->execute();

    // Fetch results
    $counts2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Build an array for JSON response
    $response = [];
    foreach ($counts as $count) {
        $response['products'][] = [
            'product_type' => $count['product_type'],
            'count' => $count['count']
        ];
    }

    // Add second query results to response
    foreach ($counts2 as $count) {
        $response['products'][] = [
            'product_type' => $count['product_type'],
            'count' => $count['count']
        ];
    }
    
    // Add firstname and lastname to response
    $response['firstname'] = $firstname;
    $response['lastname'] = $lastname;

    // Send JSON response
    sendJson($response);

} catch (PDOException $e) {
  sendJsonError("Error: " . $e->getMessage());
}


} else if(isset($_GET['alias'])) {
  try {
    // Variables
    $alias = urldecode($_GET['alias']); 

    // Prepare the SQL statement
    $sql1 = "SELECT id FROM users WHERE alias = :alias";
    $stmt1 = $pdo->prepare($sql1);

    // Bind the :alias parameter to the actual alias value
    $stmt1->bindParam(':alias', $alias, PDO::PARAM_STR);

    // Execute the query
    $stmt1->execute();

    // Fetch the result
    $user = $stmt1->fetch(PDO::FETCH_ASSOC);

    if ($user === false) {
        sendJsonError("No user found for the provided alias: " . $alias); // Add a helpful error message
        exit; 
    }

    $userid = $user['id'];


    // SQL query
    $sql = "
    SELECT category_link,
          SUM(CASE WHEN product_type = 'trainprogram' THEN 1 ELSE 0 END) AS trainprogram_count,
          SUM(CASE WHEN product_type = 'dietprogram' THEN 1 ELSE 0 END) AS dietprogram_count
    FROM products
    WHERE product_type IN ('trainprogram', 'dietprogram')
    AND user_id = :userid
    AND deleted = 0
    GROUP BY category_link";
    
    // Prepare and execute
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':userid', $userid, PDO::PARAM_INT);
    $stmt->execute();

    // Fetch results
    $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);


    // SQL query
    $sql2 = "
    SELECT p.category_link,
          SUM(CASE WHEN p.product_type = 'trainingpass' THEN 1 ELSE 0 END) AS trainingpass_count,
          SUM(CASE WHEN p.product_type = 'onlinetraining' THEN 1 ELSE 0 END) AS onlinetraining_count
    FROM products p
    INNER JOIN pass_set ps ON p.id = ps.product_id
    WHERE p.product_type IN ('trainingpass', 'onlinetraining')
    AND p.user_id = :userid
    AND p.deleted = 0
    AND ps.user_deleted = 0
    GROUP BY p.category_link";
    
    // Prepare and execute
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->bindParam(':userid', $userid, PDO::PARAM_INT);
    $stmt2->execute();

    // Fetch results
    $counts2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Merge the results
$mergedResults = [];

foreach ($counts as $count) {
    $categoryLink = $count['category_link'];
    if (!isset($mergedResults[$categoryLink])) {
        $mergedResults[$categoryLink] = $count;
    } else {
        $mergedResults[$categoryLink]['trainprogram_count'] += $count['trainprogram_count'];
        $mergedResults[$categoryLink]['dietprogram_count'] += $count['dietprogram_count'];
    }
}

foreach ($counts2 as $count2) {
    $categoryLink = $count2['category_link'];
    if (!isset($mergedResults[$categoryLink])) {
        $mergedResults[$categoryLink] = $count2;
    } else {
        $mergedResults[$categoryLink]['trainingpass_count'] = $count2['trainingpass_count'];
        $mergedResults[$categoryLink]['onlinetraining_count'] = $count2['onlinetraining_count'];
    }
}

// Convert merged results to indexed array
$response = array_values($mergedResults);

    // Send JSON response
    sendJson($response);

} catch (PDOException $e) {
  sendJsonError("Error: " . $e->getMessage());
}
 
}