<?php
/**
 * Solta Hotel Apartment · Operations
 * 1-Click cPanel Database Migration & Setup Wizard
 */

ini_set('display_errors', '1');
error_reporting(E_ALL);

$configFile = __DIR__ . '/config.php';
$schemaFile = dirname(__DIR__) . '/schema.sql';

$installed = false;
$error = '';
$logs = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbHost = trim($_POST['db_host'] ?? 'localhost');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';
    $adminPass = trim($_POST['admin_pass'] ?? 'admin123');

    if (empty($dbName) || empty($dbUser)) {
        $error = 'Database Name and Database Username are required.';
    } else {
        try {
            // Test connection
            $dsn = "mysql:host={$dbHost};charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // Create database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$dbName}`");
            $logs[] = "Connected to MySQL successfully and verified database `{$dbName}`.";

            // Update api/config.php with these credentials
            if (file_exists($configFile)) {
                $cfgContent = file_get_contents($configFile);
                $cfgContent = preg_replace("/define\('DB_HOST',.*?\);/", "define('DB_HOST', getenv('DB_HOST') ?: '{$dbHost}');", $cfgContent);
                $cfgContent = preg_replace("/define\('DB_NAME',.*?\);/", "define('DB_NAME', getenv('DB_NAME') ?: '{$dbName}');", $cfgContent);
                $cfgContent = preg_replace("/define\('DB_USER',.*?\);/", "define('DB_USER', getenv('DB_USER') ?: '{$dbUser}');", $cfgContent);
                $cfgContent = preg_replace("/define\('DB_PASS',.*?\);/", "define('DB_PASS', getenv('DB_PASS') ?: '{$dbPass}');", $cfgContent);
                file_put_contents($configFile, $cfgContent);
                $logs[] = "Saved database credentials into `api/config.php`.";
            }

            // Run schema.sql
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                // Execute multi-query
                $pdo->exec($sql);
                $logs[] = "Imported database schema and default permission catalog from `schema.sql`.";

                // Update default admin password if provided
                if (!empty($adminPass)) {
                    $newHash = password_hash($adminPass, PASSWORD_BCRYPT);
                    $upd = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = 'admin@gmail.com'");
                    $upd->execute([$newHash]);
                    $logs[] = "Configured administrator password for `admin@gmail.com`.";
                }

                $installed = true;
            } else {
                $error = "Schema file not found at: {$schemaFile}";
            }

        } catch (Exception $e) {
            $error = "Migration failed: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Solta Hotel Apartment · cPanel Setup</title>
  <style>
    :root {
      --ink: #203449;
      --paper: #f5f6f1;
      --green: #294e70;
      --orange: #d47749;
      --line: #e2e7df;
      --radius: 12px;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--paper);
      color: var(--ink);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      max-width: 520px;
      width: 100%;
      padding: 36px;
      box-sizing: border-box;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-family: Georgia, serif;
      color: var(--ink);
    }
    p {
      color: #61727d;
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    label {
      display: block;
      margin-bottom: 14px;
      font-size: 13px;
      font-weight: 600;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      margin-top: 5px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      background: var(--green);
      color: #fff;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      transition: background 0.2s;
    }
    button:hover {
      background: #1d374f;
    }
    .alert-success {
      background: #eaf7ed;
      color: #1e6b32;
      border: 1px solid #c7ecd1;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .alert-error {
      background: #fdeeee;
      color: #a82020;
      border: 1px solid #fad3d3;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .log-item {
      font-family: monospace;
      font-size: 12px;
      background: #f8fafc;
      padding: 8px 12px;
      border-left: 3px solid var(--green);
      margin-bottom: 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Solta Hotel Apartment</h1>
    <p>cPanel Database & Migration Setup Wizard</p>

    <?php if ($installed): ?>
      <div class="alert-success">
        <strong>Setup Completed Successfully!</strong><br>
        All tables, default permissions, sample units, and the administrator account are ready.
      </div>
      <div>
        <?php foreach ($logs as $log): ?>
          <div class="log-item"><?= htmlspecialchars($log) ?></div>
        <?php endforeach; ?>
      </div>
      <p style="margin-top: 24px;">
        <strong>Login Credentials:</strong><br>
        Email: <code>admin@gmail.com</code><br>
        Password: <code><?= htmlspecialchars($adminPass) ?></code>
      </p>
      <a href="../" style="display:inline-block; width:100%; text-align:center; background:var(--ink); color:#fff; text-decoration:none; padding:12px 0; border-radius:8px; font-weight:600;">Open Solta Operations Workspace &rarr;</a>
    <?php else: ?>
      <?php if (!empty($error)): ?>
        <div class="alert-error"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <form method="POST">
        <label>
          MySQL Host
          <input type="text" name="db_host" value="localhost" required>
        </label>
        <label>
          cPanel Database Name
          <input type="text" name="db_name" placeholder="e.g. yourcpanel_solta" required>
        </label>
        <label>
          cPanel Database Username
          <input type="text" name="db_user" placeholder="e.g. yourcpanel_user" required>
        </label>
        <label>
          cPanel Database Password
          <input type="password" name="db_pass" placeholder="Your cPanel MySQL Password">
        </label>
        <label>
          Administrator Password
          <input type="text" name="admin_pass" value="admin123" required>
        </label>
        <button type="submit">Run Database Migration & Setup</button>
      </form>
    <?php endif; ?>
  </div>
</body>
</html>
