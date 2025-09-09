<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

try {
    // Get the page number from the query parameters, default to page 1 if not provided
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $page = $page < 1 ? 1 : $page; // Ensure the page number is at least 1

    // Set the number of results per page
    $resultsPerPage = 25; // You can adjust this value

    // Calculate the starting offset
    $offset = ($page - 1) * $resultsPerPage;

    // Calculate the total number of results
    $countSql = "SELECT COUNT(*) FROM bugreports";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute();
    $totalResults = (int) $countStmt->fetchColumn();

    // Calculate the total number of pages
    $totalPages = ceil($totalResults / $resultsPerPage);

    // Prepare the paginated SQL query with LEFT JOIN to users table
    $sql = "SELECT b.*, u.firstname, u.lastname 
            FROM bugreports b 
            LEFT JOIN users u ON b.user_id = u.id 
            ORDER BY b.created_at DESC 
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':limit', $resultsPerPage, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    // Fetch the result
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pdo = null;
    // Prepare the response
    $response = [
        'totalResults' => $totalResults,
        'totalPages' => $totalPages,
        'currentPage' => $page,
        'results' => $result
    ];

    // Send the response as JSON
    sendJson($response);

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}


?>