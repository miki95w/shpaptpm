# Solta Hotel Apartment · cPanel Hosting & Production Deployment Guide

This document contains the complete, up-to-date deployment reference for **Solta Hotel Apartment Operations Platform (PMS)** pre-configured and packaged specifically for standard **cPanel hosting environments** (Apache / LiteSpeed + PHP 8.0–8.3 + MySQL / MariaDB).

---

## 📦 What Is Included & Pre-Packaged

1. **Frontend Application:**
   - High-performance React 19 SPA compiled into minified, cache-busted static assets (`dist/assets/`).
   - Authentic Solta luxury branding with high-legibility **Sky Blue Navigation Sidebar**, optimized responsive drawer, and custom typography.
   - Dual apartment views (**Photo Grid View** and **Operational List View**) with 4 operational modes (`Ready`, `Occupied`, `Booked`, `Under Maintenance`).
   - Comprehensive **Inventory & Custody** tracking (Central Store, Housekeeping Mobile Carts, In-Room Durable Placements).
   - Dedicated **Management Suite** for Human Resources/Employees, Operating Expenses, and Utility Billing.
   - **Executive Reports & Decision Intelligence** module with 7 KPIs, unit matrix, downtime audit, P&L statement, and 1-click CSV export.

2. **Backend REST API (`api/`):**
   - Clean, modular PHP 8.x REST API with zero external dependencies.
   - Optimized database layer eliminating N+1 query loops.
   - Endpoints for auth, data bundling, unit modes, maintenance resolution, inventory movements, reservations, housekeeping tasks, employee HR, expenses, utilities, and financial reports.
   - Hardened session cookies (`HttpOnly`, `SameSite=Strict`, `Secure`).

3. **Database Schema (`schema.sql`):**
   - 17 relational tables with UUID primary keys and comprehensive indexes.
   - Pre-populated permissions catalog, default Solta apartments (`SOLTA-101` to `SOLTA-301`), inventory items, and Ethiopian payment rails (**Telebirr**, **CBE Birr**, **Cash**).

4. **Production Deployable Archive:**
   - Ready-to-upload ZIP package: **`solta_cpanel_upload.zip`** (1.8 MB, generated in the repository root).

---

## 🚀 Fast 3-Step Deployment via cPanel

### Step 1: Create MySQL Database in cPanel
1. Log in to your **cPanel Dashboard**.
2. Under the **Databases** section, click **MySQL® Database Wizard**.
3. **Step 1 - Create Database:** Enter a name (e.g. `solta_pms` &rarr; becomes `username_soltapms`). Click **Next Step**.
4. **Step 2 - Create Database User:** Enter a username (e.g. `solta_user` &rarr; becomes `username_soltauser`) and generate a secure password. Click **Create User**.
5. **Step 3 - Set Privileges:** Check **ALL PRIVILEGES** and click **Make Changes**.
6. *Save your Database Name, Database Username, and Database Password.*

---

### Step 2: Upload & Extract via File Manager
1. In cPanel, open **File Manager** (under *Files*).
2. Navigate to your target directory:
   - For your primary domain: open **`public_html`**.
   - For a subdomain (e.g. `apartment.fergamitechnologies.com`): open the subdomain root folder.
3. Click **Upload** in the top toolbar.
4. Select the file: **`solta_cpanel_upload.zip`** from your computer.
5. Once upload completes (green progress bar), return to File Manager.
6. Right-click **`solta_cpanel_upload.zip`** and choose **Extract** &rarr; **Extract File(s)**.
7. Verify that `index.html`, `.htaccess`, `schema.sql`, `api/`, and `assets/` are in the root of your web directory.
8. Delete `solta_cpanel_upload.zip` to save disk space.

---

### Step 3: Run the 1-Click Setup Wizard
1. Open your browser and navigate to:
   ```
   https://yourdomain.com/api/install.php
   ```
   *(Replace with your actual domain or subdomain URL)*
2. Fill in the MySQL connection details from Step 1:
   - **MySQL Host:** `localhost` (default for cPanel)
   - **Database Name:** e.g., `username_soltapms`
   - **Database User:** e.g., `username_soltauser`
   - **Database Password:** Your MySQL user password
   - **Administrator Password:** Master password for the initial admin account (default: `admin123`)
3. Click **Run Database Migration & Setup**.
4. The wizard will:
   - Test connection to your MySQL database.
   - Write credentials into `api/config.php`.
   - Execute `schema.sql` to create all 17 tables and indexes.
   - Seed default Solta data (apartments, catalog, payment rails).
   - Create your master administrator account (`admin@gmail.com`).
