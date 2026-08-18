// ML-DSA-44 Visualizer — Frontend Application
// All crypto computations are performed by the FastAPI backend.
// This file handles UI, API calls, and rendering only.

const API = '';   // same origin — backend serves this file

// ── State ────────────────────────────────────────────────────────────────
const STATE = { 
  rho: null, rhop: null, K: null,
  // Signing state
  tr: null, message: null, mu: null, rhodouble: null,
  y: null, w1: null, ctilde: null, c: null, z: null, h: null,
  // Verification state
  verif_mu: null, verif_c: null, verif_wprime: null,
  verif_w1prime: null, verif_w1_for_verif: null, verif_ctilde_prime: null
};

// ── Utilities ────────────────────────────────────────────────────────────
function hexShort(hex, len = 16) {
  return hex.length <= len * 2 ? hex : hex.slice(0, len * 2) + '…';
}

function setStatus(msg, type = 'loading') {
  const el = document.getElementById('api-status');
  el.textContent = msg;
  el.className = type;
}

async function apiFetch(path, body = null) {
  setStatus('fetching…', 'loading');
  try {
    const opts = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method: 'POST' };
    const res = await fetch(API + path, opts);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    setStatus('✓ ok', 'ok');
    return data;
  } catch (e) {
    setStatus('✗ error', 'err');
    console.error(path, e);
    throw e;
  }
}

// ── Zoom ─────────────────────────────────────────────────────────────────
let zoomLevel = 140;
function zoom(dir) {
  if (dir === 0) zoomLevel = 140;
  else zoomLevel = Math.min(200, Math.max(70, zoomLevel + dir * 10));
  document.body.style.fontSize = (zoomLevel / 100) + 'em';
  document.getElementById('zoom-label').textContent = zoomLevel + '%';
}

// ── Show and slide-in a main panel section, then scroll to it ─────────────
function scrollToMP(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const content = document.getElementById('mp-content');
  if (!content) return;

  // Ensure main panel is visible (not collapsed)
  const mp = document.getElementById('mainpanel');
  if (mp && mp.classList.contains('collapsed')) {
    mp.classList.remove('collapsed');
    document.getElementById('sidebar').classList.remove('expanded');
    const btn = document.getElementById('mainpanel-toggle');
    if (btn) btn.textContent = '▶';
  }

  // Make visible and expanded
  el.style.display = 'block';
  el.classList.remove('collapsed');

  // Slide-in animation
  el.classList.remove('mp-slide-in');
  void el.offsetWidth;
  el.classList.add('mp-slide-in');

  // Scroll: gather offsetTop relative to mp-content by walking up
  // We do this in a setTimeout to ensure the element is painted first
  setTimeout(() => {
    let top = 0;
    let node = el;
    while (node && node !== content) {
      top += node.offsetTop;
      node = node.offsetParent;
      // offsetParent chain can jump past mp-content, cap it
      if (!node || node === document.body) { top = el.offsetTop; break; }
    }
    content.scrollTo({ top: Math.max(0, top - 10), behavior: 'smooth' });
  }, 50);
}

// ── Panel collapse ────────────────────────────────────────────────────────
function toggleSidebar() {
  const sb  = document.getElementById('sidebar');
  const mp  = document.getElementById('mainpanel');
  const btn = document.getElementById('sidebar-toggle');
  const collapsed = sb.classList.toggle('collapsed');
  mp.classList.toggle('expanded', collapsed);
  btn.textContent = collapsed ? '▶' : '◀';
}

function toggleMainPanel() {
  const mp  = document.getElementById('mainpanel');
  const sb  = document.getElementById('sidebar');
  const btn = document.getElementById('mainpanel-toggle');
  const collapsed = mp.classList.toggle('collapsed');
  sb.classList.toggle('expanded', collapsed);
  btn.textContent = collapsed ? '◀' : '▶';
}

// ── Section collapse ──────────────────────────────────────────────────────
function toggleSection(header) {
  header.parentElement.classList.toggle('collapsed');
}
function toggleMPSection(header) {
  header.parentElement.classList.toggle('collapsed');
}

// ── Poly column renderer ──────────────────────────────────────────────────
function renderPolyColumns(container, polys, coeffColor, footerFn) {
  container.innerHTML = '';
  polys.forEach((poly) => {
    const col = document.createElement('div');
    col.className = 'poly-col';

    const hdr = document.createElement('div');
    hdr.className = 'poly-col-header';
    hdr.textContent = poly.label;
    col.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'poly-col-body';
    poly.coeffs.forEach((v, ci) => {
      const row = document.createElement('div');
      row.className = 'poly-coeff';
      row.style.color = coeffColor(v);
      row.innerHTML = `<span class="ci">${ci}</span>${v}`;
      body.appendChild(row);
    });
    col.appendChild(body);

    const ftr = document.createElement('div');
    ftr.className = 'poly-col-footer';
    ftr.innerHTML = footerFn(poly);
    col.appendChild(ftr);

    container.appendChild(col);
  });
}

function matrixAColor(v) {
  const r = v / 8380416;
  if (r < 0.33) return '#1d4ed8';
  if (r < 0.66) return '#0e7490';
  return '#b91c1c';
}

function secretColor(v) {
  if (v === 0)  return '#94a3b8';
  if (Math.abs(v) === 2) return '#b91c1c';
  return '#15803d';
}

function tColor(v) {
  const r = v / 8380416;
  if (r < 0.33) return '#1d4ed8';
  if (r < 0.66) return '#92400e';
  return '#b91c1c';
}

function t1Color(v) { return v / 1023 < 0.5 ? '#15803d' : '#92400e'; }
function t0Color(v) { return v / 8191  < 0.5 ? '#0e7490' : '#9a3412'; }

// ── API calls & rendering ─────────────────────────────────────────────────

