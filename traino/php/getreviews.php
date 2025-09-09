<?php

require("apikey.php");
require("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);


if (isset($_GET['id'])) {
    try {
        // Define the user ID
        $user_id = isset($_GET['id']) ? validate_and_sanitize($_GET['id'], "integer") : null;

        // Prepare and execute the query to get trainer details from the users table
        $stmt = $pdo->prepare("
            SELECT
                u.firstname,
                u.lastname,
                u.alias
            FROM
                users u
            WHERE
                u.id = :userid
        ");
        $stmt->bindParam(':userid', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $trainer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$trainer) {
            throw new Exception("Trainer not found");
        }

        // Prepare and execute the query to get user details and ratings
        $stmt = $pdo->prepare("
            SELECT
                r.id AS review_id,
                r.rating,
                r.description,
                u.id AS user_id,
                u.thumbnail,
                u.firstname,
                u.lastname
            FROM
                rating r
            LEFT JOIN
                users u ON r.user_id = u.id
            WHERE
                r.rating_user_id = :userid
        ");
        $stmt->bindParam(':userid', $user_id, PDO::PARAM_INT);
        $stmt->execute();

        // Fetch the results
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate the average rating
        $stmt = $pdo->prepare("SELECT ROUND(AVG(rating), 1) AS average_rating FROM rating WHERE rating_user_id = :userid");
        $stmt->bindParam(':userid', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $averageRating = $stmt->fetch(PDO::FETCH_ASSOC)['average_rating'];

        // Prepare the response data
        $response = [
            'trainer' => [
                'name' => $trainer['firstname'] . ' ' . $trainer['lastname'],
                'rating' => $averageRating,
                'alias' => $trainer['alias'],
            ],
            'reviews' => []
        ];

        // Populate the reviews
        foreach ($reviews as $review) {
            $response['reviews'][] = [
                'id' => $review['review_id'],
                'user_id' => $review['user_id'],
                'thumbnail' => $review['thumbnail'],
                'name' => $review['firstname'] . ' ' . $review['lastname'],
                'rating' => $review['rating'],
                'description' => $review['description']
            ];
        }

        $pdo = null;
        sendJson($response);

    } catch (PDOException $e) {
        sendJsonError('Database error: ' . $e->getMessage());
    } catch (Exception $e) {
        sendJsonError($e->getMessage());
    }
} else {
    sendJsonError('User ID not provided');
}

?>