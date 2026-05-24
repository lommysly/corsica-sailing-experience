/* ══════════════════════════════════════════════════
   CORSICA SAILING EXPERIENCE — Script
   ══════════════════════════════════════════════════ */

/* ── Google Sheets API ──────────────────────────── */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz47cX2Mb04xvkmrOBj8IXoACXp_SiMzuhr8xxftoTy4nTHwYiIcxXdOboBz5HCa9w5/exec';
const ADMIN_PASSWORDS = {
  lagoon:   'lagoon2025',
  oceanis:  'oceanis2025',
  atlantica: 'atlantica2026'
};

/* ── Preloader ──────────────────────────────────── */
window.addEventListener('load', () => {
  const loader = document.getElementById('preloader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.querySelectorAll('#heroContent .reveal-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 100 + i * 150);
      });
    }, 1200);
  }
});

/* ── Navbar scroll ──────────────────────────────── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Mobile burger ──────────────────────────────── */
const burger    = document.getElementById('navBurger');
const mobileNav = document.getElementById('navMobile');
if (burger && mobileNav) {
  burger.addEventListener('click', () => mobileNav.classList.toggle('open'));
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}

/* ── Countdown ──────────────────────────────────── */
const DEPARTURE = new Date('2025-05-29T17:00:00+02:00').getTime();
function updateCountdown() {
  const cdDays  = document.getElementById('cdDays');
  if (!cdDays) return;
  const now  = Date.now();
  const diff = DEPARTURE - now;
  if (diff <= 0) {
    const cd = document.getElementById('countdown');
    if (cd) cd.innerHTML = '<div class="cd-block"><span class="cd-num">Salpati!</span></div>';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000)  / 60000);
  const s = Math.floor((diff % 60000)    / 1000);
  document.getElementById('cdDays').textContent  = String(d).padStart(2,'0');
  document.getElementById('cdHours').textContent = String(h).padStart(2,'0');
  document.getElementById('cdMins').textContent  = String(m).padStart(2,'0');
  document.getElementById('cdSecs').textContent  = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ── Scroll reveal (IntersectionObserver) ───────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
  // Skip hero content — handled by preloader callback
  if (!el.closest('#heroContent')) revealObserver.observe(el);
});

/* ── Meteo tabs ──────────────────────────────────── */
document.querySelectorAll('.mr-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mr-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.meteo-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panelId = 'panel-' + tab.dataset.route;
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      // Re-trigger reveals inside newly visible panel
      panel.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        el.classList.add('visible');
      });
    }
  });
});

