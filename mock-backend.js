import crypto from 'node:crypto';

// Initial Data Structures based on schema.sql
export function createInitialState() {
  const propertySolta = {
    id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
    name: 'Solta Hotel Apartment',
    currency: 'ETB',
    timezone: 'Africa/Addis_Ababa',
    role: 'Administrator'
  };

  const propertyDemo = {
    id: '52b13c3e-b0d0-4742-b920-b11035779aa2',
    name: 'Flow Playground · Demo',
    currency: 'ETB',
    timezone: 'Africa/Addis_Ababa',
    role: 'Administrator'
  };

  const properties = [propertySolta, propertyDemo];

  const roles = [
    { id: 'def28ddb-4a03-44a2-a540-cf49c8ffea1c', property_id: null, name: 'Administrator' },
    { id: 'role-manager', property_id: null, name: 'Manager' },
    { id: 'role-reception', property_id: null, name: 'Reception' },
    { id: 'role-housekeeping', property_id: null, name: 'Housekeeping' },
    { id: 'role-storekeeper', property_id: null, name: 'Storekeeper' },
    { id: 'role-finance', property_id: null, name: 'Finance' }
  ];

  const permissionCatalog = [
    { code: 'dashboard.view', label: 'Overview Dashboard', category: 'General' },
    { code: 'apartments.view', label: 'View Apartments', category: 'Apartments' },
    { code: 'apartments.manage', label: 'Create & Edit Apartments', category: 'Apartments' },
    { code: 'reservations.view', label: 'View Bookings', category: 'Bookings' },
    { code: 'reservations.create', label: 'Create New Booking', category: 'Bookings' },
    { code: 'reservations.check_in', label: 'Perform Guest Check-in', category: 'Bookings' },
    { code: 'reservations.check_out', label: 'Perform Guest Checkout', category: 'Bookings' },
    { code: 'reservations.extend', label: 'Extend Guest Stay', category: 'Bookings' },
    { code: 'reservations.cancel', label: 'Cancel Booking', category: 'Bookings' },
    { code: 'inspections.check_in', label: 'Check-in Inventory Checklist', category: 'Inspections' },
    { code: 'inspections.check_out', label: 'Checkout Damage Inspection', category: 'Inspections' },
    { code: 'inspections.review_incidents', label: 'Review & Resolve Incidents', category: 'Inspections' },
    { code: 'checkout.approve_unpaid', label: 'Approve Checkout with Unpaid Balance', category: 'Inspections' },
    { code: 'finance.view', label: 'View Finance & Reports', category: 'Finance' },
    { code: 'finance.record_payment', label: 'Record Guest Payment', category: 'Finance' },
    { code: 'finance.deposit', label: 'Receive Guest Deposit', category: 'Finance' },
    { code: 'finance.refund', label: 'Issue Cash Refund', category: 'Finance' },
    { code: 'finance.post_charge', label: 'Post Extra Room Charge', category: 'Finance' },
    { code: 'finance.approve_damage_charge', label: 'Approve Damage Charge', category: 'Finance' },
    { code: 'inventory.view', label: 'View Stock & Custody', category: 'Inventory' },
    { code: 'inventory.receive', label: 'Receive Central Store Stock', category: 'Inventory' },
    { code: 'inventory.issue_to_cleaner', label: 'Issue Stock to Cleaner Cart', category: 'Inventory' },
    { code: 'inventory.issue_to_apartment', label: 'Supply Stock to Apartment', category: 'Inventory' },
    { code: 'inventory.return', label: 'Return Stock to Store', category: 'Inventory' },
    { code: 'inventory.manage_items', label: 'Create & Manage Item Catalog', category: 'Inventory' },
    { code: 'inventory.manage_prices', label: 'Configure Replacement Prices', category: 'Inventory' },
    { code: 'inventory.view_all_custody', label: 'View All Staff Custody', category: 'Inventory' },
    { code: 'inventory.manage_apartment_standards', label: 'Manage Room Standards', category: 'Inventory' },
    { code: 'housekeeping.view', label: 'View Housekeeping Schedule', category: 'Housekeeping' },
    { code: 'housekeeping.assign', label: 'Assign Cleaning Tasks', category: 'Housekeeping' },
    { code: 'housekeeping.inspect', label: 'Inspect Cleaned Apartments', category: 'Housekeeping' },
    { code: 'housekeeping.update_assigned', label: 'Update Task Status', category: 'Housekeeping' },
    { code: 'management.view', label: 'View Management & Operations', category: 'Management' },
    { code: 'employees.manage', label: 'Manage Human Resources & Employees', category: 'Management' },
    { code: 'expenses.manage', label: 'Manage Operating Expenses', category: 'Management' },
    { code: 'utilities.manage', label: 'Manage Utilities & Meter Readings', category: 'Management' },
    { code: 'users.manage', label: 'Manage Staff Logins & Accounts', category: 'Administration' },
    { code: 'roles.manage', label: 'Manage Roles & Permissions', category: 'Administration' },
    { code: 'audit.view', label: 'View Audit History Log', category: 'Administration' }
  ];

  const rolePermissions = [];
  permissionCatalog.forEach(p => {
    rolePermissions.push({ role_id: 'def28ddb-4a03-44a2-a540-cf49c8ffea1c', permission_code: p.code, enabled: true });
    rolePermissions.push({ role_id: 'role-manager', permission_code: p.code, enabled: true });
  });

  const receptionPerms = ['dashboard.view', 'apartments.view', 'reservations.view', 'reservations.create', 'reservations.check_in', 'reservations.check_out', 'reservations.extend', 'inspections.check_in', 'inspections.check_out', 'finance.view', 'finance.record_payment', 'finance.deposit'];
  receptionPerms.forEach(c => rolePermissions.push({ role_id: 'role-reception', permission_code: c, enabled: true }));

  const hkPerms = ['housekeeping.view', 'housekeeping.update_assigned', 'inventory.view'];
  hkPerms.forEach(c => rolePermissions.push({ role_id: 'role-housekeeping', permission_code: c, enabled: true }));

  const storePerms = ['inventory.view', 'inventory.receive', 'inventory.issue_to_cleaner', 'inventory.issue_to_apartment', 'inventory.return'];
  storePerms.forEach(c => rolePermissions.push({ role_id: 'role-storekeeper', permission_code: c, enabled: true }));

  const finPerms = ['finance.view', 'finance.record_payment', 'finance.deposit', 'finance.refund', 'finance.approve_damage_charge', 'management.view', 'expenses.manage', 'utilities.manage'];
  finPerms.forEach(c => rolePermissions.push({ role_id: 'role-finance', permission_code: c, enabled: true }));

  // Only real administrator account (no demo employee logins)
  const users = [
    {
      id: 'b8d4ef68-1cef-4acd-a960-5c17f1d66c5c',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      name: 'Administrator',
      email: 'admin@gmail.com',
      password: 'admin123',
      role_id: 'def28ddb-4a03-44a2-a540-cf49c8ffea1c'
    }
  ];

  const paymentMethods = [
    { id: 'pm-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Telebirr', active: true },
    { id: 'pm-2', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'PayPal', active: true },
    { id: 'pm-3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Telebirr', active: true },
    { id: 'pm-4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Cash', active: true }
  ];

  const units = [
    { id: 'u-101', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-101', category: 'One bedroom', capacity: 2, nightly_rate: 3500.0, readiness: 'ready', occupied: false },
    { id: 'u-102', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-102', category: 'One bedroom', capacity: 2, nightly_rate: 3500.0, readiness: 'ready', occupied: true },
    { id: 'u-103', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-103', category: 'One bedroom', capacity: 2, nightly_rate: 3500.0, readiness: 'ready', occupied: true },
    { id: 'u-104', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-104', category: 'Two bedroom', capacity: 4, nightly_rate: 5500.0, readiness: 'dirty', occupied: false },
    { id: 'u-105', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-105', category: 'Two bedroom', capacity: 4, nightly_rate: 5500.0, readiness: 'ready', occupied: false },
    { id: 'u-106', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', code: 'DEMO-106', category: 'Three bedroom', capacity: 6, nightly_rate: 8000.0, readiness: 'ready', occupied: false },
    { id: 'u-solta-101', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', code: 'SOLTA-101', category: 'One bedroom', capacity: 2, nightly_rate: 3500.0, readiness: 'ready', occupied: true, mode: 'occupied' },
    { id: 'u-solta-102', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', code: 'SOLTA-102', category: 'One bedroom', capacity: 2, nightly_rate: 3500.0, readiness: 'booked', occupied: false, mode: 'booked' },
    { id: 'u-solta-201', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', code: 'SOLTA-201', category: 'Two bedroom', capacity: 4, nightly_rate: 5500.0, readiness: 'ready', occupied: false, mode: 'ready' },
    { id: 'u-solta-301', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', code: 'SOLTA-301', category: 'Three bedroom', capacity: 6, nightly_rate: 8000.0, readiness: 'ready', occupied: false, mode: 'ready' }
  ];

  const items = [
    { id: 'it-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Soap', kind: 'consumable', unit: 'bar', replacement_price: 0 },
    { id: 'it-2', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Toilet paper', kind: 'consumable', unit: 'roll', replacement_price: 0 },
    { id: 'it-3', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Bath towel', kind: 'durable', unit: 'piece', replacement_price: 900.0 },
    { id: 'it-4', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Drinking glass', kind: 'durable', unit: 'piece', replacement_price: 250.0 },
    { id: 'it-5', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Remote control', kind: 'durable', unit: 'piece', replacement_price: 1200.0 },
    { id: 'it-6', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Television', kind: 'durable', unit: 'piece', replacement_price: 25000.0 },
    // Solta Luxury Serviced Hotel Apartment Inventory Catalog
    { id: 'it-s1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Luxury Bath Soap (Botanical)', category: 'Toiletries & Amenities', kind: 'consumable', unit: 'bar', min_stock: 30, replacement_price: 80.0 },
    { id: 'it-s2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Premium Toilet Paper (2-Ply)', category: 'Toiletries & Amenities', kind: 'consumable', unit: 'roll', min_stock: 40, replacement_price: 60.0 },
    { id: 'it-s3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Luxury Bath Towel (White 700 GSM)', category: 'Linens & Bedding', kind: 'durable', unit: 'piece', min_stock: 15, replacement_price: 1200.0 },
    { id: 'it-s4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Drinking Glass Tumbler', category: 'Kitchen & Dining', kind: 'durable', unit: 'piece', min_stock: 20, replacement_price: 250.0 },
    { id: 'it-s5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Hand Towel (White Cotton)', category: 'Linens & Bedding', kind: 'durable', unit: 'piece', min_stock: 15, replacement_price: 450.0 },
    { id: 'it-s6', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'King Bed Sheet Set (400TC Egyptian)', category: 'Linens & Bedding', kind: 'durable', unit: 'set', min_stock: 8, replacement_price: 3500.0 },
    { id: 'it-s7', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Queen Bed Sheet Set', category: 'Linens & Bedding', kind: 'durable', unit: 'set', min_stock: 8, replacement_price: 2800.0 },
    { id: 'it-s8', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Memory Foam Pillow & Luxury Case', category: 'Linens & Bedding', kind: 'durable', unit: 'piece', min_stock: 10, replacement_price: 1500.0 },
    { id: 'it-s9', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Plush Terry Bathrobe', category: 'Linens & Bedding', kind: 'durable', unit: 'piece', min_stock: 6, replacement_price: 2200.0 },
    { id: 'it-s10', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Bottled Spring Water (1L)', category: 'Beverages & Pantry', kind: 'consumable', unit: 'bottle', min_stock: 50, replacement_price: 60.0 },
    { id: 'it-s11', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Ethiopian Roast Coffee & Tea Set', category: 'Beverages & Pantry', kind: 'consumable', unit: 'pack', min_stock: 40, replacement_price: 150.0 },
    { id: 'it-s12', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Herbal Shampoo & Body Wash', category: 'Toiletries & Amenities', kind: 'consumable', unit: 'bottle', min_stock: 30, replacement_price: 120.0 },
    { id: 'it-s13', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Dental & Shaving Hygiene Kit', category: 'Toiletries & Amenities', kind: 'consumable', unit: 'kit', min_stock: 25, replacement_price: 110.0 },
    { id: 'it-s14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Smart LED TV 55" 4K UHD', category: 'Electronics & Appliances', kind: 'durable', unit: 'unit', min_stock: 2, replacement_price: 48000.0 },
    { id: 'it-s15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Microwave Oven (Digital 25L)', category: 'Electronics & Appliances', kind: 'durable', unit: 'unit', min_stock: 2, replacement_price: 18500.0 },
    { id: 'it-s16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Electric Kettle (Cordless Stainless)', category: 'Electronics & Appliances', kind: 'durable', unit: 'unit', min_stock: 3, replacement_price: 3200.0 },
    { id: 'it-s17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Electronic Digital Room Safe', category: 'Electronics & Appliances', kind: 'durable', unit: 'unit', min_stock: 2, replacement_price: 9500.0 },
    { id: 'it-s18', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Steam Iron & Ironing Board', category: 'Electronics & Appliances', kind: 'durable', unit: 'set', min_stock: 2, replacement_price: 5500.0 },
    { id: 'it-s19', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Non-Stick Cookware Set (5-pc)', category: 'Kitchen & Dining', kind: 'durable', unit: 'set', min_stock: 2, replacement_price: 8500.0 },
    { id: 'it-s20', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Porcelain Dinnerware & Cutlery Set', category: 'Kitchen & Dining', kind: 'durable', unit: 'set', min_stock: 3, replacement_price: 4200.0 },
    { id: 'it-s21', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Multi-Surface Floor Disinfectant (5L)', category: 'Cleaning Supplies', kind: 'consumable', unit: 'canister', min_stock: 5, replacement_price: 1200.0 },
    { id: 'it-s22', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Heavy-Duty Waste Liners (50-roll)', category: 'Cleaning Supplies', kind: 'consumable', unit: 'roll', min_stock: 10, replacement_price: 350.0 }
  ];

  const locations = [
    { id: 'loc-store-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', name: 'Central Store', kind: 'store', user_id: null, unit_id: null },
    { id: 'loc-store-solta', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Central Store (Ground Floor)', kind: 'store', user_id: null, unit_id: null },
    { id: 'loc-cart-solta', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Housekeeping Mobile Cart A', kind: 'cleaner_custody', user_id: 'b8d4ef68-1cef-4acd-a960-5c17f1d66c5c', unit_id: null },
    { id: 'loc-unit-101', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Apartment SOLTA-101', kind: 'unit', user_id: null, unit_id: 'u-solta-101' },
    { id: 'loc-unit-102', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Apartment SOLTA-102', kind: 'unit', user_id: null, unit_id: 'u-solta-102' },
    { id: 'loc-unit-201', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Apartment SOLTA-201', kind: 'unit', user_id: null, unit_id: 'u-solta-201' },
    { id: 'loc-unit-301', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', name: 'Apartment SOLTA-301', kind: 'unit', user_id: null, unit_id: 'u-solta-301' }
  ];

  const stock = [
    { id: 'st-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', item_id: 'it-1', location_id: 'loc-store-1', quantity: 60.0, item_name: 'Soap', location_name: 'Central Store' },
    { id: 'st-2', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', item_id: 'it-2', location_id: 'loc-store-1', quantity: 70.0, item_name: 'Toilet paper', location_name: 'Central Store' },
    { id: 'st-3', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', item_id: 'it-3', location_id: 'loc-store-1', quantity: 18.0, item_name: 'Bath towel', location_name: 'Central Store' },
    { id: 'st-4', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', item_id: 'it-4', location_id: 'loc-store-1', quantity: 24.0, item_name: 'Drinking glass', location_name: 'Central Store' },

    // Central Store Balances (Solta)
    { id: 'st-s1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s1', location_id: 'loc-store-solta', quantity: 140.0, item_name: 'Luxury Bath Soap (Botanical)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s2', location_id: 'loc-store-solta', quantity: 180.0, item_name: 'Premium Toilet Paper (2-Ply)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s3', location_id: 'loc-store-solta', quantity: 45.0, item_name: 'Luxury Bath Towel (White 700 GSM)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s4', location_id: 'loc-store-solta', quantity: 38.0, item_name: 'Drinking Glass Tumbler', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s5', location_id: 'loc-store-solta', quantity: 32.0, item_name: 'Hand Towel (White Cotton)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s6', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s6', location_id: 'loc-store-solta', quantity: 18.0, item_name: 'King Bed Sheet Set (400TC Egyptian)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s7', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s7', location_id: 'loc-store-solta', quantity: 22.0, item_name: 'Queen Bed Sheet Set', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s8', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s8', location_id: 'loc-store-solta', quantity: 26.0, item_name: 'Memory Foam Pillow & Luxury Case', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s9', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s9', location_id: 'loc-store-solta', quantity: 12.0, item_name: 'Plush Terry Bathrobe', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s10', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s10', location_id: 'loc-store-solta', quantity: 120.0, item_name: 'Bottled Spring Water (1L)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s11', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s11', location_id: 'loc-store-solta', quantity: 95.0, item_name: 'Ethiopian Roast Coffee & Tea Set', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s12', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s12', location_id: 'loc-store-solta', quantity: 85.0, item_name: 'Herbal Shampoo & Body Wash', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s13', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s13', location_id: 'loc-store-solta', quantity: 60.0, item_name: 'Dental & Shaving Hygiene Kit', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', location_id: 'loc-store-solta', quantity: 2.0, item_name: 'Smart LED TV 55" 4K UHD', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', location_id: 'loc-store-solta', quantity: 2.0, item_name: 'Microwave Oven (Digital 25L)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', location_id: 'loc-store-solta', quantity: 4.0, item_name: 'Electric Kettle (Cordless Stainless)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s17', location_id: 'loc-store-solta', quantity: 2.0, item_name: 'Electronic Digital Room Safe', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s18', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s18', location_id: 'loc-store-solta', quantity: 3.0, item_name: 'Steam Iron & Ironing Board', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s19', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s19', location_id: 'loc-store-solta', quantity: 3.0, item_name: 'Non-Stick Cookware Set (5-pc)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s20', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s20', location_id: 'loc-store-solta', quantity: 5.0, item_name: 'Porcelain Dinnerware & Cutlery Set', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s21', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s21', location_id: 'loc-store-solta', quantity: 8.0, item_name: 'Multi-Surface Floor Disinfectant (5L)', location_name: 'Central Store (Ground Floor)' },
    { id: 'st-s22', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s22', location_id: 'loc-store-solta', quantity: 18.0, item_name: 'Heavy-Duty Waste Liners (50-roll)', location_name: 'Central Store (Ground Floor)' },

    // Cleaner Mobile Cart Custody
    { id: 'st-c1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s1', location_id: 'loc-cart-solta', quantity: 24.0, item_name: 'Luxury Bath Soap (Botanical)', location_name: 'Housekeeping Mobile Cart A' },
    { id: 'st-c2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s2', location_id: 'loc-cart-solta', quantity: 20.0, item_name: 'Premium Toilet Paper (2-Ply)', location_name: 'Housekeeping Mobile Cart A' },
    { id: 'st-c3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s3', location_id: 'loc-cart-solta', quantity: 12.0, item_name: 'Luxury Bath Towel (White 700 GSM)', location_name: 'Housekeeping Mobile Cart A' },
    { id: 'st-c5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s5', location_id: 'loc-cart-solta', quantity: 10.0, item_name: 'Hand Towel (White Cotton)', location_name: 'Housekeeping Mobile Cart A' },
    { id: 'st-c10', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s10', location_id: 'loc-cart-solta', quantity: 24.0, item_name: 'Bottled Spring Water (1L)', location_name: 'Housekeeping Mobile Cart A' },
    { id: 'st-c12', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s12', location_id: 'loc-cart-solta', quantity: 18.0, item_name: 'Herbal Shampoo & Body Wash', location_name: 'Housekeeping Mobile Cart A' },

    // In-Room Apartment Placements (SOLTA-101, 102, 201, 301)
    { id: 'st-u101-14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'Smart LED TV 55" 4K UHD', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'Microwave Oven (Digital 25L)', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'Electric Kettle (Cordless Stainless)', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s17', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'Electronic Digital Room Safe', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-18', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s18', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'Steam Iron & Ironing Board', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-6', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s6', location_id: 'loc-unit-101', quantity: 1.0, item_name: 'King Bed Sheet Set (400TC Egyptian)', location_name: 'Apartment SOLTA-101' },
    { id: 'st-u101-3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s3', location_id: 'loc-unit-101', quantity: 2.0, item_name: 'Luxury Bath Towel (White 700 GSM)', location_name: 'Apartment SOLTA-101' },

    { id: 'st-u102-14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', location_id: 'loc-unit-102', quantity: 1.0, item_name: 'Smart LED TV 55" 4K UHD', location_name: 'Apartment SOLTA-102' },
    { id: 'st-u102-15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', location_id: 'loc-unit-102', quantity: 1.0, item_name: 'Microwave Oven (Digital 25L)', location_name: 'Apartment SOLTA-102' },
    { id: 'st-u102-16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', location_id: 'loc-unit-102', quantity: 1.0, item_name: 'Electric Kettle (Cordless Stainless)', location_name: 'Apartment SOLTA-102' },
    { id: 'st-u102-17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s17', location_id: 'loc-unit-102', quantity: 1.0, item_name: 'Electronic Digital Room Safe', location_name: 'Apartment SOLTA-102' },

    { id: 'st-u201-14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', location_id: 'loc-unit-201', quantity: 2.0, item_name: 'Smart LED TV 55" 4K UHD', location_name: 'Apartment SOLTA-201' },
    { id: 'st-u201-15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', location_id: 'loc-unit-201', quantity: 1.0, item_name: 'Microwave Oven (Digital 25L)', location_name: 'Apartment SOLTA-201' },
    { id: 'st-u201-16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', location_id: 'loc-unit-201', quantity: 1.0, item_name: 'Electric Kettle (Cordless Stainless)', location_name: 'Apartment SOLTA-201' },
    { id: 'st-u201-17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s17', location_id: 'loc-unit-201', quantity: 1.0, item_name: 'Electronic Digital Room Safe', location_name: 'Apartment SOLTA-201' },

    { id: 'st-u301-14', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', location_id: 'loc-unit-301', quantity: 3.0, item_name: 'Smart LED TV 55" 4K UHD', location_name: 'Apartment SOLTA-301' },
    { id: 'st-u301-15', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', location_id: 'loc-unit-301', quantity: 1.0, item_name: 'Microwave Oven (Digital 25L)', location_name: 'Apartment SOLTA-301' },
    { id: 'st-u301-16', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', location_id: 'loc-unit-301', quantity: 1.0, item_name: 'Electric Kettle (Cordless Stainless)', location_name: 'Apartment SOLTA-301' },
    { id: 'st-u301-17', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s17', location_id: 'loc-unit-301', quantity: 1.0, item_name: 'Electronic Digital Room Safe', location_name: 'Apartment SOLTA-301' }
  ];

  const movements = [
    { id: 'mov-1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s1', item_name: 'Luxury Bath Soap (Botanical)', from_location_id: null, to_location_id: 'loc-store-solta', quantity: 200, actor: 'Administrator', notes: 'Wholesale delivery receipt #ET-9921', created_at: '2026-11-12T08:30:00Z' },
    { id: 'mov-2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s10', item_name: 'Bottled Spring Water (1L)', from_location_id: null, to_location_id: 'loc-store-solta', quantity: 150, actor: 'Administrator', notes: 'Apex Beverage supply invoice #8812', created_at: '2026-11-13T09:15:00Z' },
    { id: 'mov-3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s1', item_name: 'Luxury Bath Soap (Botanical)', from_location_id: 'loc-store-solta', to_location_id: 'loc-cart-solta', quantity: 30, actor: 'Administrator', notes: 'Issued to morning housekeeping cart', created_at: '2026-11-18T07:45:00Z' },
    { id: 'mov-4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s3', item_name: 'Luxury Bath Towel (White 700 GSM)', from_location_id: 'loc-store-solta', to_location_id: 'loc-cart-solta', quantity: 15, actor: 'Administrator', notes: 'Clean towels batch issued for room turnarounds', created_at: '2026-11-18T08:00:00Z' },
    { id: 'mov-5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s14', item_name: 'Smart LED TV 55" 4K UHD', from_location_id: 'loc-store-solta', to_location_id: 'loc-unit-101', quantity: 1, actor: 'Administrator', notes: 'Placed durable asset in SOLTA-101 (S/N: SAM-55-9082)', created_at: '2026-11-10T14:20:00Z' },
    { id: 'mov-6', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s15', item_name: 'Microwave Oven (Digital 25L)', from_location_id: 'loc-store-solta', to_location_id: 'loc-unit-101', quantity: 1, actor: 'Administrator', notes: 'Placed durable asset in SOLTA-101', created_at: '2026-11-10T14:25:00Z' },
    { id: 'mov-7', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', item_id: 'it-s16', item_name: 'Electric Kettle (Cordless Stainless)', from_location_id: 'loc-store-solta', to_location_id: 'loc-unit-101', quantity: 1, actor: 'Administrator', notes: 'Placed durable asset in SOLTA-101', created_at: '2026-11-10T14:30:00Z' }
  ];

  const reservations = [
    { id: 'res-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', unit_id: 'u-106', unit_code: 'DEMO-106', reference: 'DEMO-CHANNEL', guest_name: 'Evan Cole (demo)', guest_phone: '+251 91 123 4567', payer_name: 'Airbnb (demo)', source: 'Airbnb', rental_type: 'Daily', status: 'confirmed', arrival: '2026-11-20 14:00:00', departure: '2026-11-24 11:00:00', checked_in_at: null, checked_out_at: null, created_at: new Date().toISOString() },
    { id: 'res-2', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', unit_id: 'u-101', unit_code: 'DEMO-101', reference: 'DEMO-ARRIVAL', guest_name: 'Maya Bennett (demo)', guest_phone: '+251 92 234 5678', payer_name: 'Direct', source: 'Direct', rental_type: 'Daily', status: 'confirmed', arrival: '2026-11-19 14:00:00', departure: '2026-11-22 11:00:00', checked_in_at: null, checked_out_at: null, created_at: new Date().toISOString() },
    { id: 'res-3', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', unit_id: 'u-103', unit_code: 'DEMO-103', reference: 'DEMO-CHECKOUT', guest_name: 'Leah Morgan (demo)', guest_phone: '+251 93 345 6789', payer_name: 'Direct', source: 'Direct', rental_type: 'Daily', status: 'checked_in', arrival: '2026-11-17 14:00:00', departure: '2026-11-20 11:00:00', checked_in_at: '2026-11-17 15:30:00', checked_out_at: null, created_at: new Date().toISOString() },
    { id: 'res-solta-1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-101', unit_code: 'SOLTA-101', reference: 'SOLTA-8921', guest_name: 'Solomon Bekele', guest_phone: '+251 91 555 1234', payer_name: 'Solomon Bekele', source: 'Direct', rental_type: 'Daily', status: 'checked_in', arrival: '2026-11-14 14:00:00', departure: '2026-11-18 11:00:00', checked_in_at: '2026-11-14 14:30:00', checked_out_at: null, created_at: '2026-11-14T09:00:00Z' },
    { id: 'res-solta-2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-201', unit_code: 'SOLTA-201', reference: 'SOLTA-7740', guest_name: 'Dr. Dawit Alemayehu', guest_phone: '+251 91 222 3456', payer_name: 'CBE Transfer', source: 'Direct', rental_type: 'Daily', status: 'checked_out', arrival: '2026-11-10 14:00:00', departure: '2026-11-14 11:00:00', checked_in_at: '2026-11-10 14:30:00', checked_out_at: '2026-11-14 10:45:00', created_at: '2026-11-09T10:00:00Z' },
    { id: 'res-solta-3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-301', unit_code: 'SOLTA-301', reference: 'SOLTA-6219', guest_name: 'Meron Tilahun', guest_phone: '+251 91 333 7890', payer_name: 'Cash Settlement', source: 'Direct', rental_type: 'Daily', status: 'checked_out', arrival: '2026-10-22 14:00:00', departure: '2026-10-29 11:00:00', checked_in_at: '2026-10-22 14:15:00', checked_out_at: '2026-10-29 11:00:00', created_at: '2026-10-21T11:00:00Z' },
    { id: 'res-solta-4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-102', unit_code: 'SOLTA-102', reference: 'SOLTA-9104', guest_name: 'Ambassador Tariq Al-Mansoor', guest_phone: '+251 91 444 8899', payer_name: 'Embassy Protocol', source: 'Direct', rental_type: 'Daily', status: 'confirmed', arrival: '2026-11-20 14:00:00', departure: '2026-11-25 11:00:00', checked_in_at: null, checked_out_at: null, created_at: '2026-11-17T15:00:00Z' },
    { id: 'res-solta-5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-102', unit_code: 'SOLTA-102', reference: 'SOLTA-5510', guest_name: 'Helen Kebede', guest_phone: '+251 91 888 2211', payer_name: 'Helen Kebede', source: 'Booking.com', rental_type: 'Daily', status: 'checked_out', arrival: '2026-10-05 14:00:00', departure: '2026-10-12 11:00:00', checked_in_at: '2026-10-05 14:20:00', checked_out_at: '2026-10-12 10:30:00', created_at: '2026-10-04T12:00:00Z' },
    { id: 'res-solta-longterm', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-301', unit_code: 'SOLTA-301', reference: 'SOLTA-ANNUAL-01', guest_name: 'Jean-Pierre Laurent (UN / Diplomat)', guest_phone: '+251 91 777 9900', payer_name: 'UN Agency Corporate Billing', source: 'Contact', rental_type: 'Monthly', payment_terms: 'monthly', total_contract_amount: 540000.0, status: 'checked_in', arrival: '2026-11-01 14:00:00', departure: '2027-11-01 11:00:00', checked_in_at: '2026-11-01 15:00:00', checked_out_at: null, created_at: '2026-11-01T08:30:00Z' }
  ];

  const reservationInstallments = [
    {
      id: 'inst-lt-1',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      reservation_id: 'res-solta-longterm',
      installment_number: 1,
      title: 'Installment 1 of 12 (Month 1 - Nov 2026)',
      due_date: '2026-11-01',
      amount: 45000.0,
      paid_amount: 45000.0,
      status: 'paid',
      paid_date: '2026-11-01T10:00:00Z',
      payment_method: 'Bank Transfer / CPO',
      notes: 'Initial monthly term settled upon lease signing',
      created_at: '2026-11-01T09:00:00Z'
    },
    {
      id: 'inst-lt-2',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      reservation_id: 'res-solta-longterm',
      installment_number: 2,
      title: 'Installment 2 of 12 (Month 2 - Dec 2026)',
      due_date: '2026-12-01',
      amount: 45000.0,
      paid_amount: 0.0,
      status: 'pending',
      paid_date: null,
      payment_method: null,
      notes: 'Due in 9 days',
      created_at: '2026-11-01T09:00:00Z'
    },
    {
      id: 'inst-lt-3',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      reservation_id: 'res-solta-longterm',
      installment_number: 3,
      title: 'Installment 3 of 12 (Month 3 - Jan 2027)',
      due_date: '2027-01-01',
      amount: 45000.0,
      paid_amount: 0.0,
      status: 'pending',
      paid_date: null,
      payment_method: null,
      notes: 'Scheduled upcoming tranche',
      created_at: '2026-11-01T09:00:00Z'
    },
    {
      id: 'inst-lt-4',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      reservation_id: 'res-solta-longterm',
      installment_number: 4,
      title: 'Installment 4 of 12 (Month 4 - Feb 2027)',
      due_date: '2027-02-01',
      amount: 45000.0,
      paid_amount: 0.0,
      status: 'pending',
      paid_date: null,
      payment_method: null,
      notes: 'Scheduled upcoming tranche',
      created_at: '2026-11-01T09:00:00Z'
    }
  ];

  const stayAccountEntries = [
    { id: 'ent-1', account_id: 'acc-3', kind: 'charge', amount: 10500.0, payment_method: null, description: 'Room charges for 3 nights', actor: 'System', created_at: '2026-11-17T14:00:00Z' },
    { id: 'ent-2', account_id: 'acc-3', kind: 'deposit', amount: 2000.0, payment_method: 'Telebirr', description: 'Security deposit received', actor: 'Administrator', created_at: '2026-11-17T14:30:00Z' },
    { id: 'ent-3', account_id: 'acc-3', kind: 'payment', amount: 10500.0, payment_method: 'Telebirr', description: 'Full stay payment received', actor: 'Administrator', created_at: '2026-11-17T14:35:00Z' },
    // Solta Live & Completed Stays
    { id: 'ent-s1', account_id: 'acc-solta-1', kind: 'charge', amount: 17500.0, payment_method: null, description: 'Room charges for 5 nights (SOLTA-101)', actor: 'System', created_at: '2026-11-18T09:00:00Z' },
    { id: 'ent-s2', account_id: 'acc-solta-1', kind: 'deposit', amount: 3000.0, payment_method: 'Telebirr', description: 'Initial security deposit', actor: 'Administrator', created_at: '2026-11-18T09:15:00Z' },
    { id: 'ent-s3', account_id: 'acc-solta-1', kind: 'payment', amount: 17500.0, payment_method: 'Telebirr', description: 'Full stay payment received (SOLTA-8921)', actor: 'Administrator', created_at: '2026-11-18T09:20:00Z' },
    { id: 'ent-s4', account_id: 'acc-solta-2', kind: 'charge', amount: 22000.0, payment_method: null, description: 'Room charges for 4 nights (SOLTA-201)', actor: 'System', created_at: '2026-11-10T11:00:00Z' },
    { id: 'ent-s5', account_id: 'acc-solta-2', kind: 'deposit', amount: 3500.0, payment_method: 'CBE Birr', description: 'Security deposit received', actor: 'Administrator', created_at: '2026-11-10T11:15:00Z' },
    { id: 'ent-s6', account_id: 'acc-solta-2', kind: 'payment', amount: 22000.0, payment_method: 'CBE Birr', description: 'Full stay payment (SOLTA-7740)', actor: 'Administrator', created_at: '2026-11-14T10:30:00Z' },
    { id: 'ent-s7', account_id: 'acc-solta-2', kind: 'deposit_refund', amount: 3500.0, payment_method: 'CBE Birr', description: 'Deposit refunded upon checkout check pass', actor: 'Administrator', created_at: '2026-11-14T10:45:00Z' },
    { id: 'ent-s8', account_id: 'acc-solta-3', kind: 'charge', amount: 38500.0, payment_method: null, description: 'Room charges for 7 nights (SOLTA-301)', actor: 'System', created_at: '2026-10-22T14:00:00Z' },
    { id: 'ent-s9', account_id: 'acc-solta-3', kind: 'deposit', amount: 5000.0, payment_method: 'Cash', description: 'Cash security deposit held', actor: 'Administrator', created_at: '2026-10-22T14:10:00Z' },
    { id: 'ent-s10', account_id: 'acc-solta-3', kind: 'payment', amount: 38500.0, payment_method: 'Cash', description: 'Cash payment settled receipt #0482', actor: 'Administrator', created_at: '2026-10-29T11:00:00Z' },
    { id: 'ent-s11', account_id: 'acc-solta-3', kind: 'deposit_refund', amount: 5000.0, payment_method: 'Cash', description: 'Deposit returned in cash', actor: 'Administrator', created_at: '2026-10-29T11:15:00Z' },
    { id: 'ent-s12', account_id: 'acc-solta-4', kind: 'charge', amount: 17500.0, payment_method: null, description: 'Reserved stay 5 nights (SOLTA-102)', actor: 'System', created_at: '2026-11-17T15:00:00Z' },
    { id: 'ent-s13', account_id: 'acc-solta-4', kind: 'deposit', amount: 3000.0, payment_method: 'Bank Transfer', description: 'Advance protocol deposit received', actor: 'Administrator', created_at: '2026-11-17T15:30:00Z' },
    { id: 'ent-s14', account_id: 'acc-solta-5', kind: 'charge', amount: 24500.0, payment_method: null, description: 'Stay charges 7 nights (SOLTA-102)', actor: 'System', created_at: '2026-10-05T14:00:00Z' },
    { id: 'ent-s15', account_id: 'acc-solta-5', kind: 'payment', amount: 24500.0, payment_method: 'Telebirr', description: 'Booking.com stay settled in full', actor: 'Administrator', created_at: '2026-10-12T10:00:00Z' },
    { id: 'ent-lt-1', account_id: 'acc-solta-longterm', kind: 'charge', amount: 540000.0, payment_method: null, description: '1-Year Annual Lease Contract (12 Monthly Terms)', actor: 'Administrator', created_at: '2026-11-01T08:35:00Z' },
    { id: 'ent-lt-2', account_id: 'acc-solta-longterm', kind: 'deposit', amount: 90000.0, payment_method: 'Bank Transfer / CPO', description: '2 Months Security Deposit Held', actor: 'Administrator', created_at: '2026-11-01T08:40:00Z' },
    { id: 'ent-lt-3', account_id: 'acc-solta-longterm', kind: 'payment', amount: 45000.0, payment_method: 'Bank Transfer / CPO', description: 'Installment 1 of 12 (Month 1 - Nov 2026)', actor: 'Administrator', created_at: '2026-11-01T09:00:00Z' }
  ];

  const stayAccounts = [
    { id: 'acc-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', reservation_id: 'res-1', reference: 'DEMO-CHANNEL', guest_name: 'Evan Cole (demo)', balance: 14000.0, deposit: 3000.0, created_at: new Date().toISOString() },
    { id: 'acc-2', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', reservation_id: 'res-2', reference: 'DEMO-ARRIVAL', guest_name: 'Maya Bennett (demo)', balance: 10500.0, deposit: 2000.0, created_at: new Date().toISOString() },
    { id: 'acc-3', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', reservation_id: 'res-3', reference: 'DEMO-CHECKOUT', guest_name: 'Leah Morgan (demo)', balance: 0.0, deposit: 2000.0, created_at: new Date().toISOString() },
    { id: 'acc-solta-1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-1', reference: 'SOLTA-8921', guest_name: 'Solomon Bekele', balance: 0.0, deposit: 3000.0, created_at: '2026-11-18T09:00:00Z' },
    { id: 'acc-solta-2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-2', reference: 'SOLTA-7740', guest_name: 'Dr. Dawit Alemayehu', balance: 0.0, deposit: 0.0, created_at: '2026-11-10T11:00:00Z' },
    { id: 'acc-solta-3', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-3', reference: 'SOLTA-6219', guest_name: 'Meron Tilahun', balance: 0.0, deposit: 0.0, created_at: '2026-10-22T14:00:00Z' },
    { id: 'acc-solta-4', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-4', reference: 'SOLTA-9104', guest_name: 'Ambassador Tariq Al-Mansoor', balance: 17500.0, deposit: 3000.0, created_at: '2026-11-17T15:00:00Z' },
    { id: 'acc-solta-5', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-5', reference: 'SOLTA-5510', guest_name: 'Helen Kebede', balance: 0.0, deposit: 0.0, created_at: '2026-10-04T12:00:00Z' },
    { id: 'acc-solta-longterm', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', reservation_id: 'res-solta-longterm', reference: 'SOLTA-ANNUAL-01', guest_name: 'Jean-Pierre Laurent (UN / Diplomat)', balance: 495000.0, deposit: 90000.0, created_at: '2026-11-01T08:30:00Z' }
  ];

  const tasks = [
    { id: 'task-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', unit_id: 'u-104', unit_code: 'DEMO-104', reservation_id: null, assignee_id: null, assignee: null, status: 'pending', reason: 'Clean and replace one missing glass', due_at: '2026-11-19 17:00:00', completed_at: null, created_at: new Date().toISOString() },
    { id: 'task-solta-1', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', unit_id: 'u-solta-201', unit_code: 'SOLTA-201', reservation_id: null, assignee_id: null, assignee: null, status: 'pending', reason: 'Turnaround deep cleaning & linen change', due_at: '2026-11-20 12:00:00', completed_at: null, created_at: new Date().toISOString() }
  ];

  const checklists = [];

  const maintenanceRecords = [
    {
      id: 'maint-solta-1',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      unit_id: 'u-solta-102',
      unit_code: 'SOLTA-102',
      issue: 'Master bedroom AC compressor service & refrigerant top-up',
      technician: 'Kebede HVAC Engineering',
      duration_est: '6 hours',
      actual_duration: '5 hours 30 mins',
      cost: 1800.0,
      status: 'resolved',
      start_date: '2026-11-05T09:00:00Z',
      resolved_date: '2026-11-05T14:30:00Z',
      notes: 'Cooling coils cleaned, pressure tested at 120 PSI, 100% operational.'
    },
    {
      id: 'maint-solta-2',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      unit_id: 'u-solta-201',
      unit_code: 'SOLTA-201',
      issue: 'Thermostatic shower mixer replacement & silicone resealing',
      technician: 'Solta In-House Maintenance',
      duration_est: '1 day',
      actual_duration: '1 day 2 hours',
      cost: 3200.0,
      status: 'resolved',
      start_date: '2026-11-02T10:00:00Z',
      resolved_date: '2026-11-03T12:00:00Z',
      notes: 'Replaced brass mixer unit, cured silicone for 24h, tested with zero leaks.'
    },
    {
      id: 'maint-solta-3',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      unit_id: 'u-solta-301',
      unit_code: 'SOLTA-301',
      issue: 'Balcony sliding door roller track alignment & handle latch lock',
      technician: 'Addis Glass & Aluminum Works',
      duration_est: '4 hours',
      actual_duration: '4 hours',
      cost: 1200.0,
      status: 'resolved',
      start_date: '2026-10-25T11:00:00Z',
      resolved_date: '2026-10-25T15:00:00Z',
      notes: 'Heavy rollers replaced, track lubricated with teflon spray.'
    },
    {
      id: 'maint-solta-4',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      unit_id: 'u-solta-101',
      unit_code: 'SOLTA-101',
      issue: 'Living room Smart TV wall bracket reinforcement & HDMI routing',
      technician: 'Solta IT/AV Specialist',
      duration_est: '3 hours',
      actual_duration: '2 hours 45 mins',
      cost: 650.0,
      status: 'resolved',
      start_date: '2026-10-18T14:00:00Z',
      resolved_date: '2026-10-18T16:45:00Z',
      notes: 'Mounted with M8 lag anchors, concealed cabling.'
    }
  ];

  // Generate 15,000 randomized employee profiles for high-volume stress testing and pagination audit
  const firstNames = ['Abebe', 'Almaz', 'Dawit', 'Bethlehem', 'Haile', 'Tigist', 'Yonas', 'Selam', 'Kenenisa', 'Marta', 'Tariku', 'Genet', 'Ephrem', 'Birtukan', 'Solomon', 'Hanna', 'Tewodros', 'Rahel', 'Bereket', 'Hiwot', 'Kassahun', 'Meseret', 'Tamrat', 'Sara', 'Biruk', 'Aster', 'Desta', 'Lemlem', 'Getachew', 'Tsige'];
  const lastNames = ['Bikila', 'Kebede', 'Tadesse', 'Alemu', 'Gebre', 'Desta', 'Worku', 'Bekele', 'Haile', 'Mekonnen', 'Tesfaye', 'Assefa', 'Girma', 'Mengistu', 'Ayalew', 'Wondimu', 'Kassa', 'Belay', 'Tilahun', 'Zeleke'];
  const depts = [
    { name: 'Reception', roles: ['Front Desk Officer', 'Night Auditor', 'Concierge', 'Guest Relations Lead'] },
    { name: 'Housekeeping', roles: ['Floor Supervisor', 'Senior Housekeeper', 'Linen Attendant', 'Room Cleaner'] },
    { name: 'Maintenance', roles: ['Chief Technician', 'Electrician', 'Plumber', 'HVAC Specialist'] },
    { name: 'Administration', roles: ['HR Specialist', 'Office Coordinator', 'Operations Assistant', 'Compliance Officer'] },
    { name: 'Management', roles: ['Property Manager', 'Duty Manager', 'Assistant General Manager'] },
    { name: 'Finance', roles: ['Senior Cashier', 'Financial Auditor', 'Payroll Specialist', 'Accounts Clerk'] },
    { name: 'Security', roles: ['Security Supervisor', 'CCTV Monitor', 'Perimeter Patrol Officer'] },
    { name: 'Kitchen', roles: ['Head Chef', 'Pastry Chef', 'Breakfast Steward', 'Kitchen Assistant'] }
  ];
  const empTypes = ['Full-Time', 'Part-Time', 'Contract', 'Probation'];
  const statuses = ['active', 'active', 'active', 'active', 'on_leave', 'terminated'];

  const employees = [];
  const propertyId = 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c';

  for (let i = 1; i <= 15000; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 13) % lastNames.length];
    const deptObj = depts[i % depts.length];
    const pos = deptObj.roles[(i * 3) % deptObj.roles.length];
    const empType = empTypes[i % empTypes.length];
    const status = statuses[i % statuses.length];
    const salary = 8000 + ((i * 173) % 42000);
    const allowance = (i % 3 === 0) ? 1500 + ((i * 23) % 6500) : 0;
    const phone = `+251 9${String(10000000 + ((i * 37) % 90000000))}`;
    const fayda = `FYD-${String(100000 + i).padStart(6, '0')}-${String(2026 + (i % 5))}`;
    const hireYear = 2020 + (i % 6);
    const hireMonth = String(1 + (i % 12)).padStart(2, '0');
    const hireDay = String(1 + (i % 28)).padStart(2, '0');
    const birthYear = 1975 + (i % 28);
    const birthMonth = String(1 + ((i * 2) % 12)).padStart(2, '0');
    const birthDay = String(1 + ((i * 3) % 28)).padStart(2, '0');

    employees.push({
      id: `emp-perf-${i}`,
      property_id: propertyId,
      full_name: `${fn} ${ln}`,
      position: pos,
      department: deptObj.name,
      employment_type: empType,
      hire_date: `${hireYear}-${hireMonth}-${hireDay}`,
      contract_end_date: empType === 'Contract' ? `2027-${hireMonth}-${hireDay}` : null,
      birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
      fayda_id: fayda,
      phone: phone,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i % 1000 || ''}@solta.et`,
      base_salary: salary,
      allowance: allowance,
      status: status,
      emergency_contact: `${ln} Family (${phone.slice(0, 10)}99)`,
      notes: `Roster entry #${i} registered for Solta Hotel Apartments`,
      created_at: `${hireYear}-${hireMonth}-${hireDay}T08:00:00Z`
    });
  }

  // Real operational expenses (initialized clean)
  const expenses = [
    {
      id: 'exp-solta-1',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      title: 'Premium Egyptian Cotton Bed Linens & Towels Replenishment',
      category: 'Supplies',
      amount: 8400.0,
      payment_method: 'Telebirr',
      payee: 'Addis Textile Trading',
      reference_no: 'INV-2026-891',
      expense_date: '2026-11-15',
      notes: 'Sets for 1-bed and 2-bed units',
      recorded_by: 'Solta Management',
      created_at: '2026-11-15T10:00:00Z'
    },
    {
      id: 'exp-solta-2',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      title: 'Emergency Generator Diesel Fuel (200 Liters)',
      category: 'Maintenance',
      amount: 14200.0,
      payment_method: 'CBE Birr',
      payee: 'TotalEnergies Bole',
      reference_no: 'REC-90341',
      expense_date: '2026-11-12',
      notes: 'Backup generator refill during city power maintenance',
      recorded_by: 'Solta Management',
      created_at: '2026-11-12T14:30:00Z'
    },
    {
      id: 'exp-solta-3',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      title: 'High-Efficiency LED Lighting & Bathroom Fixture Repairs',
      category: 'Maintenance',
      amount: 3600.0,
      payment_method: 'Cash',
      payee: 'Merkato Electrical Supplies',
      reference_no: 'RCP-5542',
      expense_date: '2026-11-05',
      notes: 'Fixture upgrades in corridors and SOLTA-201',
      recorded_by: 'Solta Management',
      created_at: '2026-11-05T16:00:00Z'
    },
    {
      id: 'exp-solta-4',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      title: 'Sanitization & Deep Cleaning Chemicals Restock',
      category: 'Supplies',
      amount: 4200.0,
      payment_method: 'Telebirr',
      payee: 'Clean Addis Hygiene',
      reference_no: 'INV-7721',
      expense_date: '2026-10-25',
      notes: 'Floor cleaner, disinfectants, dish soaps',
      recorded_by: 'Solta Management',
      created_at: '2026-10-25T11:20:00Z'
    }
  ];

  // Utilities tracking (initialized clean)
  const utilities = [
    {
      id: 'util-solta-1',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      utility_type: 'Electricity',
      provider: 'Ethiopian Electric Utility (EEU)',
      meter_reading_prev: 14200,
      meter_reading_curr: 15350,
      consumption_units: 1150,
      billing_period: '2026-10',
      amount: 4850.0,
      due_date: '2026-11-25',
      paid_status: 'paid',
      paid_at: '2026-11-16T10:00:00Z',
      payment_method: 'CBE Birr',
      notes: 'Commercial 3-phase tariff. Receipt #EEU-88291',
      recorded_by: 'Solta Management',
      created_at: '2026-11-10T09:00:00Z'
    },
    {
      id: 'util-solta-2',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      utility_type: 'Internet',
      provider: 'Ethio Telecom Dedicated Fiber',
      meter_reading_prev: null,
      meter_reading_curr: null,
      consumption_units: null,
      billing_period: '2026-11',
      amount: 3200.0,
      due_date: '2026-11-20',
      paid_status: 'paid',
      paid_at: '2026-11-14T11:30:00Z',
      payment_method: 'Telebirr',
      notes: '50Mbps enterprise fiber link with static IP',
      recorded_by: 'Solta Management',
      created_at: '2026-11-05T10:00:00Z'
    },
    {
      id: 'util-solta-3',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      utility_type: 'Water',
      provider: 'Addis Ababa Water and Sewerage Authority (AAWSA)',
      meter_reading_prev: 3120,
      meter_reading_curr: 3245,
      consumption_units: 125,
      billing_period: '2026-10',
      amount: 1980.0,
      due_date: '2026-11-28',
      paid_status: 'pending',
      paid_at: null,
      payment_method: null,
      notes: 'Main building water intake. Due at end of month.',
      recorded_by: 'Solta Management',
      created_at: '2026-11-12T14:00:00Z'
    }
  ];

  const auditLog = [
    { id: 'aud-1', property_id: '52b13c3e-b0d0-4742-b920-b11035779aa2', action: 'system.initialized', actor: 'System', details: { message: 'Workspace initialized with demo dataset' }, created_at: new Date().toISOString() },
    { id: 'aud-2', property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c', action: 'system.initialized', actor: 'System', details: { message: 'Solta Hotel Apartment production workspace ready' }, created_at: new Date().toISOString() }
  ];

  // Executive Approvals & Governance Configuration
  const approverConfig = {
    property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
    approver_id: '52b13c3e-b0d0-4742-b920-b11035779aa2',
    approver_name: 'Solta Administrator',
    approver_email: 'admin@gmail.com',
    mode: 'required', // 'required' (strictly blocked until approved) or 'optional' (auto-approved with notifications)
    early_booking_approval: true,
    inventory_deficit_approval: true,
    payment_verification: true,
    notify_new_booking: true,
    notify_expired_booking: true,
    notify_stock_movement: true,
    notify_payment: true
  };

  // Central Notification & Approval Ledger
  const notifications = [
    {
      id: 'notif-1',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      type: 'early_booking',
      title: 'Early Booking Approval Requested',
      message: 'Guest Dawit Haile requested early check-in (10:00 AM) for SOLTA-201.',
      entity_id: 'res-solta-early-1',
      status: 'pending',
      required_approval: true,
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      metadata: { guest: 'Dawit Haile', unit: 'SOLTA-201', time: '10:00 AM' }
    },
    {
      id: 'notif-2',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      type: 'negative_stock',
      title: 'Negative Stock Deficit Warning',
      message: 'Housekeeping requested 15 sets of bath towels. Central Store balance will drop to -5 units.',
      entity_id: 'mov-deficit-1',
      status: 'pending',
      required_approval: true,
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      metadata: { item: 'Bath Towels', deficit: -5, staff: 'Almaz Kebede' }
    },
    {
      id: 'notif-3',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      type: 'payment_request',
      title: 'Payment Registration Logged',
      message: 'Settlement payment of 28,000 ETB registered via Telebirr for Booking #SOLTA-8924.',
      entity_id: 'acc-1',
      status: 'info',
      required_approval: false,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      metadata: { amount: 28000, rail: 'Telebirr', reference: 'SOLTA-8924' }
    },
    {
      id: 'notif-4',
      property_id: 'db0a0138-3ec4-4568-ba28-3ffb5bdfad9c',
      type: 'expired_booking',
      title: 'Overdue / Expired Departure Alert',
      message: 'Booking #SOLTA-9042 for Apartment SOLTA-101 has exceeded scheduled departure time by 3.5 hours.',
      entity_id: 'res-solta-overdue',
      status: 'info',
      required_approval: false,
      created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      metadata: { unit: 'SOLTA-101', overdue: '3.5h' }
    }
  ];

  return {
    properties,
    roles,
    permissionCatalog,
    rolePermissions,
    users,
    paymentMethods,
    units,
    items,
    locations,
    stock,
    movements,
    reservations,
    stayAccounts,
    stayAccountEntries,
    tasks,
    checklists,
    employees,
    expenses,
    utilities,
    maintenanceRecords,
    auditLog,
    approverConfig,
    notifications,
    reservationInstallments
  };
}

let db = createInitialState();
let activeSessionUser = db.users[0]; // default logged in to admin for easy local development

export function handleMockApi(req, res, next) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api')) {
    return next();
  }

  // Parse Body for non-GET
  let bodyBuffer = [];
  req.on('data', chunk => bodyBuffer.push(chunk));
  req.on('end', () => {
    let body = {};
    if (bodyBuffer.length > 0) {
      try {
        body = JSON.parse(Buffer.concat(bodyBuffer).toString());
      } catch (e) {
        body = {};
      }
    }

    try {
      routeRequest(req, res, url, body);
    } catch (err) {
      console.error('API Error:', err);
      sendJson(res, { message: err.message || 'Internal Server Error' }, 500);
    }
  });
}

function sendJson(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function logAudit(propertyId, action, actor, details) {
  db.auditLog.unshift({
    id: crypto.randomUUID(),
    property_id: propertyId,
    action,
    actor,
    details: details || {},
    created_at: new Date().toISOString()
  });
}

function routeRequest(req, res, url, body) {
  const path = url.pathname.replace(/^\/api\/?/, '');
  const method = req.method;

  // 1. /api/health
  if (path === 'health') {
    return sendJson(res, { status: 'ok' });
  }

  // 2. /api/me
  if (path === 'me') {
    if (!activeSessionUser) {
      return sendJson(res, { message: 'Please sign in' }, 401);
    }
    const rolePerms = db.rolePermissions
      .filter(rp => rp.role_id === activeSessionUser.role_id && rp.enabled)
      .map(rp => rp.permission_code);

    return sendJson(res, {
      user: {
        id: activeSessionUser.id,
        name: activeSessionUser.name,
        email: activeSessionUser.email,
        role: activeSessionUser.role_id,
        permissions: rolePerms
      },
      properties: db.properties
    });
  }

  // 3. /api/login
  if (path === 'login' && method === 'POST') {
    const { email, password } = body;
    const user = db.users.find(u => u.email === email);
    if (!user || user.password !== password) {
      return sendJson(res, { message: 'Email or password is incorrect' }, 401);
    }
    activeSessionUser = user;
    const rolePerms = db.rolePermissions
      .filter(rp => rp.role_id === user.role_id && rp.enabled)
      .map(rp => rp.permission_code);

    return sendJson(res, {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_id,
        permissions: rolePerms
      }
    });
  }

  // 4. /api/logout
  if (path === 'logout') {
    activeSessionUser = null;
    return sendJson(res, { ok: true });
  }

  // Ensure Auth for remaining endpoints
  if (!activeSessionUser) {
    return sendJson(res, { message: 'Unauthorized' }, 401);
  }

  // 5. /api/data?propertyId=...
  if (path === 'data' && method === 'GET') {
    const propertyId = url.searchParams.get('propertyId') || db.properties[0].id;
    const units = db.units.filter(u => u.property_id === propertyId);
    const today = new Date().toISOString().split('T')[0];
    const reservations = db.reservations
      .filter(r => r.property_id === propertyId)
      .map(r => {
        const insts = (db.reservationInstallments || [])
          .filter(i => i.reservation_id === r.id)
          .map(inst => ({
            ...inst,
            status: (inst.status === 'pending' && inst.due_date < today) ? 'overdue' : inst.status
          }))
          .sort((a, b) => a.installment_number - b.installment_number);
        return {
          ...r,
          installments: insts
        };
      });
    const accounts = db.stayAccounts
      .filter(a => a.property_id === propertyId)
      .map(acc => ({
        ...acc,
        entries: db.stayAccountEntries.filter(e => e.account_id === acc.id)
      }));
    const items = db.items.filter(i => i.property_id === propertyId);
    const locations = db.locations.filter(l => l.property_id === propertyId);
    const stock = db.stock.filter(s => s.property_id === propertyId);
    const movements = db.movements.filter(m => m.property_id === propertyId);
    const tasks = db.tasks.filter(t => t.property_id === propertyId);
    const staff = db.users
      .filter(u => u.property_id === propertyId || u.property_id === null)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role_id: u.role_id,
        role: (db.roles.find(r => r.id === u.role_id) || {}).name || 'Staff'
      }));
    const roles = db.roles.filter(r => r.property_id === propertyId || r.property_id === null);
    const paymentMethods = db.paymentMethods.filter(pm => pm.property_id === propertyId);
    const audit = db.auditLog.filter(a => a.property_id === propertyId);
    const employees = db.employees.filter(e => e.property_id === propertyId);
    const expenses = db.expenses.filter(e => e.property_id === propertyId);
    const utilities = db.utilities.filter(u => u.property_id === propertyId);
    const maintenanceRecords = (db.maintenanceRecords || []).filter(m => m.property_id === propertyId);

    const userPerms = db.rolePermissions
      .filter(rp => rp.role_id === activeSessionUser.role_id && rp.enabled)
      .map(rp => rp.permission_code);

    const occupiedUnits = units.filter(u => u.occupied).length;
    const cleaningUnits = units.filter(u => u.readiness === 'dirty').length;
    const upcomingRes = reservations.filter(r => r.status === 'confirmed').length;

    return sendJson(res, {
      permissions: userPerms,
      units,
      reservations,
      accounts,
      items,
      locations,
      stock,
      movements,
      tasks,
      staff,
      roles,
      permissionCatalog: db.permissionCatalog,
      rolePermissions: db.rolePermissions,
      audit,
      paymentMethods,
      employees,
      expenses,
      utilities,
      maintenanceRecords,
      approverConfig: db.approverConfig,
      notifications: db.notifications || [],
      summary: {
        apartments: units.length,
        occupied: occupiedUnits,
        cleaning: cleaningUnits,
        upcoming: upcomingRes,
        employees: employees.length,
        monthlyPayroll: employees.reduce((sum, e) => sum + (Number(e.base_salary) || 0) + (Number(e.allowance) || 0), 0),
        expenses: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        pendingUtilities: utilities.filter(u => u.status !== 'paid').reduce((sum, u) => sum + (Number(u.amount) || 0), 0)
      }
    });
  }

  // 6. /api/data (POST -> create_unit)
  if (path === 'data' && method === 'POST') {
    if (body.action === 'create_unit') {
      const propertyId = body.propertyId || db.properties[0].id;
      const newUnit = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        code: body.code,
        category: body.category || 'One bedroom',
        capacity: Number(body.capacity) || 2,
        nightly_rate: Number(body.nightly_rate) || 3500.0,
        readiness: 'ready',
        occupied: false,
        created_at: new Date().toISOString()
      };
      db.units.push(newUnit);
      logAudit(propertyId, 'unit.created', activeSessionUser.name, { code: body.code });
      return sendJson(res, { ok: true, id: newUnit.id });
    }
  }

  // 6b. /api/units/mode -> Set operational mode (ready, occupied, booked, maintenance)
  if ((path === 'units/mode' || (path === 'data' && body.action === 'update_unit_mode')) && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const unit = db.units.find(u => u.id === body.unitId);
    if (!unit) return sendJson(res, { message: 'Apartment unit not found' }, 404);

    const prevMode = unit.occupied ? 'occupied' : unit.readiness;
    const newMode = body.mode; // 'ready', 'occupied', 'booked', 'maintenance'

    if (newMode === 'ready') {
      unit.readiness = 'ready';
      unit.occupied = false;
      unit.mode = 'ready';
    } else if (newMode === 'occupied') {
      unit.occupied = true;
      unit.readiness = 'ready';
      unit.mode = 'occupied';
    } else if (newMode === 'booked') {
      unit.occupied = false;
      unit.readiness = 'booked';
      unit.mode = 'booked';
    } else if (newMode === 'maintenance') {
      unit.occupied = false;
      unit.readiness = 'maintenance';
      unit.mode = 'maintenance';

      // Log to maintenance records
      const newMaint = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        unit_id: unit.id,
        unit_code: unit.code,
        issue: body.reason || 'General maintenance / repair',
        technician: body.technician || 'In-House Maintenance',
        duration_est: body.durationEst || '1 day',
        actual_duration: null,
        cost: Number(body.cost) || 0,
        status: 'in_progress',
        start_date: new Date().toISOString(),
        resolved_date: null,
        notes: body.notes || ''
      };
      if (!db.maintenanceRecords) db.maintenanceRecords = [];
      db.maintenanceRecords.unshift(newMaint);
    }

    logAudit(propertyId, 'unit.mode_changed', activeSessionUser.name, { code: unit.code, from: prevMode, to: newMode });
    return sendJson(res, { ok: true, unit });
  }

  // 6c. /api/maintenance/resolve
  if ((path === 'maintenance/resolve' || path === 'units/resolve-maintenance') && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const record = (db.maintenanceRecords || []).find(r => r.id === body.recordId || (r.unit_id === body.unitId && r.status === 'in_progress'));
    if (record) {
      record.status = 'resolved';
      record.resolved_date = new Date().toISOString();
      if (body.actualDuration) record.actual_duration = body.actualDuration;
      if (body.cost !== undefined) record.cost = Number(body.cost);
    }
    const unit = db.units.find(u => u.id === (record?.unit_id || body.unitId));
    if (unit) {
      unit.readiness = 'ready';
      unit.mode = 'ready';
    }
    logAudit(propertyId, 'maintenance.resolved', activeSessionUser.name, { code: unit?.code });
    return sendJson(res, { ok: true });
  }

  // 6d. /api/units/update-specs -> Update apartment specifications, amenities, and furnishings
  if (path === 'units/update-specs' && method === 'POST') {
    const { unitId, code, category, capacity, nightly_rate, specs } = body;
    const unit = db.units.find(u => u.id === unitId);
    if (!unit) return sendJson(res, { message: 'Apartment unit not found' }, 404);

    if (code) unit.code = code.trim();
    if (category) unit.category = category;
    if (capacity !== undefined) unit.capacity = Number(capacity);
    if (nightly_rate !== undefined) unit.nightly_rate = Number(nightly_rate);
    if (specs) unit.specs = specs;

    logAudit(unit.property_id || db.properties[0].id, 'unit.specs_updated', activeSessionUser.name, {
      unit: unit.code,
      rate: unit.nightly_rate,
      capacity: unit.capacity
    });

    return sendJson(res, { ok: true, unit });
  }

  // 7. /api/reports?propertyId=...
  if (path === 'reports' && method === 'GET') {
    const propertyId = url.searchParams.get('propertyId') || db.properties[0].id;
    const propertyAccounts = db.stayAccounts.filter(a => a.property_id === propertyId);
    const accountIds = new Set(propertyAccounts.map(a => a.id));
    const entries = db.stayAccountEntries.filter(e => accountIds.has(e.account_id));
    const propertyExpenses = db.expenses.filter(e => e.property_id === propertyId);
    const propertyUtilities = db.utilities.filter(u => u.property_id === propertyId);

    let totalPayments = 0;
    let totalDeposits = 0;
    let totalRefunds = 0;
    const methodBreakdown = {};
    const trendMap = {};
    const recentTxns = [];

    // Process Stay Account Entries (Inflows & Guest Transactions)
    entries.forEach(e => {
      const amt = Number(e.amount) || 0;
      const pm = e.payment_method || 'Cash';
      const dateKey = (e.created_at || '').substring(0, 7) || '2026-11';
      const exactDate = (e.created_at || new Date().toISOString()).split('T')[0];

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { period: dateKey, payments: 0, deposits: 0, refunds: 0, expenses: 0, utilities: 0, netOperatingIncome: 0, netCashflow: 0 };
      }
      if (!methodBreakdown[pm]) {
        methodBreakdown[pm] = { method: pm, payments: 0, deposits: 0, refunds: 0, count: 0, totalVolume: 0 };
      }

      if (e.kind === 'payment') {
        totalPayments += amt;
        trendMap[dateKey].payments += amt;
        methodBreakdown[pm].payments += amt;
        methodBreakdown[pm].totalVolume += amt;
        methodBreakdown[pm].count += 1;
        recentTxns.push({
          id: e.id,
          date: exactDate,
          kind: 'payment',
          type: 'inflow',
          title: 'Guest Stay Payment',
          description: e.description || 'Room settlement',
          category: 'Guest Lodging',
          method: pm,
          amount: amt
        });
      } else if (e.kind === 'deposit') {
        totalDeposits += amt;
        trendMap[dateKey].deposits += amt;
        methodBreakdown[pm].deposits += amt;
        methodBreakdown[pm].totalVolume += amt;
        methodBreakdown[pm].count += 1;
        recentTxns.push({
          id: e.id,
          date: exactDate,
          kind: 'deposit',
          type: 'inflow',
          title: 'Security Deposit Held',
          description: e.description || 'Pre-checkin damage deposit',
          category: 'Security Deposit',
          method: pm,
          amount: amt
        });
      } else if (e.kind === 'refund' || e.kind === 'deposit_refund') {
        totalRefunds += amt;
        trendMap[dateKey].refunds += amt;
        methodBreakdown[pm].refunds += amt;
        methodBreakdown[pm].count += 1;
        recentTxns.push({
          id: e.id,
          date: exactDate,
          kind: 'refund',
          type: 'outflow',
          title: 'Deposit / Payment Refund',
          description: e.description || 'Refunded to guest',
          category: 'Security Deposit',
          method: pm,
          amount: amt
        });
      }
    });

    // Process Operating Expenses (Outflows)
    let totalExpenses = 0;
    const expenseCategoryMap = {};

    propertyExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalExpenses += amt;
      const cat = exp.category || 'Supplies';
      const dateKey = (exp.expense_date || exp.created_at || '').substring(0, 7) || '2026-11';
      const exactDate = exp.expense_date || (exp.created_at || new Date().toISOString()).split('T')[0];

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { period: dateKey, payments: 0, deposits: 0, refunds: 0, expenses: 0, utilities: 0, netOperatingIncome: 0, netCashflow: 0 };
      }
      trendMap[dateKey].expenses += amt;

      if (!expenseCategoryMap[cat]) {
        expenseCategoryMap[cat] = { category: cat, total: 0, count: 0 };
      }
      expenseCategoryMap[cat].total += amt;
      expenseCategoryMap[cat].count += 1;

      recentTxns.push({
        id: exp.id,
        date: exactDate,
        kind: 'expense',
        type: 'outflow',
        title: exp.title,
        description: `${exp.payee ? exp.payee + ' · ' : ''}${exp.notes || 'Operating expense'}`,
        category: cat,
        method: exp.payment_method || 'Cash',
        amount: amt
      });
    });

    // Process Utilities (Paid & Outflows)
    let totalUtilities = 0;
    let pendingUtilities = 0;

    propertyUtilities.forEach(u => {
      const amt = Number(u.amount) || 0;
      const cat = 'Utilities (' + u.utility_type + ')';
      const dateKey = (u.paid_at || u.due_date || u.created_at || '').substring(0, 7) || '2026-11';
      const exactDate = (u.paid_at || u.due_date || u.created_at || new Date().toISOString()).split('T')[0];

      if (u.paid_status === 'paid') {
        totalUtilities += amt;
        if (!trendMap[dateKey]) {
          trendMap[dateKey] = { period: dateKey, payments: 0, deposits: 0, refunds: 0, expenses: 0, utilities: 0, netOperatingIncome: 0, netCashflow: 0 };
        }
        trendMap[dateKey].utilities += amt;

        if (!expenseCategoryMap['Utilities']) {
          expenseCategoryMap['Utilities'] = { category: 'Utilities', total: 0, count: 0 };
        }
        expenseCategoryMap['Utilities'].total += amt;
        expenseCategoryMap['Utilities'].count += 1;

        recentTxns.push({
          id: u.id,
          date: exactDate,
          kind: 'utility',
          type: 'outflow',
          title: `${u.utility_type} Bill · ${u.provider}`,
          description: `Billing ${u.billing_period || 'period'} · ${u.notes || 'Settled utility'}`,
          category: 'Utilities',
          method: u.payment_method || 'Bank Transfer',
          amount: amt
        });
      } else {
        pendingUtilities += amt;
      }
    });

    // Compute Net Metrics for Trends
    const sortedTrends = Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
    sortedTrends.forEach(t => {
      t.netOperatingIncome = t.payments - (t.expenses + t.utilities);
      t.netCashflow = (t.payments + t.deposits - t.refunds) - (t.expenses + t.utilities);
    });

    const totalOutflow = totalExpenses + totalUtilities;
    const netRevenue = totalPayments - totalRefunds;
    const netOperatingIncome = totalPayments - totalOutflow;
    const netCashflow = (totalPayments + totalDeposits - totalRefunds) - totalOutflow;
    const operatingMargin = totalPayments > 0 ? Math.round(((netOperatingIncome) / totalPayments) * 100) : 0;

    const outstandingBalances = propertyAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const activeDeposits = propertyAccounts.reduce((sum, a) => sum + (Number(a.deposit) || 0), 0);

    // Compute method shares
    const methodsArray = Object.values(methodBreakdown).map(m => {
      const share = totalPayments > 0 ? Math.round((m.payments / totalPayments) * 100) : 0;
      return { ...m, share };
    });

    // Compute expense category shares
    const expenseCategoriesArray = Object.values(expenseCategoryMap).map(c => {
      const share = totalOutflow > 0 ? Math.round((c.total / totalOutflow) * 100) : 0;
      return { ...c, share };
    });

    // Sort recent transactions descending
    recentTxns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const payload = {
      totals: {
        payments: totalPayments,
        deposits: totalDeposits,
        refunds: totalRefunds,
        net: netCashflow,
        netRevenue,
        operationalExpenses: totalExpenses,
        utilitiesCost: totalUtilities,
        pendingUtilities,
        totalOutflow,
        netOperatingIncome,
        netCashflow,
        operatingMargin,
        outstandingBalances,
        activeDeposits
      },
      summary: {
        totalPayments,
        totalDeposits,
        totalRefunds,
        netCashflow,
        netOperatingIncome,
        totalExpenses: totalOutflow,
        netRevenue
      },
      methods: methodsArray,
      methodBreakdown: methodsArray,
      expenseCategories: expenseCategoriesArray,
      trend: sortedTrends,
      trends: sortedTrends,
      transactions: recentTxns,
      recentTransactions: recentTxns,
      granularity: 'month'
    };

    return sendJson(res, payload);
  }

  // 8. /api/reservations (POST create reservation)
  if (path === 'reservations' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const unit = db.units.find(u => u.id === body.unitId);
    if (!unit) return sendJson(res, { message: 'Unit not found' }, 404);

    const arrTime = new Date(body.arrival || Date.now()).getTime();
    const depTime = new Date(body.departure || Date.now() + 86400000).getTime();
    const nights = Math.max(1, Math.ceil((depTime - arrTime) / (86400000)));
    const totalCost = nights * Number(unit.nightly_rate);

    const resId = crypto.randomUUID();
    const ref = 'SOLTA-' + crypto.randomUUID().substring(0, 6).toUpperCase();

    const isEarlyBooking = !!body.isEarlyBooking;
    const mode = (db.approverConfig && db.approverConfig.mode) || 'required';
    const isPending = isEarlyBooking && mode === 'required';
    const paymentTerms = body.paymentTerms || 'upfront';
    const rentalType = nights >= 30 ? 'Monthly' : (body.rentalType || 'Daily');

    const newRes = {
      id: resId,
      property_id: propertyId,
      unit_id: unit.id,
      unit_code: unit.code,
      reference: ref,
      guest_name: body.guestName,
      guest_phone: body.guestPhone || '',
      payer_name: body.payerName || body.guestName,
      source: body.source || 'Direct',
      rental_type: rentalType,
      payment_terms: paymentTerms,
      total_contract_amount: totalCost,
      status: isPending ? 'pending_approval' : 'confirmed',
      is_early_booking: isEarlyBooking,
      arrival: body.arrival,
      departure: body.departure,
      checked_in_at: null,
      checked_out_at: null,
      created_at: new Date().toISOString()
    };
    db.reservations.unshift(newRes);

    // Generate Installment Schedule if payment terms is not upfront
    if (paymentTerms !== 'upfront') {
      let numInst = 1;
      if (paymentTerms === 'monthly') {
        numInst = Math.max(2, Math.round(nights / 30));
      } else if (paymentTerms === 'semi_annual') {
        numInst = 2;
      } else if (paymentTerms === 'tri_annual') {
        numInst = 3;
      } else if (paymentTerms === 'quarterly') {
        numInst = 4;
      }

      const baseAmount = Math.floor((totalCost / numInst) * 100) / 100;
      if (!db.reservationInstallments) db.reservationInstallments = [];

      for (let i = 1; i <= numInst; i++) {
        const curAmount = (i === numInst) ? Math.round((totalCost - (baseAmount * (numInst - 1))) * 100) / 100 : baseAmount;
        let offsetMonths = 0;
        let instTitle = `Installment ${i} of ${numInst}`;

        if (paymentTerms === 'monthly') {
          offsetMonths = i - 1;
          instTitle = `Installment ${i} of ${numInst} (Month ${i})`;
        } else if (paymentTerms === 'semi_annual') {
          offsetMonths = (i - 1) * 6;
          instTitle = `Installment ${i} of 2 (${i === 1 ? '1st Half / 6 Months' : '2nd Half / 6 Months'})`;
        } else if (paymentTerms === 'tri_annual') {
          offsetMonths = (i - 1) * 4;
          const label = i === 1 ? 'Months 1–4' : (i === 2 ? 'Months 5–8' : 'Months 9–12');
          instTitle = `Installment ${i} of 3 (${label})`;
        } else if (paymentTerms === 'quarterly') {
          offsetMonths = (i - 1) * 3;
          instTitle = `Installment ${i} of 4 (Quarter ${i})`;
        }

        const d = new Date(arrTime);
        d.setMonth(d.getMonth() + offsetMonths);
        const dueDate = d.toISOString().split('T')[0];

        db.reservationInstallments.push({
          id: 'inst-' + crypto.randomUUID().substring(0, 8),
          property_id: propertyId,
          reservation_id: resId,
          installment_number: i,
          title: instTitle,
          due_date: dueDate,
          amount: curAmount,
          paid_amount: 0.0,
          status: 'pending',
          paid_date: null,
          payment_method: null,
          notes: '',
          created_at: new Date().toISOString()
        });
      }
    }

    if (db.approverConfig && (db.approverConfig.notify_new_booking || isEarlyBooking)) {
      db.notifications.unshift({
        id: 'notif-' + crypto.randomUUID().substring(0, 8),
        property_id: propertyId,
        type: isEarlyBooking ? 'early_booking' : 'new_booking',
        title: isEarlyBooking
          ? (isPending ? 'Early Booking Approval Requested' : 'Early Booking (Auto-Approved)')
          : 'New Booking Registered',
        message: isEarlyBooking
          ? `Guest ${body.guestName} requested early booking for Apartment ${unit.code}. Mode: ${mode.toUpperCase()}.`
          : `New reservation confirmed for ${body.guestName} in ${unit.code}.`,
        entity_id: resId,
        status: isPending ? 'pending' : 'info',
        required_approval: isPending,
        created_at: new Date().toISOString(),
        metadata: { guest: body.guestName, unit: unit.code, arrival: body.arrival, mode }
      });
    }

    const accId = crypto.randomUUID();
    const depositAmt = Number(body.deposit) || 0;
    const newAcc = {
      id: accId,
      property_id: propertyId,
      reservation_id: resId,
      reference: ref,
      guest_name: body.guestName,
      balance: totalCost,
      deposit: depositAmt,
      created_at: new Date().toISOString()
    };
    db.stayAccounts.unshift(newAcc);

    db.stayAccountEntries.push({
      id: crypto.randomUUID(),
      account_id: accId,
      kind: 'charge',
      amount: totalCost,
      payment_method: null,
      description: `Room charges for ${nights} nights (${unit.code})`,
      actor: activeSessionUser.name,
      created_at: new Date().toISOString()
    });

    if (depositAmt > 0) {
      db.stayAccountEntries.push({
        id: crypto.randomUUID(),
        account_id: accId,
        kind: 'deposit',
        amount: depositAmt,
        payment_method: body.paymentMethod || 'Cash',
        description: 'Initial security deposit',
        actor: activeSessionUser.name,
        created_at: new Date().toISOString()
      });
    }

    logAudit(propertyId, 'reservation.created', activeSessionUser.name, {
      reference: ref,
      guest: body.guestName,
      unit: unit.code,
      total: totalCost
    });

    return sendJson(res, { ok: true, id: resId, reference: ref }, 201);
  }

  // 8b. POST /api/reservations/installment-payment
  if (path === 'reservations/installment-payment' && method === 'POST') {
    const { installmentId, amount, paymentMethod, notes } = body;
    const inst = (db.reservationInstallments || []).find(i => i.id === installmentId);
    if (!inst) return sendJson(res, { message: 'Installment not found' }, 404);

    const payAmt = Number(amount) || 0;
    inst.paid_amount = (Number(inst.paid_amount) || 0) + payAmt;
    inst.status = (inst.paid_amount >= inst.amount - 0.01) ? 'paid' : 'partially_paid';
    inst.paid_date = new Date().toISOString();
    inst.payment_method = paymentMethod || 'Cash';
    inst.notes = notes || 'Installment payment';

    const acc = db.stayAccounts.find(a => a.reservation_id === inst.reservation_id);
    if (acc) {
      acc.balance = Math.max(0, acc.balance - payAmt);
      db.stayAccountEntries.push({
        id: crypto.randomUUID(),
        account_id: acc.id,
        kind: 'payment',
        amount: payAmt,
        payment_method: paymentMethod || 'Cash',
        description: `Installment Payment: ${inst.title} (${notes || ''})`,
        actor: activeSessionUser.name,
        created_at: new Date().toISOString()
      });
    }

    logAudit(inst.property_id || db.properties[0].id, 'reservation.installment_paid', activeSessionUser.name, {
      title: inst.title,
      amount: payAmt,
      method: paymentMethod
    });

    if (db.notifications) {
      db.notifications.unshift({
        id: 'notif-' + crypto.randomUUID().substring(0, 8),
        property_id: inst.property_id || db.properties[0].id,
        type: 'installment_paid',
        title: `Installment Payment Received (${paymentMethod || 'Cash'})`,
        message: `Received ${payAmt} for ${inst.title} recorded by ${activeSessionUser.name}.`,
        entity_id: inst.reservation_id,
        status: 'info',
        required_approval: false,
        created_at: new Date().toISOString()
      });
    }

    return sendJson(res, { ok: true, paid_amount: inst.paid_amount, status: inst.status });
  }

  // 9. /api/reservations/:id/check-in, check-out, extend, cancel, inspection, approve, reject
  const resMatch = path.match(/^reservations\/([^/]+)\/(check-in|check-out|extend|cancel|inspection|approve|reject)$/);
  if (resMatch && method === 'POST') {
    const [, resId, action] = resMatch;
    const reservation = db.reservations.find(r => r.id === resId);
    if (!reservation) return sendJson(res, { message: 'Reservation not found' }, 404);

    const unit = db.units.find(u => u.id === reservation.unit_id);

    if (action === 'approve') {
      reservation.status = 'confirmed';
      const notif = db.notifications.find(n => n.entity_id === resId);
      if (notif) notif.status = 'approved';
      logAudit(reservation.property_id, 'reservation.approved', activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true });
    }

    if (action === 'reject') {
      reservation.status = 'cancelled';
      const notif = db.notifications.find(n => n.entity_id === resId);
      if (notif) notif.status = 'rejected';
      logAudit(reservation.property_id, 'reservation.rejected', activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true });
    }

    if (action === 'check-in') {
      if (reservation.status === 'pending_approval') {
        return sendJson(res, { message: 'Cannot check-in. Booking is awaiting administrative approval.' }, 400);
      }
      reservation.status = 'checked_in';
      reservation.checked_in_at = new Date().toISOString();
      if (unit) {
        unit.occupied = true;
        unit.readiness = 'ready';
      }
      logAudit(reservation.property_id, 'reservation.check_in', activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true });
    }

    if (action === 'check-out') {
      reservation.status = 'checked_out';
      reservation.checked_out_at = new Date().toISOString();
      if (unit) {
        unit.occupied = false;
        unit.readiness = 'dirty';
      }
      // Create housekeeping task
      const taskId = crypto.randomUUID();
      db.tasks.unshift({
        id: taskId,
        property_id: reservation.property_id,
        unit_id: reservation.unit_id,
        unit_code: reservation.unit_code,
        reservation_id: resId,
        assignee_id: null,
        assignee: null,
        status: 'pending',
        reason: 'Checkout turnaround: clean and inspect for new guest',
        due_at: new Date(Date.now() + 7200000).toISOString(),
        completed_at: null,
        created_at: new Date().toISOString()
      });

      logAudit(reservation.property_id, 'reservation.check_out', activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true });
    }

    if (action === 'extend') {
      const oldDep = new Date(reservation.departure || Date.now()).getTime();
      const newDep = new Date(body.departure).getTime();
      reservation.departure = body.departure;

      const addedNights = Math.max(0, Math.ceil((newDep - oldDep) / 86400000));
      if (addedNights > 0 && unit) {
        const addedCharge = addedNights * Number(unit.nightly_rate);
        const acc = db.stayAccounts.find(a => a.reservation_id === resId);
        if (acc) {
          acc.balance = (Number(acc.balance) || 0) + addedCharge;
          db.stayAccountEntries.push({
            id: crypto.randomUUID(),
            account_id: acc.id,
            kind: 'charge',
            amount: addedCharge,
            payment_method: null,
            description: `Stay extension for ${addedNights} additional night(s) (${body.notes || 'Guest requested extension'})`,
            actor: activeSessionUser.name,
            created_at: new Date().toISOString()
          });
        }
      }

      logAudit(reservation.property_id, 'reservation.extended', activeSessionUser.name, {
        reference: reservation.reference,
        newDeparture: body.departure,
        addedNights
      });
      return sendJson(res, { ok: true, addedNights });
    }

    if (action === 'cancel') {
      reservation.status = 'cancelled';
      if (unit) unit.occupied = false;
      logAudit(reservation.property_id, 'reservation.cancelled', activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true });
    }

    if (action === 'inspection') {
      const chkId = crypto.randomUUID();
      db.checklists.push({
        id: chkId,
        reservation_id: resId,
        type: body.type || 'check_in',
        lines: body.lines || [],
        guestAcknowledged: body.guestAcknowledged,
        acknowledgingGuest: body.acknowledgingGuest,
        conditionNotes: body.conditionNotes,
        created_at: new Date().toISOString()
      });
      logAudit(reservation.property_id, `inspection.${body.type || 'check_in'}`, activeSessionUser.name, { reference: reservation.reference });
      return sendJson(res, { ok: true, id: chkId });
    }
  }

  // 10. /api/inventory/receive
  if (path === 'inventory/receive' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const store = db.locations.find(l => l.property_id === propertyId && l.kind === 'store');
    if (!store) return sendJson(res, { message: 'Store not found' }, 404);

    const qty = Number(body.quantity) || 0;
    let existingStock = db.stock.find(s => s.property_id === propertyId && s.item_id === body.itemId && s.location_id === store.id);
    const item = db.items.find(i => i.id === body.itemId);

    if (existingStock) {
      existingStock.quantity += qty;
    } else {
      existingStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: store.id,
        quantity: qty,
        item_name: item ? item.name : 'Item',
        location_name: store.name
      };
      db.stock.push(existingStock);
    }

    db.movements.unshift({
      id: crypto.randomUUID(),
      property_id: propertyId,
      item_id: body.itemId,
      item_name: item ? item.name : 'Item',
      from_location_id: null,
      to_location_id: store.id,
      quantity: qty,
      actor: activeSessionUser.name,
      notes: body.notes || 'Stock delivery received',
      created_at: new Date().toISOString()
    });

    logAudit(propertyId, 'inventory.received', activeSessionUser.name, { itemId: body.itemId, quantity: qty });
    return sendJson(res, { ok: true });
  }

  // 11. /api/inventory/issue-cleaner
  if (path === 'inventory/issue-cleaner' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const store = db.locations.find(l => l.property_id === propertyId && l.kind === 'store');
    const qty = Number(body.quantity) || 0;

    let storeStock = db.stock.find(s => s.property_id === propertyId && s.item_id === body.itemId && s.location_id === store.id);
    const item = db.items.find(i => i.id === body.itemId);
    if (!storeStock) {
      storeStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: store.id,
        quantity: 0,
        item_name: item ? item.name : 'Item',
        location_name: store.name
      };
      db.stock.push(storeStock);
    }

    const currentQty = storeStock.quantity;
    const newQty = currentQty - qty;
    const isDeficit = newQty < 0;

    let cleanerLoc = db.locations.find(l => l.property_id === propertyId && l.user_id === body.cleanerId);
    if (!cleanerLoc) {
      const cleanerUser = db.users.find(u => u.id === body.cleanerId) || db.employees.find(e => e.id === body.cleanerId);
      cleanerLoc = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        name: (cleanerUser ? (cleanerUser.name || cleanerUser.full_name) : 'Staff') + ' (Cart Custody)',
        kind: 'cleaner_custody',
        user_id: body.cleanerId,
        unit_id: null
      };
      db.locations.push(cleanerLoc);
    }

    storeStock.quantity = newQty;
    let cleanerStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === cleanerLoc.id);

    if (cleanerStock) {
      cleanerStock.quantity += qty;
    } else {
      cleanerStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: cleanerLoc.id,
        quantity: qty,
        item_name: item ? item.name : 'Item',
        location_name: cleanerLoc.name
      };
      db.stock.push(cleanerStock);
    }

    const deficitNote = isDeficit ? ` [DEFICIT: Store balance dropped to ${newQty}]` : '';
    const notes = (body.notes || 'Issued to cleaner cart') + deficitNote;

    db.movements.unshift({
      id: crypto.randomUUID(),
      property_id: propertyId,
      item_id: body.itemId,
      item_name: item ? item.name : 'Item',
      from_location_id: store.id,
      to_location_id: cleanerLoc.id,
      quantity: qty,
      actor: activeSessionUser.name,
      notes,
      created_at: new Date().toISOString()
    });

    if (db.approverConfig && (db.approverConfig.notify_stock_movement || isDeficit)) {
      db.notifications.unshift({
        id: 'notif-' + crypto.randomUUID().substring(0, 8),
        property_id: propertyId,
        type: isDeficit ? 'negative_stock' : 'stock_movement',
        title: isDeficit ? 'Negative Stock Deficit Warning' : 'Stock Movement Recorded',
        message: isDeficit
          ? `Housekeeping cart issued ${qty} ${item ? item.name : 'items'}. Store deficit is now ${newQty} units.`
          : `Issued ${qty} ${item ? item.name : 'items'} to cleaner cart.`,
        entity_id: body.itemId,
        status: isDeficit && db.approverConfig.mode === 'required' ? 'pending' : 'info',
        required_approval: isDeficit && db.approverConfig.mode === 'required',
        created_at: new Date().toISOString(),
        metadata: { item: item ? item.name : 'Item', deficit: newQty, cleanerId: body.cleanerId, actor: activeSessionUser.name }
      });
    }

    logAudit(propertyId, isDeficit ? 'inventory.deficit_issued' : 'inventory.issued_cleaner', activeSessionUser.name, { cleanerId: body.cleanerId, qty, deficit: isDeficit ? newQty : null });
    return sendJson(res, { ok: true, deficit: isDeficit, currentQty: newQty });
  }

  // 11b. /api/inventory/supply-apartment
  if (path === 'inventory/supply-apartment' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const unit = db.units.find(u => u.id === body.unitId);
    if (!unit) return sendJson(res, { message: 'Unit not found' }, 404);

    let unitLoc = db.locations.find(l => l.property_id === propertyId && l.unit_id === unit.id);
    if (!unitLoc) {
      unitLoc = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        name: `Apartment ${unit.code}`,
        kind: 'unit',
        user_id: null,
        unit_id: unit.id
      };
      db.locations.push(unitLoc);
    }

    const sourceKind = body.sourceKind || 'store';
    let fromLoc;
    if (sourceKind === 'cleaner' && body.cleanerId) {
      fromLoc = db.locations.find(l => l.property_id === propertyId && l.user_id === body.cleanerId);
    } else {
      fromLoc = db.locations.find(l => l.property_id === propertyId && l.kind === 'store');
    }

    const item = db.items.find(i => i.id === body.itemId);
    let fromStock = fromLoc ? db.stock.find(s => s.item_id === body.itemId && s.location_id === fromLoc.id) : null;
    if (!fromStock && fromLoc) {
      fromStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: fromLoc.id,
        quantity: 0,
        item_name: item ? item.name : 'Item',
        location_name: fromLoc.name
      };
      db.stock.push(fromStock);
    }

    const qty = Number(body.quantity) || 0;
    const currentQty = fromStock ? fromStock.quantity : 0;
    const newQty = currentQty - qty;
    const isDeficit = newQty < 0;

    if (fromStock) {
      fromStock.quantity = newQty;
    }

    let unitStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === unitLoc.id);
    if (unitStock) {
      unitStock.quantity += qty;
    } else {
      unitStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: unitLoc.id,
        quantity: qty,
        item_name: item ? item.name : 'Item',
        location_name: unitLoc.name
      };
      db.stock.push(unitStock);
    }

    const deficitNote = isDeficit ? ` [DEFICIT: Source balance reduced to ${newQty}]` : '';
    const notes = (body.notes || `Supplied to apartment ${unit.code}`) + deficitNote;

    db.movements.unshift({
      id: crypto.randomUUID(),
      property_id: propertyId,
      item_id: body.itemId,
      item_name: item ? item.name : 'Item',
      from_location_id: fromLoc ? fromLoc.id : null,
      to_location_id: unitLoc.id,
      quantity: qty,
      actor: activeSessionUser.name,
      notes,
      created_at: new Date().toISOString()
    });

    if (db.approverConfig && (db.approverConfig.notify_stock_movement || isDeficit)) {
      db.notifications.unshift({
        id: 'notif-' + crypto.randomUUID().substring(0, 8),
        property_id: propertyId,
        type: isDeficit ? 'negative_stock' : 'stock_movement',
        title: isDeficit ? 'Negative Stock Deficit in Apartment Supply' : 'Apartment Stock Supplied',
        message: isDeficit
          ? `Supplied ${qty} ${item ? item.name : 'items'} to ${unit.code}. Source deficit is now ${newQty} units.`
          : `Supplied ${qty} ${item ? item.name : 'items'} to apartment ${unit.code}.`,
        entity_id: body.itemId,
        status: isDeficit && db.approverConfig.mode === 'required' ? 'pending' : 'info',
        required_approval: isDeficit && db.approverConfig.mode === 'required',
        created_at: new Date().toISOString(),
        metadata: { item: item ? item.name : 'Item', unit: unit.code, deficit: newQty, actor: activeSessionUser.name }
      });
    }

    logAudit(propertyId, isDeficit ? 'inventory.deficit_supplied' : 'inventory.supplied_apartment', activeSessionUser.name, { unitCode: unit.code, qty, item: item?.name, deficit: isDeficit ? newQty : null });
    return sendJson(res, { ok: true, deficit: isDeficit, currentQty: newQty });
  }

  // 11c. /api/inventory/return-store
  if (path === 'inventory/return-store' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const store = db.locations.find(l => l.property_id === propertyId && l.kind === 'store');
    const fromLoc = db.locations.find(l => l.id === body.fromLocationId);
    if (!fromLoc || !store) return sendJson(res, { message: 'Location not found' }, 404);

    const qty = Number(body.quantity) || 0;
    const fromStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === fromLoc.id);
    if (!fromStock || fromStock.quantity < qty) {
      return sendJson(res, { message: `Insufficient stock to return. Available: ${fromStock ? fromStock.quantity : 0}` }, 400);
    }

    fromStock.quantity -= qty;
    let storeStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === store.id);
    const item = db.items.find(i => i.id === body.itemId);

    if (storeStock) {
      storeStock.quantity += qty;
    } else {
      storeStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: store.id,
        quantity: qty,
        item_name: item ? item.name : 'Item',
        location_name: store.name
      };
      db.stock.push(storeStock);
    }

    db.movements.unshift({
      id: crypto.randomUUID(),
      property_id: propertyId,
      item_id: body.itemId,
      item_name: item ? item.name : 'Item',
      from_location_id: fromLoc.id,
      to_location_id: store.id,
      quantity: qty,
      actor: activeSessionUser.name,
      notes: body.notes || `Returned to store from ${fromLoc.name}`,
      created_at: new Date().toISOString()
    });

    logAudit(propertyId, 'inventory.returned_store', activeSessionUser.name, { from: fromLoc.name, qty, item: item?.name });
    return sendJson(res, { ok: true });
  }

  // 11d. /api/inventory/place-durable
  if (path === 'inventory/place-durable' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const unit = db.units.find(u => u.id === body.unitId);
    const store = db.locations.find(l => l.property_id === propertyId && l.kind === 'store');
    if (!unit || !store) return sendJson(res, { message: 'Unit or store not found' }, 404);

    let unitLoc = db.locations.find(l => l.property_id === propertyId && l.unit_id === unit.id);
    if (!unitLoc) {
      unitLoc = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        name: `Apartment ${unit.code}`,
        kind: 'unit',
        user_id: null,
        unit_id: unit.id
      };
      db.locations.push(unitLoc);
    }

    const qty = Number(body.quantity) || 1;
    const storeStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === store.id);
    if (!storeStock || storeStock.quantity < qty) {
      return sendJson(res, { message: `Insufficient store inventory. Available: ${storeStock ? storeStock.quantity : 0}` }, 400);
    }

    storeStock.quantity -= qty;
    let unitStock = db.stock.find(s => s.item_id === body.itemId && s.location_id === unitLoc.id);
    const item = db.items.find(i => i.id === body.itemId);

    if (unitStock) {
      unitStock.quantity += qty;
    } else {
      unitStock = {
        id: crypto.randomUUID(),
        property_id: propertyId,
        item_id: body.itemId,
        location_id: unitLoc.id,
        quantity: qty,
        item_name: item ? item.name : 'Item',
        location_name: unitLoc.name
      };
      db.stock.push(unitStock);
    }

    db.movements.unshift({
      id: crypto.randomUUID(),
      property_id: propertyId,
      item_id: body.itemId,
      item_name: item ? item.name : 'Item',
      from_location_id: store.id,
      to_location_id: unitLoc.id,
      quantity: qty,
      actor: activeSessionUser.name,
      notes: body.notes || `Placed durable asset in ${unit.code}${body.serialNumber ? ` (S/N: ${body.serialNumber})` : ''}`,
      created_at: new Date().toISOString()
    });

    logAudit(propertyId, 'inventory.placed_durable', activeSessionUser.name, { unitCode: unit.code, qty, item: item?.name });
    return sendJson(res, { ok: true });
  }

  // 12. /api/inventory/items
  if (path === 'inventory/items' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const newItem = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      name: body.name,
      kind: body.kind || 'consumable',
      unit: body.unit || 'piece',
      replacement_price: Number(body.replacementPrice) || 0
    };
    db.items.push(newItem);
    logAudit(propertyId, 'inventory.item_created', activeSessionUser.name, { name: body.name });
    return sendJson(res, { ok: true, id: newItem.id }, 201);
  }

  // 13. /api/tasks (POST)
  if (path === 'tasks' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const unit = db.units.find(u => u.id === body.unitId);
    const assignee = db.users.find(u => u.id === body.assigneeId) || db.employees.find(e => e.id === body.assigneeId);

    const newTask = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      unit_id: body.unitId,
      unit_code: unit ? unit.code : 'Unit',
      assignee_id: body.assigneeId || null,
      assignee: assignee ? (assignee.name || assignee.full_name) : null,
      status: 'pending',
      reason: body.reason || 'Turnaround cleaning',
      due_at: new Date(Date.now() + 86400000).toISOString(),
      completed_at: null,
      created_at: new Date().toISOString()
    };
    db.tasks.unshift(newTask);
    if (unit) unit.readiness = 'dirty';

    logAudit(propertyId, 'housekeeping.task_created', activeSessionUser.name, { unitId: body.unitId, reason: body.reason });
    return sendJson(res, { ok: true, id: newTask.id }, 201);
  }

  // 14. /api/tasks/:id (PATCH)
  const taskMatch = path.match(/^tasks\/([^/]+)$/);
  if (taskMatch && method === 'PATCH') {
    const taskId = taskMatch[1];
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return sendJson(res, { message: 'Task not found' }, 404);

    if (body.status) {
      task.status = body.status;
      if (body.status === 'completed') {
        task.completed_at = new Date().toISOString();
        const unit = db.units.find(u => u.id === task.unit_id);
        if (unit) unit.readiness = 'ready';
        logAudit(task.property_id, 'housekeeping.completed', activeSessionUser.name, { taskId, unitId: task.unit_id });
      }
    }
    if (body.assigneeId !== undefined) {
      task.assignee_id = body.assigneeId;
      const assignee = db.users.find(u => u.id === body.assigneeId) || db.employees.find(e => e.id === body.assigneeId);
      task.assignee = assignee ? (assignee.name || assignee.full_name) : null;
    }
    return sendJson(res, { ok: true });
  }

  // 15. /api/roles/:id/permissions (PATCH)
  const rolePermMatch = path.match(/^roles\/([^/]+)\/permissions$/);
  if (rolePermMatch && method === 'PATCH') {
    const roleId = rolePermMatch[1];
    const { code, enabled } = body;
    let rp = db.rolePermissions.find(r => r.role_id === roleId && r.permission_code === code);
    if (rp) {
      rp.enabled = !!enabled;
    } else {
      db.rolePermissions.push({ role_id: roleId, permission_code: code, enabled: !!enabled });
    }
    logAudit(db.properties[0].id, 'role.permission_changed', activeSessionUser.name, { role_id: roleId, code, enabled });
    return sendJson(res, { ok: true });
  }

  // 16. /api/roles (POST)
  if (path === 'roles' && method === 'POST') {
    const propertyId = body.propertyId || null;
    const newRole = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      name: body.name,
      created_at: new Date().toISOString()
    };
    db.roles.push(newRole);
    logAudit(propertyId || db.properties[0].id, 'role.created', activeSessionUser.name, { name: body.name });
    return sendJson(res, { ok: true, id: newRole.id }, 201);
  }

  // 17. /api/users (POST)
  if (path === 'users' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const existing = db.users.find(u => u.email === body.email);
    if (existing) {
      return sendJson(res, { message: 'A staff member with this email already exists' }, 400);
    }
    const newUser = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      name: body.name,
      email: body.email,
      password: body.password,
      role_id: body.roleId,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);

    if (body.cleaner) {
      db.locations.push({
        id: crypto.randomUUID(),
        property_id: propertyId,
        name: `${body.name} (Cart Custody)`,
        kind: 'cleaner_custody',
        user_id: newUser.id,
        unit_id: null
      });
    }

    logAudit(propertyId, 'staff.created', activeSessionUser.name, { name: body.name, email: body.email });
    return sendJson(res, { ok: true, id: newUser.id }, 201);
  }

  // 18. /api/payment-methods/:id (PATCH)
  const pmMatch = path.match(/^payment-methods\/([^/]+)$/);
  if (pmMatch && method === 'PATCH') {
    const pmId = pmMatch[1];
    const pm = db.paymentMethods.find(p => p.id === pmId);
    if (pm) {
      pm.active = !!body.active;
      logAudit(pm.property_id, 'payment_method.updated', activeSessionUser.name, { id: pmId, active: pm.active });
    }
    return sendJson(res, { ok: true });
  }

  // 19. /api/payment-methods (POST)
  if (path === 'payment-methods' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const newPm = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      name: body.name,
      active: true,
      created_at: new Date().toISOString()
    };
    db.paymentMethods.push(newPm);
    logAudit(propertyId, 'payment_method.created', activeSessionUser.name, { name: body.name });
    return sendJson(res, { ok: true, id: newPm.id }, 201);
  }

  // 20. Human Resources / Employees Endpoints
  if (path === 'employees' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    if (!body.full_name || !body.phone || !body.position) {
      return sendJson(res, { message: 'Full name, phone, and position are required' }, 400);
    }
    const newEmp = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      full_name: body.full_name.trim(),
      birth_date: body.birth_date || '',
      fayda_id: (body.fayda_id || '').trim(), // Fayda / National ID is not mandatory
      phone: body.phone.trim(),
      email: (body.email || '').trim(),
      position: body.position.trim(),
      department: body.department || 'Operations',
      employment_type: body.employment_type || 'Full-Time',
      hire_date: body.hire_date || new Date().toISOString().split('T')[0],
      contract_end_date: body.contract_end_date || '',
      base_salary: Number(body.base_salary) || 0,
      allowance: Number(body.allowance) || 0,
      bank_name: (body.bank_name || '').trim(),
      account_number: (body.account_number || '').trim(),
      emergency_contact: (body.emergency_contact || '').trim(),
      status: body.status || 'active',
      created_at: new Date().toISOString()
    };
    db.employees.unshift(newEmp);
    logAudit(propertyId, 'employee.created', activeSessionUser.name, { name: newEmp.full_name, position: newEmp.position });
    return sendJson(res, { ok: true, id: newEmp.id, employee: newEmp }, 201);
  }

  const empMatch = path.match(/^employees\/([^/]+)$/);
  if (empMatch) {
    const empId = empMatch[1];
    const emp = db.employees.find(e => e.id === empId);
    if (!emp) return sendJson(res, { message: 'Employee record not found' }, 404);

    if (method === 'PATCH' || method === 'PUT') {
      Object.assign(emp, body);
      logAudit(emp.property_id, 'employee.updated', activeSessionUser.name, { id: empId, name: emp.full_name });
      return sendJson(res, { ok: true, employee: emp });
    }

    if (method === 'DELETE') {
      db.employees = db.employees.filter(e => e.id !== empId);
      logAudit(emp.property_id, 'employee.deleted', activeSessionUser.name, { id: empId, name: emp.full_name });
      return sendJson(res, { ok: true });
    }
  }

  // 21. Expenses Endpoints
  if (path === 'expenses' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    if (!body.title || !body.amount) {
      return sendJson(res, { message: 'Expense title and amount are required' }, 400);
    }
    const newExp = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      title: body.title.trim(),
      category: body.category || 'Supplies',
      amount: Number(body.amount) || 0,
      payment_method: body.payment_method || 'Cash',
      payee: (body.payee || '').trim(),
      reference_no: (body.reference_no || '').trim(),
      expense_date: body.expense_date || new Date().toISOString().split('T')[0],
      notes: (body.notes || '').trim(),
      recorded_by: activeSessionUser.name,
      created_at: new Date().toISOString()
    };
    db.expenses.unshift(newExp);
    logAudit(propertyId, 'expense.created', activeSessionUser.name, { title: newExp.title, amount: newExp.amount });
    return sendJson(res, { ok: true, id: newExp.id }, 201);
  }

  const expMatch = path.match(/^expenses\/([^/]+)$/);
  if (expMatch && method === 'DELETE') {
    const expId = expMatch[1];
    const exp = db.expenses.find(e => e.id === expId);
    if (exp) {
      db.expenses = db.expenses.filter(e => e.id !== expId);
      logAudit(exp.property_id, 'expense.deleted', activeSessionUser.name, { id: expId, title: exp.title });
    }
    return sendJson(res, { ok: true });
  }

  // 22. Utilities Endpoints
  if (path === 'utilities' && method === 'POST') {
    const propertyId = body.propertyId || db.properties[0].id;
    const prevMeter = body.meter_reading_prev !== undefined && body.meter_reading_prev !== '' ? Number(body.meter_reading_prev) : null;
    const currMeter = body.meter_reading_curr !== undefined && body.meter_reading_curr !== '' ? Number(body.meter_reading_curr) : null;
    const unitsUsed = (prevMeter !== null && currMeter !== null && currMeter >= prevMeter)
      ? (currMeter - prevMeter)
      : (body.consumption_units ? Number(body.consumption_units) : null);

    const newUtil = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      utility_type: body.utility_type || 'Electricity',
      provider: body.provider || 'Ethiopian Electric Utility (EEU)',
      meter_reading_prev: prevMeter,
      meter_reading_curr: currMeter,
      consumption_units: unitsUsed,
      billing_period: body.billing_period || 'Current Month',
      amount: Number(body.amount) || 0,
      due_date: body.due_date || new Date().toISOString().split('T')[0],
      status: body.status || 'pending',
      payment_date: body.status === 'paid' ? (body.payment_date || new Date().toISOString().split('T')[0]) : null,
      payment_method: body.payment_method || null,
      reference_no: (body.reference_no || '').trim(),
      notes: (body.notes || '').trim(),
      created_at: new Date().toISOString()
    };
    db.utilities.unshift(newUtil);
    logAudit(propertyId, 'utility.created', activeSessionUser.name, { type: newUtil.utility_type, amount: newUtil.amount });
    return sendJson(res, { ok: true, id: newUtil.id }, 201);
  }

  const utilPayMatch = path.match(/^utilities\/([^/]+)\/pay$/);
  if (utilPayMatch && method === 'PATCH') {
    const utilId = utilPayMatch[1];
    const util = db.utilities.find(u => u.id === utilId);
    if (!util) return sendJson(res, { message: 'Utility bill not found' }, 404);
    util.status = 'paid';
    util.payment_date = body.payment_date || new Date().toISOString().split('T')[0];
    util.payment_method = body.payment_method || 'Telebirr';
    logAudit(util.property_id, 'utility.paid', activeSessionUser.name, { id: utilId, type: util.utility_type, amount: util.amount });
    return sendJson(res, { ok: true });
  }

  const utilMatch = path.match(/^utilities\/([^/]+)$/);
  if (utilMatch && method === 'DELETE') {
    const utilId = utilMatch[1];
    const util = db.utilities.find(u => u.id === utilId);
    if (util) {
      db.utilities = db.utilities.filter(u => u.id !== utilId);
      logAudit(util.property_id, 'utility.deleted', activeSessionUser.name, { id: utilId, type: util.utility_type });
    }
    return sendJson(res, { ok: true });
  }

  // 23. Approver Configuration Endpoints
  if (path === 'approver-config') {
    if (method === 'GET') {
      return sendJson(res, db.approverConfig);
    }
    if (method === 'POST') {
      db.approverConfig = {
        ...db.approverConfig,
        ...body,
        updated_at: new Date().toISOString()
      };
      logAudit(body.property_id || db.properties[0].id, 'approver.config_updated', activeSessionUser.name, {
        mode: db.approverConfig.mode,
        approver: db.approverConfig.approver_name
      });
      return sendJson(res, { ok: true, approverConfig: db.approverConfig });
    }
  }

  // 24. System Notifications & Activity Alert Ledger
  if (path === 'notifications' && method === 'GET') {
    return sendJson(res, db.notifications);
  }

  // 25. Executive Approvals Actions (Approve / Reject)
  if (path === 'approvals/action' && method === 'POST') {
    const { notificationId, action, notes } = body;
    const notif = db.notifications.find(n => n.id === notificationId);
    if (!notif) return sendJson(res, { message: 'Notification not found' }, 404);

    notif.status = action === 'approve' ? 'approved' : 'rejected';
    notif.action_taken_by = activeSessionUser.name;
    notif.action_taken_at = new Date().toISOString();
    notif.action_notes = notes || '';

    if (notif.type === 'early_booking' && notif.entity_id) {
      const resv = db.reservations.find(r => r.id === notif.entity_id);
      if (resv) {
        resv.status = action === 'approve' ? 'confirmed' : 'cancelled';
        logAudit(resv.property_id, `reservation.${action === 'approve' ? 'approved' : 'rejected'}`, activeSessionUser.name, {
          reference: resv.reference,
          guest: resv.guest_name
        });
      }
    }

    logAudit(notif.property_id, `approval.${action}`, activeSessionUser.name, {
      notificationId,
      title: notif.title,
      action
    });
    return sendJson(res, { ok: true, notification: notif });
  }

  // Fallback
  return sendJson(res, { message: `Not found: ${req.method} /api/${path}` }, 404);
}
