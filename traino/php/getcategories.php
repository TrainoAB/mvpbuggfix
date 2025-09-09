<?php

require_once("apikey.php");
require_once("db.php");
require_once("functions.php");

validateCorsMethod(['GET']);
$apikey = API_KEY;
validateAuthHeader($apikey);

try {
    /* $sql = "
     SELECT 
    c.*, 
    MAX(CASE 
        WHEN 
            (
                ps.category_link IS NOT NULL 
                AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
                AND EXISTS (
                    SELECT 1 
                    FROM products p_sub 
                    LEFT JOIN users u_sub ON p_sub.user_id = u_sub.id
                    WHERE 
                        ps.product_id = p_sub.id
                        AND p_sub.product_type IN ('trainingpass', 'onlinetraining')
                        AND p_sub.deleted != 1
                        AND u_sub.id IS NOT NULL
                )
            )
            OR (
                EXISTS (
                    SELECT 1 
                    FROM products p_sub 
                    LEFT JOIN users u_sub2 ON p_sub.user_id = u_sub2.id
                    WHERE 
                        p_sub.category_link = c.category_link 
                        AND p_sub.product_type IN ('trainprogram', 'dietprogram', 'clipcard')
                        AND p_sub.deleted != 1
                        AND u_sub2.id IS NOT NULL
                )
            ) 
        THEN 1 
        ELSE 0 
    END) AS is_show,  -- 🔥 Fix: Tar maxvärdet av is_show så att 1 alltid vinner över 0

    COUNT(DISTINCT CASE WHEN p.product_type = 'trainprogram' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) AS total_trainprogram,
    COUNT(DISTINCT CASE WHEN p.product_type = 'dietprogram' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) AS total_dietprogram,
    COUNT(DISTINCT CASE WHEN p.product_type = 'clipcard' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) AS total_clipcard,
    COUNT(
        DISTINCT CASE 
            WHEN 
                p.product_type = 'trainingpass' 
                AND ps.category_link IS NOT NULL 
                AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
                AND ps.product_id = p.id 
                AND p.deleted != 1
                AND u.id IS NOT NULL
            THEN p.id
        END
    ) AS total_trainingpass,
    COUNT(
        DISTINCT CASE 
            WHEN 
                p.product_type = 'onlinetraining' 
                AND ps.category_link IS NOT NULL 
                AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
                AND ps.product_id = p.id 
                AND p.deleted != 1
                AND u.id IS NOT NULL
            THEN p.id
        END
    ) AS total_onlinetraining
FROM 
    categories c
LEFT JOIN 
    pass_set ps ON c.category_link = ps.category_link AND ps.user_deleted = 0
LEFT JOIN 
    products p ON c.category_link = p.category_link AND p.deleted != 1
LEFT JOIN 
    users u ON p.user_id = u.id
GROUP BY 
    c.id
ORDER BY 
    is_show DESC,
    bought DESC,
    ( 
        COUNT(DISTINCT CASE WHEN p.product_type = 'trainprogram' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) + 
        COUNT(DISTINCT CASE WHEN p.product_type = 'dietprogram' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) + 
        COUNT(DISTINCT CASE WHEN p.product_type = 'trainingpass' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END) + 
        COUNT(DISTINCT CASE WHEN p.product_type = 'onlinetraining' AND p.deleted != 1 AND u.id IS NOT NULL THEN p.id END)
    ) DESC
"; */

 $sql = "
    SELECT 
        c.*,
        COALESCE(stats.is_show, 0) as is_show,
        COALESCE(stats.total_trainprogram, 0) as total_trainprogram,
        COALESCE(stats.total_dietprogram, 0) as total_dietprogram,
        COALESCE(stats.total_clipcard, 0) as total_clipcard,
        COALESCE(stats.total_trainingpass, 0) as total_trainingpass,
        COALESCE(stats.total_onlinetraining, 0) as total_onlinetraining
    FROM categories c
    LEFT JOIN (
        SELECT 
            category_link,
            MAX(CASE 
                WHEN has_products = 1 THEN 1 
                ELSE 0 
            END) as is_show,
            SUM(CASE WHEN product_type = 'trainprogram' THEN 1 ELSE 0 END) as total_trainprogram,
            SUM(CASE WHEN product_type = 'dietprogram' THEN 1 ELSE 0 END) as total_dietprogram,
            SUM(CASE WHEN product_type = 'clipcard' THEN 1 ELSE 0 END) as total_clipcard,
            SUM(CASE WHEN product_type = 'trainingpass' THEN 1 ELSE 0 END) as total_trainingpass,
            SUM(CASE WHEN product_type = 'onlinetraining' THEN 1 ELSE 0 END) as total_onlinetraining
        FROM (
            -- Direct products
            SELECT DISTINCT
                p.category_link,
                p.product_type,
                1 as has_products
            FROM products p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.deleted != 1 
            AND p.product_type IN ('trainprogram', 'dietprogram', 'clipcard')
            
            UNION
            
            -- Pass products
            SELECT DISTINCT
                ps.category_link,
                p.product_type,
                1 as has_products
            FROM pass_set ps
            INNER JOIN products p ON ps.product_id = p.id
            INNER JOIN users u ON p.user_id = u.id
            WHERE ps.user_deleted = 0
            AND p.deleted != 1
            AND p.product_type IN ('trainingpass', 'onlinetraining')
            AND (ps.enddate IS NULL OR ps.enddate >= :currentDate)
        ) combined
        GROUP BY category_link
    ) stats ON c.category_link = stats.category_link
    ORDER BY 
        is_show DESC,
        c.bought DESC,
        (COALESCE(stats.total_trainprogram, 0) + 
         COALESCE(stats.total_dietprogram, 0) + 
         COALESCE(stats.total_trainingpass, 0) + 
         COALESCE(stats.total_onlinetraining, 0)) DESC
    ";

    // Get the current date in 'YYYY-MM-DD' format
    $currentDate = date('Y-m-d');

    // Prepare and execute the SQL statement
    $selectStmt = $pdo->prepare($sql);
    $selectStmt->bindParam(':currentDate', $currentDate);
    $selectStmt->execute();

    // Fetch the results
    $results = $selectStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $pdo = null;
    
    sendJson($results);

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    sendJsonError('Database error: ' . $e->getMessage());
}

?>