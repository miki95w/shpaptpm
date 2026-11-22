<?php
/**
 * Solta Hotel Apartment · Operations
 * Payment Methods API: /api/payment-methods
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $pmId = $parts[0] ?? '';

    // 1. PATCH /api/payment-methods/:id -> Toggle active status
    if ($method === 'PATCH' && !empty($pmId)) {
        $active = !empty($input['active']) ? 1 : 0;
        $db->prepare("UPDATE payment_methods SET active = ? WHERE id = ?")->execute([$active, $pmId]);

        logAudit('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'payment_method.updated', $user['name'], [
            'id' => $pmId,
            'active' => (bool)$active
        ]);

        jsonResponse(['ok' => true]);
    }

    // 2. POST /api/payment-methods -> Create new method
    if ($method === 'POST') {
        $name = trim($input['name'] ?? '');
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';

        if (empty($name)) {
            jsonError('Payment method name required', 400);
        }

        $id = generateUuid();
        $db->prepare("INSERT INTO payment_methods (id, property_id, name, active, created_at) VALUES (?, ?, ?, 1, NOW())")
           ->execute([$id, $propertyId, $name]);

        logAudit($propertyId, 'payment_method.created', $user['name'], ['name' => $name]);
        jsonResponse(['ok' => true, 'id' => $id], 201);
    }

    jsonError('Unsupported payment method action', 400);

} catch (Exception $e) {
    jsonError('Payment method error: ' . $e->getMessage(), 500);
}
