<?php
/**
 * Solta Hotel Apartment · Operations
 * Utilities Tracking & Billing API: /api/utilities
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $utilityId = $parts[0] ?? '';
    $action = $parts[1] ?? '';

    // 1. PATCH /api/utilities/:id/pay -> Mark bill as paid
    if ($method === 'PATCH' && !empty($utilityId) && $action === 'pay') {
        $paymentDate = trim($input['payment_date'] ?? date('Y-m-d'));
        $paymentMethod = trim($input['payment_method'] ?? 'Telebirr');

        $stmtChk = $db->prepare("SELECT * FROM utilities WHERE id = ?");
        $stmtChk->execute([$utilityId]);
        $util = $stmtChk->fetch();
        if (!$util) {
            jsonError('Utility bill not found', 404);
        }

        $stmt = $db->prepare("UPDATE utilities SET status = 'paid', payment_date = ?, payment_method = ? WHERE id = ?");
        $stmt->execute([$paymentDate, $paymentMethod, $utilityId]);

        logAudit($util['property_id'], 'utility.paid', $user['name'], [
            'id' => $utilityId,
            'type' => $util['utility_type'],
            'amount' => $util['amount'],
            'method' => $paymentMethod
        ]);

        jsonResponse(['ok' => true]);
    }

    // 2. DELETE /api/utilities/:id (Admin only)
    if ($method === 'DELETE' && !empty($utilityId)) {
        requireAdmin($db, $user);
        $stmtChk = $db->prepare("SELECT property_id, utility_type, amount FROM utilities WHERE id = ?");
        $stmtChk->execute([$utilityId]);
        $util = $stmtChk->fetch();
        if ($util) {
            $db->prepare("DELETE FROM utilities WHERE id = ?")->execute([$utilityId]);
            logAudit($util['property_id'], 'utility.deleted', $user['name'], [
                'id' => $utilityId,
                'type' => $util['utility_type']
            ]);
        }
        jsonResponse(['ok' => true]);
    }

    // 3. POST /api/utilities -> Record new utility bill
    if ($method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $utilityType = trim($input['utility_type'] ?? 'Electricity');
        $provider = trim($input['provider'] ?? 'Ethiopian Electric Utility (EEU)');
        $prevMeter = isset($input['meter_reading_prev']) && $input['meter_reading_prev'] !== '' ? floatval($input['meter_reading_prev']) : null;
        $currMeter = isset($input['meter_reading_curr']) && $input['meter_reading_curr'] !== '' ? floatval($input['meter_reading_curr']) : null;
        $unitsUsed = ($prevMeter !== null && $currMeter !== null && $currMeter >= $prevMeter)
            ? ($currMeter - $prevMeter)
            : (isset($input['consumption_units']) ? floatval($input['consumption_units']) : null);
        $billingPeriod = trim($input['billing_period'] ?? date('F Y'));
        $amount = floatval($input['amount'] ?? 0);
        $dueDate = trim($input['due_date'] ?? date('Y-m-d'));
        $status = trim($input['status'] ?? 'pending');
        $paymentDate = ($status === 'paid') ? trim($input['payment_date'] ?? date('Y-m-d')) : null;
        $paymentMethod = ($status === 'paid') ? trim($input['payment_method'] ?? 'Telebirr') : null;
        $referenceNo = trim($input['reference_no'] ?? '');
        $notes = trim($input['notes'] ?? '');

        if ($amount <= 0) {
            jsonError('A valid bill amount is required', 400);
        }

        $newId = generateUuid();
        $stmt = $db->prepare("INSERT INTO utilities 
            (id, property_id, utility_type, provider, meter_reading_prev, meter_reading_curr, consumption_units, billing_period, amount, due_date, status, payment_date, payment_method, reference_no, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $newId,
            $propertyId,
            $utilityType,
            $provider,
            $prevMeter,
            $currMeter,
            $unitsUsed,
            $billingPeriod,
            $amount,
            $dueDate,
            $status,
            $paymentDate,
            $paymentMethod,
            $referenceNo ?: null,
            $notes ?: null
        ]);

        logAudit($propertyId, 'utility.created', $user['name'], [
            'id' => $newId,
            'type' => $utilityType,
            'amount' => $amount
        ]);

        jsonResponse(['ok' => true, 'id' => $newId], 201);
    }

    // 4. GET /api/utilities -> List utilities
    if ($method === 'GET') {
        $propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $stmt = $db->prepare("SELECT * FROM utilities WHERE property_id = ? ORDER BY due_date DESC");
        $stmt->execute([$propertyId]);
        jsonResponse($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
} catch (Exception $e) {
    jsonError($e->getMessage(), 500);
}
