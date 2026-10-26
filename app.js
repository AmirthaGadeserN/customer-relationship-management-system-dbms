/**
 * ApexCRM - Customer Relationship Management System
 * Core Application Engine & Database Management
 */

// Application State
const state = {
  db: null,
  currentView: 'dashboard',
  theme: 'dark',
  charts: {
    revenueChart: null,
    categoryChart: null
  },
  filters: {
    customerSearch: '',
    employeeSearch: '',
    employeeDept: 'ALL',
    productSearch: '',
    productCategory: 'ALL',
    orderSearch: '',
    paymentSearch: '',
    paymentStatus: 'ALL',
    supportSearch: '',
    supportStatus: 'ALL'
  }
};

/* -------------------------------------------------------------
 * 1. DATABASE MANAGEMENT & STORAGE
 * ----------------------------------------------------------- */

function initDB() {
  const stored = localStorage.getItem(CRM_DB_STORAGE_KEY);
  if (stored) {
    try {
      state.db = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored DB, resetting to defaults', e);
      state.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
      saveDB();
    }
  } else {
    state.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    saveDB();
  }
}

function saveDB() {
  localStorage.setItem(CRM_DB_STORAGE_KEY, JSON.stringify(state.db));
  updateBadges();
}

function resetToDefaultDB() {
  if (confirm('Are you sure you want to reset all data back to the default sample records? Any custom entered records will be replaced.')) {
    state.db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    saveDB();
    renderCurrentView();
    showToast('Database reset to initial sample data!', 'success');
  }
}

function exportDBAsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.db, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `apex_crm_database_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('JSON Database backup exported!', 'success');
}

function importDBFromJSON(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.customers && imported.products && imported.orders && imported.employees) {
        state.db = imported;
        saveDB();
        renderCurrentView();
        showToast('Database imported successfully!', 'success');
      } else {
        showToast('Invalid database file format!', 'danger');
      }
    } catch (err) {
      showToast('Error reading database file: ' + err.message, 'danger');
    }
  };
  reader.readAsText(file);
}

// Generate Oracle SQL Dump (DDL + DML)
function generateOracleSQLDump() {
  let sql = `-- ========================================================\n`;
  sql += `-- APEX CRM - CUSTOMER RELATIONSHIP MANAGEMENT SYSTEM\n`;
  sql += `-- Oracle SQL Schema & Complete Database Export\n`;
  sql += `-- Generated on: ${new Date().toLocaleString()}\n`;
  sql += `-- ========================================================\n\n`;

  sql += `-- 1. DROP EXISTING TABLES (Reverse Order of FK Dependencies)\n`;
  sql += `DROP TABLE ORDERS CASCADE CONSTRAINTS;\n`;
  sql += `DROP TABLE SUPPORT CASCADE CONSTRAINTS;\n`;
  sql += `DROP TABLE PAYMENT CASCADE CONSTRAINTS;\n`;
  sql += `DROP TABLE PRODUCT CASCADE CONSTRAINTS;\n`;
  sql += `DROP TABLE EMPLOYEE CASCADE CONSTRAINTS;\n`;
  sql += `DROP TABLE CUSTOMER CASCADE CONSTRAINTS;\n\n`;

  sql += `-- 2. TABLE CREATION (DDL)\n\n`;

  // Customer
  sql += DB_SCHEMA.customer.sqlCreate + `\n\n`;
  // Employee
  sql += DB_SCHEMA.employee.sqlCreate + `\n\n`;
  // Product
  sql += DB_SCHEMA.product.sqlCreate + `\n\n`;
  // Payment
  sql += DB_SCHEMA.payment.sqlCreate + `\n\n`;
  // Orders
  sql += DB_SCHEMA.orders.sqlCreate + `\n\n`;
  // Support
  sql += DB_SCHEMA.support.sqlCreate + `\n\n`;

  sql += `-- 3. INSERT STATEMENTS (DML)\n\n`;

  // Customers
  sql += `-- Insert CUSTOMER records\n`;
  state.db.customers.forEach(c => {
    sql += `INSERT INTO CUSTOMER (CUSTOMER_ID, NAME, PHONE, EMAIL, ADDRESS) VALUES (${c.customer_id}, '${escapeSql(c.name)}', '${escapeSql(c.phone)}', '${escapeSql(c.email)}', '${escapeSql(c.address)}');\n`;
  });
  sql += `\n`;

  // Employees
  sql += `-- Insert EMPLOYEE records\n`;
  state.db.employees.forEach(e => {
    sql += `INSERT INTO EMPLOYEE (EMPLOYEE_ID, EMPLOYEE_NAME, DEPARTMENT, PHONE, EMAIL) VALUES (${e.employee_id}, '${escapeSql(e.employee_name)}', '${escapeSql(e.department)}', '${escapeSql(e.phone)}', '${escapeSql(e.email)}');\n`;
  });
  sql += `\n`;

  // Products
  sql += `-- Insert PRODUCT records\n`;
  state.db.products.forEach(p => {
    sql += `INSERT INTO PRODUCT (PRODUCT_ID, PRODUCT_NAME, CATEGORY, PRICE, STOCK) VALUES (${p.product_id}, '${escapeSql(p.product_name)}', '${escapeSql(p.category)}', ${Number(p.price).toFixed(2)}, ${p.stock});\n`;
  });
  sql += `\n`;

  // Payments
  sql += `-- Insert PAYMENT records\n`;
  state.db.payments.forEach(pay => {
    sql += `INSERT INTO PAYMENT (PAYMENT_ID, AMOUNT, PAYMENT_DATE, PAYMENT_METHOD, PAYMENT_STATUS) VALUES (${pay.payment_id}, ${Number(pay.amount).toFixed(2)}, TO_DATE('${pay.payment_date}', 'YYYY-MM-DD'), '${escapeSql(pay.payment_method)}', '${escapeSql(pay.payment_status)}');\n`;
  });
  sql += `\n`;

  // Orders
  sql += `-- Insert ORDERS records\n`;
  state.db.orders.forEach(o => {
    sql += `INSERT INTO ORDERS (BOOKING_ID, ORDER_DATE, QUANTITY, TOTAL_AMOUNT, CUSTOMER_ID, EMPLOYEE_ID, PRODUCT_ID, PAYMENT_ID) VALUES (${o.booking_id}, TO_DATE('${o.order_date}', 'YYYY-MM-DD'), ${o.quantity}, ${Number(o.total_amount).toFixed(2)}, ${o.customer_id}, ${o.employee_id}, ${o.product_id}, ${o.payment_id});\n`;
  });
  sql += `\n`;

  // Support
  sql += `-- Insert SUPPORT records\n`;
  state.db.support.forEach(s => {
    sql += `INSERT INTO SUPPORT (TICKET_ID, ISSUE, STATUS, OPEN_DATE, CUSTOMER_ID) VALUES (${s.ticket_id}, '${escapeSql(s.issue)}', '${escapeSql(s.status)}', TO_DATE('${s.open_date}', 'YYYY-MM-DD'), ${s.customer_id});\n`;
  });
  sql += `\nCOMMIT;\n`;

  return sql;
}

function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

function downloadOracleSQL() {
  const sqlContent = generateOracleSQLDump();
  const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `crm_oracle_dump.sql`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(url);
  showToast('Oracle SQL DDL & DML script downloaded!', 'success');
}

/* -------------------------------------------------------------
 * 2. NAVIGATION & VIEW SWITCHING
 * ----------------------------------------------------------- */

function navigateTo(viewName) {
  state.currentView = viewName;
  
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Show target section
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.style.display = 'block';
    target.classList.remove('animate-fade-in');
    void target.offsetWidth; // trigger reflow
    target.classList.add('animate-fade-in');
  }

  // Render view-specific data
  renderCurrentView();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'customers':
      renderCustomersTable();
      break;
    case 'employees':
      renderEmployeesTable();
      break;
    case 'products':
      renderProductsTable();
      break;
    case 'orders':
      renderOrdersTable();
      break;
    case 'payments':
      renderPaymentsTable();
      break;
    case 'support':
      renderSupportTable();
      break;
    case 'sql-hub':
      renderSQLHub();
      break;
  }
  updateBadges();
}

function updateBadges() {
  if (!state.db) return;
  const setBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };
  setBadge('badge-customers', state.db.customers.length);
  setBadge('badge-employees', state.db.employees.length);
  setBadge('badge-products', state.db.products.length);
  setBadge('badge-orders', state.db.orders.length);
  setBadge('badge-payments', state.db.payments.length);
  setBadge('badge-support', state.db.support.filter(s => s.status !== 'Resolved').length);
}

/* -------------------------------------------------------------
 * 3. DASHBOARD RENDERING & CHARTS
 * ----------------------------------------------------------- */

function renderDashboard() {
  if (!state.db) return;

  // 1. KPI Stats
  const totalRevenue = state.db.orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalOrders = state.db.orders.length;
  const totalCustomers = state.db.customers.length;
  const openTickets = state.db.support.filter(s => s.status === 'Open' || s.status === 'In Progress').length;

  document.getElementById('dash-stat-revenue').textContent = `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('dash-stat-orders').textContent = totalOrders;
  document.getElementById('dash-stat-customers').textContent = totalCustomers;
  document.getElementById('dash-stat-tickets').textContent = openTickets;

  // 2. Recent Orders Table
  const recentOrdersTbody = document.getElementById('dash-recent-orders');
  if (recentOrdersTbody) {
    const sortedOrders = [...state.db.orders].reverse().slice(0, 5);
    if (sortedOrders.length === 0) {
      recentOrdersTbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400">No orders placed yet. Click "+ New Order" to create one!</td></tr>`;
    } else {
      recentOrdersTbody.innerHTML = sortedOrders.map(o => {
        const cust = state.db.customers.find(c => c.customer_id === o.customer_id) || { name: 'Unknown' };
        const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: 'Unknown', price: 0 };
        const emp = state.db.employees.find(e => e.employee_id === o.employee_id) || { employee_name: 'Unknown' };
        const pay = state.db.payments.find(p => p.payment_id === o.payment_id) || { payment_status: 'Pending' };

        const statusBadge = pay.payment_status === 'Completed' ? 'badge-completed' : 'badge-pending';

        return `
          <tr>
            <td class="font-mono font-bold text-indigo-400">#${o.booking_id}</td>
            <td>
              <div class="font-semibold">${escapeHtml(cust.name)}</div>
              <div class="text-xs text-gray-400">ID: ${o.customer_id}</div>
            </td>
            <td>
              <div class="text-sm">${escapeHtml(prod.product_name)}</div>
              <div class="text-xs text-gray-400">$${Number(prod.price).toFixed(2)} &times; ${o.quantity}</div>
            </td>
            <td class="font-semibold text-emerald-400">$${Number(o.total_amount).toFixed(2)}</td>
            <td>
              <span class="badge ${statusBadge}">${escapeHtml(pay.payment_status)}</span>
            </td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="viewOrderReceipt(${o.booking_id})">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 3. Support Tickets Snapshot
  const dashTicketsContainer = document.getElementById('dash-recent-tickets');
  if (dashTicketsContainer) {
    const recentTickets = [...state.db.support].reverse().slice(0, 4);
    if (recentTickets.length === 0) {
      dashTicketsContainer.innerHTML = `<div class="p-6 text-center text-gray-400">No support tickets found.</div>`;
    } else {
      dashTicketsContainer.innerHTML = recentTickets.map(t => {
        const cust = state.db.customers.find(c => c.customer_id === t.customer_id) || { name: 'Customer' };
        let badgeClass = 'badge-open';
        if (t.status === 'In Progress') badgeClass = 'badge-inprogress';
        if (t.status === 'Resolved') badgeClass = 'badge-resolved';

        return `
          <div class="p-3.5 rounded-lg border border-gray-700/50 bg-gray-900/40 flex items-start justify-between gap-3 hover:border-indigo-500/30 transition">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs text-indigo-400 font-bold">#${t.ticket_id}</span>
                <span class="text-xs text-gray-400">&bull; ${escapeHtml(cust.name)}</span>
              </div>
              <p class="text-sm font-medium text-gray-200 line-clamp-1">${escapeHtml(t.issue)}</p>
              <div class="text-xs text-gray-500">Opened: ${t.open_date}</div>
            </div>
            <span class="badge ${badgeClass}">${escapeHtml(t.status)}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Render Charts (if Chart.js is loaded)
  renderDashboardCharts();
}

function renderDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Revenue by Category
  const categoryRevenue = {};
  state.db.orders.forEach(o => {
    const prod = state.db.products.find(p => p.product_id === o.product_id);
    const cat = prod ? prod.category : 'General';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + Number(o.total_amount);
  });

  const catLabels = Object.keys(categoryRevenue);
  const catData = Object.values(categoryRevenue);

  const ctxCat = document.getElementById('chartCategoryRevenue');
  if (ctxCat) {
    if (state.charts.categoryChart) {
      state.charts.categoryChart.destroy();
    }
    state.charts.categoryChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: [
            '#6366f1',
            '#ec4899',
            '#06b6d4',
            '#10b981',
            '#f59e0b',
            '#8b5cf6'
          ],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } }
          }
        },
        cutout: '65%'
      }
    });
  }

  // Chart 2: Order Revenue by Date
  const dateRevenue = {};
  state.db.orders.forEach(o => {
    const d = o.order_date;
    dateRevenue[d] = (dateRevenue[d] || 0) + Number(o.total_amount);
  });
  const sortedDates = Object.keys(dateRevenue).sort();
  const dateTotals = sortedDates.map(d => dateRevenue[d]);

  const ctxTrend = document.getElementById('chartRevenueTrend');
  if (ctxTrend) {
    if (state.charts.revenueChart) {
      state.charts.revenueChart.destroy();
    }
    state.charts.revenueChart = new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: sortedDates,
        datasets: [{
          label: 'Revenue ($)',
          data: dateTotals,
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderRadius: 6,
          hoverBackgroundColor: '#818cf8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              callback: val => '$' + val,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }
}

/* -------------------------------------------------------------
 * 4. CUSTOMER MANAGEMENT (TABLE: CUSTOMER)
 * ----------------------------------------------------------- */

function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const search = (state.filters.customerSearch || '').toLowerCase();
  const filtered = state.db.customers.filter(c => 
    c.name.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search) ||
    c.phone.includes(search) ||
    c.customer_id.toString().includes(search) ||
    (c.address && c.address.toLowerCase().includes(search))
  );

  document.getElementById('customers-count').textContent = `Showing ${filtered.length} of ${state.db.customers.length} customers`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No customers found matching search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    // Count orders & support tickets for this customer
    const orderCount = state.db.orders.filter(o => o.customer_id === c.customer_id).length;
    const ticketCount = state.db.support.filter(s => s.customer_id === c.customer_id).length;

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">${c.customer_id}</td>
        <td>
          <div class="font-semibold text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
              ${c.name.charAt(0)}
            </span>
            ${escapeHtml(c.name)}
          </div>
        </td>
        <td>
          <a href="tel:${escapeHtml(c.phone)}" class="text-gray-300 hover:text-indigo-400 transition">${escapeHtml(c.phone)}</a>
        </td>
        <td>
          <a href="mailto:${escapeHtml(c.email)}" class="text-indigo-400 hover:underline text-sm">${escapeHtml(c.email)}</a>
        </td>
        <td class="text-gray-300 max-w-xs truncate" title="${escapeHtml(c.address)}">${escapeHtml(c.address)}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails(${c.customer_id})" title="View Profile & Orders">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Details
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openCustomerModal(${c.customer_id})" title="Edit Customer">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn btn-secondary btn-sm text-red-400 hover:text-red-300" onclick="deleteCustomer(${c.customer_id})" title="Delete Customer">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCustomerModal(id = null) {
  const modal = document.getElementById('modal-customer');
  const title = document.getElementById('modal-customer-title');
  const form = document.getElementById('form-customer');
  
  if (id) {
    const c = state.db.customers.find(item => item.customer_id === id);
    if (!c) return;
    title.textContent = `Edit Customer #${c.customer_id}`;
    document.getElementById('cust-id').value = c.customer_id;
    document.getElementById('cust-id').readOnly = true;
    document.getElementById('cust-name').value = c.name;
    document.getElementById('cust-phone').value = c.phone;
    document.getElementById('cust-email').value = c.email;
    document.getElementById('cust-address').value = c.address;
  } else {
    title.textContent = 'Add New Customer';
    form.reset();
    // Suggest next ID
    const maxId = state.db.customers.reduce((max, c) => Math.max(max, c.customer_id || 0), 100);
    document.getElementById('cust-id').value = maxId + 1;
    document.getElementById('cust-id').readOnly = false;
  }

  openModal('modal-customer');
}

function saveCustomer(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('cust-id').value, 10);
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const address = document.getElementById('cust-address').value.trim();

  if (!id || !name || !phone || !email || !address) {
    showToast('Please fill in all customer fields.', 'warning');
    return;
  }

  const existingIdx = state.db.customers.findIndex(c => c.customer_id === id);
  if (existingIdx >= 0) {
    // Update
    state.db.customers[existingIdx] = { customer_id: id, name, phone, email, address };
    showToast(`Customer #${id} updated successfully!`, 'success');
  } else {
    // Check PK duplicate
    if (state.db.customers.some(c => c.customer_id === id)) {
      showToast(`Error: Customer ID ${id} already exists! Primary Key must be unique.`, 'danger');
      return;
    }
    state.db.customers.push({ customer_id: id, name, phone, email, address });
    showToast(`New Customer "${name}" registered successfully!`, 'success');
  }

  saveDB();
  closeModal('modal-customer');
  renderCustomersTable();
  if (state.currentView === 'dashboard') renderDashboard();
}

