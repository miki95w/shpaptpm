<?php
/**
 * Solta Hotel Apartment · Operations
 * Apartment Units & Maintenance Modes Handler: /api/units
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $action = $parts[0] ?? '';

    // Ensure maintenance_records table exists
    $db->exec("CREATE TABLE IF NOT EXISTS `maintenance_records` (
      `id` VARCHAR(36) NOT NULL PRIMARY KEY,
      `property_id` VARCHAR(36) NOT NULL,
      `unit_id` VARCHAR(36) NOT NULL,
      `unit_code` VARCHAR(30) NOT NULL,
      `issue` VARCHAR(255) NOT NULL,
      `technician` VARCHAR(100) NULL,
      `duration_est` VARCHAR(50) NULL,
      `actual_duration` VARCHAR(50) NULL,
      `cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      `status` ENUM('in_progress', 'resolved', 'scheduled') NOT NULL DEFAULT 'in_progress',
      `start_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `resolved_date` TIMESTAMP NULL,
      `notes` TEXT NULL,
      INDEX (`property_id`),
      INDEX (`unit_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Defensive table updates for readiness and maintenance support
    try {
        $db->exec("ALTER TABLE units MODIFY COLUMN readiness VARCHAR(50) NOT NULL DEFAULT 'ready'");
    } catch (Exception $e) {}
    try {
        $db->exec("ALTER TABLE maintenance_records ADD COLUMN notes TEXT NULL");
    } catch (Exception $e) {}

    // 0. POST /api/units or POST /api/units/create -> Add new apartment unit
    if (($action === '' || $action === 'create' || ($input['action'] ?? '') === 'create_unit') && $method === 'POST') {
        $code = trim($input['code'] ?? '');
        $category = trim($input['category'] ?? 'One bedroom');
        $capacity = intval($input['capacity'] ?? 2);
        $nightlyRate = floatval($input['nightly_rate'] ?? 3500);
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';

        if (empty($code)) {
            jsonError('Unit code is required', 400);
        }

        // Check if code already exists
        $stmtChk = $db->prepare("SELECT id FROM units WHERE property_id = ? AND code = ?");
        $stmtChk->execute([$propertyId, $code]);
        if ($stmtChk->fetch()) {
            jsonError("Apartment code '{$code}' already exists", 400);
        }

        $unitId = generateUuid();
        $stmtIns = $db->prepare("INSERT INTO units (id, property_id, code, category, capacity, nightly_rate, readiness, occupied, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ready', 0, NOW())");
        $stmtIns->execute([$unitId, $propertyId, $code, $category, $capacity, $nightlyRate]);

        logAudit($propertyId, 'unit.created', $user['name'], ['code' => $code, 'category' => $category, 'rate' => $nightlyRate]);
        jsonResponse(['ok' => true, 'id' => $unitId, 'code' => $code], 201);
    }

    // 1. POST /api/units/mode -> Set apartment operational mode
    if ($action === 'mode' && $method === 'POST') {
        $unitId = $input['unitId'] ?? '';
        $mode = $input['mode'] ?? 'ready'; // 'ready', 'occupied', 'booked', 'maintenance'
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';

        if (empty($unitId)) {
            jsonError('Unit ID is required', 400);
        }

        $stmtU = $db->prepare("SELECT id, code, readiness, occupied FROM units WHERE id = ?");
        $stmtU->execute([$unitId]);
        $unit = $stmtU->fetch();
        if (!$unit) {
            jsonError('Apartment unit not found', 404);
        }

        $prevMode = $unit['occupied'] ? 'occupied' : $unit['readiness'];

        if ($mode === 'ready') {
            $db->prepare("UPDATE units SET readiness = 'ready', occupied = 0 WHERE id = ?")->execute([$unitId]);
        } else if ($mode === 'occupied') {
            $db->prepare("UPDATE units SET occupied = 1, readiness = 'ready' WHERE id = ?")->execute([$unitId]);
        } else if ($mode === 'booked') {
            $db->prepare("UPDATE units SET occupied = 0, readiness = 'ready' WHERE id = ?")->execute([$unitId]);
        } else if ($mode === 'maintenance') {
            $db->prepare("UPDATE units SET readiness = 'maintenance', occupied = 0 WHERE id = ?")->execute([$unitId]);

            // Create maintenance incident record
            $issue = trim($input['reason'] ?? 'Routine inspection / repairs');
            $technician = trim($input['technician'] ?? 'In-House Maintenance');
            $durationEst = trim($input['durationEst'] ?? '1 day');
            $cost = floatval($input['cost'] ?? 0);
            $notes = trim($input['notes'] ?? '');

            $recId = generateUuid();
            $db->prepare("INSERT INTO maintenance_records (id, property_id, unit_id, unit_code, issue, technician, duration_est, cost, status, start_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', NOW(), ?)")
               ->execute([$recId, $propertyId, $unitId, $unit['code'], $issue, $technician, $durationEst, $cost, $notes]);
        }

        logAudit($propertyId, 'unit.mode_changed', $user['name'], ['unit' => $unit['code'], 'from' => $prevMode, 'to' => $mode]);
        jsonResponse(['ok' => true, 'mode' => $mode]);
    }

    // 2. POST /api/units/resolve-maintenance
    if ($action === 'resolve-maintenance' && $method === 'POST') {
        $unitId = $input['unitId'] ?? '';
        $recordId = $input['recordId'] ?? '';
        $actualDuration = trim($input['actualDuration'] ?? '');
        $cost = isset($input['cost']) ? floatval($input['cost']) : null;

        if ($recordId) {
            $sql = "UPDATE maintenance_records SET status = 'resolved', resolved_date = NOW()";
            $params = [];
            if ($actualDuration) {
                $sql .= ", actual_duration = ?";
                $params[] = $actualDuration;
            }
            if ($cost !== null) {
                $sql .= ", cost = ?";
                $params[] = $cost;
            }
            $sql .= " WHERE id = ?";
            $params[] = $recordId;
            $db->prepare($sql)->execute($params);
        }

        if ($unitId) {
            $db->prepare("UPDATE units SET readiness = 'ready', occupied = 0 WHERE id = ?")->execute([$unitId]);
            $db->prepare("UPDATE maintenance_records SET status = 'resolved', resolved_date = NOW() WHERE unit_id = ? AND status = 'in_progress'")->execute([$unitId]);
        }

        jsonResponse(['ok' => true]);
    }

    // 3. POST /api/units/update-specs -> Update apartment specifications, amenities, and furnishings
    if ($action === 'update-specs' && $method === 'POST') {
        $unitId = $input['unitId'] ?? '';
        if (empty($unitId)) {
            jsonError('Unit ID is required', 400);
        }

        // Ensure specs column exists in units table
        try {
            $db->exec("ALTER TABLE units ADD COLUMN specs JSON NULL");
        } catch (Exception $e) {}

        $code = trim($input['code'] ?? '');
        $category = trim($input['category'] ?? '');
        $capacity = isset($input['capacity']) ? intval($input['capacity']) : null;
        $nightlyRate = isset($input['nightly_rate']) ? floatval($input['nightly_rate']) : null;
        $specs = $input['specs'] ?? null;
        $specsJson = $specs !== null ? json_encode($specs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;

        $updates = [];
        $params = [];

        if ($code !== '') {
            $updates[] = "code = ?";
            $params[] = $code;
        }
        if ($category !== '') {
            $updates[] = "category = ?";
            $params[] = $category;
        }
        if ($capacity !== null) {
            $updates[] = "capacity = ?";
            $params[] = $capacity;
        }
        if ($nightlyRate !== null) {
            $updates[] = "nightly_rate = ?";
            $params[] = $nightlyRate;
        }
        if ($specsJson !== null) {
            $updates[] = "specs = ?";
            $params[] = $specsJson;
        }

        if (!empty($updates)) {
            $params[] = $unitId;
            $sql = "UPDATE units SET " . implode(", ", $updates) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        logAudit($propertyId, 'unit.specs_updated', $user['name'], [
            'unit_id' => $unitId,
            'code' => $code,
            'specs_updated' => true
        ]);

        $stmtUpdated = $db->prepare("SELECT * FROM units WHERE id = ?");
        $stmtUpdated->execute([$unitId]);
        $updatedUnit = $stmtUpdated->fetch();

        jsonResponse(['ok' => true, 'unit' => $updatedUnit]);
    }

    // 5. DELETE /api/units/:id -> Delete apartment (Admin only)
    if ($method === 'DELETE' && !empty($parts[0])) {
        requireAdmin($db, $user);
        $unitId = $parts[0];

        $stmt = $db->prepare("SELECT * FROM units WHERE id = ?");
        $stmt->execute([$unitId]);
        $unit = $stmt->fetch();
        if (!$unit) {
            jsonError('Apartment not found', 404);
        }
        if (!empty($unit['occupied'])) {
            jsonError('Cannot delete an occupied apartment. Check out the guest first.', 400);
        }

        $db->prepare("DELETE FROM maintenance_records WHERE unit_id = ?")->execute([$unitId]);
        $db->prepare("DELETE FROM housekeeping_tasks WHERE unit_id = ?")->execute([$unitId]);
        $db->prepare("DELETE FROM units WHERE id = ?")->execute([$unitId]);

        logAudit($unit['property_id'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'unit.deleted', $user['name'], ['unit_id' => $unitId, 'code' => $unit['code']]);
        jsonResponse(['ok' => true]);
    }

    jsonError('Unsupported units action', 400);

} catch (Exception $e) {
    jsonError('Units action error: ' . $e->getMessage(), 500);
}
