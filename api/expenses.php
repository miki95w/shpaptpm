<?php
/**
 * Solta Hotel Apartment · Operations
 * Operating Expenses API: /api/expenses
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $expenseId = $parts[0] ?? '';

    // 1. DELETE /api/expenses/:id (Admin only)
    if ($method === 'DELETE' && !empty($expenseId)) {
        requireAdmin($db, $user);
        $stmtChk = $db->prepare("SELECT property_id, title, amount FROM expenses WHERE id = ?");
        $stmtChk->execute([$expenseId]);
        $exp = $stmtChk->fetch();
        if ($exp) {
            $db->prepare("DELETE FROM expenses WHERE id = ?")->execute([$expenseId]);
            logAudit($exp['property_id'], 'expense.deleted', $user['name'], [
                'id' => $expenseId,
                'title' => $exp['title'],
                'amount' => $exp['amount']
            ]);
        }
        jsonResponse(['ok' => true]);
    }

    // 2. POST /api/expenses -> Record operational expense
    if ($method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $title = trim($input['title'] ?? '');
        $amount = floatval($input['amount'] ?? 0);
        $category = trim($input['category'] ?? 'Supplies');
        $paymentMethod = trim($input['payment_method'] ?? 'Cash');
        $payee = trim($input['payee'] ?? '');
        $referenceNo = trim($input['reference_no'] ?? '');
        $expenseDate = trim($input['expense_date'] ?? date('Y-m-d'));
        $notes = trim($input['notes'] ?? '');

        if (empty($title) || $amount <= 0) {
            jsonError('Expense title and valid positive amount are required', 400);
        }

        $newId = generateUuid();
        $stmt = $db->prepare("INSERT INTO expenses 
            (id, property_id, title, category, amount, payment_method, payee, reference_no, expense_date, notes, recorded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $newId,
            $propertyId,
            $title,
            $category,
            $amount,
            $paymentMethod,
            $payee ?: null,
            $referenceNo ?: null,
            $expenseDate,
            $notes ?: null,
            $user['name']
        ]);

        logAudit($propertyId, 'expense.created', $user['name'], [
            'id' => $newId,
            'title' => $title,
            'category' => $category,
            'amount' => $amount
        ]);

        jsonResponse(['ok' => true, 'id' => $newId], 201);
    }

    // 3. GET /api/expenses -> List expenses
    if ($method === 'GET') {
        $propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $stmt = $db->prepare("SELECT * FROM expenses WHERE property_id = ? ORDER BY expense_date DESC LIMIT 100");
        $stmt->execute([$propertyId]);
        jsonResponse($stmt->fetchAll());
    }

    jsonError('Method not allowed', 405);
} catch (Exception $e) {
    jsonError($e->getMessage(), 500);
}
