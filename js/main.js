// ============================================
// PGN UTD — main.js
// ============================================

// Portal credentials
// Change these to whatever you want
const PORTAL_PASSWORD = "pgnutd2025";

// ── Portal Login ─────────────────────────────

function attemptLogin() {
  const pass = document.getElementById('portal-pass').value;
  const err = document.getElementById('portal-error');

  if (pass === PORTAL_PASSWORD) {
    document.getElementById('portal-gate').style.display = 'none';
    document.getElementById('portal-content').style.display = 'block';
    err.classList.remove('show');
  } else {
    err.classList.add('show');
  }
}

function logout() {
  document.getElementById('portal-gate').style.display = 'grid';
  document.getElementById('portal-content').style.display = 'none';
  document.getElementById('portal-pass').value = '';
}

// ── Portal Tabs ──────────────────────────────

function switchTab(btn, tabId) {
  document.querySelectorAll('.portal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.portal-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ── Lineage Accordion ────────────────────────

function toggleClass(header) {
  const members = header.nextElementSibling;
  const toggle = header.querySelector('.class-toggle');
  const isOpen = members.classList.toggle('open');
  toggle.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

// ── Interest Form ────────────────────────────

function handleSubmit() {
  const btn = document.querySelector('.submit-btn');
  const confirm = document.getElementById('submit-confirm');
  btn.style.display = 'none';
  confirm.style.display = 'block';
}

// ── Event Listeners ──────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  // Allow pressing Enter in the portal password field
  const passField = document.getElementById('portal-pass');
  if (passField) {
    passField.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attemptLogin();
    });
  }
});
