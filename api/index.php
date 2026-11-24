<?php
/**
 * Solta Hotel Apartment · Operations
 * Master API Router for Nginx & Apache: /api/index.php
 */

require_once __DIR__ . '/config.php';

$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);
$path = preg_replace('#^/api/?#', '', $path);
$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$resource = strtolower($parts[0] ?? '');

// Route request to appropriate module
switch ($resource) {
    case 'login':
        $_GET['action'] = 'login';
        require __DIR__ . '/auth.php';
        break;

    case 'logout':
        $_GET['action'] = 'logout';
        require __DIR__ . '/auth.php';
        break;

    case 'me':
        $_GET['action'] = 'me';
        require __DIR__ . '/auth.php';
        break;

    case 'data':
        require __DIR__ . '/data.php';
        break;

    case 'units':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/units.php';
        break;

    case 'reports':
        require __DIR__ . '/reports.php';
        break;

    case 'health':
        require __DIR__ . '/health.php';
        break;

    case 'users':
        require __DIR__ . '/users.php';
        break;

    case 'reservations':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/reservations.php';
        break;

    case 'inventory':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/inventory.php';
        break;

    case 'tasks':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/tasks.php';
        break;

    case 'roles':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/roles.php';
        break;

    case 'payment-methods':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/payment-methods.php';
        break;

    case 'approver-config':
        require __DIR__ . '/approver-config.php';
        break;

    case 'approvals':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/approvals.php';
        break;

    case 'maintenance':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/units.php';
        break;

    case 'expenses':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/expenses.php';
        break;

    case 'utilities':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/utilities.php';
        break;

    case 'employees':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/employees.php';
        break;

    case 'system':
        $_GET['path'] = implode('/', array_slice($parts, 1));
        require __DIR__ . '/system.php';
        break;

    default:
        if (!empty($resource) && file_exists(__DIR__ . '/' . $resource . '.php')) {
            require __DIR__ . '/' . $resource . '.php';
        } else {
            require __DIR__ . '/data.php';
        }
        break;
}
