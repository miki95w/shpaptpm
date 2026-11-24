import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  DollarSign,
  Wallet,
  Package,
  Sparkles,
  Shield,
  ShieldCheck,
  History,
  LogOut,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Printer,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Bed,
  Bath,
  Users,
  Maximize2,
  Briefcase,
  Receipt,
  Zap,
  Droplets,
  Flame,
  UserPlus,
  Edit3,
  Trash2,
  CreditCard,
  Clock,
  Phone,
  Mail,
  Lock,
  Headphones,
  FileText,
  Box,
  Boxes,
  Layers,
  ArrowLeftRight,
  Check,
  List,
  Grid,
  Wrench,
  Download,
  BarChart2,
  CalendarCheck,
  Tv,
  Bell,
  Save
} from 'lucide-react';

const API_BASE = '/api';

// Safe UUID generator compatible with both HTTPS secure contexts and plain HTTP / IP access
function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'fergami'
  };
  if (method !== 'GET') {
    headers['Idempotency-Key'] = generateUuid();
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

function formatMoney(amount, currency = 'ETB') {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function getUnitOverstayInfo(unit, reservations = []) {
  if (!unit) return null;
  // Match active checked_in reservation or occupied unit
  const activeRes = reservations.find(r =>
    (r.unit_id === unit.id || r.unit_code === unit.code) &&
    (r.status === 'checked_in' || (unit.occupied && r.status !== 'checked_out' && r.status !== 'cancelled'))
  );
  if (!activeRes || !activeRes.departure) return null;

  const now = Date.now();
  const depTime = new Date(activeRes.departure).getTime();
  if (now > depTime) {
    const diffMs = now - depTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const timeOverdue = diffDays > 0
      ? `${diffDays}d ${diffHours % 24}h`
      : `${Math.max(1, diffHours)}h`;
    return {
      isOverstay: true,
      reservation: activeRes,
      timeOverdue,
      diffHours,
      diffDays,
      scheduledDeparture: activeRes.departure
    };
  }
  return {
    isOverstay: false,
    reservation: activeRes,
    scheduledDeparture: activeRes.departure
  };
}

// Reusable High-Legibility Pagination Component (15 items max per page)
function Pagination({
  totalItems,
  pageSize = 15,
  currentPage = 1,
  onPageChange,
  itemName = 'entries'
}) {
  const total = Number(totalItems) || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

  if (total === 0) {
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing <strong>0</strong> of <strong>0</strong> {itemName}
        </div>
      </div>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  // Dynamic window around current page with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      const arr = [];
      for (let i = 1; i <= totalPages; i++) arr.push(i);
      return arr;
    }
    const arr = [1];
    let left = Math.max(2, page - 1);
    let right = Math.min(totalPages - 1, page + 1);

    if (page <= 3) {
      right = 4;
    } else if (page >= totalPages - 2) {
      left = totalPages - 3;
    }

    if (left > 2) arr.push('...');
    for (let i = left; i <= right; i++) arr.push(i);
    if (right < totalPages - 1) arr.push('...');
    arr.push(totalPages);
    return arr;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <strong>{startIdx.toLocaleString()}</strong>–<strong>{endIdx.toLocaleString()}</strong> of <strong>{total.toLocaleString()}</strong> {itemName}
      </div>
      <div className="pagination-nav">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title="First Page"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={`page-${p}`}
              type="button"
              className={`pagination-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}

// Reusable Typeable & Searchable Dropdown Component
function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Type to search or choose…',
  required = false,
  allowCustom = false,
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapRef = useRef(null);

  const normalizedOptions = useMemo(
    () => (options || []).map(o => ({
      value: String(o.value ?? ''),
      label: String(o.label ?? o.value ?? ''),
      sublabel: o.sublabel ? String(o.sublabel) : ''
    })),
    [options]
  );

  const selectedOption = normalizedOptions.find(o => o.value === String(value ?? ''));
  const displayValue = open
    ? query
    : (selectedOption ? selectedOption.label : (allowCustom && value ? String(value) : ''));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      o => o.label.toLowerCase().includes(q) || o.sublabel.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, query]);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setHighlightIdx(0);
  }, [query, open]);

  const selectValue = val => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = e => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightIdx]) {
        selectValue(filtered[highlightIdx].value);
      } else if (allowCustom && query.trim()) {
        selectValue(query.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="searchable-select-wrap" ref={wrapRef}>
      <div className="searchable-select-input-box">
        <input
          type="text"
          className="searchable-select-input"
          value={displayValue}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onChange={e => {
            const txt = e.target.value;
            setQuery(txt);
            setOpen(true);
            if (allowCustom) {
              onChange(txt);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          className="searchable-select-chevron"
          onClick={() => {
            if (disabled) return;
            setQuery('');
            setOpen(prev => !prev);
          }}
          aria-label="Toggle options"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value || ''}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />
      )}

      {open && !disabled && (
        <div className="searchable-select-menu">
          {filtered.map((opt, idx) => {
            const isSel = opt.value === String(value ?? '');
            return (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                className={`searchable-select-option ${isSel ? 'selected' : ''} ${idx === highlightIdx ? 'highlighted' : ''}`}
                onMouseDown={e => {
                  e.preventDefault();
                  selectValue(opt.value);
                }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div>{opt.label}</div>
                  {opt.sublabel && <small className="muted">{opt.sublabel}</small>}
                </div>
                {isSel && <Check size={14} color="#1d4ed8" />}
              </button>
            );
          })}

          {allowCustom && query.trim() && !filtered.some(o => o.label.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              className="searchable-select-option custom-add"
              onMouseDown={e => {
                e.preventDefault();
                selectValue(query.trim());
              }}
            >
              <span>Use "{query.trim()}"</span>
            </button>
          )}

          {filtered.length === 0 && !allowCustom && (
            <div className="searchable-select-empty">No matching options</div>
          )}
        </div>
      )}
    </div>
  );
}

const APARTMENT_IMAGES = {
  studio: { src: '/images/solta/one-bedroom/onebed-5.webp', label: 'Studio' },
  one: { src: '/images/solta/one-bedroom/onebed-5.webp', label: 'One-bedroom' },
  two: { src: '/images/solta/two-bedroom/twobed-4.webp', label: 'Two-bedroom' },
  three: { src: '/images/solta/three-bedroom/threebed-2.webp', label: 'Three-bedroom' }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('admin@gmail.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mgmtDropdownOpen, setMgmtDropdownOpen] = useState(false);
  const mgmtDropdownRef = useRef(null);
  const [toast, setToast] = useState('');

  // Modals
  const [activeDialog, setActiveDialog] = useState(null);
  const [selectedStayAccount, setSelectedStayAccount] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [extensionModalData, setExtensionModalData] = useState(null);
  const [mgmtSubTab, setMgmtSubTab] = useState('employees');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeModalData, setEmployeeModalData] = useState(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [utilityModalOpen, setUtilityModalOpen] = useState(false);
  const [payingUtility, setPayingUtility] = useState(null);
  const [approverModalOpen, setApproverModalOpen] = useState(false);
  const [approverConfig, setApproverConfig] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [financeSubTab, setFinanceSubTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('');

  // Initial Auth Check
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setLoading(true);
    try {
      const res = await apiCall('/me');
      setCurrentUser(res.user);
      setProperties(res.properties || []);
      if (res.properties && res.properties.length > 0) {
        setPropertyId(res.properties[0].id);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Load Operational Data whenever propertyId changes
  useEffect(() => {
    if (currentUser && propertyId) {
      loadData();
    }
  }, [currentUser, propertyId]);

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await apiCall(`/data?propertyId=${propertyId}`);
      setData(res);
      if (res.approverConfig) setApproverConfig(res.approverConfig);
      if (res.notifications) setNotifications(res.notifications);
      if (res.roles && res.roles.length > 0 && !selectedRoleForPerms) {
        setSelectedRoleForPerms(res.roles[0].id);
      }
      if (propertyId) {
        loadFinanceAnalytics(propertyId);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function loadFinanceAnalytics(propId = propertyId) {
    if (!propId) return;
    setAnalyticsLoading(true);
    try {
      const res = await apiCall(`/reports?propertyId=${propId}&mode=finance`);
      setAnalyticsData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load financial analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  // Load Finance Analytics whenever opening the Finance tab or switching properties
  useEffect(() => {
    if (activeTab === 'Finance' && propertyId) {
      loadFinanceAnalytics(propertyId);
    }
  }, [activeTab, propertyId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      await apiCall('/login', 'POST', { email: loginEmail.trim(), password: loginPassword });
      const auth = await apiCall('/me');
      if (!auth || !auth.user) {
        throw new Error('Signed in successfully, but session could not be established. Please check browser cookies or server sessions.');
      }
      setCurrentUser(auth.user);
      setProperties(auth.properties || []);
      if (auth.properties && auth.properties.length > 0) {
        setPropertyId(auth.properties[0].id);
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await apiCall('/logout', 'POST');
    } catch { }
    setCurrentUser(null);
    setData(null);
  }

  // Permission Check Helper
  function hasPerm(permCode) {
    if (!currentUser || !currentUser.permissions) return true;
    return currentUser.permissions.includes(permCode);
  }

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'def28ddb-4a03-44a2-a540-cf49c8ffea1c' ||
      (currentUser.roleName || '').toLowerCase().includes('admin') ||
      (currentUser.email || '').toLowerCase() === 'admin@gmail.com'
    )
  );

  const isManagerOrAdmin = Boolean(
    isAdmin || (
      currentUser && (
        currentUser.role === 'role-manager' ||
        (currentUser.roleName || '').toLowerCase().includes('manager')
      )
    )
  );

  const currentProperty = properties.find(p => p.id === propertyId) || {
    name: 'Solta Hotel Apartment',
    currency: 'ETB',
    timezone: 'Africa/Addis_Ababa'
  };

  // Navigation Items (Management dropdown groups Management, Finance, Access & roles, Audit history)
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
    { name: 'Apartments', icon: Building2, perm: 'apartments.view' },
    { name: 'Bookings', icon: Calendar, perm: 'reservations.view' },
    { name: 'Stay Accounts', icon: Wallet, perm: 'finance.view' },
    { name: 'Inventory', icon: Package, perm: 'inventory.view' },
    { name: 'Housekeeping', icon: Sparkles, perm: 'housekeeping.view' },
    {
      name: 'Management',
      icon: Briefcase,
      perm: 'management.view',
      isDropdown: true,
      children: [
        { name: 'Management', label: 'Operations & HR', desc: 'Staff, expenses & utilities', icon: Briefcase, perm: 'management.view' },
        { name: 'Finance', label: 'Finance', desc: 'Revenue, accounts & methods', icon: DollarSign, perm: 'finance.view' },
        { name: 'Access & roles', label: 'Access & roles', desc: 'Permissions & approvals', icon: Shield, perm: 'roles.manage' },
        { name: 'Audit history', label: 'Audit history', desc: 'System activity log', icon: History, perm: 'audit.view' }
      ]
    },
    { name: 'Reports', icon: BarChart2, perm: 'reports.view' }
  ];

  const managementGroupTabs = ['Management', 'Finance', 'Access & roles', 'Audit history'];

  useEffect(() => {
    function handleOutsideClick(e) {
      if (mgmtDropdownRef.current && !mgmtDropdownRef.current.contains(e.target)) {
        setMgmtDropdownOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMgmtDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Loading View
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <main className="login">
        <p role="status" style={{ textAlign: 'center', padding: '100px 20px', gridColumn: 'span 2' }}>
          Loading your workspace…
        </p>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // Login Screen
  // --------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <main className="login-page-container">
        {/* Left Hero Story Panel */}
        <section className="login-hero-panel">
          <div className="login-hero-content">
            {/* Logo Brand Card */}
            <div className="login-brand-card">
              <img src="/solta-logo.png" alt="Solta Hotel Apartment" />
            </div>

            {/* Hero Main Copy */}
            <div className="login-hero-text">
              <p className="login-hero-eyebrow">A BETTER STAY AT YOUR PROPERTY</p>
              <div className="login-hero-accent-bar" />
              <h1 className="login-hero-title">
                Every apartment<br />
                Every stay.<br />
                <span className="login-hero-script">All together.</span>
              </h1>
              <p className="login-hero-desc">
                Thoughtful operations, from the first welcome to the final check.
              </p>
            </div>

            {/* Bottom 3 Feature Pillars */}
            <div className="login-hero-features">
              <div className="login-hero-feature-item">
                <div className="login-feature-icon-box">
                  <Bed size={22} color="#ffffff" strokeWidth={1.8} />
                </div>
                <span>Comfortable<br />Stays</span>
              </div>

              <div className="login-feature-divider" />

              <div className="login-hero-feature-item">
                <div className="login-feature-icon-box">
                  <ShieldCheck size={22} color="#ffffff" strokeWidth={1.8} />
                </div>
                <span>Secure &amp;<br />Reliable</span>
              </div>

              <div className="login-feature-divider" />

              <div className="login-hero-feature-item">
                <div className="login-feature-icon-box">
                  <Headphones size={22} color="#ffffff" strokeWidth={1.8} />
                </div>
                <span>Dedicated<br />Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Login Form Panel */}
        <section className="login-form-panel">
          <div className="login-form-box">
            <div className="login-badge-circle">
              <ShieldCheck size={32} color="#0052cc" strokeWidth={2.2} />
            </div>

            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to your property workspace.</p>

            {loginError && (
              <div className="login-error-alert" role="alert">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form-fields">
              <div className="login-input-group">
                <label className="login-input-label">Email address</label>
                <div className="login-input-wrapper">
                  <Mail size={18} className="login-field-icon" />
                  <input
                    type="email"
                    required
                    placeholder="admin@gmail.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label className="login-input-label">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-field-icon" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              <button type="submit" disabled={loggingIn} className="login-submit-btn">
                <span>{loggingIn ? 'Signing in…' : 'SignIn'}</span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <div
              className="login-support-link"
              onClick={() => showToast('For assistance, contact Solta operations desk or IT support.')}
            >
              <Lock size={13} />
              <span>Need help? Contact support</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  async function handleQuickMarkReady(unit) {
    try {
      await apiCall('/units/mode', 'POST', { id: unit.id, mode: 'ready' });
      await loadData();
      showToast(`${unit.code} marked as Ready`);
    } catch (err) {
      showToast(err.message || 'Unable to update apartment status');
    }
  }

  return (
    <div className="app-container topnav-layout">
      {/* TOP HORIZONTAL NAVIGATION BAR */}
      <header className="topnav-bar">
        <div className="topnav-left">
          <button
            className="icon mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          <div
            className="topnav-logo"
            onClick={() => setActiveTab('Dashboard')}
            title="Go to Dashboard"
            style={{ cursor: 'pointer' }}
          >
            <img src="/solta-logo.png" alt="Solta Hotel Apartment" />
          </div>
        </div>

        <nav className="topnav-pills" aria-label="Main navigation">
          {navItems.map(item => {
            if (item.isDropdown) {
              const isGroupActive = managementGroupTabs.includes(activeTab);
              const activeChild = item.children.find(c => c.name === activeTab);
              return (
                <div key={item.name} className="topnav-dropdown-wrap" ref={mgmtDropdownRef}>
                  <button
                    type="button"
                    className={`topnav-pill ${isGroupActive ? 'active' : ''}`}
                    onClick={() => setMgmtDropdownOpen(prev => !prev)}
                    aria-expanded={mgmtDropdownOpen}
                    aria-haspopup="menu"
                  >
                    <span>
                      {isGroupActive && activeChild && activeChild.name !== 'Management'
                        ? `Management · ${activeChild.label}`
                        : item.name}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        transition: 'transform 0.15s ease',
                        transform: mgmtDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>

                  {mgmtDropdownOpen && (
                    <div className="topnav-dropdown-menu" role="menu">
                      <div className="topnav-dropdown-header">Management &amp; Governance</div>
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const childActive = activeTab === child.name;
                        return (
                          <button
                            key={child.name}
                            type="button"
                            role="menuitem"
                            className={`topnav-dropdown-item ${childActive ? 'active' : ''}`}
                            onClick={() => {
                              setActiveTab(child.name);
                              setMgmtDropdownOpen(false);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <div className="topnav-dropdown-icon">
                              <ChildIcon size={16} />
                            </div>
                            <div className="topnav-dropdown-text">
                              <strong>{child.label}</strong>
                              <span>{child.desc}</span>
                            </div>
                            {childActive && <Check size={14} className="topnav-dropdown-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = activeTab === item.name;
            return (
              <button
                key={item.name}
                type="button"
                className={`topnav-pill ${active ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.name);
                  setMgmtDropdownOpen(false);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="topnav-right">
          {properties.length > 1 && (
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            className="icon"
            title="Refresh workspace data"
            onClick={loadData}
            disabled={refreshing}
          >
            <RefreshCw size={17} className={refreshing ? 'spinning' : ''} />
          </button>

          <button
            className="icon notification-bell-btn"
            title="Executive Approvals & Notifications"
            onClick={() => setApproverModalOpen(true)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {(notifications || []).filter(n => n.status === 'pending').length > 0 && (
              <span className="bell-badge">
                {(notifications || []).filter(n => n.status === 'pending').length}
              </span>
            )}
          </button>

          <div className="user-badge" title={currentUser.email}>
            {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
          </div>

          <button
            className="icon"
            title="Sign out"
            onClick={handleLogout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-drawer-head">
              <div className="topnav-logo">
                <img src="/solta-logo.png" alt="Solta Hotel Apartment" />
              </div>
              <button className="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="mobile-nav-list">
              {navItems.map(item => {
                if (item.isDropdown) {
                  return (
                    <div key={item.name} className="mobile-nav-group">
                      <div className="mobile-nav-group-label">Management</div>
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const childActive = activeTab === child.name;
                        return (
                          <button
                            key={child.name}
                            type="button"
                            className={`mobile-nav-item ${childActive ? 'active' : ''}`}
                            onClick={() => {
                              setActiveTab(child.name);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <ChildIcon size={17} />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                const Icon = item.icon;
                const active = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`mobile-nav-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.name);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="main topnav-main">

        {/* TOAST MESSAGE */}
        {toast && (
          <div className="toast-notification">
            <CheckCircle2 size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* TAB CONTENTS */}
        <div className="content">
          {/* TAB 1: DASHBOARD */}
          {(activeTab === 'Dashboard' || activeTab === 'Overview') && (
            <OverviewView
              data={data}
              property={currentProperty}
              analyticsData={analyticsData}
              onNavigate={setActiveTab}
              onNewBooking={() => openNewBookingDialog()}
              onSelectUnit={unit => setSelectedUnit(unit)}
              onOpenExtension={(unit, res) => setExtensionModalData({ unit, reservation: res })}
              onCheckIn={res => handleCheckIn(res)}
              onCheckOut={res => handleCheckOut(res)}
              onNewTask={unitId => openNewTaskDialog(unitId)}
              onMarkReady={unit => handleQuickMarkReady(unit)}
            />
          )}

          {/* TAB 2: APARTMENTS */}
          {activeTab === 'Apartments' && (
            <ApartmentsView
              units={data?.units || []}
              property={currentProperty}
              reservations={data?.reservations || []}
              maintenanceRecords={data?.maintenanceRecords || []}
              onAddUnit={() => openAddUnitDialog()}
              onSelectUnit={unit => setSelectedUnit(unit)}
              onOpenExtension={(unit, res) => setExtensionModalData({ unit, reservation: res })}
              onDeleteUnit={unit => handleDeleteUnit(unit)}
              isAdmin={isAdmin}
              refreshData={loadData}
              showToast={showToast}
            />
          )}

          {/* TAB 3: BOOKINGS */}
          {activeTab === 'Bookings' && (
            <BookingsView
              reservations={data?.reservations || []}
              property={currentProperty}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewBooking={() => openNewBookingDialog()}
              onOpenChecklist={res => openChecklistModal(res, 'check_in')}
              onOpenCheckoutList={res => openChecklistModal(res, 'checkout')}
              onCheckIn={res => handleCheckIn(res)}
              onCheckOut={res => handleCheckOut(res)}
              onExtend={res => openExtendDialog(res)}
              onCancel={res => handleCancel(res)}
              onApprove={res => handleApproveBooking(res)}
              onReject={res => handleRejectBooking(res)}
              onDeleteReservation={res => handleDeleteReservation(res)}
              isAdmin={isAdmin}
              onOpenStayAccount={res => {
                const acc = (data?.accounts || []).find(a => a.reservation_id === res.id);
                if (acc) setSelectedStayAccount(acc);
              }}
            />
          )}

          {/* TAB 4: FINANCE */}
          {activeTab === 'Finance' && (
            <FinanceView
              data={data}
              property={currentProperty}
              subTab={financeSubTab}
              setSubTab={setFinanceSubTab}
              analyticsData={analyticsData}
              analyticsLoading={analyticsLoading}
              onRefreshAnalytics={() => loadFinanceAnalytics(propertyId)}
              onOpenStayAccount={acc => setSelectedStayAccount(acc)}
              onAddExpense={() => setExpenseModalOpen(true)}
              onPayUtility={util => setPayingUtility(util)}
              refreshData={loadData}
              showToast={showToast}
            />
          )}

          {/* TAB 5: STAY ACCOUNTS */}
          {activeTab === 'Stay Accounts' && (
            <StayAccountsView
              accounts={data?.accounts || []}
              property={currentProperty}
              onOpenStayAccount={acc => setSelectedStayAccount(acc)}
              onDeleteAccount={acc => handleDeleteReservation({ id: acc.reservation_id, reference: acc.reference, guest_name: acc.guest_name })}
              isAdmin={isAdmin}
            />
          )}

          {/* TAB 6: INVENTORY */}
          {activeTab === 'Inventory' && (
            <InventoryView
              data={data}
              property={currentProperty}
              onReceiveStock={() => openReceiveStockDialog()}
              onIssueCleaner={() => openIssueCleanerDialog()}
              onAddItem={() => openAddItemDialog()}
              isAdmin={isAdmin}
              isManagerOrAdmin={isManagerOrAdmin}
              refreshData={loadData}
              showToast={showToast}
            />
          )}

          {/* TAB 7: HOUSEKEEPING */}
          {activeTab === 'Housekeeping' && (
            <HousekeepingView
              tasks={data?.tasks || []}
              units={data?.units || []}
              staff={data?.staff || []}
              property={currentProperty}
              onNewTask={() => openNewTaskDialog()}
              onCompleteTask={taskId => handleCompleteTask(taskId)}
              onDeleteTask={taskId => handleDeleteTask(taskId)}
              isAdmin={isAdmin}
            />
          )}

          {/* TAB 8: MANAGEMENT (HR, EXPENSES, UTILITIES) */}
          {activeTab === 'Management' && (
            <ManagementView
              data={data}
              property={currentProperty}
              subTab={mgmtSubTab}
              setSubTab={setMgmtSubTab}
              isAdmin={isAdmin}
              onAddEmployee={() => setEmployeeModalData({ mode: 'create', initial: {} })}
              onEditEmployee={emp => setEmployeeModalData({ mode: 'edit', initial: emp })}
              onViewEmployee={emp => setSelectedEmployee(emp)}
              onDeleteEmployee={id => handleDeleteEmployee(id)}
              onAddExpense={() => setExpenseModalOpen(true)}
              onDeleteExpense={id => handleDeleteExpense(id)}
              onAddUtility={() => setUtilityModalOpen(true)}
              onPayUtility={util => setPayingUtility(util)}
              onDeleteUtility={id => handleDeleteUtility(id)}
            />
          )}

          {/* TAB 9: REPORTS & STRATEGIC DECISION-MAKING */}
          {activeTab === 'Reports' && (
            <ReportsView
              data={data}
              property={currentProperty}
            />
          )}

          {/* TAB 10: ACCESS & ROLES */}
          {activeTab === 'Access & roles' && (
            <AccessRolesView
              data={data}
              property={currentProperty}
              selectedRole={selectedRoleForPerms}
              onSelectRole={setSelectedRoleForPerms}
              onTogglePermission={(code, enabled) => handleTogglePermission(code, enabled)}
              onAddStaff={() => openAddStaffDialog()}
              onAddRole={() => openAddRoleDialog()}
              onDeleteStaff={s => handleDeleteStaff(s)}
              onDeleteRole={r => handleDeleteRole(r)}
              isAdmin={isAdmin}
              onTogglePaymentMethod={(id, active) => handleTogglePaymentMethod(id, active)}
              approverConfig={approverConfig || data?.approverConfig}
              onSaveApproverConfig={handleSaveApproverConfig}
              onPurgeDemoData={handlePurgeDemoData}
              showToast={showToast}
            />
          )}

          {/* TAB 9: AUDIT HISTORY */}
          {activeTab === 'Audit history' && (
            <AuditHistoryView audit={data?.audit || []} />
          )}

          {/* FOOTER */}
          <footer className="pagefooter">
            <span>SOLTA HOTEL APARTMENT · Powered by Fergami</span>
            <span>{currentProperty.timezone} · {new Date().toLocaleTimeString()}</span>
          </footer>
        </div>
      </div>

      {/* MODALS */}
      {activeDialog && (
        <GenericDialog
          dialog={activeDialog}
          onClose={() => setActiveDialog(null)}
          onSuccess={msg => {
            setActiveDialog(null);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {selectedStayAccount && (
        <StayAccountModal
          account={data?.accounts?.find(a => a.id === selectedStayAccount.id) || selectedStayAccount}
          currency={currentProperty.currency}
          reservation={(data?.reservations || []).find(r => r.id === selectedStayAccount.reservation_id)}
          paymentMethods={data?.paymentMethods || []}
          onClose={() => setSelectedStayAccount(null)}
          onRecordPayment={handleRecordInstallmentPayment}
          showToast={showToast}
          refreshData={loadData}
        />
      )}

      {inspectionData && (
        <InspectionModal
          inspection={inspectionData}
          currency={currentProperty.currency}
          onClose={() => setInspectionData(null)}
          onSaved={() => {
            setInspectionData(null);
            showToast('Checklist finalized and saved');
            loadData();
          }}
        />
      )}

      {selectedUnit && (
        <RoomDetailsModal
          unit={data?.units?.find(u => u.id === selectedUnit.id) || selectedUnit}
          property={currentProperty}
          reservations={data?.reservations || []}
          tasks={data?.tasks || []}
          onClose={() => setSelectedUnit(null)}
          onBookUnit={u => {
            setSelectedUnit(null);
            openNewBookingDialog(u.id);
          }}
          onScheduleCleaning={u => {
            setSelectedUnit(null);
            openNewTaskDialog(u.id);
          }}
          onOpenExtension={(u, res) => {
            setSelectedUnit(null);
            setExtensionModalData({ unit: u, reservation: res });
          }}
          onUpdateUnit={handleUpdateUnitSpecs}
          refreshData={loadData}
          showToast={showToast}
        />
      )}

      {extensionModalData && (
        <StayExtensionModal
          unit={extensionModalData.unit}
          reservation={extensionModalData.reservation}
          property={currentProperty}
          onClose={() => setExtensionModalData(null)}
          onExtended={async () => {
            setExtensionModalData(null);
            showToast('Stay extension confirmed successfully');
            await loadData();
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          currency={currentProperty.currency}
          onClose={() => setSelectedEmployee(null)}
          onEdit={() => {
            const emp = selectedEmployee;
            setSelectedEmployee(null);
            setEmployeeModalData({ mode: 'edit', initial: emp });
          }}
        />
      )}

      {employeeModalData && (
        <EmployeeFormModal
          mode={employeeModalData.mode}
          initial={employeeModalData.initial}
          currency={currentProperty.currency}
          onClose={() => setEmployeeModalData(null)}
          onSave={async empData => {
            await handleSaveEmployee(empData, employeeModalData.mode);
            setEmployeeModalData(null);
          }}
        />
      )}

      {expenseModalOpen && (
        <ExpenseFormModal
          currency={currentProperty.currency}
          onClose={() => setExpenseModalOpen(false)}
          onSave={async expData => {
            await handleSaveExpense(expData);
            setExpenseModalOpen(false);
          }}
        />
      )}

      {utilityModalOpen && (
        <UtilityFormModal
          currency={currentProperty.currency}
          onClose={() => setUtilityModalOpen(false)}
          onSave={async utilData => {
            await handleSaveUtility(utilData);
            setUtilityModalOpen(false);
          }}
        />
      )}

      {payingUtility && (
        <PayUtilityModal
          utility={payingUtility}
          currency={currentProperty.currency}
          onClose={() => setPayingUtility(null)}
          onPay={async payData => {
            await handleConfirmPayUtility(payingUtility.id, payData);
            setPayingUtility(null);
          }}
        />
      )}

      {approverModalOpen && (
        <ApproverCenterModal
          notifications={notifications || data?.notifications || []}
          approverConfig={approverConfig || data?.approverConfig || {}}
          onClose={() => setApproverModalOpen(false)}
          onAction={handleApprovalAction}
          onOpenSettings={() => setActiveTab('Access & roles')}
        />
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // Dialog Opening Handlers
  // --------------------------------------------------------------------------
  function openNewBookingDialog(defaultUnitId = null) {
    setActiveDialog({
      title: 'New Booking',
      description: 'Create a confirmed reservation for an apartment.',
      fields: [
        { name: 'guestName', label: 'Guest Full Name', required: true },
        { name: 'guestPhone', label: 'Guest Phone / Contact' },
        { name: 'payerName', label: 'Payer Name (if company or third party)' },
        {
          name: 'unitId',
          label: 'Apartment',
          type: 'select',
          required: true,
          value: defaultUnitId || (data?.units?.[0]?.id || ''),
          options: (data?.units || []).map(u => ({
            value: u.id,
            label: `${u.code} (${u.category} · ${formatMoney(u.nightly_rate)})`
          }))
        },
        {
          name: 'source',
          label: 'Booking Source',
          type: 'select',
          options: [
            { value: 'Direct', label: 'Direct / Walk-in' },
            { value: 'Airbnb', label: 'Airbnb' },
            { value: 'Booking.com', label: 'Booking.com' },
            { value: 'Contact', label: 'Corporate Contact' }
          ]
        },
        { name: 'arrival', label: 'Arrival Date & Time', type: 'datetime-local', required: true },
        { name: 'departure', label: 'Departure Date & Time', type: 'datetime-local', required: true },
        {
          name: 'paymentTerms',
          label: 'Payment Terms / Installment Plan',
          type: 'select',
          value: 'upfront',
          options: [
            { value: 'upfront', label: 'Full Upfront (Standard 100% upon check-in)' },
            { value: 'monthly', label: 'Monthly Terms (12 or monthly tranches)' },
            { value: 'semi_annual', label: 'Twice a Year (Semi-Annual · 50% / 50%)' },
            { value: 'tri_annual', label: 'Three Times a Year (Tri-Annual · 33% tranches)' },
            { value: 'quarterly', label: 'Four Times a Year (Quarterly · 25% tranches)' }
          ],
          help: 'For 1-year or extended stays: automatically divides total contract into scheduled payment milestones.'
        },
        { name: 'deposit', label: 'Initial Security Deposit', type: 'number', help: 'Held funds, not recognized as revenue' },
        {
          name: 'isEarlyBooking',
          label: 'Early Booking / Early Check-in Request',
          type: 'checkbox',
          help: 'Requires administrative approval if Required Approver mode is enabled.'
        }
      ],
      submit: async values => {
        const resp = await apiCall('/reservations', 'POST', { ...values, propertyId });
        if (resp && resp.status === 'pending_approval') {
          return 'Early booking submitted and awaiting executive approval.';
        }
        return 'Booking created successfully';
      }
    });
  }

  function openAddUnitDialog() {
    setActiveDialog({
      title: 'Add Apartment Unit',
      description: 'Add a new rentable serviced apartment to this property.',
      fields: [
        { name: 'code', label: 'Unit Code (e.g. SOLTA-101)', required: true },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          options: [
            { value: 'Studio', label: 'Studio' },
            { value: 'One bedroom', label: 'One bedroom' },
            { value: 'Two bedroom', label: 'Two bedroom' },
            { value: 'Three bedroom', label: 'Three bedroom' }
          ]
        },
        { name: 'capacity', label: 'Guest Capacity', type: 'number', required: true, value: 2 },
        { name: 'nightly_rate', label: 'Nightly Rate (ETB)', type: 'number', required: true, value: 3500 }
      ],
      submit: async values => {
        try {
          await apiCall('/units', 'POST', { ...values, propertyId });
        } catch (err) {
          await apiCall('/data', 'POST', { action: 'create_unit', ...values, propertyId });
        }
        return 'Apartment added';
      }
    });
  }

  function openChecklistModal(res, type) {
    const defaultLines = [
      { name: 'Bath towel', expected: 2, present: 2, damaged: 0, price: 900 },
      { name: 'Drinking glass', expected: 4, present: 4, damaged: 0, price: 250 },
      { name: 'Remote control', expected: 1, present: 1, damaged: 0, price: 1200 },
      { name: 'Television', expected: 1, present: 1, damaged: 0, price: 25000 }
    ];
    setInspectionData({
      reservationId: res.id,
      reservationRef: res.reference,
      guestName: res.guest_name,
      type,
      lines: defaultLines
    });
  }

  function openExtendDialog(res) {
    setActiveDialog({
      title: `Extend Stay · ${res.reference}`,
      description: `Current guest: ${res.guest_name}`,
      fields: [
        { name: 'departure', label: 'New Departure Date & Time', type: 'datetime-local', required: true }
      ],
      submit: async values => {
        await apiCall(`/reservations/${res.id}/extend`, 'POST', values);
        return 'Stay extended';
      }
    });
  }

  async function handleCheckIn(res) {
    try {
      await apiCall(`/reservations/${res.id}/check-in`, 'POST');
      showToast(`Guest ${res.guest_name} checked in`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleCheckOut(res) {
    if (!window.confirm(`Confirm checkout for ${res.guest_name}?`)) return;
    try {
      await apiCall(`/reservations/${res.id}/check-out`, 'POST');
      showToast(`Guest ${res.guest_name} checked out`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleCancel(res) {
    if (!window.confirm(`Cancel booking ${res.reference}?`)) return;
    try {
      await apiCall(`/reservations/${res.id}/cancel`, 'POST');
      showToast('Booking cancelled');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleApproveBooking(res) {
    try {
      await apiCall(`/reservations/${res.id}/approve`, 'POST');
      showToast(`Booking ${res.reference} approved successfully`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to approve booking', 'error');
    }
  }

  async function handleRejectBooking(res) {
    if (!window.confirm(`Reject early booking for ${res.guest_name} (${res.reference})?`)) return;
    try {
      await apiCall(`/reservations/${res.id}/reject`, 'POST');
      showToast(`Booking ${res.reference} rejected`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reject booking', 'error');
    }
  }

  async function handleApprovalAction(notificationId, action, notes = '') {
    try {
      await apiCall('/approvals/action', 'POST', { notificationId, action, notes });
      showToast(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to process approval action', 'error');
    }
  }

  async function handleSaveApproverConfig(newConfig) {
    try {
      await apiCall('/approver-config', 'POST', { ...newConfig, property_id: propertyId });
      showToast('Approver and governance policy saved successfully');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save approver configuration', 'error');
    }
  }

  async function handleUpdateUnitSpecs(unitId, updatedData) {
    try {
      const res = await apiCall('/units/update-specs', 'POST', {
        unitId,
        propertyId,
        ...updatedData
      });
      showToast(`Specifications for ${updatedData.code || 'apartment'} saved successfully`);
      loadData();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to update specifications', 'error');
      throw err;
    }
  }

  async function handleRecordInstallmentPayment(installmentId, paymentData) {
    try {
      const res = await apiCall('/reservations/installment-payment', 'POST', {
        installmentId,
        ...paymentData
      });
      showToast('Installment payment recorded successfully');
      loadData();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to record installment payment', 'error');
      throw err;
    }
  }

  function openReceiveStockDialog() {
    setActiveDialog({
      title: 'Receive Store Stock',
      description: 'Receive items from vendor into Central Store.',
      fields: [
        {
          name: 'itemId',
          label: 'Item',
          type: 'select',
          required: true,
          options: (data?.items || []).map(i => ({ value: i.id, label: `${i.name} (${i.kind})` }))
        },
        { name: 'quantity', label: 'Quantity to Receive', type: 'number', required: true },
        { name: 'notes', label: 'Delivery Receipt / Notes' }
      ],
      submit: async values => {
        await apiCall('/inventory/receive', 'POST', { ...values, propertyId });
        return 'Stock received into store';
      }
    });
  }

  function openIssueCleanerDialog() {
    setActiveDialog({
      title: 'Issue Stock to Cleaner Cart',
      description: 'Transfer custody of items from Central Store to staff member.',
      fields: [
        {
          name: 'itemId',
          label: 'Item',
          type: 'select',
          required: true,
          options: (data?.items || []).map(i => ({ value: i.id, label: `${i.name} (${i.kind})` }))
        },
        {
          name: 'cleanerId',
          label: 'Staff Member (Cleaner Custody)',
          type: 'select',
          required: true,
          options: (data?.staff || []).map(s => ({ value: s.id, label: s.name }))
        },
        { name: 'quantity', label: 'Quantity', type: 'number', required: true }
      ],
      submit: async values => {
        await apiCall('/inventory/issue-cleaner', 'POST', { ...values, propertyId });
        return 'Stock issued to cleaner custody';
      }
    });
  }

  function openAddItemDialog() {
    setActiveDialog({
      title: 'Add Inventory Catalog Item',
      description: 'Add a trackable consumable or durable hotel item.',
      fields: [
        { name: 'name', label: 'Item Name', required: true },
        {
          name: 'kind',
          label: 'Classification',
          type: 'select',
          options: [
            { value: 'consumable', label: 'Consumable (Soap, Paper, Water)' },
            { value: 'durable', label: 'Durable (Linen, Towel, Glass, TV)' }
          ]
        },
        { name: 'unit', label: 'Unit of Measure (piece, bar, roll)', required: true, value: 'piece' },
        { name: 'replacementPrice', label: 'Guest Replacement Price (ETB)', type: 'number', value: 0 }
      ],
      submit: async values => {
        await apiCall('/inventory/items', 'POST', { ...values, propertyId });
        return 'Inventory item created';
      }
    });
  }

  function openNewTaskDialog(defaultUnitId = null) {
    setActiveDialog({
      title: 'New Housekeeping Task',
      description: 'Schedule a room turnaround or inspection.',
      fields: [
        {
          name: 'unitId',
          label: 'Apartment',
          type: 'select',
          required: true,
          value: defaultUnitId || (data?.units?.[0]?.id || ''),
          options: (data?.units || []).map(u => ({ value: u.id, label: `${u.code} (${u.readiness})` }))
        },
        {
          name: 'assigneeId',
          label: 'Assign Cleaner',
          type: 'select',
          options: (data?.staff || []).map(s => ({ value: s.id, label: s.name }))
        },
        { name: 'reason', label: 'Turnaround Notes / Task Reason', required: true, value: 'Checkout turnaround' }
      ],
      submit: async values => {
        await apiCall('/tasks', 'POST', { ...values, propertyId });
        return 'Housekeeping task scheduled';
      }
    });
  }

  async function handleCompleteTask(taskId) {
    try {
      await apiCall(`/tasks/${taskId}`, 'PATCH', { status: 'completed' });
      showToast('Task marked complete · Apartment ready');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleTogglePermission(code, enabled) {
    if (!selectedRoleForPerms) return;
    try {
      await apiCall(`/roles/${selectedRoleForPerms}/permissions`, 'PATCH', { code, enabled });
      // update local safely even if permission entry didn't exist previously
      setData(prev => {
        if (!prev) return prev;
        const perms = prev.rolePermissions || [];
        const exists = perms.some(
          rp => rp.role_id === selectedRoleForPerms && rp.permission_code === code
        );
        const updated = exists
          ? perms.map(rp =>
              rp.role_id === selectedRoleForPerms && rp.permission_code === code
                ? { ...rp, enabled }
                : rp
            )
          : [...perms, { role_id: selectedRoleForPerms, permission_code: code, enabled }];
        return {
          ...prev,
          rolePermissions: updated
        };
      });
      showToast('Permission updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function openAddStaffDialog() {
    setActiveDialog({
      title: 'Add Staff Member',
      description: 'Create credentials and assign a role to property staff.',
      fields: [
        { name: 'name', label: 'Full Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Initial Password (12+ chars)', type: 'password', required: true },
        {
          name: 'roleId',
          label: 'Role',
          type: 'select',
          required: true,
          options: (data?.roles || []).map(r => ({ value: r.id, label: r.name }))
        },
        {
          name: 'cleaner',
          label: 'Stock custody cart',
          type: 'checkbox',
          help: 'Create a dedicated cleaner inventory location for this person'
        }
      ],
      submit: async values => {
        await apiCall('/users', 'POST', { ...values, propertyId });
        return 'Staff member added';
      }
    });
  }

  function openAddRoleDialog() {
    setActiveDialog({
      title: 'Create New Role',
      fields: [{ name: 'name', label: 'Role Name', required: true }],
      submit: async values => {
        await apiCall('/roles', 'POST', { ...values, propertyId });
        return 'Role created';
      }
    });
  }

  async function handleTogglePaymentMethod(id, active) {
    try {
      await apiCall(`/payment-methods/${id}`, 'PATCH', { active });
      showToast('Payment method updated');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Management Handlers: HR, Expenses, Utilities
  async function handleSaveEmployee(values, mode) {
    try {
      if (mode === 'edit' && values.id) {
        await apiCall(`/employees/${values.id}`, 'PATCH', values);
        showToast('Employee profile updated');
      } else {
        await apiCall('/employees', 'POST', { ...values, propertyId });
        showToast('Employee successfully added to HR records');
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  async function handleDeleteUnit(unit) {
    if (!isAdmin) return showToast('Only Administrators can delete records');
    if (!window.confirm(`Delete apartment ${unit.code}? This cannot be undone.`)) return;
    try {
      await apiCall(`/units/${unit.id}`, 'DELETE');
      showToast(`Apartment ${unit.code} deleted`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Unable to delete apartment');
    }
  }

  async function handleDeleteReservation(res) {
    if (!isAdmin) return showToast('Only Administrators can delete records');
    if (!res?.id) return;
    if (!window.confirm(`Delete booking ${res.reference || ''} (${res.guest_name || 'Guest'}) and its stay account?`)) return;
    try {
      await apiCall(`/reservations/${res.id}`, 'DELETE');
      showToast('Booking & stay account deleted');
      loadData();
    } catch (err) {
      showToast(err.message || 'Unable to delete booking');
    }
  }

  async function handleDeleteTask(taskId) {
    if (!isAdmin) return showToast('Only Administrators can delete records');
    if (!window.confirm('Delete this housekeeping task?')) return;
    try {
      await apiCall(`/tasks/${taskId}`, 'DELETE');
      showToast('Housekeeping task deleted');
      loadData();
    } catch (err) {
      showToast(err.message || 'Unable to delete task');
    }
  }

  async function handleDeleteStaff(staffMember) {
    if (!isAdmin) return showToast('Only Administrators can delete records');
    if (!window.confirm(`Delete staff account for ${staffMember.name}?`)) return;
    try {
      await apiCall(`/users/${staffMember.id}`, 'DELETE');
      showToast('Staff account deleted');
      loadData();
    } catch (err) {
      showToast(err.message || 'Unable to delete staff account');
    }
  }

  async function handleDeleteRole(role) {
    if (!isAdmin) return showToast('Only Administrators can delete records');
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await apiCall(`/roles/${role.id}`, 'DELETE');
      showToast('Role deleted');
      loadData();
    } catch (err) {
      showToast(err.message || 'Unable to delete role');
    }
  }

  async function handleDeleteEmployee(id) {
    if (!window.confirm('Are you sure you want to remove this employee from records?')) return;
    try {
      await apiCall(`/employees/${id}`, 'DELETE');
      showToast('Employee record deleted');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSaveExpense(values) {
    try {
      await apiCall('/expenses', 'POST', { ...values, propertyId });
      showToast('Operating expense recorded');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await apiCall(`/expenses/${id}`, 'DELETE');
      showToast('Expense entry deleted');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSaveUtility(values) {
    try {
      await apiCall('/utilities', 'POST', { ...values, propertyId });
      showToast('Utility bill recorded');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  async function handleConfirmPayUtility(id, payData) {
    try {
      await apiCall(`/utilities/${id}/pay`, 'PATCH', payData);
      showToast('Utility bill marked as paid');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteUtility(id) {
    if (!window.confirm('Delete this utility record?')) return;
    try {
      await apiCall(`/utilities/${id}`, 'DELETE');
      showToast('Utility record deleted');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handlePurgeDemoData() {
    if (!isAdmin) {
      showToast('Only Administrators can purge test data', 'error');
      return;
    }
    const confirmed = window.confirm(
      '⚠️ WARNING: Are you sure you want to purge all test and demo data?\n\n' +
      'This will permanently delete:\n' +
      '• All test reservations and stay accounts\n' +
      '• All recorded expenses and utility bills\n' +
      '• All housekeeping tasks and maintenance records\n\n' +
      'Apartments, inventory catalog, staff accounts, and property settings will NOT be deleted.\n\n' +
      'Click OK to reset to a clean production workspace.'
    );
    if (!confirmed) return;

    try {
      await apiCall('/system/purge-demo', 'POST', { propertyId });
      showToast('All test and demo data has been purged. Workspace is clean for live production.');
      loadData();
      if (propertyId) loadFinanceAnalytics(propertyId);
    } catch (err) {
      showToast(err.message || 'Failed to purge demo data', 'error');
    }
  }
}

// ==============================================================================
// SUB-VIEWS
// ==============================================================================

// 1. Dashboard View (Enhanced Executive Overview)
function OverviewView({
  data,
  property,
  analyticsData,
  onNavigate,
  onNewBooking,
  onSelectUnit,
  onOpenExtension,
  onCheckIn,
  onCheckOut,
  onNewTask,
  onMarkReady
}) {
  const [stayTab, setStayTab] = useState('in_house'); // 'in_house', 'upcoming', 'recent'

  const units = data?.units || [];
  const reservations = data?.reservations || [];
  const accounts = data?.accounts || [];
  const tasks = data?.tasks || [];

  // Overstay calculation
  const overstayUnits = units.filter(u => {
    const info = getUnitOverstayInfo(u, reservations);
    return info && info.isOverstay;
  });

  // Occupancy metrics
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.occupied).length;
  const readyUnits = units.filter(u => !u.occupied && u.readiness === 'ready').length;
  const dirtyUnits = units.filter(u => !u.occupied && u.readiness === 'dirty').length;
  const maintenanceUnits = units.filter(u => !u.occupied && u.readiness === 'maintenance').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // SVG Donut ring math
  const ringRadius = 25;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (occupancyRate / 100) * ringCircumference;

  // Stays categories
  const inHouseStays = reservations.filter(r => r.status === 'checked_in');
  const upcomingStays = reservations.filter(r => r.status === 'confirmed');
  const recentStays = reservations.filter(r => r.status === 'checked_out');

  // Pending housekeeping
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  // Financial snapshot: computed directly from accounts, falling back to preloaded analytics
  let totalPayments = 0;
  let heldDeposits = 0;
  let unpaidBalances = 0;

  accounts.forEach(acc => {
    heldDeposits += Number(acc.deposit) || 0;
    unpaidBalances += Math.max(0, Number(acc.balance) || 0);
    (acc.entries || []).forEach(e => {
      if (e.kind === 'payment') totalPayments += Number(e.amount) || 0;
    });
  });

  const displayRevenue = totalPayments > 0
    ? totalPayments
    : (Number(analyticsData?.totals?.payments) || 0);

  const displayDeposits = heldDeposits > 0
    ? heldDeposits
    : (Number(analyticsData?.totals?.activeDeposits) || 0);

  // Dynamic greeting
  const curHour = new Date().getHours();
  const greeting = curHour < 12 ? 'Good morning' : curHour < 18 ? 'Good afternoon' : 'Good evening';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const primaryOverstayUnit = overstayUnits[0];
  const primaryOverstayInfo = primaryOverstayUnit ? getUnitOverstayInfo(primaryOverstayUnit, reservations) : null;
  const primaryOverstayRes = primaryOverstayInfo?.reservation;

  return (
    <div className="dash-root">
      {/* Executive Operational Header */}
      <div className="dash-hero">
        <div>
          <div className="dash-date-pill">
            <span>{todayFormatted} · {property?.timezone || 'Africa/Addis_Ababa'}</span>
          </div>
          <h1 className="dash-greeting">{greeting}, Solta Team</h1>
          <p className="dash-subtitle">
            Here is what needs you today across {totalUnits} apartment{totalUnits === 1 ? '' : 's'} in {property?.location || 'Bole'}.
          </p>
        </div>

        <div className="dash-hero-actions">
          <button onClick={onNewBooking} className="dash-btn-primary">
            <Plus size={16} />
            <span>New booking</span>
          </button>
          <button className="secondary dash-btn-secondary" onClick={() => onNavigate('Finance')}>
            <span>Finance</span>
          </button>
          <button className="secondary dash-btn-secondary" onClick={() => onNavigate('Apartments')}>
            <span>Apartments</span>
          </button>
        </div>
      </div>

      {/* OVERSTAY ALERT BANNER (High Priority) */}
      {overstayUnits.length > 0 && primaryOverstayUnit && (
        <div className="dash-overstay-banner">
          <div className="dash-overstay-left">
            <div className="dash-overstay-icon">
              <AlertTriangle size={20} color="#ffffff" />
            </div>
            <div>
              <div className="dash-overstay-title">
                {overstayUnits.length} overstay{overstayUnits.length > 1 ? 's need' : ' needs'} action ·{' '}
                {overstayUnits.map(u => u.code).join(', ')}
                {primaryOverstayInfo?.timeOverdue ? ` · ${primaryOverstayInfo.timeOverdue} past checkout` : ''}
              </div>
              <div className="dash-overstay-desc">
                {overstayUnits.length === 1
                  ? `Guest "${primaryOverstayRes?.guest_name || 'Guest'}" was due out ${formatDate(primaryOverstayRes?.departure)}. Extend the stay or proceed to checkout.`
                  : `${overstayUnits.length} apartments have stayed past scheduled checkout. Extend the stay or proceed to checkout.`}
              </div>
            </div>
          </div>

          <div className="dash-overstay-actions">
            <button
              type="button"
              className="dash-btn-primary"
              onClick={() => onOpenExtension && onOpenExtension(primaryOverstayUnit, primaryOverstayRes)}
            >
              Extend stay
            </button>
            {primaryOverstayRes && onCheckOut && (
              <button
                type="button"
                className="secondary dash-btn-secondary"
                onClick={() => onCheckOut(primaryOverstayRes)}
              >
                Check out
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5 Executive Scoreboard KPI Cards */}
      <div className="dash-kpis">
        {/* KPI 1: Occupancy with Circular Donut */}
        <div className="dash-kpi-card dash-kpi-occupancy">
          <div>
            <div className="dash-kpi-label">Occupancy</div>
            <div className="dash-kpi-val">{occupancyRate}%</div>
            <div className="dash-kpi-sub">{occupiedUnits} of {totalUnits} occupied</div>
          </div>
          <div className="dash-donut-wrap" aria-label={`${occupancyRate}% occupancy`}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="#2563eb"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="dash-donut-text">{occupiedUnits}/{totalUnits}</span>
          </div>
        </div>

        {/* KPI 2: In-house guests */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-label">In-house guests</div>
          <div className="dash-kpi-val">{inHouseStays.length}</div>
          <div className="dash-kpi-sub">Checked-in guest stays</div>
        </div>

        {/* KPI 3: Upcoming stays */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-label">Upcoming stays</div>
          <div className="dash-kpi-val">{upcomingStays.length}</div>
          <div className="dash-kpi-sub">Confirmed reservations</div>
        </div>

        {/* KPI 4: Ready to sell */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-label">Ready to sell</div>
          <div className="dash-kpi-val">
            {readyUnits}
            <span className="dash-kpi-total">/{totalUnits}</span>
          </div>
          <div className="dash-kpi-sub">
            {dirtyUnits > 0
              ? `${dirtyUnits} dirty, awaiting clean`
              : maintenanceUnits > 0
                ? `${maintenanceUnits} in maintenance`
                : 'All vacant rooms ready'}
          </div>
        </div>

        {/* KPI 5: Realized revenue (Dark Navy Hero Card) */}
        <div className="dash-kpi-card dash-kpi-dark" onClick={() => onNavigate('Finance')} style={{ cursor: 'pointer' }}>
          <div className="dash-kpi-label">Realized revenue</div>
          <div className="dash-kpi-val" style={{ fontSize: 24 }}>
            {formatMoney(displayRevenue, property.currency)}
          </div>
          <div className="dash-kpi-sub">
            Deposits held: {formatMoney(displayDeposits, property.currency)}
          </div>
        </div>
      </div>

      {/* Apartments Right Now Grid */}
      <section className="dash-apartments-section">
        <div className="dash-section-header">
          <div>
            <h2>Apartments right now</h2>
            <p>Condition, occupant and next action for each unit</p>
          </div>
          <button
            type="button"
            className="dash-view-all-link"
            onClick={() => onNavigate('Apartments')}
          >
            <span>View all apartments</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="dash-apartments-grid">
          {units.map(unit => {
            const overstayInfo = getUnitOverstayInfo(unit, reservations);
            const activeRes = overstayInfo?.reservation || reservations.find(
              r => (r.unit_id === unit.id || r.unit_code === unit.code) && r.status === 'checked_in'
            );

            let statusKey = 'ready';
            let statusLabel = 'Ready';
            if (overstayInfo?.isOverstay) {
              statusKey = 'overstayed';
              statusLabel = `Overstayed ${overstayInfo.timeOverdue}`;
            } else if (unit.occupied) {
              statusKey = 'occupied';
              statusLabel = 'Occupied';
            } else if (unit.readiness === 'dirty') {
              statusKey = 'dirty';
              statusLabel = 'Dirty';
            } else if (unit.readiness === 'maintenance') {
              statusKey = 'maintenance';
              statusLabel = 'Maintenance';
            }

            return (
              <div
                key={unit.id}
                className={`dash-unit-card status-${statusKey}`}
                onClick={() => onSelectUnit && onSelectUnit(unit)}
              >
                <div className={`dash-unit-head status-${statusKey}`}>
                  <strong className="dash-unit-code">{unit.code}</strong>
                  <span className={`dash-unit-pill status-${statusKey}`}>
                    <span className="dash-unit-dot" />
                    <span>{statusLabel}</span>
                  </span>
                </div>

                <div className="dash-unit-body">
                  <div className="dash-unit-meta">
                    {unit.category} · {unit.capacity} guests · {formatMoney(unit.nightly_rate, property.currency)}/night
                  </div>

                  {activeRes ? (
                    <div className={`dash-unit-status-box ${statusKey === 'overstayed' ? 'overstayed' : ''}`}>
                      <strong className="dash-unit-guest">{activeRes.guest_name}</strong>
                      <div className="dash-unit-guest-sub">
                        {statusKey === 'overstayed' ? 'Was due out ' : 'Departs '}
                        {formatDate(activeRes.departure)} · {activeRes.reference}
                      </div>
                    </div>
                  ) : statusKey === 'dirty' ? (
                    <div className="dash-unit-status-box">
                      Vacant. Needs cleaning before it can be sold.
                    </div>
                  ) : statusKey === 'maintenance' ? (
                    <div className="dash-unit-status-box">
                      Under maintenance. Not sellable.
                    </div>
                  ) : (
                    <div className="dash-unit-status-box">
                      Clean and available for immediate check-in.
                    </div>
                  )}

                  <div className="dash-unit-actions" onClick={e => e.stopPropagation()}>
                    {statusKey === 'overstayed' && activeRes ? (
                      <>
                        <button
                          type="button"
                          className="dash-unit-btn-primary"
                          onClick={() => onOpenExtension && onOpenExtension(unit, activeRes)}
                        >
                          Extend
                        </button>
                        <button
                          type="button"
                          className="dash-unit-btn-secondary"
                          onClick={() => onCheckOut && onCheckOut(activeRes)}
                        >
                          Check out
                        </button>
                      </>
                    ) : statusKey === 'occupied' ? (
                      <button
                        type="button"
                        className="dash-unit-btn-secondary full"
                        onClick={() => onSelectUnit && onSelectUnit(unit)}
                      >
                        Room details
                      </button>
                    ) : statusKey === 'dirty' ? (
                      <button
                        type="button"
                        className="dash-unit-btn-secondary full"
                        onClick={() => onNewTask && onNewTask(unit.id)}
                      >
                        Assign housekeeping
                      </button>
                    ) : statusKey === 'maintenance' ? (
                      <button
                        type="button"
                        className="dash-unit-btn-secondary full"
                        onClick={() => onMarkReady ? onMarkReady(unit) : (onSelectUnit && onSelectUnit(unit))}
                      >
                        Mark as ready
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dash-unit-btn-primary full"
                        onClick={() => onNewBooking && onNewBooking()}
                      >
                        Book this apartment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Grid: Stays Ledger (Left) vs Housekeeping & Finance Pulse (Right) */}
      <div className="overview-grid-columns">
        {/* Left Column: Live Stays & Reservations */}
        <section className="panel space" style={{ marginBottom: 0 }}>
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2>Guest Stays &amp; Movements</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                Current checked-in guests and incoming arrivals
              </p>
            </div>

            <div style={{ display: 'flex', gap: 6, background: '#f5f6f1', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                className={`small ${stayTab === 'in_house' ? '' : 'secondary'}`}
                onClick={() => setStayTab('in_house')}
                style={{ borderRadius: 6 }}
              >
                In-House ({inHouseStays.length})
              </button>
              <button
                type="button"
                className={`small ${stayTab === 'upcoming' ? '' : 'secondary'}`}
                onClick={() => setStayTab('upcoming')}
                style={{ borderRadius: 6 }}
              >
                Arrivals ({upcomingStays.length})
              </button>
              <button
                type="button"
                className={`small ${stayTab === 'recent' ? '' : 'secondary'}`}
                onClick={() => setStayTab('recent')}
                style={{ borderRadius: 6 }}
              >
                Departures ({recentStays.length})
              </button>
            </div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {stayTab === 'in_house' && inHouseStays.map(r => {
              const unit = units.find(u => u.id === r.unit_id || u.code === r.unit_code);
              const overstayInfo = unit ? getUnitOverstayInfo(unit, reservations) : null;
              return (
                <div key={r.id} className="overview-stay-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{r.guest_name}</strong>
                      <span className="badge" style={{ fontWeight: 600 }}>{r.unit_code}</span>
                      {overstayInfo?.isOverstay && (
                        <span className="badge badge-overstay" style={{ fontSize: 10 }}>
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>
                    <small className="muted" style={{ display: 'block', marginTop: 2 }}>
                      Ref: {r.reference} · Arrived {formatDate(r.arrival)} · Departure: {formatDate(r.departure)}
                    </small>
                  </div>

                  <div className="overview-stay-actions">
                    <button
                      className="small extension-btn"
                      onClick={() => onOpenExtension && onOpenExtension(unit, r)}
                      title="Extend stay"
                    >
                      Extension
                    </button>
                    <button
                      className="small secondary"
                      onClick={() => onCheckOut && onCheckOut(r)}
                      title="Process checkout"
                    >
                      Check out
                    </button>
                  </div>
                </div>
              );
            })}

            {stayTab === 'upcoming' && upcomingStays.map(r => (
              <div key={r.id} className="overview-stay-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{r.guest_name}</strong>
                    <span className="badge">{r.unit_code}</span>
                    <span className="badge ready">Confirmed</span>
                  </div>
                  <small className="muted" style={{ display: 'block', marginTop: 2 }}>
                    Ref: {r.reference} · Scheduled Arrival: {formatDateTime(r.arrival)}
                  </small>
                </div>

                <div className="overview-stay-actions">
                  <button
                    className="small"
                    style={{ background: '#15803d', color: '#fff' }}
                    onClick={() => onCheckIn && onCheckIn(r)}
                  >
                    Check in
                  </button>
                </div>
              </div>
            ))}

            {stayTab === 'recent' && recentStays.map(r => (
              <div key={r.id} className="overview-stay-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{r.guest_name}</strong>
                    <span className="badge">{r.unit_code}</span>
                    <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>Departed</span>
                  </div>
                  <small className="muted" style={{ display: 'block', marginTop: 2 }}>
                    Ref: {r.reference} · Checked out: {formatDate(r.departure)}
                  </small>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Completed</span>
              </div>
            ))}

            {((stayTab === 'in_house' && inHouseStays.length === 0) ||
              (stayTab === 'upcoming' && upcomingStays.length === 0) ||
              (stayTab === 'recent' && recentStays.length === 0)) && (
                <p className="muted" style={{ textAlign: 'center', padding: '30px 16px', margin: 0 }}>
                  No {stayTab.replace('_', ' ')} records found.
                </p>
              )}
          </div>
        </section>

        {/* Right Column: Housekeeping & Turnaround Pulse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Housekeeping Turnaround */}
          <section className="panel space" style={{ marginBottom: 0 }}>
            <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Housekeeping &amp; Turnaround</h2>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                  Cleanings and apartment turnaround tasks
                </p>
              </div>
              <button
                className="small secondary"
                onClick={() => onNewTask && onNewTask()}
                title="Create housekeeping task"
              >
                <Plus size={14} />
                <span>Task</span>
              </button>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {pendingTasks.slice(0, 3).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{t.unit_code || 'General'}</strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>{t.reason}</span>
                  </div>
                  <span className="badge dirty" style={{ fontSize: 11 }}>Pending Clean</span>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', color: '#15803d' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>All apartments inspected and clean</span>
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="textbutton"
                  style={{ fontSize: 12 }}
                  onClick={() => onNavigate('Housekeeping')}
                >
                  Manage Housekeeping &rarr;
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// 2. Apartments View
function ApartmentsView({
  units,
  property,
  reservations = [],
  maintenanceRecords = [],
  onAddUnit,
  onSelectUnit,
  onOpenExtension,
  onDeleteUnit,
  isAdmin = false,
  refreshData,
  showToast
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [modeFilter, setModeFilter] = useState('all'); // 'all', 'ready', 'occupied', 'booked', 'maintenance'
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceModalUnit, setMaintenanceModalUnit] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    setPage(1);
  }, [modeFilter, searchQuery]);

  // Helper to determine the effective operational mode
  const getUnitEffectiveMode = unit => {
    if (unit.readiness === 'maintenance') return 'maintenance';
    if (unit.occupied) return 'occupied';
    const hasUpcoming = reservations.some(r => r.unit_id === unit.id && r.status === 'confirmed');
    if (unit.readiness === 'booked' || hasUpcoming) return 'booked';
    return 'ready';
  };

  // Find all units with overstayed guests
  const overstayUnits = units.filter(u => {
    const info = getUnitOverstayInfo(u, reservations);
    return info && info.isOverstay;
  });

  // Filter units
  const filteredUnits = units.filter(unit => {
    const mode = getUnitEffectiveMode(unit);
    if (modeFilter !== 'all' && mode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (unit.code || '').toLowerCase().includes(q);
      const matchCat = (unit.category || '').toLowerCase().includes(q);
      const res = reservations.find(r => r.unit_id === unit.id && (r.status === 'checked_in' || r.status === 'confirmed'));
      const matchGuest = res ? (res.guest_name || '').toLowerCase().includes(q) : false;
      if (!matchCode && !matchCat && !matchGuest) return false;
    }
    return true;
  });

  const pagedUnits = filteredUnits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handle mode change
  const handleModeChange = async (unit, newMode) => {
    if (newMode === 'maintenance') {
      setMaintenanceModalUnit(unit);
      return;
    }

    try {
      await apiCall('/units/mode', 'POST', {
        unitId: unit.id,
        mode: newMode,
        propertyId: property.id
      });
      showToast && showToast(`Apartment ${unit.code} marked as ${newMode.toUpperCase()}`);
      refreshData && refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle resolving maintenance
  const handleResolveMaintenance = async unit => {
    try {
      await apiCall('/maintenance/resolve', 'POST', {
        unitId: unit.id,
        propertyId: property.id
      });
      showToast && showToast(`Maintenance resolved for ${unit.code}. Room is now READY.`);
      refreshData && refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const modeCounts = {
    all: units.length,
    ready: units.filter(u => getUnitEffectiveMode(u) === 'ready').length,
    occupied: units.filter(u => getUnitEffectiveMode(u) === 'occupied').length,
    booked: units.filter(u => getUnitEffectiveMode(u) === 'booked').length,
    maintenance: units.filter(u => getUnitEffectiveMode(u) === 'maintenance').length
  };

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Apartments</h1>
          <p className="muted">Whole serviced apartments, operational modes, and availability matrix.</p>
        </div>
        <button onClick={onAddUnit}>
          <Plus size={16} />
          <span>Add apartment</span>
        </button>
      </div>

      {/* OVERSTAY NOTIFICATION BANNER */}
      {overstayUnits.length > 0 && (
        <div className="overstay-alert-banner">
          <div className="overstay-banner-icon">
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <div className="overstay-banner-content">
            <div className="overstay-banner-title">
              <strong>Guest Overstay Alert ({overstayUnits.length} apartment{overstayUnits.length > 1 ? 's' : ''})</strong>
              <span className="overstay-banner-tag">Action Required</span>
            </div>
            <p className="overstay-banner-text">
              Guests have exceeded their scheduled departure time. Please click <strong>Extension</strong> to extend their stay or proceed to checkout.
            </p>
            <div className="overstay-chips-list">
              {overstayUnits.map(unit => {
                const info = getUnitOverstayInfo(unit, reservations);
                const res = info?.reservation;
                return (
                  <div key={unit.id} className="overstay-chip">
                    <span className="overstay-chip-title">
                      <strong>{unit.code}</strong> · {res?.guest_name || 'Guest'}
                    </span>
                    <span className="overstay-chip-time">
                      ⚠️ {info?.timeOverdue} overdue (departed {formatDate(res?.departure)})
                    </span>
                    <button
                      className="small extension-btn"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenExtension && onOpenExtension(unit, res);
                      }}
                    >
                      Extension
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR: VIEW TOGGLE & OPERATIONAL MODE FILTERS */}
      <div className="apartments-toolbar">
        {/* Left: Mode Filter Pills */}
        <div className="apartments-mode-pills">
          <button
            type="button"
            className={`apartments-mode-pill ${modeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setModeFilter('all')}
          >
            All Apartments ({modeCounts.all})
          </button>
          <button
            type="button"
            className={`apartments-mode-pill ${modeFilter === 'ready' ? 'active' : ''}`}
            onClick={() => setModeFilter('ready')}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }}></span>
            <span>Ready ({modeCounts.ready})</span>
          </button>
          <button
            type="button"
            className={`apartments-mode-pill ${modeFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setModeFilter('occupied')}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }}></span>
            <span>Occupied ({modeCounts.occupied})</span>
          </button>
          <button
            type="button"
            className={`apartments-mode-pill ${modeFilter === 'booked' ? 'active' : ''}`}
            onClick={() => setModeFilter('booked')}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }}></span>
            <span>Booked ({modeCounts.booked})</span>
          </button>
          <button
            type="button"
            className={`apartments-mode-pill ${modeFilter === 'maintenance' ? 'active' : ''}`}
            onClick={() => setModeFilter('maintenance')}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }}></span>
            <span>Maintenance ({modeCounts.maintenance})</span>
          </button>
        </div>

        {/* Right: Search + Grid/List View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 200 }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 9, top: 10 }} />
            <input
              type="text"
              placeholder="Search apartment..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 28, fontSize: 12, height: 34 }}
            />
          </div>

          <div className="apartments-view-toggle">
            <button
              type="button"
              className={`apartments-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View (Photo Cards)"
            >
              <Grid size={15} />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              className={`apartments-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View (Operational Table)"
            >
              <List size={15} />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: GRID VIEW (PHOTO CARDS) */}
      {viewMode === 'grid' && (
        <>
          <div className="unitgrid">
            {pagedUnits.map(unit => {
              const catKey = (unit.category || '').toLowerCase().includes('studio')
                ? 'studio'
                : (unit.category || '').toLowerCase().includes('two')
                  ? 'two'
                  : (unit.category || '').toLowerCase().includes('three')
                    ? 'three'
                    : 'one';
              const imgObj = APARTMENT_IMAGES[catKey];
              const overstayInfo = getUnitOverstayInfo(unit, reservations);
              const activeRes = overstayInfo?.reservation || reservations.find(r => r.unit_id === unit.id && (r.status === 'checked_in' || r.status === 'confirmed'));
              const effectiveMode = getUnitEffectiveMode(unit);

              // Active maintenance record if applicable
              const activeMaint = maintenanceRecords.find(m => m.unit_id === unit.id && m.status === 'in_progress');

              return (
                <div
                  key={unit.id}
                  className={`unitcard clickable ${overstayInfo?.isOverstay ? 'unitcard-overstay' : ''}`}
                  onClick={() => onSelectUnit && onSelectUnit(unit)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="unitart-photo">
                    <img src={imgObj.src} alt={unit.code} />

                    {/* Mode Badge */}
                    {overstayInfo?.isOverstay ? (
                      <span className="badge badge-overstay">
                        ⚠️ Overstayed ({overstayInfo.timeOverdue})
                      </span>
                    ) : (
                      <span className={`apartment-mode-badge ${effectiveMode}`} style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: effectiveMode === 'ready' ? '#16a34a' : effectiveMode === 'occupied' ? '#2563eb' : effectiveMode === 'booked' ? '#7c3aed' : '#d97706'
                        }}></span>
                        <span>
                          {effectiveMode === 'ready' ? 'Ready' : effectiveMode === 'occupied' ? 'Occupied' : effectiveMode === 'booked' ? 'Booked' : 'Maintenance'}
                        </span>
                      </span>
                    )}
                    <span className="unitphoto-caption">Click to view specifications</span>
                  </div>

                  <div className="unitbody">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3>{unit.code}</h3>
                      {activeRes && effectiveMode !== 'maintenance' && (
                        <span style={{ fontSize: '11px', color: overstayInfo?.isOverstay ? '#dc2626' : '#1e293b', fontWeight: 600 }}>
                          {activeRes.guest_name}
                        </span>
                      )}
                    </div>
                    <p className="muted" style={{ margin: '3px 0 6px' }}>
                      {unit.category} · {unit.capacity} guests
                    </p>

                    {/* Status / Notes */}
                    {effectiveMode === 'maintenance' && (
                      <div style={{ padding: '8px 10px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 8 }}>
                        <strong style={{ color: '#b45309', fontSize: 11, display: 'block' }}>
                          ⚠️ UNDER MAINTENANCE
                        </strong>
                        <span style={{ fontSize: 11, color: '#92400e' }}>
                          {activeMaint?.issue || 'Routine inspection / repairs'}
                        </span>
                      </div>
                    )}

                    {effectiveMode === 'booked' && activeRes && (
                      <div style={{ padding: '6px 10px', background: '#f5f3ff', borderRadius: 6, border: '1px solid #ddd6fe', marginBottom: 8, fontSize: 11, color: '#5b21b6' }}>
                        📅 Reserved: Arrives {formatDate(activeRes.arrival)}
                      </div>
                    )}

                    {overstayInfo?.isOverstay && (
                      <div className="overstay-card-inline-notice">
                        <span>Scheduled departure was {formatDateTime(activeRes?.departure)}</span>
                      </div>
                    )}

                    {/* Mode Change Selector & Actions */}
                    <div style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Mode:</span>
                      <select
                        className="mode-quick-select"
                        value={effectiveMode}
                        onChange={e => handleModeChange(unit, e.target.value)}
                      >
                        <option value="ready">✓ Ready</option>
                        <option value="occupied">● Occupied</option>
                        <option value="booked">📅 Booked</option>
                        <option value="maintenance">⚠️ Maintenance</option>
                      </select>
                    </div>

                    <div className="unitfooter">
                      <strong>{formatMoney(unit.nightly_rate, property.currency)}</strong>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {effectiveMode === 'maintenance' && (
                          <button
                            type="button"
                            className="small"
                            style={{ background: '#16a34a', color: '#fff' }}
                            onClick={e => {
                              e.stopPropagation();
                              handleResolveMaintenance(unit);
                            }}
                          >
                            Mark Ready
                          </button>
                        )}
                        {activeRes && effectiveMode === 'occupied' && (
                          <button
                            type="button"
                            className="small extension-btn"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenExtension && onOpenExtension(unit, activeRes);
                            }}
                            title="Extend guest stay"
                          >
                            Extension
                          </button>
                        )}
                        <small className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Specs</span>
                          <ArrowUpRight size={14} />
                        </small>
                        {isAdmin && onDeleteUnit && !unit.occupied && (
                          <button
                            type="button"
                            className="small secondary"
                            style={{ color: '#b91c1c', padding: '4px 7px' }}
                            title={`Delete ${unit.code}`}
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteUnit(unit);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUnits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', margin: '16px 0' }}>
              No apartments match your search or mode filter.
            </div>
          )}

          <Pagination
            totalItems={filteredUnits.length}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
            itemName="apartments"
          />
        </>
      )}

      {/* VIEW 2: LIST VIEW (HIGH-DENSITY OPERATIONAL TABLE) */}
      {viewMode === 'list' && (
        <section className="panel space">
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Floor &amp; Tier</th>
                  <th>Capacity</th>
                  <th>Nightly Rate</th>
                  <th>Current Mode</th>
                  <th>Current Occupant / Schedule</th>
                  <th>Mode Selector</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUnits.map(unit => {
                  const catKey = (unit.category || '').toLowerCase().includes('studio')
                    ? 'studio'
                    : (unit.category || '').toLowerCase().includes('two')
                      ? 'two'
                      : (unit.category || '').toLowerCase().includes('three')
                        ? 'three'
                        : 'one';
                  const imgObj = APARTMENT_IMAGES[catKey];
                  const overstayInfo = getUnitOverstayInfo(unit, reservations);
                  const activeRes = overstayInfo?.reservation || reservations.find(r => r.unit_id === unit.id && (r.status === 'checked_in' || r.status === 'confirmed'));
                  const effectiveMode = getUnitEffectiveMode(unit);
                  const activeMaint = maintenanceRecords.find(m => m.unit_id === unit.id && m.status === 'in_progress');

                  const floorStr = unit.code.includes('10') ? '1st Floor' : unit.code.includes('20') ? '2nd Floor' : '3rd Floor';

                  return (
                    <tr key={unit.id} className={overstayInfo?.isOverstay ? 'table-row-overstay' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={imgObj.src} alt={unit.code} className="apartment-list-thumb" />
                          <div>
                            <strong style={{ fontSize: 15 }}>{unit.code}</strong>
                            <small className="muted" style={{ display: 'block' }}>Serviced Apartment</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{unit.category}</strong>
                        <small className="muted" style={{ display: 'block' }}>{floorStr}</small>
                      </td>

                      <td>
                        <span>{unit.capacity} Guests</span>
                      </td>

                      <td>
                        <strong>{formatMoney(unit.nightly_rate, property.currency)}</strong>
                      </td>

                      <td>
                        <span className={`apartment-mode-badge ${effectiveMode}`}>
                          <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: effectiveMode === 'ready' ? '#16a34a' : effectiveMode === 'occupied' ? '#2563eb' : effectiveMode === 'booked' ? '#7c3aed' : '#d97706'
                          }}></span>
                          <span>
                            {effectiveMode === 'ready' ? 'Ready' : effectiveMode === 'occupied' ? 'Occupied' : effectiveMode === 'booked' ? 'Booked' : 'Maintenance'}
                          </span>
                        </span>
                        {overstayInfo?.isOverstay && (
                          <span style={{ display: 'block', fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                            ⚠️ {overstayInfo.timeOverdue} overdue
                          </span>
                        )}
                      </td>

                      <td>
                        {effectiveMode === 'occupied' && activeRes ? (
                          <div>
                            <strong>{activeRes.guest_name}</strong>
                            <small className="muted" style={{ display: 'block' }}>
                              Departs: {formatDate(activeRes.departure)}
                            </small>
                          </div>
                        ) : effectiveMode === 'booked' && activeRes ? (
                          <div>
                            <span style={{ color: '#6d28d9', fontWeight: 600 }}>{activeRes.guest_name}</span>
                            <small className="muted" style={{ display: 'block' }}>
                              Arrival: {formatDate(activeRes.arrival)}
                            </small>
                          </div>
                        ) : effectiveMode === 'maintenance' ? (
                          <div>
                            <span style={{ color: '#b45309', fontWeight: 600 }}>
                              {activeMaint?.issue || 'Under Maintenance'}
                            </span>
                            <small className="muted" style={{ display: 'block' }}>
                              Tech: {activeMaint?.technician || 'Solta Maintenance'}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: 12 }}>✓ Clean &amp; Vacant</span>
                        )}
                      </td>

                      <td>
                        <select
                          className="mode-quick-select"
                          value={effectiveMode}
                          onChange={e => handleModeChange(unit, e.target.value)}
                        >
                          <option value="ready">✓ Ready</option>
                          <option value="occupied">● Occupied</option>
                          <option value="booked">📅 Booked</option>
                          <option value="maintenance">⚠️ Maintenance</option>
                        </select>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {effectiveMode === 'maintenance' && (
                            <button
                              type="button"
                              className="small"
                              style={{ background: '#16a34a', color: '#fff' }}
                              onClick={() => handleResolveMaintenance(unit)}
                            >
                              Resolve
                            </button>
                          )}
                          {activeRes && effectiveMode === 'occupied' && (
                            <button
                              type="button"
                              className="small extension-btn"
                              onClick={() => onOpenExtension && onOpenExtension(unit, activeRes)}
                            >
                              Extension
                            </button>
                          )}
                          <button
                            type="button"
                            className="small secondary"
                            onClick={() => onSelectUnit && onSelectUnit(unit)}
                          >
                            Specs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUnits.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                      No apartments match your search or mode filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredUnits.length}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
            itemName="apartments"
          />
        </section>
      )}

      {/* SET MAINTENANCE MODAL */}
      {maintenanceModalUnit && (
        <SetMaintenanceModal
          unit={maintenanceModalUnit}
          property={property}
          onClose={() => setMaintenanceModalUnit(null)}
          onSuccess={async values => {
            try {
              await apiCall('/units/mode', 'POST', {
                unitId: maintenanceModalUnit.id,
                mode: 'maintenance',
                propertyId: property.id,
                ...values
              });
              showToast && showToast(`Apartment ${maintenanceModalUnit.code} placed into MAINTENANCE mode.`);
              setMaintenanceModalUnit(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// SET MAINTENANCE MODAL
// ----------------------------------------------------------------------------
function SetMaintenanceModal({ unit, property, onClose, onSuccess }) {
  const [reason, setReason] = useState('Air Conditioner servicing & coil cleaning');
  const [customReason, setCustomReason] = useState('');
  const [technician, setTechnician] = useState('Solta In-House Maintenance');
  const [durationEst, setDurationEst] = useState('1 day');
  const [cost, setCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const presetReasons = [
    'Air Conditioner servicing & coil cleaning',
    'Plumbing inspection & fixture leak repair',
    'Water heater thermostat & element replacement',
    'Electrical wiring / lighting / switch repair',
    'Balcony door sliding track & lock repair',
    'Full interior paint touch-up & deep polish',
    'Custom / Other issue...'
  ];

  const handleSubmit = async e => {
    e.preventDefault();
    const finalReason = reason === 'Custom / Other issue...' ? (customReason.trim() || 'General maintenance') : reason;
    setLoading(true);
    await onSuccess({
      reason: finalReason,
      technician: technician.trim() || 'In-House Maintenance',
      durationEst,
      cost: Number(cost) || 0,
      notes: notes.trim()
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modalhead">
          <div>
            <h3>Place Apartment Under Maintenance</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Mark {unit.code} as out of service and log downtime details.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            <div className="field">
              <label>Maintenance Issue / Reason</label>
              <SearchableSelect
                value={reason}
                allowCustom
                placeholder="Type or select maintenance reason…"
                options={presetReasons.map(r => ({ value: r, label: r }))}
                onChange={setReason}
              />
            </div>

            {reason === 'Custom / Other issue...' && (
              <div className="field">
                <label>Specify Maintenance Issue</label>
                <input
                  type="text"
                  placeholder="Describe the issue..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="field">
              <label>Assigned Technician / Contractor</label>
              <input
                type="text"
                placeholder="e.g. Kebede HVAC Engineering, Solta In-House Plumber"
                value={technician}
                onChange={e => setTechnician(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Estimated Maintenance Duration</label>
              <input
                type="text"
                value={durationEst}
                onChange={e => setDurationEst(e.target.value)}
                required
              />
              <div className="inventory-preset-btns">
                <span className="muted" style={{ fontSize: 11, alignSelf: 'center' }}>Presets:</span>
                {['4 hours', '1 day', '2 days', '3 days', '1 week'].map(d => (
                  <button
                    key={d}
                    type="button"
                    className="inventory-preset-btn"
                    onClick={() => setDurationEst(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Estimated Repair Cost ({property.currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
              />
            </div>

            <div className="field">
              <label>Inspection Notes / Scope of Work</label>
              <textarea
                rows={2}
                placeholder="Additional notes for operations and housekeeping..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#d97706', color: '#fff', border: 'none' }}
            >
              {loading ? 'Setting Mode...' : `Confirm Maintenance for ${unit.code}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Bookings View
function BookingsView({
  reservations,
  property,
  searchQuery,
  onSearchChange,
  onNewBooking,
  onOpenChecklist,
  onOpenCheckoutList,
  onCheckIn,
  onCheckOut,
  onExtend,
  onCancel,
  onApprove,
  onReject,
  onDeleteReservation,
  isAdmin = false,
  onOpenStayAccount
}) {
  const [page, setPage] = useState(1);

  const filtered = reservations.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.guest_name || '').toLowerCase().includes(q) ||
      (r.reference || '').toLowerCase().includes(q) ||
      (r.unit_code || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const pagedBookings = filtered.slice((page - 1) * 15, page * 15);

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Bookings</h1>
          <p className="muted">Manage arrivals, checklists, extensions and departures.</p>
        </div>
        <button onClick={onNewBooking}>
          <Plus size={16} />
          <span>New booking</span>
        </button>
      </div>

      <div className="panel space">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search guest, apartment or reference"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Guest / Booking</th>
                <th>Apartment</th>
                <th>Stay Dates</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedBookings.map(res => {
                const installments = res.installments || [];
                const paidCount = installments.filter(i => i.status === 'paid').length;
                const totalCount = installments.length;
                const hasOverdue = installments.some(i => i.status === 'overdue');

                return (
                  <tr key={res.id}>
                    <td>
                      <strong>{res.guest_name}</strong>
                      <small className="muted" style={{ display: 'block' }}>{res.reference}</small>
                      {res.payment_terms && res.payment_terms !== 'upfront' && (
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span
                            className="badge"
                            style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              fontSize: '11px',
                              padding: '2px 6px',
                              cursor: onOpenStayAccount ? 'pointer' : 'default'
                            }}
                            onClick={() => onOpenStayAccount && onOpenStayAccount(res)}
                            title="Click to view installment schedule in Stay Account"
                          >
                            📅 {res.payment_terms === 'monthly' ? 'Monthly Plan' : res.payment_terms === 'semi_annual' ? 'Semi-Annual (2 Pay)' : res.payment_terms === 'tri_annual' ? 'Tri-Annual (3 Pay)' : 'Quarterly (4 Pay)'} ({paidCount}/{totalCount} Paid)
                          </span>
                          {hasOverdue && (
                            <span
                              className="badge"
                              style={{
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                fontSize: '11px',
                                padding: '2px 6px'
                              }}
                            >
                              ⚠️ Installment Due
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{res.unit_code}</td>
                    <td>
                      {formatDate(res.arrival)}
                      <small className="muted" style={{ display: 'block' }}>to {formatDate(res.departure)}</small>
                    </td>
                    <td>
                      <span className="badge">{res.source}</span>
                    </td>
                    <td>
                      {res.status === 'pending_approval' ? (
                        <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600 }}>
                          Awaiting Approval
                        </span>
                      ) : (
                        <span className={`badge ${res.status}`}>{res.status}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {onOpenStayAccount && (
                          <button
                            className="small secondary"
                            onClick={() => onOpenStayAccount(res)}
                            title="Open Stay Account & Installment Schedule"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Receipt size={13} />
                            <span>Account</span>
                          </button>
                        )}
                        {res.status === 'pending_approval' && (
                          <>
                            <button
                              className="small"
                              style={{ background: '#16a34a', color: '#fff' }}
                              onClick={() => onApprove && onApprove(res)}
                              title="Approve booking"
                            >
                              Approve
                            </button>
                            <button
                              className="small secondary"
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => onReject && onReject(res)}
                              title="Reject booking"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {res.status === 'confirmed' && (
                          <>
                            <button className="small secondary" onClick={() => onOpenChecklist(res)}>
                              Check-in list
                            </button>
                            <button className="small" onClick={() => onCheckIn(res)}>
                              Check in
                            </button>
                            <button className="small secondary" onClick={() => onExtend(res)}>
                              Extend
                            </button>
                            <button className="small secondary" onClick={() => onCancel(res)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {res.status === 'checked_in' && (
                          <>
                            <button className="small secondary" onClick={() => onOpenCheckoutList(res)}>
                              Checkout list
                            </button>
                            <button className="small" onClick={() => onCheckOut(res)}>
                              Check out
                            </button>
                            <button className="small secondary" onClick={() => onExtend(res)}>
                              Extend
                            </button>
                          </>
                        )}
                        {isAdmin && onDeleteReservation && (
                          <button
                            className="small secondary"
                            style={{ color: '#b91c1c' }}
                            title="Delete booking (Admin only)"
                            onClick={() => onDeleteReservation(res)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#77837c' }}>
                    No bookings found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={filtered.length}
          pageSize={15}
          currentPage={page}
          onPageChange={setPage}
          itemName="bookings"
        />
      </div>
    </div>
  );
}

// 4. Finance View
function FinanceView({
  data,
  property,
  subTab,
  setSubTab,
  analyticsData,
  analyticsLoading,
  onRefreshAnalytics,
  onOpenStayAccount
}) {
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'this_month', 'last_month', 'ytd'
  const [journalFilter, setJournalFilter] = useState('all'); // 'all', 'inflow', 'outflow'
  const [journalSearch, setJournalSearch] = useState('');
  const [overviewSearch, setOverviewSearch] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [accountsPage, setAccountsPage] = useState(1);
  const [journalPage, setJournalPage] = useState(1);

  // Extract raw totals or summary safely
  const rawTotals = analyticsData?.totals || analyticsData?.summary || {};
  const rawMethods = analyticsData?.methods || analyticsData?.methodBreakdown || [];
  const rawCategories = analyticsData?.expenseCategories || [];
  const rawTrends = analyticsData?.trend || analyticsData?.trends || [];
  const rawTxns = analyticsData?.transactions || analyticsData?.recentTransactions || [];

  // Live direct calculation from active accounts in data (immediate & always consistent with accounts table)
  const directBalances = useMemo(() => {
    return (data?.accounts || []).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [data?.accounts]);

  const directDeposits = useMemo(() => {
    return (data?.accounts || []).reduce((sum, a) => sum + (Number(a.deposit) || 0), 0);
  }, [data?.accounts]);

  // Filter transactions based on selected time filter
  const filteredTxns = useMemo(() => {
    return rawTxns.filter(t => {
      const dateStr = t.date || '';
      if (timeFilter === 'this_month') return dateStr.startsWith('2026-11');
      if (timeFilter === 'last_month') return dateStr.startsWith('2026-10');
      if (timeFilter === 'ytd') return dateStr.startsWith('2026-');
      return true; // 'all'
    });
  }, [rawTxns, timeFilter]);

  // Compute dynamic totals based on the filtered transactions
  const totals = useMemo(() => {
    const liveBalances = rawTotals.outstandingBalances !== undefined
      ? Number(rawTotals.outstandingBalances)
      : directBalances;
    const liveDeposits = rawTotals.activeDeposits !== undefined
      ? Number(rawTotals.activeDeposits)
      : directDeposits;

    if (timeFilter === 'all' && rawTotals.payments !== undefined) {
      return {
        payments: Number(rawTotals.payments) || 0,
        deposits: Number(rawTotals.deposits) || 0,
        refunds: Number(rawTotals.refunds) || 0,
        netRevenue: Number(rawTotals.netRevenue) || ((Number(rawTotals.payments) || 0) - (Number(rawTotals.refunds) || 0)),
        operationalExpenses: Number(rawTotals.operationalExpenses) || 0,
        utilitiesCost: Number(rawTotals.utilitiesCost) || 0,
        pendingUtilities: Number(rawTotals.pendingUtilities) || 0,
        totalOutflow: Number(rawTotals.totalOutflow) || ((Number(rawTotals.operationalExpenses) || 0) + (Number(rawTotals.utilitiesCost) || 0)),
        netOperatingIncome: Number(rawTotals.netOperatingIncome) !== undefined
          ? Number(rawTotals.netOperatingIncome)
          : ((Number(rawTotals.payments) || 0) - (Number(rawTotals.totalOutflow) || 0)),
        netCashflow: Number(rawTotals.netCashflow) || 0,
        operatingMargin: rawTotals.operatingMargin !== undefined ? Number(rawTotals.operatingMargin) : 0,
        outstandingBalances: liveBalances,
        activeDeposits: liveDeposits
      };
    }

    let p = 0, d = 0, r = 0, exp = 0, util = 0;
    filteredTxns.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.kind === 'payment') p += amt;
      else if (t.kind === 'deposit') d += amt;
      else if (t.kind === 'refund' || t.kind === 'deposit_refund') r += amt;
      else if (t.kind === 'expense') exp += amt;
      else if (t.kind === 'utility') util += amt;
    });

    const outflow = exp + util;
    const noi = p - outflow;
    const margin = p > 0 ? Math.round((noi / p) * 100) : 0;
    const netCash = (p + d - r) - outflow;

    return {
      payments: p,
      deposits: d,
      refunds: r,
      netRevenue: p - r,
      operationalExpenses: exp,
      utilitiesCost: util,
      pendingUtilities: Number(rawTotals.pendingUtilities) || 0,
      totalOutflow: outflow,
      netOperatingIncome: noi,
      netCashflow: netCash,
      operatingMargin: margin,
      outstandingBalances: liveBalances,
      activeDeposits: liveDeposits
    };
  }, [timeFilter, rawTotals, filteredTxns, directBalances, directDeposits]);

  // Dynamic methods breakdown from filtered txns
  const methods = useMemo(() => {
    if (timeFilter === 'all' && rawMethods.length > 0) return rawMethods;
    const map = {};
    filteredTxns.filter(t => t.type === 'inflow').forEach(t => {
      const m = t.method || 'Cash';
      if (!map[m]) map[m] = { method: m, payments: 0, count: 0 };
      if (t.kind === 'payment') map[m].payments += Number(t.amount) || 0;
      map[m].count++;
    });
    const totalP = totals.payments || 1;
    return Object.values(map).map(m => ({
      ...m,
      share: Math.round((m.payments / totalP) * 100)
    })).sort((a, b) => b.payments - a.payments);
  }, [timeFilter, rawMethods, filteredTxns, totals.payments]);

  // Dynamic categories breakdown from filtered txns
  const categories = useMemo(() => {
    if (timeFilter === 'all' && rawCategories.length > 0) return rawCategories;
    const map = {};
    filteredTxns.filter(t => t.type === 'outflow').forEach(t => {
      const c = t.category || 'Supplies';
      if (!map[c]) map[c] = { category: c, total: 0, count: 0 };
      map[c].total += Number(t.amount) || 0;
      map[c].count++;
    });
    const totalO = totals.totalOutflow || 1;
    return Object.values(map).map(c => ({
      ...c,
      share: Math.round((c.total / totalO) * 100)
    })).sort((a, b) => b.total - a.total);
  }, [timeFilter, rawCategories, filteredTxns, totals.totalOutflow]);

  // Filter journal table
  const journalDisplayTxns = useMemo(() => {
    return filteredTxns.filter(t => {
      if (journalFilter === 'inflow' && t.type !== 'inflow') return false;
      if (journalFilter === 'outflow' && t.type !== 'outflow') return false;
      if (journalSearch.trim()) {
        const q = journalSearch.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchMethod = (t.method || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchMethod) return false;
      }
      return true;
    });
  }, [filteredTxns, journalFilter, journalSearch]);

  // Filter stay accounts for overview
  const filteredAccounts = useMemo(() => {
    const accs = data?.accounts || [];
    if (!overviewSearch.trim()) return accs;
    const q = overviewSearch.toLowerCase();
    return accs.filter(a =>
      (a.reference || '').toLowerCase().includes(q) ||
      (a.guest_name || '').toLowerCase().includes(q)
    );
  }, [data?.accounts, overviewSearch]);

  useEffect(() => {
    setAccountsPage(1);
  }, [overviewSearch]);

  useEffect(() => {
    setJournalPage(1);
  }, [journalFilter, journalSearch, timeFilter]);

  const pagedAccounts = filteredAccounts.slice((accountsPage - 1) * 15, accountsPage * 15);
  const pagedJournalTxns = journalDisplayTxns.slice((journalPage - 1) * 15, journalPage * 15);

  // Helper color for payment rails
  function getMethodColor(m) {
    const norm = (m || '').toLowerCase();
    if (norm.includes('telebirr')) return '#0072bc';
    if (norm.includes('cbe')) return '#78175d';
    if (norm.includes('cash')) return '#2e7d32';
    if (norm.includes('paypal') || norm.includes('card')) return '#003087';
    return '#455a64';
  }

  // Helper color for expense categories
  function getCategoryColor(cat) {
    const norm = (cat || '').toLowerCase();
    if (norm.includes('supplies')) return '#2e7d32';
    if (norm.includes('maintenance')) return '#d84315';
    if (norm.includes('utilit')) return '#0277bd';
    if (norm.includes('hr') || norm.includes('salary')) return '#6a1b9a';
    if (norm.includes('housekeeping')) return '#ad1457';
    return '#546e7a';
  }

  // Prepare SVG chart scales
  const chartHeight = 220;
  const chartWidth = 620;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const maxVal = Math.max(
    ...(rawTrends || []).map(t => Math.max(
      (t.payments || 0) + (t.deposits || 0),
      (t.expenses || 0) + (t.utilities || 0),
      Math.abs(t.netOperatingIncome || 0)
    )),
    50000
  ) * 1.15;

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Finance</h1>
          <p className="muted">Executive revenue analytics, cash flow, operating expenses, and guest ledger accounts.</p>
        </div>
      </div>

      <div className="finance-tabs">
        <button
          className={subTab === 'overview' ? '' : 'secondary'}
          onClick={() => setSubTab('overview')}
        >
          Financial overview
        </button>
        <button
          className={subTab === 'analytics' ? '' : 'secondary'}
          onClick={() => setSubTab('analytics')}
        >
          Financial analytics
        </button>
      </div>

      {/* SUBTAB 1: FINANCIAL OVERVIEW */}
      {subTab === 'overview' && (
        <div>
          {/* Summary Stat Pills */}
          <div className="stats report-stats" style={{ marginBottom: 20 }}>
            <div className="stat">
              <span>Total Active Accounts</span>
              <strong>{(data?.accounts || []).length}</strong>
              <small>Confirmed guest reservations</small>
            </div>
            <div className="stat">
              <span>Outstanding Guest Balances</span>
              <strong style={{ color: totals.outstandingBalances > 0 ? '#b94a48' : '#203449' }}>
                {formatMoney(totals.outstandingBalances, property.currency)}
              </strong>
              <small>Unsettled stay charges</small>
            </div>
            <div className="stat">
              <span>Security Deposits Held</span>
              <strong style={{ color: '#2d6a4f' }}>
                {formatMoney(totals.activeDeposits, property.currency)}
              </strong>
              <small>Refundable upon inspection</small>
            </div>
            <div className="stat">
              <span>Property Rental Currency</span>
              <strong>{property.currency || 'ETB'}</strong>
              <small>Solta Hotel Apartment, Bole</small>
            </div>
          </div>

          <section className="panel space">
            <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2>Stay Accounts &amp; Guest Balances</h2>
                <p className="muted">Detailed ledger of active guest accounts, charges, and held security deposits.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search guest or reference..."
                    value={overviewSearch}
                    onChange={e => setOverviewSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', fontSize: '12px', width: 220, borderRadius: 6 }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                </div>
              </div>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Booking Reference</th>
                    <th>Guest Name</th>
                    <th>Outstanding Balance</th>
                    <th>Deposit Held</th>
                    <th>Account Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAccounts.map(acc => {
                    const bal = Number(acc.balance) || 0;
                    const dep = Number(acc.deposit) || 0;
                    return (
                      <tr key={acc.id}>
                        <td><strong>{acc.reference}</strong></td>
                        <td>{acc.guest_name}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: bal > 0 ? '#b94a48' : '#2d6a4f' }}>
                            {formatMoney(bal, property.currency)}
                          </span>
                        </td>
                        <td>{formatMoney(dep, property.currency)}</td>
                        <td>
                          <span className={`badge ${bal > 0 ? 'dirty' : 'ready'}`}>
                            {bal > 0 ? 'Balance Due' : 'Fully Settled'}
                          </span>
                        </td>
                        <td>
                          <button className="small secondary" onClick={() => onOpenStayAccount(acc)}>
                            View ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#77837c' }}>
                        No stay accounts found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredAccounts.length}
              pageSize={15}
              currentPage={accountsPage}
              onPageChange={setAccountsPage}
              itemName="stay accounts"
            />
          </section>
        </div>
      )}

      {/* SUBTAB 2: FINANCIAL ANALYTICS */}
      {subTab === 'analytics' && (
        <div className="financial-analytics">
          {/* Header Bar with Date Range Presets and Actions */}
          <div className="finance-header-bar">
            <div className="finance-time-filters">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginRight: 4 }}>Period:</span>
              <button
                type="button"
                className={`finance-filter-pill ${timeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTimeFilter('all')}
              >
                All-Time
              </button>
              <button
                type="button"
                className={`finance-filter-pill ${timeFilter === 'this_month' ? 'active' : ''}`}
                onClick={() => setTimeFilter('this_month')}
              >
                This Month (Nov 2026)
              </button>
              <button
                type="button"
                className={`finance-filter-pill ${timeFilter === 'last_month' ? 'active' : ''}`}
                onClick={() => setTimeFilter('last_month')}
              >
                Last Month (Oct 2026)
              </button>
              <button
                type="button"
                className={`finance-filter-pill ${timeFilter === 'ytd' ? 'active' : ''}`}
                onClick={() => setTimeFilter('ytd')}
              >
                Year 2026
              </button>
            </div>

            <div className="finance-actions-group">
              <button
                className="secondary small"
                onClick={onRefreshAnalytics}
                disabled={analyticsLoading}
                title="Refresh financial data"
              >
                <RefreshCw size={14} className={analyticsLoading ? 'spin' : ''} />
                Refresh
              </button>
              <button
                className="secondary small"
                onClick={() => window.print()}
                title="Print or export financial statement"
              >
                <Printer size={14} />
                Print Statement
              </button>
            </div>
          </div>

          {/* 6 Executive KPI Metric Cards */}
          <div className="finance-kpi-grid">
            {/* 1. Gross Revenue */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className="finance-kpi-tag inflow">+ Lodging Inflow</span>
                <div className="finance-kpi-icon"><TrendingUp size={18} color="#2e7d32" /></div>
              </div>
              <h3>Gross Room Revenue</h3>
              <div className="finance-kpi-val positive">
                {formatMoney(totals.payments, property.currency)}
              </div>
              <p className="finance-kpi-sub">Total guest stay payments collected</p>
            </div>

            {/* 2. Total Outflow (Expenses + Utilities) */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className="finance-kpi-tag outflow">- Outflow</span>
                <div className="finance-kpi-icon"><TrendingDown size={18} color="#d84315" /></div>
              </div>
              <h3>Operating Costs &amp; Bills</h3>
              <div className="finance-kpi-val outflow">
                {formatMoney(totals.totalOutflow, property.currency)}
              </div>
              <p className="finance-kpi-sub">
                Expenses ({formatMoney(totals.operationalExpenses, property.currency)}) + Utilities ({formatMoney(totals.utilitiesCost, property.currency)})
              </p>
            </div>

            {/* 3. Net Operating Income */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className={`finance-kpi-tag ${totals.netOperatingIncome >= 0 ? 'profit' : 'outflow'}`}>
                  {totals.operatingMargin}% Margin
                </span>
                <div className="finance-kpi-icon"><DollarSign size={18} color={totals.netOperatingIncome >= 0 ? '#00695c' : '#d84315'} /></div>
              </div>
              <h3>Net Operating Income (NOI)</h3>
              <div className={`finance-kpi-val ${totals.netOperatingIncome >= 0 ? 'profit' : 'outflow'}`}>
                {formatMoney(totals.netOperatingIncome, property.currency)}
              </div>
              <p className="finance-kpi-sub">Gross revenue minus all operational costs</p>
            </div>

            {/* 4. Security Deposits */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className="finance-kpi-tag escrow">Escrow Held</span>
                <div className="finance-kpi-icon"><Shield size={18} color="#4527a0" /></div>
              </div>
              <h3>Security Deposits</h3>
              <div className="finance-kpi-val">
                {formatMoney(totals.deposits, property.currency)}
              </div>
              <p className="finance-kpi-sub">
                Active held: {formatMoney(totals.activeDeposits, property.currency)} · Refunded: {formatMoney(totals.refunds, property.currency)}
              </p>
            </div>

            {/* 5. Net Realized Cash Movement */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className="finance-kpi-tag neutral">Net Bank Liquidity</span>
                <div className="finance-kpi-icon"><Wallet size={18} color="#37474f" /></div>
              </div>
              <h3>Net Cash Movement</h3>
              <div className="finance-kpi-val positive">
                {formatMoney(totals.netCashflow, property.currency)}
              </div>
              <p className="finance-kpi-sub">All realized inflows minus all disbursals</p>
            </div>

            {/* 6. Accounts Receivable */}
            <div className="finance-kpi-card">
              <div className="finance-kpi-top">
                <span className={`finance-kpi-tag ${totals.outstandingBalances > 0 ? 'outflow' : 'profit'}`}>
                  {totals.outstandingBalances > 0 ? 'Pending Collection' : 'Zero Arrears'}
                </span>
                <div className="finance-kpi-icon"><Clock size={18} color="#546e7a" /></div>
              </div>
              <h3>Guest Account Receivables</h3>
              <div className="finance-kpi-val" style={{ color: totals.outstandingBalances > 0 ? '#b94a48' : '#203449' }}>
                {formatMoney(totals.outstandingBalances, property.currency)}
              </div>
              <p className="finance-kpi-sub">Uncollected balances across checked-in guests</p>
            </div>
          </div>

          {/* Interactive Monthly Performance & Cash Flow Trend Chart (SVG) */}
          <div className="finance-section-card">
            <div className="finance-section-header">
              <div>
                <h2>Cash Flow &amp; Operating Performance Trends</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Monthly comparison of lodging revenue vs operational expenditures &amp; utilities
                </p>
              </div>
              <div className="chart-legend-row">
                <div className="chart-legend-item">
                  <span className="chart-legend-color" style={{ background: '#193751' }}></span>
                  <span>Inflows (Revenue &amp; Deposits)</span>
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-color" style={{ background: '#d47749' }}></span>
                  <span>Outflows (Expenses &amp; Utilities)</span>
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-color" style={{ background: '#2d6a4f' }}></span>
                  <span>Net Operating Margin</span>
                </div>
              </div>
            </div>

            <div className="finance-chart-container">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
              >
                {/* Background Grid Lines & Y-Axis Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padTop + innerHeight * (1 - ratio);
                  const labelVal = Math.round((maxVal * ratio) / 1000) * 1000;
                  return (
                    <g key={idx}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={chartWidth - padRight}
                        y2={y}
                        stroke="#e2e7df"
                        strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                        strokeWidth={ratio === 0 ? '1.5' : '1'}
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#77837c"
                        fontFamily="Arial, sans-serif"
                      >
                        {labelVal >= 1000 ? `${Math.round(labelVal / 1000)}k` : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for Each Trend Period */}
                {(rawTrends.length > 0 ? rawTrends : [
                  { period: '2026-10', payments: totals.payments * 0.45, deposits: 5000, refunds: 5000, expenses: totals.operationalExpenses * 0.3, utilities: 3200, netOperatingIncome: totals.payments * 0.45 - (totals.operationalExpenses * 0.3 + 3200) },
                  { period: '2026-11', payments: totals.payments * 0.55, deposits: totals.deposits, refunds: totals.refunds, expenses: totals.operationalExpenses * 0.7, utilities: totals.utilitiesCost, netOperatingIncome: totals.netOperatingIncome }
                ]).map((t, idx, arr) => {
                  const groupWidth = innerWidth / arr.length;
                  const groupCenterX = padLeft + idx * groupWidth + groupWidth / 2;
                  const barWidth = Math.min(32, groupWidth * 0.22);
                  const barGap = 6;

                  const inflowVal = (Number(t.payments) || 0) + (Number(t.deposits) || 0);
                  const outflowVal = (Number(t.expenses) || 0) + (Number(t.utilities) || 0);
                  const netVal = Number(t.netOperatingIncome) || (inflowVal - outflowVal);

                  const inflowHeight = (inflowVal / maxVal) * innerHeight;
                  const outflowHeight = (outflowVal / maxVal) * innerHeight;
                  const netHeight = (Math.max(0, netVal) / maxVal) * innerHeight;

                  const inflowY = padTop + (innerHeight - inflowHeight);
                  const outflowY = padTop + (innerHeight - outflowHeight);
                  const netY = padTop + (innerHeight - netHeight);

                  const monthLabel = t.period === '2026-10' ? 'Oct 2026' : t.period === '2026-11' ? 'Nov 2026' : t.period;

                  return (
                    <g
                      key={t.period}
                      onMouseEnter={() => setActiveTooltip({ ...t, x: groupCenterX, inflowVal, outflowVal, netVal })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Inflow Bar */}
                      <rect
                        x={groupCenterX - barWidth - barGap / 2}
                        y={inflowY}
                        width={barWidth}
                        height={Math.max(2, inflowHeight)}
                        rx="4"
                        fill="#193751"
                        opacity={activeTooltip && activeTooltip.period !== t.period ? 0.6 : 1}
                      />

                      {/* Outflow Bar */}
                      <rect
                        x={groupCenterX + barGap / 2}
                        y={outflowY}
                        width={barWidth}
                        height={Math.max(2, outflowHeight)}
                        rx="4"
                        fill="#d47749"
                        opacity={activeTooltip && activeTooltip.period !== t.period ? 0.6 : 1}
                      />

                      {/* Net Margin Marker Line */}
                      <circle
                        cx={groupCenterX}
                        cy={netY}
                        r="5"
                        fill="#2d6a4f"
                        stroke="#fff"
                        strokeWidth="2"
                      />

                      {/* X-Axis Month Label */}
                      <text
                        x={groupCenterX}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#203449"
                      >
                        {monthLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {activeTooltip && (
                <div
                  className="chart-tooltip-box"
                  style={{
                    position: 'absolute',
                    top: 15,
                    left: `${(activeTooltip.x / chartWidth) * 100}%`,
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  }}
                >
                  <strong style={{ display: 'block', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4, marginBottom: 4 }}>
                    {activeTooltip.period === '2026-10' ? 'October 2026' : activeTooltip.period === '2026-11' ? 'November 2026' : activeTooltip.period}
                  </strong>
                  <div>Inflows: <strong>{formatMoney(activeTooltip.inflowVal, property.currency)}</strong></div>
                  <div>Outflows: <strong>{formatMoney(activeTooltip.outflowVal, property.currency)}</strong></div>
                  <div style={{ color: activeTooltip.netVal >= 0 ? '#80cbc4' : '#ffab91' }}>
                    Net Operating Profit: <strong>{formatMoney(activeTooltip.netVal, property.currency)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Analytics Breakdown: Rails & P&L Categories */}
          <div className="finance-split-grid">
            {/* Column 1: Payment Rails */}
            <div className="finance-section-card" style={{ marginBottom: 0 }}>
              <div className="finance-section-header">
                <div>
                  <h2>Payment Rails &amp; Inflow Channels</h2>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Collections distribution across local settlement rails
                  </p>
                </div>
                <CreditCard size={18} color="var(--muted)" />
              </div>

              <div className="breakdown-list">
                {methods.map(m => (
                  <div key={m.method} className="breakdown-row">
                    <div className="breakdown-row-top">
                      <span className="breakdown-label">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: getMethodColor(m.method),
                            display: 'inline-block'
                          }}
                        />
                        {m.method}
                        <span className="breakdown-badge">{m.share}% share</span>
                      </span>
                      <span className="breakdown-amount">
                        {formatMoney(m.payments, property.currency)}
                      </span>
                    </div>

                    <div className="breakdown-bar-track">
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: `${Math.max(3, m.share)}%`,
                          background: getMethodColor(m.method)
                        }}
                      />
                    </div>

                    <div className="breakdown-subtext">
                      <span>{m.count || 1} transactions recorded</span>
                      <span>{m.deposits > 0 ? `Held deposits: ${formatMoney(m.deposits, property.currency)}` : ''}</span>
                    </div>
                  </div>
                ))}

                {methods.length === 0 && (
                  <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                    No payment transactions recorded for this period.
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Operating Expense Categories */}
            <div className="finance-section-card" style={{ marginBottom: 0 }}>
              <div className="finance-section-header">
                <div>
                  <h2>Operating Cost Allocation (P&amp;L)</h2>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Expenditure breakdown across maintenance, supplies &amp; utilities
                  </p>
                </div>
                <Receipt size={18} color="var(--muted)" />
              </div>

              <div className="breakdown-list">
                {categories.map(c => (
                  <div key={c.category} className="breakdown-row">
                    <div className="breakdown-row-top">
                      <span className="breakdown-label">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: getCategoryColor(c.category),
                            display: 'inline-block'
                          }}
                        />
                        {c.category}
                        <span className="breakdown-badge">{c.share}% of costs</span>
                      </span>
                      <span className="breakdown-amount">
                        {formatMoney(c.total, property.currency)}
                      </span>
                    </div>

                    <div className="breakdown-bar-track">
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: `${Math.max(3, c.share)}%`,
                          background: getCategoryColor(c.category)
                        }}
                      />
                    </div>

                    <div className="breakdown-subtext">
                      <span>{c.count || 1} entries recorded</span>
                      <span>Total category outflow</span>
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                    No operating expenses recorded for this period.
                  </p>
                )}

                {totals.pendingUtilities > 0 && (
                  <div style={{ marginTop: 18, padding: '12px 14px', background: '#faf7ee', border: '1px solid #e9e1cd', borderRadius: 8, fontSize: '12px', color: '#8a7960' }}>
                    <strong>Note:</strong> You have {formatMoney(totals.pendingUtilities, property.currency)} in unpaid utility bills due before month end. Check the Management &gt; Utilities tab to settle.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Unified Financial Journal & Transaction Audit Stream */}
          <section className="finance-section-card" style={{ marginTop: 28 }}>
            <div className="finance-section-header">
              <div>
                <h2>Financial Activity Journal &amp; Audit Stream</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Unified ledger of lodging collections, security deposits, operating expenses, and utility vouchers
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, background: '#f5f6f1', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    className={`small ${journalFilter === 'all' ? '' : 'secondary'}`}
                    onClick={() => setJournalFilter('all')}
                    style={{ borderRadius: 6 }}
                  >
                    All ({filteredTxns.length})
                  </button>
                  <button
                    type="button"
                    className={`small ${journalFilter === 'inflow' ? '' : 'secondary'}`}
                    onClick={() => setJournalFilter('inflow')}
                    style={{ borderRadius: 6 }}
                  >
                    Inflows (+ Receipts)
                  </button>
                  <button
                    type="button"
                    className={`small ${journalFilter === 'outflow' ? '' : 'secondary'}`}
                    onClick={() => setJournalFilter('outflow')}
                    style={{ borderRadius: 6 }}
                  >
                    Outflows (- Disbursals)
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search journal..."
                    value={journalSearch}
                    onChange={e => setJournalSearch(e.target.value)}
                    style={{ padding: '7px 12px 7px 30px', fontSize: '12px', width: 190, borderRadius: 6 }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                </div>
              </div>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Flow Type</th>
                    <th>Title &amp; Reference</th>
                    <th>Category</th>
                    <th>Payment Rail</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedJournalTxns.map(t => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{formatDate(t.date)}</strong>
                      </td>
                      <td>
                        <span className={`flow-badge ${t.type}`}>
                          {t.type === 'inflow' ? (
                            <><ArrowUpRight size={12} /> INFLOW</>
                          ) : (
                            <><ArrowDownRight size={12} /> OUTFLOW</>
                          )}
                        </span>
                      </td>
                      <td>
                        <strong>{t.title}</strong>
                        {t.description && (
                          <small style={{ color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                            {t.description}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge">{t.category}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 500 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: getMethodColor(t.method)
                            }}
                          />
                          {t.method}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={t.type === 'inflow' ? 'table-amount-inflow' : 'table-amount-outflow'}>
                          {t.type === 'inflow' ? '+ ' : '- '}
                          {formatMoney(t.amount, property.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {journalDisplayTxns.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#77837c' }}>
                        No transactions found matching your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={journalDisplayTxns.length}
              pageSize={15}
              currentPage={journalPage}
              onPageChange={setJournalPage}
              itemName="transactions"
            />
          </section>
        </div>
      )}
    </div>
  );
}

// 5. Stay Accounts View
function StayAccountsView({ accounts, property, onOpenStayAccount, onDeleteAccount, isAdmin = false }) {
  const [stayPage, setStayPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const accountList = useMemo(() => {
    const list = accounts || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(a =>
      (a.reference || '').toLowerCase().includes(q) ||
      (a.guest_name || '').toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  useEffect(() => {
    setStayPage(1);
  }, [searchQuery]);

  const pagedAccounts = accountList.slice((stayPage - 1) * 15, stayPage * 15);

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Stay Accounts</h1>
          <p className="muted">Live balances, security deposits, and line-item transaction records.</p>
        </div>
      </div>

      <section className="panel space">
        <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>Guest Stay Ledgers</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Search active and settled guest accounts across all rooms.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search reference or guest..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', fontSize: 12, width: 220, borderRadius: 6 }}
            />
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Guest</th>
                <th>Balance</th>
                <th>Held Deposit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedAccounts.map(acc => (
                <tr key={acc.id}>
                  <td><strong>{acc.reference}</strong></td>
                  <td>{acc.guest_name}</td>
                  <td>{formatMoney(acc.balance, property.currency)}</td>
                  <td>{formatMoney(acc.deposit, property.currency)}</td>
                  <td>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="small secondary" onClick={() => onOpenStayAccount(acc)}>
                        Open ledger
                      </button>
                      {isAdmin && onDeleteAccount && (
                        <button
                          className="small secondary"
                          style={{ color: '#b91c1c' }}
                          title="Delete stay account (Admin only)"
                          onClick={() => onDeleteAccount(acc)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {accountList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#77837c' }}>
                    No stay accounts found{searchQuery ? ' matching your search' : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={accountList.length}
          pageSize={15}
          currentPage={stayPage}
          onPageChange={setStayPage}
          itemName="stay accounts"
        />
      </section>
    </div>
  );
}

// 6. Inventory & Asset Custody View
function InventoryView({
  data,
  property,
  onReceiveStock,
  onIssueCleaner,
  onAddItem,
  isAdmin = false,
  isManagerOrAdmin = false,
  refreshData,
  showToast
}) {
  const [subTab, setSubTab] = useState('items'); // 'items', 'apartments', 'carts', 'movements'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'receive', 'issue', 'supply', 'return', 'place', 'add', 'checklist'
  const [modalItem, setModalItem] = useState(null);
  const [modalUnit, setModalUnit] = useState(null);

  const items = data?.items || [];
  const stock = data?.stock || [];
  const locations = data?.locations || [];
  const movements = data?.movements || [];
  const units = data?.units || [];
  const staff = useMemo(() => {
    const baseStaff = data?.staff || [];
    const staffIds = new Set(baseStaff.map(s => s.id));
    const extra = (data?.employees || [])
      .slice(0, 150)
      .filter(e => !staffIds.has(e.id))
      .map(e => ({ id: e.id, name: e.full_name, role: e.job_title || e.department || 'Staff' }));
    return [...baseStaff, ...extra];
  }, [data?.staff, data?.employees]);

  // Helper getters for stock counts per item
  const getItemStoreQty = item => {
    return stock
      .filter(s => s.item_id === item.id && (s.location_name?.toLowerCase().includes('store') || s.location_name?.toLowerCase().includes('ground')))
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  };

  const getItemCartQty = item => {
    return stock
      .filter(s => s.item_id === item.id && (s.location_name?.toLowerCase().includes('cart') || s.location_name?.toLowerCase().includes('custody')))
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  };

  const getItemUnitQty = item => {
    return stock
      .filter(s => s.item_id === item.id && (s.location_name?.toLowerCase().includes('apartment') || s.location_name?.toLowerCase().includes('solta-') || s.location_name?.toLowerCase().includes('unit')))
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  };

  const getItemTotalQty = item => {
    return getItemStoreQty(item) + getItemCartQty(item) + getItemUnitQty(item);
  };

  const isItemLow = item => {
    const storeQty = getItemStoreQty(item);
    const minThreshold = item.min_stock !== undefined ? Number(item.min_stock) : (item.kind === 'consumable' ? 30 : 2);
    return storeQty < minThreshold;
  };

  // KPIs
  const totalSKUs = items.length;
  const totalStoreUnits = items.reduce((acc, i) => acc + getItemStoreQty(i), 0);
  const totalCartUnits = items.reduce((acc, i) => acc + getItemCartQty(i), 0);
  const totalApartmentUnits = items.reduce((acc, i) => acc + getItemUnitQty(i), 0);
  const totalValuation = items.reduce((acc, i) => {
    const totalQ = getItemTotalQty(i);
    const price = Number(i.replacement_price) || (i.kind === 'consumable' ? 100 : 1500);
    return acc + (totalQ * price);
  }, 0);
  const lowStockCount = items.filter(i => isItemLow(i)).length;

  // Categories list
  const categories = ['All', 'Toiletries & Amenities', 'Linens & Bedding', 'Beverages & Pantry', 'Electronics & Appliances', 'Kitchen & Dining', 'Cleaning Supplies'];

  // Filtered Items
  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      const matchKind = (item.kind || '').toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchKind) return false;
    }
    if (categoryFilter !== 'All') {
      const cat = item.category || (item.kind === 'consumable' ? 'Toiletries & Amenities' : 'Linens & Bedding');
      if (cat !== categoryFilter) return false;
    }
    if (onlyLowStock) {
      if (!isItemLow(item)) return false;
    }
    return true;
  });

  useEffect(() => {
    setItemsPage(1);
  }, [searchQuery, categoryFilter, onlyLowStock]);

  const pagedItems = filteredItems.slice((itemsPage - 1) * 15, itemsPage * 15);
  const pagedMovements = movements.slice((movementsPage - 1) * 15, movementsPage * 15);

  // Action helpers to open modals
  const handleOpenReceive = (item = null) => {
    setModalItem(item);
    setActiveModal('receive');
  };

  const handleOpenIssue = (item = null) => {
    setModalItem(item);
    setActiveModal('issue');
  };

  const handleOpenSupply = (item = null, unit = null) => {
    setModalItem(item);
    setModalUnit(unit);
    setActiveModal('supply');
  };

  const handleOpenReturn = () => {
    setActiveModal('return');
  };

  const handleOpenPlace = (unit = null) => {
    setModalUnit(unit);
    setActiveModal('place');
  };

  const handleOpenAdd = () => {
    setModalItem(null);
    setActiveModal('add');
  };

  const handleOpenEditItem = item => {
    setModalItem(item);
    setActiveModal('edit');
  };

  const handleDeleteInventoryItem = async item => {
    if (!isManagerOrAdmin) {
      showToast && showToast('Only Managers or Administrators can delete inventory items');
      return;
    }
    if (!window.confirm(`Delete inventory item "${item.name}" and its stock records?`)) return;
    try {
      await apiCall(`/inventory/items/${item.id}`, 'DELETE');
      showToast && showToast(`Deleted inventory item: ${item.name}`);
      refreshData && refreshData();
    } catch (err) {
      showToast && showToast(err.message || 'Unable to delete item');
    }
  };

  const handleOpenChecklist = (unit = null) => {
    setModalUnit(unit);
    setActiveModal('checklist');
  };

  return (
    <div>
      {/* Top Header & Operational Action Bar */}
      <div className="inventory-hero-bar">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>SOLTA HOTEL APARTMENT · ASSET &amp; STOCK MANAGEMENT</p>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, letterSpacing: '-0.5px' }}>
            Inventory &amp; Custody
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Follow every item from the central store to cleaner carts and guest apartments.
          </p>
        </div>

        <div className="inventory-actions-row">
          <button onClick={() => handleOpenReceive()} style={{ background: '#0052cc', color: '#fff' }}>
            <Plus size={15} />
            <span>Receive stock</span>
          </button>
          <button className="secondary" onClick={() => handleOpenIssue()}>
            <ArrowRight size={15} />
            <span>Issue to cleaner</span>
          </button>
          <button className="secondary" onClick={() => handleOpenSupply()}>
            <Building2 size={15} />
            <span>Supply apartment</span>
          </button>
          <button className="secondary" onClick={() => handleOpenReturn()}>
            <ArrowLeftRight size={15} />
            <span>Return to store</span>
          </button>
          <button className="secondary" onClick={() => handleOpenPlace()}>
            <Tv size={15} />
            <span>Place durable item</span>
          </button>
          <button className="secondary" onClick={() => handleOpenChecklist()}>
            <CheckCircle2 size={15} />
            <span>Apartment checklist</span>
          </button>
          <button className="secondary" onClick={() => handleOpenAdd()}>
            <Plus size={15} />
            <span>Add item</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Scoreboard KPIs */}
      <div className="inventory-kpis">
        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Total Catalog SKUs</span>
            <div className="inventory-kpi-icon-box" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <Package size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val">{totalSKUs}</div>
          <p className="inventory-kpi-sub">Tracked items &amp; consumables</p>
        </div>

        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Central Store Stock</span>
            <div className="inventory-kpi-icon-box" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val">{Math.round(totalStoreUnits)}</div>
          <p className="inventory-kpi-sub">Units held in Ground Floor store</p>
        </div>

        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Cleaner Cart Custody</span>
            <div className="inventory-kpi-icon-box" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val">{Math.round(totalCartUnits)}</div>
          <p className="inventory-kpi-sub">In active housekeeping circulation</p>
        </div>

        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Apartment Placements</span>
            <div className="inventory-kpi-icon-box" style={{ background: '#ecfdf5', color: '#047857' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val">{Math.round(totalApartmentUnits)}</div>
          <p className="inventory-kpi-sub">Installed in 4 guest apartments</p>
        </div>

        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Inventory Valuation</span>
            <div className="inventory-kpi-icon-box" style={{ background: '#f0fdf4', color: '#15803d' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val" style={{ fontSize: 20, color: '#15803d' }}>
            {formatMoney(totalValuation, property.currency)}
          </div>
          <p className="inventory-kpi-sub">Total replacement asset value</p>
        </div>

        <div className="inventory-kpi-card">
          <div className="inventory-kpi-top">
            <span>Low Stock Alerts</span>
            <div className="inventory-kpi-icon-box" style={{ background: lowStockCount > 0 ? '#fef3c7' : '#f1f5f9', color: lowStockCount > 0 ? '#b45309' : '#64748b' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="inventory-kpi-val" style={{ color: lowStockCount > 0 ? '#b45309' : 'var(--ink)' }}>
            {lowStockCount}
          </div>
          <p className="inventory-kpi-sub">
            {lowStockCount > 0 ? 'Items below safety threshold' : 'All store stock levels healthy'}
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="inventory-subtabs">
        <button
          className={`inventory-subtab-btn ${subTab === 'items' ? 'active' : ''}`}
          onClick={() => setSubTab('items')}
        >
          <Package size={15} />
          <span>Items &amp; Custody</span>
          <span className="inventory-subtab-count">{items.length}</span>
        </button>

        <button
          className={`inventory-subtab-btn ${subTab === 'apartments' ? 'active' : ''}`}
          onClick={() => setSubTab('apartments')}
        >
          <Building2 size={15} />
          <span>Apartment In-Room Placements</span>
          <span className="inventory-subtab-count">{units.length} Rooms</span>
        </button>

        <button
          className={`inventory-subtab-btn ${subTab === 'carts' ? 'active' : ''}`}
          onClick={() => setSubTab('carts')}
        >
          <Sparkles size={15} />
          <span>Housekeeping Mobile Carts</span>
          <span className="inventory-subtab-count">
            {locations.filter(l => l.kind === 'cleaner_custody').length || 1}
          </span>
        </button>

        <button
          className={`inventory-subtab-btn ${subTab === 'movements' ? 'active' : ''}`}
          onClick={() => setSubTab('movements')}
        >
          <History size={15} />
          <span>Movement History &amp; Audit</span>
          <span className="inventory-subtab-count">{movements.length}</span>
        </button>
      </div>

      {/* TAB 1: ITEMS & CUSTODY */}
      {subTab === 'items' && (
        <section className="panel space">
          <div className="inventory-filter-bar">
            {/* Search Input */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 11 }} />
              <input
                type="text"
                placeholder="Search items, category, SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32, fontSize: 13 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="inventory-category-pills">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`inventory-category-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}

              {/* Low Stock Toggle */}
              <button
                type="button"
                className={`inventory-category-pill ${onlyLowStock ? 'active' : ''}`}
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                style={{
                  background: onlyLowStock ? '#b45309' : '#fff',
                  borderColor: onlyLowStock ? '#b45309' : '#f59e0b',
                  color: onlyLowStock ? '#fff' : '#b45309',
                  fontWeight: 600
                }}
              >
                ⚠️ Low Stock ({lowStockCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Item &amp; Specifications</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Store Stock</th>
                  <th>Cleaner Cart</th>
                  <th>Apartments</th>
                  <th>Total On-Site</th>
                  <th>Replacement Price</th>
                  <th>Valuation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map(item => {
                  const storeQty = getItemStoreQty(item);
                  const cartQty = getItemCartQty(item);
                  const unitQty = getItemUnitQty(item);
                  const totalQty = storeQty + cartQty + unitQty;
                  const isLow = isItemLow(item);
                  const itemPrice = Number(item.replacement_price) || 0;
                  const itemValuation = totalQty * (itemPrice || (item.kind === 'consumable' ? 100 : 1500));

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="inventory-item-cell">
                          <div
                            className="inventory-item-icon"
                            style={{
                              background: item.kind === 'consumable' ? '#f0fdf4' : '#eff6ff',
                              color: item.kind === 'consumable' ? '#15803d' : '#1d4ed8'
                            }}
                          >
                            {item.kind === 'consumable' ? <Droplets size={18} /> : <Box size={18} />}
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <small className="muted" style={{ display: 'block' }}>
                              Counted in {item.unit}s · Min threshold: {item.min_stock || (item.kind === 'consumable' ? 30 : 2)}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                          {item.category || (item.kind === 'consumable' ? 'Toiletries & Amenities' : 'Linens & Bedding')}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${item.kind}`}>
                          {item.kind === 'consumable' ? 'Consumable' : 'Durable Asset'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`inventory-qty-pill ${storeQty < 0 ? 'deficit' : storeQty === 0 ? 'out' : isLow ? 'low' : 'healthy'}`}>
                            {storeQty < 0 ? `Deficit: ${storeQty}` : storeQty} {item.unit}s
                          </span>
                          {storeQty < 0 && (
                            <span title="Negative stock deficit" style={{ color: '#dc2626', fontSize: 13, fontWeight: 700 }}>⚠️ Deficit</span>
                          )}
                          {storeQty >= 0 && isLow && (
                            <span title="Stock below reorder minimum" style={{ color: '#b45309', fontSize: 13 }}>⚠️</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: cartQty > 0 ? '600' : 'normal', color: cartQty > 0 ? '#1e293b' : 'var(--muted)' }}>
                          {cartQty} {item.unit}s
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: unitQty > 0 ? '600' : 'normal', color: unitQty > 0 ? '#1e293b' : 'var(--muted)' }}>
                          {unitQty} {item.unit}s
                        </span>
                      </td>

                      <td>
                        <strong>{totalQty} {item.unit}s</strong>
                      </td>

                      <td>
                        {itemPrice > 0 ? formatMoney(itemPrice, property.currency) : <span className="muted">Complimentary</span>}
                      </td>

                      <td style={{ fontWeight: 600, color: '#15803d' }}>
                        {formatMoney(itemValuation, property.currency)}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="small"
                            onClick={() => handleOpenReceive(item)}
                            title="Receive stock into store"
                          >
                            + Stock
                          </button>
                          <button
                            type="button"
                            className="small secondary"
                            onClick={() => handleOpenIssue(item)}
                            title="Issue to cleaner cart"
                          >
                            Issue
                          </button>
                          <button
                            type="button"
                            className="small secondary"
                            onClick={() => handleOpenSupply(item)}
                            title="Supply directly to apartment"
                          >
                            Supply
                          </button>
                          {isManagerOrAdmin && (
                            <>
                              <button
                                type="button"
                                className="small secondary"
                                onClick={() => handleOpenEditItem(item)}
                                title="Edit inventory item (Manager/Admin)"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                className="small secondary"
                                style={{ color: '#b91c1c' }}
                                onClick={() => handleDeleteInventoryItem(item)}
                                title="Delete inventory item (Manager/Admin)"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                      No inventory items found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredItems.length}
            pageSize={15}
            currentPage={itemsPage}
            onPageChange={setItemsPage}
            itemName="inventory items"
          />
        </section>
      )}

      {/* TAB 2: APARTMENT IN-ROOM PLACEMENTS */}
      {subTab === 'apartments' && (
        <div>
          <div className="panel space" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Apartment Asset Allocations</h2>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                  Durable appliances, electronic assets, and standard linen sets installed in each guest apartment.
                </p>
              </div>
              <button onClick={() => handleOpenPlace()}>
                <Tv size={15} />
                <span>Place durable asset</span>
              </button>
            </div>
          </div>

          <div className="inventory-apartment-grid">
            {units.map(unit => {
              const unitStock = stock.filter(s =>
                s.location_name?.toLowerCase().includes(unit.code.toLowerCase()) ||
                s.location_id === `loc-unit-${unit.code.replace('SOLTA-', '')}`
              );

              return (
                <div key={unit.id} className="inventory-apartment-card">
                  <div className="inventory-apartment-card-header">
                    <div>
                      <strong style={{ fontSize: 16 }}>{unit.code}</strong>
                      <span className="muted" style={{ fontSize: 12, display: 'block' }}>
                        {unit.category} · {unit.capacity} Guests
                      </span>
                    </div>
                    <span className={`badge ${unit.occupied ? 'occupied' : unit.readiness}`}>
                      {unit.occupied ? 'Occupied' : unit.readiness}
                    </span>
                  </div>

                  <div className="inventory-apartment-card-body">
                    <strong style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                      Equipped Durable Assets &amp; Linens
                    </strong>

                    {unitStock.length > 0 ? (
                      <div>
                        {unitStock.map(st => (
                          <div key={st.id} className="inventory-apartment-asset-row">
                            <span>{st.item_name}</span>
                            <strong>{st.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted" style={{ fontSize: 13, padding: '12px 0' }}>
                        Standard amenities and durable assets placed.
                      </p>
                    )}
                  </div>

                  <div style={{ padding: '12px 18px', background: '#fafbf9', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="small secondary"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenSupply(null, unit)}
                    >
                      <Building2 size={13} />
                      <span>Supply items</span>
                    </button>
                    <button
                      type="button"
                      className="small secondary"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenChecklist(unit)}
                    >
                      <CheckCircle2 size={13} />
                      <span>Checklist</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HOUSEKEEPING MOBILE CARTS */}
      {subTab === 'carts' && (
        <section className="panel space">
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Housekeeping Mobile Carts &amp; Cleaner Custody</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                Items currently in staff custody on cleaning carts, ready for apartment turnarounds.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleOpenIssue()}>
                <Plus size={15} />
                <span>Issue more to cart</span>
              </button>
              <button className="secondary" onClick={() => handleOpenReturn()}>
                <ArrowLeftRight size={15} />
                <span>Return items to store</span>
              </button>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {locations.filter(l => l.kind === 'cleaner_custody').map(cart => {
              const cartStock = stock.filter(s => s.location_id === cart.id || s.location_name?.includes('Cart'));

              return (
                <div key={cart.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 18, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <strong>{cart.name}</strong>
                        <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                          Active Mobile Trolley · Servicing Floors 1-3
                        </span>
                      </div>
                    </div>
                    <span className="badge ready">Active Custody</span>
                  </div>

                  <div className="tablewrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Category</th>
                          <th>Loaded Quantity</th>
                          <th>Unit</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartStock.map(cs => (
                          <tr key={cs.id}>
                            <td><strong>{cs.item_name}</strong></td>
                            <td><span className="muted" style={{ fontSize: 12 }}>Housekeeping Turnaround</span></td>
                            <td><strong style={{ color: '#0052cc' }}>{cs.quantity}</strong></td>
                            <td>piece/bottle</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="small secondary"
                                onClick={() => handleOpenReturn()}
                              >
                                Return
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: MOVEMENT HISTORY & AUDIT */}
      {subTab === 'movements' && (
        <section className="panel space">
          <div className="panelheading">
            <div>
              <h2>Inventory Movement Ledger</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                Chronological audit trail of all store deliveries, cleaner issues, room supplies, and returns.
              </p>
            </div>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Item</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Route (From ➔ To)</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pagedMovements.map(mov => {
                  const fromLoc = locations.find(l => l.id === mov.from_location_id);
                  const toLoc = locations.find(l => l.id === mov.to_location_id);
                  const fromName = fromLoc ? fromLoc.name : (mov.from_location_id ? 'Central Store' : 'Vendor / Supplier Delivery');
                  const toName = toLoc ? toLoc.name : (mov.to_location_id ? 'Storage' : 'Apartment');

                  let badgeColor = 'ready';
                  let movLabel = 'Stock Movement';
                  if (!mov.from_location_id) {
                    badgeColor = 'ready';
                    movLabel = 'Stock Received';
                  } else if (toName.toLowerCase().includes('cart')) {
                    badgeColor = 'active';
                    movLabel = 'Cleaner Issue';
                  } else if (toName.toLowerCase().includes('apartment') || toName.toLowerCase().includes('solta')) {
                    badgeColor = 'occupied';
                    movLabel = 'Room Supply';
                  } else if (toName.toLowerCase().includes('store')) {
                    badgeColor = 'confirmed';
                    movLabel = 'Store Return';
                  }

                  return (
                    <tr key={mov.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--muted)' }}>
                        {formatDateTime(mov.created_at)}
                      </td>
                      <td>
                        <strong>{mov.item_name}</strong>
                      </td>
                      <td>
                        <span className={`badge ${badgeColor}`}>{movLabel}</span>
                      </td>
                      <td>
                        <strong>{mov.quantity}</strong>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <span className="muted">{fromName}</span>
                        <ArrowRight size={12} style={{ margin: '0 6px', verticalAlign: 'middle', color: '#94a3b8' }} />
                        <strong style={{ color: '#1e293b' }}>{toName}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{mov.actor || 'Administrator'}</span>
                      </td>
                      <td>
                        <span className="muted" style={{ fontSize: 12 }}>{mov.notes || '—'}</span>
                      </td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
                      No inventory movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={movements.length}
            pageSize={15}
            currentPage={movementsPage}
            onPageChange={setMovementsPage}
            itemName="movement records"
          />
        </section>
      )}

      {/* =========================================================================
          INTERACTIVE INVENTORY MODALS
          ========================================================================= */}

      {/* 1. RECEIVE STOCK MODAL */}
      {activeModal === 'receive' && (
        <ReceiveStockModal
          items={items}
          preselectedItem={modalItem}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              await apiCall('/inventory/receive', 'POST', { ...values, propertyId: property.id });
              showToast && showToast(`Received ${values.quantity} units into Central Store`);
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 2. ISSUE TO CLEANER MODAL */}
      {activeModal === 'issue' && (
        <IssueCleanerModal
          items={items}
          stock={stock}
          staff={staff}
          preselectedItem={modalItem}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              await apiCall('/inventory/issue-cleaner', 'POST', { ...values, propertyId: property.id });
              showToast && showToast(`Issued ${values.quantity} units to cleaner cart`);
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 3. SUPPLY APARTMENT MODAL */}
      {activeModal === 'supply' && (
        <SupplyApartmentModal
          items={items}
          units={units}
          stock={stock}
          preselectedItem={modalItem}
          preselectedUnit={modalUnit}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              await apiCall('/inventory/supply-apartment', 'POST', { ...values, propertyId: property.id });
              showToast && showToast(`Supplied items to apartment successfully`);
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 4. RETURN TO STORE MODAL */}
      {activeModal === 'return' && (
        <ReturnStoreModal
          items={items}
          locations={locations}
          stock={stock}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              await apiCall('/inventory/return-store', 'POST', { ...values, propertyId: property.id });
              showToast && showToast(`Returned items back to Central Store`);
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 5. PLACE DURABLE ASSET MODAL */}
      {activeModal === 'place' && (
        <PlaceDurableModal
          items={items.filter(i => i.kind === 'durable')}
          units={units}
          stock={stock}
          preselectedUnit={modalUnit}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              await apiCall('/inventory/place-durable', 'POST', { ...values, propertyId: property.id });
              showToast && showToast(`Durable asset placed in apartment successfully`);
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 6. ADD / EDIT CATALOG ITEM MODAL */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <AddCatalogItemModal
          categories={categories.filter(c => c !== 'All')}
          initialItem={activeModal === 'edit' ? modalItem : null}
          property={property}
          onClose={() => setActiveModal(null)}
          onSuccess={async values => {
            try {
              if (activeModal === 'edit' && modalItem) {
                await apiCall(`/inventory/items/${modalItem.id}`, 'PATCH', { ...values, propertyId: property.id });
                showToast && showToast(`Updated inventory item: ${values.name}`);
              } else {
                await apiCall('/inventory/items', 'POST', { ...values, propertyId: property.id });
                showToast && showToast(`Added new catalog item: ${values.name}`);
              }
              setActiveModal(null);
              refreshData && refreshData();
            } catch (err) {
              alert(err.message);
            }
          }}
        />
      )}

      {/* 7. APARTMENT CHECKLIST MODAL */}
      {activeModal === 'checklist' && (
        <ApartmentChecklistModal
          units={units}
          stock={stock}
          items={items}
          preselectedUnit={modalUnit}
          property={property}
          onClose={() => setActiveModal(null)}
          onSupplyQuick={(unitId, itemId, qty) => {
            handleOpenSupply(items.find(i => i.id === itemId), units.find(u => u.id === unitId));
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// INVENTORY SUB-MODALS
// ----------------------------------------------------------------------------

function ReceiveStockModal({ items, preselectedItem, property, onClose, onSuccess }) {
  const [itemId, setItemId] = useState(preselectedItem?.id || items[0]?.id || '');
  const [quantity, setQuantity] = useState(50);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedItemObj = items.find(i => i.id === itemId);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!itemId || quantity <= 0) return;
    setLoading(true);
    await onSuccess({
      itemId,
      quantity: Number(quantity),
      notes: notes ? `${notes} (Supplier: ${supplier || 'Direct Delivery'})` : `Received from ${supplier || 'Vendor'}`
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>Receive Store Stock</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Receive goods into Central Store inventory.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            <div className="field">
              <label>Select Item to Receive</label>
              <SearchableSelect
                value={itemId}
                required
                placeholder="Type to search item…"
                options={items.map(it => ({
                  value: it.id,
                  label: `${it.name} (${it.kind}) · counted in ${it.unit}s`
                }))}
                onChange={setItemId}
              />
            </div>

            <div className="field">
              <label>Quantity to Receive ({selectedItemObj?.unit || 'pieces'})</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
              <div className="inventory-preset-btns">
                <span className="muted" style={{ fontSize: 11, alignSelf: 'center' }}>Quick add:</span>
                {[10, 25, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="inventory-preset-btn"
                    onClick={() => setQuantity(amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Supplier / Vendor Name</label>
              <input
                type="text"
                placeholder="e.g. Apex Wholesale, Bole General Traders"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Invoice Number / Batch Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Invoice #ET-9024, batch expiration, quality check"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#0052cc', color: '#fff' }}>
              {loading ? 'Receiving...' : `Receive ${quantity} into Store`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IssueCleanerModal({ items, stock, staff, preselectedItem, property, onClose, onSuccess }) {
  const [itemId, setItemId] = useState(preselectedItem?.id || items[0]?.id || '');
  const [cleanerId, setCleanerId] = useState(staff[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('Issued for morning room turnaround');
  const [loading, setLoading] = useState(false);

  const selectedItemObj = items.find(i => i.id === itemId);
  const storeStock = stock
    .filter(s => s.item_id === itemId && (s.location_name?.toLowerCase().includes('store') || s.location_name?.toLowerCase().includes('ground')))
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const isDeficit = quantity > storeStock;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!itemId || !cleanerId || quantity <= 0) return;
    setLoading(true);
    await onSuccess({ itemId, cleanerId, quantity: Number(quantity), notes });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>Issue Stock to Cleaner Cart</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Transfer custody of amenities or linens from Central Store to staff trolley.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            {isDeficit && (
              <div className="deficit-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#991b1b', fontSize: 13 }}>
                <strong>⚠️ Deficit Stock Warning:</strong> Requested quantity ({quantity}) exceeds Central Store balance ({storeStock}). Issuing will reduce store stock to a deficit balance of <strong>{storeStock - quantity}</strong>. Movement will be logged with full deficit audit trails.
              </div>
            )}

            <div className="field">
              <label>Select Item to Issue</label>
              <SearchableSelect
                value={itemId}
                required
                placeholder="Type to search item…"
                options={items.map(it => ({ value: it.id, label: `${it.name} (${it.kind})` }))}
                onChange={setItemId}
              />
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Available in Central Store: <strong style={{ color: storeStock > 0 ? '#15803d' : '#dc2626' }}>{storeStock} {selectedItemObj?.unit || 'pieces'}</strong>
              </small>
            </div>

            <div className="field">
              <label>Assign to Cleaner / Staff</label>
              <SearchableSelect
                value={cleanerId}
                required
                placeholder="Type staff name…"
                options={staff.map(st => ({ value: st.id, label: `${st.name} (${st.role || 'Staff'})` }))}
                onChange={setCleanerId}
              />
            </div>

            <div className="field">
              <label>Quantity to Issue ({selectedItemObj?.unit || 'pieces'})</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
              <div className="inventory-preset-btns">
                <span className="muted" style={{ fontSize: 11, alignSelf: 'center' }}>Presets:</span>
                {[5, 10, 15, 20, 30].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="inventory-preset-btn"
                    onClick={() => setQuantity(amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Handover Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              disabled={loading || quantity <= 0}
              style={{ background: isDeficit ? '#d97706' : '#0052cc', color: '#fff' }}
            >
              {loading ? 'Issuing...' : (isDeficit ? `Issue Deficit (${quantity} units)` : `Issue ${quantity} to Cart`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplyApartmentModal({ items, units, stock, preselectedItem, preselectedUnit, property, onClose, onSuccess }) {
  const [unitId, setUnitId] = useState(preselectedUnit?.id || units[0]?.id || '');
  const [itemId, setItemId] = useState(preselectedItem?.id || items[0]?.id || '');
  const [sourceKind, setSourceKind] = useState('store'); // 'store' or 'cleaner'
  const [quantity, setQuantity] = useState(2);
  const [notes, setNotes] = useState('Standard turnaround replenishment');
  const [loading, setLoading] = useState(false);

  const selectedItemObj = items.find(i => i.id === itemId);
  const targetUnit = units.find(u => u.id === unitId);

  const availableStock = stock
    .filter(s => s.item_id === itemId && (sourceKind === 'cleaner' ? s.location_name?.toLowerCase().includes('cart') : s.location_name?.toLowerCase().includes('store')))
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const isDeficit = quantity > availableStock;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!unitId || !itemId || quantity <= 0) return;
    setLoading(true);
    await onSuccess({
      unitId,
      itemId,
      quantity: Number(quantity),
      sourceKind,
      notes: notes || `Supplied to ${targetUnit?.code || 'Apartment'}`
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>Supply Apartment</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Transfer amenities, towels, or bedsheets directly into a guest apartment.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            {isDeficit && (
              <div className="deficit-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#991b1b', fontSize: 13 }}>
                <strong>⚠️ Deficit Stock Warning:</strong> Requested quantity ({quantity}) exceeds source balance ({availableStock}). Supplying will reduce source inventory to a deficit balance of <strong>{availableStock - quantity}</strong>. Deficit balance and movement notes are logged automatically.
              </div>
            )}

            <div className="field">
              <label>Target Apartment</label>
              <SearchableSelect
                value={unitId}
                required
                placeholder="Type apartment code…"
                options={units.map(u => ({
                  value: u.id,
                  label: `${u.code} (${u.category}) · ${u.occupied ? 'Occupied' : u.readiness}`
                }))}
                onChange={setUnitId}
              />
            </div>

            <div className="field">
              <label>Source Location</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                  <input
                    type="radio"
                    name="srcKind"
                    checked={sourceKind === 'store'}
                    onChange={() => setSourceKind('store')}
                  />
                  <span>Central Store</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                  <input
                    type="radio"
                    name="srcKind"
                    checked={sourceKind === 'cleaner'}
                    onChange={() => setSourceKind('cleaner')}
                  />
                  <span>Housekeeping Cart</span>
                </label>
              </div>
            </div>

            <div className="field">
              <label>Item to Supply</label>
              <SearchableSelect
                value={itemId}
                required
                placeholder="Type to search item…"
                options={items.map(it => ({ value: it.id, label: `${it.name} (${it.kind})` }))}
                onChange={setItemId}
              />
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Available at source: <strong style={{ color: availableStock > 0 ? '#15803d' : '#dc2626' }}>{availableStock} {selectedItemObj?.unit || 'pieces'}</strong>
              </small>
            </div>

            <div className="field">
              <label>Quantity to Deliver</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
              <div className="inventory-preset-btns">
                <span className="muted" style={{ fontSize: 11, alignSelf: 'center' }}>Presets:</span>
                {[1, 2, 4, 6, 10].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="inventory-preset-btn"
                    onClick={() => setQuantity(amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Supply Notes / Request</label>
              <input
                type="text"
                placeholder="e.g. Guest requested extra towels, turn down service"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading || quantity <= 0} style={{ background: isDeficit ? '#d97706' : '#0052cc', color: '#fff' }}>
              {loading ? 'Supplying...' : (isDeficit ? `Supply Deficit (${quantity}) to ${targetUnit?.code || 'Apartment'}` : `Deliver to ${targetUnit?.code || 'Apartment'}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnStoreModal({ items, locations, stock, property, onClose, onSuccess }) {
  const returnableLocations = locations.filter(l => l.kind !== 'store');
  const [fromLocationId, setFromLocationId] = useState(returnableLocations[0]?.id || '');
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState('Surplus stock returned clean');
  const [loading, setLoading] = useState(false);

  const selectedLoc = locations.find(l => l.id === fromLocationId);
  const selectedItemObj = items.find(i => i.id === itemId);

  const locStock = stock
    .filter(s => s.item_id === itemId && s.location_id === fromLocationId)
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!fromLocationId || !itemId || quantity <= 0) return;
    setLoading(true);
    await onSuccess({
      fromLocationId,
      itemId,
      quantity: Number(quantity),
      notes: reason
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>Return to Central Store</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Transfer clean surplus stock or laundered linens back into Central Store.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            <div className="field">
              <label>Returning From</label>
              <SearchableSelect
                value={fromLocationId}
                required
                placeholder="Type location name…"
                options={returnableLocations.map(l => ({ value: l.id, label: l.name }))}
                onChange={setFromLocationId}
              />
            </div>

            <div className="field">
              <label>Item to Return</label>
              <SearchableSelect
                value={itemId}
                required
                placeholder="Type to search item…"
                options={items.map(it => ({ value: it.id, label: `${it.name} (${it.unit})` }))}
                onChange={setItemId}
              />
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Held at {selectedLoc?.name || 'source'}: <strong>{locStock} {selectedItemObj?.unit || 'pieces'}</strong>
              </small>
            </div>

            <div className="field">
              <label>Quantity to Return</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label>Condition / Reason</label>
              <SearchableSelect
                value={reason}
                allowCustom
                placeholder="Type or choose reason…"
                options={[
                  { value: 'Surplus stock returned clean', label: 'Clean & Unused Surplus' },
                  { value: 'Soiled linens returned for laundry', label: 'Soiled / Sent to Laundry' },
                  { value: 'Room reallocation / inspection', label: 'Room Reallocation' },
                  { value: 'Defective / Damaged item replaced', label: 'Damaged / Defective Replacement' }
                ]}
                onChange={setReason}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#0052cc', color: '#fff' }}>
              {loading ? 'Returning...' : `Return ${quantity} to Store`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlaceDurableModal({ items, units, stock, preselectedUnit, property, onClose, onSuccess }) {
  const [unitId, setUnitId] = useState(preselectedUnit?.id || units[0]?.id || '');
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('Installed and tested in apartment');
  const [loading, setLoading] = useState(false);

  const selectedItemObj = items.find(i => i.id === itemId);
  const targetUnit = units.find(u => u.id === unitId);

  const storeStock = stock
    .filter(s => s.item_id === itemId && s.location_name?.toLowerCase().includes('store'))
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!unitId || !itemId || quantity <= 0) return;
    setLoading(true);
    await onSuccess({
      unitId,
      itemId,
      quantity: Number(quantity),
      serialNumber,
      notes
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>Place Durable Asset in Apartment</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Register capital equipment (TV, Microwave, Safe, Kettle, Iron) to a specific room.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            <div className="field">
              <label>Target Apartment</label>
              <SearchableSelect
                value={unitId}
                required
                placeholder="Type apartment code…"
                options={units.map(u => ({ value: u.id, label: `${u.code} (${u.category})` }))}
                onChange={setUnitId}
              />
            </div>

            <div className="field">
              <label>Select Durable Asset</label>
              <SearchableSelect
                value={itemId}
                required
                placeholder="Type durable asset name…"
                options={items.map(it => ({
                  value: it.id,
                  label: `${it.name} (Valued: ${formatMoney(it.replacement_price, property.currency)})`
                }))}
                onChange={setItemId}
              />
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Units in reserve at Central Store: <strong style={{ color: storeStock > 0 ? '#15803d' : '#dc2626' }}>{storeStock}</strong>
              </small>
            </div>

            <div className="field">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label>Serial Number / Asset Tag</label>
              <input
                type="text"
                placeholder="e.g. SAM-55-9082, SAFE-2026-B"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Placement Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#0052cc', color: '#fff' }}>
              {loading ? 'Placing...' : `Install in ${targetUnit?.code || 'Apartment'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCatalogItemModal({ categories, initialItem = null, property, onClose, onSuccess }) {
  const isEdit = Boolean(initialItem);
  const [name, setName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState(initialItem?.category || categories[0] || 'Toiletries & Amenities');
  const [kind, setKind] = useState(initialItem?.kind || 'consumable'); // 'consumable' or 'durable'
  const [unit, setUnit] = useState(initialItem?.unit || 'piece');
  const [minStock, setMinStock] = useState(initialItem?.min_stock ?? 25);
  const [replacementPrice, setReplacementPrice] = useState(initialItem?.replacement_price ?? 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSuccess({
      name: name.trim(),
      category,
      kind,
      unit: unit.trim() || 'piece',
      min_stock: Number(minStock) || 10,
      replacementPrice: Number(replacementPrice) || 0
    });
    setLoading(false);
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modalhead">
          <div>
            <h3>{isEdit ? 'Edit Inventory Catalog Item' : 'Add Inventory Catalog Item'}</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              {isEdit ? 'Update item name, classification, unit of measure, or replacement price.' : 'Define a new trackable item, consumable amenity, or capital asset.'}
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inventory-modal-body">
            <div className="field">
              <label>Item Name</label>
              <input
                type="text"
                placeholder="e.g. Luxury Hand Soap, Smart TV 55, Bathrobe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Classification</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                  <input
                    type="radio"
                    name="itemKind"
                    checked={kind === 'consumable'}
                    onChange={() => {
                      setKind('consumable');
                      setMinStock(30);
                    }}
                  />
                  <span>Consumable (Soap, TP, Water, Coffee)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                  <input
                    type="radio"
                    name="itemKind"
                    checked={kind === 'durable'}
                    onChange={() => {
                      setKind('durable');
                      setMinStock(2);
                    }}
                  />
                  <span>Durable Asset (Linen, TV, Appliance)</span>
                </label>
              </div>
            </div>

            <div className="field">
              <label>Category</label>
              <SearchableSelect
                value={category}
                allowCustom
                placeholder="Type or select category…"
                options={categories.map(c => ({ value: c, label: c }))}
                onChange={setCategory}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Unit of Measure</label>
                <SearchableSelect
                  value={unit}
                  allowCustom
                  placeholder="Type or select unit…"
                  options={['piece', 'bar', 'roll', 'bottle', 'set', 'pack', 'unit', 'canister'].map(u => ({ value: u, label: u }))}
                  onChange={setUnit}
                />
              </div>

              <div className="field">
                <label>Safety Min Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={e => setMinStock(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="field">
              <label>Guest Replacement Price ({property.currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 for complimentary items"
                value={replacementPrice}
                onChange={e => setReplacementPrice(Number(e.target.value))}
              />
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Charged to guest account in event of loss or damage during stay.
              </small>
            </div>
          </div>

          <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#0052cc', color: '#fff' }}>
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Item Changes' : 'Create Catalog Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApartmentChecklistModal({ units, stock, items, preselectedUnit, property, onClose, onSupplyQuick }) {
  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnit?.id || units[0]?.id || '');
  const activeUnit = units.find(u => u.id === selectedUnitId);

  // Standard Quotas per room tier
  const isTwoBed = activeUnit?.category?.toLowerCase().includes('two');
  const isThreeBed = activeUnit?.category?.toLowerCase().includes('three');

  const standardChecklist = [
    { name: 'Smart LED TV 55" 4K UHD', standard: isThreeBed ? 3 : isTwoBed ? 2 : 1, unit: 'unit', kind: 'durable' },
    { name: 'Microwave Oven (Digital 25L)', standard: 1, unit: 'unit', kind: 'durable' },
    { name: 'Electric Kettle (Cordless Stainless)', standard: 1, unit: 'unit', kind: 'durable' },
    { name: 'Electronic Digital Room Safe', standard: 1, unit: 'unit', kind: 'durable' },
    { name: 'Steam Iron & Ironing Board', standard: 1, unit: 'set', kind: 'durable' },
    { name: 'Non-Stick Cookware Set (5-pc)', standard: 1, unit: 'set', kind: 'durable' },
    { name: 'Porcelain Dinnerware & Cutlery Set', standard: 1, unit: 'set', kind: 'durable' },
    { name: 'King Bed Sheet Set (400TC Egyptian)', standard: 1, unit: 'set', kind: 'durable' },
    { name: 'Queen Bed Sheet Set', standard: isThreeBed ? 2 : isTwoBed ? 1 : 0, unit: 'set', kind: 'durable' },
    { name: 'Luxury Bath Towel (White 700 GSM)', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'piece', kind: 'durable' },
    { name: 'Hand Towel (White Cotton)', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'piece', kind: 'durable' },
    { name: 'Plush Terry Bathrobe', standard: isThreeBed ? 3 : isTwoBed ? 2 : 1, unit: 'piece', kind: 'durable' },
    { name: 'Luxury Bath Soap (Botanical)', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'bar', kind: 'consumable' },
    { name: 'Premium Toilet Paper (2-Ply)', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'roll', kind: 'consumable' },
    { name: 'Bottled Spring Water (1L)', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'bottle', kind: 'consumable' },
    { name: 'Ethiopian Roast Coffee & Tea Set', standard: isThreeBed ? 4 : isTwoBed ? 3 : 2, unit: 'pack', kind: 'consumable' },
    { name: 'Herbal Shampoo & Body Wash', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'bottle', kind: 'consumable' },
    { name: 'Dental & Shaving Hygiene Kit', standard: isThreeBed ? 6 : isTwoBed ? 4 : 2, unit: 'kit', kind: 'consumable' }
  ];

  const unitStockList = stock.filter(s =>
    s.location_name?.toLowerCase().includes(activeUnit?.code?.toLowerCase() || '') ||
    s.location_id === `loc-unit-${activeUnit?.code?.replace('SOLTA-', '')}`
  );

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modalhead">
          <div>
            <h3>Apartment Standard Checklist</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Standard inventory quota compliance for {activeUnit?.code || 'Apartment'}.
            </p>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="inventory-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Unit selector buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {units.map(u => (
              <button
                key={u.id}
                type="button"
                className={`small ${selectedUnitId === u.id ? '' : 'secondary'}`}
                onClick={() => setSelectedUnitId(u.id)}
                style={{ flex: 1 }}
              >
                {u.code} ({u.category})
              </button>
            ))}
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Standard Item</th>
                  <th>Classification</th>
                  <th>Standard Par</th>
                  <th>Equipped In Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {standardChecklist.map((item, idx) => {
                  const actualInRoom = unitStockList
                    .filter(s => s.item_name?.toLowerCase().includes(item.name.toLowerCase().slice(0, 10)))
                    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

                  const isComplete = actualInRoom >= item.standard;

                  return (
                    <tr key={idx}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className={`badge ${item.kind}`}>{item.kind}</span></td>
                      <td><strong>{item.standard} {item.unit}s</strong></td>
                      <td>
                        <strong style={{ color: isComplete ? '#15803d' : '#dc2626' }}>
                          {actualInRoom} {item.unit}s
                        </strong>
                      </td>
                      <td>
                        {isComplete ? (
                          <span style={{ color: '#15803d', fontWeight: 600, fontSize: 12 }}>✓ Equipped</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 12 }}>
                            ⚠️ Short ({item.standard - actualInRoom})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modalfoot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// 7. Housekeeping View
function HousekeepingView({ tasks, units, staff, property, onNewTask, onCompleteTask, onDeleteTask, isAdmin = false }) {
  const [tasksPage, setTasksPage] = useState(1);
  const taskList = tasks || [];
  const pagedTasks = taskList.slice((tasksPage - 1) * 15, tasksPage * 15);

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Housekeeping</h1>
          <p className="muted">From checkout cleaning to inspected and ready.</p>
        </div>
        <button onClick={onNewTask}>
          <Plus size={16} />
          <span>New task</span>
        </button>
      </div>

      <section className="panel space">
        <div className="panelheading">
          <h2>Apartment Turnaround Pipeline</h2>
        </div>
        <div style={{ padding: 20 }}>
          {pagedTasks.map(task => (
            <div key={task.id} className="task-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Sparkles size={22} className="text-muted" />
                <div>
                  <strong>{task.unit_code}</strong>
                  <p style={{ margin: '4px 0', fontSize: 13, color: '#61727d' }}>{task.reason}</p>
                  <small className="muted">Assignee: {task.assignee || 'Unassigned'}</small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${task.status}`}>{task.status}</span>
                {task.status !== 'completed' && (
                  <button className="small" onClick={() => onCompleteTask(task.id)}>
                    Mark ready
                  </button>
                )}
                {isAdmin && onDeleteTask && (
                  <button
                    className="small secondary"
                    style={{ color: '#b91c1c' }}
                    title="Delete task (Admin only)"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {taskList.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '30px 0' }}>
              All apartments are clean and inspected. No pending turnaround tasks.
            </p>
          )}
        </div>

        <Pagination
          totalItems={taskList.length}
          pageSize={15}
          currentPage={tasksPage}
          onPageChange={setTasksPage}
          itemName="turnaround tasks"
        />
      </section>
    </div>
  );
}

// Central Approver & Notifications Modal
function ApproverCenterModal({
  notifications = [],
  approverConfig = {},
  onClose,
  onAction,
  onOpenSettings
}) {
  const [tab, setTab] = useState('pending'); // 'pending' or 'all'
  const [actionLoading, setActionLoading] = useState(null);

  const pendingList = notifications.filter(n => n.status === 'pending');
  const displayList = tab === 'pending' ? pendingList : notifications;

  const handleAction = async (id, action) => {
    setActionLoading(id + '-' + action);
    try {
      await onAction(id, action);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'early_booking':
        return <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>Early Booking</span>;
      case 'negative_stock':
        return <span className="badge" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>Stock Deficit</span>;
      case 'payment_request':
        return <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Payment Log</span>;
      case 'expired_booking':
        return <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>Overdue / Expired</span>;
      default:
        return <span className="badge">Alert</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge ready">Approved</span>;
      case 'rejected':
        return <span className="badge dirty">Rejected</span>;
      case 'pending':
        return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 600 }}>Pending</span>;
      default:
        return <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>Notified</span>;
    }
  };

  return (
    <div className="modalbackdrop" onClick={onClose}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modalhead" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#eff6ff', color: '#0052cc', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Executive Approvals &amp; Notification Center</h3>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                Governance policy: <strong>{approverConfig.mode === 'optional' ? 'Optional (Auto-Approved with Continuous Alerts)' : 'Required (Strict Manual Approval)'}</strong> · Approver: <strong>{approverConfig.approver_name || 'Administrator'}</strong>
              </p>
            </div>
          </div>
          <button className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`small ${tab === 'pending' ? '' : 'secondary'}`}
              onClick={() => setTab('pending')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Pending Approvals</span>
              {pendingList.length > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`small ${tab === 'all' ? '' : 'secondary'}`}
              onClick={() => setTab('all')}
            >
              All Alerts &amp; Logs ({notifications.length})
            </button>
          </div>

          <button
            type="button"
            className="small secondary"
            onClick={() => {
              onClose();
              onOpenSettings && onOpenSettings();
            }}
            title="Configure approver settings in Access & Roles"
          >
            Configure Approver
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px', display: 'block' }} />
              <h4 style={{ margin: '0 0 4px', color: '#1e293b' }}>
                {tab === 'pending' ? 'No pending approval requests' : 'No notifications registered'}
              </h4>
              <p style={{ fontSize: 13, margin: 0 }}>
                {tab === 'pending'
                  ? 'All early bookings and inventory movements are fully authorized.'
                  : 'System activity, new bookings, and stock movements will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayList.map(item => (
                <div key={item.id} className="notification-item-card" style={{ border: item.status === 'pending' ? '1px solid #fbbf24' : '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {getTypeBadge(item.type)}
                      {getStatusBadge(item.status)}
                      <span className="muted" style={{ fontSize: 12 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#0f172a' }}>{item.title}</h4>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{item.message}</p>

                  {item.status === 'pending' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                      <button
                        type="button"
                        className="small"
                        style={{ background: '#16a34a', color: '#ffffff', minWidth: 90 }}
                        disabled={actionLoading === item.id + '-approve'}
                        onClick={() => handleAction(item.id, 'approve')}
                      >
                        {actionLoading === item.id + '-approve' ? 'Approving...' : '✓ Approve'}
                      </button>
                      <button
                        type="button"
                        className="small secondary"
                        style={{ color: '#dc2626', borderColor: '#fca5a5', minWidth: 80 }}
                        disabled={actionLoading === item.id + '-reject'}
                        onClick={() => handleAction(item.id, 'reject')}
                      >
                        {actionLoading === item.id + '-reject' ? 'Rejecting...' : '✕ Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modalfoot" style={{ borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 12 }}>
            Real-time Solta Governance Engine
          </span>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// 8. Access & Roles View
function AccessRolesView({
  data,
  property,
  selectedRole,
  onSelectRole,
  onTogglePermission,
  onAddStaff,
  onAddRole,
  onDeleteStaff,
  onDeleteRole,
  isAdmin = false,
  onTogglePaymentMethod,
  approverConfig,
  onSaveApproverConfig,
  onPurgeDemoData,
  showToast
}) {
  const roles = data?.roles || [];
  const staff = data?.staff || [];
  const catalog = data?.permissionCatalog || [];
  const rolePermissions = data?.rolePermissions || [];
  const paymentMethods = data?.paymentMethods || [];

  const [governanceConfig, setGovernanceConfig] = useState({
    approver_id: approverConfig?.approver_id || (staff[0]?.id || ''),
    approver_name: approverConfig?.approver_name || 'Solta Administrator',
    approver_email: approverConfig?.approver_email || 'admin@gmail.com',
    mode: approverConfig?.mode || 'required',
    early_booking_approval: approverConfig?.early_booking_approval ?? true,
    inventory_deficit_approval: approverConfig?.inventory_deficit_approval ?? true,
    payment_verification: approverConfig?.payment_verification ?? true,
    notify_new_booking: approverConfig?.notify_new_booking ?? true,
    notify_expired_booking: approverConfig?.notify_expired_booking ?? true,
    notify_stock_movement: approverConfig?.notify_stock_movement ?? true,
    notify_payment: approverConfig?.notify_payment ?? true
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    if (approverConfig) {
      setGovernanceConfig(prev => ({
        ...prev,
        ...approverConfig
      }));
    }
  }, [approverConfig]);

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await onSaveApproverConfig(governanceConfig);
    } finally {
      setSavingPolicy(false);
    }
  };

  // Group permissions by category
  const categories = {};
  catalog.forEach(p => {
    const cat = p.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Access &amp; roles</h1>
          <p className="muted">Choose exactly what each role can see and do.</p>
        </div>
        <button onClick={onAddStaff}>
          <Plus size={16} />
          <span>Add staff</span>
        </button>
      </div>

      {/* Payment Methods */}
      <section className="panel space">
        <div className="panelheading">
          <h2>Payment Methods</h2>
          <span className="muted">Property-specific methods for collections and deposits.</span>
        </div>
        <div className="method-admin">
          {paymentMethods.map(pm => (
            <div key={pm.id}>
              <strong>{pm.name}</strong>
              <span className={`badge ${pm.active ? 'ready' : 'dirty'}`}>
                {pm.active ? 'Active' : 'Inactive'}
              </span>
              <button
                className="small secondary"
                onClick={() => onTogglePaymentMethod(pm.id, !pm.active)}
              >
                {pm.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Executive Approvals & Workflow Governance */}
      <section className="panel space">
        <div className="panelheading">
          <div>
            <h2>Executive Approvals &amp; Workflow Governance</h2>
            <span className="muted">Configure administrative approver enforcement (Required vs Optional) for early bookings, negative stock deficits, and notification alerts.</span>
          </div>
          <button
            type="button"
            className="small"
            style={{ background: '#0052cc', color: '#fff' }}
            disabled={savingPolicy}
            onClick={handleSavePolicy}
          >
            {savingPolicy ? 'Saving...' : 'Save Governance Policy'}
          </button>
        </div>

        <div className="approver-governance-card" style={{ marginTop: 0 }}>
          {/* Approver Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Designated Administrative Approver
              </label>
              <select
                value={governanceConfig.approver_id || ''}
                onChange={e => {
                  const s = staff.find(st => st.id === e.target.value);
                  setGovernanceConfig({
                    ...governanceConfig,
                    approver_id: e.target.value,
                    approver_name: s ? (s.name || s.full_name) : governanceConfig.approver_name,
                    approver_email: s ? s.email : governanceConfig.approver_email
                  });
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              >
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.full_name} ({s.role || 'Staff'}) · {s.email}
                  </option>
                ))}
              </select>
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                Receives notifications and holds approval authority for early bookings and stock deficit movements.
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Approver Contact Email
              </label>
              <input
                type="email"
                value={governanceConfig.approver_email || ''}
                onChange={e => setGovernanceConfig({ ...governanceConfig, approver_email: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          {/* Mode Selection: Required vs Optional */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
              Approver Requirement Level
            </label>
            <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>
              Select whether early bookings and stock deficit releases must wait for manual approval or are auto-approved.
            </p>

            <div className="mode-radio-grid">
              <div
                className={`mode-radio-card ${governanceConfig.mode === 'required' ? 'active' : ''}`}
                onClick={() => setGovernanceConfig({ ...governanceConfig, mode: 'required' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="approverMode"
                    checked={governanceConfig.mode === 'required'}
                    onChange={() => setGovernanceConfig({ ...governanceConfig, mode: 'required' })}
                  />
                  <strong style={{ fontSize: 15, color: '#0f172a' }}>🔒 Required Approver</strong>
                  <span className="badge" style={{ background: '#fef3c7', color: '#b45309', marginLeft: 'auto' }}>Strict Manual Approval</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.45 }}>
                  When marked <strong>Required</strong>, staff <strong>CANNOT</strong> check-in early bookings or finalize restricted items unless the designated approver explicitly approves it. Action remains locked in <code>pending_approval</code>.
                </p>
              </div>

              <div
                className={`mode-radio-card ${governanceConfig.mode === 'optional' ? 'active' : ''}`}
                onClick={() => setGovernanceConfig({ ...governanceConfig, mode: 'optional' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="approverMode"
                    checked={governanceConfig.mode === 'optional'}
                    onChange={() => setGovernanceConfig({ ...governanceConfig, mode: 'optional' })}
                  />
                  <strong style={{ fontSize: 15, color: '#0f172a' }}>⚡ Optional Approver</strong>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', marginLeft: 'auto' }}>Automatic Approval</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.45 }}>
                  When marked <strong>Optional</strong>, staff can book the apartment or take out inventory items by his <strong>automatic approval</strong> without waiting. The designated approver still receives continuous live notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Subscriptions */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
              Continuous Approver Notification Subscriptions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!governanceConfig.notify_new_booking}
                  onChange={e => setGovernanceConfig({ ...governanceConfig, notify_new_booking: e.target.checked })}
                />
                <span>New Booking Notifications</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!governanceConfig.notify_expired_booking}
                  onChange={e => setGovernanceConfig({ ...governanceConfig, notify_expired_booking: e.target.checked })}
                />
                <span>Expired &amp; Overdue Booking Alerts</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!governanceConfig.notify_stock_movement}
                  onChange={e => setGovernanceConfig({ ...governanceConfig, notify_stock_movement: e.target.checked })}
                />
                <span>Stock Movements &amp; Deficit Requests</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!governanceConfig.notify_payment}
                  onChange={e => setGovernanceConfig({ ...governanceConfig, notify_payment: e.target.checked })}
                />
                <span>Payment Requests &amp; Registrations</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!governanceConfig.early_booking_approval}
                  onChange={e => setGovernanceConfig({ ...governanceConfig, early_booking_approval: e.target.checked })}
                />
                <span>Early Booking Authorization Requests</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Role Permission Matrix */}
      <section className="panel space">
        <div className="panelheading">
          <h2>Role Permissions</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedRole}
              onChange={e => onSelectRole(e.target.value)}
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button className="secondary small" onClick={onAddRole}>New role</button>
            {isAdmin && onDeleteRole && selectedRole && selectedRole !== 'def28ddb-4a03-44a2-a540-cf49c8ffea1c' && (
              <button
                type="button"
                className="secondary small"
                style={{ color: '#b91c1c' }}
                title="Delete selected role (Admin only)"
                onClick={() => {
                  const r = roles.find(x => x.id === selectedRole);
                  if (r) onDeleteRole(r);
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="permissiongrid">
          {Object.entries(categories).map(([catName, perms]) => (
            <div key={catName} className="permissiongroup">
              <h3>{catName}</h3>
              {perms.map(p => {
                const isEnabled = rolePermissions.some(
                  rp => rp.role_id === selectedRole && rp.permission_code === p.code && rp.enabled
                );
                return (
                  <label key={p.code} className="permission">
                    <span>
                      {p.label}
                      <small>{p.code}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={e => onTogglePermission(p.code, e.target.checked)}
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Staff Table */}
      <section className="panel space">
        <div className="panelheading">
          <h2>Property Staff</h2>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.email}</td>
                  <td>
                    <span className="badge">{s.role || 'Staff'}</span>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      {onDeleteStaff && (
                        <button
                          type="button"
                          className="secondary small"
                          style={{ color: '#b91c1c' }}
                          title={`Delete ${s.name} (Admin only)`}
                          onClick={() => onDeleteStaff(s)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Production System Controls (Admin Only) */}
      {isAdmin && onPurgeDemoData && (
        <section className="panel space" style={{ border: '1px solid #fecaca', background: '#fffaf0', marginTop: 24 }}>
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span>Production Workspace Controls</span>
              </h2>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                Reset test bookings, temporary stay accounts, sample expenses, and maintenance records to start with a 100% clean live production hotel.
              </p>
            </div>
            <button
              type="button"
              onClick={onPurgeDemoData}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '9px 16px', fontWeight: 600, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Trash2 size={15} />
              <span>Purge Test &amp; Demo Data</span>
            </button>
          </div>
          <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #fed7aa', borderRadius: 6, marginTop: 12, fontSize: 12, color: '#7c2d12', lineHeight: 1.6 }}>
            <strong>What this resets:</strong> Permanently purges all test reservations, guest stay ledgers, recorded expenses, utility vouchers, and maintenance downtime records. Your property settings, apartments, inventory catalog, and staff credentials will remain completely safe.
          </div>
        </section>
      )}
    </div>
  );
}

// 9. Audit History View
function AuditHistoryView({ audit }) {
  const [auditPage, setAuditPage] = useState(1);
  const auditList = audit || [];
  const pagedAudit = auditList.slice((auditPage - 1) * 15, auditPage * 15);

  return (
    <div>
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT</p>
          <h1>Audit History</h1>
          <p className="muted">An accountable, immutable record of operational changes.</p>
        </div>
      </div>

      <section className="panel space">
        <div className="panelheading">
          <h2>Activity Log</h2>
          <span className="muted">{auditList.length} Total Events</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Staff Member</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {pagedAudit.map(item => (
                <tr key={item.id}>
                  <td>
                    <span className="badge">{item.action}</span>
                  </td>
                  <td>{item.actor}</td>
                  <td>{formatDateTime(item.created_at)}</td>
                  <td>
                    <small className="muted">
                      {(() => {
                        let parsed = item.details;
                        if (typeof parsed === 'string') {
                          try {
                            parsed = JSON.parse(parsed);
                          } catch {
                            return item.details || '—';
                          }
                        }
                        if (!parsed || typeof parsed !== 'object') return String(parsed || '—');
                        return Object.entries(parsed)
                          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                          .join(' · ');
                      })()}
                    </small>
                  </td>
                </tr>
              ))}
              {auditList.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={auditList.length}
          pageSize={15}
          currentPage={auditPage}
          onPageChange={setAuditPage}
          itemName="audit events"
        />
      </section>
    </div>
  );
}

// ==============================================================================
// MODAL DIALOGS
// ==============================================================================

function GenericDialog({ dialog, onClose, onSuccess }) {
  const [formData, setFormData] = useState(
    Object.fromEntries(dialog.fields.map(f => [f.name, f.value ?? '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const msg = await dialog.submit(formData);
      onSuccess(msg || 'Saved');
    } catch (err) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" onClick={e => e.stopPropagation()}>
        <header>
          <h2>{dialog.title}</h2>
          <button className="icon" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>

        {dialog.description && <p className="muted">{dialog.description}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="formgrid">
            {dialog.fields.map(f => (
              <label key={f.name} className="field">
                <span>{f.label}</span>
                {f.type === 'select' ? (
                  <SearchableSelect
                    value={formData[f.name]}
                    required={f.required}
                    allowCustom={!!f.allowCustom}
                    placeholder={f.placeholder || 'Type to search or choose…'}
                    options={f.options || []}
                    onChange={val => setFormData({ ...formData, [f.name]: val })}
                  />
                ) : f.type === 'checkbox' ? (
                  <span className="checkline">
                    <input
                      type="checkbox"
                      checked={!!formData[f.name]}
                      onChange={e => setFormData({ ...formData, [f.name]: e.target.checked })}
                    />
                    {f.help}
                  </span>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={formData[f.name]}
                    required={f.required}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                  />
                )}
                {f.help && f.type !== 'checkbox' && <small>{f.help}</small>}
              </label>
            ))}
          </div>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function StayAccountModal({
  account,
  currency,
  reservation,
  paymentMethods = [],
  onClose,
  onRecordPayment,
  showToast,
  refreshData
}) {
  const [activeTab, setActiveTab] = useState('installments'); // 'installments' | 'entries'
  const [payingInst, setPayingInst] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer / CPO');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const installments = reservation?.installments || [];
  const hasInstallments = installments.length > 0;

  // Auto-switch tab if no installments
  useEffect(() => {
    if (!hasInstallments) {
      setActiveTab('entries');
    }
  }, [hasInstallments]);

  const totalContract = (account.entries || [])
    .filter(e => e.kind === 'charge')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPaid = (account.entries || [])
    .filter(e => e.kind === 'payment')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const openPayForm = (inst) => {
    const remaining = Math.max(0, Number(inst.amount) - (Number(inst.paid_amount) || 0));
    setPayingInst(inst);
    setPayAmount(remaining.toString());
    setPayMethod(paymentMethods[0]?.name || 'Bank Transfer / CPO');
    setPayNotes(`Tranche ${inst.installment_number} settlement`);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingInst || !payAmount || Number(payAmount) <= 0) return;
    setSubmitting(true);
    try {
      if (onRecordPayment) {
        await onRecordPayment(payingInst.id, {
          amount: Number(payAmount),
          paymentMethod: payMethod,
          notes: payNotes
        });
      }
      setPayingInst(null);
      if (refreshData) refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal stay-account-modal" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>GUEST STAY ACCOUNT &amp; BILLING</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span>Stay Account · {account.reference}</span>
              {reservation?.payment_terms && reservation.payment_terms !== 'upfront' && (
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 13, border: '1px solid #bae6fd' }}>
                  📅 {reservation.payment_terms.toUpperCase()} PLAN
                </span>
              )}
            </h2>
          </div>
          <button className="icon" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* Guest & Contract Summary Header Cards */}
        <div className="folio-metric-grid" style={{ margin: '14px 0 18px' }}>
          <div className="folio-metric-box">
            <small>Total Contract Charges</small>
            <strong>{formatMoney(totalContract || account.balance, currency)}</strong>
            <span>{reservation?.rental_type || 'Standard'} Stay</span>
          </div>
          <div className="folio-metric-box">
            <small>Total Paid to Date</small>
            <strong style={{ color: '#16a34a' }}>{formatMoney(totalPaid, currency)}</strong>
            <span>Settled payments</span>
          </div>
          <div className="folio-metric-box">
            <small>Outstanding Balance</small>
            <strong style={{ color: account.balance > 0 ? '#b91c1c' : '#16a34a' }}>
              {formatMoney(account.balance, currency)}
            </strong>
            <span>{account.balance === 0 ? 'Fully Settled' : 'Unpaid Remaining'}</span>
          </div>
          <div className="folio-metric-box">
            <small>Security Deposit</small>
            <strong style={{ color: '#0369a1' }}>{formatMoney(account.deposit, currency)}</strong>
            <span>Held in escrow</span>
          </div>
        </div>

        {/* View Tabs */}
        {hasInstallments && (
          <div className="spec-editor-tabs" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`spec-tab-btn ${activeTab === 'installments' ? 'active' : ''}`}
              onClick={() => setActiveTab('installments')}
            >
              <span>📅 Installment Schedule ({installments.length} Terms)</span>
            </button>
            <button
              type="button"
              className={`spec-tab-btn ${activeTab === 'entries' ? 'active' : ''}`}
              onClick={() => setActiveTab('entries')}
            >
              <span>📋 All Account Ledger Entries ({(account.entries || []).length})</span>
            </button>
          </div>
        )}

        {/* TAB 1: INSTALLMENT SCHEDULE */}
        {activeTab === 'installments' && hasInstallments && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Scheduled billing milestones agreed for guest <strong>{account.guest_name}</strong>.
              </p>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {installments.filter(i => i.status === 'paid').length} of {installments.length} Installments Paid
              </span>
            </div>

            {/* Installment Payment Modal / Box */}
            {payingInst && (
              <form onSubmit={handleConfirmPayment} className="installment-pay-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#172c40' }}>
                    Record Payment: <strong>{payingInst.title}</strong>
                  </h4>
                  <button type="button" className="icon" onClick={() => setPayingInst(null)}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="spec-input-label">Payment Amount ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="spec-input"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="spec-input-label">Payment Method</label>
                    <select
                      className="spec-input"
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                    >
                      <option value="Bank Transfer / CPO">Bank Transfer / CPO</option>
                      <option value="Cash">Cash</option>
                      <option value="Telebirr">Telebirr</option>
                      <option value="CBE Birr">CBE Birr</option>
                      <option value="Credit / Debit Card (POS)">Credit / Debit Card (POS)</option>
                      <option value="Corporate Check">Corporate Check</option>
                    </select>
                  </div>
                  <div>
                    <label className="spec-input-label">Receipt / Reference</label>
                    <input
                      type="text"
                      className="spec-input"
                      placeholder="e.g. CPO #882194"
                      value={payNotes}
                      onChange={e => setPayNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button type="button" className="secondary small" onClick={() => setPayingInst(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="small" disabled={submitting}>
                    {submitting ? 'Recording…' : `Confirm Payment of ${formatMoney(payAmount, currency)}`}
                  </button>
                </div>
              </form>
            )}

            {/* Installment Table */}
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Term / Milestone</th>
                    <th>Due Date</th>
                    <th>Installment Amount</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(inst => {
                    const isPaid = inst.status === 'paid';
                    const isOverdue = inst.status === 'overdue';
                    const remaining = Math.max(0, Number(inst.amount) - (Number(inst.paid_amount) || 0));

                    return (
                      <tr key={inst.id} style={{ background: isOverdue ? '#fff1f2' : undefined }}>
                        <td>
                          <strong>{inst.title}</strong>
                          {inst.payment_method && (
                            <small className="muted" style={{ display: 'block' }}>
                              Via {inst.payment_method} {inst.paid_date ? `· ${formatDate(inst.paid_date)}` : ''}
                            </small>
                          )}
                        </td>
                        <td>
                          <strong>{formatDate(inst.due_date)}</strong>
                          {isOverdue && (
                            <small style={{ color: '#dc2626', display: 'block', fontWeight: 600 }}>
                              Overdue
                            </small>
                          )}
                        </td>
                        <td>
                          <strong>{formatMoney(inst.amount, currency)}</strong>
                        </td>
                        <td>
                          <span style={{ color: isPaid ? '#16a34a' : (inst.paid_amount > 0 ? '#7c3aed' : '#64748b'), fontWeight: 600 }}>
                            {formatMoney(inst.paid_amount || 0, currency)}
                          </span>
                        </td>
                        <td>
                          {isPaid ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                              ✓ Fully Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                              ⚠️ Overdue
                            </span>
                          ) : inst.paid_amount > 0 ? (
                            <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                              Partial ({formatMoney(remaining, currency)} left)
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!isPaid ? (
                            <button
                              type="button"
                              className="small"
                              onClick={() => openPayForm(inst)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <CreditCard size={13} />
                              <span>Record Payment</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT LEDGER ENTRIES */}
        {(activeTab === 'entries' || !hasInstallments) && (
          <div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Entry &amp; Description</th>
                    <th>Kind</th>
                    <th>Amount</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {(account.entries || []).map(entry => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.description || entry.kind}</strong>
                        {entry.payment_method && (
                          <small style={{ display: 'block', color: '#61727d' }}>
                            Method: {entry.payment_method}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${entry.kind}`}>{entry.kind}</span>
                      </td>
                      <td>
                        <strong style={{ color: entry.kind === 'payment' ? '#16a34a' : undefined }}>
                          {entry.kind === 'payment' ? '-' : ''}{formatMoney(entry.amount, currency)}
                        </strong>
                      </td>
                      <td>
                        {entry.actor}
                        <small style={{ display: 'block', color: '#61727d' }}>
                          {formatDate(entry.created_at)}
                        </small>
                      </td>
                    </tr>
                  ))}
                  {(account.entries || []).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                        No ledger entries recorded on this stay account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer>
          <button type="button" className="secondary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Printer size={15} />
            <span>Print Account Statement</span>
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function InspectionModal({ inspection, currency, onClose, onSaved }) {
  const [lines, setLines] = useState(inspection.lines);
  const [guestAck, setGuestAck] = useState(false);
  const [guestName, setGuestName] = useState(inspection.guestName || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleFinalize(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiCall(`/reservations/${inspection.reservationId}/inspection`, 'POST', {
        type: inspection.type,
        lines,
        guestAcknowledged: guestAck,
        acknowledgingGuest: guestName,
        conditionNotes: notes
      });
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" onClick={e => e.stopPropagation()}>
        <header>
          <h2>{inspection.type === 'check_in' ? 'Check-in' : 'Checkout'} apartment checklist</h2>
          <button className="icon" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <p className="muted">{inspection.reservationRef} · {inspection.guestName}</p>

        <form onSubmit={handleFinalize}>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Expected</th>
                  <th>Present</th>
                  <th>Damaged</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((item, idx) => (
                  <tr key={item.name}>
                    <td>
                      <strong>{item.name}</strong>
                      <small style={{ display: 'block', color: '#61727d' }}>
                        {formatMoney(item.price, currency)} replacement
                      </small>
                    </td>
                    <td>{item.expected}</td>
                    <td>
                      <input
                        type="number"
                        className="qty"
                        min="0"
                        value={item.present}
                        onChange={e => {
                          const updated = [...lines];
                          updated[idx].present = Number(e.target.value);
                          setLines(updated);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="qty"
                        min="0"
                        value={item.damaged}
                        onChange={e => {
                          const updated = [...lines];
                          updated[idx].damaged = Number(e.target.value);
                          setLines(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="field" style={{ marginTop: 15 }}>
            <span>Condition notes / existing damage</span>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Scuff mark on bedroom door, all electronics tested"
            />
          </label>

          <label className="checkline" style={{ margin: '15px 0' }}>
            <input
              type="checkbox"
              checked={guestAck}
              onChange={e => setGuestAck(e.target.checked)}
            />
            The arriving guest has reviewed and confirmed this checklist with me.
          </label>

          <label className="field">
            <span>Name of acknowledging guest</span>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
            />
          </label>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Finalizing…' : 'Finalize checklist'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

// Specifications Defaults for Solta Hotel Apartments
const DEFAULT_SPECS = {
  studio: {
    type: 'Studio Serviced Apartment',
    bedrooms: 'Studio Suite',
    beds: '1 Queen Bed (160 × 200 cm)',
    bathrooms: '1 Full Bathroom (Rain shower & vanity)',
    bathroomsSubtitle: 'Rain shower & vanity',
    area: '42 m²',
    areaSqft: '452 sq.ft',
    livingRoom: 'Integrated Studio Lounge with 43" 4K Smart TV',
    kitchen: 'Compact Kitchenette with induction stove, mini-fridge & microwave',
    balcony: 'Balcony with city view',
    bedConfig: '1 Queen Size Bed with orthopedic mattress and luxury cotton linens',
    capacityInfo: 'Up to 2 Adults',
    features: [
      'High-speed fiber Wi-Fi (up to 100 Mbps)',
      'Individual climate control / air conditioning',
      'Compact automatic washer utility setup',
      'Blackout drapes & acoustic soundproof windows',
      'Digital laptop safe box & RFID keycard lock',
      '24/7 continuous generator power backup',
      'Daily housekeeping & fresh linen service'
    ],
    furniture: [
      { item: 'Queen bed with orthopedic mattress', qty: 1 },
      { item: 'Comfortable armchair & side table', qty: 1 },
      { item: 'Compact dining / work table with chairs', qty: 2 },
      { item: 'Smart TV 43" 4K HDR', qty: 1 },
      { item: 'Wardrobe with luggage rack', qty: 1 },
      { item: 'Kitchenette essentials & dinnerware set', qty: 1 }
    ]
  },
  one: {
    type: '1-Bedroom Serviced Apartment',
    bedrooms: '1 Bedroom',
    beds: '1 King Size Bed (180 × 200 cm)',
    bathrooms: '1 Full Bathroom (Rain shower & luxury vanity)',
    bathroomsSubtitle: 'Rain shower & vanity',
    area: '65 m²',
    areaSqft: '700 sq.ft',
    livingRoom: 'Dedicated Living Room with Sofa & 43" 4K Smart TV',
    kitchen: 'Kitchenette with induction cooktop, refrigerator, microwave & kettle',
    balcony: 'Private Balcony with courtyard garden view',
    bedConfig: '1 King Size Bed (180 × 200 cm) with orthopedic mattress and luxury cotton linens',
    capacityInfo: 'Up to 2 Adults (plus 1 child under 6)',
    features: [
      'High-speed fiber Wi-Fi (up to 100 Mbps)',
      'In-unit automatic washing machine, iron & board',
      'Individual climate control / air conditioning',
      'Blackout drapes & acoustic soundproof windows',
      'Digital laptop safe box & RFID keycard lock',
      '24/7 continuous generator power backup',
      'Daily housekeeping & fresh linen service'
    ],
    furniture: [
      { item: 'King bed with orthopedic mattress', qty: 1 },
      { item: 'Lounge sofa & coffee table', qty: 1 },
      { item: 'Dining table with chairs', qty: 2 },
      { item: 'Smart TV 43" 4K HDR', qty: 1 },
      { item: 'Work desk & ergonomic chair', qty: 1 },
      { item: 'Kitchen cookware & dinnerware set', qty: 1 }
    ]
  },
  two: {
    type: '2-Bedroom Residence Apartment',
    bedrooms: '2 Private Bedrooms',
    beds: '1 Master King Bed + 1 Queen Bed',
    bathrooms: '2 Full Bathrooms (1 En-suite with tub + 1 Guest shower)',
    bathroomsSubtitle: 'Rain shower & vanity',
    area: '95 m²',
    areaSqft: '1,020 sq.ft',
    livingRoom: 'Spacious open-concept salon with 55" Smart TV & 6-seat dining',
    kitchen: 'Chef\'s kitchen with oven, microwave, large fridge & breakfast bar',
    balcony: 'Dual Balconies with panoramic city skyline views',
    bedConfig: '1 Master King Bed + 1 Queen Bed with orthopedic mattress and luxury cotton linens',
    capacityInfo: 'Up to 4 Guests (ideal for families or executive teams)',
    features: [
      'High-speed fiber Wi-Fi (up to 100 Mbps)',
      'Master bedroom with walk-in closet & en-suite bath',
      'In-unit automatic washer/dryer utility setup',
      'Multi-zone air conditioning in each bedroom',
      'Dual Smart TVs (Living salon & master suite)',
      'Digital safe & electronic smart lock',
      '24/7 continuous generator power backup',
      'Daily housekeeping & full turnaround service'
    ],
    furniture: [
      { item: 'Master King bed & Queen guest bed', qty: 2 },
      { item: 'Spacious sectional sofa & coffee table', qty: 1 },
      { item: 'Dining table & chairs', qty: 6 },
      { item: '55" 4K Smart TVs', qty: 2 },
      { item: 'Full kitchen appliance & cookware suite', qty: 1 },
      { item: 'Wardrobes with internal organizers', qty: 2 }
    ]
  },
  three: {
    type: '3-Bedroom Penthouse Executive Suite',
    bedrooms: '3 Grand Bedrooms',
    beds: '1 Master King Bed + 2 Queen Beds',
    bathrooms: '3 Bathrooms (2 En-suite full bathrooms + 1 powder room)',
    bathroomsSubtitle: 'Rain shower & vanity',
    area: '145 m²',
    areaSqft: '1,560 sq.ft',
    livingRoom: 'Executive Penthouse Lounge with sectional seating & 8-seat formal dining',
    kitchen: 'Gourmet island kitchen with full appliances, dishwasher & espresso station',
    balcony: 'Wrap-around private terrace with city & mountain views',
    bedConfig: '1 Master King Bed + 2 Queen Beds with orthopedic mattress and luxury cotton linens',
    capacityInfo: 'Up to 6 Guests (diplomats, large families, extended corporate stays)',
    features: [
      'Top-floor penthouse layout with wrap-around outdoor terrace',
      'Private master wing with spa-style bathroom & marble vanity',
      'Dedicated quiet executive home office with high-speed ports',
      'In-unit laundry room with heavy-duty washer & dryer',
      'Three 4K Smart TVs with surround soundbar',
      '24/7 continuous generator backup & priority concierge',
      'Multi-zone climate control throughout all rooms'
    ],
    furniture: [
      { item: 'Master King bed & 2 Queen beds', qty: 3 },
      { item: 'Executive sectional lounge & accent armchairs', qty: 1 },
      { item: 'Formal dining table with chairs', qty: 8 },
      { item: 'Smart 4K TVs with soundbar', qty: 3 },
      { item: 'Gourmet kitchen suite & espresso machine', qty: 1 },
      { item: 'Terrace outdoor loungers & bistro set', qty: 1 }
    ]
  }
};

function parseUnitSpecs(rawSpecs, catKey) {
  const fallback = DEFAULT_SPECS[catKey] || DEFAULT_SPECS.one;
  let parsed = null;
  if (rawSpecs) {
    if (typeof rawSpecs === 'string') {
      try {
        parsed = JSON.parse(rawSpecs);
      } catch (e) {
        parsed = null;
      }
    } else if (typeof rawSpecs === 'object') {
      parsed = rawSpecs;
    }
  }
  return {
    type: parsed?.type || fallback.type,
    bedrooms: parsed?.bedrooms || fallback.bedrooms,
    beds: parsed?.beds || fallback.beds,
    bathrooms: parsed?.bathrooms || fallback.bathrooms,
    bathroomsSubtitle: parsed?.bathroomsSubtitle || fallback.bathroomsSubtitle || 'Rain shower & vanity',
    area: parsed?.area || fallback.area,
    areaSqft: parsed?.areaSqft || fallback.areaSqft,
    livingRoom: parsed?.livingRoom || fallback.livingRoom,
    kitchen: parsed?.kitchen || fallback.kitchen,
    balcony: parsed?.balcony || fallback.balcony,
    bedConfig: parsed?.bedConfig || fallback.bedConfig || `${parsed?.beds || fallback.beds} with orthopedic mattress and luxury cotton linens`,
    capacityInfo: parsed?.capacityInfo || fallback.capacityInfo,
    features: Array.isArray(parsed?.features) ? [...parsed.features] : [...fallback.features],
    furniture: Array.isArray(parsed?.furniture) ? parsed.furniture.map(f => ({ ...f })) : fallback.furniture.map(f => ({ ...f }))
  };
}

function RoomDetailsModal({ unit, property, reservations = [], tasks = [], onClose, onBookUnit, onScheduleCleaning, onOpenExtension, onUpdateUnit }) {
  const [currentUnit, setCurrentUnit] = useState(unit);
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState('general'); // 'general' | 'layout' | 'amenities' | 'furnishing'
  const [saving, setSaving] = useState(false);

  // Sync with prop if parent updates
  useEffect(() => {
    if (unit) setCurrentUnit(unit);
  }, [unit]);

  const activeUnit = currentUnit || unit || {};
  const catKey = (activeUnit.category || '').toLowerCase().includes('studio')
    ? 'studio'
    : (activeUnit.category || '').toLowerCase().includes('two')
      ? 'two'
      : (activeUnit.category || '').toLowerCase().includes('three')
        ? 'three'
        : 'one';
  const imgObj = APARTMENT_IMAGES[catKey] || APARTMENT_IMAGES.one;

  // Active specifications parsed from unit or defaults
  const [activeSpecs, setActiveSpecs] = useState(() => parseUnitSpecs(activeUnit.specs, catKey));

  // Edit draft state
  const [editUnit, setEditUnit] = useState({
    code: activeUnit.code || '',
    category: activeUnit.category || '',
    capacity: activeUnit.capacity || 2,
    nightly_rate: activeUnit.nightly_rate || 0
  });
  const [editSpecs, setEditSpecs] = useState(() => ({ ...activeSpecs }));

  // New amenity & furnishing input states
  const [newAmenity, setNewAmenity] = useState('');
  const [newFurnItem, setNewFurnItem] = useState('');
  const [newFurnQty, setNewFurnQty] = useState(1);

  if (!unit) return null;

  // When opening edit mode or changing unit, initialize draft
  const startEditing = (initialTab = 'general') => {
    setEditUnit({
      code: currentUnit.code || '',
      category: currentUnit.category || '',
      capacity: currentUnit.capacity || 2,
      nightly_rate: currentUnit.nightly_rate || 0
    });
    setEditSpecs(JSON.parse(JSON.stringify(activeSpecs)));
    setEditTab(initialTab);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveSpecs = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: editUnit.code,
        category: editUnit.category,
        capacity: Number(editUnit.capacity) || 2,
        nightly_rate: Number(editUnit.nightly_rate) || 0,
        specs: editSpecs
      };

      if (onUpdateUnit) {
        await onUpdateUnit(currentUnit.id, payload);
      }

      // Update local state immediately
      setCurrentUnit(prev => ({
        ...prev,
        ...payload
      }));
      setActiveSpecs(editSpecs);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save apartment specifications:', err);
    } finally {
      setSaving(false);
    }
  };

  // Amenities helpers
  const handleAddAmenity = () => {
    const trimmed = newAmenity.trim();
    if (!trimmed) return;
    if (!editSpecs.features.includes(trimmed)) {
      setEditSpecs(prev => ({
        ...prev,
        features: [...prev.features, trimmed]
      }));
    }
    setNewAmenity('');
  };

  const handleQuickAddAmenity = (amenity) => {
    if (!editSpecs.features.includes(amenity)) {
      setEditSpecs(prev => ({
        ...prev,
        features: [...prev.features, amenity]
      }));
    }
  };

  const handleRemoveAmenity = (index) => {
    setEditSpecs(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateAmenity = (index, value) => {
    setEditSpecs(prev => {
      const updated = [...prev.features];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  // Furnishing helpers
  const handleAddFurniture = () => {
    const trimmed = newFurnItem.trim();
    if (!trimmed) return;
    setEditSpecs(prev => ({
      ...prev,
      furniture: [...prev.furniture, { item: trimmed, qty: Number(newFurnQty) || 1 }]
    }));
    setNewFurnItem('');
    setNewFurnQty(1);
  };

  const handleQuickAddFurniture = (item, defaultQty = 1) => {
    setEditSpecs(prev => ({
      ...prev,
      furniture: [...prev.furniture, { item, qty: defaultQty }]
    }));
  };

  const handleRemoveFurniture = (index) => {
    setEditSpecs(prev => ({
      ...prev,
      furniture: prev.furniture.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateFurniture = (index, field, value) => {
    setEditSpecs(prev => {
      const updated = [...prev.furniture];
      updated[index] = {
        ...updated[index],
        [field]: field === 'qty' ? Math.max(0, Number(value) || 0) : value
      };
      return { ...prev, furniture: updated };
    });
  };

  // Overstay and active booking calculation
  const overstayInfo = getUnitOverstayInfo(currentUnit, reservations);
  const activeRes = overstayInfo?.reservation;

  // Find active or upcoming booking for this unit
  const unitReservations = reservations.filter(r => r.unit_id === currentUnit.id);
  const currentBooking = unitReservations.find(r => r.status === 'checked_in') ||
    unitReservations.find(r => r.status === 'confirmed');

  // Find housekeeping status
  const currentTask = tasks.find(t => t.unit_id === currentUnit.id && t.status !== 'completed');

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal room-detail-modal" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>SOLTA APARTMENT SPECIFICATIONS</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span>{isEditing ? editUnit.code : currentUnit.code}</span>
              <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}>
                · {isEditing ? editSpecs.type : activeSpecs.type}
              </span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isEditing ? (
              <button
                type="button"
                className="secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#172c40', borderColor: '#cbd5e1' }}
                onClick={() => startEditing('general')}
              >
                <Edit3 size={15} />
                <span>Edit Specifications</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveSpecs}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </>
            )}
            <button className="icon" onClick={onClose} aria-label="Close details">
              <X size={20} />
            </button>
          </div>
        </header>

        {isEditing ? (
          /* ================================================================ */
          /*                       SPECIFICATIONS EDIT MODE                   */
          /* ================================================================ */
          <div className="spec-editor-container" style={{ padding: '4px 0 16px' }}>
            {/* Tabs Bar */}
            <div className="spec-editor-tabs">
              <button
                type="button"
                className={`spec-tab-btn ${editTab === 'general' ? 'active' : ''}`}
                onClick={() => setEditTab('general')}
              >
                <span>⚙️ General &amp; Metrics</span>
              </button>
              <button
                type="button"
                className={`spec-tab-btn ${editTab === 'layout' ? 'active' : ''}`}
                onClick={() => setEditTab('layout')}
              >
                <span>🛏️ Layout &amp; Beds</span>
              </button>
              <button
                type="button"
                className={`spec-tab-btn ${editTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setEditTab('amenities')}
              >
                <span>✨ Included Amenities ({editSpecs.features.length})</span>
              </button>
              <button
                type="button"
                className={`spec-tab-btn ${editTab === 'furnishing' ? 'active' : ''}`}
                onClick={() => setEditTab('furnishing')}
              >
                <span>📦 Furnishing Standards ({editSpecs.furniture.length})</span>
              </button>
            </div>

            {/* TAB 1: General Info & 4 Metric Badges */}
            {editTab === 'general' && (
              <div className="spec-tab-panel">
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#172c40', fontWeight: 600 }}>
                    Core Unit Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div>
                      <label className="spec-input-label">Apartment Code</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editUnit.code}
                        onChange={e => setEditUnit({ ...editUnit, code: e.target.value })}
                        placeholder="e.g. 101"
                        required
                      />
                    </div>
                    <div>
                      <label className="spec-input-label">Apartment Category</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editUnit.category}
                        onChange={e => setEditUnit({ ...editUnit, category: e.target.value })}
                        placeholder="e.g. 1-Bedroom Serviced Apartment"
                        required
                      />
                    </div>
                    <div>
                      <label className="spec-input-label">Max Capacity (Guests)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="spec-input"
                        value={editUnit.capacity}
                        onChange={e => setEditUnit({ ...editUnit, capacity: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="spec-input-label">Nightly Rate ({property.currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="spec-input"
                        value={editUnit.nightly_rate}
                        onChange={e => setEditUnit({ ...editUnit, nightly_rate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label className="spec-input-label">Specification Title / Subtitle</label>
                    <input
                      type="text"
                      className="spec-input"
                      value={editSpecs.type}
                      onChange={e => setEditSpecs({ ...editSpecs, type: e.target.value })}
                      placeholder="e.g. 3-Bedroom Penthouse Executive Suite"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#172c40', fontWeight: 600 }}>
                    4 Key Metric Badges (Top Display Box)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    <div className="spec-metric-edit-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Bed size={16} color="#1e40af" />
                        <strong>1. Beds &amp; Rooms Metric</strong>
                      </div>
                      <label className="spec-input-label">Heading</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.bedrooms}
                        onChange={e => setEditSpecs({ ...editSpecs, bedrooms: e.target.value })}
                        placeholder="e.g. 3 Grand Bedrooms"
                      />
                      <label className="spec-input-label" style={{ marginTop: 6 }}>Sub-label</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.beds}
                        onChange={e => setEditSpecs({ ...editSpecs, beds: e.target.value })}
                        placeholder="e.g. 1 Master King Bed + 2 Queen Beds"
                      />
                    </div>

                    <div className="spec-metric-edit-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Users size={16} color="#1e40af" />
                        <strong>2. Max Capacity Metric</strong>
                      </div>
                      <label className="spec-input-label">Guests Count Display</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={`${editUnit.capacity} Guests`}
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b' }}
                      />
                      <label className="spec-input-label" style={{ marginTop: 6 }}>Capacity Notes / Subtitle</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.capacityInfo}
                        onChange={e => setEditSpecs({ ...editSpecs, capacityInfo: e.target.value })}
                        placeholder="e.g. Up to 6 Guests (diplomats, large families...)"
                      />
                    </div>

                    <div className="spec-metric-edit-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Bath size={16} color="#1e40af" />
                        <strong>3. Bathrooms Metric</strong>
                      </div>
                      <label className="spec-input-label">Heading</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.bathrooms}
                        onChange={e => setEditSpecs({ ...editSpecs, bathrooms: e.target.value })}
                        placeholder="e.g. 3 Bathrooms"
                      />
                      <label className="spec-input-label" style={{ marginTop: 6 }}>Sub-label</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.bathroomsSubtitle}
                        onChange={e => setEditSpecs({ ...editSpecs, bathroomsSubtitle: e.target.value })}
                        placeholder="e.g. Rain shower & vanity"
                      />
                    </div>

                    <div className="spec-metric-edit-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Maximize2 size={16} color="#1e40af" />
                        <strong>4. Floor Area Metric</strong>
                      </div>
                      <label className="spec-input-label">Metric Area</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.area}
                        onChange={e => setEditSpecs({ ...editSpecs, area: e.target.value })}
                        placeholder="e.g. 145 m²"
                      />
                      <label className="spec-input-label" style={{ marginTop: 6 }}>Imperial Area (sq.ft)</label>
                      <input
                        type="text"
                        className="spec-input"
                        value={editSpecs.areaSqft}
                        onChange={e => setEditSpecs({ ...editSpecs, areaSqft: e.target.value })}
                        placeholder="e.g. 1,560 sq.ft"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Room Layout & Beds */}
            {editTab === 'layout' && (
              <div className="spec-tab-panel">
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                  Define the narrative descriptions for layout, rooms, kitchen, and balcony specifications shown in the left column.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="spec-input-label">Bed Configuration Details</label>
                    <textarea
                      rows={2}
                      className="spec-textarea"
                      value={editSpecs.bedConfig}
                      onChange={e => setEditSpecs({ ...editSpecs, bedConfig: e.target.value })}
                      placeholder="e.g. 1 Master King Bed + 2 Queen Beds with orthopedic mattress and luxury cotton linens"
                    />
                  </div>

                  <div>
                    <label className="spec-input-label">Living Room Description</label>
                    <textarea
                      rows={2}
                      className="spec-textarea"
                      value={editSpecs.livingRoom}
                      onChange={e => setEditSpecs({ ...editSpecs, livingRoom: e.target.value })}
                      placeholder="e.g. Executive Penthouse Lounge with sectional seating & 8-seat formal dining"
                    />
                  </div>

                  <div>
                    <label className="spec-input-label">Kitchen Description</label>
                    <textarea
                      rows={2}
                      className="spec-textarea"
                      value={editSpecs.kitchen}
                      onChange={e => setEditSpecs({ ...editSpecs, kitchen: e.target.value })}
                      placeholder="e.g. Gourmet island kitchen with full appliances, dishwasher & espresso station"
                    />
                  </div>

                  <div>
                    <label className="spec-input-label">Balcony &amp; View Description</label>
                    <textarea
                      rows={2}
                      className="spec-textarea"
                      value={editSpecs.balcony}
                      onChange={e => setEditSpecs({ ...editSpecs, balcony: e.target.value })}
                      placeholder="e.g. Wrap-around private terrace with city & mountain views"
                    />
                  </div>

                  <div>
                    <label className="spec-input-label">Bathrooms Description</label>
                    <textarea
                      rows={2}
                      className="spec-textarea"
                      value={editSpecs.bathrooms}
                      onChange={e => setEditSpecs({ ...editSpecs, bathrooms: e.target.value })}
                      placeholder="e.g. 3 Bathrooms (2 En-suite full bathrooms + 1 powder room)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Included Amenities */}
            {editTab === 'amenities' && (
              <div className="spec-tab-panel">
                <div style={{ marginBottom: 16 }}>
                  <label className="spec-input-label">Quick Add Standard Amenities</label>
                  <div className="spec-preset-chips">
                    {[
                      'High-speed fiber Wi-Fi (up to 100 Mbps)',
                      'In-unit automatic washing machine, iron & board',
                      'Individual climate control / multi-zone air conditioning',
                      'Blackout drapes & acoustic soundproof windows',
                      'Digital laptop safe box & RFID keycard lock',
                      '24/7 continuous generator power backup',
                      'Daily housekeeping & fresh linen service',
                      'Dedicated quiet executive home office with high-speed ports',
                      'Three 4K Smart TVs with surround soundbar',
                      'Wrap-around outdoor terrace with seating',
                      'Gourmet kitchen suite & espresso machine',
                      'Full turnaround service & priority concierge'
                    ].map((preset, idx) => {
                      const alreadyAdded = editSpecs.features.includes(preset);
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`spec-chip-btn ${alreadyAdded ? 'added' : ''}`}
                          onClick={() => handleQuickAddAmenity(preset)}
                          disabled={alreadyAdded}
                        >
                          {alreadyAdded ? '✓' : '+'} {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Amenity Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <input
                    type="text"
                    className="spec-input"
                    placeholder="Enter custom amenity or feature…"
                    value={newAmenity}
                    onChange={e => setNewAmenity(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAmenity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleAddAmenity}
                  >
                    <Plus size={16} />
                    <span>Add Amenity</span>
                  </button>
                </div>

                {/* Amenity Items List */}
                <div className="spec-items-container">
                  {editSpecs.features.map((feat, idx) => (
                    <div key={idx} className="spec-editable-row">
                      <CheckCircle2 size={16} className="text-green" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        className="spec-input-clean"
                        value={feat}
                        onChange={e => handleUpdateAmenity(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className="spec-delete-row-btn"
                        onClick={() => handleRemoveAmenity(idx)}
                        title="Remove amenity"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {editSpecs.features.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                      No amenities added yet. Use the presets above or type a custom one.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Furnishing Standards */}
            {editTab === 'furnishing' && (
              <div className="spec-tab-panel">
                <div style={{ marginBottom: 16 }}>
                  <label className="spec-input-label">Quick Add Standard Furnishing Items</label>
                  <div className="spec-preset-chips">
                    {[
                      { item: 'Master King bed & orthopedic mattress', qty: 1 },
                      { item: 'Queen size guest bed', qty: 2 },
                      { item: 'Executive sectional lounge & armchairs', qty: 1 },
                      { item: 'Formal dining table with chairs', qty: 6 },
                      { item: 'Smart 4K TVs with soundbar', qty: 2 },
                      { item: 'Full kitchen appliance & cookware suite', qty: 1 },
                      { item: 'Work desk & ergonomic chair', qty: 1 },
                      { item: 'Wardrobes with internal organizers', qty: 2 },
                      { item: 'Terrace outdoor loungers & bistro set', qty: 1 },
                      { item: 'Espresso coffee machine', qty: 1 }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="spec-chip-btn"
                        onClick={() => handleQuickAddFurniture(preset.item, preset.qty)}
                      >
                        + {preset.item} (Qty: {preset.qty})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Furnishing Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    className="spec-input"
                    placeholder="Item & standard spec description…"
                    value={newFurnItem}
                    onChange={e => setNewFurnItem(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFurniture();
                      }
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    className="spec-input"
                    placeholder="Qty"
                    value={newFurnQty}
                    onChange={e => setNewFurnQty(e.target.value)}
                  />
                  <button
                    type="button"
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleAddFurniture}
                  >
                    <Plus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Table of Furnishing Standards */}
                <table className="mini-furnishing-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Item &amp; Standard Specification</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Std Qty</th>
                      <th style={{ width: 44, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editSpecs.furniture.map((f, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            className="spec-input-clean"
                            value={f.item}
                            onChange={e => handleUpdateFurniture(i, 'item', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            className="spec-input"
                            style={{ width: '70px', textAlign: 'center', padding: '4px 6px', margin: '0 auto' }}
                            value={f.qty}
                            onChange={e => handleUpdateFurniture(i, 'qty', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                          <button
                            type="button"
                            className="spec-delete-row-btn"
                            onClick={() => handleRemoveFurniture(i)}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {editSpecs.furniture.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                          No furnishing standards recorded yet. Use the presets above to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================ */
          /*                       SPECIFICATIONS VIEW MODE                   */
          /* ================================================================ */
          <>
            {/* Hero Photo Banner */}
            <div className="room-hero">
              <img src={imgObj.src} alt={currentUnit.code} />
              <div className="room-hero-overlay">
                <div className="room-hero-badges">
                  {overstayInfo?.isOverstay ? (
                    <span className="badge badge-overstay">
                      ⚠️ Overstayed ({overstayInfo.timeOverdue})
                    </span>
                  ) : (
                    <span className={`badge ${currentUnit.occupied ? 'occupied' : currentUnit.readiness}`}>
                      {currentUnit.occupied ? 'Currently Occupied' : currentUnit.readiness === 'ready' ? 'Ready for Check-in' : currentUnit.readiness}
                    </span>
                  )}
                  <span className="badge ready" style={{ background: '#172c40', color: '#fff' }}>
                    {formatMoney(currentUnit.nightly_rate, property.currency)} / night
                  </span>
                </div>
                <div className="room-hero-caption">
                  <strong>{currentUnit.code} · {currentUnit.category}</strong>
                  <span>Solta Hotel Apartment · Whole Serviced Apartment</span>
                </div>
              </div>
            </div>

            {/* Overstay Alert Notice inside Modal */}
            {overstayInfo?.isOverstay && (
              <div className="modal-overstay-box" style={{ margin: '16px 24px 0' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <AlertTriangle size={24} color="#dc2626" />
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '14px', display: 'block' }}>
                      Departure Overdue by {overstayInfo.timeOverdue}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                      Guest {activeRes?.guest_name} was scheduled to check out on {formatDateTime(activeRes?.departure)}.
                    </span>
                  </div>
                </div>
                {onOpenExtension && (
                  <button
                    type="button"
                    className="extension-btn"
                    onClick={() => {
                      onClose();
                      onOpenExtension(currentUnit, activeRes);
                    }}
                  >
                    Extension
                  </button>
                )}
              </div>
            )}

            {/* 4 Key Metric Badges */}
            <div className="room-metric-grid">
              <div className="room-metric-box" onClick={() => startEditing('general')} title="Click to edit metrics" style={{ cursor: 'pointer' }}>
                <Bed size={20} className="room-metric-icon" />
                <div>
                  <small>Beds &amp; Rooms</small>
                  <strong>{activeSpecs.bedrooms}</strong>
                  <span>{activeSpecs.beds}</span>
                </div>
              </div>
              <div className="room-metric-box" onClick={() => startEditing('general')} title="Click to edit capacity" style={{ cursor: 'pointer' }}>
                <Users size={20} className="room-metric-icon" />
                <div>
                  <small>Max Capacity</small>
                  <strong>{currentUnit.capacity} Guests</strong>
                  <span>{activeSpecs.capacityInfo}</span>
                </div>
              </div>
              <div className="room-metric-box" onClick={() => startEditing('general')} title="Click to edit bathrooms" style={{ cursor: 'pointer' }}>
                <Bath size={20} className="room-metric-icon" />
                <div>
                  <small>Bathrooms</small>
                  <strong>{activeSpecs.bathrooms.split('(')[0].trim()}</strong>
                  <span>{activeSpecs.bathroomsSubtitle || 'Rain shower & vanity'}</span>
                </div>
              </div>
              <div className="room-metric-box" onClick={() => startEditing('general')} title="Click to edit area" style={{ cursor: 'pointer' }}>
                <Maximize2 size={20} className="room-metric-icon" />
                <div>
                  <small>Floor Area</small>
                  <strong>{activeSpecs.area}</strong>
                  <span>{activeSpecs.areaSqft || 'Floor area'}</span>
                </div>
              </div>
            </div>

            {/* 2-Column Detail Sections */}
            <div className="room-details-columns">
              {/* Column 1: Layout & Specifications */}
              <div className="room-col">
                <div className="room-section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, padding: 0, border: 'none' }}>Room Layout &amp; Beds</h3>
                    <button
                      type="button"
                      className="spec-mini-edit-btn"
                      onClick={() => startEditing('layout')}
                      title="Edit Room Layout"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <ul className="spec-list">
                    <li>
                      <strong>Bed configuration:</strong>
                      <span>{activeSpecs.bedConfig}</span>
                    </li>
                    <li>
                      <strong>Living room:</strong>
                      <span>{activeSpecs.livingRoom}</span>
                    </li>
                    <li>
                      <strong>Kitchen:</strong>
                      <span>{activeSpecs.kitchen}</span>
                    </li>
                    <li>
                      <strong>Balcony &amp; View:</strong>
                      <span>{activeSpecs.balcony}</span>
                    </li>
                    <li>
                      <strong>Bathrooms:</strong>
                      <span>{activeSpecs.bathrooms}</span>
                    </li>
                  </ul>
                </div>

                <div className="room-section-card" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, padding: 0, border: 'none' }}>Included Amenities</h3>
                    <button
                      type="button"
                      className="spec-mini-edit-btn"
                      onClick={() => startEditing('amenities')}
                      title="Edit Included Amenities"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="amenities-grid">
                    {activeSpecs.features.map((feat, idx) => (
                      <div key={idx} className="amenity-item">
                        <CheckCircle2 size={16} className="text-green" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Operational & Inventory Info */}
              <div className="room-col">
                {/* Operational Status */}
                <div className="room-section-card">
                  <h3>Operational Status</h3>
                  <div className="status-timeline">
                    <div className="status-row">
                      <span className="muted">Occupancy:</span>
                      <strong>{currentUnit.occupied ? 'Occupied' : 'Vacant & Available'}</strong>
                    </div>
                    <div className="status-row">
                      <span className="muted">Housekeeping:</span>
                      <span className={`badge ${currentUnit.readiness}`}>{currentUnit.readiness}</span>
                    </div>
                    {currentTask && (
                      <div className="status-alert">
                        <AlertTriangle size={15} />
                        <span>Turnaround task active: {currentTask.reason}</span>
                      </div>
                    )}
                    {currentBooking ? (
                      <div className={`booking-context-box ${overstayInfo?.isOverstay ? 'overstay-card-inline-notice' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <small style={{ fontWeight: 700, color: overstayInfo?.isOverstay ? '#991b1b' : 'var(--muted)' }}>
                            {overstayInfo?.isOverstay ? '⚠️ GUEST OVERSTAY' : 'CURRENT / NEXT BOOKING'}
                          </small>
                          {onOpenExtension && (
                            <button
                              type="button"
                              className="small extension-btn"
                              onClick={() => {
                                onClose();
                                onOpenExtension(currentUnit, currentBooking);
                              }}
                            >
                              Extension
                            </button>
                          )}
                        </div>
                        <strong>{currentBooking.guest_name}</strong>
                        <div style={{ fontSize: 12, color: overstayInfo?.isOverstay ? '#b91c1c' : '#55697a', marginTop: 3 }}>
                          Ref: {currentBooking.reference} · {formatDate(currentBooking.arrival)} &rarr; {formatDateTime(currentBooking.departure)}
                        </div>
                      </div>
                    ) : (
                      <div className="booking-context-box ready">
                        <small>BOOKING STATUS</small>
                        <strong style={{ color: '#2d6a4f' }}>Available for Immediate Booking</strong>
                        <div style={{ fontSize: 12, color: '#55697a', marginTop: 3 }}>
                          No active check-in on this unit.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Standard Inventory Checklist */}
                <div className="room-section-card" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, padding: 0, border: 'none' }}>Furnishing &amp; Inventory Standard</h3>
                    <button
                      type="button"
                      className="spec-mini-edit-btn"
                      onClick={() => startEditing('furnishing')}
                      title="Edit Furnishing Standards"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <table className="mini-furnishing-table">
                    <thead>
                      <tr>
                        <th>Item &amp; Standard Spec</th>
                        <th style={{ textAlign: 'right' }}>Standard Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSpecs.furniture.map((f, i) => (
                        <tr key={i}>
                          <td>{f.item}</td>
                          <td style={{ textAlign: 'right' }}><strong>{f.qty}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        <footer>
          {isEditing ? (
            <>
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSpecs}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving Specifications…' : 'Save Specifications'}</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#172c40', borderColor: '#cbd5e1' }}
                onClick={() => startEditing('general')}
              >
                <Edit3 size={16} />
                <span>Edit Specifications</span>
              </button>
              {currentBooking && onOpenExtension && (
                <button
                  type="button"
                  className="secondary"
                  style={{ borderColor: '#0052cc', color: '#0052cc', fontWeight: 600 }}
                  onClick={() => {
                    onClose();
                    onOpenExtension(currentUnit, currentBooking);
                  }}
                >
                  <Clock size={16} />
                  <span>Extension</span>
                </button>
              )}
              {currentUnit.readiness !== 'ready' && onScheduleCleaning && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    onClose();
                    onScheduleCleaning(currentUnit);
                  }}
                >
                  <Sparkles size={16} />
                  <span>Turnaround Cleaning</span>
                </button>
              )}
              {onBookUnit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookUnit(currentUnit);
                  }}
                >
                  <Calendar size={16} />
                  <span>Book {currentUnit.code}</span>
                </button>
              )}
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

// Dedicated Stay Extension Modal
function StayExtensionModal({ unit, reservation, property, onClose, onExtended }) {
  const currentDep = reservation?.departure ? new Date(reservation.departure) : new Date();

  const formatForInput = (d) => {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultNext = new Date(currentDep.getTime() + 86400000);
  const [newDeparture, setNewDeparture] = useState(formatForInput(defaultNext));
  const [notes, setNotes] = useState('Guest requested stay extension');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addedNights = useMemo(() => {
    try {
      const cur = currentDep.getTime();
      const nxt = new Date(newDeparture).getTime();
      return Math.max(0, Math.ceil((nxt - cur) / 86400000));
    } catch {
      return 1;
    }
  }, [currentDep, newDeparture]);

  if (!reservation) return null;

  const nightlyRate = Number(unit?.nightly_rate) || 3500;
  const addedCharge = addedNights * nightlyRate;

  const addDays = (numDays) => {
    const d = new Date(currentDep.getTime() + numDays * 86400000);
    d.setHours(11, 0, 0, 0);
    setNewDeparture(formatForInput(d));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiCall(`/reservations/${reservation.id}/extend`, 'POST', {
        departure: newDeparture,
        notes
      });
      onExtended && onExtended();
    } catch (err) {
      setError(err.message || 'Failed to extend stay');
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal extension-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <header>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>APARTMENT STAY EXTENSION</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span>Extension · {unit?.code || reservation.unit_code}</span>
            </h2>
          </div>
          <button className="icon" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ background: '#f5f7f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Current Guest:</span>
              <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{reservation.guest_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Booking Reference:</span>
              <span style={{ fontWeight: 600, color: '#193751' }}>{reservation.reference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Scheduled Departure:</span>
              <span style={{ fontWeight: 600, color: '#b91c1c' }}>{formatDateTime(reservation.departure)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Nightly Rate:</span>
              <span style={{ fontWeight: 600 }}>{formatMoney(nightlyRate, property?.currency)} / night</span>
            </div>
          </div>

          {error && (
            <div className="login-error-alert" style={{ marginBottom: 16 }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Quick Extension Presets:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[1, 2, 3, 5, 7].map(days => (
                <button
                  key={days}
                  type="button"
                  className={`small ${addedNights === days ? '' : 'secondary'}`}
                  onClick={() => addDays(days)}
                  style={{ borderRadius: 6, padding: '6px 12px' }}
                >
                  +{days} Night{days > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <label className="field" style={{ marginBottom: 18 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>New Extended Departure Date &amp; Time</span>
            <input
              type="datetime-local"
              required
              value={newDeparture}
              onChange={e => setNewDeparture(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
            />
          </label>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Extension Duration:</span>
              <strong style={{ fontSize: 14, color: '#166534' }}>{addedNights} additional night{addedNights > 1 ? 's' : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#166534' }}>Additional Stay Charge:</span>
              <strong style={{ fontSize: 16, color: '#15803d' }}>+{formatMoney(addedCharge, property?.currency)}</strong>
            </div>
            <small style={{ color: '#15803d', display: 'block', marginTop: 4, fontSize: 11 }}>
              * Automatically posted to guest's stay account.
            </small>
          </div>

          <label className="field" style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Extension Reason / Notes</span>
            <input
              type="text"
              placeholder="e.g. Guest requested extended business stay"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || addedNights <= 0} style={{ background: '#0052cc', color: '#fff' }}>
              {submitting ? 'Confirming…' : 'Confirm Extension'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

// ==============================================================================
// 9. MANAGEMENT VIEW (HR & EMPLOYEES, EXPENSES, UTILITIES)
// ==============================================================================

function computeDuration(hireDateStr, contractEndStr) {
  if (!hireDateStr) return '—';
  try {
    const hire = new Date(hireDateStr);
    const end = contractEndStr ? new Date(contractEndStr) : new Date();
    const diffMonths = (end.getFullYear() - hire.getFullYear()) * 12 + (end.getMonth() - hire.getMonth());
    if (diffMonths < 1) {
      const diffDays = Math.max(1, Math.floor((end - hire) / 86400000));
      return `${diffDays} days`;
    }
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} mo${months > 1 ? 's' : ''}`;
    if (months === 0) return `${years} yr${years > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''}, ${months} mo${months > 1 ? 's' : ''}`;
  } catch {
    return hireDateStr;
  }
}

function ManagementView({
  data,
  property,
  subTab,
  setSubTab,
  isAdmin = false,
  onAddEmployee,
  onEditEmployee,
  onViewEmployee,
  onDeleteEmployee,
  onAddExpense,
  onDeleteExpense,
  onAddUtility,
  onPayUtility,
  onDeleteUtility
}) {
  const employees = data?.employees || [];
  const expenses = data?.expenses || [];
  const utilities = data?.utilities || [];

  // HR Filters
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('');
  const [empPage, setEmpPage] = useState(1);

  // Expenses Filters
  const [expSearch, setExpSearch] = useState('');
  const [expCatFilter, setExpCatFilter] = useState('');
  const [expPage, setExpPage] = useState(1);

  // Utilities Filters
  const [utilTypeFilter, setUtilTypeFilter] = useState('');
  const [utilStatusFilter, setUtilStatusFilter] = useState('');
  const [utilPage, setUtilPage] = useState(1);

  // Computed HR Stats (Memoized for high-volume 15,000+ records)
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  const monthlyPayroll = useMemo(() => employees.reduce(
    (sum, e) => sum + (Number(e.base_salary) || 0) + (Number(e.allowance) || 0),
    0
  ), [employees]);
  const departmentsCount = useMemo(() => new Set(employees.map(e => e.department).filter(Boolean)).size, [employees]);

  // Computed Expenses Stats
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);

  // Computed Utilities Stats
  const pendingUtilities = useMemo(() => utilities.filter(u => u.status !== 'paid'), [utilities]);
  const pendingUtilitiesTotal = useMemo(() => pendingUtilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0), [pendingUtilities]);
  const totalUtilitiesCost = useMemo(() => utilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0), [utilities]);

  // Filtered Lists (Memoized for high-volume 15,000+ records)
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (empDeptFilter && e.department !== empDeptFilter) return false;
      if (empTypeFilter && e.employment_type !== empTypeFilter) return false;
      if (!empSearch) return true;
      const q = empSearch.toLowerCase();
      return (
        (e.full_name || '').toLowerCase().includes(q) ||
        (e.position || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(q) ||
        (e.fayda_id || '').toLowerCase().includes(q)
      );
    });
  }, [employees, empDeptFilter, empTypeFilter, empSearch]);

  const filteredExpenses = expenses.filter(e => {
    if (expCatFilter && e.category !== expCatFilter) return false;
    if (!expSearch) return true;
    const q = expSearch.toLowerCase();
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.payee || '').toLowerCase().includes(q) ||
      (e.reference_no || '').toLowerCase().includes(q)
    );
  });

  const filteredUtilities = utilities.filter(u => {
    if (utilTypeFilter && u.utility_type !== utilTypeFilter) return false;
    if (utilStatusFilter && u.status !== utilStatusFilter) return false;
    return true;
  });

  useEffect(() => {
    setEmpPage(1);
  }, [empSearch, empDeptFilter, empTypeFilter]);

  useEffect(() => {
    setExpPage(1);
  }, [expSearch, expCatFilter]);

  useEffect(() => {
    setUtilPage(1);
  }, [utilTypeFilter, utilStatusFilter]);

  const pagedEmployees = filteredEmployees.slice((empPage - 1) * 15, empPage * 15);
  const pagedExpenses = filteredExpenses.slice((expPage - 1) * 15, expPage * 15);
  const pagedUtilities = filteredUtilities.slice((utilPage - 1) * 15, utilPage * 15);

  return (
    <div>
      {/* Top Heading */}
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA OPERATIONS &amp; MANAGEMENT</p>
          <h1>Property Management</h1>
          <p className="muted">Human resources, operational expenses, and utility billing.</p>
        </div>
        {subTab === 'employees' && (
          <button onClick={onAddEmployee}>
            <UserPlus size={16} />
            <span>Add employee</span>
          </button>
        )}
        {subTab === 'expenses' && (
          <button onClick={onAddExpense}>
            <Receipt size={16} />
            <span>Record expense</span>
          </button>
        )}
        {subTab === 'utilities' && (
          <button onClick={onAddUtility}>
            <Zap size={16} />
            <span>Log utility bill</span>
          </button>
        )}
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="finance-tabs" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`secondary ${subTab === 'employees' ? 'active-mgmt-tab' : ''}`}
          onClick={() => setSubTab('employees')}
          style={subTab === 'employees' ? { background: '#203449', color: '#fff', borderColor: '#203449' } : {}}
        >
          <Users size={16} />
          <span>Human Resources ({employees.length})</span>
        </button>
        <button
          type="button"
          className={`secondary ${subTab === 'expenses' ? 'active-mgmt-tab' : ''}`}
          onClick={() => setSubTab('expenses')}
          style={subTab === 'expenses' ? { background: '#203449', color: '#fff', borderColor: '#203449' } : {}}
        >
          <Receipt size={16} />
          <span>Operating Expenses ({expenses.length})</span>
        </button>
        <button
          type="button"
          className={`secondary ${subTab === 'utilities' ? 'active-mgmt-tab' : ''}`}
          onClick={() => setSubTab('utilities')}
          style={subTab === 'utilities' ? { background: '#203449', color: '#fff', borderColor: '#203449' } : {}}
        >
          <Zap size={16} />
          <span>Utilities &amp; Meter Readings ({utilities.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. HUMAN RESOURCES / EMPLOYEES */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'employees' && (
        <div>
          {/* HR Stat Cards */}
          <div className="stats">
            <div className="stat">
              <span>Total Staff</span>
              <strong>{employees.length}</strong>
              <small>{activeEmployees.length} currently active</small>
            </div>
            <div className="stat">
              <span>Monthly Payroll</span>
              <strong>{formatMoney(monthlyPayroll, property.currency)}</strong>
              <small>Base salaries + allowances</small>
            </div>
            <div className="stat">
              <span>Employment Types</span>
              <strong>
                {employees.filter(e => e.employment_type === 'Full-Time').length} Full
              </strong>
              <small>
                {employees.filter(e => e.employment_type === 'Contract').length} Contract ·{' '}
                {employees.filter(e => e.employment_type === 'Probation').length} Probation
              </small>
            </div>
            <div className="stat">
              <span>Departments</span>
              <strong>{departmentsCount || 1}</strong>
              <small>Front desk, housekeeping, operations</small>
            </div>
          </div>

          {/* Roster Panel */}
          <section className="panel space">
            <div className="panelheading" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="search" style={{ flex: 1, minWidth: 240 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, position, phone, or Fayda ID…"
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select
                  value={empDeptFilter}
                  onChange={e => setEmpDeptFilter(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">All Departments</option>
                  <option value="Reception">Reception / Front Desk</option>
                  <option value="Housekeeping">Housekeeping &amp; Laundry</option>
                  <option value="Maintenance">Maintenance &amp; Engineering</option>
                  <option value="Administration">Administration &amp; HR</option>
                  <option value="Management">Management</option>
                  <option value="Finance">Finance &amp; Cashier</option>
                  <option value="Security">Security</option>
                  <option value="Kitchen">Kitchen &amp; Breakfast</option>
                </select>

                <select
                  value={empTypeFilter}
                  onChange={e => setEmpTypeFilter(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">All Employment Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Position &amp; Department</th>
                    <th>Type &amp; Duration</th>
                    <th>Birth Date</th>
                    <th>Fayda / ID</th>
                    <th>Salary (ETB)</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.full_name}</strong>
                        {emp.emergency_contact && (
                          <small style={{ display: 'block', color: '#687784' }}>
                            ICE: {emp.emergency_contact}
                          </small>
                        )}
                      </td>
                      <td>
                        <span>{emp.position}</span>
                        <small style={{ display: 'block', color: '#687784' }}>
                          {emp.department}
                        </small>
                      </td>
                      <td>
                        <span className="badge ready" style={{ fontSize: 10 }}>
                          {emp.employment_type}
                        </span>
                        <small style={{ display: 'block', color: '#687784', marginTop: 4 }}>
                          {computeDuration(emp.hire_date, emp.contract_end_date)}
                        </small>
                      </td>
                      <td>
                        <span>{formatDate(emp.birth_date)}</span>
                      </td>
                      <td>
                        {emp.fayda_id ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {emp.fayda_id}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <strong>{formatMoney(emp.base_salary, property.currency)}</strong>
                        {Number(emp.allowance) > 0 && (
                          <small style={{ display: 'block', color: '#2d6a4f' }}>
                            +{formatMoney(emp.allowance, property.currency)} allow.
                          </small>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{emp.phone}</div>
                        {emp.email && (
                          <small style={{ display: 'block', color: '#687784' }}>
                            {emp.email}
                          </small>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${emp.status === 'active'
                            ? 'ready'
                            : emp.status === 'on_leave'
                              ? 'cleaning'
                              : 'dirty'
                            }`}
                        >
                          {emp.status === 'active'
                            ? 'Active'
                            : emp.status === 'on_leave'
                              ? 'On Leave'
                              : 'Terminated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="secondary small"
                            onClick={() => onViewEmployee(emp)}
                            title="View Full Personnel Profile"
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            className="secondary small"
                            onClick={() => onEditEmployee(emp)}
                            title="Edit Employee"
                          >
                            <Edit3 size={13} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="secondary small"
                              onClick={() => onDeleteEmployee(emp.id)}
                              title="Delete Employee Record (Admin only)"
                              style={{ color: '#b91c1c' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Users size={32} style={{ color: '#94a3b8', marginBottom: 10 }} />
                        <p className="muted" style={{ margin: 0 }}>
                          {employees.length === 0
                            ? 'No employees recorded yet. Click "+ Add employee" to register your staff roster.'
                            : 'No employees matched the selected filters.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredEmployees.length}
              pageSize={15}
              currentPage={empPage}
              onPageChange={setEmpPage}
              itemName="employees"
            />
          </section>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. OPERATING EXPENSES */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'expenses' && (
        <div>
          {/* Expenses Stats */}
          <div className="stats">
            <div className="stat">
              <span>Total Recorded Expenses</span>
              <strong>{formatMoney(totalExpenses, property.currency)}</strong>
              <small>{expenses.length} operating transactions</small>
            </div>
            <div className="stat">
              <span>Top Category</span>
              <strong>
                {expenses.length > 0 ? expenses[0].category : 'Supplies'}
              </strong>
              <small>Operating expenditures</small>
            </div>
            <div className="stat">
              <span>Payment Methods</span>
              <strong>
                {expenses.filter(e => e.payment_method === 'Telebirr').length} Telebirr
              </strong>
              <small>
                {expenses.filter(e => e.payment_method === 'Cash').length} Cash ·{' '}
                {expenses.filter(e => e.payment_method === 'CBE Bank Transfer').length} Bank
              </small>
            </div>
            <div className="stat">
              <span>Expense Control</span>
              <strong style={{ color: '#2d6a4f' }}>Active</strong>
              <small>All outlays logged with receipts</small>
            </div>
          </div>

          {/* Expenses Panel */}
          <section className="panel space">
            <div className="panelheading" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="search" style={{ flex: 1, minWidth: 240 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search expense description, vendor, or voucher number…"
                  value={expSearch}
                  onChange={e => setExpSearch(e.target.value)}
                />
              </div>

              <select
                value={expCatFilter}
                onChange={e => setExpCatFilter(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                <option value="">All Categories</option>
                <option value="Housekeeping Supplies">Housekeeping Supplies</option>
                <option value="Maintenance & Repairs">Maintenance &amp; Repairs</option>
                <option value="Generator Fuel">Generator Diesel / Fuel</option>
                <option value="Linen & Textiles">Linen &amp; Textiles</option>
                <option value="Staff Meals & Welfare">Staff Meals &amp; Welfare</option>
                <option value="Office & Administration">Office &amp; Administration</option>
                <option value="Property Insurance & Licenses">Property Insurance &amp; Licenses</option>
                <option value="Marketing & OTA Fees">Marketing &amp; OTA Fees</option>
                <option value="Other">Other Operational</option>
              </select>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Description</th>
                    <th>Category</th>
                    <th>Payee / Vendor</th>
                    <th>Payment Method</th>
                    <th>Reference / Voucher #</th>
                    <th>Amount (ETB)</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>
                        <strong>{formatDate(exp.expense_date)}</strong>
                      </td>
                      <td>
                        <strong>{exp.title}</strong>
                        {exp.notes && (
                          <small style={{ display: 'block', color: '#687784' }}>
                            {exp.notes}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge cleaning">{exp.category}</span>
                      </td>
                      <td>{exp.payee || '—'}</td>
                      <td>
                        <span className="badge ready">{exp.payment_method}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {exp.reference_no || '—'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#b91c1c' }}>
                          -{formatMoney(exp.amount, property.currency)}
                        </strong>
                      </td>
                      <td>
                        <small>{exp.recorded_by}</small>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isAdmin && (
                          <button
                            type="button"
                            className="secondary small"
                            onClick={() => onDeleteExpense(exp.id)}
                            title="Delete Expense Entry (Admin only)"
                            style={{ color: '#b91c1c' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Receipt size={32} style={{ color: '#94a3b8', marginBottom: 10 }} />
                        <p className="muted" style={{ margin: 0 }}>
                          {expenses.length === 0
                            ? 'No operational expenses recorded yet. Click "+ Record expense" to log purchase receipts.'
                            : 'No expense records matched the current search.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredExpenses.length}
              pageSize={15}
              currentPage={expPage}
              onPageChange={setExpPage}
              itemName="expenses"
            />
          </section>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. UTILITIES MANAGEMENT */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'utilities' && (
        <div>
          {/* Overdue/Pending Alert Banner */}
          {pendingUtilities.length > 0 && (
            <div
              className="status-alert"
              style={{
                marginBottom: 20,
                padding: '14px 18px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} />
                <span>
                  <strong>{pendingUtilities.length} utility bill(s) pending payment</strong> (Total{' '}
                  {formatMoney(pendingUtilitiesTotal, property.currency)}).
                </span>
              </div>
              <small style={{ color: '#9a3412', fontWeight: 600 }}>
                Due soon to prevent utility service disruption
              </small>
            </div>
          )}

          {/* Utilities Stats */}
          <div className="stats">
            <div className="stat">
              <span>Total Utilities Tracked</span>
              <strong>{formatMoney(totalUtilitiesCost, property.currency)}</strong>
              <small>{utilities.length} recorded bills</small>
            </div>
            <div className="stat">
              <span>Pending Due Amount</span>
              <strong style={{ color: pendingUtilitiesTotal > 0 ? '#b91c1c' : '#2d6a4f' }}>
                {formatMoney(pendingUtilitiesTotal, property.currency)}
              </strong>
              <small>{pendingUtilities.length} unpaid bill(s)</small>
            </div>
            <div className="stat">
              <span>Electricity (EEU)</span>
              <strong>
                {
                  utilities.filter(u => u.utility_type === 'Electricity' && u.status === 'paid')
                    .length
                }{' '}
                Paid
              </strong>
              <small>Grid power &amp; consumption meters</small>
            </div>
            <div className="stat">
              <span>Water (AAWSA) &amp; Fuel</span>
              <strong>
                {
                  utilities.filter(u => (u.utility_type === 'Water' || u.utility_type === 'Generator Diesel') && u.status === 'paid')
                    .length
                }{' '}
                Paid
              </strong>
              <small>Mains water &amp; generator diesel</small>
            </div>
          </div>

          {/* Utilities Panel */}
          <section className="panel space">
            <div className="panelheading" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select
                  value={utilTypeFilter}
                  onChange={e => setUtilTypeFilter(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">All Utility Types</option>
                  <option value="Electricity">Electricity (EEU)</option>
                  <option value="Water">Water (AAWSA)</option>
                  <option value="Internet / Telecom">Internet / Telecom (Ethio Telecom)</option>
                  <option value="Generator Diesel">Generator Diesel / Fuel</option>
                  <option value="Gas & Waste">Gas &amp; Waste Management</option>
                </select>

                <select
                  value={utilStatusFilter}
                  onChange={e => setUtilStatusFilter(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Utility Service</th>
                    <th>Provider</th>
                    <th>Billing Period</th>
                    <th>Meter Readings</th>
                    <th>Consumption Units</th>
                    <th>Due Date</th>
                    <th>Bill Amount (ETB)</th>
                    <th>Status</th>
                    <th>Payment Details</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUtilities.map(util => (
                    <tr key={util.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {util.utility_type === 'Electricity' && <Zap size={16} style={{ color: '#d97706' }} />}
                          {util.utility_type === 'Water' && <Droplets size={16} style={{ color: '#0284c7' }} />}
                          {util.utility_type === 'Generator Diesel' && <Flame size={16} style={{ color: '#ea580c' }} />}
                          {(util.utility_type === 'Internet / Telecom' || util.utility_type === 'Gas & Waste') && <Briefcase size={16} style={{ color: '#4b5563' }} />}
                          <strong>{util.utility_type}</strong>
                        </div>
                      </td>
                      <td>{util.provider}</td>
                      <td>
                        <strong>{util.billing_period}</strong>
                        {util.reference_no && (
                          <small style={{ display: 'block', color: '#687784', fontFamily: 'monospace' }}>
                            Ref: {util.reference_no}
                          </small>
                        )}
                      </td>
                      <td>
                        {util.meter_reading_curr !== null && util.meter_reading_prev !== null ? (
                          <div style={{ fontSize: 12 }}>
                            {util.meter_reading_prev} &rarr; {util.meter_reading_curr}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {util.consumption_units !== null ? (
                          <strong>{util.consumption_units} units</strong>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span>{formatDate(util.due_date)}</span>
                      </td>
                      <td>
                        <strong>{formatMoney(util.amount, property.currency)}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${util.status === 'paid'
                            ? 'ready'
                            : util.status === 'overdue'
                              ? 'dirty'
                              : 'cleaning'
                            }`}
                        >
                          {util.status}
                        </span>
                      </td>
                      <td>
                        {util.status === 'paid' ? (
                          <div>
                            <span style={{ fontSize: 12, color: '#2d6a4f' }}>
                              Paid {formatDate(util.payment_date)}
                            </span>
                            {util.payment_method && (
                              <small style={{ display: 'block', color: '#687784' }}>
                                via {util.payment_method}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="muted">Unpaid</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {util.status !== 'paid' && (
                            <button
                              type="button"
                              className="secondary small"
                              onClick={() => onPayUtility(util)}
                              style={{ background: '#2d6a4f', color: '#fff', borderColor: '#2d6a4f' }}
                            >
                              Mark Paid
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className="secondary small"
                              onClick={() => onDeleteUtility(util.id)}
                              title="Delete Utility Bill (Admin only)"
                              style={{ color: '#b91c1c' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUtilities.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Zap size={32} style={{ color: '#94a3b8', marginBottom: 10 }} />
                        <p className="muted" style={{ margin: 0 }}>
                          {utilities.length === 0
                            ? 'No utility records logged yet. Click "+ Log utility bill" to track electricity, water, and fuel bills.'
                            : 'No utility records matched the current filters.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredUtilities.length}
              pageSize={15}
              currentPage={utilPage}
              onPageChange={setUtilPage}
              itemName="utility bills"
            />
          </section>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 10. MANAGEMENT MODALS (EMPLOYEE PROFILE, ADD/EDIT EMPLOYEE, EXPENSE, UTILITY)
// ==============================================================================

function EmployeeProfileModal({ employee, currency, onClose, onEdit }) {
  if (!employee) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>SOLTA PERSONNEL DOSSIER</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span>{employee.full_name}</span>
              <span
                className={`badge ${employee.status === 'active'
                  ? 'ready'
                  : employee.status === 'on_leave'
                    ? 'cleaning'
                    : 'dirty'
                  }`}
              >
                {employee.status}
              </span>
            </h2>
          </div>
          <button className="icon" onClick={onClose} aria-label="Close profile">
            <X size={20} />
          </button>
        </header>

        <div className="room-details-columns" style={{ marginBottom: 20 }}>
          {/* Column 1: Role & Employment */}
          <div className="room-col">
            <div className="room-section-card">
              <h3>Role &amp; Contract</h3>
              <ul className="spec-list">
                <li>
                  <strong>Position / Title:</strong>
                  <span>{employee.position}</span>
                </li>
                <li>
                  <strong>Department:</strong>
                  <span>{employee.department}</span>
                </li>
                <li>
                  <strong>Employment Type:</strong>
                  <span>{employee.employment_type}</span>
                </li>
                <li>
                  <strong>Hire Date:</strong>
                  <span>{formatDate(employee.hire_date)}</span>
                </li>
                <li>
                  <strong>Tenure / Duration:</strong>
                  <strong>{computeDuration(employee.hire_date, employee.contract_end_date)}</strong>
                </li>
                {employee.contract_end_date && (
                  <li>
                    <strong>Contract End:</strong>
                    <span>{formatDate(employee.contract_end_date)}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="room-section-card" style={{ marginTop: 16 }}>
              <h3>Compensation</h3>
              <ul className="spec-list">
                <li>
                  <strong>Base Monthly:</strong>
                  <strong>{formatMoney(employee.base_salary, currency)}</strong>
                </li>
                <li>
                  <strong>Allowance:</strong>
                  <span>{formatMoney(employee.allowance || 0, currency)}</span>
                </li>
                <li>
                  <strong>Total Payroll Cost:</strong>
                  <strong style={{ color: '#2d6a4f' }}>
                    {formatMoney(
                      (Number(employee.base_salary) || 0) + (Number(employee.allowance) || 0),
                      currency
                    )}
                  </strong>
                </li>
                <li>
                  <strong>Disbursement:</strong>
                  <span>
                    {employee.bank_name ? `${employee.bank_name} · ${employee.account_number || ''}` : 'Cash / In-person'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Personal, ID, Contact */}
          <div className="room-col">
            <div className="room-section-card">
              <h3>Personal &amp; Identity</h3>
              <ul className="spec-list">
                <li>
                  <strong>Birth Date:</strong>
                  <span>{formatDate(employee.birth_date)}</span>
                </li>
                <li>
                  <strong>Fayda / National ID:</strong>
                  <span>
                    {employee.fayda_id ? (
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{employee.fayda_id}</span>
                    ) : (
                      <span className="muted">Not Provided (Optional)</span>
                    )}
                  </span>
                </li>
                <li>
                  <strong>Primary Phone:</strong>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} />
                    <span>{employee.phone}</span>
                  </strong>
                </li>
                <li>
                  <strong>Email Address:</strong>
                  <span>{employee.email || '—'}</span>
                </li>
                <li>
                  <strong>Emergency Contact:</strong>
                  <span>{employee.emergency_contact || '—'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" onClick={onEdit}>
            <Edit3 size={16} />
            <span>Edit employee profile</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function EmployeeFormModal({ mode, initial = {}, currency, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: initial?.full_name || '',
    position: initial?.position || '',
    department: initial?.department || 'Reception',
    employment_type: initial?.employment_type || 'Full-Time',
    birth_date: initial?.birth_date || '',
    fayda_id: initial?.fayda_id || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    hire_date: initial?.hire_date || new Date().toISOString().split('T')[0],
    contract_end_date: initial?.contract_end_date || '',
    base_salary: initial?.base_salary !== undefined ? initial.base_salary : 15000,
    allowance: initial?.allowance !== undefined ? initial.allowance : 0,
    bank_name: initial?.bank_name || 'Commercial Bank of Ethiopia (CBE)',
    account_number: initial?.account_number || '',
    emergency_contact: initial?.emergency_contact || '',
    status: initial?.status || 'active'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        ...formData
      });
    } catch (err) {
      setError(err.message || 'Failed to save employee profile');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" style={{ width: 760 }} onClick={e => e.stopPropagation()}>
        <header>
          <h2>{mode === 'edit' ? `Edit Employee · ${initial.full_name}` : 'Add New Employee'}</h2>
          <button className="icon" onClick={onClose} aria-label="Close form">
            <X size={20} />
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="formgrid">
            <label className="field">
              <span>Full Legal Name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Samuel Mengistu"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Job Title / Position *</span>
              <input
                type="text"
                required
                placeholder="e.g. Front Desk Officer, Cleaner"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Department *</span>
              <select
                value={formData.department}
                required
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Reception">Reception / Front Desk</option>
                <option value="Housekeeping">Housekeeping &amp; Laundry</option>
                <option value="Maintenance">Maintenance &amp; Engineering</option>
                <option value="Administration">Administration &amp; HR</option>
                <option value="Management">Management</option>
                <option value="Finance">Finance &amp; Cashier</option>
                <option value="Security">Security</option>
                <option value="Kitchen">Kitchen &amp; Breakfast</option>
              </select>
            </label>

            <label className="field">
              <span>Employment Type *</span>
              <select
                value={formData.employment_type}
                required
                onChange={e => setFormData({ ...formData, employment_type: e.target.value })}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
              </select>
            </label>

            <label className="field">
              <span>Birth Date</span>
              <input
                type="date"
                value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>National ID / Fayda Number (Optional - Not Mandatory)</span>
              <input
                type="text"
                placeholder="Optional ID / Fayda number"
                value={formData.fayda_id}
                onChange={e => setFormData({ ...formData, fayda_id: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Phone Number *</span>
              <input
                type="tel"
                required
                placeholder="+251 91 123 4567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="employee@solta.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Employment Hire Date *</span>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Contract End Date (if fixed-term)</span>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={e => setFormData({ ...formData, contract_end_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Base Monthly Salary (ETB) *</span>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.base_salary}
                onChange={e => setFormData({ ...formData, base_salary: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <span>Monthly Allowance (ETB)</span>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.allowance}
                onChange={e => setFormData({ ...formData, allowance: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <span>Bank / Payment Rail</span>
              <select
                value={formData.bank_name}
                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
              >
                <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                <option value="Telebirr">Telebirr Wallet</option>
                <option value="Awash Bank">Awash Bank</option>
                <option value="Dashen Bank">Dashen Bank</option>
                <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                <option value="Cash Disbursement">Cash Disbursement</option>
              </select>
            </label>

            <label className="field">
              <span>Account / Phone Number for Payroll</span>
              <input
                type="text"
                placeholder="Bank account or Telebirr phone"
                value={formData.account_number}
                onChange={e => setFormData({ ...formData, account_number: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Emergency Contact (Name &amp; Phone)</span>
              <input
                type="text"
                placeholder="e.g. Almaz (Sister): +251 92 345 6789"
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Employment Status</span>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active Staff Member</option>
                <option value="on_leave">On Authorized Leave</option>
                <option value="terminated">Terminated / Left</option>
              </select>
            </label>
          </div>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving profile…' : mode === 'edit' ? 'Update Employee' : 'Save Employee'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ExpenseFormModal({ currency, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Housekeeping Supplies',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    payee: '',
    reference_no: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please provide a valid expense amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        amount: Number(formData.amount)
      });
    } catch (err) {
      setError(err.message || 'Failed to record expense');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <header>
          <h2>Record Operational Expense</h2>
          <button className="icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="formgrid">
            <label className="field" style={{ gridColumn: 'span 2' }}>
              <span>Expense Title / Item Description *</span>
              <input
                type="text"
                required
                placeholder="e.g. Bulk laundry detergent & bleach purchase"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Category *</span>
              <select
                value={formData.category}
                required
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Housekeeping Supplies">Housekeeping Supplies</option>
                <option value="Maintenance & Repairs">Maintenance &amp; Repairs</option>
                <option value="Generator Fuel">Generator Diesel / Fuel</option>
                <option value="Linen & Textiles">Linen &amp; Textiles</option>
                <option value="Staff Meals & Welfare">Staff Meals &amp; Welfare</option>
                <option value="Office & Administration">Office &amp; Administration</option>
                <option value="Property Insurance & Licenses">Property Insurance &amp; Licenses</option>
                <option value="Marketing & OTA Fees">Marketing &amp; OTA Fees</option>
                <option value="Other">Other Operational</option>
              </select>
            </label>

            <label className="field">
              <span>Amount (ETB) *</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Expense Date *</span>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Payment Method</span>
              <select
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Telebirr">Telebirr</option>
                <option value="CBE Bank Transfer">CBE Bank Transfer</option>
                <option value="Check">Check</option>
              </select>
            </label>

            <label className="field">
              <span>Payee / Vendor Name</span>
              <input
                type="text"
                placeholder="e.g. Merkato Wholesale Chemical Store"
                value={formData.payee}
                onChange={e => setFormData({ ...formData, payee: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Voucher / Receipt Reference #</span>
              <input
                type="text"
                placeholder="e.g. REC-8821"
                value={formData.reference_no}
                onChange={e => setFormData({ ...formData, reference_no: e.target.value })}
              />
            </label>

            <label className="field" style={{ gridColumn: 'span 2' }}>
              <span>Additional Notes</span>
              <input
                type="text"
                placeholder="Optional purpose, batch, or invoice details"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </label>
          </div>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Recording…' : 'Save Expense'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function UtilityFormModal({ currency, onClose, onSave }) {
  const [formData, setFormData] = useState({
    utility_type: 'Electricity',
    provider: 'Ethiopian Electric Utility (EEU)',
    billing_period: 'Current Month',
    meter_reading_prev: '',
    meter_reading_curr: '',
    consumption_units: '',
    amount: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    reference_no: '',
    status: 'pending',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const providerDefaults = {
    Electricity: 'Ethiopian Electric Utility (EEU)',
    Water: 'Addis Ababa Water & Sewerage Authority (AAWSA)',
    'Internet / Telecom': 'Ethio Telecom Enterprise Fiber',
    'Generator Diesel': 'TotalEnergies / NOC Fuel Station',
    'Gas & Waste': 'City Sanitation & Gas Service'
  };

  function handleTypeChange(val) {
    setFormData({
      ...formData,
      utility_type: val,
      provider: providerDefaults[val] || ''
    });
  }

  // Auto calculate units if previous and current readings provided
  useEffect(() => {
    const prev = Number(formData.meter_reading_prev);
    const curr = Number(formData.meter_reading_curr);
    if (formData.meter_reading_prev !== '' && formData.meter_reading_curr !== '' && curr >= prev) {
      setFormData(prevData => ({ ...prevData, consumption_units: String(curr - prev) }));
    }
  }, [formData.meter_reading_prev, formData.meter_reading_curr]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please provide a valid bill amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        amount: Number(formData.amount),
        meter_reading_prev: formData.meter_reading_prev ? Number(formData.meter_reading_prev) : null,
        meter_reading_curr: formData.meter_reading_curr ? Number(formData.meter_reading_curr) : null,
        consumption_units: formData.consumption_units ? Number(formData.consumption_units) : null
      });
    } catch (err) {
      setError(err.message || 'Failed to save utility record');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" style={{ width: 680 }} onClick={e => e.stopPropagation()}>
        <header>
          <h2>Log Utility Bill &amp; Meter Reading</h2>
          <button className="icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="formgrid">
            <label className="field">
              <span>Utility Service Type *</span>
              <select
                value={formData.utility_type}
                required
                onChange={e => handleTypeChange(e.target.value)}
              >
                <option value="Electricity">Electricity (Grid Power)</option>
                <option value="Water">Water &amp; Sewerage</option>
                <option value="Internet / Telecom">Internet &amp; Dedicated Fiber</option>
                <option value="Generator Diesel">Generator Diesel / Fuel Refill</option>
                <option value="Gas & Waste">Gas &amp; Waste Management</option>
              </select>
            </label>

            <label className="field">
              <span>Provider / Utility Authority *</span>
              <input
                type="text"
                required
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Billing Period (Month &amp; Year) *</span>
              <input
                type="text"
                required
                placeholder="e.g. Nov 2026 or Meskerem 2019"
                value={formData.billing_period}
                onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Total Bill Amount (ETB) *</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Previous Meter Reading</span>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 10420.5"
                value={formData.meter_reading_prev}
                onChange={e => setFormData({ ...formData, meter_reading_prev: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Current Meter Reading</span>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 11250.0"
                value={formData.meter_reading_curr}
                onChange={e => setFormData({ ...formData, meter_reading_curr: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Consumption Units (kWh / m³ / Liters)</span>
              <input
                type="number"
                step="0.01"
                placeholder="Units consumed"
                value={formData.consumption_units}
                onChange={e => setFormData({ ...formData, consumption_units: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Payment Due Date *</span>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Invoice / Customer Contract #</span>
              <input
                type="text"
                placeholder="e.g. EEU-ACC-091244"
                value={formData.reference_no}
                onChange={e => setFormData({ ...formData, reference_no: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Initial Status</span>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending Payment</option>
                <option value="paid">Already Paid</option>
              </select>
            </label>
          </div>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Logging bill…' : 'Save Utility Record'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function PayUtilityModal({ utility, currency, onClose, onPay }) {
  const [paymentMethod, setPaymentMethod] = useState('Telebirr');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function handleConfirm(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onPay({
        payment_method: paymentMethod,
        payment_date: paymentDate
      });
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <header>
          <h2>Mark Utility as Paid</h2>
          <button className="icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        <div style={{ marginBottom: 18 }}>
          <p className="muted" style={{ margin: '0 0 6px' }}>
            Settling bill for:
          </p>
          <strong style={{ fontSize: 16 }}>
            {utility.utility_type} ({utility.provider}) · {utility.billing_period}
          </strong>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2d6a4f', marginTop: 10 }}>
            {formatMoney(utility.amount, currency)}
          </div>
        </div>

        <form onSubmit={handleConfirm}>
          <label className="field" style={{ marginBottom: 16 }}>
            <span>Settlement Payment Method</span>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="Telebirr">Telebirr Merchant / Wallet</option>
              <option value="CBE Bank Transfer">CBE Bank Transfer</option>
              <option value="Cash">Cash at Authority Office</option>
              <option value="Awash Bank">Awash Bank</option>
            </select>
          </label>

          <label className="field" style={{ marginBottom: 20 }}>
            <span>Payment Date</span>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
            />
          </label>

          <footer>
            <button type="button" className="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ background: '#2d6a4f' }}>
              {saving ? 'Processing…' : 'Confirm Paid'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}



// ============================================================================
// REPORTS & STRATEGIC DECISION-MAKING VIEW
// ============================================================================
function ReportsView({ data, property }) {
  const [periodPreset, setPeriodPreset] = useState('all'); // 'this_month', 'last_month', 'last_90', 'ytd', 'all', 'custom'
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-11-30');
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [subTab, setSubTab] = useState('matrix'); // 'matrix', 'maintenance', 'stays', 'pnl'
  const [searchQuery, setSearchQuery] = useState('');
  const [maintPage, setMaintPage] = useState(1);
  const [staysPage, setStaysPage] = useState(1);

  const currency = property?.currency || 'ETB';
  const units = data?.units || [];
  const reservations = data?.reservations || [];
  const maintenanceRecords = data?.maintenanceRecords || [];
  const accounts = data?.accounts || [];
  const expenses = data?.expenses || [];
  const utilities = data?.utilities || [];
  const employees = data?.staff || [];

  // Determine active date boundaries based on preset
  const { startDate, endDate, periodDays, periodLabel } = useMemo(() => {
    const today = new Date('2026-11-19T12:00:00Z');
    let start, end, label;

    if (periodPreset === 'this_month') {
      start = new Date('2026-11-01T00:00:00Z');
      end = new Date('2026-11-30T23:59:59Z');
      label = 'This Month (November 2026)';
    } else if (periodPreset === 'last_month') {
      start = new Date('2026-10-01T00:00:00Z');
      end = new Date('2026-10-31T23:59:59Z');
      label = 'Last Month (October 2026)';
    } else if (periodPreset === 'last_90') {
      start = new Date('2026-08-20T00:00:00Z');
      end = new Date('2026-11-19T23:59:59Z');
      label = 'Last 90 Days';
    } else if (periodPreset === 'ytd') {
      start = new Date('2026-01-01T00:00:00Z');
      end = new Date('2026-11-19T23:59:59Z');
      label = 'Year-to-Date (2026)';
    } else if (periodPreset === 'custom') {
      start = new Date(customStart + 'T00:00:00Z');
      end = new Date(customEnd + 'T23:59:59Z');
      label = `Custom (${customStart} to ${customEnd})`;
    } else {
      // 'all'
      start = new Date('2026-01-01T00:00:00Z');
      end = new Date('2026-12-31T23:59:59Z');
      label = 'All Operating History (2026)';
    }

    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return { startDate: start, endDate: end, periodDays: diffDays, periodLabel: label };
  }, [periodPreset, customStart, customEnd]);

  // Helper to parse duration hours from record
  function parseDowntimeHours(record) {
    if (record.actual_duration) {
      const str = record.actual_duration.toLowerCase();
      let hours = 0;
      const daysMatch = str.match(/(\d+)\s*day/);
      if (daysMatch) hours += parseInt(daysMatch[1], 10) * 24;
      const hoursMatch = str.match(/(\d+)\s*hour/);
      if (hoursMatch) hours += parseInt(hoursMatch[1], 10);
      const minsMatch = str.match(/(\d+)\s*min/);
      if (minsMatch) hours += Math.round(parseInt(minsMatch[1], 10) / 60 * 10) / 10;
      if (hours > 0) return hours;
    }
    if (record.start_date && record.resolved_date) {
      const diffMs = new Date(record.resolved_date) - new Date(record.start_date);
      if (diffMs > 0) return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    }
    if (record.duration_est) {
      const str = record.duration_est.toLowerCase();
      let hours = 0;
      const daysMatch = str.match(/(\d+)\s*day/);
      if (daysMatch) hours += parseInt(daysMatch[1], 10) * 24;
      const hoursMatch = str.match(/(\d+)\s*hour/);
      if (hoursMatch) hours += parseInt(hoursMatch[1], 10);
      if (hours > 0) return hours;
    }
    return 6.0;
  }

  // Filter reservations in period and selected unit
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      if (selectedUnitId !== 'all' && r.unit_id !== selectedUnitId) return false;
      const rIn = new Date(r.check_in + 'T00:00:00Z');
      const rOut = new Date(r.check_out + 'T23:59:59Z');
      const overlaps = rIn <= endDate && rOut >= startDate;
      if (!overlaps) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchGuest = (r.guest_name || '').toLowerCase().includes(q);
        const matchRef = (r.reference || '').toLowerCase().includes(q);
        const matchUnit = (r.unit_code || '').toLowerCase().includes(q);
        if (!matchGuest && !matchRef && !matchUnit) return false;
      }
      return true;
    });
  }, [reservations, selectedUnitId, startDate, endDate, searchQuery]);

  // Filter maintenance records in period and selected unit
  const filteredMaintenance = useMemo(() => {
    return maintenanceRecords.filter(m => {
      if (selectedUnitId !== 'all' && m.unit_id !== selectedUnitId) return false;
      const mDate = new Date(m.start_date || m.created_at || '2026-11-01');
      const inRange = mDate <= endDate && mDate >= startDate;
      if (!inRange && periodPreset !== 'all') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUnit = (m.unit_code || '').toLowerCase().includes(q);
        const matchIssue = (m.issue || '').toLowerCase().includes(q);
        const matchTech = (m.technician || '').toLowerCase().includes(q);
        if (!matchUnit && !matchIssue && !matchTech) return false;
      }
      return true;
    });
  }, [maintenanceRecords, selectedUnitId, startDate, endDate, searchQuery, periodPreset]);

  useEffect(() => {
    setMaintPage(1);
    setStaysPage(1);
  }, [periodPreset, customStart, customEnd, selectedUnitId, searchQuery]);

  const pagedMaintenance = filteredMaintenance.slice((maintPage - 1) * 15, maintPage * 15);
  const pagedReservations = filteredReservations.slice((staysPage - 1) * 15, staysPage * 15);

  // Filter expenses and utilities in period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const d = new Date(exp.expense_date + 'T00:00:00Z');
      return periodPreset === 'all' || (d >= startDate && d <= endDate);
    });
  }, [expenses, startDate, endDate, periodPreset]);

  const filteredUtilities = useMemo(() => {
    return utilities.filter(u => {
      const d = new Date(u.due_date + 'T00:00:00Z');
      return periodPreset === 'all' || (d >= startDate && d <= endDate);
    });
  }, [utilities, startDate, endDate, periodPreset]);

  // Targeted units (either single or all)
  const targetUnits = useMemo(() => {
    if (selectedUnitId === 'all') return units;
    return units.filter(u => u.id === selectedUnitId);
  }, [units, selectedUnitId]);

  // Top-level KPI Aggregations
  const kpis = useMemo(() => {
    const totalUnitsCount = targetUnits.length;
    let totalNightsSold = 0;
    let totalRoomRevenue = 0;

    filteredReservations.forEach(r => {
      const n = Number(r.nights) || 1;
      const rate = Number(r.nightly_rate) || 3500;
      totalNightsSold += n;
      totalRoomRevenue += (Number(r.total_amount) || (n * rate));
    });

    const totalAvailableNights = totalUnitsCount * periodDays;
    const occupancyRate = totalAvailableNights > 0
      ? Math.min(100, Math.round((totalNightsSold / totalAvailableNights) * 100))
      : 0;

    const adr = totalNightsSold > 0 ? Math.round(totalRoomRevenue / totalNightsSold) : 0;
    const revPar = totalAvailableNights > 0 ? Math.round(totalRoomRevenue / totalAvailableNights) : 0;

    // Maintenance Downtime & Cost
    let maintDowntimeHours = 0;
    let maintCost = 0;
    let lostRevenue = 0;

    filteredMaintenance.forEach(m => {
      const hrs = parseDowntimeHours(m);
      maintDowntimeHours += hrs;
      maintCost += Number(m.cost) || 0;
      const unit = units.find(u => u.id === m.unit_id);
      const unitRate = Number(unit?.base_price) || 3500;
      lostRevenue += (hrs / 24) * unitRate;
    });

    // Expenses Breakdown
    const operatingExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const utilitiesExpenses = filteredUtilities
      .filter(u => u.status === 'paid')
      .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
    const staffPayroll = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);

    const totalOutflow = operatingExpenses + utilitiesExpenses + maintCost + staffPayroll;
    const noi = totalRoomRevenue - totalOutflow;
    const margin = totalRoomRevenue > 0 ? Math.round((noi / totalRoomRevenue) * 100) : 0;

    return {
      staysCount: filteredReservations.length,
      nightsSold: totalNightsSold,
      availableNights: totalAvailableNights,
      occupancyRate,
      roomRevenue: totalRoomRevenue,
      adr,
      revPar,
      maintIncidents: filteredMaintenance.length,
      maintDowntimeHours: Math.round(maintDowntimeHours * 10) / 10,
      maintDowntimeDays: (maintDowntimeHours / 24).toFixed(1),
      maintCost,
      lostRevenue: Math.round(lostRevenue),
      operatingExpenses,
      utilitiesExpenses,
      staffPayroll,
      totalOutflow,
      noi,
      margin
    };
  }, [targetUnits, periodDays, filteredReservations, filteredMaintenance, filteredExpenses, filteredUtilities, employees, units]);

  // Per-Apartment Performance Matrix Computation
  const unitMatrix = useMemo(() => {
    return targetUnits.map(unit => {
      const unitRes = filteredReservations.filter(r => r.unit_id === unit.id);
      const unitMaint = filteredMaintenance.filter(m => m.unit_id === unit.id);

      const stays = unitRes.length;
      let nights = 0;
      let rev = 0;
      unitRes.forEach(r => {
        const n = Number(r.nights) || 1;
        nights += n;
        rev += Number(r.total_amount) || (n * (Number(r.nightly_rate) || Number(unit.base_price) || 3500));
      });

      const unitAvailableNights = periodDays;
      const occ = unitAvailableNights > 0 ? Math.min(100, Math.round((nights / unitAvailableNights) * 100)) : 0;
      const unitAdr = nights > 0 ? Math.round(rev / nights) : Number(unit.base_price);

      let downtimeHrs = 0;
      let maintExpense = 0;
      unitMaint.forEach(m => {
        downtimeHrs += parseDowntimeHours(m);
        maintExpense += Number(m.cost) || 0;
      });

      const lostRev = Math.round((downtimeHrs / 24) * (Number(unit.base_price) || 3500));
      const operationalScore = Math.max(0, Math.min(100, Math.round(100 - (downtimeHrs / 24) * 5)));

      return {
        unit,
        code: unit.code,
        name: unit.name,
        category: unit.category,
        capacity: unit.capacity,
        basePrice: Number(unit.base_price),
        mode: unit.mode || (unit.readiness === 'maintenance' ? 'maintenance' : 'ready'),
        stays,
        nights,
        revenue: rev,
        occupancy: occ,
        adr: unitAdr,
        incidents: unitMaint.length,
        downtimeHours: Math.round(downtimeHrs * 10) / 10,
        downtimeDays: (downtimeHrs / 24).toFixed(1),
        maintCost: maintExpense,
        lostRevenue: lostRev,
        score: operationalScore
      };
    });
  }, [targetUnits, filteredReservations, filteredMaintenance, periodDays]);

  // Strategic Insights Generator for Executive Decisions
  const strategicInsights = useMemo(() => {
    const insights = [];
    if (unitMatrix.length === 0) return insights;

    // Top Revenue Unit
    const topRevenueUnit = [...unitMatrix].sort((a, b) => b.revenue - a.revenue)[0];
    if (topRevenueUnit && topRevenueUnit.revenue > 0) {
      insights.push({
        type: 'positive',
        title: `Premier Asset Performance: ${topRevenueUnit.code}`,
        desc: `${topRevenueUnit.code} generated ${formatMoney(topRevenueUnit.revenue, currency)} (${topRevenueUnit.occupancy}% occupancy, ${topRevenueUnit.nights} nights sold). Premium rate yielding top RevPAR.`
      });
    }

    // Maintenance Downtime & Bottleneck
    const highestMaintUnit = [...unitMatrix].sort((a, b) => b.downtimeHours - a.downtimeHours)[0];
    if (highestMaintUnit && highestMaintUnit.downtimeHours > 0) {
      insights.push({
        type: 'warning',
        title: `Maintenance Downtime Bottleneck: ${highestMaintUnit.code}`,
        desc: `${highestMaintUnit.code} accounted for ${highestMaintUnit.downtimeHours} hours (${highestMaintUnit.downtimeDays} days) of off-market downtime with ${formatMoney(highestMaintUnit.maintCost, currency)} in repair costs and ~${formatMoney(highestMaintUnit.lostRevenue, currency)} in estimated opportunity loss.`
      });
    }

    // Overall Asset Health & Recommendations
    if (kpis.lostRevenue > 0) {
      insights.push({
        type: 'action',
        title: 'Actionable Management Recommendation: Preventative Stocking',
        desc: `Reducing maintenance resolution turnarounds by stocking common spares (AC capacitors, thermostatic valves, silicone seals) can recover up to ${formatMoney(Math.round(kpis.lostRevenue * 0.6), currency)} in annual lodging revenue.`
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Zero Unscheduled Downtime Recorded',
        desc: 'All apartments operating at high readiness efficiency with zero unplanned downtime during the evaluated window.'
      });
    }

    return insights;
  }, [unitMatrix, kpis, currency]);

  // CSV Export Handler
  function handleExportCSV() {
    let csv = `SOLTA HOTEL APARTMENT - EXECUTIVE PERFORMANCE & OPERATIONAL REPORT\n`;
    csv += `Reporting Period:,"${periodLabel}"\n`;
    csv += `Target Apartments:,"${selectedUnitId === 'all' ? 'All Units' : selectedUnitId}"\n`;
    csv += `Generated On:,"${new Date().toISOString()}"\n\n`;

    // Executive KPIs
    csv += `EXECUTIVE DECISION METRICS\n`;
    csv += `Total Rented Nights Sold,${kpis.nightsSold}\n`;
    csv += `Total Stays Hosted,${kpis.staysCount}\n`;
    csv += `Occupancy Rate,${kpis.occupancyRate}%\n`;
    csv += `Gross Lodging Revenue,${kpis.roomRevenue} ${currency}\n`;
    csv += `Average Daily Rate (ADR),${kpis.adr} ${currency}\n`;
    csv += `RevPAR,${kpis.revPar} ${currency}\n`;
    csv += `Total Maintenance Incidents,${kpis.maintIncidents}\n`;
    csv += `Total Maintenance Downtime,${kpis.maintDowntimeHours} hours (${kpis.maintDowntimeDays} days)\n`;
    csv += `Total Maintenance Direct Cost,${kpis.maintCost} ${currency}\n`;
    csv += `Estimated Lost Revenue Downtime,${kpis.lostRevenue} ${currency}\n`;
    csv += `Operating Costs & Bills,${kpis.totalOutflow} ${currency}\n`;
    csv += `Net Operating Income (NOI),${kpis.noi} ${currency}\n`;
    csv += `Operating Profit Margin,${kpis.margin}%\n\n`;

    // Unit Matrix
    csv += `APARTMENT PERFORMANCE MATRIX\n`;
    csv += `Apartment Code,Category,Capacity,Current Mode,Base Price,Stays,Nights Sold,Occupancy %,Revenue (${currency}),ADR (${currency}),Maint Incidents,Downtime Hours,Maint Cost (${currency}),Est Lost Revenue (${currency})\n`;
    unitMatrix.forEach(u => {
      csv += `"${u.code}","${u.category}","${u.capacity} guests","${u.mode}",${u.basePrice},${u.stays},${u.nights},${u.occupancy}%,${u.revenue},${u.adr},${u.incidents},${u.downtimeHours},${u.maintCost},${u.lostRevenue}\n`;
    });
    csv += `\n`;

    // Maintenance Records
    csv += `MAINTENANCE & DOWNTIME AUDIT LEDGER\n`;
    csv += `Record ID,Apartment,Issue Description,Technician,Started At,Resolved At,Duration,Direct Cost (${currency}),Status,Resolution Notes\n`;
    filteredMaintenance.forEach(m => {
      csv += `"${m.id}","${m.unit_code}","${(m.issue || '').replace(/"/g, '""')}","${(m.technician || '').replace(/"/g, '""')}","${m.start_date || ''}","${m.resolved_date || ''}","${m.actual_duration || m.duration_est || ''}",${m.cost || 0},"${m.status}","${(m.notes || '').replace(/"/g, '""')}"\n`;
    });
    csv += `\n`;

    // Reservations
    csv += `HISTORICAL STAYS & RENTAL LEDGER\n`;
    csv += `Booking Ref,Guest Name,Apartment,Check-In,Check-Out,Nights,Nightly Rate (${currency}),Total Amount (${currency}),Source,Status\n`;
    filteredReservations.forEach(r => {
      csv += `"${r.reference}","${r.guest_name}","${r.unit_code}","${r.check_in}","${r.check_out}",${r.nights},${r.nightly_rate},${r.total_amount || (r.nights * r.nightly_rate)},"${r.source || 'Direct'}","${r.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solta_executive_report_${periodPreset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="reports-view">
      {/* Top Header */}
      <div className="pageheading">
        <div>
          <p className="eyebrow">SOLTA HOTEL APARTMENT · EXECUTIVE INTELLIGENCE</p>
          <h1>Operational Reports &amp; Decision Intelligence</h1>
          <p className="muted">
            Historical rental occupancy, maintenance downtime audit, revenue yield, and strategic management analytics.
          </p>
        </div>
      </div>

      {/* Customizable Controls Toolbar */}
      <div className="reports-hero-bar">
        {/* Preset Range Selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginRight: 4 }}>Period:</span>
          {[
            { id: 'all', label: 'All History' },
            { id: 'this_month', label: 'This Month (Nov)' },
            { id: 'last_month', label: 'Last Month (Oct)' },
            { id: 'last_90', label: 'Last 90 Days' },
            { id: 'ytd', label: 'Year-to-Date' },
            { id: 'custom', label: 'Custom Range' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              className={`finance-filter-pill ${periodPreset === p.id ? 'active' : ''}`}
              onClick={() => setPeriodPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Right actions: Apartment Filter + CSV Export + Print */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Apartment Selector */}
          <select
            value={selectedUnitId}
            onChange={e => setSelectedUnitId(e.target.value)}
            style={{
              padding: '7px 12px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontWeight: 500
            }}
          >
            <option value="all">All Apartments ({units.length} Units)</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.code} · {u.name}</option>
            ))}
          </select>

          {/* Quick Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search stays, repairs, techs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px 7px 30px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                width: 190
              }}
            />
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <button className="secondary small" onClick={handleExportCSV} title="Export CSV for spreadsheet analysis">
            <Download size={14} />
            Export CSV
          </button>
          <button className="secondary small" onClick={() => window.print()} title="Print formal report">
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Custom Date Range Row (if selected) */}
      {periodPreset === 'custom' && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, background: '#f8fafc', padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Select Custom Boundary:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            From:
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            To:
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1' }}
            />
          </label>
          <span style={{ fontSize: 12, color: '#64748b' }}>({periodDays} active days in evaluation)</span>
        </div>
      )}

      {/* 7 Strategic Executive KPI Cards */}
      <div className="reports-kpis">
        {/* 1. Stays & Nights Sold */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Apartments Rented Out</span>
          <div className="reports-kpi-val" style={{ color: '#0052cc' }}>
            {kpis.nightsSold} <small style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>nights</small>
          </div>
          <span className="reports-kpi-sub">{kpis.staysCount} completed &amp; active stays</span>
        </div>

        {/* 2. Occupancy Rate */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Occupancy Rate</span>
          <div className="reports-kpi-val" style={{ color: kpis.occupancyRate >= 65 ? '#2d6a4f' : '#d97706' }}>
            {kpis.occupancyRate}%
          </div>
          <span className="reports-kpi-sub">{kpis.availableNights} potential room-nights</span>
        </div>

        {/* 3. Gross Room Revenue */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Gross Room Revenue</span>
          <div className="reports-kpi-val" style={{ color: '#193751' }}>
            {formatMoney(kpis.roomRevenue, currency)}
          </div>
          <span className="reports-kpi-sub">ADR: {formatMoney(kpis.adr, currency)} / night</span>
        </div>

        {/* 4. RevPAR */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">RevPAR Yield</span>
          <div className="reports-kpi-val" style={{ color: '#0284c7' }}>
            {formatMoney(kpis.revPar, currency)}
          </div>
          <span className="reports-kpi-sub">Per available apartment/day</span>
        </div>

        {/* 5. Maintenance Incidents */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Maintenance Cases</span>
          <div className="reports-kpi-val" style={{ color: kpis.maintIncidents > 0 ? '#ea580c' : '#2d6a4f' }}>
            {kpis.maintIncidents}
          </div>
          <span className="reports-kpi-sub">Cost: {formatMoney(kpis.maintCost, currency)}</span>
        </div>

        {/* 6. Downtime Duration */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Downtime Duration</span>
          <div className="reports-kpi-val" style={{ color: Number(kpis.maintDowntimeHours) > 24 ? '#b91c1c' : '#475569' }}>
            {kpis.maintDowntimeHours} <small style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>hrs</small>
          </div>
          <span className="reports-kpi-sub">{kpis.maintDowntimeDays} days off-market</span>
        </div>

        {/* 7. Net Operating Income */}
        <div className="reports-kpi-card">
          <span className="reports-kpi-label">Net Operating Income</span>
          <div className="reports-kpi-val" style={{ color: kpis.noi >= 0 ? '#15803d' : '#b91c1c' }}>
            {formatMoney(kpis.noi, currency)}
          </div>
          <span className="reports-kpi-sub">{kpis.margin}% operating margin</span>
        </div>
      </div>

      {/* Strategic Decision Matrix Insights Box */}
      <div className="reports-insights-box" style={{ marginBottom: 24 }}>
        <div className="reports-insights-title">
          <TrendingUp size={16} color="#0052cc" />
          <span>Strategic Management Intelligence &amp; Observations</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {strategicInsights.map((ins, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: ins.type === 'positive' ? 'rgba(45, 106, 79, 0.05)' : ins.type === 'warning' ? 'rgba(234, 88, 12, 0.06)' : 'rgba(0, 82, 204, 0.05)',
                borderLeft: `4px solid ${ins.type === 'positive' ? '#2d6a4f' : ins.type === 'warning' ? '#ea580c' : '#0052cc'}`
              }}
            >
              <strong style={{ fontSize: 13, color: '#1e293b', display: 'block', marginBottom: 4 }}>
                {ins.title}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                {ins.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="reports-tabs">
        <button
          type="button"
          className={`reports-tab-btn ${subTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setSubTab('matrix')}
        >
          <Building2 size={16} />
          Apartment Performance Matrix
        </button>
        <button
          type="button"
          className={`reports-tab-btn ${subTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setSubTab('maintenance')}
        >
          <Wrench size={16} />
          Maintenance &amp; Downtime Audit Ledger ({filteredMaintenance.length})
        </button>
        <button
          type="button"
          className={`reports-tab-btn ${subTab === 'stays' ? 'active' : ''}`}
          onClick={() => setSubTab('stays')}
        >
          <CalendarCheck size={16} />
          Historical Stays &amp; Rental Ledger ({filteredReservations.length})
        </button>
        <button
          type="button"
          className={`reports-tab-btn ${subTab === 'pnl' ? 'active' : ''}`}
          onClick={() => setSubTab('pnl')}
        >
          <DollarSign size={16} />
          Operating P&amp;L Statement
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: APARTMENT PERFORMANCE MATRIX
      ========================================================================= */}
      {subTab === 'matrix' && (
        <section className="panel space">
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Apartment Operational Matrix</h2>
              <p className="muted">Unit-by-unit comparative analysis of rental days, occupancy, yield, downtime, and asset rating.</p>
            </div>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              Showing {unitMatrix.length} Apartments
            </span>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Current Mode</th>
                  <th>Nightly Rate</th>
                  <th>Stays</th>
                  <th>Nights Sold</th>
                  <th>Occupancy %</th>
                  <th>Gross Revenue</th>
                  <th>ADR Earned</th>
                  <th>Maintenance Incidents</th>
                  <th>Total Downtime</th>
                  <th>Maint Expense</th>
                  <th>Lost Revenue Est.</th>
                  <th>Health Score</th>
                </tr>
              </thead>
              <tbody>
                {unitMatrix.map(row => (
                  <tr key={row.unit.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: 14, color: '#193751' }}>{row.code}</strong>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{row.name} · {row.category}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`apartment-mode-badge ${row.mode}`}>
                        {row.mode === 'ready' && 'Ready'}
                        {row.mode === 'occupied' && 'Occupied'}
                        {row.mode === 'booked' && 'Booked'}
                        {row.mode === 'maintenance' && 'In Maintenance'}
                      </span>
                    </td>
                    <td>{formatMoney(row.basePrice, currency)}</td>
                    <td><strong>{row.stays}</strong></td>
                    <td><strong>{row.nights}</strong> <span style={{ fontSize: 11, color: '#64748b' }}>/ {periodDays}d</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: row.occupancy >= 60 ? '#15803d' : '#d97706', minWidth: 38 }}>
                          {row.occupancy}%
                        </span>
                        <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${row.occupancy}%`,
                              height: '100%',
                              background: row.occupancy >= 60 ? '#15803d' : '#d97706',
                              borderRadius: 3
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td><strong style={{ color: '#0052cc' }}>{formatMoney(row.revenue, currency)}</strong></td>
                    <td>{formatMoney(row.adr, currency)}</td>
                    <td>
                      <span className={`badge ${row.incidents > 0 ? 'dirty' : 'ready'}`}>
                        {row.incidents} {row.incidents === 1 ? 'case' : 'cases'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        <strong>{row.downtimeHours}h</strong> <span style={{ color: '#64748b' }}>({row.downtimeDays}d)</span>
                      </div>
                    </td>
                    <td>{formatMoney(row.maintCost, currency)}</td>
                    <td>
                      <span style={{ color: row.lostRevenue > 0 ? '#b91c1c' : '#64748b', fontWeight: row.lostRevenue > 0 ? 600 : 400 }}>
                        {formatMoney(row.lostRevenue, currency)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: row.score >= 90 ? 'rgba(21, 128, 61, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                          color: row.score >= 90 ? '#15803d' : '#b45309'
                        }}
                      >
                        {row.score}% Optimal
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          SUB-TAB 2: MAINTENANCE & DOWNTIME AUDIT LEDGER
      ========================================================================= */}
      {subTab === 'maintenance' && (
        <section className="panel space">
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Maintenance &amp; Downtime Audit History</h2>
              <p className="muted">Granular ledger of technical repairs, downtime durations, assigned specialists, parts, and resolution costs.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                {filteredMaintenance.length} Technical Logged Events
              </span>
            </div>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Incident Ref</th>
                  <th>Apartment</th>
                  <th>Issue Description</th>
                  <th>Assigned Technician</th>
                  <th>Start Time</th>
                  <th>Resolved Time</th>
                  <th>Exact Downtime</th>
                  <th>Direct Repair Cost</th>
                  <th>Status</th>
                  <th>Resolution Summary</th>
                </tr>
              </thead>
              <tbody>
                {pagedMaintenance.map(record => {
                  const hrs = parseDowntimeHours(record);
                  const days = (hrs / 24).toFixed(1);
                  return (
                    <tr key={record.id}>
                      <td><strong style={{ fontSize: 13 }}>{record.id}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0052cc', background: 'rgba(0, 82, 204, 0.08)', padding: '2px 8px', borderRadius: 4 }}>
                          {record.unit_code}
                        </span>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{record.issue}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                          {record.technician || 'Solta Maintenance Staff'}
                        </span>
                      </td>
                      <td><span style={{ fontSize: 12, color: '#64748b' }}>{formatDateTime(record.start_date)}</span></td>
                      <td>
                        <span style={{ fontSize: 12, color: record.resolved_date ? '#64748b' : '#b45309' }}>
                          {record.resolved_date ? formatDateTime(record.resolved_date) : 'Currently In-Progress'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: hrs > 24 ? '#b91c1c' : '#1e293b' }}>
                          {record.actual_duration || `${hrs} hours`}
                          <div style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>
                            ({days} operational days)
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#193751' }}>
                          {formatMoney(record.cost || 0, currency)}
                        </strong>
                      </td>
                      <td>
                        <span className={`apartment-mode-badge ${record.status === 'resolved' ? 'ready' : 'maintenance'}`}>
                          {record.status === 'resolved' ? 'Resolved & Verified' : 'Under Repair'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 240, fontSize: 12, color: '#475569' }}>
                        {record.notes || 'Routine repair verified and returned to service.'}
                      </td>
                    </tr>
                  );
                })}

                {filteredMaintenance.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      No maintenance or downtime incidents recorded in the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredMaintenance.length}
            pageSize={15}
            currentPage={maintPage}
            onPageChange={setMaintPage}
            itemName="maintenance events"
          />
        </section>
      )}

      {/* =========================================================================
          SUB-TAB 3: HISTORICAL STAYS & RENTAL LEDGER
      ========================================================================= */}
      {subTab === 'stays' && (
        <section className="panel space">
          <div className="panelheading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Historical Stays &amp; Guest Accounts</h2>
              <p className="muted">Complete record of every guest check-in, duration, rate applied, billed charges, and account settlement.</p>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {filteredReservations.length} Stays Found
            </span>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Guest Name</th>
                  <th>Apartment Unit</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Length of Stay</th>
                  <th>Applied Rate</th>
                  <th>Total Billed</th>
                  <th>Booking Channel</th>
                  <th>Reservation Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedReservations.map(res => {
                  const n = Number(res.nights) || 1;
                  const rate = Number(res.nightly_rate) || 3500;
                  const total = Number(res.total_amount) || (n * rate);
                  return (
                    <tr key={res.id}>
                      <td><strong>{res.reference}</strong></td>
                      <td>
                        <div>
                          <strong>{res.guest_name}</strong>
                          {res.phone && <div style={{ fontSize: 11, color: '#64748b' }}>{res.phone}</div>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0052cc', background: 'rgba(0, 82, 204, 0.08)', padding: '2px 8px', borderRadius: 4 }}>
                          {res.unit_code}
                        </span>
                      </td>
                      <td>{formatDate(res.check_in)}</td>
                      <td>{formatDate(res.check_out)}</td>
                      <td><strong>{n} nights</strong></td>
                      <td>{formatMoney(rate, currency)} / night</td>
                      <td><strong style={{ color: '#15803d' }}>{formatMoney(total, currency)}</strong></td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {res.source || 'Direct Booking'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${res.status === 'checked_in' ? 'checked_in' : res.status === 'booked' ? 'booked' : 'ready'}`}>
                          {res.status === 'checked_in' ? 'Checked-In' : res.status === 'booked' ? 'Confirmed Booking' : 'Checked-Out'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      No stays found matching the current reporting criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredReservations.length}
            pageSize={15}
            currentPage={staysPage}
            onPageChange={setStaysPage}
            itemName="historical stays"
          />
        </section>
      )}

      {/* =========================================================================
          SUB-TAB 4: OPERATING P&L STATEMENT
      ========================================================================= */}
      {subTab === 'pnl' && (
        <section className="panel space">
          <div className="panelheading">
            <div>
              <h2>Property Operating Profit &amp; Loss Statement (P&amp;L)</h2>
              <p className="muted">Solta Hotel Apartment operational inflows vs outflows for managerial decision-making.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginTop: 10 }}>
            {/* Revenue Inflow Side */}
            <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={18} />
                  Operating Revenue (Inflows)
                </h3>
                <strong style={{ fontSize: 16, color: '#15803d' }}>
                  {formatMoney(kpis.roomRevenue, currency)}
                </strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Gross Room Lodging Revenue</span>
                  <strong>{formatMoney(kpis.roomRevenue, currency)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Security Deposits Held (Escrow)</span>
                  <span style={{ color: '#64748b' }}>Held Separately</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Ancillary / Early Extension Fees</span>
                  <span>{formatMoney(0, currency)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Outflow Side */}
            <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingDown size={18} />
                  Operating Outflows &amp; Costs
                </h3>
                <strong style={{ fontSize: 16, color: '#b91c1c' }}>
                  {formatMoney(kpis.totalOutflow, currency)}
                </strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Staff Salaries &amp; Payroll</span>
                  <strong>{formatMoney(kpis.staffPayroll, currency)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Building Utilities Settled</span>
                  <strong>{formatMoney(kpis.utilitiesExpenses, currency)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Maintenance, Repairs &amp; Parts</span>
                  <strong>{formatMoney(kpis.maintCost, currency)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Supplies, Amenities &amp; Sundries</span>
                  <strong>{formatMoney(kpis.operatingExpenses, currency)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div
            style={{
              marginTop: 20,
              padding: '16px 20px',
              borderRadius: 8,
              background: kpis.noi >= 0 ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${kpis.noi >= 0 ? '#a7f3d0' : '#fecaca'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net Operating Result
              </span>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpis.noi >= 0 ? '#15803d' : '#b91c1c' }}>
                {formatMoney(kpis.noi, currency)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Operating Profit Margin:</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpis.noi >= 0 ? '#15803d' : '#b91c1c' }}>
                {kpis.margin}%
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