5. Click **Open Solta Operations Workspace** or browse to `https://yourdomain.com/`.

---

## 🔑 Default Master Credentials

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Email Address** | `admin@gmail.com` | Primary super-administrator login |
| **Password** | `admin123` | *Or custom password specified during installation* |

---

## 🔄 Upgrading an Existing cPanel Installation (Without Data Loss)

If Solta PMS is already running on your cPanel server and you are updating to the latest release:

1. **Upload Updated Assets:**
   - Extract `solta_cpanel_upload.zip` into your target directory, allowing it to overwrite `index.html`, `assets/`, `api/`, and `.htaccess`.
   - Your existing database and `api/config.php` will remain intact.
2. **Apply Database Schema Additions:**
   - Open cPanel &rarr; **phpMyAdmin** &rarr; Select your database (`username_soltapms`).
   - Click the **SQL** tab and execute the following upgrade script to add the latest tables and columns if not already present:

```sql
-- 1. Apartment Operational Mode
ALTER TABLE `units` ADD COLUMN IF NOT EXISTS `mode` ENUM('ready', 'occupied', 'booked', 'maintenance') NOT NULL DEFAULT 'ready';

-- 2. Maintenance & Downtime Audit Records
CREATE TABLE IF NOT EXISTS `maintenance_records` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `unit_id` VARCHAR(36) NOT NULL,
  `unit_code` VARCHAR(50) NOT NULL,
  `issue` TEXT NOT NULL,
  `technician` VARCHAR(150) NULL,
  `duration_est` VARCHAR(50) NULL,
  `actual_duration` VARCHAR(50) NULL,
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('in_progress', 'resolved') NOT NULL DEFAULT 'in_progress',
  `start_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_date` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`unit_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Human Resources & Employee Profiles
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `date_of_birth` DATE NULL,
  `id_number` VARCHAR(100) NULL,
  `job_title` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL DEFAULT 'Operations',
  `employment_type` ENUM('permanent', 'contract', 'probation', 'daily') NOT NULL DEFAULT 'permanent',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `base_salary` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `allowance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Operating Expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Supplies',
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `expense_date` DATE NOT NULL,
  `recipient` VARCHAR(150) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Utilities Management
CREATE TABLE IF NOT EXISTS `utilities` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `utility_type` ENUM('Electricity', 'Water', 'Internet', 'Gas', 'Garbage', 'Other') NOT NULL,
  `provider` VARCHAR(150) NOT NULL,
  `billing_period` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `meter_reading_previous` VARCHAR(50) NULL,
  `meter_reading_current` VARCHAR(50) NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  `paid_at` DATETIME NULL,
  `payment_method` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`status`),
  INDEX (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🛡️ Production Security Checklist

Before directing live guest bookings to the domain:

1. **Delete or Disable Installer:**
   Remove `api/install.php` to prevent re-execution:
   ```bash
   rm public_html/api/install.php
   ```
2. **Enable HTTPS (AutoSSL):**
   In cPanel, open **SSL/TLS Status** &rarr; Select your domain &rarr; Click **Run AutoSSL**. This activates encrypted HTTPS communication required for secure session cookies.
3. **Verify PHP Version:**
   In cPanel, open **MultiPHP Manager** and select **PHP 8.1, 8.2, or 8.3**.
4. **Inspect `.htaccess` Rewrites:**
   Ensure `.htaccess` is present in your web root. It provides:
   - Clean routing for API requests (`/api/*` &rarr; `api/*.php`).
   - SPA browser history routing (fallback to `index.html` for client-side navigation).
   - Access restriction blocking public viewing of `.sql`, `.env`, and config files.
5. **Change Default Admin Password:**
   Log into the workspace, navigate to **Access & Roles**, and update the administrator password from the default `admin123`.

---

## 💻 Developer Guide: Rebuilding from Source

To make future code modifications and create a new deployment package:

```bash
# 1. Install dependencies
npm install

# 2. Start local development server with mock API
npm run dev

# 3. Validate code quality
npm run lint

# 4. Compile optimized production assets
npm run build

# 5. Package for cPanel upload
cp -r api dist/
cp schema.sql dist/
cp .htaccess dist/
cp -r public/* dist/
(cd dist && zip -qr ../solta_cpanel_upload.zip .)
```

The resulting `solta_cpanel_upload.zip` in your root directory is immediately ready for cPanel File Manager upload.
