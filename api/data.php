<?php
/**
 * Solta Hotel Apartment · Operations
 * Main Property Operational Data Endpoint: /api/data?propertyId=...
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';

try {
    $db = getDB();

    // Handle DELETE /api/employees/:id, /api/expenses/:id, /api/utilities/:id (Admin only)
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        requireAdmin($db, $user);
        $reqPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        $reqPath = preg_replace('#^/api/?#', '', $reqPath);
        $seg = array_values(array_filter(explode('/', trim($reqPath, '/'))));
        $resType = strtolower($seg[0] ?? '');
        $recId = $seg[1] ?? '';

        if (!empty($recId) && in_array($resType, ['employees', 'expenses', 'utilities'], true)) {
            $tableMap = [
                'employees' => 'employees',
                'expenses' => 'expenses',
                'utilities' => 'utilities'
            ];
            $tbl = $tableMap[$resType];
            $db->prepare("DELETE FROM {$tbl} WHERE id = ?")->execute([$recId]);
            logAudit($propertyId, "{$resType}.deleted", $user['name'], ['id' => $recId]);
            jsonResponse(['ok' => true]);
        }
        jsonError('Unsupported delete target', 400);
    }

    // Handle POST /api/data actions (e.g. create_unit)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = getJsonInput();
        $action = $input['action'] ?? '';

        if ($action === 'create_unit') {
            $code = trim($input['code'] ?? '');
            $category = trim($input['category'] ?? 'One bedroom');
            $capacity = intval($input['capacity'] ?? 2);
            $nightlyRate = floatval($input['nightly_rate'] ?? 3500);
            $propId = $input['propertyId'] ?? $propertyId;

            if (empty($code)) {
                jsonError('Unit code is required', 400);
            }

            $stmtChk = $db->prepare("SELECT id FROM units WHERE property_id = ? AND code = ?");
            $stmtChk->execute([$propId, $code]);
            if ($stmtChk->fetch()) {
                jsonError("Apartment code '{$code}' already exists", 400);
            }

            $unitId = generateUuid();
            $stmtIns = $db->prepare("INSERT INTO units (id, property_id, code, category, capacity, nightly_rate, readiness, occupied, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ready', 0, NOW())");
            $stmtIns->execute([$unitId, $propId, $code, $category, $capacity, $nightlyRate]);

            logAudit($propId, 'unit.created', $user['name'], ['code' => $code, 'category' => $category, 'rate' => $nightlyRate]);
            jsonResponse(['ok' => true, 'id' => $unitId, 'code' => $code], 201);
        }
    }

    // 1. Units / Apartments
    $stmtUnits = $db->prepare("SELECT * FROM units WHERE property_id = ? ORDER BY code ASC");
    $stmtUnits->execute([$propertyId]);
    $units = $stmtUnits->fetchAll();
    foreach ($units as &$u) {
        $u['occupied'] = (bool)$u['occupied'];
        $u['capacity'] = (int)$u['capacity'];
    }

    // 2. Reservations
    $stmtRes = $db->prepare("SELECT r.*, u.code as unit_code 
                             FROM reservations r 
                             LEFT JOIN units u ON u.id = r.unit_id 
                             WHERE r.property_id = ? 
                             ORDER BY r.arrival DESC");
    $stmtRes->execute([$propertyId]);
    $reservations = $stmtRes->fetchAll();

    // 2b. Reservation Installments
    $installmentsByRes = [];
    try {
        $stmtInst = $db->prepare("SELECT * FROM reservation_installments WHERE property_id = ? ORDER BY due_date ASC, installment_number ASC");
        $stmtInst->execute([$propertyId]);
        $allInst = $stmtInst->fetchAll();
        $today = date('Y-m-d');
        foreach ($allInst as &$inst) {
            $inst['amount'] = floatval($inst['amount']);
            $inst['paid_amount'] = floatval($inst['paid_amount']);
            if ($inst['status'] === 'pending' && $inst['due_date'] < $today) {
                $inst['status'] = 'overdue';
            }
            $installmentsByRes[$inst['reservation_id']][] = $inst;
        }
    } catch (Exception $e) {}

    foreach ($reservations as &$r) {
        $r['installments'] = $installmentsByRes[$r['id']] ?? [];
    }

    // 3. Stay Accounts & Batch Entries (Optimized Single Query - No N+1)
    $stmtAcc = $db->prepare("SELECT * FROM stay_accounts WHERE property_id = ?");
    $stmtAcc->execute([$propertyId]);
    $accounts = $stmtAcc->fetchAll();
    
    // Batch query all stay account entries for this property in 1 query
    $stmtEntries = $db->prepare("SELECT e.* 
                                 FROM stay_account_entries e 
                                 JOIN stay_accounts a ON a.id = e.account_id 
                                 WHERE a.property_id = ? 
                                 ORDER BY e.created_at ASC");
    $stmtEntries->execute([$propertyId]);
    $allEntries = $stmtEntries->fetchAll();
    
    $entriesByAccount = [];
    foreach ($allEntries as $entry) {
        $accId = $entry['account_id'];
        if (!isset($entriesByAccount[$accId])) {
            $entriesByAccount[$accId] = [];
        }
        $entriesByAccount[$accId][] = $entry;
    }

    foreach ($accounts as &$acc) {
        $acc['entries'] = $entriesByAccount[$acc['id']] ?? [];
    }

    // 4. Inventory Items
    $stmtItems = $db->prepare("SELECT * FROM inventory_items WHERE property_id = ? ORDER BY name ASC");
    $stmtItems->execute([$propertyId]);
    $items = $stmtItems->fetchAll();

    // 5. Inventory Locations
    $stmtLoc = $db->prepare("SELECT * FROM inventory_locations WHERE property_id = ? ORDER BY name ASC");
    $stmtLoc->execute([$propertyId]);
    $locations = $stmtLoc->fetchAll();

    // 6. Inventory Stock Balances
    $stmtStock = $db->prepare("SELECT s.*, i.name as item_name, l.name as location_name 
                               FROM inventory_stock s 
                               JOIN inventory_items i ON i.id = s.item_id 
                               JOIN inventory_locations l ON l.id = s.location_id 
                               WHERE s.property_id = ?");
    $stmtStock->execute([$propertyId]);
    $stock = $stmtStock->fetchAll();

    // 7. Inventory Movements
    $stmtMove = $db->prepare("SELECT m.*, i.name as item_name 
                              FROM inventory_movements m 
                              JOIN inventory_items i ON i.id = m.item_id 
                              WHERE m.property_id = ? 
                              ORDER BY m.created_at DESC LIMIT 50");
    $stmtMove->execute([$propertyId]);
    $movements = $stmtMove->fetchAll();

    // 8. Housekeeping Tasks
    $stmtTasks = $db->prepare("SELECT t.*, u.code as unit_code, staff.name as assignee 
                               FROM housekeeping_tasks t 
                               JOIN units u ON u.id = t.unit_id 
                               LEFT JOIN users staff ON staff.id = t.assignee_id 
                               WHERE t.property_id = ? 
                               ORDER BY t.created_at DESC");
    $stmtTasks->execute([$propertyId]);
    $tasks = $stmtTasks->fetchAll();

    // 9. Staff Users
    $stmtStaff = $db->prepare("SELECT u.id, u.name, u.email, r.name as role, u.role_id 
                               FROM users u 
                               LEFT JOIN roles r ON r.id = u.role_id 
                               WHERE u.property_id = ? OR u.property_id IS NULL");
    $stmtStaff->execute([$propertyId]);
    $staff = $stmtStaff->fetchAll();

    // 10. Roles
    $stmtRoles = $db->prepare("SELECT * FROM roles WHERE property_id = ? OR property_id IS NULL ORDER BY name ASC");
    $stmtRoles->execute([$propertyId]);
    $roles = $stmtRoles->fetchAll();

    // 11. Permission Catalog
    $stmtCat = $db->query("SELECT * FROM permission_catalog ORDER BY category, label ASC");
    $permissionCatalog = $stmtCat->fetchAll();

    // 12. Role Permissions
    $stmtRolePerms = $db->query("SELECT role_id, permission_code, enabled FROM role_permissions");
    $rolePermissions = $stmtRolePerms->fetchAll();
    foreach ($rolePermissions as &$rp) {
        $rp['enabled'] = (bool)$rp['enabled'];
    }

    // 13. Audit Log (Latest 100 events)
    $stmtAudit = $db->prepare("SELECT * FROM audit_log WHERE property_id = ? ORDER BY created_at DESC LIMIT 100");
    $stmtAudit->execute([$propertyId]);
    $audit = $stmtAudit->fetchAll();
    foreach ($audit as &$a) {
        $a['details'] = json_decode($a['details'] ?? '{}', true) ?: [];
    }

    // 14. Payment Methods
    $stmtPm = $db->prepare("SELECT * FROM payment_methods WHERE property_id = ? ORDER BY name ASC");
    $stmtPm->execute([$propertyId]);
    $paymentMethods = $stmtPm->fetchAll();
    foreach ($paymentMethods as &$pm) {
        $pm['active'] = (bool)$pm['active'];
    }

    // 15. Employees
    $stmtEmp = $db->prepare("SELECT * FROM employees WHERE property_id = ? ORDER BY full_name ASC");
    $stmtEmp->execute([$propertyId]);
    $employees = $stmtEmp->fetchAll();

    // 16. Operating Expenses
    $stmtExp = $db->prepare("SELECT * FROM expenses WHERE property_id = ? ORDER BY expense_date DESC LIMIT 100");
    $stmtExp->execute([$propertyId]);
    $expenses = $stmtExp->fetchAll();

    // 17. Utilities
    $stmtUtil = $db->prepare("SELECT * FROM utilities WHERE property_id = ? ORDER BY due_date DESC");
    $stmtUtil->execute([$propertyId]);
    $utilities = $stmtUtil->fetchAll();

    // 17b. Maintenance Records
    $maintenanceRecords = [];
    try {
        $stmtMaint = $db->prepare("SELECT * FROM maintenance_records WHERE property_id = ? ORDER BY start_date DESC");
        $stmtMaint->execute([$propertyId]);
        $maintenanceRecords = $stmtMaint->fetchAll();
    } catch (Exception $e) {
        $maintenanceRecords = [];
    }

    // 18. Summary Metrics
    $totalUnits = count($units);
    $occupiedUnits = count(array_filter($units, fn($u) => $u['occupied']));
    $cleaningUnits = count(array_filter($units, fn($u) => $u['readiness'] === 'dirty'));
    $upcomingRes = count(array_filter($reservations, fn($r) => $r['status'] === 'confirmed'));

    // Current user's enabled permissions
    $userPermStmt = $db->prepare("SELECT permission_code FROM role_permissions WHERE role_id = ? AND enabled = 1");
    $userPermStmt->execute([$user['role_id']]);
    $userPermissions = $userPermStmt->fetchAll(PDO::FETCH_COLUMN);

    // 16. Approver Configuration & Notifications
    $approverConfig = [
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
        $appStmt = $db->prepare("SELECT * FROM approver_settings WHERE property_id = ? LIMIT 1");
        $appStmt->execute([$propertyId]);
        $row = $appStmt->fetch();
        if ($row) {
            $approverConfig = array_merge($approverConfig, $row);
        }
    } catch (Exception $e) {}

    $notifications = [];
    try {
        $notifStmt = $db->prepare("SELECT * FROM system_notifications WHERE property_id = ? ORDER BY created_at DESC LIMIT 50");
        $notifStmt->execute([$propertyId]);
        $notifications = $notifStmt->fetchAll();
    } catch (Exception $e) {}

    jsonResponse([
        'permissions' => $userPermissions,
        'units' => $units,
        'reservations' => $reservations,
        'accounts' => $accounts,
        'items' => $items,
        'locations' => $locations,
        'stock' => $stock,
        'movements' => $movements,
        'tasks' => $tasks,
        'staff' => $staff,
        'roles' => $roles,
        'permissionCatalog' => $permissionCatalog,
        'rolePermissions' => $rolePermissions,
        'audit' => $audit,
        'paymentMethods' => $paymentMethods,
        'employees' => $employees,
        'expenses' => $expenses,
        'utilities' => $utilities,
        'maintenanceRecords' => $maintenanceRecords,
        'approverConfig' => $approverConfig,
        'notifications' => $notifications,
        'summary' => [
            'apartments' => $totalUnits,
            'occupied' => $occupiedUnits,
            'cleaning' => $cleaningUnits,
            'upcoming' => $upcomingRes
        ]
    ]);

} catch (Exception $e) {
    jsonError('Failed to load operational data: ' . $e->getMessage(), 500);
}
