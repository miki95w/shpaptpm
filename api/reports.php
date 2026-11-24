<?php
/**
 * Solta Hotel Apartment · Operations
 * Financial Analytics, Cash Flow & Trend Reports: /api/reports
 */

require_once __DIR__ . '/db.php';

$user = requireAuth();
$propertyId = $_GET['propertyId'] ?? 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';
$mode = $_GET['mode'] ?? 'finance';
$granularity = $_GET['granularity'] ?? 'month';

try {
    $db = getDB();

    // 1. Query stay accounts & entries (Inflows)
    $sql = "SELECT e.*, a.property_id 
            FROM stay_account_entries e 
            JOIN stay_accounts a ON a.id = e.account_id 
            WHERE a.property_id = ? 
            ORDER BY e.created_at ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$propertyId]);
    $entries = $stmt->fetchAll();

    // Query active balances & deposits
    $stmtAcc = $db->prepare("SELECT balance, deposit FROM stay_accounts WHERE property_id = ?");
    $stmtAcc->execute([$propertyId]);
    $accounts = $stmtAcc->fetchAll();

    $outstandingBalances = 0.0;
    $activeDeposits = 0.0;
    foreach ($accounts as $acc) {
        $outstandingBalances += floatval($acc['balance']);
        $activeDeposits += floatval($acc['deposit']);
    }

    // 2. Query operating expenses
    $stmtExp = $db->prepare("SELECT * FROM expenses WHERE property_id = ? ORDER BY expense_date ASC, created_at ASC");
    $stmtExp->execute([$propertyId]);
    $expenses = $stmtExp->fetchAll();

    // 3. Query utilities
    $stmtUtil = $db->prepare("SELECT * FROM utilities WHERE property_id = ? ORDER BY due_date ASC, created_at ASC");
    $stmtUtil->execute([$propertyId]);
    $utilities = $stmtUtil->fetchAll();

    // 4. Query maintenance records (if table exists)
    $maintenanceRecords = [];
    try {
        $stmtMaint = $db->prepare("SELECT * FROM maintenance_records WHERE property_id = ? ORDER BY start_date DESC");
        $stmtMaint->execute([$propertyId]);
        $maintenanceRecords = $stmtMaint->fetchAll();
    } catch (Exception $e) {
        $maintenanceRecords = [];
    }

    $totalPayments = 0.0;
    $totalDeposits = 0.0;
    $totalRefunds = 0.0;
    $methodBreakdown = [];
    $trendMap = [];
    $recentTxns = [];

    // Process Stay Account Entries
    foreach ($entries as $e) {
        $amount = floatval($e['amount']);
        $kind = $e['kind'];
        $pm = $e['payment_method'] ?: 'Cash';
        $dateKey = date('Y-m', strtotime($e['created_at']));
        $exactDate = date('Y-m-d', strtotime($e['created_at']));

        if (!isset($trendMap[$dateKey])) {
            $trendMap[$dateKey] = [
                'period' => $dateKey,
                'payments' => 0.0,
                'deposits' => 0.0,
                'refunds' => 0.0,
                'expenses' => 0.0,
                'utilities' => 0.0,
                'netOperatingIncome' => 0.0,
                'netCashflow' => 0.0
            ];
        }

        if (!isset($methodBreakdown[$pm])) {
            $methodBreakdown[$pm] = [
                'method' => $pm,
                'payments' => 0.0,
                'deposits' => 0.0,
                'refunds' => 0.0,
                'totalVolume' => 0.0,
                'count' => 0
            ];
        }

        if ($kind === 'payment') {
            $totalPayments += $amount;
            $trendMap[$dateKey]['payments'] += $amount;
            $methodBreakdown[$pm]['payments'] += $amount;
            $methodBreakdown[$pm]['totalVolume'] += $amount;
            $methodBreakdown[$pm]['count']++;
            $recentTxns[] = [
                'id' => $e['id'],
                'date' => $exactDate,
                'kind' => 'payment',
                'type' => 'inflow',
                'title' => 'Guest Stay Payment',
                'description' => $e['description'] ?: 'Room settlement',
                'category' => 'Guest Lodging',
                'method' => $pm,
                'amount' => $amount
            ];
        } elseif ($kind === 'deposit') {
            $totalDeposits += $amount;
            $trendMap[$dateKey]['deposits'] += $amount;
            $methodBreakdown[$pm]['deposits'] += $amount;
            $methodBreakdown[$pm]['totalVolume'] += $amount;
            $methodBreakdown[$pm]['count']++;
            $recentTxns[] = [
                'id' => $e['id'],
                'date' => $exactDate,
                'kind' => 'deposit',
                'type' => 'inflow',
                'title' => 'Security Deposit Held',
                'description' => $e['description'] ?: 'Damage deposit',
                'category' => 'Security Deposit',
                'method' => $pm,
                'amount' => $amount
            ];
        } elseif ($kind === 'refund' || $kind === 'deposit_refund') {
            $totalRefunds += $amount;
            $trendMap[$dateKey]['refunds'] += $amount;
            $methodBreakdown[$pm]['refunds'] += $amount;
            $methodBreakdown[$pm]['count']++;
            $recentTxns[] = [
                'id' => $e['id'],
                'date' => $exactDate,
                'kind' => 'refund',
                'type' => 'outflow',
                'title' => 'Deposit / Payment Refund',
                'description' => $e['description'] ?: 'Refunded to guest',
                'category' => 'Security Deposit',
                'method' => $pm,
                'amount' => $amount
            ];
        }
    }

    // Process Expenses
    $totalExpenses = 0.0;
    $expenseCategoryMap = [];

    foreach ($expenses as $exp) {
        $amount = floatval($exp['amount']);
        $totalExpenses += $amount;
        $cat = $exp['category'] ?: 'Supplies';
        $dateKey = date('Y-m', strtotime($exp['expense_date'] ?: $exp['created_at']));
        $exactDate = date('Y-m-d', strtotime($exp['expense_date'] ?: $exp['created_at']));

        if (!isset($trendMap[$dateKey])) {
            $trendMap[$dateKey] = [
                'period' => $dateKey,
                'payments' => 0.0,
                'deposits' => 0.0,
                'refunds' => 0.0,
                'expenses' => 0.0,
                'utilities' => 0.0,
                'netOperatingIncome' => 0.0,
                'netCashflow' => 0.0
            ];
        }
        $trendMap[$dateKey]['expenses'] += $amount;

        if (!isset($expenseCategoryMap[$cat])) {
            $expenseCategoryMap[$cat] = ['category' => $cat, 'total' => 0.0, 'count' => 0];
        }
        $expenseCategoryMap[$cat]['total'] += $amount;
        $expenseCategoryMap[$cat]['count']++;

        $recentTxns[] = [
            'id' => $exp['id'],
            'date' => $exactDate,
            'kind' => 'expense',
            'type' => 'outflow',
            'title' => $exp['title'],
            'description' => ($exp['payee'] ? $exp['payee'] . ' · ' : '') . ($exp['notes'] ?: 'Operating expense'),
            'category' => $cat,
            'method' => $exp['payment_method'] ?: 'Cash',
            'amount' => $amount
        ];
    }

    // Process Utilities
    $totalUtilities = 0.0;
    $pendingUtilities = 0.0;

    foreach ($utilities as $u) {
        $amount = floatval($u['amount']);
        $dateKey = date('Y-m', strtotime($u['paid_at'] ?: ($u['due_date'] ?: $u['created_at'])));
        $exactDate = date('Y-m-d', strtotime($u['paid_at'] ?: ($u['due_date'] ?: $u['created_at'])));

        if ($u['paid_status'] === 'paid') {
            $totalUtilities += $amount;
            if (!isset($trendMap[$dateKey])) {
                $trendMap[$dateKey] = [
                    'period' => $dateKey,
                    'payments' => 0.0,
                    'deposits' => 0.0,
                    'refunds' => 0.0,
                    'expenses' => 0.0,
                    'utilities' => 0.0,
                    'netOperatingIncome' => 0.0,
                    'netCashflow' => 0.0
                ];
            }
            $trendMap[$dateKey]['utilities'] += $amount;

            if (!isset($expenseCategoryMap['Utilities'])) {
                $expenseCategoryMap['Utilities'] = ['category' => 'Utilities', 'total' => 0.0, 'count' => 0];
            }
            $expenseCategoryMap['Utilities']['total'] += $amount;
            $expenseCategoryMap['Utilities']['count']++;

            $recentTxns[] = [
                'id' => $u['id'],
                'date' => $exactDate,
                'kind' => 'utility',
                'type' => 'outflow',
                'title' => $u['utility_type'] . ' Bill · ' . $u['provider'],
                'description' => 'Billing ' . ($u['billing_period'] ?: 'period') . ' · ' . ($u['notes'] ?: 'Settled utility'),
                'category' => 'Utilities',
                'method' => $u['payment_method'] ?: 'Bank Transfer',
                'amount' => $amount
            ];
        } else {
            $pendingUtilities += $amount;
        }
    }

    // Calculate trends
    ksort($trendMap);
    $trend = [];
    foreach ($trendMap as $k => $t) {
        $t['netOperatingIncome'] = $t['payments'] - ($t['expenses'] + $t['utilities']);
        $t['netCashflow'] = ($t['payments'] + $t['deposits'] - $t['refunds']) - ($t['expenses'] + $t['utilities']);
        $trend[] = $t;
    }

    $totalOutflow = $totalExpenses + $totalUtilities;
    $netRevenue = $totalPayments - $totalRefunds;
    $netOperatingIncome = $totalPayments - $totalOutflow;
    $netCashflow = ($totalPayments + $totalDeposits - $totalRefunds) - $totalOutflow;
    $operatingMargin = $totalPayments > 0 ? round(($netOperatingIncome / $totalPayments) * 100) : 0;

    // Methods
    $methods = [];
    foreach ($methodBreakdown as $m) {
        $m['share'] = $totalPayments > 0 ? round(($m['payments'] / $totalPayments) * 100) : 0;
        $methods[] = $m;
    }

    // Categories
    $categories = [];
    foreach ($expenseCategoryMap as $c) {
        $c['share'] = $totalOutflow > 0 ? round(($c['total'] / $totalOutflow) * 100) : 0;
        $categories[] = $c;
    }

    // Sort recent txns descending by date
    usort($recentTxns, function ($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    jsonResponse([
        'totals' => [
            'payments' => $totalPayments,
            'deposits' => $totalDeposits,
            'refunds' => $totalRefunds,
            'net' => $netCashflow,
            'netRevenue' => $netRevenue,
            'operationalExpenses' => $totalExpenses,
            'utilitiesCost' => $totalUtilities,
            'pendingUtilities' => $pendingUtilities,
            'totalOutflow' => $totalOutflow,
            'netOperatingIncome' => $netOperatingIncome,
            'netCashflow' => $netCashflow,
            'operatingMargin' => $operatingMargin,
            'outstandingBalances' => $outstandingBalances,
            'activeDeposits' => $activeDeposits
        ],
        'summary' => [
            'totalPayments' => $totalPayments,
            'totalDeposits' => $totalDeposits,
            'totalRefunds' => $totalRefunds,
            'netCashflow' => $netCashflow,
            'netOperatingIncome' => $netOperatingIncome,
            'totalExpenses' => $totalOutflow,
            'netRevenue' => $netRevenue
        ],
        'trend' => $trend,
        'trends' => $trend,
        'methods' => $methods,
        'methodBreakdown' => $methods,
        'expenseCategories' => $categories,
        'transactions' => $recentTxns,
        'recentTransactions' => $recentTxns,
        'maintenanceRecords' => $maintenanceRecords,
        'granularity' => $granularity
    ]);

} catch (Exception $e) {
    jsonError('Report generation error: ' . $e->getMessage(), 500);
}