/* ── FAQ accordion ──────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    // Open clicked if it was closed
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

/* ── Smooth anchor scroll ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 72, behavior: 'smooth' });
    }
  });
});

/* ── Crew List — selezione barca ───────────────── */
function selectBoat(boat) {
  const boatNames = { lagoon: '⛵ Lagoon 40', oceanis: '⛵ Beneteau Oceanis 48' };
  document.getElementById('crewBoatSelect').style.display = 'none';
  const formArea = document.getElementById('crewFormArea');
  formArea.style.display = 'block';
  document.getElementById('crewFormTitle').textContent = boatNames[boat];
  // mostra solo il pannello della barca scelta
  document.querySelectorAll('.crew-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('crew-' + boat);
  if (panel) panel.classList.add('active');
  // carica dati salvati o aggiungi 1 membro vuoto
  const container = document.getElementById('members-' + boat);
  if (container && container.children.length === 0) {
    const saved = loadFromStorage(boat);
    if (saved.length > 0) {
      saved.forEach(data => addMember(boat, data));
    } else {
      addMember(boat);
    }
  }
  // scroll smooth al form
  formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToBoatSelect() {
  document.getElementById('crewFormArea').style.display = 'none';
  document.getElementById('crewBoatSelect').style.display = 'block';
  document.getElementById('crewBoatSelect').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Crew member row template ─────────────────── */
let memberCount = { lagoon: 0, oceanis: 0 };
const CREW_FIELDS = ['nome','nascita','luogo','nazionalita','residenza','cap','tipoDoc','numDoc','scadDoc','ruolo','cf'];

function saveToStorage(boat) {
  const container = document.getElementById('members-' + boat);
  if (!container) return;
  const data = [];
  container.querySelectorAll('.crew-member-row').forEach(row => {
    const member = {};
    CREW_FIELDS.forEach(f => { member[f] = row.querySelector(`[data-field="${f}"]`)?.value || ''; });
    data.push(member);
  });
  localStorage.setItem('crew_' + boat, JSON.stringify(data));
}

function loadFromStorage(boat) {
  try { return JSON.parse(localStorage.getItem('crew_' + boat)) || []; }
  catch(e) { return []; }
}

function addMember(boat, prefill) {
  memberCount[boat]++;
  const idx = memberCount[boat];
  const container = document.getElementById('members-' + boat);
  const row = document.createElement('div');
  row.className = 'crew-member-row';
  row.id = `member-${boat}-${idx}`;
  row.innerHTML = `
    <div class="crew-field">
      <label>Nome e Cognome</label>
      <input type="text" placeholder="Mario Rossi" data-field="nome" />
    </div>
    <div class="crew-field">
      <label>Data di Nascita</label>
      <input type="date" data-field="nascita" />
    </div>
    <div class="crew-field">
      <label>Luogo di Nascita</label>
      <input type="text" placeholder="Roma" data-field="luogo" />
    </div>
    <div class="crew-field">
      <label>Nazionalità</label>
      <input type="text" placeholder="Italiana" data-field="nazionalita" />
    </div>
    <div class="crew-field">
      <label>Residenza</label>
      <input type="text" placeholder="Via Roma 1, 00100 Roma" data-field="residenza" />
    </div>
    <div class="crew-field">
      <label>CAP</label>
      <input type="text" placeholder="00100" data-field="cap" maxlength="10" />
    </div>
    <div class="crew-field">
      <label>Tipo Documento</label>
      <select data-field="tipoDoc">
        <option value="">Seleziona</option>
        <option>Passaporto</option>
        <option>Carta d'Identità</option>
        <option>Patente</option>
      </select>
    </div>
    <div class="crew-field">
      <label>N° Documento</label>
      <input type="text" placeholder="AA0000000" data-field="numDoc" />
    </div>
    <div class="crew-field">
      <label>Scadenza Documento</label>
      <input type="date" data-field="scadDoc" />
    </div>
    <div class="crew-field">
      <label>Ruolo</label>
      <select data-field="ruolo">
        <option value="">Seleziona</option>
        <option>Skipper</option>
        <option>Co-skipper</option>
        <option>Equipaggio</option>
        <option>Ospite</option>
      </select>
    </div>
    <div class="crew-field cf-field">
      <label>Codice Fiscale</label>
      <input type="text" placeholder="RSSMRA80A01H501U" data-field="cf" style="text-transform:uppercase" />
    </div>
    <div class="crew-field-actions">
      <button class="btn-remove-member" onclick="removeMember('${boat}', ${idx})" title="Rimuovi membro">✕</button>
    </div>
  `;
  container.appendChild(row);
  // Prefill from saved data
  if (prefill) {
    CREW_FIELDS.forEach(f => {
      const el = row.querySelector(`[data-field="${f}"]`);
      if (el && prefill[f]) el.value = prefill[f];
    });
  }
  // Autosave on every change
  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => saveToStorage(boat));
    el.addEventListener('change', () => saveToStorage(boat));
  });
}

function removeMember(boat, idx) {
  const row = document.getElementById(`member-${boat}-${idx}`);
  if (row) { row.remove(); saveToStorage(boat); }
}


/* ── Triple-click sul contatore → sblocca bottone admin ── */
const _counterClicks = {};
function handleCounterClick(boat, el) {
  _counterClicks[boat] = (_counterClicks[boat] || 0) + 1;
  clearTimeout(el._resetTimer);
  el._resetTimer = setTimeout(() => { _counterClicks[boat] = 0; }, 600);
  if (_counterClicks[boat] >= 3) {
    _counterClicks[boat] = 0;
    const btn = document.getElementById('btnAdminPDF-' + boat);
    if (btn) btn.style.display = btn.style.display === 'none' ? 'inline-flex' : 'none';
  }
}

