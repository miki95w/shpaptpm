<?php
/**
 * Solta Hotel Apartment · Operations
 * Inventory, Stock & Cleaner Custody API: /api/inventory
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

    // 1. POST /api/inventory/receive -> Receive stock into central store
    if ($action === 'receive' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $itemId = $input['itemId'] ?? '';
        $qty = floatval($input['quantity'] ?? 0);
        $notes = trim($input['notes'] ?? 'Stock delivery received');

        if (empty($itemId) || $qty <= 0) {
            jsonError('Item and valid quantity (> 0) required', 400);
        }

        // Find store location
        $locStmt = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND kind = 'store' LIMIT 1");
        $locStmt->execute([$propertyId]);
        $store = $locStmt->fetch();
        if (!$store) {
            jsonError('Central store location not found', 404);
        }

        // Upsert stock
        $stmtStock = $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) 
                                   VALUES (?, ?, ?, ?, ?) 
                                   ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)");
        $stmtStock->execute([generateUuid(), $propertyId, $itemId, $store['id'], $qty]);

        // Log movement
        $db->prepare("INSERT INTO inventory_movements (id, property_id, item_id, from_location_id, to_location_id, quantity, actor, notes, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, NOW())")
           ->execute([generateUuid(), $propertyId, $itemId, $store['id'], $qty, $user['name'], $notes]);

        logAudit($propertyId, 'inventory.received', $user['name'], ['itemId' => $itemId, 'quantity' => $qty]);
        jsonResponse(['ok' => true]);
    }

    // 2. POST /api/inventory/issue-cleaner -> Issue from store to cleaner custody
    if ($action === 'issue-cleaner' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $itemId = $input['itemId'] ?? '';
        $cleanerId = $input['cleanerId'] ?? '';
        $qty = floatval($input['quantity'] ?? 0);

        if (empty($itemId) || empty($cleanerId) || $qty <= 0) {
            jsonError('Item, cleaner, and quantity required', 400);
        }

        // Find store
        $store = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND kind = 'store' LIMIT 1");
        $store->execute([$propertyId]);
        $storeLoc = $store->fetch();

        // Check store stock (Negative stock allowed with full deficit audit logging)
        $chk = $db->prepare("SELECT quantity FROM inventory_stock WHERE item_id = ? AND location_id = ?");
        $chk->execute([$itemId, $storeLoc['id']]);
        $avail = floatval($chk->fetchColumn() ?: 0);
        $isDeficit = ($avail < $qty);
        $deficitNote = $isDeficit ? " [DEFICIT: Store stock reduced to " . ($avail - $qty) . "]" : "";
        $notes = trim(($input['notes'] ?? 'Issued to cleaner cart') . $deficitNote);

        // Find or create cleaner custody location
        $cloc = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND user_id = ? LIMIT 1");
        $cloc->execute([$propertyId, $cleanerId]);
        $cleanerLocId = $cloc->fetchColumn();
        if (!$cleanerLocId) {
            $cleanerLocId = generateUuid();
            $db->prepare("INSERT INTO inventory_locations (id, property_id, name, kind, user_id) VALUES (?, ?, 'Cleaner Custody', 'cleaner_custody', ?)")
               ->execute([$cleanerLocId, $propertyId, $cleanerId]);
        }

        // Deduct from store (permits negative balance for full operational tracking)
        $updStore = $db->prepare("UPDATE inventory_stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?");
        $updStore->execute([$qty, $itemId, $storeLoc['id']]);
        if ($updStore->rowCount() === 0) {
            $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?)")
               ->execute([generateUuid(), $propertyId, $itemId, $storeLoc['id'], -$qty]);
        }

        // Add to cleaner custody
        $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)")
           ->execute([generateUuid(), $propertyId, $itemId, $cleanerLocId, $qty]);

        // Record movement with full deficit audit
        $db->prepare("INSERT INTO inventory_movements (id, property_id, item_id, from_location_id, to_location_id, quantity, actor, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
           ->execute([generateUuid(), $propertyId, $itemId, $storeLoc['id'], $cleanerLocId, $qty, $user['name'], $notes]);

        logAudit($propertyId, $isDeficit ? 'inventory.deficit_issued' : 'inventory.issued_cleaner', $user['name'], [
            'cleanerId' => $cleanerId,
            'qty' => $qty,
            'storeBalanceAfter' => ($avail - $qty),
            'negativeStock' => $isDeficit
        ]);
        jsonResponse(['ok' => true]);
    }

    // 2b. POST /api/inventory/supply-apartment -> Supply items from store/cleaner to apartment
    if ($action === 'supply-apartment' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $itemId = $input['itemId'] ?? '';
        $unitId = $input['unitId'] ?? '';
        $qty = floatval($input['quantity'] ?? 0);
        $sourceKind = $input['sourceKind'] ?? 'store'; // 'store' or 'cleaner'
        $notes = trim($input['notes'] ?? 'Supplied to apartment');

        if (empty($itemId) || empty($unitId) || $qty <= 0) {
            jsonError('Item, unit, and valid quantity required', 400);
        }

        // Get unit code
        $uStmt = $db->prepare("SELECT code FROM units WHERE id = ?");
        $uStmt->execute([$unitId]);
        $unitCode = $uStmt->fetchColumn() ?: 'Unit';

        // Find or create unit location
        $uloc = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND unit_id = ? LIMIT 1");
        $uloc->execute([$propertyId, $unitId]);
        $unitLocId = $uloc->fetchColumn();
        if (!$unitLocId) {
            $unitLocId = generateUuid();
            $db->prepare("INSERT INTO inventory_locations (id, property_id, name, kind, unit_id) VALUES (?, ?, ?, 'unit', ?)")
               ->execute([$unitLocId, $propertyId, "Apartment {$unitCode}", $unitId]);
        }

        // Determine source location
        if ($sourceKind === 'cleaner' && !empty($input['cleanerId'])) {
            $srcLocStmt = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND user_id = ? LIMIT 1");
            $srcLocStmt->execute([$propertyId, $input['cleanerId']]);
        } else {
            $srcLocStmt = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND kind = 'store' LIMIT 1");
            $srcLocStmt->execute([$propertyId]);
        }
        $fromLocId = $srcLocStmt->fetchColumn();
        if (!$fromLocId) {
            jsonError('Source location not found', 404);
        }

        // Check source stock (Negative stock allowed with full deficit audit logging)
        $chk = $db->prepare("SELECT quantity FROM inventory_stock WHERE item_id = ? AND location_id = ?");
        $chk->execute([$itemId, $fromLocId]);
        $avail = floatval($chk->fetchColumn() ?: 0);
        $isDeficit = ($avail < $qty);
        $deficitNote = $isDeficit ? " [DEFICIT: Source balance reduced to " . ($avail - $qty) . "]" : "";
        $notes = trim(($notes ?: "Supplied to {$unitCode}") . $deficitNote);

        // Deduct from source (permits negative balance for full operational tracking)
        $updSrc = $db->prepare("UPDATE inventory_stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?");
        $updSrc->execute([$qty, $itemId, $fromLocId]);
        if ($updSrc->rowCount() === 0) {
            $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?)")
               ->execute([generateUuid(), $propertyId, $itemId, $fromLocId, -$qty]);
        }

        // Add to unit location
        $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)")
           ->execute([generateUuid(), $propertyId, $itemId, $unitLocId, $qty]);

        // Record movement
        $db->prepare("INSERT INTO inventory_movements (id, property_id, item_id, from_location_id, to_location_id, quantity, actor, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
           ->execute([generateUuid(), $propertyId, $itemId, $fromLocId, $unitLocId, $qty, $user['name'], $notes]);

        logAudit($propertyId, $isDeficit ? 'inventory.deficit_supplied' : 'inventory.supplied_apartment', $user['name'], [
            'unit' => $unitCode,
            'qty' => $qty,
            'sourceBalanceAfter' => ($avail - $qty),
            'negativeStock' => $isDeficit
        ]);
        jsonResponse(['ok' => true]);
    }

    // 2c. POST /api/inventory/return-store -> Return stock to central store
    if ($action === 'return-store' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $itemId = $input['itemId'] ?? '';
        $fromLocId = $input['fromLocationId'] ?? '';
        $qty = floatval($input['quantity'] ?? 0);
        $notes = trim($input['notes'] ?? 'Returned to central store');

        if (empty($itemId) || empty($fromLocId) || $qty <= 0) {
            jsonError('Item, fromLocationId, and quantity required', 400);
        }

        $storeStmt = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND kind = 'store' LIMIT 1");
        $storeStmt->execute([$propertyId]);
        $storeId = $storeStmt->fetchColumn();

        $chk = $db->prepare("SELECT quantity FROM inventory_stock WHERE item_id = ? AND location_id = ?");
        $chk->execute([$itemId, $fromLocId]);
        $avail = floatval($chk->fetchColumn() ?: 0);
        if ($avail < $qty) {
            jsonError("Insufficient stock at source location. Available: {$avail}", 400);
        }

        $db->prepare("UPDATE inventory_stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?")
           ->execute([$qty, $itemId, $fromLocId]);

        $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)")
           ->execute([generateUuid(), $propertyId, $itemId, $storeId, $qty]);

        $db->prepare("INSERT INTO inventory_movements (id, property_id, item_id, from_location_id, to_location_id, quantity, actor, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
           ->execute([generateUuid(), $propertyId, $itemId, $fromLocId, $storeId, $qty, $user['name'], $notes]);

        logAudit($propertyId, 'inventory.returned_store', $user['name'], ['qty' => $qty]);
        jsonResponse(['ok' => true]);
    }

    // 2d. POST /api/inventory/place-durable -> Place durable asset into apartment
    if ($action === 'place-durable' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $itemId = $input['itemId'] ?? '';
        $unitId = $input['unitId'] ?? '';
        $qty = floatval($input['quantity'] ?? 1);
        $serial = trim($input['serialNumber'] ?? '');
        $notes = trim($input['notes'] ?? 'Placed durable asset');

        if (empty($itemId) || empty($unitId) || $qty <= 0) {
            jsonError('Item, unit, and valid quantity required', 400);
        }

        $uStmt = $db->prepare("SELECT code FROM units WHERE id = ?");
        $uStmt->execute([$unitId]);
        $unitCode = $uStmt->fetchColumn() ?: 'Unit';

        $storeStmt = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND kind = 'store' LIMIT 1");
        $storeStmt->execute([$propertyId]);
        $storeId = $storeStmt->fetchColumn();

        $uloc = $db->prepare("SELECT id FROM inventory_locations WHERE property_id = ? AND unit_id = ? LIMIT 1");
        $uloc->execute([$propertyId, $unitId]);
        $unitLocId = $uloc->fetchColumn();
        if (!$unitLocId) {
            $unitLocId = generateUuid();
            $db->prepare("INSERT INTO inventory_locations (id, property_id, name, kind, unit_id) VALUES (?, ?, ?, 'unit', ?)")
               ->execute([$unitLocId, $propertyId, "Apartment {$unitCode}", $unitId]);
        }

        $chk = $db->prepare("SELECT quantity FROM inventory_stock WHERE item_id = ? AND location_id = ?");
        $chk->execute([$itemId, $storeId]);
        $avail = floatval($chk->fetchColumn() ?: 0);
        if ($avail < $qty) {
            jsonError("Insufficient store inventory. Available: {$avail}", 400);
        }

        $db->prepare("UPDATE inventory_stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?")
           ->execute([$qty, $itemId, $storeId]);

        $db->prepare("INSERT INTO inventory_stock (id, property_id, item_id, location_id, quantity) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)")
           ->execute([generateUuid(), $propertyId, $itemId, $unitLocId, $qty]);

        $finalNotes = $notes . ($serial ? " (S/N: {$serial})" : "");
        $db->prepare("INSERT INTO inventory_movements (id, property_id, item_id, from_location_id, to_location_id, quantity, actor, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
           ->execute([generateUuid(), $propertyId, $itemId, $storeId, $unitLocId, $qty, $user['name'], $finalNotes]);

        logAudit($propertyId, 'inventory.placed_durable', $user['name'], ['unit' => $unitCode, 'qty' => $qty, 'serial' => $serial]);
        jsonResponse(['ok' => true]);
    }

    // 3. POST /api/inventory/items -> Add new catalog item
    if ($action === 'items' && $method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $name = trim($input['name'] ?? '');
        $kind = in_array($input['kind'] ?? '', ['consumable', 'durable']) ? $input['kind'] : 'consumable';
        $unit = trim($input['unit'] ?? 'piece');
        $price = floatval($input['replacementPrice'] ?? 0);

        if (empty($name)) {
            jsonError('Item name is required', 400);
        }

        $itemId = generateUuid();
        $db->prepare("INSERT INTO inventory_items (id, property_id, name, kind, unit, replacement_price) VALUES (?, ?, ?, ?, ?, ?)")
           ->execute([$itemId, $propertyId, $name, $kind, $unit, $price]);

        logAudit($propertyId, 'inventory.item_created', $user['name'], ['name' => $name, 'kind' => $kind]);
        jsonResponse(['ok' => true, 'id' => $itemId], 201);
    }

    jsonError('Unsupported inventory endpoint', 400);

} catch (Exception $e) {
    jsonError('Inventory error: ' . $e->getMessage(), 500);
}
