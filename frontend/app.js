// ─────────────────────────────
// SplitRecord — app.js
// ─────────────────────────────

const API = 'https://easysplit-backend-vmph.onrender.com/api';
let currentGroupId        = null;
let currentGroupCreatorId = null;
let currentGroupMembers   = [];
let currentMemberCount    = 0;
let currentExpenses       = []; // cache for pay panel

// ── Helpers ──

const getToken = () => localStorage.getItem('token');
const getUser  = () => {
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  return { ...u, id: u.id || u._id };
};
const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Panel helpers ──

function closeAllPanels() {
  ['create-group-panel','add-member-panel','remove-member-panel','add-expense-panel','pay-panel']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
}
function openCreateGroup() {
  closeAllPanels();
  document.getElementById('create-group-panel').style.display = 'block';
}
function closeCreateGroup() {
  document.getElementById('create-group-panel').style.display = 'none';
  document.getElementById('group-name').value = '';
  clearError('create-group-error');
}
function openAddMember() {
  closeAllPanels();
  document.getElementById('add-member-panel').style.display = 'block';
}
function closeAddMember() {
  document.getElementById('add-member-panel').style.display = 'none';
  document.getElementById('member-username').value = '';
  clearError('add-member-error');
}
function openRemoveMember() {
  closeAllPanels();
  document.getElementById('remove-member-panel').style.display = 'block';
}
function closeRemoveMember() {
  document.getElementById('remove-member-panel').style.display = 'none';
  document.getElementById('remove-member-username').value = '';
  clearError('remove-member-error');
}
function openAddExpense() {
  closeAllPanels();
  document.getElementById('add-expense-panel').style.display = 'block';
}
function closeAddExpense() {
  document.getElementById('add-expense-panel').style.display = 'none';
  document.getElementById('expense-desc').value = '';
  document.getElementById('expense-amount').value = '';
  clearError('add-expense-error');
}
function closePayPanel() {
  document.getElementById('pay-panel').style.display = 'none';
  clearError('pay-error');
}

// ── AUTH ──

async function login() {
  clearError('login-error');

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;

  if (!email)    return showError('login-error', 'Email is required');
  if (!password) return showError('login-error', 'Password is required');

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return showError('login-error', data.msg || 'Invalid email or password');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('flash', 'login');
    window.location.href = 'dashboard.html';
  } catch {
    showError('login-error', 'Server not reachable. Please try again.');
  }
}

async function signup() {
  clearError('signup-error');

  const username   = document.getElementById('signup-username').value.trim();
  const email      = document.getElementById('signup-email').value.trim();
  const password   = document.getElementById('signup-pass').value;
  const confirm    = document.getElementById('signup-confirm').value;
  const secretCode = document.getElementById('signup-code').value.trim();

  // ── clear all field errors first ──
  ['err-username','err-email','err-password','err-confirm','err-code'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  let hasError = false;

  function fieldErr(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
    hasError = true;
  }

  // ── Username ──
  if (!username) {
    fieldErr('err-username', 'Username is required');
  } else if (username.length < 3) {
    fieldErr('err-username', 'Username must be at least 3 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    fieldErr('err-username', 'Only letters, numbers, and underscores allowed');
  }

  // ── Email ──
  if (!email) {
    fieldErr('err-email', 'Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErr('err-email', 'Enter a valid email address (e.g. name@domain.com)');
  }

  // ── Password ──
  if (!password) {
    fieldErr('err-password', 'Password is required');
  } else {
    const pwErrors = [];
    if (password.length < 8)                                          pwErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(password))                                      pwErrors.push('1 uppercase letter');
    if (!/[a-z]/.test(password))                                      pwErrors.push('1 lowercase letter');
    if (!/[0-9]/.test(password))                                      pwErrors.push('1 number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))    pwErrors.push('1 special character');
    if (pwErrors.length) fieldErr('err-password', `Password needs: ${pwErrors.join(', ')}`);
  }

  // ── Confirm password ──
  if (!confirm) {
    fieldErr('err-confirm', 'Please confirm your password');
  } else if (confirm !== password) {
    fieldErr('err-confirm', 'Passwords do not match');
  }

  // ── Secret code ──
  if (!secretCode) {
    fieldErr('err-code', 'Invite code is required');
  }

  if (hasError) return;

  // ── All good — send to server ──
  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, secretCode })
    });
    const data = await res.json();
    if (!res.ok) {
      // map server errors back to the right field
      const msg = data.msg || 'Signup failed';
      // backend sends "Username/email already exist" — split into per-field messages
      if (msg.toLowerCase().includes('username') && msg.toLowerCase().includes('email')) {
        fieldErr('err-username', 'Username already exist');
        fieldErr('err-email',    'Email already exist');
      } else if (msg.toLowerCase().includes('username')) {
        fieldErr('err-username', 'Username already exist');
      } else if (msg.toLowerCase().includes('email')) {
        fieldErr('err-email', 'Email already exist');
      } else if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('secret')) {
        fieldErr('err-code', 'Invalid invite code');
      } else {
        showError('signup-error', msg);
      }
      return;
    }
    localStorage.setItem('flash', 'signup');
    window.location.href = 'index.html';
  } catch { showError('signup-error', 'Server not reachable'); }
}

