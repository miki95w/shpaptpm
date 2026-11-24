<?php
/**
 * Solta Hotel Apartment · Operations
 * Staff Users API: /api/users
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

$db = getDB();
$input = getJsonInput();

try {
    if ($method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $roleId = $input['roleId'] ?? '';
        $isCleaner = !empty($input['cleaner']);

        if (empty($name) || empty($email) || empty($password) || empty($roleId)) {
            jsonError('All staff fields are required', 400);
        }

        // Check if email already exists
        $chk = $db->prepare("SELECT id FROM users WHERE email = ?");
        $chk->execute([$email]);
        if ($chk->fetch()) {
            jsonError('A staff member with this email already exists', 400);
        }

        $userId = generateUuid();
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $db->prepare("INSERT INTO users (id, property_id, name, email, password_hash, role_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, $propertyId, $name, $email, $hash, $roleId]);

        // If cleaner custody selected, create custody location
        if ($isCleaner) {
            $locId = generateUuid();
            $db->prepare("INSERT INTO inventory_locations (id, property_id, name, kind, user_id) VALUES (?, ?, ?, 'cleaner_custody', ?)")
               ->execute([$locId, $propertyId, $name . ' (Cart Custody)', $userId]);
        }

        logAudit($propertyId, 'staff.created', $user['name'], ['name' => $name, 'email' => $email, 'roleId' => $roleId]);
        jsonResponse(['ok' => true, 'id' => $userId], 201);
    }

    // DELETE /api/users/:id -> Delete staff user (Admin only)
    if ($method === 'DELETE') {
        requireAdmin($db, $user);
        $reqPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        $reqPath = preg_replace('#^/api/?#', '', $reqPath);
        $seg = array_values(array_filter(explode('/', trim($reqPath, '/'))));
        $targetId = $seg[1] ?? '';
        if (empty($targetId)) {
            jsonError('User ID required', 400);
        }
        if ($targetId === $user['id']) {
            jsonError('You cannot delete your own active account.', 400);
        }
        $db->prepare("DELETE FROM users WHERE id = ?")->execute([$targetId]);
        logAudit('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'staff.deleted', $user['name'], ['userId' => $targetId]);
        jsonResponse(['ok' => true]);
    }

    jsonError('Unsupported users action', 400);

} catch (Exception $e) {
    jsonError('Staff management error: ' . $e->getMessage(), 500);
}