async function runKeyGen() {
  const btn = document.getElementById('btn-keygen');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating…';

  try {
    const data = await apiFetch('/api/keygen/seed');

    STATE.rho  = data.rho;
    STATE.rhop = data.rhop;
    STATE.K    = data.K;

    // Sidebar
    document.getElementById('out-seeds').innerHTML = `
      <div>ξ: <span style="color:#38bdf8">${hexShort(data.xi, 32)}</span></div>
      <div style="margin-top:4px">ρ: <span style="color:#4ade80">${data.rho}</span></div>
      <div style="margin-top:4px">ρ′: <span style="color:#fb923c">${data.rhop}</span></div>
      <div style="margin-top:4px">K: <span style="color:#c4b5fd">${data.K}</span></div>`;

    // Main panel
    document.getElementById('mp-xi').textContent   = hexShort(data.xi, 32);
    document.getElementById('mp-rho').textContent  = data.rho;
    document.getElementById('mp-rhop').textContent = data.rhop;
    document.getElementById('mp-K').textContent    = data.K;
    document.getElementById('mp-seeds').style.display = 'block';
    document.getElementById('mp-empty').style.display = 'none';
    scrollToMP('mp-seeds');

    document.getElementById('out-pk').textContent = '[ Run all steps to complete ]';
    document.getElementById('out-sk').textContent = '[ Run all steps to complete ]';

    // Reset downstream
    ['btn-matA'].forEach(id => document.getElementById(id).disabled = false);
    ['btn-secrets','btn-t','btn-p2r'].forEach(id => document.getElementById(id).disabled = true);
    ['mp-matA-section','mp-secrets-section','mp-t-section','mp-keys-section']
      .forEach(id => document.getElementById(id).style.display = 'none');
    // Reset signing chain
    ['btn-start-sign','btn-mu','btn-rhodouble','btn-y','btn-w','btn-ctilde','btn-c','btn-z','btn-check','btn-h','btn-sig']
      .forEach(id => { const el=document.getElementById(id); if(el) el.disabled=(id!=='btn-start-sign'); });
    document.getElementById('btn-start-sign').disabled = false;

    btn.textContent = '✓ Re-run Key Generation';
  } catch(e) {
    btn.textContent = '✗ Error — retry';
  }
  btn.disabled = false;
}

async function generateMatrixA() {
  const btn = document.getElementById('btn-matA');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating…';

  try {
    const data = await apiFetch('/api/keygen/matrix-a', { rho: STATE.rho });

    // Sidebar compact
    let html = '';
    for (let i = 0; i < 4; i++) {
      html += `<div style="color:#7dd3fc;font-size:0.8em;margin-bottom:4px">Row ${i}:</div>`;
      data.polys.filter((_,idx) => Math.floor(idx/4) === i).forEach(p => {
        html += `<div style="margin-bottom:2px"><span style="color:#64748b">${p.label}:</span> [${p.coeffs.slice(0,6).join(', ')} …] <span style="color:#fbbf24">max=${p.max}</span></div>`;
      });
    }
    document.getElementById('out-matA').innerHTML = html;

    // Main panel
    renderPolyColumns(
      document.getElementById('mp-matA-grid'),
      data.polys,
      matrixAColor,
      p => `max: ${p.max}<br/>min: ${p.min}<br/>256 coeffs`
    );
    document.getElementById('mp-matA-size').innerHTML =
      `${data.size_note}`;
    document.getElementById('mp-matA-section').style.display = 'block';
    document.getElementById('mp-empty').style.display = 'none';
    scrollToMP('mp-matA-section');
    document.getElementById('btn-secrets').disabled = false;
    btn.textContent = '✓ Matrix A Generated';
  } catch(e) {
    btn.textContent = '✗ Error';
  }
  btn.disabled = false;
}

async function showSecrets() {
  const btn = document.getElementById('btn-secrets');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sampling…';

  try {
    const data = await apiFetch('/api/keygen/secrets', { rhop: STATE.rhop });

    // Sidebar
    let h1 = '', h2 = '';
    data.s1.forEach(p => h1 += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:4px">${p.label}: [${p.coeffs.slice(0,20).join(', ')} …]</div>`);
    data.s2.forEach(p => h2 += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:4px">${p.label}: [${p.coeffs.slice(0,20).join(', ')} …]</div>`);
    document.getElementById('out-s1').innerHTML = h1;
    document.getElementById('out-s2').innerHTML = h2;

    // Main panel
    const sfn = p => {
      const d = Object.entries(p.distribution).map(([k,v])=>`${k}:${v}`).join(' ');
      return d + `<br/>${p.size_bytes} bytes`;
    };
    renderPolyColumns(document.getElementById('mp-s1-grid'), data.s1, secretColor, sfn);
    renderPolyColumns(document.getElementById('mp-s2-grid'), data.s2, secretColor, sfn);
    document.getElementById('mp-secrets-section').style.display = 'block';
    scrollToMP('mp-secrets-section');
    document.getElementById('btn-t').disabled = false;
    btn.textContent = '✓ Secrets Generated';
  } catch(e) {
    btn.textContent = '✗ Error';
  }
  btn.disabled = false;
}

async function showT() {
  const btn = document.getElementById('btn-t');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';

  try {
    const data = await apiFetch('/api/keygen/compute-t', { rho: STATE.rho, rhop: STATE.rhop });

    // Sidebar
    const toHtml = (polys) => polys.map(p =>
      `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,8).join(', ')} …]</div>`
    ).join('');
    document.getElementById('out-As1').innerHTML = toHtml(data.As1);
    document.getElementById('out-t').innerHTML   = toHtml(data.t);

    // Main panel
    renderPolyColumns(document.getElementById('mp-t-grid'),  data.t,  tColor,  p => `max: ${p.max}<br/>256 coeffs`);
    document.getElementById('mp-t-section').style.display = 'block';
    scrollToMP('mp-t-section');
    document.getElementById('btn-p2r').disabled = false;
    btn.textContent = '✓ t Computed';
  } catch(e) {
    btn.textContent = '✗ Error';
  }
  btn.disabled = false;
}

async function showPower2Round() {
  const btn = document.getElementById('btn-p2r');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Splitting…';

  try {
    const data = await apiFetch('/api/keygen/compute-t', { rho: STATE.rho, rhop: STATE.rhop });

    const toHtml = (polys) => polys.map(p =>
      `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,8).join(', ')} …]</div>`
    ).join('');
    document.getElementById('out-t1').innerHTML = toHtml(data.t1);
    document.getElementById('out-t0').innerHTML = toHtml(data.t0);

    renderPolyColumns(document.getElementById('mp-t1-grid'), data.t1, t1Color, p => `max: ${p.max}<br/>${p.size_bytes} bytes`);
    renderPolyColumns(document.getElementById('mp-t0-grid'), data.t0, t0Color, p => `max: ${p.max}<br/>${p.size_bytes} bytes`);

    // Keys
    const keys = await apiFetch('/api/keygen/keys', { rho: STATE.rho, rhop: STATE.rhop, K: STATE.K });
    document.getElementById('out-pk').textContent = keys.pk_hex;
    document.getElementById('out-sk').textContent = keys.sk_hex;
    document.getElementById('mp-keys-section').style.display = 'block';
    scrollToMP('mp-keys-section');
    btn.textContent = '✓ Power2Round Done';
  } catch(e) {
    btn.textContent = '✗ Error';
  }
  btn.disabled = false;
}

function yColor(v) {
  const r = Math.abs(v) / 131072;
  if (r < 0.33) return '#1d4ed8';
  if (r < 0.66) return '#0e7490';
  return '#b91c1c';
}
function wColor(v) { return tColor(v); }
function zColor(v) {
  const r = Math.abs(v) / 131072;
  if (r < 0.33) return '#15803d';
  if (r < 0.66) return '#92400e';
  return '#b91c1c';
}
function cColor(v) {
  if (v === 0)   return '#cbd5e0';
  if (v === 1)   return '#15803d';
  return '#b91c1c';
}

// ── Helper: enable/disable signing button chain ──────────────────────────
function sigBtn(id, enabled) {
  const el = document.getElementById(id);
  if (el) el.disabled = !enabled;
}

// ── Signing functions ─────────────────────────────────────────────────────

async function startSigning() {
  const msg = document.getElementById('sign-message').value.trim();
  if (!msg) { alert('Please enter a message to sign.'); return; }
  if (!STATE.K) { alert('Run key generation first.'); return; }

  const btn = document.getElementById('btn-start-sign');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Preparing…';

  STATE.message = msg;
  const keys = await apiFetch('/api/keygen/keys', { rho: STATE.rho, rhop: STATE.rhop, K: STATE.K });
  STATE.tr = keys.tr_hex;

  // Reset all signing sub-sections in main panel
  ['mp-sign-section','mp-sign-mu','mp-sign-rhodouble','mp-sign-y',
   'mp-sign-w','mp-sign-ctilde','mp-sign-c','mp-sign-z',
   'mp-sign-check','mp-sign-hints','mp-sign-sig']
    .forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });

  // Ensure main panel is open
  const mp = document.getElementById('mainpanel');
  if (mp && mp.classList.contains('collapsed')) {
    mp.classList.remove('collapsed');
    document.getElementById('sidebar').classList.remove('expanded');
    const mpBtn = document.getElementById('mainpanel-toggle');
    if (mpBtn) mpBtn.textContent = '▶';
  }

  // Show the header section with message
  document.getElementById('mp-sign-section').style.display = 'block';
  document.getElementById('mp-sign-msg').textContent = msg;
  document.getElementById('mp-empty').style.display = 'none';
  scrollToMP('mp-sign-section');

  btn.textContent = '✓ Signing started — now compute steps ①–⑩ below';
  sigBtn('btn-mu', true);
}

