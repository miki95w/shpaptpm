<?php
/**
 * Solta Hotel Apartment · Operations
 * Health Check & Diagnostic Endpoint: /api/health
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$diagnostic = [
    'status' => 'checking',
    'php_version' => PHP_VERSION,
    'config_exists' => false,
    'db_connected' => false,
    'db_error' => null,
    'tables_count' => 0,
    'users_count' => 0,
    'admin_user_found' => false,
    'session_active' => false,
    'session_writable' => false
];

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    $diagnostic['status'] = 'error';
    $diagnostic['config_exists'] = false;
    $diagnostic['message'] = 'api/config.php is missing. Please run /api/install.php or create api/config.php.';
    echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$diagnostic['config_exists'] = true;
require_once $configFile;
require_once __DIR__ . '/db.php';

// Check session
try {
    initSession();
    $diagnostic['session_active'] = (session_status() === PHP_SESSION_ACTIVE);
    $savePath = session_save_path() ?: sys_get_temp_dir();
    $diagnostic['session_save_path'] = $savePath;
    $diagnostic['session_writable'] = is_writable($savePath);
} catch (Throwable $e) {
    $diagnostic['session_error'] = $e->getMessage();
}

// Check database direct PDO connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $diagnostic['db_connected'] = true;

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $diagnostic['tables_count'] = count($tables);

    if (in_array('users', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $diagnostic['users_count'] = (int)$count;

        $admin = $pdo->query("SELECT COUNT(*) FROM users WHERE email = 'admin@gmail.com'")->fetchColumn();
        $diagnostic['admin_user_found'] = ((int)$admin > 0);
    }

    $diagnostic['status'] = ($diagnostic['db_connected'] && $diagnostic['users_count'] > 0) ? 'healthy' : 'database_empty';
} catch (Throwable $e) {
    $diagnostic['status'] = 'database_connection_failed';
    $diagnostic['db_error'] = $e->getMessage();
}

echo json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