function deleteCustomer(id) {
  // Check Foreign Key constraints (Orders and Support)
  const hasOrders = state.db.orders.some(o => o.customer_id === id);
  const hasTickets = state.db.support.some(s => s.customer_id === id);

  if (hasOrders || hasTickets) {
    alert(`Cannot delete Customer #${id} due to Foreign Key integrity constraints in ORDERS or SUPPORT tables. Please delete linked orders or tickets first.`);
    return;
  }

  if (confirm(`Are you sure you want to delete Customer #${id}? This action cannot be undone.`)) {
    state.db.customers = state.db.customers.filter(c => c.customer_id !== id);
    saveDB();
    renderCustomersTable();
    showToast(`Customer #${id} deleted from database.`, 'info');
  }
}

function viewCustomerDetails(id) {
  const cust = state.db.customers.find(c => c.customer_id === id);
  if (!cust) return;

  const orders = state.db.orders.filter(o => o.customer_id === id);
  const tickets = state.db.support.filter(s => s.customer_id === id);
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const content = document.getElementById('modal-details-content');
  document.getElementById('modal-details-title').textContent = `Customer Profile: ${cust.name}`;

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Profile Card -->
      <div class="p-4 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
        <div>
          <h4 class="text-xl font-bold text-white">${escapeHtml(cust.name)}</h4>
          <p class="text-sm text-indigo-400 font-mono">CUSTOMER_ID: ${cust.customer_id}</p>
          <div class="mt-2 text-sm text-gray-300 space-y-1">
            <p><strong>Phone:</strong> ${escapeHtml(cust.phone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(cust.email)}</p>
            <p><strong>Address:</strong> ${escapeHtml(cust.address)}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs uppercase tracking-wider text-gray-400">Total Spent</div>
          <div class="text-2xl font-black text-emerald-400">$${totalSpent.toFixed(2)}</div>
          <div class="text-xs text-gray-400 mt-1">${orders.length} Orders Placed</div>
        </div>
      </div>

      <!-- Orders Section -->
      <div>
        <h5 class="text-md font-semibold text-white mb-2 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          Order History (${orders.length})
        </h5>
        ${orders.length === 0 ? '<p class="text-sm text-gray-400">No orders recorded for this customer.</p>' : `
          <div class="table-container border border-gray-700/40 rounded-lg">
            <table class="custom-table text-xs">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => {
                  const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: 'Product' };
                  return `
                    <tr>
                      <td class="font-mono text-indigo-400">#${o.booking_id}</td>
                      <td>${escapeHtml(prod.product_name)}</td>
                      <td>${o.quantity}</td>
                      <td class="text-emerald-400 font-semibold">$${Number(o.total_amount).toFixed(2)}</td>
                      <td>${o.order_date}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Support Tickets Section -->
      <div>
        <h5 class="text-md font-semibold text-white mb-2 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          Support Tickets (${tickets.length})
        </h5>
        ${tickets.length === 0 ? '<p class="text-sm text-gray-400">No support tickets found for this customer.</p>' : `
          <div class="space-y-2">
            ${tickets.map(t => `
              <div class="p-3 rounded-lg bg-gray-900/60 border border-gray-700/40 flex items-center justify-between text-xs">
                <div>
                  <div class="font-mono text-indigo-400 font-bold">Ticket #${t.ticket_id}</div>
                  <div class="text-gray-200 mt-0.5">${escapeHtml(t.issue)}</div>
                  <div class="text-gray-500 mt-0.5">Opened on ${t.open_date}</div>
                </div>
                <span class="badge ${t.status === 'Resolved' ? 'badge-resolved' : 'badge-open'}">${escapeHtml(t.status)}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  openModal('modal-details');
}

/* -------------------------------------------------------------
 * 5. EMPLOYEE MANAGEMENT (TABLE: EMPLOYEE)
 * ----------------------------------------------------------- */

function renderEmployeesTable() {
  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  const search = (state.filters.employeeSearch || '').toLowerCase();
  const deptFilter = state.filters.employeeDept || 'ALL';

  const filtered = state.db.employees.filter(e => {
    const matchSearch = e.employee_name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      e.phone.includes(search) ||
      e.employee_id.toString().includes(search) ||
      e.department.toLowerCase().includes(search);
    const matchDept = deptFilter === 'ALL' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  document.getElementById('employees-count').textContent = `Showing ${filtered.length} of ${state.db.employees.length} employees`;

  // Populate department filter dropdown dynamically
  const depts = [...new Set(state.db.employees.map(e => e.department))];
  const deptSelect = document.getElementById('employee-dept-filter');
  if (deptSelect && deptSelect.children.length <= 1) {
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      deptSelect.appendChild(opt);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No employees found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    // Orders handled by this employee
    const handledOrders = state.db.orders.filter(o => o.employee_id === e.employee_id);
    const revenueHandled = handledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">${e.employee_id}</td>
        <td>
          <div class="font-semibold text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-pink-600/30 text-pink-300 font-bold flex items-center justify-center text-xs">
              ${e.employee_name.charAt(0)}
            </span>
            ${escapeHtml(e.employee_name)}
          </div>
        </td>
        <td>
          <span class="badge badge-category">${escapeHtml(e.department)}</span>
        </td>
        <td>
          <a href="tel:${escapeHtml(e.phone)}" class="text-gray-300 hover:text-indigo-400 transition">${escapeHtml(e.phone)}</a>
        </td>
        <td>
          <a href="mailto:${escapeHtml(e.email)}" class="text-indigo-400 hover:underline text-sm">${escapeHtml(e.email)}</a>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-secondary btn-sm" onclick="viewEmployeeDetails(${e.employee_id})" title="View Sales History">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Sales (${handledOrders.length})
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openEmployeeModal(${e.employee_id})" title="Edit Employee">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn btn-secondary btn-sm text-red-400 hover:text-red-300" onclick="deleteEmployee(${e.employee_id})" title="Delete Employee">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openEmployeeModal(id = null) {
  const title = document.getElementById('modal-employee-title');
  const form = document.getElementById('form-employee');

  if (id) {
    const e = state.db.employees.find(item => item.employee_id === id);
    if (!e) return;
    title.textContent = `Edit Employee #${e.employee_id}`;
    document.getElementById('emp-id').value = e.employee_id;
    document.getElementById('emp-id').readOnly = true;
    document.getElementById('emp-name').value = e.employee_name;
    document.getElementById('emp-dept').value = e.department;
    document.getElementById('emp-phone').value = e.phone;
    document.getElementById('emp-email').value = e.email;
  } else {
    title.textContent = 'Add New Employee';
    form.reset();
    const maxId = state.db.employees.reduce((max, e) => Math.max(max, e.employee_id || 0), 200);
    document.getElementById('emp-id').value = maxId + 1;
    document.getElementById('emp-id').readOnly = false;
  }

  openModal('modal-employee');
}

function saveEmployee(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('emp-id').value, 10);
  const employee_name = document.getElementById('emp-name').value.trim();
  const department = document.getElementById('emp-dept').value.trim();
  const phone = document.getElementById('emp-phone').value.trim();
  const email = document.getElementById('emp-email').value.trim();

  if (!id || !employee_name || !department || !phone || !email) {
    showToast('Please fill all employee fields.', 'warning');
    return;
  }

  const existingIdx = state.db.employees.findIndex(emp => emp.employee_id === id);
  if (existingIdx >= 0) {
    state.db.employees[existingIdx] = { employee_id: id, employee_name, department, phone, email };
    showToast(`Employee #${id} updated successfully!`, 'success');
  } else {
    if (state.db.employees.some(emp => emp.employee_id === id)) {
      showToast(`Error: Employee ID ${id} already exists!`, 'danger');
      return;
    }
    state.db.employees.push({ employee_id: id, employee_name, department, phone, email });
    showToast(`New employee "${employee_name}" added!`, 'success');
  }

  saveDB();
  closeModal('modal-employee');
  renderEmployeesTable();
}

function deleteEmployee(id) {
  const hasOrders = state.db.orders.some(o => o.employee_id === id);
  if (hasOrders) {
    alert(`Cannot delete Employee #${id} because orders in the ORDERS table reference this employee. (Foreign Key Constraint)`);
    return;
  }

  if (confirm(`Are you sure you want to delete Employee #${id}?`)) {
    state.db.employees = state.db.employees.filter(e => e.employee_id !== id);
    saveDB();
    renderEmployeesTable();
    showToast(`Employee #${id} deleted.`, 'info');
  }
}

function viewEmployeeDetails(id) {
  const emp = state.db.employees.find(e => e.employee_id === id);
  if (!emp) return;

  const orders = state.db.orders.filter(o => o.employee_id === id);
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const content = document.getElementById('modal-details-content');
  document.getElementById('modal-details-title').textContent = `Employee Record: ${emp.employee_name}`;

  content.innerHTML = `
    <div class="space-y-6">
      <div class="p-4 rounded-xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
        <div>
          <h4 class="text-xl font-bold text-white">${escapeHtml(emp.employee_name)}</h4>
          <p class="text-sm text-indigo-400 font-mono">EMPLOYEE_ID: ${emp.employee_id}</p>
          <div class="mt-2 text-sm text-gray-300 space-y-1">
            <p><strong>Department:</strong> ${escapeHtml(emp.department)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(emp.phone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(emp.email)}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs uppercase tracking-wider text-gray-400">Total Sales Generated</div>
          <div class="text-2xl font-black text-emerald-400">$${totalRevenue.toFixed(2)}</div>
          <div class="text-xs text-gray-400 mt-1">${orders.length} Deals Handled</div>
        </div>
      </div>

      <div>
        <h5 class="text-md font-semibold text-white mb-2 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Orders Handled by ${escapeHtml(emp.employee_name)}
        </h5>
        ${orders.length === 0 ? '<p class="text-sm text-gray-400">No orders currently assigned to this employee.</p>' : `
          <div class="table-container border border-gray-700/40 rounded-lg">
            <table class="custom-table text-xs">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => {
                  const cust = state.db.customers.find(c => c.customer_id === o.customer_id) || { name: 'Customer' };
                  const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: 'Product' };
                  return `
                    <tr>
                      <td class="font-mono text-indigo-400">#${o.booking_id}</td>
                      <td>${escapeHtml(cust.name)}</td>
                      <td>${escapeHtml(prod.product_name)}</td>
                      <td class="text-emerald-400 font-semibold">$${Number(o.total_amount).toFixed(2)}</td>
                      <td>${o.order_date}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;

  openModal('modal-details');
}

/* -------------------------------------------------------------
 * 6. PRODUCT MANAGEMENT (TABLE: PRODUCT)
 * ----------------------------------------------------------- */

function renderProductsTable() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  const search = (state.filters.productSearch || '').toLowerCase();
  const catFilter = state.filters.productCategory || 'ALL';

  const filtered = state.db.products.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.product_id.toString().includes(search);
    const matchCat = catFilter === 'ALL' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  document.getElementById('products-count').textContent = `Showing ${filtered.length} of ${state.db.products.length} products`;

  // Populate category filter
  const cats = [...new Set(state.db.products.map(p => p.category))];
  const catSelect = document.getElementById('product-category-filter');
  if (catSelect && catSelect.children.length <= 1) {
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isLowStock = p.stock < 50;

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">${p.product_id}</td>
        <td>
          <div class="font-semibold text-white">${escapeHtml(p.product_name)}</div>
        </td>
        <td>
          <span class="badge badge-category">${escapeHtml(p.category)}</span>
        </td>
        <td class="font-semibold text-emerald-400">$${Number(p.price).toFixed(2)}</td>
        <td>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isLowStock ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
            ${p.stock} units ${isLowStock ? '(Low)' : ''}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-secondary btn-sm" onclick="openProductModal(${p.product_id})" title="Edit Product">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Edit
            </button>
            <button class="btn btn-secondary btn-sm text-red-400 hover:text-red-300" onclick="deleteProduct(${p.product_id})" title="Delete Product">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(id = null) {
  const title = document.getElementById('modal-product-title');
  const form = document.getElementById('form-product');

  if (id) {
    const p = state.db.products.find(item => item.product_id === id);
    if (!p) return;
    title.textContent = `Edit Product #${p.product_id}`;
    document.getElementById('prod-id').value = p.product_id;
    document.getElementById('prod-id').readOnly = true;
    document.getElementById('prod-name').value = p.product_name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
  } else {
    title.textContent = 'Add New Product';
    form.reset();
    const maxId = state.db.products.reduce((max, p) => Math.max(max, p.product_id || 0), 300);
    document.getElementById('prod-id').value = maxId + 1;
    document.getElementById('prod-id').readOnly = false;
  }

  openModal('modal-product');
}

function saveProduct(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('prod-id').value, 10);
  const product_name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value, 10);

  if (!id || !product_name || !category || isNaN(price) || isNaN(stock)) {
    showToast('Please fill all valid product fields.', 'warning');
    return;
  }

  const existingIdx = state.db.products.findIndex(p => p.product_id === id);
  if (existingIdx >= 0) {
    state.db.products[existingIdx] = { product_id: id, product_name, category, price, stock };
    showToast(`Product #${id} updated!`, 'success');
  } else {
    if (state.db.products.some(p => p.product_id === id)) {
      showToast(`Error: Product ID ${id} already exists!`, 'danger');
      return;
    }
    state.db.products.push({ product_id: id, product_name, category, price, stock });
    showToast(`Product "${product_name}" created!`, 'success');
  }

  saveDB();
  closeModal('modal-product');
  renderProductsTable();
  if (state.currentView === 'dashboard') renderDashboard();
}

function deleteProduct(id) {
  const hasOrders = state.db.orders.some(o => o.product_id === id);
  if (hasOrders) {
    alert(`Cannot delete Product #${id} because it is referenced in ORDERS. (Foreign Key Constraint)`);
    return;
  }

  if (confirm(`Are you sure you want to delete Product #${id}?`)) {
    state.db.products = state.db.products.filter(p => p.product_id !== id);
    saveDB();
    renderProductsTable();
    showToast(`Product #${id} removed.`, 'info');
  }
}

/* -------------------------------------------------------------
 * 7. ORDERS & BOOKINGS (TABLE: ORDERS)
 * ----------------------------------------------------------- */

function renderOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const search = (state.filters.orderSearch || '').toLowerCase();

  const filtered = state.db.orders.filter(o => {
    const cust = state.db.customers.find(c => c.customer_id === o.customer_id) || { name: '' };
    const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: '' };
    const emp = state.db.employees.find(e => e.employee_id === o.employee_id) || { employee_name: '' };

    return o.booking_id.toString().includes(search) ||
      cust.name.toLowerCase().includes(search) ||
      prod.product_name.toLowerCase().includes(search) ||
      emp.employee_name.toLowerCase().includes(search) ||
      o.order_date.includes(search);
  });

  document.getElementById('orders-count').textContent = `Showing ${filtered.length} of ${state.db.orders.length} bookings/orders`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No orders found. Click "+ New Booking" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const cust = state.db.customers.find(c => c.customer_id === o.customer_id) || { name: 'N/A' };
    const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: 'N/A', price: 0 };
    const emp = state.db.employees.find(e => e.employee_id === o.employee_id) || { employee_name: 'N/A', department: '' };
    const pay = state.db.payments.find(p => p.payment_id === o.payment_id) || { payment_status: 'Pending', payment_method: 'N/A' };

    const statusBadge = pay.payment_status === 'Completed' ? 'badge-completed' : 'badge-pending';

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">#${o.booking_id}</td>
        <td>
          <div class="font-semibold text-white">${escapeHtml(cust.name)}</div>
          <div class="text-xs text-gray-400">ID: ${o.customer_id}</div>
        </td>
        <td>
          <div class="text-white">${escapeHtml(prod.product_name)}</div>
          <div class="text-xs text-indigo-300 font-mono">Unit: $${Number(prod.price).toFixed(2)}</div>
        </td>
        <td class="font-bold text-gray-200">${o.quantity}</td>
        <td class="font-black text-emerald-400 text-base">$${Number(o.total_amount).toFixed(2)}</td>
        <td>
          <div class="text-gray-200 text-sm">${escapeHtml(emp.employee_name)}</div>
          <div class="text-xs text-gray-400">${escapeHtml(emp.department)}</div>
        </td>
        <td>
          <span class="badge ${statusBadge}">${escapeHtml(pay.payment_status)}</span>
          <div class="text-xs text-gray-400 mt-1">${escapeHtml(pay.payment_method)}</div>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-primary btn-sm" onclick="viewOrderReceipt(${o.booking_id})" title="View Receipt / Invoice">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Invoice
            </button>
            <button class="btn btn-secondary btn-sm text-red-400 hover:text-red-300" onclick="deleteOrder(${o.booking_id})" title="Delete Booking">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openOrderModal() {
  const form = document.getElementById('form-order');
  form.reset();

  // Next booking ID
  const maxBookingId = state.db.orders.reduce((max, o) => Math.max(max, o.booking_id || 0), 1000);
  document.getElementById('order-booking-id').value = maxBookingId + 1;

  // Order Date default today (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('order-date').value = today;

  // Populate Customer Dropdown
  const custSelect = document.getElementById('order-cust-id');
  custSelect.innerHTML = `<option value="">-- Select Customer --</option>` +
    state.db.customers.map(c => `<option value="${c.customer_id}">#${c.customer_id} - ${escapeHtml(c.name)} (${escapeHtml(c.phone)})</option>`).join('');

  // Populate Product Dropdown
  const prodSelect = document.getElementById('order-prod-id');
  prodSelect.innerHTML = `<option value="">-- Select Product --</option>` +
    state.db.products.map(p => `<option value="${p.product_id}" data-price="${p.price}" data-stock="${p.stock}">#${p.product_id} - ${escapeHtml(p.product_name)} ($${Number(p.price).toFixed(2)})</option>`).join('');

  // Populate Employee Dropdown
  const empSelect = document.getElementById('order-emp-id');
  empSelect.innerHTML = `<option value="">-- Select Employee (Sales Rep) --</option>` +
    state.db.employees.map(e => `<option value="${e.employee_id}">#${e.employee_id} - ${escapeHtml(e.employee_name)} [${escapeHtml(e.department)}]</option>`).join('');

  // Populate Payment Mode
  const maxPayId = state.db.payments.reduce((max, p) => Math.max(max, p.payment_id || 0), 500);
  document.getElementById('order-new-pay-id').value = maxPayId + 1;

  // Quantity default 1
  document.getElementById('order-qty').value = 1;

  // Trigger live price calc
  updateOrderPriceCalc();

  openModal('modal-order');
}

function updateOrderPriceCalc() {
  const prodSelect = document.getElementById('order-prod-id');
  const selectedOption = prodSelect.options[prodSelect.selectedIndex];
  const unitPrice = selectedOption ? parseFloat(selectedOption.dataset.price || 0) : 0;
  const stock = selectedOption ? parseInt(selectedOption.dataset.stock || 0, 10) : 0;
  const qty = parseInt(document.getElementById('order-qty').value || 1, 10);

  const total = unitPrice * qty;

  document.getElementById('order-calc-unit-price').textContent = `$${unitPrice.toFixed(2)}`;
  document.getElementById('order-calc-stock').textContent = `${stock} in stock`;
  document.getElementById('order-calc-total').textContent = `$${total.toFixed(2)}`;
  document.getElementById('order-total-amount-hidden').value = total.toFixed(2);
}

function saveOrder(e) {
  e.preventDefault();
  const booking_id = parseInt(document.getElementById('order-booking-id').value, 10);
  const order_date = document.getElementById('order-date').value;
  const customer_id = parseInt(document.getElementById('order-cust-id').value, 10);
  const product_id = parseInt(document.getElementById('order-prod-id').value, 10);
  const employee_id = parseInt(document.getElementById('order-emp-id').value, 10);
  const quantity = parseInt(document.getElementById('order-qty').value, 10);
  const total_amount = parseFloat(document.getElementById('order-total-amount-hidden').value);

  if (!booking_id || !order_date || !customer_id || !product_id || !employee_id || !quantity || isNaN(total_amount)) {
    showToast('Please complete all order fields.', 'warning');
    return;
  }

  // Check Booking ID uniqueness
  if (state.db.orders.some(o => o.booking_id === booking_id)) {
    showToast(`Error: Booking ID ${booking_id} already exists!`, 'danger');
    return;
  }

  // Stock check
  const prod = state.db.products.find(p => p.product_id === product_id);
  if (!prod) {
    showToast('Selected product does not exist!', 'danger');
    return;
  }
  if (prod.stock < quantity) {
    showToast(`Insufficient stock! Product only has ${prod.stock} units remaining.`, 'danger');
    return;
  }

  // Create linked Payment
  const payment_id = parseInt(document.getElementById('order-new-pay-id').value, 10);
  const payment_method = document.getElementById('order-pay-method').value;
  const payment_status = document.getElementById('order-pay-status').value;

  const newPayment = {
    payment_id,
    amount: total_amount,
    payment_date: order_date,
    payment_method,
    payment_status
  };

  // Decrement product stock
  prod.stock -= quantity;

  // Insert payment
  state.db.payments.push(newPayment);

  // Insert order
  state.db.orders.push({
    booking_id,
    order_date,
    quantity,
    total_amount,
    customer_id,
    employee_id,
    product_id,
    payment_id
  });

  saveDB();
  closeModal('modal-order');

  // Trigger celebration confetti!
  launchConfetti();
  showToast(`Booking #${booking_id} created successfully! Total: $${total_amount.toFixed(2)}`, 'success');

  renderOrdersTable();
  if (state.currentView === 'dashboard') renderDashboard();
}

function deleteOrder(booking_id) {
  if (confirm(`Are you sure you want to cancel and delete Booking #${booking_id}?`)) {
    const order = state.db.orders.find(o => o.booking_id === booking_id);
    if (order) {
      // Restore stock
      const prod = state.db.products.find(p => p.product_id === order.product_id);
      if (prod) prod.stock += order.quantity;
    }
    state.db.orders = state.db.orders.filter(o => o.booking_id !== booking_id);
    saveDB();
    renderOrdersTable();
    showToast(`Booking #${booking_id} removed.`, 'info');
  }
}

function viewOrderReceipt(booking_id) {
  const o = state.db.orders.find(order => order.booking_id === booking_id);
  if (!o) return;

  const cust = state.db.customers.find(c => c.customer_id === o.customer_id) || { name: 'Customer', email: 'N/A', phone: 'N/A', address: 'N/A' };
  const prod = state.db.products.find(p => p.product_id === o.product_id) || { product_name: 'Product', price: 0, category: 'N/A' };
  const emp = state.db.employees.find(e => e.employee_id === o.employee_id) || { employee_name: 'Sales Rep', department: 'Enterprise', email: 'N/A' };
  const pay = state.db.payments.find(p => p.payment_id === o.payment_id) || { payment_id: 'N/A', payment_method: 'N/A', payment_status: 'Pending' };

  const content = document.getElementById('modal-details-content');
  document.getElementById('modal-details-title').textContent = `Order Receipt / Invoice #${o.booking_id}`;

  content.innerHTML = `
    <div id="invoice-print-area" class="space-y-6 p-2">
      <!-- Invoice Header -->
      <div class="flex items-start justify-between border-b border-gray-700/60 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base">A</span>
            <span class="text-xl font-bold text-white tracking-tight">ApexCRM Systems</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Customer Relationship Management DBMS</p>
        </div>
        <div class="text-right">
          <div class="text-xs uppercase text-gray-400 font-bold">Booking Reference</div>
          <div class="text-xl font-mono font-black text-indigo-400">#${o.booking_id}</div>
          <div class="text-xs text-gray-400">Date: ${o.order_date}</div>
        </div>
      </div>

      <!-- Parties Grid -->
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div class="p-3 rounded-lg bg-gray-900/50 border border-gray-700/40">
          <div class="font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To (Customer)</div>
          <div class="font-bold text-white text-sm">${escapeHtml(cust.name)}</div>
          <div class="text-gray-300">Customer ID: ${cust.customer_id}</div>
          <div class="text-gray-300">${escapeHtml(cust.email)}</div>
          <div class="text-gray-300">${escapeHtml(cust.phone)}</div>
          <div class="text-gray-400 mt-1">${escapeHtml(cust.address)}</div>
        </div>
        <div class="p-3 rounded-lg bg-gray-900/50 border border-gray-700/40">
          <div class="font-bold text-gray-400 uppercase tracking-wider mb-1">Handled By (Employee)</div>
          <div class="font-bold text-white text-sm">${escapeHtml(emp.employee_name)}</div>
          <div class="text-gray-300">Employee ID: ${emp.employee_id}</div>
          <div class="text-indigo-400 font-semibold">${escapeHtml(emp.department)}</div>
          <div class="text-gray-300">${escapeHtml(emp.email)}</div>
        </div>
      </div>

      <!-- Order Items Table -->
      <div class="border border-gray-700/50 rounded-lg overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-gray-800/80 text-gray-300 border-b border-gray-700">
            <tr>
              <th class="p-3 text-left">Item Description</th>
              <th class="p-3 text-left">Category</th>
              <th class="p-3 text-right">Unit Price</th>
              <th class="p-3 text-center">Qty</th>
              <th class="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr>
              <td class="p-3 font-semibold text-white">${escapeHtml(prod.product_name)}</td>
              <td class="p-3 text-gray-400">${escapeHtml(prod.category)}</td>
              <td class="p-3 text-right text-gray-300">$${Number(prod.price).toFixed(2)}</td>
              <td class="p-3 text-center font-bold text-white">${o.quantity}</td>
              <td class="p-3 text-right font-black text-emerald-400 text-sm">$${Number(o.total_amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Payment & Grand Total -->
      <div class="flex items-center justify-between p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
        <div>
          <div class="text-xs text-gray-400 uppercase font-bold">Payment Details</div>
          <div class="text-sm font-semibold text-white mt-0.5">Method: ${escapeHtml(pay.payment_method)} (Ref #${pay.payment_id})</div>
          <div class="mt-1">
            <span class="badge ${pay.payment_status === 'Completed' ? 'badge-completed' : 'badge-pending'}">${escapeHtml(pay.payment_status)}</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-400 uppercase font-bold">Grand Total Amount</div>
          <div class="text-2xl font-black text-emerald-400">$${Number(o.total_amount).toFixed(2)}</div>
        </div>
      </div>

      <!-- Print Button -->
      <div class="flex justify-end gap-2 pt-2 print:hidden">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Print Invoice
        </button>
      </div>
    </div>
  `;

  openModal('modal-details');
}

/* -------------------------------------------------------------
 * 8. PAYMENT MANAGEMENT (TABLE: PAYMENT)
 * ----------------------------------------------------------- */

function renderPaymentsTable() {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  const search = (state.filters.paymentSearch || '').toLowerCase();
  const statusFilter = state.filters.paymentStatus || 'ALL';

  const filtered = state.db.payments.filter(p => {
    const matchSearch = p.payment_id.toString().includes(search) ||
      p.payment_method.toLowerCase().includes(search) ||
      p.payment_date.includes(search) ||
      p.amount.toString().includes(search);
    const matchStatus = statusFilter === 'ALL' || p.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  document.getElementById('payments-count').textContent = `Showing ${filtered.length} of ${state.db.payments.length} transactions`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No payment records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const linkedOrder = state.db.orders.find(o => o.payment_id === p.payment_id);
    const statusBadge = p.payment_status === 'Completed' ? 'badge-completed' : 'badge-pending';

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">#${p.payment_id}</td>
        <td class="font-black text-emerald-400">$${Number(p.amount).toFixed(2)}</td>
        <td class="text-gray-300">${p.payment_date}</td>
        <td>
          <span class="inline-flex items-center gap-1 text-white font-medium">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            ${escapeHtml(p.payment_method)}
          </span>
        </td>
        <td>
          <span class="badge ${statusBadge}">${escapeHtml(p.payment_status)}</span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            ${linkedOrder ? `
              <button class="btn btn-secondary btn-sm font-mono text-xs text-indigo-300" onclick="viewOrderReceipt(${linkedOrder.booking_id})" title="View Linked Booking">
                Order #${linkedOrder.booking_id}
              </button>
            ` : '<span class="text-xs text-gray-500">Standalone</span>'}
            <button class="btn btn-secondary btn-sm" onclick="openPaymentModal(${p.payment_id})" title="Edit Payment">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openPaymentModal(id = null) {
  const title = document.getElementById('modal-payment-title');
  const form = document.getElementById('form-payment');

  if (id) {
    const p = state.db.payments.find(item => item.payment_id === id);
    if (!p) return;
    title.textContent = `Edit Payment #${p.payment_id}`;
    document.getElementById('pay-id').value = p.payment_id;
    document.getElementById('pay-id').readOnly = true;
    document.getElementById('pay-amount').value = p.amount;
    document.getElementById('pay-date').value = p.payment_date;
    document.getElementById('pay-method').value = p.payment_method;
    document.getElementById('pay-status').value = p.payment_status;
  } else {
    title.textContent = 'Record New Payment';
    form.reset();
    const maxId = state.db.payments.reduce((max, p) => Math.max(max, p.payment_id || 0), 500);
    document.getElementById('pay-id').value = maxId + 1;
    document.getElementById('pay-id').readOnly = false;
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  }

  openModal('modal-payment');
}

function savePayment(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('pay-id').value, 10);
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const payment_date = document.getElementById('pay-date').value;
  const payment_method = document.getElementById('pay-method').value;
  const payment_status = document.getElementById('pay-status').value;

  if (!id || isNaN(amount) || !payment_date || !payment_method || !payment_status) {
    showToast('Please fill all payment fields.', 'warning');
    return;
  }

  const existingIdx = state.db.payments.findIndex(p => p.payment_id === id);
  if (existingIdx >= 0) {
    state.db.payments[existingIdx] = { payment_id: id, amount, payment_date, payment_method, payment_status };
    showToast(`Payment #${id} updated!`, 'success');
  } else {
    if (state.db.payments.some(p => p.payment_id === id)) {
      showToast(`Error: Payment ID ${id} already exists!`, 'danger');
      return;
    }
    state.db.payments.push({ payment_id: id, amount, payment_date, payment_method, payment_status });
    showToast(`Payment of $${amount.toFixed(2)} recorded!`, 'success');
  }

  saveDB();
  closeModal('modal-payment');
  renderPaymentsTable();
  if (state.currentView === 'dashboard') renderDashboard();
}

/* -------------------------------------------------------------
 * 9. SUPPORT TICKET MANAGEMENT (TABLE: SUPPORT)
 * ----------------------------------------------------------- */

function renderSupportTable() {
  const tbody = document.getElementById('support-tbody');
  if (!tbody) return;

  const search = (state.filters.supportSearch || '').toLowerCase();
  const statusFilter = state.filters.supportStatus || 'ALL';

  const filtered = state.db.support.filter(s => {
    const cust = state.db.customers.find(c => c.customer_id === s.customer_id) || { name: '' };
    const matchSearch = s.ticket_id.toString().includes(search) ||
      s.issue.toLowerCase().includes(search) ||
      cust.name.toLowerCase().includes(search) ||
      s.open_date.includes(search);
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  document.getElementById('support-count').textContent = `Showing ${filtered.length} of ${state.db.support.length} tickets`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No support tickets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const cust = state.db.customers.find(c => c.customer_id === t.customer_id) || { name: 'N/A' };
    let badgeClass = 'badge-open';
    if (t.status === 'In Progress') badgeClass = 'badge-inprogress';
    if (t.status === 'Resolved') badgeClass = 'badge-resolved';

    return `
      <tr>
        <td class="font-mono font-bold text-indigo-400">#${t.ticket_id}</td>
        <td>
          <div class="font-medium text-white max-w-sm">${escapeHtml(t.issue)}</div>
        </td>
        <td>
          <div class="font-semibold text-white">${escapeHtml(cust.name)}</div>
          <div class="text-xs text-gray-400">ID: ${t.customer_id}</div>
        </td>
        <td>
          <!-- Quick Status Switcher Dropdown -->
          <select class="form-control text-xs py-1 px-2 border-gray-700 bg-gray-900 rounded font-semibold" onchange="quickUpdateTicketStatus(${t.ticket_id}, this.value)">
            <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>🔵 Open</option>
            <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>🟡 In Progress</option>
            <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>🟢 Resolved</option>
          </select>
        </td>
        <td class="text-gray-300">${t.open_date}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-secondary btn-sm" onclick="openSupportModal(${t.ticket_id})" title="Edit Ticket">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn btn-secondary btn-sm text-red-400 hover:text-red-300" onclick="deleteSupportTicket(${t.ticket_id})" title="Delete Ticket">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function quickUpdateTicketStatus(ticket_id, newStatus) {
  const ticket = state.db.support.find(t => t.ticket_id === ticket_id);
  if (ticket) {
    ticket.status = newStatus;
    saveDB();
    showToast(`Ticket #${ticket_id} status updated to "${newStatus}"!`, 'info');
    if (state.currentView === 'dashboard') renderDashboard();
  }
}

function openSupportModal(id = null) {
  const title = document.getElementById('modal-support-title');
  const form = document.getElementById('form-support');

  // Customer dropdown
  const custSelect = document.getElementById('support-cust-id');
  custSelect.innerHTML = `<option value="">-- Select Customer --</option>` +
    state.db.customers.map(c => `<option value="${c.customer_id}">#${c.customer_id} - ${escapeHtml(c.name)}</option>`).join('');

  if (id) {
    const t = state.db.support.find(item => item.ticket_id === id);
    if (!t) return;
    title.textContent = `Edit Support Ticket #${t.ticket_id}`;
    document.getElementById('ticket-id').value = t.ticket_id;
    document.getElementById('ticket-id').readOnly = true;
    document.getElementById('ticket-issue').value = t.issue;
    document.getElementById('ticket-status').value = t.status;
    document.getElementById('ticket-date').value = t.open_date;
    document.getElementById('support-cust-id').value = t.customer_id;
  } else {
    title.textContent = 'Open New Support Ticket';
    form.reset();
    const maxId = state.db.support.reduce((max, s) => Math.max(max, s.ticket_id || 0), 700);
    document.getElementById('ticket-id').value = maxId + 1;
    document.getElementById('ticket-id').readOnly = false;
    document.getElementById('ticket-date').value = new Date().toISOString().split('T')[0];
  }

  openModal('modal-support');
}

function saveSupportTicket(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('ticket-id').value, 10);
  const issue = document.getElementById('ticket-issue').value.trim();
  const status = document.getElementById('ticket-status').value;
  const open_date = document.getElementById('ticket-date').value;
  const customer_id = parseInt(document.getElementById('support-cust-id').value, 10);

  if (!id || !issue || !status || !open_date || !customer_id) {
    showToast('Please fill all ticket fields.', 'warning');
    return;
  }

  const existingIdx = state.db.support.findIndex(t => t.ticket_id === id);
  if (existingIdx >= 0) {
    state.db.support[existingIdx] = { ticket_id: id, issue, status, open_date, customer_id };
    showToast(`Support Ticket #${id} updated!`, 'success');
  } else {
    if (state.db.support.some(t => t.ticket_id === id)) {
      showToast(`Error: Ticket ID ${id} already exists!`, 'danger');
      return;
    }
    state.db.support.push({ ticket_id: id, issue, status, open_date, customer_id });
    showToast(`Ticket #${id} logged successfully!`, 'success');
  }

  saveDB();
  closeModal('modal-support');
  renderSupportTable();
  if (state.currentView === 'dashboard') renderDashboard();
}

function deleteSupportTicket(id) {
  if (confirm(`Are you sure you want to delete Ticket #${id}?`)) {
    state.db.support = state.db.support.filter(s => s.ticket_id !== id);
    saveDB();
    renderSupportTable();
    showToast(`Ticket #${id} deleted.`, 'info');
  }
}

/* -------------------------------------------------------------
 * 10. DATABASE & SQL HUB (ER DIAGRAM + JOIN QUERY RUNNER)
 * ----------------------------------------------------------- */

const PRESET_QUERIES = [
  {
    name: "Complete Relational Order Report (5 Tables JOIN)",
    sql: `SELECT 
  O.BOOKING_ID,
  O.ORDER_DATE,
  C.NAME AS CUSTOMER_NAME,
  P.PRODUCT_NAME,
  P.PRICE AS UNIT_PRICE,
  O.QUANTITY,
  O.TOTAL_AMOUNT,
  E.EMPLOYEE_NAME AS SALES_REP,
  E.DEPARTMENT,
  PAY.PAYMENT_METHOD,
  PAY.PAYMENT_STATUS
FROM ORDERS O
JOIN CUSTOMER C ON O.CUSTOMER_ID = C.CUSTOMER_ID
JOIN PRODUCT P ON O.PRODUCT_ID = P.PRODUCT_ID
JOIN EMPLOYEE E ON O.EMPLOYEE_ID = E.EMPLOYEE_ID
JOIN PAYMENT PAY ON O.PAYMENT_ID = PAY.PAYMENT_ID;`,
    execute: (db) => {
      return db.orders.map(o => {
        const c = db.customers.find(item => item.customer_id === o.customer_id) || {};
        const p = db.products.find(item => item.product_id === o.product_id) || {};
        const e = db.employees.find(item => item.employee_id === o.employee_id) || {};
        const pay = db.payments.find(item => item.payment_id === o.payment_id) || {};
        return {
          "BOOKING_ID": o.booking_id,
          "ORDER_DATE": o.order_date,
          "CUSTOMER_NAME": c.name || 'N/A',
          "PRODUCT_NAME": p.product_name || 'N/A',
          "UNIT_PRICE": `$${Number(p.price || 0).toFixed(2)}`,
          "QUANTITY": o.quantity,
          "TOTAL_AMOUNT": `$${Number(o.total_amount || 0).toFixed(2)}`,
          "SALES_REP": e.employee_name || 'N/A',
          "DEPARTMENT": e.department || 'N/A',
          "PAYMENT_METHOD": pay.payment_method || 'N/A',
          "PAYMENT_STATUS": pay.payment_status || 'N/A'
        };
      });
    }
  },
  {
    name: "Customer Support Tickets & Contact Details (JOIN Support & Customer)",
    sql: `SELECT 
  S.TICKET_ID,
  S.ISSUE,
  S.STATUS,
  S.OPEN_DATE,
  C.NAME AS CUSTOMER_NAME,
  C.PHONE,
  C.EMAIL
FROM SUPPORT S
JOIN CUSTOMER C ON S.CUSTOMER_ID = C.CUSTOMER_ID;`,
    execute: (db) => {
      return db.support.map(s => {
        const c = db.customers.find(item => item.customer_id === s.customer_id) || {};
        return {
          "TICKET_ID": s.ticket_id,
          "ISSUE": s.issue,
          "STATUS": s.status,
          "OPEN_DATE": s.open_date,
          "CUSTOMER_NAME": c.name || 'N/A',
          "PHONE": c.phone || 'N/A',
          "EMAIL": c.email || 'N/A'
        };
      });
    }
  },
  {
    name: "Employee Sales Performance & Revenue Aggregation",
    sql: `SELECT 
  E.EMPLOYEE_ID,
  E.EMPLOYEE_NAME,
  E.DEPARTMENT,
  COUNT(O.BOOKING_ID) AS TOTAL_ORDERS,
  NVL(SUM(O.TOTAL_AMOUNT), 0) AS TOTAL_REVENUE
FROM EMPLOYEE E
LEFT JOIN ORDERS O ON E.EMPLOYEE_ID = O.EMPLOYEE_ID
GROUP BY E.EMPLOYEE_ID, E.EMPLOYEE_NAME, E.DEPARTMENT;`,
    execute: (db) => {
      return db.employees.map(e => {
        const empOrders = db.orders.filter(o => o.employee_id === e.employee_id);
        const revenue = empOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        return {
          "EMPLOYEE_ID": e.employee_id,
          "EMPLOYEE_NAME": e.employee_name,
          "DEPARTMENT": e.department,
          "TOTAL_ORDERS": empOrders.length,
          "TOTAL_REVENUE": `$${revenue.toFixed(2)}`
        };
      });
    }
  },
  {
    name: "Product Inventory & Total Sales Volume",
    sql: `SELECT 
  P.PRODUCT_ID,
  P.PRODUCT_NAME,
  P.CATEGORY,
  P.PRICE,
  P.STOCK,
  NVL(SUM(O.QUANTITY), 0) AS UNITS_SOLD,
  NVL(SUM(O.TOTAL_AMOUNT), 0) AS GROSS_SALES
FROM PRODUCT P
LEFT JOIN ORDERS O ON P.PRODUCT_ID = O.PRODUCT_ID
GROUP BY P.PRODUCT_ID, P.PRODUCT_NAME, P.CATEGORY, P.PRICE, P.STOCK;`,
    execute: (db) => {
      return db.products.map(p => {
        const prodOrders = db.orders.filter(o => o.product_id === p.product_id);
        const unitsSold = prodOrders.reduce((sum, o) => sum + Number(o.quantity), 0);
        const grossSales = prodOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        return {
          "PRODUCT_ID": p.product_id,
          "PRODUCT_NAME": p.product_name,
          "CATEGORY": p.category,
          "UNIT_PRICE": `$${Number(p.price).toFixed(2)}`,
          "CURRENT_STOCK": p.stock,
          "UNITS_SOLD": unitsSold,
          "GROSS_SALES": `$${grossSales.toFixed(2)}`
        };
      });
    }
  }
];

function renderSQLHub() {
  // Populate preset dropdown
  const querySelect = document.getElementById('sql-preset-select');
  if (querySelect && querySelect.children.length === 0) {
    PRESET_QUERIES.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = q.name;
      querySelect.appendChild(opt);
    });
  }

  // Load first query by default
  loadSelectedPresetQuery(0);
}

function loadSelectedPresetQuery(idx) {
  const q = PRESET_QUERIES[idx];
  if (!q) return;

  const sqlEditor = document.getElementById('sql-query-display');
  if (sqlEditor) {
    sqlEditor.textContent = q.sql;
  }
  executeActiveQuery(idx);
}

function executeActiveQuery(idx = null) {
  if (idx === null) {
    idx = parseInt(document.getElementById('sql-preset-select').value, 10);
  }
  const q = PRESET_QUERIES[idx];
  if (!q) return;

  const results = q.execute(state.db);
  const resultContainer = document.getElementById('sql-results-container');
  if (!resultContainer) return;

  if (!results || results.length === 0) {
    resultContainer.innerHTML = `<div class="p-6 text-center text-gray-400">Query executed successfully: 0 rows returned.</div>`;
    return;
  }

  const columns = Object.keys(results[0]);

  resultContainer.innerHTML = `
    <div class="mb-3 text-xs text-indigo-400 font-mono flex items-center justify-between">
      <span>Query executed in 0.04 ms. Rows returned: ${results.length}</span>
      <span class="badge badge-completed">STATUS: SUCCESS</span>
    </div>
    <div class="table-container border border-gray-700/60 rounded-lg">
      <table class="custom-table text-xs">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${results.map(row => `
            <tr>
              ${columns.map(col => {
                const val = row[col];
                const isMoney = typeof val === 'string' && val.startsWith('$');
                return `<td class="${isMoney ? 'font-semibold text-emerald-400' : ''}">${escapeHtml(val)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* -------------------------------------------------------------
 * 11. UI MODALS & CONFETTI ENGINE
 * ----------------------------------------------------------- */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  } else {
    iconSvg = `<svg class="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="text-sm font-medium flex-1">${escapeHtml(message)}</div>
    <button class="text-gray-400 hover:text-white" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Lightweight Confetti Animation Engine
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const numberOfPieces = 100;
  const colors = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  for (let i = 0; i < numberOfPieces; i++) {
    pieces.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      w: Math.random() * 8 + 4,
      h: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      gravity: 0.35,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRotation;
      p.opacity -= 0.009;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  update();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('apex_crm_theme', target);
  state.theme = target;
  
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.innerHTML = target === 'dark' 
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
  }

  // Refresh charts with updated theme colors if needed
  if (state.currentView === 'dashboard') renderDashboardCharts();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* -------------------------------------------------------------
 * 12. INITIALIZATION ON PAGE LOAD
 * ----------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Theme init
  const savedTheme = localStorage.getItem('apex_crm_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  state.theme = savedTheme;

  // DB init
  initDB();

  // Navigation Links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Top Search Bar
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (!query) return;
      // If user types in global search, route them to appropriate table or filter
      if (state.currentView !== 'orders' && state.currentView !== 'customers') {
        navigateTo('orders');
      }
      state.filters.orderSearch = query;
      renderOrdersTable();
    });
  }

  // Forms binding
  document.getElementById('form-customer')?.addEventListener('submit', saveCustomer);
  document.getElementById('form-employee')?.addEventListener('submit', saveEmployee);
  document.getElementById('form-product')?.addEventListener('submit', saveProduct);
  document.getElementById('form-order')?.addEventListener('submit', saveOrder);
  document.getElementById('form-payment')?.addEventListener('submit', savePayment);
  document.getElementById('form-support')?.addEventListener('submit', saveSupportTicket);

  // Dynamic price calculation on Order modal inputs
  document.getElementById('order-prod-id')?.addEventListener('change', updateOrderPriceCalc);
  document.getElementById('order-qty')?.addEventListener('input', updateOrderPriceCalc);

  // Search & Filter listeners
  document.getElementById('customer-search-input')?.addEventListener('input', (e) => {
    state.filters.customerSearch = e.target.value;
    renderCustomersTable();
  });

  document.getElementById('employee-search-input')?.addEventListener('input', (e) => {
    state.filters.employeeSearch = e.target.value;
    renderEmployeesTable();
  });
  document.getElementById('employee-dept-filter')?.addEventListener('change', (e) => {
    state.filters.employeeDept = e.target.value;
    renderEmployeesTable();
  });

  document.getElementById('product-search-input')?.addEventListener('input', (e) => {
    state.filters.productSearch = e.target.value;
    renderProductsTable();
  });
  document.getElementById('product-category-filter')?.addEventListener('change', (e) => {
    state.filters.productCategory = e.target.value;
    renderProductsTable();
  });

  document.getElementById('order-search-input')?.addEventListener('input', (e) => {
    state.filters.orderSearch = e.target.value;
    renderOrdersTable();
  });

  document.getElementById('payment-search-input')?.addEventListener('input', (e) => {
    state.filters.paymentSearch = e.target.value;
    renderPaymentsTable();
  });
  document.getElementById('payment-status-filter')?.addEventListener('change', (e) => {
    state.filters.paymentStatus = e.target.value;
    renderPaymentsTable();
  });

  document.getElementById('support-search-input')?.addEventListener('input', (e) => {
    state.filters.supportSearch = e.target.value;
    renderSupportTable();
  });
  document.getElementById('support-status-filter')?.addEventListener('change', (e) => {
    state.filters.supportStatus = e.target.value;
    renderSupportTable();
  });

  document.getElementById('sql-preset-select')?.addEventListener('change', (e) => {
    loadSelectedPresetQuery(parseInt(e.target.value, 10));
  });

  // Close modals on escape key or clicking overlay
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Initial View Render
  navigateTo('dashboard');
});
