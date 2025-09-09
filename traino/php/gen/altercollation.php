<?php
require("db.php");

try {

    // Fetch all table names
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = '$dbname' AND table_type = 'BASE TABLE'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Generate and execute ALTER TABLE statements
    foreach ($tables as $table) {
        $alterTableSql = "ALTER TABLE `$table` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        echo "Executing: $alterTableSql\n"; // Output the statement for debugging
        $pdo->exec($alterTableSql);
    }

    echo "All tables have been successfully converted to utf8mb4 and utf8mb4_unicode_ci.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$pdo = null;
?>