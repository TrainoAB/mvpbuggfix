<?php 
require("db.php");

// Constants for the script
$totalUsers = 2004770;
$batchSize = 50;
$iterations = $totalUsers / $batchSize;

// Fetch category links from the database
$stmt = $pdo->query("SELECT id, category_link FROM categories");
$categories = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

function getRandomProduct() {
    $products = ['product_trainingpass', 'product_onlinetraining', 'product_dietprogram', 'product_trainprogram', 'product_clipcard'];
    $numProducts = rand(1, 2);
    return array_rand(array_flip($products), $numProducts);
}

for ($i = 0; $i < $iterations; $i++) {
    $pdo->beginTransaction();

    try {
        for ($j = 0; $j < $batchSize; $j++) {
            $userId = ($i * $batchSize) + $j + 1;
            $ratingUserId = rand(1, $totalUsers);
            $ratingGroupId = null;
            $rating = rand(1, 5);
            $description = 'This is a description for rating ' . $userId;

            // Insert into rating table
            $stmt = $pdo->prepare("INSERT INTO rating (user_id, rating_user_id, rating_group_id, rating, description) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $ratingUserId, $ratingGroupId, $rating, $description]);

            // Insert into one or two random product tables
            $randomProducts = getRandomProduct();
            foreach ($randomProducts as $productTable) {
                $alias = $userId;
                $categoryId = rand(1, 25);
                $categoryLink = $categories[$categoryId]; // Use the fetched category link
                $duration = rand(1, 365);
                $price = rand(10, 1000);
                $productDescription = 'This is a description for ' . $productTable . ' ' . $userId;
                $address = 'Address ' . $userId;

                 if ($productTable == 'product_dietprogram' || $productTable == 'product_trainprogram') {
                    $productType = "regular";
                    $productSessions = rand(1, 12);
                    $conversations = rand(1, 30);
                    $filelink = null;

                    $stmt = $pdo->prepare("INSERT INTO $productTable (user_id, alias, category_id, category_link, product_type, product_sessions, conversations, filelink, price, description, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, $alias, $categoryId, $categoryLink, $productType, $productSessions, $conversations, $filelink, $price, $productDescription, $address]);
                } 
                
                if($productTable == 'product_trainingpass') {
                    $latitude = -90.0 + mt_rand() / mt_getrandmax() * (90.0 - (-90.0));

                    // Longitude range for the entire world
                    $longitude = -180.0 + mt_rand() / mt_getrandmax() * (180.0 - (-180.0));

                    $stmt = $pdo->prepare("INSERT INTO $productTable (user_id, alias, category_id, category_link, duration, price, description, address, latitude, longitude) VALUES (?,?,?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, $alias, $categoryId, $categoryLink, $duration, $price, $productDescription, $address, $latitude, $longitude]);
                }

                if($productTable == 'product_onlinetraining') {

                    $stmt = $pdo->prepare("INSERT INTO $productTable (user_id, alias, category_id, category_link, duration, price, description, address ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, $alias, $categoryId, $categoryLink, $duration, $price, $productDescription, $address]);
                }

                if ($productTable == 'product_clipcard') {
                    $trainingPassId = rand(1, 1000);
                    $clipcard5Price = rand(50, 500);
                    $clipcard10Price = rand(100, 1000);
                    $clipcard20Price = rand(200, 2000);

                    $stmt = $pdo->prepare("INSERT INTO product_clipcard (user_id, alias, category_id, category_link, trainingpass_id, clipcard_5_price, clipcard_10_price, clipcard_20_price) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, $alias, $categoryId, $categoryLink, $trainingPassId, $clipcard5Price, $clipcard10Price, $clipcard20Price]);
                }
            }
        }

        $pdo->commit();
        echo "Batch " . ($i + 1) . " inserted successfully.\n";

        // Pause to reduce load
        sleep(1);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Failed to insert batch " . ($i + 1) . ": " . $e->getMessage() . "\n";
    }
}

?>