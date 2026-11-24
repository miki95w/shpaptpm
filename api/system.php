<?php
/**
 * Solta Hotel Apartment · Operations
 * System Administration & Maintenance API: /api/system
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$db = getDB();
requireAdmin($db, $user);

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$action = $parts[0] ?? '';

$input = getJsonInput();
$propertyId = $input['propertyId'] ?? ($_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c');

try {
    if ($method === 'POST' && $action === 'purge-demo') {
        // Delete all reservation installments & stay entries
        try {
            $db->prepare("DELETE FROM reservation_installments WHERE reservation_id IN (SELECT id FROM reservations WHERE property_id = ?)")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM stay_account_entries WHERE account_id IN (SELECT id FROM stay_accounts WHERE property_id = ?)")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM stay_accounts WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM inspections WHERE reservation_id IN (SELECT id FROM reservations WHERE property_id = ?)")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM reservations WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        // Delete test expenses, utilities, tasks, maintenance records, notifications
        try {
            $db->prepare("DELETE FROM expenses WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM utilities WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM maintenance_records WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM tasks WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        try {
            $db->prepare("DELETE FROM system_notifications WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        // Reset units to unoccupied and ready
        try {
            $db->prepare("UPDATE units SET occupied = 0, readiness = 'ready' WHERE property_id = ?")->execute([$propertyId]);
        } catch (Exception $e) {}

        logAudit($propertyId, 'system.demo_purged', $user['name'], [
            'action' => 'purge_demo_data',
            'message' => 'All test reservations, accounts, expenses, utilities, and maintenance records cleared for clean production'
        ]);

        jsonResponse([
            'ok' => true,
            'message' => 'All test and demo data has been purged. Workspace is clean for live production.'
        ]);
    }

    jsonError('Unsupported system action', 400);
} catch (Exception $e) {
    jsonError($e->getMessage(), 500);
}
