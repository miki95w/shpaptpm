<?php
/**
 * Solta Hotel Apartment · Operations
 * Roles & Permission Matrix API: /api/roles
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $roleId = $parts[0] ?? '';
    $action = $parts[1] ?? '';

    // 1. PATCH /api/roles/:id/permissions -> Toggle permission switch
    if ($method === 'PATCH' && $action === 'permissions') {
        $code = $input['code'] ?? '';
        $enabled = !empty($input['enabled']) ? 1 : 0;

        if (empty($code) || empty($roleId)) {
            jsonError('Role ID and permission code required', 400);
        }

        $stmt = $db->prepare("INSERT INTO role_permissions (role_id, permission_code, enabled) 
                             VALUES (?, ?, ?) 
                             ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)");
        $stmt->execute([$roleId, $code, $enabled]);

        logAudit('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'role.permission_changed', $user['name'], [
            'role_id' => $roleId,
            'code' => $code,
            'enabled' => (bool)$enabled
        ]);

        jsonResponse(['ok' => true]);
    }

    // 2. POST /api/roles -> Create new role
    if ($method === 'POST') {
        $name = trim($input['name'] ?? '');
        $propertyId = $input['propertyId'] ?? null;

        if (empty($name)) {
            jsonError('Role name is required', 400);
        }

        $id = generateUuid();
        $db->prepare("INSERT INTO roles (id, property_id, name, created_at) VALUES (?, ?, ?, NOW())")
           ->execute([$id, $propertyId, $name]);

        logAudit($propertyId ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'role.created', $user['name'], ['name' => $name]);
        jsonResponse(['ok' => true, 'id' => $id], 201);
    }

    // 3. DELETE /api/roles/:id -> Delete custom role (Admin only)
    if ($method === 'DELETE' && !empty($roleId)) {
        requireAdmin($db, $user);
        if ($roleId === 'def28ddb-4a03-44a2-a540-cf49c8ffea1c') {
            jsonError('Cannot delete the built-in Administrator role.', 400);
        }
        $db->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$roleId]);
        $db->prepare("DELETE FROM roles WHERE id = ?")->execute([$roleId]);
        logAudit('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'role.deleted', $user['name'], ['roleId' => $roleId]);
        jsonResponse(['ok' => true]);
    }

    jsonError('Unsupported role action', 400);

} catch (Exception $e) {
    jsonError('Role error: ' . $e->getMessage(), 500);
}
