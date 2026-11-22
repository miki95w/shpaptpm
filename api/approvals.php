<?php
/**
 * Solta Hotel Apartment · Operations
 * Executive Approvals & Notifications Handler: /api/approvals
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();

if ($method === 'GET') {
    // List notifications
    $propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
    try {
        $stmt = $db->prepare("SELECT * FROM system_notifications WHERE property_id = ? ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$propertyId]);
        $rows = $stmt->fetchAll();
        jsonResponse($rows);
    } catch (Exception $e) {
        jsonResponse([]);
    }
}

if ($method === 'POST') {
    $action = $parts[0] ?? '';
    $input = getJsonInput();

    if ($action === 'action') {
        $notificationId = $input['notificationId'] ?? '';
        $approvalAction = in_array($input['action'] ?? '', ['approve', 'reject']) ? $input['action'] : 'approve';
        $notes = trim($input['notes'] ?? '');

        if (empty($notificationId)) {
            jsonError('Notification ID is required', 400);
        }

        try {
            $stmt = $db->prepare("SELECT * FROM system_notifications WHERE id = ?");
            $stmt->execute([$notificationId]);
            $notif = $stmt->fetch();

            if (!$notif) {
                jsonError('Notification not found', 404);
            }

            $newStatus = $approvalAction === 'approve' ? 'approved' : 'rejected';
            $upd = $db->prepare("UPDATE system_notifications SET status = ? WHERE id = ?");
            $upd->execute([$newStatus, $notificationId]);

            // If early booking notification, update reservation status
            if ($notif['type'] === 'early_booking' && !empty($notif['entity_id'])) {
                $resStatus = $approvalAction === 'approve' ? 'confirmed' : 'cancelled';
                $db->prepare("UPDATE reservations SET status = ? WHERE id = ?")->execute([$resStatus, $notif['entity_id']]);
                logAudit($notif['property_id'], "reservation.{$newStatus}", $user['name'], ['reservation_id' => $notif['entity_id']]);
            }

            logAudit($notif['property_id'], "approval.{$approvalAction}", $user['name'], [
                'notification_id' => $notificationId,
                'title' => $notif['title'],
                'notes' => $notes
            ]);

            jsonResponse(['ok' => true, 'status' => $newStatus]);
        } catch (Exception $e) {
            jsonError('Failed to process approval action: ' . $e->getMessage(), 500);
        }
    }

    jsonError('Invalid action', 400);
}
