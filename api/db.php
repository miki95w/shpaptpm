<?php
/**
 * Solta Hotel Apartment · Operations
 * PDO Database Connection & Schema Handler
 */

require_once __DIR__ . '/config.php';

// Guarantee a secure, user-writable session directory for cPanel & PHP-FPM
if (!function_exists('getWritableSessionPath')) {
    function getWritableSessionPath() {
        // 1. Primary: Local sessions directory inside app
        $localSessions = dirname(__DIR__) . '/sessions';
        if (!is_dir($localSessions)) {
            @mkdir($localSessions, 0700, true);
        }
        if (is_dir($localSessions) && is_writable($localSessions)) {
            return $localSessions;
        }

        // 2. Existing configured path if writable
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
        $candidates[] = sys_get_temp_dir();
        $candidates[] = '/tmp';

        foreach ($candidates as $path) {
            if (!@is_dir($path)) {
                @mkdir($path, 0700, true);
            }
            if (@is_dir($path) && @is_writable($path)) {
                return $path;
            }
        }
        return $current;
    }
}

// Automatically configure writable session path before any session_start()
if (session_status() === PHP_SESSION_NONE) {
    $wPath = getWritableSessionPath();
    if (!empty($wPath) && $wPath !== @session_save_path()) {
        @ini_set('session.save_path', $wPath);
        @session_save_path($wPath);
    }
}

function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log sensitive connection details securely to internal server log
        error_log("Database connection error: " . $e->getMessage());
        
        // Return sanitized, generic error message to client without exposing credentials or host paths
        jsonError("Database connection unavailable. Please ensure database configuration is set correctly or contact your system administrator.", 500);
    }
}

// Log an audit trail event
function logAudit($propertyId, $action, $actor, $details = []) {
    try {
        $db = getDB();
        $stmt = $db->prepare("INSERT INTO audit_log (id, property_id, action, actor, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            generateUuid(),
            $propertyId,
            $action,
            $actor,
            json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ]);
    } catch (Exception $e) {
        error_log("Failed to log audit event: " . $e->getMessage());
    }
}

// Role and Permission Helpers (Guaranteed availability across all endpoints)
if (!function_exists('getUserRoleName')) {
    function getUserRoleName($db, $user) {
        if (empty($user['role_id'])) return '';
        static $cache = [];
        $rid = $user['role_id'];
        if (isset($cache[$rid])) return $cache[$rid];
        try {
            $stmt = $db->prepare("SELECT name FROM roles WHERE id = ? LIMIT 1");
            $stmt->execute([$rid]);
            $cache[$rid] = (string)($stmt->fetchColumn() ?: '');
        } catch (Throwable $e) {
            $cache[$rid] = '';
        }
        return $cache[$rid];
    }
}

if (!function_exists('isAdminUser')) {
    function isAdminUser($db, $user) {
        if (!$user) return false;
        if (($user['role_id'] ?? '') === 'def28ddb-4a03-44a2-a540-cf49c8ffea1c') return true;
        if (strtolower($user['email'] ?? '') === 'admin@gmail.com') return true;
        $roleName = strtolower(getUserRoleName($db, $user));
        return strpos($roleName, 'admin') !== false;
    }
}

if (!function_exists('isManagerOrAdmin')) {
    function isManagerOrAdmin($db, $user) {
        if (isAdminUser($db, $user)) return true;
        if (($user['role_id'] ?? '') === 'role-manager') return true;
        $roleName = strtolower(getUserRoleName($db, $user));
        return strpos($roleName, 'manager') !== false;
    }
}

if (!function_exists('requireAdmin')) {
    function requireAdmin($db, $user) {
        if (!isAdminUser($db, $user)) {
            jsonError('Forbidden: Only Administrators can delete records.', 403);
        }
    }
}

if (!function_exists('requireAdminOrManager')) {
    function requireAdminOrManager($db, $user) {
        if (!isManagerOrAdmin($db, $user)) {
            jsonError('Forbidden: Only Administrators or Managers can edit or delete inventory items.', 403);
        }
    }
}
