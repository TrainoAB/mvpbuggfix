<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

// Set default values for page and limit if not provided in the query string
$page = isset($_GET['page']) ? validate_and_sanitize(intval($_GET['page']), "integer") : 1;
$limit = isset($_GET['limit']) ? validate_and_sanitize(intval($_GET['limit']), "integer") : 25;

// Calculate offset based on page and limit
$offset = ($page - 1) * $limit;

if (!isset($_GET['query'])) {
    // SQL query to fetch total number of FAQ entries
    $totalSql = "SELECT COUNT(*) as total FROM faq";
    $totalStmt = $pdo->prepare($totalSql);
    $totalStmt->execute();
    $totalResult = $totalStmt->fetch(PDO::FETCH_ASSOC);
    $totalEntries = $totalResult['total'];

    // Calculate total pages
    $totalPages = ceil($totalEntries / $limit);

    // SQL query to fetch paginated FAQ entries
    $sql = "SELECT * FROM faq LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Sending JSON response
    sendJson([
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'faqs' => $results
    ]);

} else if (isset($_GET['query'])) {
    $query = $_GET['query'];

    // SQL query to fetch total number of FAQ entries matching the query
    $totalSql = "SELECT COUNT(*) as total FROM faq WHERE question LIKE :query OR answer LIKE :query";
    $totalStmt = $pdo->prepare($totalSql);
    $totalStmt->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
    $totalStmt->execute();
    $totalResult = $totalStmt->fetch(PDO::FETCH_ASSOC);
    $totalEntries = $totalResult['total'];

    // Calculate total pages
    $totalPages = ceil($totalEntries / $limit);

    // SQL query to search in question and answer and fetch paginated results
    $sql = "SELECT * FROM faq WHERE question LIKE :query OR answer LIKE :query LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Sending JSON response
    sendJson([
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'faqs' => $results
    ]);

} else {
    // If query parameter is not set, return an error message
    sendJsonError('Query parameter is missing.');
}

$pdo = null;

?>