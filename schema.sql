-- ==============================================================================
-- Solta Hotel Apartment · Operations
-- MySQL / MariaDB Database Schema for cPanel
-- Compatibility: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. PROPERTIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NULL,
  `name` VARCHAR(80) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. PERMISSION CATALOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permission_catalog` (
  `code` VARCHAR(60) NOT NULL PRIMARY KEY,
  `label` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. ROLE PERMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` VARCHAR(36) NOT NULL,
  `permission_code` VARCHAR(60) NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`role_id`, `permission_code`),
  INDEX (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. USERS & STAFF
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`role_id`),
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. APARTMENTS / UNITS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `units` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'One bedroom',
  `capacity` INT NOT NULL DEFAULT 2,
  `nightly_rate` DECIMAL(12, 2) NOT NULL DEFAULT 3500.00,
  `readiness` ENUM('ready', 'dirty', 'maintenance') NOT NULL DEFAULT 'ready',
  `occupied` TINYINT(1) NOT NULL DEFAULT 0,
  `specs` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. RESERVATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `unit_id` VARCHAR(36) NOT NULL,
  `reference` VARCHAR(50) NOT NULL,
  `guest_name` VARCHAR(120) NOT NULL,
  `guest_phone` VARCHAR(50) NULL,
  `payer_name` VARCHAR(120) NULL,
  `source` VARCHAR(50) NOT NULL DEFAULT 'Direct',
  `rental_type` VARCHAR(30) NOT NULL DEFAULT 'Daily',
  `payment_terms` VARCHAR(50) NOT NULL DEFAULT 'upfront',
  `total_contract_amount` DECIMAL(12, 2) NULL,
  `status` ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `arrival` DATETIME NOT NULL,
  `departure` DATETIME NOT NULL,
  `checked_in_at` DATETIME NULL,
  `checked_out_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. STAY ACCOUNTS & ENTRIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stay_accounts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `reservation_id` VARCHAR(36) NOT NULL UNIQUE,
  `reference` VARCHAR(50) NOT NULL,
  `guest_name` VARCHAR(120) NOT NULL,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `deposit` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stay_account_entries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `account_id` VARCHAR(36) NOT NULL,
  `kind` ENUM('payment', 'deposit', 'refund', 'deposit_refund', 'charge', 'damage_charge') NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_method` VARCHAR(50) NULL,
  `description` VARCHAR(255) NULL,
  `actor` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8b. RESERVATION INSTALLMENT SCHEDULES (LONG-TERM LEASES & PAYMENT PLANS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservation_installments` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. INVENTORY ITEMS & LOCATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `kind` ENUM('consumable', 'durable') NOT NULL DEFAULT 'consumable',
  `unit` VARCHAR(30) NOT NULL DEFAULT 'piece',
  `replacement_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_locations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `kind` ENUM('store', 'cleaner_custody', 'unit') NOT NULL DEFAULT 'store',
  `user_id` VARCHAR(36) NULL,
  `unit_id` VARCHAR(36) NULL,
  INDEX (`property_id`),
  INDEX (`user_id`),
  INDEX (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_stock` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NOT NULL,
  `location_id` VARCHAR(36) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  UNIQUE KEY `item_location` (`item_id`, `location_id`),
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NOT NULL,
  `from_location_id` VARCHAR(36) NULL,
  `to_location_id` VARCHAR(36) NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `actor` VARCHAR(100) NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. HOUSEKEEPING TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `housekeeping_tasks` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `unit_id` VARCHAR(36) NOT NULL,
  `reservation_id` VARCHAR(36) NULL,
  `assignee_id` VARCHAR(36) NULL,
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `reason` VARCHAR(255) NULL,
  `due_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. PAYMENT METHODS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. INSPECTION CHECKLISTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inspection_checklists` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `reservation_id` VARCHAR(36) NOT NULL,
  `type` ENUM('check_in', 'checkout') NOT NULL,
  `data` LONGTEXT NOT NULL,
  `guest_acknowledged` TINYINT(1) NOT NULL DEFAULT 0,
  `acknowledging_guest` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`reservation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `actor` VARCHAR(100) NOT NULL,
  `details` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. EMPLOYEES & HUMAN RESOURCES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `birth_date` DATE NULL,
  `fayda_id` VARCHAR(50) NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(120) NULL,
  `position` VARCHAR(80) NOT NULL,
  `department` VARCHAR(80) NOT NULL DEFAULT 'Operations',
  `employment_type` ENUM('Full-Time', 'Part-Time', 'Contract', 'Probation') NOT NULL DEFAULT 'Full-Time',
  `hire_date` DATE NOT NULL,
  `contract_end_date` DATE NULL,
  `base_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `bank_name` VARCHAR(80) NULL,
  `account_number` VARCHAR(80) NULL,
  `emergency_contact` VARCHAR(150) NULL,
  `status` ENUM('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. OPERATING EXPENSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `payee` VARCHAR(120) NULL,
  `reference_no` VARCHAR(80) NULL,
  `expense_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `recorded_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. UTILITIES TRACKING & BILLING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `utilities` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `utility_type` VARCHAR(60) NOT NULL,
  `provider` VARCHAR(100) NOT NULL,
  `meter_reading_prev` DECIMAL(12, 2) NULL,
  `meter_reading_curr` DECIMAL(12, 2) NULL,
  `consumption_units` DECIMAL(12, 2) NULL,
  `billing_period` VARCHAR(30) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'pending',
  `payment_date` DATE NULL,
  `payment_method` VARCHAR(50) NULL,
  `reference_no` VARCHAR(80) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- SEED DATA: PERMISSIONS CATALOG
-- ==============================================================================
INSERT IGNORE INTO `permission_catalog` (`code`, `label`, `category`) VALUES
('dashboard.view', 'Overview Dashboard', 'General'),
('apartments.view', 'View Apartments', 'Apartments'),
('apartments.manage', 'Create & Edit Apartments', 'Apartments'),
('reservations.view', 'View Bookings', 'Bookings'),
('reservations.create', 'Create New Booking', 'Bookings'),
('reservations.check_in', 'Perform Guest Check-in', 'Bookings'),
('reservations.check_out', 'Perform Guest Checkout', 'Bookings'),
('reservations.extend', 'Extend Guest Stay', 'Bookings'),
('reservations.cancel', 'Cancel Booking', 'Bookings'),
('inspections.check_in', 'Check-in Inventory Checklist', 'Inspections'),
('inspections.check_out', 'Checkout Damage Inspection', 'Inspections'),
('inspections.review_incidents', 'Review & Resolve Incidents', 'Inspections'),
('checkout.approve_unpaid', 'Approve Checkout with Unpaid Balance', 'Inspections'),
('finance.view', 'View Finance & Reports', 'Finance'),
('finance.record_payment', 'Record Guest Payment', 'Finance'),
('finance.deposit', 'Receive Guest Deposit', 'Finance'),
('finance.refund', 'Issue Cash Refund', 'Finance'),
('finance.post_charge', 'Post Extra Room Charge', 'Finance'),
('finance.approve_damage_charge', 'Approve Damage Charge', 'Finance'),
('inventory.view', 'View Stock & Custody', 'Inventory'),
('inventory.receive', 'Receive Central Store Stock', 'Inventory'),
('inventory.issue_to_cleaner', 'Issue Stock to Cleaner Cart', 'Inventory'),
('inventory.issue_to_apartment', 'Supply Stock to Apartment', 'Inventory'),
('inventory.return', 'Return Stock to Store', 'Inventory'),
('inventory.manage_items', 'Create & Manage Item Catalog', 'Inventory'),
('inventory.manage_prices', 'Configure Replacement Prices', 'Inventory'),
('inventory.view_all_custody', 'View All Staff Custody', 'Inventory'),
('inventory.manage_apartment_standards', 'Manage Room Standards', 'Inventory'),
('housekeeping.view', 'View Housekeeping Schedule', 'Housekeeping'),
('housekeeping.assign', 'Assign Cleaning Tasks', 'Housekeeping'),
('housekeeping.inspect', 'Inspect Cleaned Apartments', 'Housekeeping'),
('housekeeping.update_assigned', 'Update Task Status', 'Housekeeping'),
('users.manage', 'Manage Staff & Accounts', 'Administration'),
('roles.manage', 'Manage Roles & Permissions', 'Administration'),
('management.view', 'View Management, Expenses & HR', 'Management'),
('employees.manage', 'Add, Edit & Manage Employees', 'Management'),
('expenses.manage', 'Record & Manage Operating Expenses', 'Management'),
('utilities.manage', 'Track & Record Utility Bills', 'Management'),
('audit.view', 'View Audit History Log', 'Administration');

-- ==============================================================================
-- SEED DATA: PROPERTIES
-- ==============================================================================
INSERT IGNORE INTO `properties` (`id`, `name`, `currency`, `timezone`) VALUES
('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Solta Hotel Apartment', 'ETB', 'Africa/Addis_Ababa');

-- ==============================================================================
-- SEED DATA: ROLES & ADMIN USER (password: admin123)
-- Hash generated via password_hash('admin123', PASSWORD_BCRYPT)
-- ==============================================================================
INSERT IGNORE INTO `roles` (`id`, `property_id`, `name`) VALUES
('def28ddb-4a03-44a2-a540-cf49c8ffea1c', NULL, 'Administrator'),
('role-manager', NULL, 'Manager'),
('role-reception', NULL, 'Reception'),
('role-housekeeping', NULL, 'Housekeeping'),
('role-storekeeper', NULL, 'Storekeeper'),
('role-finance', NULL, 'Finance');

-- Grant all permissions to Administrator
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_code`, `enabled`)
SELECT 'def28ddb-4a03-44a2-a540-cf49c8ffea1c', `code`, 1 FROM `permission_catalog`;

-- Grant permissions for other roles
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_code`, `enabled`)
SELECT 'role-manager', `code`, 1 FROM `permission_catalog`;

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_code`, `enabled`) VALUES
('role-reception', 'dashboard.view', 1),
('role-reception', 'apartments.view', 1),
('role-reception', 'reservations.view', 1),
('role-reception', 'reservations.create', 1),
('role-reception', 'reservations.check_in', 1),
('role-reception', 'reservations.check_out', 1),
('role-reception', 'reservations.extend', 1),
('role-reception', 'inspections.check_in', 1),
('role-reception', 'inspections.check_out', 1),
('role-reception', 'finance.view', 1),
('role-reception', 'finance.record_payment', 1),
('role-reception', 'finance.deposit', 1),
('role-housekeeping', 'housekeeping.view', 1),
('role-housekeeping', 'housekeeping.update_assigned', 1),
('role-housekeeping', 'inventory.view', 1),
('role-storekeeper', 'inventory.view', 1),
('role-storekeeper', 'inventory.receive', 1),
('role-storekeeper', 'inventory.issue_to_cleaner', 1),
('role-storekeeper', 'inventory.issue_to_apartment', 1),
('role-storekeeper', 'inventory.return', 1),
('role-finance', 'finance.view', 1),
('role-finance', 'finance.record_payment', 1),
('role-finance', 'finance.deposit', 1),
('role-finance', 'finance.refund', 1),
('role-finance', 'finance.approve_damage_charge', 1);

