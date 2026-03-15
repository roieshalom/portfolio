<?php
session_start();
$projectId = $_GET['id'] ?? '';

// Load projects data
$projectsData = json_decode(file_get_contents('data/projects.json'), true);
$project = null;

foreach ($projectsData as $p) {
    if ($p['id'] === $projectId) {
        $project = $p;
        break;
    }
}

if (!$project) {
    http_response_code(404);
    die('Project not found');
}

// Check if protected and user is authenticated
if (!empty($project['protected'])) {
    if (!isset($_SESSION['pw_ok']) || $_SESSION['pw_ok'] !== $projectId) {
        http_response_code(403);
        die('Unauthorized access. Please log in first.');
    }
}

// Serve the PDF file
$pdfFile = $project['imagefolder'];

if (!file_exists($pdfFile)) {
    http_response_code(404);
    die('PDF file not found');
}

header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . basename($pdfFile) . '"');
header('Content-Length: ' . filesize($pdfFile));
readfile($pdfFile);
exit;
?>