function logout() {
  localStorage.setItem('flash', 'logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ── GROUPS ──

async function loadGroups() {
  try {
    const res    = await fetch(`${API}/groups`, { headers: authHeader() });
    const groups = await res.json();
    if (!res.ok) return;

    const list = document.getElementById('groups-list');
    if (!groups.length) {
      list.innerHTML = '<p class="empty-state">No groups yet. Create one!</p>';
      return;
    }

    const user = getUser();
    list.innerHTML = groups.map(g => {
      const creatorId = g.creator?._id || g.creator || '';
      const isCreator = creatorId.toString() === user.id;
      return `
        <div class="group-item ${currentGroupId === g._id ? 'active' : ''}"
             data-group-id="${g._id}"
             onclick="selectGroup('${g._id}','${g.name}','${creatorId}',this)">
          <div class="group-move-btns">
            <button class="btn-move" onclick="event.stopPropagation();moveGroup('${g._id}','up')" title="Move up">▲</button>
            <button class="btn-move" onclick="event.stopPropagation();moveGroup('${g._id}','down')" title="Move down">▼</button>
          </div>
          <div class="group-item-info">
            <span class="group-name">${g.name}</span>
            <span class="group-meta">${g.members.length} member${g.members.length !== 1 ? 's' : ''}</span>
          </div>
          ${isCreator ? `<button class="btn-danger-sm" onclick="event.stopPropagation();deleteGroup('${g._id}')" title="Delete">🗑</button>` : ''}
        </div>`;
    }).join('');
  } catch (err) { console.error(err); }
}

async function moveGroup(groupId, direction) {
  try {
    const res    = await fetch(`${API}/groups`, { headers: authHeader() });
    const groups = await res.json();
    if (!res.ok) return;

    const list    = document.getElementById('groups-list');
    const items   = Array.from(list.querySelectorAll('.group-item'));
    const index   = items.findIndex(el => el.dataset.groupId === groupId);
    if (index === -1) return;

    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    // swap in DOM
    if (direction === 'up') {
      list.insertBefore(items[index], items[target]);
    } else {
      list.insertBefore(items[target], items[index]);
    }
  } catch (err) { console.error(err); }
}

async function selectGroup(id, name, creatorId, el) {
  // ✅ Set ID first so all subsequent calls use the correct group
  currentGroupId        = id;
  currentGroupCreatorId = creatorId;
  currentGroupMembers   = [];
  currentMemberCount    = 0;
  currentExpenses       = [];
  closeAllPanels();

  // ✅ Clear stale UI immediately before any async work
  document.getElementById('no-group-msg').style.display  = 'none';
  document.getElementById('group-detail').style.display  = 'block';
  document.getElementById('group-title').textContent     = name;
  document.getElementById('group-members-count').textContent = '...';
  document.getElementById('expenses-list').innerHTML     = '<p class="empty-state">Loading...</p>';
  document.getElementById('total-amount').textContent    = 'RM 0.00';
  document.getElementById('total-remaining').textContent = 'RM 0.00';
  const paidEl = document.getElementById('total-paid-block');
  if (paidEl) paidEl.innerHTML = '<div class="summary-value">RM 0.00</div><div class="paid-breakdown-empty">No payments yet</div>';
  const membersList = document.getElementById('members-list');
  if (membersList) membersList.innerHTML = '';

  document.querySelectorAll('.group-item').forEach(e => e.classList.remove('active'));
  if (el) el.classList.add('active');

  // fetch full group for member list
  try {
    const res    = await fetch(`${API}/groups`, { headers: authHeader() });
    const groups = await res.json();
    const group  = groups.find(g => g._id === id);
    currentGroupMembers = group ? group.members : [];
    currentMemberCount  = currentGroupMembers.length;
  } catch { currentGroupMembers = []; currentMemberCount = 0; }

  document.getElementById('group-members-count').textContent =
    `${currentMemberCount} member${currentMemberCount !== 1 ? 's' : ''}`;

  const user      = getUser();
  const isCreator = creatorId && creatorId.toString() === user.id;
  const btnMember = document.getElementById('btn-add-member');
  if (btnMember) btnMember.style.display = isCreator ? 'inline-flex' : 'none';
  const btnRemove = document.getElementById('btn-remove-member');
  if (btnRemove) btnRemove.style.display = isCreator ? 'inline-flex' : 'none';

  loadExpenses();
  loadMembers();
}

async function deleteGroup(groupId) {
  if (!confirm('Delete this group and all its expenses?')) return;
  try {
    const res  = await fetch(`${API}/groups/${groupId}`, { method: 'DELETE', headers: authHeader() });
    const data = await res.json();
    if (!res.ok) return showToast(data.msg, 'error');
    if (currentGroupId === groupId) {
      currentGroupId = null;
      document.getElementById('group-detail').style.display = 'none';
      document.getElementById('no-group-msg').style.display = 'flex';
    }
    showToast('Group deleted');
    loadGroups();
  } catch { showToast('Delete failed', 'error'); }
}

async function createGroup() {
  clearError('create-group-error');
  const name = document.getElementById('group-name').value.trim();
  if (!name) return showError('create-group-error', 'Group name required');
  try {
    const res  = await fetch(`${API}/groups`, {
      method: 'POST', headers: authHeader(), body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) return showError('create-group-error', data.msg);
    closeCreateGroup();
    showToast(`"${name}" created!`);
    await loadGroups();
    const creatorId = data.creator?._id || data.creator || '';
    selectGroup(data._id, data.name, creatorId, null);
  } catch { showError('create-group-error', 'Server error'); }
}

// ── MEMBERS ──

async function addMember() {
  clearError('add-member-error');
  const username = document.getElementById('member-username').value.trim();
  if (!username) return showError('add-member-error', 'Enter username');
  try {
    const res  = await fetch(`${API}/groups/${currentGroupId}/members`, {
      method: 'POST', headers: authHeader(), body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok) return showError('add-member-error', data.msg);
    currentGroupMembers = data.members;
    currentMemberCount  = data.members.length;
    closeAddMember();
    document.getElementById('group-members-count').textContent =
      `${data.members.length} member${data.members.length !== 1 ? 's' : ''}`;
    showToast(`${username} added!`);
    loadGroups();
    loadMembers();
  } catch { showError('add-member-error', 'Server error'); }
}

async function removeMember(userId, username) {
  if (!confirm(`Remove ${username}?`)) return;
  try {
    const res  = await fetch(`${API}/groups/${currentGroupId}/members/${userId}`, {
      method: 'DELETE', headers: authHeader()
    });
    const data = await res.json();
    if (!res.ok) return showToast(data.msg, 'error');
    currentGroupMembers = data.members;
    currentMemberCount  = data.members.length;
    document.getElementById('group-members-count').textContent =
      `${data.members.length} members`;
    showToast(`${username} removed`);
    loadGroups();
    loadMembers();
  } catch { showToast('Failed', 'error'); }
}

// ── REMOVE MEMBER BY USERNAME ──

async function removeMemberByUsername() {
  clearError('remove-member-error');
  const username = document.getElementById('remove-member-username').value.trim();
  if (!username) return showError('remove-member-error', 'Enter a username');

  // find the member in current group
  const member = currentGroupMembers.find(
    m => (m.username || '').toLowerCase() === username.toLowerCase()
  );

  if (!member) {
    return showError('remove-member-error', 'User not found in this group');
  }

  const mid = member._id || member;
  const user = getUser();
  if (mid.toString() === user.id) {
    return showError('remove-member-error', "You can't remove yourself");
  }

  if (!confirm(`Remove ${member.username} from this group?`)) return;

  try {
    const res  = await fetch(`${API}/groups/${currentGroupId}/members/${mid}`, {
      method: 'DELETE', headers: authHeader()
    });
    const data = await res.json();
    if (!res.ok) return showError('remove-member-error', data.msg);

    currentGroupMembers = data.members;
    currentMemberCount  = data.members.length;
    document.getElementById('group-members-count').textContent =
      `${data.members.length} member${data.members.length !== 1 ? 's' : ''}`;
    closeRemoveMember();
    showToast(`${member.username} removed`);
    loadGroups();
    loadMembers(); 
  } catch { showError('remove-member-error', 'Server error'); }
}

// ── MEMBERS LIST ──

function loadMembers() {
  const list = document.getElementById('members-list');
  if (!list) return; // element not on this page — safe exit

  const user      = getUser();
  const isCreator = currentGroupCreatorId && currentGroupCreatorId.toString() === user.id;

  if (!currentGroupMembers.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = currentGroupMembers.map(m => {
    const mid    = m._id || m;
    const mname  = m.username || 'Member';
    const isMe   = mid.toString() === user.id;
    const isCreatorMember = mid.toString() === currentGroupCreatorId;

    return `
      <div class="member-chip">
        <span class="member-chip-avatar">${mname[0].toUpperCase()}</span>
        <span class="member-chip-name">${mname}${isMe ? ' <em>(you)</em>' : ''}${isCreatorMember ? ' 👑' : ''}</span>
        ${isCreator && !isMe ? `
          <button class="member-chip-remove" onclick="removeMember('${mid}','${mname}')" title="Remove ${mname}">✕</button>
        ` : ''}
      </div>`;
  }).join('');
}

// ── EXPENSES ──

async function addExpense() {
  clearError('add-expense-error');
  const description = document.getElementById('expense-desc').value.trim();
  const amount      = Number(document.getElementById('expense-amount').value);
  if (!description) return showError('add-expense-error', 'Description required');
  if (!amount || amount <= 0) return showError('add-expense-error', 'Invalid amount');
  try {
    const res  = await fetch(`${API}/expenses`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ groupId: currentGroupId, description, amount })
    });
    const data = await res.json();
    if (!res.ok) return showError('add-expense-error', data.msg);
    closeAddExpense();
    showToast('Expense added!');
    loadExpenses();
  } catch { showError('add-expense-error', 'Server error'); }
}

async function loadExpenses() {
  try {
    const res      = await fetch(`${API}/expenses/group/${currentGroupId}`, { headers: authHeader() });
    if (!res.ok) return;
    const expenses = await res.json();
    currentExpenses = expenses;

    const list = document.getElementById('expenses-list');
    const user = getUser();

    if (!expenses.length) {
  list.innerHTML = '<p class="empty-state">No expenses yet. Add one!</p>';

  document.getElementById('total-amount').textContent = 'RM 0.00';
  document.getElementById('total-remaining').textContent = 'RM 0.00';

  // ✅ IMPORTANT FIX: reset BOTH paid UI containers safely
  const paidBlock = document.getElementById('total-paid-block');
  if (paidBlock) {
    paidBlock.innerHTML = `
      <div class="summary-value">RM 0.00</div>
      <div class="paid-breakdown-empty">No payments yet</div>
    `;
  }

  currentExpenses = [];

  return;
}

    // ── Summary totals ──
    const totalAmt  = expenses.reduce((s, e) => s + e.amount, 0);
    const totalPaid = expenses.reduce((s, e) => s + e.totalPaid, 0);

    document.getElementById('total-amount').textContent    = `RM ${totalAmt.toFixed(2)}`;
    document.getElementById('total-remaining').textContent = `RM ${(totalAmt - totalPaid).toFixed(2)}`;

    // ── Per-user paid breakdown ──
    const userTotals = {}; // { username: totalPaid }
    expenses.forEach(e => {
      e.payments.forEach(p => {
        if (!userTotals[p.username]) userTotals[p.username] = 0;
        userTotals[p.username] = Number((userTotals[p.username] + p.amount).toFixed(2));
      });
    });

    const paidEl = document.getElementById('total-paid-block');
    const entries = Object.entries(userTotals);
    if (paidEl) {
      paidEl.innerHTML = `
        <div class="summary-value">RM ${totalPaid.toFixed(2)}</div>
        ${entries.length ? `
          <div class="paid-breakdown">
            ${entries.map(([uname, amt]) => `
              <div class="paid-breakdown-row">
                <span class="paid-breakdown-avatar">${uname[0].toUpperCase()}</span>
                <span class="paid-breakdown-name">${uname}</span>
                <span class="paid-breakdown-amt">RM ${amt.toFixed(2)}</span>
              </div>`).join('')}
          </div>` : '<div class="paid-breakdown-empty">No payments yet</div>'}
      `;
    }

    list.innerHTML = expenses.map(e => {
      const remaining  = Number((e.amount - e.totalPaid).toFixed(2));
      const isSettled  = remaining <= 0;
      const addedBy    = e.addedBy?.username || 'Unknown';
      const isAdder    = (e.addedBy?._id || e.addedBy) === user.id;
      const date       = new Date(e.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

      // payment rows
      const paymentRows = e.payments.length
        ? e.payments.map(p => `
            <div class="payment-row">
              <span class="payment-row-user">💳 ${p.username}</span>
              <span class="payment-row-amount">RM ${p.amount.toFixed(2)}</span>
            </div>`).join('')
        : '<div class="payment-row-empty">No payments yet</div>';

      // my payment toward this expense
      const myPayment  = e.payments.find(p => p.userId === user.id || p.userId?.toString() === user.id);
      const iCanPay    = !isSettled;

      return `
        <div class="expense-card ${isSettled ? 'expense-settled' : ''}">
          <div class="expense-card-header">
            <div>
              <span class="expense-card-desc">${e.description}</span>
              <span class="expense-card-meta">Added by ${addedBy} · ${date}</span>
            </div>
            <div class="expense-card-right">
              <span class="expense-card-amount">RM ${e.amount.toFixed(2)}</span>
              ${isAdder ? `<button class="btn-delete" onclick="deleteExpense('${e._id}')" title="Delete">×</button>` : ''}
            </div>
          </div>

          <div class="expense-progress-wrap">
            <div class="expense-progress-bar">
              <div class="expense-progress-fill" style="width:${Math.min((e.totalPaid/e.amount)*100,100).toFixed(1)}%"></div>
            </div>
            <span class="expense-progress-label">
              ${isSettled
                ? '<span class="badge-settled">✓ Fully paid</span>'
                : `RM ${e.totalPaid.toFixed(2)} paid · RM ${remaining.toFixed(2)} remaining`}
            </span>
          </div>

          <div class="expense-payments">
            <div class="expense-payments-title">Payment breakdown</div>
            ${paymentRows}
          </div>

          ${iCanPay ? `
            <button class="btn-pay-expense" onclick="openPayPanel('${e._id}','${e.description}',${remaining})">
              + Record my payment
            </button>` : ''}
        </div>`;
    }).join('');
  } catch (err) { console.error(err); }
}

async function deleteExpense(expenseId) {
  if (!confirm('Delete this expense?')) return;
  try {
    const res  = await fetch(`${API}/expenses/${expenseId}`, { method: 'DELETE', headers: authHeader() });
    const data = await res.json();
    if (!res.ok) { showToast(data.msg, 'error'); return; }
    showToast('Expense deleted');
    loadExpenses();
  } catch { showToast('Delete failed', 'error'); }
}

// ── PAY PANEL ──

function openPayPanel(expenseId, description, remaining) {
  closeAllPanels();
  document.getElementById('pay-expense-id').value          = expenseId;
  document.getElementById('pay-expense-label').textContent = `"${description}"`;
  document.getElementById('pay-remaining-label').textContent = `RM ${Number(remaining).toFixed(2)} remaining`;
  document.getElementById('pay-amount').value              = '';
  document.getElementById('pay-amount').max                = remaining;
  clearError('pay-error');
  document.getElementById('pay-panel').style.display = 'block';
  document.getElementById('pay-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function recordPayment() {
  clearError('pay-error');
  const expenseId = document.getElementById('pay-expense-id').value;
  const amount    = Number(document.getElementById('pay-amount').value);
  if (!amount || amount <= 0) return showError('pay-error', 'Enter a valid amount');
  try {
    const res  = await fetch(`${API}/expenses/${expenseId}/pay`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (!res.ok) return showError('pay-error', data.msg);
    closePayPanel();
    showToast(`Payment of RM ${amount.toFixed(2)} recorded!`);
    loadExpenses();
  } catch { showError('pay-error', 'Server error'); }
}

// ── TABS ──

function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}
