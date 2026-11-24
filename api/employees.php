<?php
/**
 * Solta Hotel Apartment · Operations
 * Employees & HR Records API: /api/employees
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $empId = $parts[0] ?? '';

    // 1. DELETE /api/employees/:id (Admin only)
    if ($method === 'DELETE' && !empty($empId)) {
        requireAdmin($db, $user);
        $stmtChk = $db->prepare("SELECT property_id, full_name, position FROM employees WHERE id = ?");
        $stmtChk->execute([$empId]);
        $emp = $stmtChk->fetch();
        if ($emp) {
            $db->prepare("DELETE FROM employees WHERE id = ?")->execute([$empId]);
            logAudit($emp['property_id'], 'employee.deleted', $user['name'], [
                'id' => $empId,
                'name' => $emp['full_name']
            ]);
        }
        jsonResponse(['ok' => true]);
    }

    // 2. PATCH / PUT /api/employees/:id -> Update employee profile
    if (($method === 'PATCH' || $method === 'PUT') && !empty($empId)) {
        $stmtChk = $db->prepare("SELECT * FROM employees WHERE id = ?");
        $stmtChk->execute([$empId]);
        $emp = $stmtChk->fetch();
        if (!$emp) {
            jsonError('Employee not found', 404);
        }

        $fields = [
            'full_name', 'birth_date', 'fayda_id', 'phone', 'email', 'position',
            'department', 'employment_type', 'hire_date', 'contract_end_date',
            'base_salary', 'allowance', 'bank_name', 'account_number', 'emergency_contact', 'status'
        ];

        $setClauses = [];
        $params = [];
        foreach ($fields as $f) {
            if (isset($input[$f])) {
                $setClauses[] = "`{$f}` = ?";
                $params[] = $input[$f];
            }
        }

        if (!empty($setClauses)) {
            $params[] = $empId;
            $stmt = $db->prepare("UPDATE employees SET " . implode(', ', $setClauses) . " WHERE id = ?");
            $stmt->execute($params);
        }

        logAudit($emp['property_id'], 'employee.updated', $user['name'], [
            'id' => $empId,
            'name' => $input['full_name'] ?? $emp['full_name']
        ]);

        jsonResponse(['ok' => true]);
    }

    // 3. POST /api/employees -> Create new employee record
    if ($method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $fullName = trim($input['full_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $position = trim($input['position'] ?? '');

        if (empty($fullName) || empty($phone) || empty($position)) {
            jsonError('Full name, phone, and position are required', 400);
        }

        $newId = generateUuid();
        $stmt = $db->prepare("INSERT INTO employees 
            (id, property_id, full_name, birth_date, fayda_id, phone, email, position, department, employment_type, hire_date, contract_end_date, base_salary, allowance, bank_name, account_number, emergency_contact, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $newId,
            $propertyId,
            $fullName,
            $input['birth_date'] ?: null,
            trim($input['fayda_id'] ?? '') ?: null,
            $phone,
            trim($input['email'] ?? '') ?: null,
            $position,
            $input['department'] ?? 'Operations',
            $input['employment_type'] ?? 'Full-Time',
            $input['hire_date'] ?: date('Y-m-d'),
            $input['contract_end_date'] ?: null,
            floatval($input['base_salary'] ?? 0),
            floatval($input['allowance'] ?? 0),
            trim($input['bank_name'] ?? '') ?: null,
            trim($input['account_number'] ?? '') ?: null,
            trim($input['emergency_contact'] ?? '') ?: null,
            $input['status'] ?? 'active'
        ]);

        logAudit($propertyId, 'employee.created', $user['name'], [
            'id' => $newId,
            'name' => $fullName,
            'position' => $position
        ]);

        jsonResponse(['ok' => true, 'id' => $newId], 201);
    }

    // 4. GET /api/employees -> List employees
    if ($method === 'GET') {
        $propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $stmt = $db->prepare("SELECT * FROM employees WHERE property_id = ? ORDER BY full_name ASC");
        $stmt->execute([$propertyId]);
        jsonResponse($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
} catch (Exception $e) {
    jsonError($e->getMessage(), 500);
}