async function computeMu() {
  const btn = document.getElementById('btn-mu');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  try {
    const data = await apiFetch('/api/sign/mu', { tr: STATE.tr, message: STATE.message });
    STATE.mu = data.mu;
    document.getElementById('out-mu').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">tr ∥ message → SHAKE256 →</div>
       <div style="color:#38bdf8;margin-top:4px">${data.mu}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:4px">64 bytes</div>`;
    // Main panel — show tr/M breakdown
    document.getElementById('mp-mu').textContent = data.mu;
    document.getElementById('mp-mu-inputs').innerHTML = `
      <div style="flex:1;min-width:160px;background:#fef9c3;border:1px solid #fbbf24;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#713f12;font-weight:700">tr (from pk hash)</div>
        <div style="color:#92400e;margin-top:2px">${data.tr_bytes} bytes = SHAKE256(pk)</div>
        <div style="color:#64748b;margin-top:2px;word-break:break-all;font-family:monospace;font-size:0.85em">${data.tr.slice(0,32)}…</div>
      </div>
      <div style="flex:1;min-width:160px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#713f12;font-weight:700">M (message)</div>
        <div style="color:#92400e;margin-top:2px">${data.message_bytes} bytes (UTF-8)</div>
        <div style="color:#64748b;margin-top:2px;font-family:monospace;font-size:0.85em">"${data.message.slice(0,40)}${data.message.length>40?'…':''}"</div>
      </div>
      <div style="flex:1;min-width:120px;background:#dbeafe;border:1px solid #93c5fd;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#1e3a5f;font-weight:700">Total input</div>
        <div style="color:#1d4ed8;margin-top:2px">${data.input_total_bytes} bytes → SHAKE256 → 64 bytes μ</div>
      </div>`;
    scrollToMP('mp-sign-mu');
    sigBtn('btn-rhodouble', true);
    btn.textContent = '✓ μ Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function computeRhoDouble() {
  const btn = document.getElementById('btn-rhodouble');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating…';
  try {
    const data = await apiFetch('/api/sign/rhodouble', { K: STATE.K, mu: STATE.mu });
    STATE.rhodouble = data.rhodouble;
    document.getElementById('out-rhodouble').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">K ∥ rnd ∥ μ → SHAKE256 →</div>
       <div style="color:#fb923c;margin-top:4px">${data.rhodouble}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:4px">64 bytes</div>`;
    document.getElementById('mp-rhodouble').textContent = data.rhodouble;
    scrollToMP('mp-sign-rhodouble');
    sigBtn('btn-y', true);
    btn.textContent = '✓ ρ″ Generated';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function sampleY() {
  const btn = document.getElementById('btn-y');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sampling…';
  try {
    const data = await apiFetch('/api/sign/y', { rhodouble: STATE.rhodouble });
    STATE.y = data.y;
    let html = '';
    data.y.forEach(p => {
      html += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,8).join(', ')} …] max=${p.max} min=${p.min}</div>`;
    });
    document.getElementById('out-y').innerHTML = html;
    // Main panel — stats bar + columns
    const statsHtml = data.y.map(p =>
      `<div style="flex:1;min-width:80px;background:#f0f4f8;border:1px solid #cbd5e0;border-radius:4px;padding:5px 8px;font-size:0.74em">
         <div style="color:#1e3a5f;font-weight:700">${p.label}</div>
         <div style="color:#b91c1c">max: ${p.max}</div>
         <div style="color:#1d4ed8">min: ${p.min}</div>
       </div>`
    ).join('');
    document.getElementById('mp-y-stats').innerHTML =
      `<div style="display:flex;gap:6px;flex-wrap:wrap;width:100%">
         <div style="width:100%;font-size:0.78em;color:#475569;margin-bottom:2px">γ₁ = 2¹⁷ = 131,072 &nbsp;|&nbsp; coeffs ∈ [−131,071, 131,072]</div>
         ${statsHtml}
       </div>`;
    renderPolyColumns(document.getElementById('mp-y-grid'), data.y, yColor,
      p => `max:${p.max}<br/>min:${p.min}<br/>γ₁=131072`);
    scrollToMP('mp-sign-y');
    sigBtn('btn-w', true);
    btn.textContent = '✓ y Sampled';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function computeW() {
  const btn = document.getElementById('btn-w');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  try {
    const data = await apiFetch('/api/sign/w', { rho: STATE.rho, rhodouble: STATE.rhodouble });
    STATE.w1 = data.w1;
    let html = '';
    data.w.forEach(p => {
      html += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,6).join(', ')} …] max=${p.max}</div>`;
    });
    document.getElementById('out-w').innerHTML = html;
    let html1 = '';
    data.w1.forEach(p => {
      html1 += `<div style="color:#4ade80;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,6).join(', ')} …]</div>`;
    });
    document.getElementById('out-w1').innerHTML = html1;
    // Main panel
    document.getElementById('mp-w-params').innerHTML =
      `γ₂ = (q−1)/88 = ${data.gamma2} &nbsp;|&nbsp; 2γ₂ = ${data.two_gamma2} &nbsp;|&nbsp; ${data.note}`;
    renderPolyColumns(document.getElementById('mp-w-grid'),  data.w,  wColor,  p => `max:${p.max}<br/>min:${p.min}`);
    renderPolyColumns(document.getElementById('mp-w1-grid'), data.w1, t1Color, p => `HighBits<br/>max:${p.max}`);
    renderPolyColumns(document.getElementById('mp-w0-grid'), data.w0, t0Color, p => `LowBits<br/>max:${p.max}`);
    scrollToMP('mp-sign-w');
    sigBtn('btn-ctilde', true);
    btn.textContent = '✓ w, w₁, w₀ Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function computeCtilde() {
  const btn = document.getElementById('btn-ctilde');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Hashing…';
  try {
    const data = await apiFetch('/api/sign/ctilde', { mu: STATE.mu, w1: STATE.w1 });
    STATE.ctilde = data.ctilde;
    document.getElementById('out-ctilde').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">μ ∥ w₁ → SHAKE256 →</div>
       <div style="color:#c4b5fd;margin-top:4px">${data.ctilde}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:4px">32 bytes = 256 bits</div>`;
    document.getElementById('mp-ctilde').textContent = data.ctilde;
    scrollToMP('mp-sign-ctilde');
    sigBtn('btn-c', true);
    btn.textContent = '✓ c̃ Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function sampleC() {
  const btn = document.getElementById('btn-c');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sampling…';
  try {
    const data = await apiFetch('/api/sign/c', { ctilde: STATE.ctilde });
    STATE.c = data.c;
    const d = data.c.distribution;
    document.getElementById('out-c').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">SampleInBall(c̃, τ=39) — FIPS 204 §6 Alg.7, ML-DSA-44</div>
       <div style="margin-top:4px">
         <span style="color:#4ade80">+1: ${d['+1']}</span> &nbsp;
         <span style="color:#f87171">-1: ${d['-1']}</span> &nbsp;
         <span style="color:#64748b">0: ${d['0']}</span>
       </div>
       <div style="color:#7dd3fc;font-size:0.8em;margin-top:4px">
         First 32 coeffs: [${data.c.coeffs.slice(0,32).join(', ')}…]
       </div>`;
    // Main panel
    document.getElementById('mp-c-stats').innerHTML =
      `τ = ${data.tau} (ML-DSA-44, FIPS 204 Table 1) &nbsp;|&nbsp;
       <span style="color:#15803d">+1: ${d['+1']}</span> &nbsp;
       <span style="color:#b91c1c">-1: ${d['-1']}</span> &nbsp;
       <span style="color:#64748b">0: ${d['0']}</span> &nbsp;|&nbsp;
       256 total coefficients`;
    renderPolyColumns(document.getElementById('mp-c-grid'), [data.c], cColor,
      p => `τ=${data.tau}<br/>+1:${d['+1']} -1:${d['-1']}`);
    scrollToMP('mp-sign-c');
    sigBtn('btn-z', true);
    btn.textContent = '✓ c Sampled';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function computeZ() {
  const btn = document.getElementById('btn-z');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  try {
    const data = await apiFetch('/api/sign/z', {
      rhodouble: STATE.rhodouble, rhop: STATE.rhop, ctilde: STATE.ctilde
    });
    STATE.z = data.z;
    let html = '';
    data.z.forEach(p => {
      html += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,8).join(', ')} …] max=${p.max}</div>`;
    });
    document.getElementById('out-z').innerHTML = html;
    // Main panel
    document.getElementById('mp-z-note').innerHTML = data.note || '';
    renderPolyColumns(document.getElementById('mp-cs1-grid'), data.cs1, zColor,
      p => `c·s₁<br/>max:${p.max}<br/>min:${p.min}`);
    renderPolyColumns(document.getElementById('mp-z-grid'), data.z, zColor,
      p => `z=y+cs₁<br/>max:${p.max}<br/>min:${p.min}`);
    scrollToMP('mp-sign-z');
    sigBtn('btn-check', true);
    btn.textContent = '✓ c·s₁ and z Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function checkBounds() {
  const btn = document.getElementById('btn-check');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Checking…';
  try {
    const data = await apiFetch('/api/sign/check', { z: STATE.z });
    const color = data.passed ? '#15803d' : '#b91c1c';
    const icon  = data.passed ? '✓' : '✗';
    document.getElementById('out-check').innerHTML =
      `<div style="color:${color};font-size:1em;font-weight:bold">${icon} ${data.passed ? 'PASSED' : 'REJECTED — restart needed'}</div>
       <div style="margin-top:6px;color:#374151">
         γ₁ = 2¹⁷ = <strong>${data.gamma1}</strong> &nbsp;|&nbsp;
         β = τ·η = ${data.tau||60}·${data.eta||2} = <strong>${data.beta}</strong> &nbsp;|&nbsp;
         threshold = γ₁ − β = <strong>${data.threshold}</strong>
       </div>
       <div style="margin-top:4px;color:#374151">
         ‖z‖∞ = <strong style="color:${color}">${data.max_coeff}</strong>
         &nbsp; ${data.passed ? '<' : '≥'} &nbsp;
         threshold <strong>${data.threshold}</strong>
       </div>
       <div style="color:#64748b;font-size:0.8em;margin-top:4px">
         ${data.passed ? 'z is safe — proceed to hint computation.' : 'This y leaks info — sample new y from step ③.'}
       </div>`;
    document.getElementById('mp-check-result').innerHTML =
      `<span style="color:${color};font-weight:bold;font-size:1.05em">${icon} ‖z‖∞ = ${data.max_coeff} ${data.passed?'<':'≥'} γ₁ − β = ${data.threshold}</span>
       <div style="color:#475569;font-size:0.82em;margin-top:4px">
         γ₁ = ${data.gamma1} &nbsp;|&nbsp; β = τ·η = ${data.beta} &nbsp;|&nbsp; threshold = ${data.threshold}
       </div>`;
    scrollToMP('mp-sign-check');
    if (data.passed) sigBtn('btn-h', true);
    btn.textContent = data.passed ? '✓ Bounds OK' : '✗ Rejected';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function computeHints() {
  const btn = document.getElementById('btn-h');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  try {
    const data = await apiFetch('/api/sign/hints', {
      rho: STATE.rho, rhop: STATE.rhop, ctilde: STATE.ctilde, rhodouble: STATE.rhodouble
    });
    STATE.h = data;
    const im = data.intermediates;
    document.getElementById('out-h').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">${data.formula}</div>
       <div style="color:#94a3b8;font-size:0.8em;margin-top:2px">${data.where}</div>
       <div style="margin-top:6px;color:#fbbf24">Hint positions: [${data.h.positions.join(', ')}]</div>
       <div style="color:#7dd3fc;margin-top:4px">Count: ${data.h.count} hints | Encoded: ${data.size_bytes} bytes | Max allowed: ${data.max_hints}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:2px">${data.standard}</div>`;

    // Fill intermediate boxes
    const fmtPoly = (p) => `[${p.coeffs.slice(0,12).join(', ')} …] max=${p.max} min=${p.min}`;
    document.getElementById('mp-hint-w').textContent   = fmtPoly(im.w);
    document.getElementById('mp-hint-cs2').textContent = fmtPoly(im.cs2);
    document.getElementById('mp-hint-r').textContent   = fmtPoly(im['w_minus_cs2']);
    document.getElementById('mp-hint-ct0').textContent = fmtPoly(im.ct0);
    document.getElementById('mp-hint-rz').textContent  = fmtPoly(im['w_minus_cs2_plus_ct0']);
    document.getElementById('mp-hints').innerHTML =
      `<div style="color:#fbbf24;font-weight:600">h: ${data.h.count} hint bits</div>
       <div style="color:#64748b;font-size:0.8em">positions: [${data.h.positions.join(', ')}]</div>
       <div style="color:#475569;font-size:0.78em;margin-top:4px">γ₂ = ${data.gamma2} &nbsp;|&nbsp; 2γ₂ = ${data.two_gamma2}</div>`;
    scrollToMP('mp-sign-hints');
    sigBtn('btn-sig', true);
    btn.textContent = '✓ Hints Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function assembleSignature() {
  const btn = document.getElementById('btn-sig');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Assembling…';
  try {
    const data = await apiFetch('/api/sign/assemble', {
      ctilde: STATE.ctilde, z: STATE.z, h: STATE.h.h
    });
    document.getElementById('out-sig').innerHTML =
      `<div style="color:#4ade80;font-weight:bold;margin-bottom:6px">✓ Signature σ assembled — ${data.total_size} bytes</div>
       <div style="color:#94a3b8;font-size:0.8em">${data.signature_hex}</div>`;
    // Main panel final summary
    const mp = document.getElementById('mp-sig-summary');
    mp.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
        <div style="flex:1;min-width:120px;background:#0f172a;border:1px solid #c4b5fd;border-radius:8px;padding:10px">
          <div style="color:#c4b5fd;font-weight:bold">c̃</div>
          <div style="color:#fbbf24">${data.components.ctilde.size} bytes</div>
          <div style="color:#64748b;font-size:0.72em">challenge seed</div>
        </div>
        <div style="flex:1;min-width:120px;background:#0f172a;border:1px solid #7dd3fc;border-radius:8px;padding:10px">
          <div style="color:#7dd3fc;font-weight:bold">z</div>
          <div style="color:#fbbf24">${data.components.z.size} bytes</div>
          <div style="color:#64748b;font-size:0.72em">response (${data.components.z.polys} polys)</div>
        </div>
        <div style="flex:1;min-width:120px;background:#0f172a;border:1px solid #fbbf24;border-radius:8px;padding:10px">
          <div style="color:#fbbf24;font-weight:bold">h</div>
          <div style="color:#fbbf24">${data.components.h.size} bytes</div>
          <div style="color:#64748b;font-size:0.72em">${data.components.h.hint_count} hints</div>
        </div>
        <div style="flex:1;min-width:120px;background:#0f172a;border:2px solid #4ade80;border-radius:8px;padding:10px">
          <div style="color:#4ade80;font-weight:bold">σ total</div>
          <div style="color:#4ade80;font-size:1.3em;font-weight:bold">${data.total_size} bytes</div>
        </div>
      </div>
      <div style="margin-top:12px;background:#14532d;border:1px solid #22c55e;border-radius:6px;padding:10px;color:#86efac;font-size:0.85em">
        ✓ Bob can verify this signature using only Alice's public key (1312 bytes). No secret key needed.
      </div>`;
    scrollToMP('mp-sign-sig');
    btn.textContent = '✓ Signature Complete';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

// ── Sidebar section expand + scroll ──────────────────────────────────────
// Opens a collapsed sidebar section and scrolls it into view.
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Expand it
  el.classList.remove('collapsed');
  // Scroll the sidebar to it
  const sidebar = document.getElementById('sidebar');
  setTimeout(() => {
    let top = 0;
    let node = el;
    while (node && node !== sidebar) {
      top += node.offsetTop;
      node = node.offsetParent;
      if (!node || node === document.body) { top = el.offsetTop; break; }
    }
    sidebar.scrollTo({ top: Math.max(0, top - 10), behavior: 'smooth' });
  }, 50);
}

// ── Verification functions ────────────────────────────────────────────────

async function startVerifying() {
  if (!STATE.ctilde || !STATE.z || !STATE.h) {
    // Show message in the first verif out-box instead of alert
    const el = document.getElementById('out-verif-mu');
    if (el) el.innerHTML = '<div style="color:#f87171">⚠ Complete all signing steps ①–⑩ first, then click here.</div>';
    return;
  }

  const btn = document.getElementById('btn-start-verify');
  btn.innerHTML = '<span class="spinner"></span>Preparing…';

  // Reset verif STATE
  STATE.verif_mu = null; STATE.verif_c = null; STATE.verif_wprime = null;
  STATE.verif_w1prime = null; STATE.verif_w1_for_verif = null; STATE.verif_ctilde_prime = null;

  // Reset verif main-panel sections
  ['mp-verif-section','mp-verif-mu','mp-verif-c','mp-verif-wprime',
   'mp-verif-w1prime','mp-verif-ctilde','mp-verif-result']
    .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

  // Reset sidebar out-boxes
  const placeholders = {
    'out-verif-mu':     '[ Click ⑪ Recompute μ ]',
    'out-verif-c':      '[ Click ⑫ Reconstruct c ]',
    'out-verif-wprime': '[ Click ⑬ Compute w′ ]',
    'out-verif-w1prime':'[ Click ⑭ Apply Hints ]',
    'out-verif-ctilde': '[ Click ⑮ Recompute c̃′ ]',
    'out-verif-result': '[ Click ⑯ Verify Signature ]',
  };
  Object.entries(placeholders).forEach(([id, text]) => {
    const el = document.getElementById(id); if (el) el.textContent = text;
  });

  // Ensure main panel is open
  const mp = document.getElementById('mainpanel');
  if (mp && mp.classList.contains('collapsed')) {
    mp.classList.remove('collapsed');
    document.getElementById('sidebar').classList.remove('expanded');
    const mpBtn = document.getElementById('mainpanel-toggle');
    if (mpBtn) mpBtn.textContent = '▶';
  }

  // Populate header section
  const sigEl = document.getElementById('mp-verif-section');
  document.getElementById('mp-verif-msg').textContent = STATE.message;
  document.getElementById('mp-verif-sig-summary').innerHTML = `
    <div style="flex:1;min-width:110px;background:#f0f4f8;border:1px solid #c4b5fd;border-radius:7px;padding:8px 10px">
      <div style="color:#7c3aed;font-weight:bold;font-size:0.85em">c̃</div>
      <div style="color:#64748b;font-size:0.72em;margin-top:2px">32 bytes — from σ</div>
      <div style="color:#c4b5fd;font-family:monospace;font-size:0.7em;margin-top:3px;word-break:break-all">${STATE.ctilde.slice(0,32)}…</div>
    </div>
    <div style="flex:1;min-width:110px;background:#f0f4f8;border:1px solid #7dd3fc;border-radius:7px;padding:8px 10px">
      <div style="color:#0369a1;font-weight:bold;font-size:0.85em">z</div>
      <div style="color:#64748b;font-size:0.72em;margin-top:2px">2304 bytes — ${STATE.z.length} polys</div>
      <div style="color:#7dd3fc;font-family:monospace;font-size:0.7em;margin-top:3px">[${STATE.z[0].coeffs.slice(0,6).join(', ')} …]</div>
    </div>
    <div style="flex:1;min-width:110px;background:#f0f4f8;border:1px solid #fbbf24;border-radius:7px;padding:8px 10px">
      <div style="color:#92400e;font-weight:bold;font-size:0.85em">h</div>
      <div style="color:#64748b;font-size:0.72em;margin-top:2px">84 bytes — ${STATE.h.h.count} hints</div>
      <div style="color:#fbbf24;font-family:monospace;font-size:0.7em;margin-top:3px">positions: [${STATE.h.h.positions.slice(0,6).join(', ')} …]</div>
    </div>
    <div style="flex:1;min-width:110px;background:#f0f4f8;border:1px solid #93c5fd;border-radius:7px;padding:8px 10px">
      <div style="color:#1e3a5f;font-weight:bold;font-size:0.85em">pk = ρ ∥ t₁</div>
      <div style="color:#64748b;font-size:0.72em;margin-top:2px">1312 bytes</div>
      <div style="color:#475569;font-family:monospace;font-size:0.7em;margin-top:3px">ρ: ${STATE.rho.slice(0,16)}…</div>
    </div>`;

  document.getElementById('mp-empty').style.display = 'none';
  scrollToMP('mp-verif-section');

  btn.textContent = '✓ Verification started — work through steps ⑪–⑯';
}

async function verifMu() {
  const btn = document.getElementById('btn-verif-mu');
  const out = document.getElementById('out-verif-mu');
  out.innerHTML = '<div style="color:#fbbf24">⏳ Button clicked — checking STATE…</div>';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  const tr  = STATE.tr;
  const msg = STATE.message;
  out.innerHTML += `<div style="color:#94a3b8;font-size:0.8em">tr=${tr?tr.slice(0,12)+'…':'NULL'} | msg=${msg?'"'+msg.slice(0,20)+'"':'NULL'}</div>`;
  if (!tr || !msg) {
    out.innerHTML += '<div style="color:#f87171">⚠ STATE.tr or STATE.message is null — complete signing steps ①–⑩ first (Key Gen → Start Signing → steps ①–⑩ → Assemble).</div>';
    btn.textContent = '⚠ Signing not complete';
    btn.disabled = false;
    return;
  }
  try {
    const data = await apiFetch('/api/verify/mu', { tr: tr, message: msg });
    STATE.verif_mu = data.mu;

    document.getElementById('out-verif-mu').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">tr ∥ M → SHAKE256 →</div>
       <div style="color:#38bdf8;margin-top:4px">${data.mu}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:4px">64 bytes — identical to Alice's μ if message and pk are correct</div>`;

    // Main panel
    document.getElementById('mp-verif-mu-val').textContent = data.mu;
    document.getElementById('mp-verif-mu-inputs').innerHTML = `
      <div style="flex:1;min-width:150px;background:#fef9c3;border:1px solid #fbbf24;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#713f12;font-weight:700">tr (from pk hash)</div>
        <div style="color:#92400e;margin-top:2px">${data.tr_bytes} bytes = SHAKE256(pk)</div>
        <div style="color:#64748b;margin-top:2px;word-break:break-all;font-family:monospace;font-size:0.85em">${data.tr.slice(0,32)}…</div>
      </div>
      <div style="flex:1;min-width:150px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#713f12;font-weight:700">M (message)</div>
        <div style="color:#92400e;margin-top:2px">${data.message_bytes} bytes (UTF-8)</div>
        <div style="color:#64748b;margin-top:2px;font-family:monospace;font-size:0.85em">"${data.message.slice(0,40)}${data.message.length>40?'…':''}"</div>
      </div>
      <div style="flex:1;min-width:120px;background:#dbeafe;border:1px solid #93c5fd;border-radius:6px;padding:8px 10px;font-size:0.78em">
        <div style="color:#1e3a5f;font-weight:700">μ output</div>
        <div style="color:#0369a1;margin-top:2px">${data.input_total_bytes} bytes in → 64 bytes out</div>
      </div>`;
    scrollToMP('mp-verif-mu');
    btn.textContent = '✓ μ Recomputed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function verifC() {
  const btn = document.getElementById('btn-verif-c');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sampling…';
  if (!STATE.ctilde) {
    document.getElementById('out-verif-c').innerHTML =
      '<div style="color:#f87171">⚠ Complete signing steps ①–⑩ first.</div>';
    btn.textContent = '⚠ Signing not complete'; btn.disabled = false; return;
  }
  try {
    const data = await apiFetch('/api/verify/c', { ctilde: STATE.ctilde });
    STATE.verif_c = data.c;
    const d = data.c.distribution;

    document.getElementById('out-verif-c').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">SampleInBall(c̃ from σ, τ=39)</div>
       <div style="margin-top:4px">
         <span style="color:#4ade80">+1: ${d['+1']}</span> &nbsp;
         <span style="color:#f87171">-1: ${d['-1']}</span> &nbsp;
         <span style="color:#64748b">0: ${d['0']}</span>
       </div>
       <div style="color:#7dd3fc;font-size:0.8em;margin-top:4px">
         Same c̃ → same c as Alice. First 32 coeffs: [${data.c.coeffs.slice(0,32).join(', ')}…]
       </div>`;

    // Main panel
    document.getElementById('mp-verif-c-stats').innerHTML =
      `c̃ from σ: <span style="font-family:monospace;color:#7c3aed">${STATE.ctilde.slice(0,24)}…</span>
       &nbsp;|&nbsp; τ = ${data.tau}
       &nbsp;|&nbsp; <span style="color:#15803d">+1: ${d['+1']}</span>
       &nbsp;|&nbsp; <span style="color:#b91c1c">-1: ${d['-1']}</span>
       &nbsp;|&nbsp; <span style="color:#64748b">0: ${d['0']}</span>`;
    renderPolyColumns(document.getElementById('mp-verif-c-grid'), [data.c], cColor,
      p => `τ=${data.tau}<br/>+1:${d['+1']} -1:${d['-1']}`);
    scrollToMP('mp-verif-c');
    btn.textContent = '✓ c Reconstructed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function verifWPrime() {
  const btn = document.getElementById('btn-verif-wprime');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Computing…';
  if (!STATE.z || !STATE.rho) {
    document.getElementById('out-verif-wprime').innerHTML =
      '<div style="color:#f87171">⚠ Complete signing steps ①–⑩ first.</div>';
    btn.textContent = '⚠ Signing not complete'; btn.disabled = false; return;
  }
  try {
    const data = await apiFetch('/api/verify/wprime', {
      rho: STATE.rho, rhop: STATE.rhop, ctilde: STATE.ctilde, z: STATE.z,
      w1: STATE.w1   // Alice's w₁ from signing step ④ — enables correct verification
    });
    STATE.verif_wprime = data.wprime;
    STATE.verif_w1prime = data.wprime_w1;       // HighBits(w′) for display
    STATE.verif_w1_for_verif = data.w1_for_verif; // correct w₁ for ctilde recomputation

    let html = '';
    data.wprime.forEach(p => {
      html += `<div style="color:#7dd3fc;font-size:0.8em;margin-top:3px">${p.label}: [${p.coeffs.slice(0,8).join(', ')} …] max=${p.max}</div>`;
    });
    document.getElementById('out-verif-wprime').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">${data.note}</div>` + html;

    // Main panel
    document.getElementById('mp-verif-wprime-note').innerHTML = data.note;
    renderPolyColumns(document.getElementById('mp-verif-Az-grid'), data.Az, wColor,
      p => `A·z[${p.label.slice(-3)}]<br/>max:${p.max}`);
    renderPolyColumns(document.getElementById('mp-verif-ct1-grid'), data.ct1_2d, t1Color,
      p => `c·t₁·2ᵈ<br/>max:${p.max}`);
    renderPolyColumns(document.getElementById('mp-verif-wprime-grid'), data.wprime, wColor,
      p => `w′<br/>max:${p.max}<br/>min:${p.min}`);
    scrollToMP('mp-verif-wprime');
    btn.textContent = '✓ w′ Computed';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function verifW1Prime() {
  const btn = document.getElementById('btn-verif-w1prime');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Applying hints…';
  if (!STATE.h || !STATE.verif_wprime) {
    document.getElementById('out-verif-w1prime').innerHTML =
      '<div style="color:#f87171">⚠ Run steps ⑨ (hints) and ⑬ (Compute w′) first.</div>';
    btn.textContent = '⚠ Earlier steps needed'; btn.disabled = false; return;
  }
  try {
    const data = await apiFetch('/api/verify/w1prime', {
      h_positions: STATE.h.h.positions,
      wprime: STATE.verif_w1prime   // pass HighBits(w′) for UseHint display
    });
    STATE.verif_w1prime = data.w1prime;
    // w1_for_verif is used for ctilde recomputation (already set from step ⑬)

    document.getElementById('out-verif-w1prime').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">${data.standard}</div>
       <div style="color:#4ade80;margin-top:4px">${data.note}</div>
       <div style="color:#64748b;font-size:0.8em;margin-top:2px">γ₂ = ${data.gamma2} &nbsp;|&nbsp; 2γ₂ = ${data.two_gamma2} &nbsp;|&nbsp; m = ${data.m}</div>
       <div style="color:#fbbf24;font-size:0.8em;margin-top:2px">Hints applied at positions: [${data.hint_applied.slice(0,12).join(', ')}${data.hint_applied.length>12?'…':''}]</div>`;

    // Main panel
    document.getElementById('mp-verif-hint-stats').innerHTML =
      `UseHint(h, w′, 2γ₂) &nbsp;|&nbsp; ${data.hints_used} hints applied
       &nbsp;|&nbsp; m = ${data.m} &nbsp;|&nbsp; γ₂ = ${data.gamma2}
       &nbsp;|&nbsp; <span style="color:#0369a1">${data.standard}</span>`;
    renderPolyColumns(document.getElementById('mp-verif-w1prime-grid'), data.w1prime, t1Color,
      p => `w₁′<br/>max:${p.max}<br/>min:${p.min}`);
    scrollToMP('mp-verif-w1prime');
    btn.textContent = '✓ Hints Applied';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function verifCtilde() {
  const btn = document.getElementById('btn-verif-ctilde');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Hashing…';
  if (!STATE.verif_mu || !STATE.verif_w1_for_verif) {
    document.getElementById('out-verif-ctilde').innerHTML =
      '<div style="color:#f87171">⚠ Run steps ⑪ (Recompute μ) and ⑬ (Compute w′) first.</div>';
    btn.textContent = '⚠ Earlier steps needed'; btn.disabled = false; return;
  }
  try {
    const data = await apiFetch('/api/verify/ctildeprime', {
      mu: STATE.verif_mu, w1prime: STATE.verif_w1_for_verif
    });
    STATE.verif_ctilde_prime = data.ctilde;

    const match = data.ctilde.toLowerCase() === STATE.ctilde.toLowerCase();
    const matchColor = match ? '#4ade80' : '#f87171';
    const matchText  = match ? '✓ Matches Alice\'s c̃' : '✗ Does NOT match Alice\'s c̃';

    document.getElementById('out-verif-ctilde').innerHTML =
      `<div style="color:#94a3b8;font-size:0.85em">μ ∥ Encode(w₁′) → SHAKE256 →</div>
       <div style="color:#38bdf8;margin-top:4px">${data.ctilde}</div>
       <div style="margin-top:6px;color:${matchColor};font-weight:bold">${matchText}</div>`;

    // Main panel — show both side by side
    document.getElementById('mp-verif-ctilde-sig').innerHTML =
      `<span style="color:#c4b5fd">${STATE.ctilde}</span>`;
    document.getElementById('mp-verif-ctilde-prime').innerHTML =
      `<span style="color:#38bdf8">${data.ctilde}</span>
       <span style="color:${matchColor};font-weight:bold;margin-left:10px">${match ? '✓ match' : '✗ mismatch'}</span>`;
    scrollToMP('mp-verif-ctilde');
    btn.textContent = match ? '✓ c̃′ Matches' : '⚠ c̃′ Mismatch';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

async function verifResult() {
  const btn = document.getElementById('btn-verif-result');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Verifying…';
  if (!STATE.verif_ctilde_prime || !STATE.ctilde || !STATE.z) {
    document.getElementById('out-verif-result').innerHTML =
      '<div style="color:#f87171">⚠ Run steps ⑪ through ⑮ first.</div>';
    btn.textContent = '⚠ Earlier steps needed'; btn.disabled = false; return;
  }
  try {
    const data = await apiFetch('/api/verify/result', {
      ctilde_sig:   STATE.ctilde,
      ctilde_prime: STATE.verif_ctilde_prime,
      z:            STATE.z
    });

    const accepted   = data.accepted;
    const bgColor    = accepted ? '#14532d' : '#450a0a';
    const borderColor= accepted ? '#22c55e'  : '#ef4444';
    const textColor  = accepted ? '#86efac'  : '#fca5a5';
    const icon       = accepted ? '✓'        : '✗';

    document.getElementById('out-verif-result').innerHTML =
      `<div style="background:${bgColor};border:2px solid ${borderColor};border-radius:8px;padding:12px">
         <div style="color:${textColor};font-size:1.15em;font-weight:bold;margin-bottom:8px">${icon} ${data.verdict}</div>
         <div style="color:#e2e8f0;font-size:0.82em;line-height:1.8">
           ${data.reasons.map(r => `<div>• ${r}</div>`).join('')}
         </div>
         <div style="margin-top:8px;color:#94a3b8;font-size:0.75em">
           c̃ match: <strong style="color:${data.ctilde_match?'#4ade80':'#f87171'}">${data.ctilde_match}</strong>
           &nbsp;|&nbsp; ‖z‖∞ = <strong>${data.max_z_coeff}</strong>
           &nbsp;|&nbsp; threshold = <strong>${data.z_threshold}</strong>
           &nbsp;|&nbsp; ${data.standard}
         </div>
       </div>`;

    // Main panel verdict
    document.getElementById('mp-verif-verdict').innerHTML = `
      <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:10px;padding:16px;margin-top:8px">
        <div style="color:${textColor};font-size:1.4em;font-weight:bold;text-align:center;margin-bottom:12px">
          ${icon} ${data.verdict}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <div style="flex:1;min-width:130px;background:rgba(255,255,255,0.08);border-radius:7px;padding:10px;text-align:center">
            <div style="color:${data.ctilde_match?'#4ade80':'#f87171'};font-size:1.1em;font-weight:bold">${data.ctilde_match ? '✓' : '✗'}</div>
            <div style="color:#94a3b8;font-size:0.78em;margin-top:4px">c̃′ = c̃</div>
            <div style="color:#e2e8f0;font-size:0.72em">${data.ctilde_match ? 'Challenge matches' : 'Challenge mismatch'}</div>
          </div>
          <div style="flex:1;min-width:130px;background:rgba(255,255,255,0.08);border-radius:7px;padding:10px;text-align:center">
            <div style="color:${data.bounds_passed?'#4ade80':'#f87171'};font-size:1.1em;font-weight:bold">${data.bounds_passed ? '✓' : '✗'}</div>
            <div style="color:#94a3b8;font-size:0.78em;margin-top:4px">‖z‖∞ &lt; γ₁−β</div>
            <div style="color:#e2e8f0;font-size:0.72em">${data.max_z_coeff} vs ${data.z_threshold}</div>
          </div>
          <div style="flex:1;min-width:130px;background:rgba(255,255,255,0.08);border-radius:7px;padding:10px;text-align:center">
            <div style="color:#93c5fd;font-size:1.1em;font-weight:bold">🔒</div>
            <div style="color:#94a3b8;font-size:0.78em;margin-top:4px">Secret key used?</div>
            <div style="color:#4ade80;font-size:0.72em">Never — public only</div>
          </div>
        </div>
        <div style="color:#94a3b8;font-size:0.75em;text-align:center">${data.standard}</div>
      </div>`;
    scrollToMP('mp-verif-result');
    btn.textContent = accepted ? '✓ Signature Valid' : '✗ Signature Invalid';
  } catch(e) { btn.textContent = '✗ Error'; }
  btn.disabled = false;
}

// ── Health check on load ──────────────────────────────────────────────────
window.addEventListener('load', async () => {
  // Set default zoom
  document.body.style.fontSize = (zoomLevel / 100) + 'em';
  document.getElementById('zoom-label').textContent = zoomLevel + '%';

  try {
    const r = await fetch(API + '/api/health');
    const d = await r.json();
    setStatus(d.status === 'ok' ? '✓ backend connected' : '✗ backend error',
              d.status === 'ok' ? 'ok' : 'err');
  } catch {
    setStatus('✗ backend offline', 'err');
  }
});
