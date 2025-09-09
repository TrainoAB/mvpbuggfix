<?php
// TEST FILE
// NOT WORKING // NOT WORKING // NOT WORKING // NOT WORKING // NOT WORKING // NOT WORKING // NOT WORKING
require("db.php");


// Fetch users data
$stmt = $pdo->query('SELECT latitude, longitude FROM users');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$coordinates = array_map(function($user) {
    return [$user['latitude'], $user['longitude']];
}, $users);

// DBSCAN parameters
$epsilon = 0.01; // The maximum distance between two samples for one to be considered as in the neighborhood of the other
$minPoints = 10; // The number of samples in a neighborhood for a point to be considered as a core point

// DBSCAN clustering function
function dbscan($points, $epsilon, $minPoints) {
    $clusters = [];
    $visited = [];
    $noise = [];

    foreach ($points as $point) {
        if (in_array($point, $visited)) {
            continue;
        }

        $visited[] = $point;
        $neighbors = regionQuery($points, $point, $epsilon);

        if (count($neighbors) < $minPoints) {
            $noise[] = $point;
        } else {
            $clusters[] = [];
            expandCluster($points, $point, $neighbors, $clusters, $epsilon, $minPoints, $visited);
        }
    }

    return $clusters;
}

// Expand cluster function
function expandCluster($points, $point, $neighbors, &$clusters, $epsilon, $minPoints, &$visited) {
    $clusterIndex = count($clusters) - 1;
    $clusters[$clusterIndex][] = $point;

    for ($i = 0; $i < count($neighbors); $i++) {
        $neighbor = $neighbors[$i];
        if (!in_array($neighbor, $visited)) {
            $visited[] = $neighbor;
            $newNeighbors = regionQuery($points, $neighbor, $epsilon);

            if (count($newNeighbors) >= $minPoints) {
                $neighbors = array_merge($neighbors, $newNeighbors);
            }
        }

        if (!in_arrayInClusters($neighbor, $clusters)) {
            $clusters[$clusterIndex][] = $neighbor;
        }
    }
}

// Check if point is in clusters
function in_arrayInClusters($point, $clusters) {
    foreach ($clusters as $cluster) {
        if (in_array($point, $cluster)) {
            return true;
        }
    }
    return false;
}

// Find points within epsilon distance
function regionQuery($points, $point, $epsilon) {
    $neighbors = [];
    foreach ($points as $p) {
        if (haversine($point, $p) < $epsilon) {
            $neighbors[] = $p;
        }
    }
    return $neighbors;
}

// Haversine distance function
function haversine($point1, $point2) {
    $earthRadius = 6371; // Radius of the Earth in kilometers
    $lat1 = deg2rad($point1[0]);
    $lon1 = deg2rad($point1[1]);
    $lat2 = deg2rad($point2[0]);
    $lon2 = deg2rad($point2[1]);

    $dLat = $lat2 - $lat1;
    $dLon = $lon2 - $lon1;

    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos($lat1) * cos($lat2) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}

// Perform DBSCAN clustering
$clusters = dbscan($coordinates, $epsilon, $minPoints);

// Prepare cluster data for frontend
$clusterData = [];
foreach ($clusters as $cluster) {
    $latSum = 0;
    $lonSum = 0;
    $count = count($cluster);

    foreach ($cluster as $point) {
        $latSum += $point[0];
        $lonSum += $point[1];
    }

    $clusterData[] = [
        'latitude' => $latSum / $count,
        'longitude' => $lonSum / $count,
        'count' => $count
    ];
}

// Output data as JSON
header('Content-Type: application/json');
echo json_encode($clusterData);


?>