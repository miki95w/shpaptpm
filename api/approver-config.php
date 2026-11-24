<?php
/**
 * Solta Hotel Apartment · Operations
 * Executive Approver Configuration Handler: /api/approver-config
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    $propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
    $config = [
        'property_id' => $propertyId,
        'approver_name' => 'Solta Administrator',
        'approver_email' => 'admin@gmail.com',
        'mode' => 'required',
        'early_booking_approval' => true,
        'inventory_deficit_approval' => true,
        'payment_verification' => true,
        'notify_new_booking' => true,
        'notify_expired_booking' => true,
        'notify_stock_movement' => true,
        'notify_payment' => true
    ];
    try {
        $stmt = $db->prepare("SELECT * FROM approver_settings WHERE property_id = ? LIMIT 1");
        $stmt->execute([$propertyId]);
        $row = $stmt->fetch();
        if ($row) {
            $config = array_merge($config, $row);
        }
    } catch (Exception $e) {}

    jsonResponse($config);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $propertyId = $input['property_id'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
    $approverId = $input['approver_id'] ?? null;
    $approverName = trim($input['approver_name'] ?? 'Solta Administrator');
    $approverEmail = trim($input['approver_email'] ?? 'admin@gmail.com');
    $mode = in_array($input['mode'] ?? '', ['required', 'optional']) ? $input['mode'] : 'required';
    $earlyBooking = !empty($input['early_booking_approval']) ? 1 : 0;
    $inventoryDeficit = !empty($input['inventory_deficit_approval']) ? 1 : 0;
    $paymentVerif = !empty($input['payment_verification']) ? 1 : 0;
    $notifyNewBooking = !empty($input['notify_new_booking']) ? 1 : 0;
    $notifyExpiredBooking = !empty($input['notify_expired_booking']) ? 1 : 0;
    $notifyStockMovement = !empty($input['notify_stock_movement']) ? 1 : 0;
    $notifyPayment = !empty($input['notify_payment']) ? 1 : 0;

    try {
        $stmt = $db->prepare("
            INSERT INTO approver_settings (
                property_id, approver_id, approver_name, approver_email, mode,
                early_booking_approval, inventory_deficit_approval, payment_verification,
                notify_new_booking, notify_expired_booking, notify_stock_movement, notify_payment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                approver_id = VALUES(approver_id),
                approver_name = VALUES(approver_name),
                approver_email = VALUES(approver_email),
                mode = VALUES(mode),
                early_booking_approval = VALUES(early_booking_approval),
                inventory_deficit_approval = VALUES(inventory_deficit_approval),
                payment_verification = VALUES(payment_verification),
                notify_new_booking = VALUES(notify_new_booking),
                notify_expired_booking = VALUES(notify_expired_booking),
                notify_stock_movement = VALUES(notify_stock_movement),
                notify_payment = VALUES(notify_payment)
        ");
        $stmt->execute([
            $propertyId, $approverId, $approverName, $approverEmail, $mode,
            $earlyBooking, $inventoryDeficit, $paymentVerif,
            $notifyNewBooking, $notifyExpiredBooking, $notifyStockMovement, $notifyPayment
        ]);

        logAudit($propertyId, 'approver.config_updated', $user['name'], [
            'mode' => $mode,
            'approver' => $approverName
        ]);

        jsonResponse(['ok' => true, 'message' => 'Approver settings saved successfully']);
    } catch (Exception $e) {
        jsonError('Failed to save approver settings: ' . $e->getMessage(), 500);
    }
}
