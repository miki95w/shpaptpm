<?php
/**
 * Solta Hotel Apartment · Operations
 * Housekeeping Tasks Handler: /api/tasks
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    $taskId = $parts[0] ?? '';

    // 1. PATCH /api/tasks/:id -> Update task status or assign cleaner
    if ($method === 'PATCH' && !empty($taskId)) {
        $status = $input['status'] ?? null;
        $assigneeId = $input['assigneeId'] ?? null;

        $updates = [];
        $params = [];

        if ($status !== null) {
            $updates[] = "status = ?";
            $params[] = $status;
            if ($status === 'completed') {
                $updates[] = "completed_at = NOW()";
            }
        }

        if ($assigneeId !== null) {
            $updates[] = "assignee_id = ?";
            $params[] = $assigneeId;
        }

        if (empty($updates)) {
            jsonError('No fields to update', 400);
        }

        $params[] = $taskId;
        $sql = "UPDATE housekeeping_tasks SET " . implode(', ', $updates) . " WHERE id = ?";
        $db->prepare($sql)->execute($params);

        // If completed, check if unit can be marked ready
        if ($status === 'completed') {
            $taskStmt = $db->prepare("SELECT unit_id, property_id FROM housekeeping_tasks WHERE id = ?");
            $taskStmt->execute([$taskId]);
            $task = $taskStmt->fetch();
            if ($task) {
                $db->prepare("UPDATE units SET readiness = 'ready' WHERE id = ?")->execute([$task['unit_id']]);
                logAudit($task['property_id'], 'housekeeping.completed', $user['name'], ['taskId' => $taskId, 'unitId' => $task['unit_id']]);
            }
        }

        jsonResponse(['ok' => true]);
    }

    // 2. POST /api/tasks -> Create new task
    if ($method === 'POST') {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $unitId = $input['unitId'] ?? '';
        $reason = trim($input['reason'] ?? 'Turnaround cleaning');
        $assigneeId = $input['assigneeId'] ?? null;

        if (empty($unitId)) {
            jsonError('Unit is required', 400);
        }

        $id = generateUuid();
        $db->prepare("INSERT INTO housekeeping_tasks (id, property_id, unit_id, assignee_id, status, reason, created_at) VALUES (?, ?, ?, ?, 'pending', ?, NOW())")
           ->execute([$id, $propertyId, $unitId, $assigneeId, $reason]);

        $db->prepare("UPDATE units SET readiness = 'dirty' WHERE id = ?")->execute([$unitId]);

        logAudit($propertyId, 'housekeeping.task_created', $user['name'], ['unitId' => $unitId, 'reason' => $reason]);
        jsonResponse(['ok' => true, 'id' => $id], 201);
    }

    jsonError('Unsupported task action', 400);

} catch (Exception $e) {
    jsonError('Housekeeping task error: ' . $e->getMessage(), 500);
}