/* ── Salva membro su Google Sheets ──────────────── */
async function saveMemberToSheets(boat) {
  const container = document.getElementById('members-' + boat);
  const rows = container.querySelectorAll('.crew-member-row');
  if (rows.length === 0) { alert('Compila almeno un membro prima di salvare.'); return; }

  const row = rows[0];
  const get = f => row.querySelector(`[data-field="${f}"]`)?.value.trim() || '';
  const nome = get('nome');
  if (!nome) { alert('Inserisci il Nome e Cognome prima di salvare.'); return; }

  const btn = document.getElementById('btnSalva-' + boat);
  if (btn) { btn.textContent = 'Salvataggio...'; btn.disabled = true; }

  const data = {
    boat, nome, nascita: get('nascita'), luogo: get('luogo'),
    nazionalita: get('nazionalita'), residenza: get('residenza'),
    cap: get('cap'), tipoDoc: get('tipoDoc'), numDoc: get('numDoc'),
    scadDoc: get('scadDoc'), ruolo: get('ruolo'), cf: get('cf')
  };

  try {
    await fetch(SHEETS_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (btn) { btn.textContent = '✅ Dati salvati!'; btn.style.background = 'var(--turq)'; }
    saveToStorage(boat);
    const statusEl = document.getElementById('saveStatus-' + boat);
    if (statusEl) { statusEl.textContent = '✅ ' + nome + ' — dati inviati correttamente.'; statusEl.style.display = 'block'; }
  } catch(err) {
    if (btn) { btn.textContent = 'Salva i miei dati'; btn.disabled = false; }
    alert('Errore di rete. Riprova.');
  }
}

/* ── Admin: scarica PDF con tutti i membri da Sheets ── */
async function adminDownloadPDF(boat, boatName, departureDate, arrivalDate) {
  const pwd = prompt('Password amministratore:');
  if (pwd !== ADMIN_PASSWORDS[boat]) { alert('Password errata.'); return; }

  const btn = document.getElementById('btnAdminPDF-' + boat);
  if (btn) { btn.textContent = 'Caricamento dati...'; btn.disabled = true; }

  try {
    const res = await fetch(SHEETS_URL + '?boat=' + boat);
    const json = await res.json();
    if (!json.ok || !json.members || json.members.length === 0) {
      alert('Nessun membro trovato nel foglio per questa barca.');
      if (btn) { btn.textContent = '🔐 Scarica PDF (Admin)'; btn.disabled = false; }
      return;
    }
    generateCrewPDF(json.members, boatName, departureDate, arrivalDate);
    if (btn) { btn.textContent = '🔐 Scarica PDF (Admin)'; btn.disabled = false; }
  } catch(err) {
    alert('Errore nel recupero dati. Riprova.');
    if (btn) { btn.textContent = '🔐 Scarica PDF (Admin)'; btn.disabled = false; }
  }
}

/* ── Genera PDF unico con tutti i membri ────────── */
function generateCrewPDF(members, boatName, departureDate, arrivalDate) {
  const skipper = members.find(m => m.ruolo === 'Skipper') || members[0];
  const rows_html = members.map((m, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="name">${m.nome || '—'}</td>
      <td>${m.nascita ? new Date(m.nascita).toLocaleDateString('it-IT') : (m.nascita || '—')}</td>
      <td>${m.luogo || '—'}</td>
      <td>${m.nazionalita || '—'}</td>
      <td>${m.tipoDoc || '—'}</td>
      <td>${m.numDoc || '—'}</td>
      <td>${m.scadDoc ? new Date(m.scadDoc).toLocaleDateString('it-IT') : (m.scadDoc || '—')}</td>
      <td>${m.ruolo || '—'}</td>
    </tr>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/>
<title>Crew List — ${boatName}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Arial',sans-serif; font-size:10.5px; color:#111; background:#fff; }
  .page { padding:28px 32px; max-width:900px; margin:0 auto; }
  .doc-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0b3c5d; padding-bottom:14px; margin-bottom:18px; }
  .doc-title h1 { font-size:20px; color:#0b3c5d; letter-spacing:.02em; margin-bottom:2px; }
  .doc-title p { font-size:11px; color:#555; }
  .doc-flag { font-size:28px; }
  .vessel-grid, .voyage-grid { display:grid; grid-template-columns:repeat(4,1fr); border:1px solid #c0cdd8; margin-bottom:0; }
  .voyage-grid { border-top:none; margin-bottom:24px; }
  .vessel-cell, .voyage-cell { padding:8px 10px; border-right:1px solid #c0cdd8; }
  .vessel-cell:last-child, .voyage-cell:last-child { border-right:none; }
  .voyage-cell { border-top:1px solid #c0cdd8; }
  .vc-label { font-size:8.5px; text-transform:uppercase; letter-spacing:.08em; color:#7a9cb8; margin-bottom:3px; }
  .vc-val { font-size:11px; font-weight:700; color:#0b3c5d; }
  .section-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#fff; background:#0b3c5d; padding:6px 10px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#e8f0f7; }
  th { padding:7px 8px; text-align:left; font-size:8.5px; text-transform:uppercase; color:#0b3c5d; border:1px solid #c0cdd8; font-weight:700; }
  td { padding:7px 8px; border:1px solid #dce5ed; font-size:10px; vertical-align:middle; }
  td.num { text-align:center; color:#7a9cb8; font-weight:700; width:28px; }
  td.name { font-weight:700; color:#0b3c5d; }
  tr:nth-child(even) td { background:#f4f8fc; }
  .sig-block { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-top:36px; }
  .sig-item { border-top:1px solid #0b3c5d; padding-top:6px; }
  .sig-item .sig-label { font-size:8.5px; text-transform:uppercase; color:#7a9cb8; margin-bottom:22px; }
  .sig-item .sig-name { font-size:10px; color:#0b3c5d; font-weight:700; }
  .doc-footer { margin-top:28px; padding-top:10px; border-top:1px solid #c0cdd8; display:flex; justify-content:space-between; font-size:8.5px; color:#9aacba; }
  @media print { body{font-size:9.5px} .page{padding:14px 18px} }
</style></head><body>
<div class="page">
  <div class="doc-header">
    <div class="doc-title">
      <h1>CREW LIST — LISTA EQUIPAGGIO</h1>
      <p>Documento richiesto per navigazione in acque straniere &nbsp;·&nbsp; Art. 184 Codice della Navigazione</p>
    </div>
    <div class="doc-flag">🇮🇹</div>
  </div>
  <div class="vessel-grid">
    <div class="vessel-cell"><div class="vc-label">Nome Imbarcazione</div><div class="vc-val">${boatName}</div></div>
    <div class="vessel-cell"><div class="vc-label">Bandiera</div><div class="vc-val">Italiana</div></div>
    <div class="vessel-cell"><div class="vc-label">Porto di Iscrizione</div><div class="vc-val">La Spezia</div></div>
    <div class="vessel-cell"><div class="vc-label">Comandante / Skipper</div><div class="vc-val">${skipper?.nome || '—'}</div></div>
  </div>
  <div class="voyage-grid">
    <div class="voyage-cell"><div class="vc-label">Porto di Partenza</div><div class="vc-val">Porto Mirabello, La Spezia</div></div>
    <div class="voyage-cell"><div class="vc-label">Data Partenza</div><div class="vc-val">${departureDate}</div></div>
    <div class="voyage-cell"><div class="vc-label">Porto di Arrivo</div><div class="vc-val">Porto Mirabello, La Spezia</div></div>
    <div class="voyage-cell"><div class="vc-label">Data Arrivo</div><div class="vc-val">${arrivalDate}</div></div>
  </div>
  <div class="section-title">Composizione Equipaggio &nbsp;·&nbsp; ${members.length} persone a bordo</div>
  <table>
    <thead><tr>
      <th>#</th><th>Cognome e Nome</th><th>Data di Nascita</th><th>Luogo di Nascita</th>
      <th>Nazionalità</th><th>Tipo Documento</th><th>N° Documento</th><th>Scadenza</th><th>Ruolo a Bordo</th>
    </tr></thead>
    <tbody>${rows_html}</tbody>
  </table>
  <div class="sig-block">
    <div class="sig-item"><div class="sig-label">Firma Comandante</div><div class="sig-name">${skipper?.nome || '___________________________'}</div></div>
    <div class="sig-item"><div class="sig-label">Timbro / Visto Autorità</div><div class="sig-name">&nbsp;</div></div>
    <div class="sig-item"><div class="sig-label">Data e Luogo</div><div class="sig-name">La Spezia, ${new Date().toLocaleDateString('it-IT')}</div></div>
  </div>
  <div class="doc-footer">
    <span>Corsica Sailing Experience &nbsp;·&nbsp; Porto Mirabello, La Spezia &nbsp;·&nbsp; +39 351 844 7888</span>
    <span>Generato il ${new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})}</span>
  </div>
</div>
<script>window.onload=()=>{ window.print(); }<\/script>
</body></html>`);
  win.document.close();
}


/* ── Floating particles in hero ─────────────────── */
(function spawnParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    const size  = Math.random() * 3 + 1;
    const left  = Math.random() * 100;
    const delay = Math.random() * 12;
    const dur   = 10 + Math.random() * 14;
    p.style.cssText = `
      position:absolute; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${left}%; bottom:-10px;
      background:rgba(255,255,255,${0.06 + Math.random() * 0.1});
      animation: floatParticle ${dur}s ease-in-out ${delay}s infinite;
      pointer-events:none;
    `;
    container.appendChild(p);
  }
  // inject keyframes once
  if (!document.getElementById('particleKF')) {
    const s = document.createElement('style');
    s.id = 'particleKF';
    s.textContent = `
      @keyframes floatParticle {
        0%   { transform: translateY(0) scale(1);   opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 0.6; }
        100% { transform: translateY(-105vh) scale(.4); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
})();
