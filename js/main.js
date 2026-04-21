// ============================================
// PGN UTD — main.js
// ============================================

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
      if (e.key === 'Enter') window.attemptLogin();
    });
  }
});