<?php
/**
 * Solta Hotel Apartment · Operations
 * cPanel Database & Environment Configuration
 */

// Report errors in development, hide in production
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Database connection settings (Update these to match your cPanel MySQL details)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'solta_pms');
define('DB_USER', getenv('DB_USER') ?: 'solta_user');
define('DB_PASS', getenv('DB_PASS') ?: 'solta_password');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

// Environment mode (Set to false in production)
define('DEV_MODE', (bool)(getenv('DEV_MODE') ?: false));

// Session security
define('SESSION_LIFETIME', 28800); // 8 hours

// JSON Response Helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// JSON Error Helper (Sanitizes 500 internal errors in production)
function jsonError($message, $statusCode = 400) {
    if (!defined('DEV_MODE') || !DEV_MODE) {
        if ($statusCode >= 500) {
            error_log("Internal API error: " . $message);
            $message = 'An unexpected server error occurred. Please contact system support.';
        }
    }
    jsonResponse(['message' => $message], $statusCode);
}

// Guarantee a secure, user-writable session directory for cPanel & PHP-FPM
if (!function_exists('getWritableSessionPath')) {
    function getWritableSessionPath() {
        $current = @session_save_path();
        if (!empty($current) && @is_dir($current) && @is_writable($current)) {
            return $current;
        }

        $candidates = [];
        if (!empty($_SERVER['DOCUMENT_ROOT'])) {
            $parent = dirname($_SERVER['DOCUMENT_ROOT']);
            $candidates[] = $parent . '/tmp';
        }
        if (!empty($_SERVER['HOME'])) {
            $candidates[] = $_SERVER['HOME'] . '/tmp';
        }
        $candidates[] = dirname(__DIR__) . '/sessions';
        $candidates[] = sys_get_temp_dir();
        $candidates[] = '/tmp';

        foreach ($candidates as $path) {
            if (!@is_dir($path)) {
                @mkdir($path, 0700, true);
            }
            if (@is_dir($path) && @is_writable($path)) {
                if (strpos($path, 'sessions') !== false && !file_exists($path . '/.htaccess')) {
                    @file_put_contents($path . '/.htaccess', "Order deny,allow\nDeny from all\n");
                }
                return $path;
            }
        }
        return $current;
    }
}

// Start Secure Session
function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        $savePath = getWritableSessionPath();
        if (!empty($savePath) && $savePath !== @session_save_path()) {
            @session_save_path($savePath);
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
        
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        
        session_name('solta_session');
        @session_start();
    }
}

// Get current authenticated user
function getCurrentUser() {
    initSession();
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? 'User',
        'email' => $_SESSION['user_email'] ?? '',
        'role_id' => $_SESSION['role_id'] ?? ''
    ];
}

// Require authentication
function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        jsonError('Please sign in', 401);
    }
    return $user;
}

// Get user's role name from DB
function getUserRoleName($db, $user) {
    if (empty($user['role_id'])) return '';
    static $cache = [];
    $rid = $user['role_id'];
    if (isset($cache[$rid])) return $cache[$rid];
    $stmt = $db->prepare("SELECT name FROM roles WHERE id = ? LIMIT 1");
    $stmt->execute([$rid]);
    $cache[$rid] = (string)($stmt->fetchColumn() ?: '');
    return $cache[$rid];
}

function isAdminUser($db, $user) {
    if (!$user) return false;
    if (($user['role_id'] ?? '') === 'def28ddb-4a03-44a2-a540-cf49c8ffea1c') return true;
    if (strtolower($user['email'] ?? '') === 'admin@gmail.com') return true;
    $roleName = strtolower(getUserRoleName($db, $user));
    return strpos($roleName, 'admin') !== false;
}

function isManagerOrAdmin($db, $user) {
    if (isAdminUser($db, $user)) return true;
    if (($user['role_id'] ?? '') === 'role-manager') return true;
    $roleName = strtolower(getUserRoleName($db, $user));
    return strpos($roleName, 'manager') !== false;
}

function requireAdmin($db, $user) {
    if (!isAdminUser($db, $user)) {
        jsonError('Forbidden: Only Administrators can delete records.', 403);
    }
}

function requireAdminOrManager($db, $user) {
    if (!isManagerOrAdmin($db, $user)) {
        jsonError('Forbidden: Only Administrators or Managers can edit or delete inventory items.', 403);
    }
}

// Read JSON input body
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// Generate UUID v4
function generateUuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