-- Default Super Administrator (admin@gmail.com / admin123)
INSERT IGNORE INTO `users` (`id`, `property_id`, `name`, `email`, `password_hash`, `role_id`) VALUES
('b8d4ef68-1cef-4acd-a960-5c17f1d66c5c', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Administrator', 'admin@gmail.com', '$2y$10$eE.l1y412V/eO501GqO8Q.7iI9vL2U58p0mXkHjG7o1k1xZfT2Cqm', 'def28ddb-4a03-44a2-a540-cf49c8ffea1c');

-- Payment Methods
INSERT IGNORE INTO `payment_methods` (`id`, `property_id`, `name`, `active`) VALUES
('pm-3', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Telebirr', 1),
('pm-4', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Cash', 1),
('pm-5', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'CBE Birr', 1),
('pm-6', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Bank Transfer / CPO', 1);

-- Solta Hotel Initial Units
INSERT IGNORE INTO `units` (`id`, `property_id`, `code`, `category`, `capacity`, `nightly_rate`, `readiness`, `occupied`) VALUES
('u-solta-101', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'SOLTA-101', 'One bedroom', 2, 3500.00, 'ready', 0),
('u-solta-102', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'SOLTA-102', 'One bedroom', 2, 3500.00, 'ready', 0),
('u-solta-201', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'SOLTA-201', 'Two bedroom', 4, 5500.00, 'ready', 0),
('u-solta-301', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'SOLTA-301', 'Three bedroom', 6, 8000.00, 'ready', 0);

-- Inventory Items Catalog
INSERT IGNORE INTO `inventory_items` (`id`, `property_id`, `name`, `kind`, `unit`, `replacement_price`) VALUES
('it-1', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Soap', 'consumable', 'bar', 0.00),
('it-2', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Toilet paper', 'consumable', 'roll', 0.00),
('it-3', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Bath towel', 'durable', 'piece', 900.00),
('it-4', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Drinking glass', 'durable', 'piece', 250.00),
('it-5', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Remote control', 'durable', 'piece', 1200.00),
('it-6', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Television', 'durable', 'piece', 25000.00),
-- Solta Property Items
('it-s1', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Luxury Bath Soap (Botanical)', 'consumable', 'bar', 80.00),
('it-s2', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Premium Toilet Paper (2-Ply)', 'consumable', 'roll', 60.00),
('it-s3', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Luxury Bath Towel (White 700 GSM)', 'durable', 'piece', 1200.00),
('it-s4', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Drinking Glass Tumbler', 'durable', 'piece', 250.00),
('it-s5', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Hand Towel (White Cotton)', 'durable', 'piece', 450.00),
('it-s6', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'King Bed Sheet Set (400TC Egyptian)', 'durable', 'set', 3500.00),
('it-s7', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Queen Bed Sheet Set', 'durable', 'set', 2800.00),
('it-s8', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Memory Foam Pillow & Luxury Case', 'durable', 'piece', 1500.00),
('it-s9', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Plush Terry Bathrobe', 'durable', 'piece', 2200.00),
('it-s10', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Bottled Spring Water (1L)', 'consumable', 'bottle', 60.00),
('it-s11', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Ethiopian Roast Coffee & Tea Set', 'consumable', 'pack', 150.00),
('it-s12', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Herbal Shampoo & Body Wash', 'consumable', 'bottle', 120.00),
('it-s13', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Dental & Shaving Hygiene Kit', 'consumable', 'kit', 110.00),
('it-s14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Smart LED TV 55" 4K UHD', 'durable', 'unit', 48000.00),
('it-s15', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Microwave Oven (Digital 25L)', 'durable', 'unit', 18500.00),
('it-s16', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Electric Kettle (Cordless Stainless)', 'durable', 'unit', 3200.00),
('it-s17', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Electronic Digital Room Safe', 'durable', 'unit', 9500.00),
('it-s18', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Steam Iron & Ironing Board', 'durable', 'set', 5500.00),
('it-s19', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Non-Stick Cookware Set (5-pc)', 'durable', 'set', 8500.00),
('it-s20', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Porcelain Dinnerware & Cutlery Set', 'durable', 'set', 4200.00),
('it-s21', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Multi-Surface Floor Disinfectant (5L)', 'consumable', 'canister', 1200.00),
('it-s22', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Heavy-Duty Waste Liners (50-roll)', 'consumable', 'roll', 350.00);

-- Inventory Locations (Central Store & Cleaner Custody)
INSERT IGNORE INTO `inventory_locations` (`id`, `property_id`, `name`, `kind`, `user_id`, `unit_id`) VALUES
('loc-store-1', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'Central Store', 'store', NULL, NULL),
('loc-store-solta', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Central Store (Ground Floor)', 'store', NULL, NULL),
('loc-cart-solta', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Housekeeping Mobile Cart A', 'cleaner_custody', 'b8d4ef68-1cef-4acd-a960-5c17f1d66c5c', NULL),
('loc-unit-101', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Apartment SOLTA-101', 'unit', NULL, 'u-solta-101'),
('loc-unit-102', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Apartment SOLTA-102', 'unit', NULL, 'u-solta-102'),
('loc-unit-201', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Apartment SOLTA-201', 'unit', NULL, 'u-solta-201'),
('loc-unit-301', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Apartment SOLTA-301', 'unit', NULL, 'u-solta-301');

-- Initial Stock Balances
INSERT IGNORE INTO `inventory_stock` (`id`, `property_id`, `item_id`, `location_id`, `quantity`) VALUES
('st-1', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'it-1', 'loc-store-1', 60.00),
('st-2', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'it-2', 'loc-store-1', 70.00),
('st-3', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'it-3', 'loc-store-1', 18.00),
('st-4', '52b13c3e-b0d0-4742-b920-b11035779aa2', 'it-4', 'loc-store-1', 24.00),
('st-s1', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s1', 'loc-store-solta', 140.00),
('st-s2', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s2', 'loc-store-solta', 180.00),
('st-s3', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s3', 'loc-store-solta', 45.00),
('st-s4', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s4', 'loc-store-solta', 38.00),
('st-s5', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s5', 'loc-store-solta', 32.00),
('st-s6', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s6', 'loc-store-solta', 18.00),
('st-s7', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s7', 'loc-store-solta', 22.00),
('st-s8', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s8', 'loc-store-solta', 26.00),
('st-s9', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s9', 'loc-store-solta', 12.00),
('st-s10', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s10', 'loc-store-solta', 120.00),
('st-s11', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s11', 'loc-store-solta', 95.00),
('st-s12', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s12', 'loc-store-solta', 85.00),
('st-s13', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s13', 'loc-store-solta', 60.00),
('st-s14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s14', 'loc-store-solta', 2.00),
('st-s15', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s15', 'loc-store-solta', 2.00),
('st-s16', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s16', 'loc-store-solta', 4.00),
('st-s17', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s17', 'loc-store-solta', 2.00),
('st-s18', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s18', 'loc-store-solta', 3.00),
('st-s19', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s19', 'loc-store-solta', 3.00),
('st-s20', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s20', 'loc-store-solta', 5.00),
('st-s21', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s21', 'loc-store-solta', 8.00),
('st-s22', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s22', 'loc-store-solta', 18.00),
('st-c1', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s1', 'loc-cart-solta', 24.00),
('st-c2', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s2', 'loc-cart-solta', 20.00),
('st-c3', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s3', 'loc-cart-solta', 12.00),
('st-u101-14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s14', 'loc-unit-101', 1.00),
('st-u101-15', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s15', 'loc-unit-101', 1.00),
('st-u101-16', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s16', 'loc-unit-101', 1.00),
('st-u101-17', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s17', 'loc-unit-101', 1.00),
('st-u102-14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s14', 'loc-unit-102', 1.00),
('st-u201-14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s14', 'loc-unit-201', 2.00),
('st-u301-14', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'it-s14', 'loc-unit-301', 3.00);

-- Maintenance Records & Downtime History
CREATE TABLE IF NOT EXISTS `maintenance_records` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `maintenance_records` (`id`, `property_id`, `unit_id`, `unit_code`, `issue`, `technician`, `duration_est`, `actual_duration`, `cost`, `status`, `start_date`, `resolved_date`, `notes`) VALUES
('maint-solta-1', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'u-solta-102', 'SOLTA-102', 'Master bedroom AC compressor service & refrigerant top-up', 'Kebede HVAC Engineering', '6 hours', '5 hours 30 mins', 1800.00, 'resolved', '2026-11-05 09:00:00', '2026-11-05 14:30:00', 'Cooling coils cleaned, pressure tested at 120 PSI, 100% operational.'),
('maint-solta-2', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'u-solta-201', 'SOLTA-201', 'Thermostatic shower mixer replacement & silicone resealing', 'Solta In-House Maintenance', '1 day', '1 day 2 hours', 3200.00, 'resolved', '2026-11-02 10:00:00', '2026-11-03 12:00:00', 'Replaced brass mixer unit, cured silicone for 24h, tested with zero leaks.'),
('maint-solta-3', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'u-solta-301', 'SOLTA-301', 'Balcony sliding door roller track alignment & handle latch lock', 'Addis Glass & Aluminum Works', '4 hours', '4 hours', 1200.00, 'resolved', '2026-10-25 11:00:00', '2026-10-25 15:00:00', 'Heavy rollers replaced, track lubricated with teflon spray.'),
('maint-solta-4', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'u-solta-101', 'SOLTA-101', 'Living room Smart TV wall bracket reinforcement & HDMI routing', 'Solta IT/AV Specialist', '3 hours', '2 hours 45 mins', 650.00, 'resolved', '2026-10-18 14:00:00', '2026-10-18 16:45:00', 'Mounted with M8 lag anchors, concealed cabling.');

-- Audit Log Initial Event
INSERT IGNORE INTO `audit_log` (`id`, `property_id`, `action`, `actor`, `details`) VALUES
('aud-2', 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'system.initialized', 'System', '{"message":"Solta Hotel Apartment production workspace ready"}');

-- Executive Approver Governance Settings
CREATE TABLE IF NOT EXISTS `approver_settings` (
  `property_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `approver_id` VARCHAR(36) NULL,
  `approver_name` VARCHAR(128) NOT NULL DEFAULT 'Solta Administrator',
  `approver_email` VARCHAR(128) NOT NULL DEFAULT 'admin@gmail.com',
  `mode` ENUM('required', 'optional') NOT NULL DEFAULT 'required',
  `early_booking_approval` BOOLEAN NOT NULL DEFAULT TRUE,
  `inventory_deficit_approval` BOOLEAN NOT NULL DEFAULT TRUE,
  `payment_verification` BOOLEAN NOT NULL DEFAULT TRUE,
  `notify_new_booking` BOOLEAN NOT NULL DEFAULT TRUE,
  `notify_expired_booking` BOOLEAN NOT NULL DEFAULT TRUE,
  `notify_stock_movement` BOOLEAN NOT NULL DEFAULT TRUE,
  `notify_payment` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `approver_settings` (`property_id`, `approver_name`, `approver_email`, `mode`) VALUES
('db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', 'Solta Administrator', 'admin@gmail.com', 'required');

-- System Notifications & Activity Alert Ledger
CREATE TABLE IF NOT EXISTS `system_notifications` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `property_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `entity_id` VARCHAR(64) NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'info') NOT NULL DEFAULT 'pending',
  `required_approval` BOOLEAN NOT NULL DEFAULT FALSE,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`property_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
