<?php
/**
 * Solta Hotel Apartment · Operations
 * Reservations & Stays Handler: /api/reservations
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? ($_GET['path'] ?? '');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));

$db = getDB();
$input = getJsonInput();

try {
    // 1. POST /api/reservations -> Create new reservation
    if ($method === 'POST' && empty($parts)) {
        $propertyId = $input['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
        $unitId = $input['unitId'] ?? '';
        $guestName = trim($input['guestName'] ?? '');
        $guestPhone = trim($input['guestPhone'] ?? '');
        $payerName = trim($input['payerName'] ?? $guestName);
        $source = $input['source'] ?? 'Direct';
        $arrival = $input['arrival'] ?? date('Y-m-d 14:00:00');
        $departure = $input['departure'] ?? date('Y-m-d 11:00:00', strtotime('+1 day'));
        $depositAmount = floatval($input['deposit'] ?? 0);
        $paymentMethod = $input['paymentMethod'] ?? 'Cash';
        $paymentTerms = $input['paymentTerms'] ?? 'upfront'; // 'upfront' | 'monthly' | 'semi_annual' | 'tri_annual' | 'quarterly'

        if (empty($guestName) || empty($unitId)) {
            jsonError('Guest name and apartment are required', 400);
        }

        // Auto ensure table columns exist
        try {
            $db->exec("ALTER TABLE reservations ADD COLUMN payment_terms VARCHAR(50) NOT NULL DEFAULT 'upfront'");
            $db->exec("ALTER TABLE reservations ADD COLUMN total_contract_amount DECIMAL(12,2) NULL");
        } catch (Exception $e) {}

        try {
            $db->exec("CREATE TABLE IF NOT EXISTS `reservation_installments` (
                `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                `property_id` VARCHAR(36) NOT NULL,
                `reservation_id` VARCHAR(36) NOT NULL,
                `installment_number` INT NOT NULL,
                `title` VARCHAR(100) NOT NULL,
                `due_date` DATE NOT NULL,
                `amount` DECIMAL(12, 2) NOT NULL,
                `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                `status` ENUM('pending', 'partially_paid', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
                `paid_date` DATETIME NULL,
                `payment_method` VARCHAR(50) NULL,
                `notes` TEXT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (`reservation_id`),
                INDEX (`property_id`),
                INDEX (`due_date`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (Exception $e) {}

        // Get Unit Rate
        $uStmt = $db->prepare("SELECT nightly_rate, code FROM units WHERE id = ?");
        $uStmt->execute([$unitId]);
        $unit = $uStmt->fetch();
        if (!$unit) {
            jsonError('Selected unit does not exist', 404);
        }

        // Calculate nights
        $arrTime = strtotime($arrival);
        $depTime = strtotime($departure);
        $nights = max(1, ceil(($depTime - $arrTime) / 86400));
        $totalCost = $nights * floatval($unit['nightly_rate']);
        $rentalType = ($nights >= 30) ? 'Monthly' : ($input['rentalType'] ?? 'Daily');

        $resId = generateUuid();
        $ref = 'SOLTA-' . strtoupper(substr(md5(uniqid()), 0, 6));

        $isEarlyBooking = !empty($input['isEarlyBooking']);
        $mode = 'required';
        try {
            $appStmt = $db->prepare("SELECT mode, notify_new_booking FROM approver_settings WHERE property_id = ? LIMIT 1");
            $appStmt->execute([$propertyId]);
            $appRow = $appStmt->fetch();
            if ($appRow && !empty($appRow['mode'])) {
                $mode = $appRow['mode'];
            }
        } catch (Exception $e) {}

        $status = ($isEarlyBooking && $mode === 'required') ? 'pending_approval' : 'confirmed';

        // Insert Reservation
        $stmt = $db->prepare("INSERT INTO reservations (id, property_id, unit_id, reference, guest_name, guest_phone, payer_name, source, rental_type, payment_terms, total_contract_amount, status, arrival, departure, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$resId, $propertyId, $unitId, $ref, $guestName, $guestPhone, $payerName, $source, $rentalType, $paymentTerms, $totalCost, $status, $arrival, $departure]);

        // Generate Installment Schedule if payment terms is not upfront
        if ($paymentTerms !== 'upfront') {
            $numInst = 1;
            if ($paymentTerms === 'monthly') {
                $numInst = max(2, (int)round($nights / 30));
            } elseif ($paymentTerms === 'semi_annual') {
                $numInst = 2;
            } elseif ($paymentTerms === 'tri_annual') {
                $numInst = 3;
            } elseif ($paymentTerms === 'quarterly') {
                $numInst = 4;
            }

            $baseAmount = floor(($totalCost / $numInst) * 100) / 100;
            $instStmt = $db->prepare("INSERT INTO reservation_installments (id, property_id, reservation_id, installment_number, title, due_date, amount, paid_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 'pending', NOW())");

            for ($i = 1; $i <= $numInst; $i++) {
                $instId = generateUuid();
                $curAmount = ($i === $numInst) ? ($totalCost - ($baseAmount * ($numInst - 1))) : $baseAmount;
                
                // Calculate due date
                $offsetMonths = 0;
                if ($paymentTerms === 'monthly') {
                    $offsetMonths = $i - 1;
                    $instTitle = "Installment {$i} of {$numInst} (Month {$i})";
                } elseif ($paymentTerms === 'semi_annual') {
                    $offsetMonths = ($i - 1) * 6;
                    $instTitle = "Installment {$i} of 2 (" . ($i === 1 ? "1st Half / 6 Months" : "2nd Half / 6 Months") . ")";
                } elseif ($paymentTerms === 'tri_annual') {
                    $offsetMonths = ($i - 1) * 4;
                    $termsLabel = ($i === 1) ? "Months 1–4" : (($i === 2) ? "Months 5–8" : "Months 9–12");
                    $instTitle = "Installment {$i} of 3 ({$termsLabel})";
                } elseif ($paymentTerms === 'quarterly') {
                    $offsetMonths = ($i - 1) * 3;
                    $instTitle = "Installment {$i} of 4 (Quarter {$i})";
                }

                $dueDate = date('Y-m-d', strtotime("+{$offsetMonths} months", $arrTime));
                $instStmt->execute([$instId, $propertyId, $resId, $i, $instTitle, $dueDate, $curAmount]);
            }
        }

        // Create Stay Account
        $accId = generateUuid();
        $accStmt = $db->prepare("INSERT INTO stay_accounts (id, property_id, reservation_id, reference, guest_name, balance, deposit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $accStmt->execute([$accId, $propertyId, $resId, $ref, $guestName, $totalCost, $depositAmount]);

        // Record Initial Room Charge Entry
        $entStmt = $db->prepare("INSERT INTO stay_account_entries (id, account_id, kind, amount, description, actor, created_at) VALUES (?, ?, 'charge', ?, ?, ?, NOW())");
        $entStmt->execute([generateUuid(), $accId, $totalCost, "Room charges for {$nights} nights ({$unit['code']})", $user['name']]);

        // If deposit provided, record deposit entry
        if ($depositAmount > 0) {
            $depEntStmt = $db->prepare("INSERT INTO stay_account_entries (id, account_id, kind, amount, payment_method, description, actor, created_at) VALUES (?, ?, 'deposit', ?, ?, 'Initial security deposit', ?, NOW())");
            $depEntStmt->execute([generateUuid(), $accId, $depositAmount, $paymentMethod, $user['name']]);
        }

        // Notification for Approver
        try {
            $notifId = 'notif-' . substr(generateUuid(), 0, 8);
            $notifType = $isEarlyBooking ? 'early_booking' : 'new_booking';
            $notifTitle = $isEarlyBooking ? ($status === 'pending_approval' ? 'Early Booking Approval Requested' : 'Early Booking (Auto-Approved)') : 'New Booking Registered';
            $notifMsg = "Guest {$guestName} booked {$unit['code']}. " . ($isEarlyBooking ? "Early check-in requested. Mode: " . strtoupper($mode) : "Standard booking.");
            $notifStatus = ($isEarlyBooking && $mode === 'required') ? 'pending' : 'info';
            $reqApproval = ($isEarlyBooking && $mode === 'required') ? 1 : 0;
            
            $db->prepare("INSERT INTO system_notifications (id, property_id, type, title, message, entity_id, status, required_approval, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())")
               ->execute([$notifId, $propertyId, $notifType, $notifTitle, $notifMsg, $resId, $notifStatus, $reqApproval]);
        } catch (Exception $e) {}

        logAudit($propertyId, $status === 'pending_approval' ? 'reservation.approval_requested' : 'reservation.created', $user['name'], [
            'reference' => $ref,
            'guest' => $guestName,
            'unit' => $unit['code'],
            'total' => $totalCost,
            'status' => $status
        ]);

        jsonResponse(['ok' => true, 'id' => $resId, 'reference' => $ref, 'status' => $status], 201);
    }

    // 1b. POST /api/reservations/installment-payment -> Record an installment payment
    if ($method === 'POST' && ($parts[0] ?? '') === 'installment-payment') {
        $installmentId = $input['installmentId'] ?? '';
        $amount = floatval($input['amount'] ?? 0);
        $paymentMethod = trim($input['paymentMethod'] ?? 'Cash');
        $notes = trim($input['notes'] ?? 'Installment payment');

        if (empty($installmentId) || $amount <= 0) {
            jsonError('Valid installment ID and payment amount are required', 400);
        }

        // Fetch installment
        $instStmt = $db->prepare("SELECT * FROM reservation_installments WHERE id = ?");
        $instStmt->execute([$installmentId]);
        $installment = $instStmt->fetch();
        if (!$installment) {
            jsonError('Installment record not found', 404);
        }

        $newPaidAmount = floatval($installment['paid_amount']) + $amount;
        $targetAmount = floatval($installment['amount']);
        $newStatus = ($newPaidAmount >= $targetAmount - 0.01) ? 'paid' : 'partially_paid';

        // Update installment
        $upInst = $db->prepare("UPDATE reservation_installments SET paid_amount = ?, status = ?, paid_date = NOW(), payment_method = ?, notes = ? WHERE id = ?");
        $upInst->execute([$newPaidAmount, $newStatus, $paymentMethod, $notes, $installmentId]);

        // Find Stay Account for this reservation
        $accStmt = $db->prepare("SELECT id, balance FROM stay_accounts WHERE reservation_id = ?");
        $accStmt->execute([$installment['reservation_id']]);
        $stayAccount = $accStmt->fetch();

        if ($stayAccount) {
            // Deduct balance
            $db->prepare("UPDATE stay_accounts SET balance = balance - ? WHERE id = ?")->execute([$amount, $stayAccount['id']]);

            // Add payment entry to stay_account_entries
            $db->prepare("INSERT INTO stay_account_entries (id, account_id, kind, amount, payment_method, description, actor, created_at) VALUES (?, ?, 'payment', ?, ?, ?, ?, NOW())")
               ->execute([generateUuid(), $stayAccount['id'], $amount, $paymentMethod, "Installment Payment: {$installment['title']} ({$notes})", $user['name']]);
        }

        // Log audit
        logAudit($installment['property_id'], 'reservation.installment_paid', $user['name'], [
            'installment_id' => $installmentId,
            'title' => $installment['title'],
            'amount' => $amount,
            'method' => $paymentMethod
        ]);

        // System notification
        try {
            $notifId = 'notif-' . substr(generateUuid(), 0, 8);
            $db->prepare("INSERT INTO system_notifications (id, property_id, type, title, message, entity_id, status, created_at) VALUES (?, ?, 'installment_paid', ?, ?, ?, 'info', NOW())")
               ->execute([$notifId, $installment['property_id'], "Installment Payment Received ({$paymentMethod})", "Received {$amount} for {$installment['title']} recorded by {$user['name']}.", $installment['reservation_id']]);
        } catch (Exception $e) {}

        jsonResponse(['ok' => true, 'paid_amount' => $newPaidAmount, 'status' => $newStatus]);
    }

    // 2. Actions on specific reservation: /api/reservations/:id/...
    $resId = $parts[0] ?? '';
    $action = $parts[1] ?? '';

    // Fetch reservation
    $stmtR = $db->prepare("SELECT r.*, u.code as unit_code FROM reservations r LEFT JOIN units u ON u.id = r.unit_id WHERE r.id = ?");
    $stmtR->execute([$resId]);
    $reservation = $stmtR->fetch();
    if (!$reservation) {
        jsonError('Reservation not found', 404);
    }

    // Approve action
    if ($action === 'approve') {
        $db->prepare("UPDATE reservations SET status = 'confirmed' WHERE id = ?")->execute([$resId]);
        try {
            $db->prepare("UPDATE system_notifications SET status = 'approved' WHERE entity_id = ?")->execute([$resId]);
        } catch (Exception $e) {}
        logAudit($reservation['property_id'], 'reservation.approved', $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true]);
    }

    // Reject action
    if ($action === 'reject') {
        $db->prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?")->execute([$resId]);
        try {
            $db->prepare("UPDATE system_notifications SET status = 'rejected' WHERE entity_id = ?")->execute([$resId]);
        } catch (Exception $e) {}
        logAudit($reservation['property_id'], 'reservation.rejected', $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true]);
    }

    // Check-in action
    if ($action === 'check-in') {
        $db->prepare("UPDATE reservations SET status = 'checked_in', checked_in_at = NOW() WHERE id = ?")->execute([$resId]);
        $db->prepare("UPDATE units SET occupied = 1, readiness = 'ready' WHERE id = ?")->execute([$reservation['unit_id']]);
        
        logAudit($reservation['property_id'], 'reservation.check_in', $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true]);
    }

    // Check-out action
    if ($action === 'check-out') {
        $db->prepare("UPDATE reservations SET status = 'checked_out', checked_out_at = NOW() WHERE id = ?")->execute([$resId]);
        $db->prepare("UPDATE units SET occupied = 0, readiness = 'dirty' WHERE id = ?")->execute([$reservation['unit_id']]);
        
        // Auto-generate housekeeping turnaround task
        $taskId = generateUuid();
        $db->prepare("INSERT INTO housekeeping_tasks (id, property_id, unit_id, reservation_id, status, reason, created_at) VALUES (?, ?, ?, ?, 'pending', 'Checkout turnaround: clean and inspect for new guest', NOW())")
           ->execute([$taskId, $reservation['property_id'], $reservation['unit_id'], $resId]);

        logAudit($reservation['property_id'], 'reservation.check_out', $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true]);
    }

    // Inspection Checklist
    if ($action === 'inspection') {
        $chkId = generateUuid();
        $type = $input['type'] ?? 'check_in';
        $itemsData = json_encode($input['lines'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $ack = !empty($input['guestAcknowledged']) ? 1 : 0;
        $ackName = trim($input['acknowledgingGuest'] ?? '');
        $notes = trim($input['conditionNotes'] ?? '');

        $stmtChk = $db->prepare("INSERT INTO inspection_checklists (id, reservation_id, type, data, guest_acknowledged, acknowledging_guest, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmtChk->execute([$chkId, $resId, $type, $itemsData, $ack, $ackName, $notes]);

        logAudit($reservation['property_id'], "inspection.{$type}", $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true, 'id' => $chkId]);
    }

    // Extend stay
    if ($action === 'extend') {
        $newDep = $input['departure'] ?? '';
        if (empty($newDep)) {
            jsonError('New departure date is required', 400);
        }

        $oldDepTime = strtotime($reservation['departure']);
        $newDepTime = strtotime($newDep);
        $addedNights = max(0, ceil(($newDepTime - $oldDepTime) / 86400));

        $db->prepare("UPDATE reservations SET departure = ? WHERE id = ?")->execute([$newDep, $resId]);

        // Post extra room charges to stay account if applicable
        if ($addedNights > 0) {
            $stmtUnit = $db->prepare("SELECT nightly_rate FROM units WHERE id = ?");
            $stmtUnit->execute([$reservation['unit_id']]);
            $unitRow = $stmtUnit->fetch();

            if ($unitRow) {
                $addedCharge = $addedNights * floatval($unitRow['nightly_rate']);
                $stmtAcc = $db->prepare("SELECT id, balance FROM stay_accounts WHERE reservation_id = ?");
                $stmtAcc->execute([$resId]);
                $acc = $stmtAcc->fetch();

                if ($acc) {
                    $db->prepare("UPDATE stay_accounts SET balance = balance + ? WHERE id = ?")->execute([$addedCharge, $acc['id']]);
                    $notes = trim($input['notes'] ?? 'Guest requested stay extension');
                    $db->prepare("INSERT INTO stay_account_entries (id, account_id, kind, amount, description, actor, created_at) VALUES (?, ?, 'charge', ?, ?, ?, NOW())")
                       ->execute([generateUuid(), $acc['id'], $addedCharge, "Stay extension for {$addedNights} additional night(s) ({$notes})", $user['name']]);
                }
            }
        }

        logAudit($reservation['property_id'], 'reservation.extended', $user['name'], ['reference' => $reservation['reference'], 'departure' => $newDep, 'addedNights' => $addedNights]);
        jsonResponse(['ok' => true, 'addedNights' => $addedNights]);
    }

    // Cancel stay
    if ($action === 'cancel') {
        $db->prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?")->execute([$resId]);
        $db->prepare("UPDATE units SET occupied = 0 WHERE id = ?")->execute([$reservation['unit_id']]);
        logAudit($reservation['property_id'], 'reservation.cancelled', $user['name'], ['reference' => $reservation['reference']]);
        jsonResponse(['ok' => true]);
    }

    // DELETE /api/reservations/:id -> Delete reservation & stay account (Admin only)
    if ($method === 'DELETE' && !empty($resId)) {
        requireAdmin($db, $user);

        $stmtAcc = $db->prepare("SELECT id FROM stay_accounts WHERE reservation_id = ?");
        $stmtAcc->execute([$resId]);
        $accIds = $stmtAcc->fetchAll(PDO::FETCH_COLUMN);

        foreach ($accIds as $accId) {
            $db->prepare("DELETE FROM stay_account_entries WHERE account_id = ?")->execute([$accId]);
        }
        $db->prepare("DELETE FROM stay_accounts WHERE reservation_id = ?")->execute([$resId]);
        try {
            $db->prepare("DELETE FROM reservation_installments WHERE reservation_id = ?")->execute([$resId]);
        } catch (Exception $e) {}
        try {
            $db->prepare("DELETE FROM inspections WHERE reservation_id = ?")->execute([$resId]);
        } catch (Exception $e) {}
        $db->prepare("DELETE FROM reservations WHERE id = ?")->execute([$resId]);

        if ($reservation['status'] === 'checked_in' && !empty($reservation['unit_id'])) {
            $db->prepare("UPDATE units SET occupied = 0, readiness = 'dirty' WHERE id = ?")->execute([$reservation['unit_id']]);
        }

        logAudit($reservation['property_id'], 'reservation.deleted', $user['name'], ['reference' => $reservation['reference'], 'guest_name' => $reservation['guest_name']]);
        jsonResponse(['ok' => true]);
    }

    jsonError('Unsupported reservation action', 400);

} catch (Exception $e) {
    jsonError('Reservation processing error: ' . $e->getMessage(), 500);
}
