// ============================================================
// CAMBUSA PLANNER — Google Apps Script
// Sistema completo: config → menu → ricette → spesa → sito
//
// COME USARE:
// 1. Apri il foglio Google → vedrai il menu "🧭 Cambusa"
// 2. Prima volta: clic su "Setup (prima volta)"
// 3. Compila i tab: config, menu, ricette, dotazioni
// 4. Clic su "Calcola Spesa" per generare la lista
// 5. La cambusa.html legge automaticamente la lista aggiornata
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 Cambusa')
    .addItem('⚙️ Setup (prima volta)', 'setup')
    .addSeparator()
    .addItem('🛒 Calcola Spesa', 'calcolaSpesa')
    .addToUi();
}

// ---- SETUP ------------------------------------------------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['config','menu','ricette','dotazioni','spesa','cambusa'].forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  setupConfig(ss.getSheetByName('config'));
  setupMenu(ss.getSheetByName('menu'));
  setupRicette(ss.getSheetByName('ricette'));
  setupDotazioni(ss.getSheetByName('dotazioni'));
  SpreadsheetApp.getUi().alert('✅ Setup completato!\n\n1. Configura il tab "config" (persone, date)\n2. Aggiungi i menu nel tab "menu"\n3. Aggiungi le ricette nel tab "ricette"\n4. Adatta le dotazioni nel tab "dotazioni"\n5. Clicca "Calcola Spesa"');
}

function setupConfig(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 160);
  sheet.getRange('A1:B1').setValues([['chiave','valore']]).setFontWeight('bold');
  sheet.getRange('A2:B7').setValues([
    ['persone_lagoon', 10],
    ['persone_oceanis', 12],
    ['data_inizio', '02/06/2026'],
    ['data_fine', '07/06/2026'],
    ['acqua_litri_per_persona_giorno', 1.5],
    ['acqua_litri_per_giorno_cucina', 3],
  ]);
}

function setupMenu(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  ['A','B','C','D','E'].forEach((c,i) => sheet.setColumnWidth(i+1, [80,100,100,220,200][i]));
  sheet.getRange('A1:E1').setValues([['Data','Giorno','Pasto','Piatto','Note']]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  // Esempio
  sheet.getRange('A2:E5').setValues([
    ['02/06','Sabato','Cena','Pasta al pesto','prima sera in rada'],
    ['03/06','Domenica','Colazione','Colazione continentale',''],
    ['03/06','Domenica','Pranzo','Insalata di tonno',''],
    ['03/06','Domenica','Cena','Grigliate','porto o rada'],
  ]);
}

function setupRicette(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  ['A','B','C','D','E'].forEach((c,i) => sheet.setColumnWidth(i+1, [200,200,80,80,140][i]));
  sheet.getRange('A1:E1').setValues([['Piatto','Ingrediente','Qtà/persona','Unità','Categoria']]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A2:E20').setValues([
    ['Pasta al pesto','Pasta',100,'g','Pasta/Cereali'],
    ['Pasta al pesto','Pesto',60,'g','Scatolame'],
    ['Pasta al pesto','Grana',20,'g','Freschi'],
    ['Colazione continentale','Latte',200,'ml','Freschi'],
    ['Colazione continentale','Caffè',10,'g','Bevande'],
    ['Colazione continentale','Biscotti',50,'g','Varie'],
    ['Colazione continentale','Brioche/cornetti',1,'pz','Varie'],
    ['Insalata di tonno','Tonno',80,'g','Scatolame'],
    ['Insalata di tonno','Pomodorini',100,'g','Verdure'],
    ['Insalata di tonno','Rucola',30,'g','Verdure'],
    ['Insalata di tonno','Mais',40,'g','Scatolame'],
    ['Grigliate','Pollo/manzo misto',250,'g','Carne/Pesce'],
    ['Grigliate','Zucchine',100,'g','Verdure'],
    ['Grigliate','Patate',150,'g','Verdure'],
    ['','','','',''],
    ['','','','',''],
    ['','','','',''],
    ['','','','',''],
    ['','','','',''],
  ]);
}

function setupDotazioni(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  ['A','B','C','D','E'].forEach((c,i) => sheet.setColumnWidth(i+1, [220,80,120,140,200][i]));
  sheet.getRange('A1:E1').setValues([['Articolo','Quantità','Unità','Categoria','Note']]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A2:E25').setValues([
    ['Sale grosso',1,'kg','Cucina',''],
    ['Sale fino',1,'conf.','Cucina',''],
    ['Olio EVO',2,'bottiglie','Cucina',''],
    ['Pepe nero',1,'conf.','Cucina',''],
    ['Limoni',8,'pz','Cucina',''],
    ['Aglio',2,'teste','Cucina',''],
    ['Carta argento',2,'rotoli','Cucina',''],
    ['Sacchetti piccoli',30,'pz','Cucina',''],
    ['Sacchetti grandi neri',20,'pz','Cucina',''],
    ['Bio per piatti',2,'conf.','Pulizie',''],
    ['Sgrassatore',1,'spray','Pulizie',''],
    ['Scottex / rotoloni',4,'rotoloni','Pulizie',''],
    ['Carta igienica',12,'rotoli','Pulizie',''],
    ['Spugnette',2,'conf.','Pulizie',''],
    ['Tovaglioli carta',3,'conf.','Pulizie',''],
    ['Birra',40,'lattine','Bevande','Corona/Peroni'],
    ['Vino bianco',6,'bottiglie','Bevande',''],
    ['Prosecco',4,'bottiglie','Bevande','aperitivo'],
    ['Gin',2,'bottiglie','Bevande',''],
    ['Tonica',12,'lattine','Bevande','Fever-Tree'],
    ['Ghiaccio',10,'kg','Bevande','Platonica o simile'],
    ['Succo di frutta',6,'brick','Bevande',''],
    ['Coca / bibite',12,'lattine','Bevande',''],
    ['','','','',''],
  ]);
}

// ---- CALCOLA SPESA ----------------------------------------
function calcolaSpesa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = leggiConfig(ss.getSheetByName('config'));
  const menu = leggiMenu(ss.getSheetByName('menu'));
  const ricette = leggiRicette(ss.getSheetByName('ricette'));
  const dotazioni = leggiDotazioni(ss.getSheetByName('dotazioni'));

  // Conta persone (somma tutte le chiavi che iniziano con "persone_")
  const n_persone = Object.entries(config)
    .filter(([k]) => k.startsWith('persone_'))
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);

  const giorni = daysBetween(config['data_inizio'], config['data_fine']) + 1;
  const acqua_pp_gg = Number(config['acqua_litri_per_persona_giorno']) || 1.5;
  const acqua_cucina_gg = Number(config['acqua_litri_per_giorno_cucina']) || 3;

  if (n_persone === 0) {
    SpreadsheetApp.getUi().alert('⚠️ Nessuna persona configurata. Controlla il tab "config" e aggiungi le chiavi "persone_...".');
    return;
  }

  // Ingredienti da menu × ricette × persone
  const ing = {}; // "nome__unità" → {nome, qty, unita, categoria}
  menu.forEach(row => {
    if (!row.piatto) return;
    ricette.filter(r => r.piatto === row.piatto).forEach(r => {
      const k = r.ingrediente + '__' + r.unita;
      if (!ing[k]) ing[k] = { nome: r.ingrediente, qty: 0, unita: r.unita, categoria: r.categoria };
      ing[k].qty += r.qta_per_persona * n_persone;
    });
  });

  // Acqua automatica
  const acqua_totale = acqua_pp_gg * n_persone * giorni + acqua_cucina_gg * giorni;
  ing['Acqua__litri'] = { nome: 'Acqua', qty: acqua_totale, unita: 'litri', categoria: 'Bevande' };

  // Costruisci righe spesa
  const rows = [];
  const catOrder = ['Cucina','Verdure','Frutta','Pasta/Cereali','Carne/Pesce','Freschi','Scatolame','Colazione','Varie','Bevande','Pulizie'];
  const catSorted = (a, b) => {
    const ia = catOrder.indexOf(a.categoria) >= 0 ? catOrder.indexOf(a.categoria) : 99;
    const ib = catOrder.indexOf(b.categoria) >= 0 ? catOrder.indexOf(b.categoria) : 99;
    return ia - ib || a.nome.localeCompare(b.nome);
  };

  Object.values(ing).sort(catSorted).forEach(i => {
    rows.push([slugify(i.nome), i.nome, formatQty(i.qty, i.unita), i.unita, i.categoria, 'menu']);
  });
  dotazioni.sort(catSorted).forEach(d => {
    const displayQty = d.quantita + (d.unita ? ' ' + d.unita : '');
    rows.push([slugify(d.articolo), d.articolo, displayQty, d.unita, d.categoria, 'dotazione']);
  });

  // Scrivi tab spesa
  const spesaSheet = ss.getSheetByName('spesa') || ss.insertSheet('spesa');
  spesaSheet.clearContents();
  spesaSheet.getRange(1, 1, 1, 6).setValues([['ID','Articolo','Quantità','Unità','Categoria','Tipo']]).setFontWeight('bold');
  if (rows.length > 0) spesaSheet.getRange(2, 1, rows.length, 6).setValues(rows);

  // Sincronizza tab cambusa (preserva spunte già fatte)
  sincronizzaCambusa(ss, rows.map(r => r[0]));

  SpreadsheetApp.getUi().alert(
    '✅ Spesa calcolata!\n\n' +
    rows.length + ' articoli · ' + n_persone + ' persone · ' + giorni + ' giorni\n\n' +
    'La cambusa.html si aggiornerà al prossimo caricamento della pagina.'
  );
}

function sincronizzaCambusa(ss, ids) {
  const sheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  const existing = {};
  if (sheet.getLastRow() > 0) {
    sheet.getDataRange().getValues().forEach(r => { if (r[0]) existing[r[0]] = r[1] === true || r[1] === 'TRUE'; });
  }
  sheet.clearContents();
  if (ids.length > 0) {
    sheet.getRange(1, 1, ids.length, 2).setValues(ids.map(id => [id, !!existing[id]]));
  }
}

// ---- HELPERS -----------------------------------------------
function leggiConfig(sheet) {
  const cfg = {};
  if (!sheet || sheet.getLastRow() < 2) return cfg;
  sheet.getDataRange().getValues().slice(1).forEach(r => { if (r[0]) cfg[r[0]] = isNaN(r[1]) ? r[1] : Number(r[1]); });
  return cfg;
}
function leggiMenu(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[2] && r[3])
    .map(r => ({ data: r[0], giorno: r[1], pasto: r[2], piatto: r[3], note: r[4] }));
}
function leggiRicette(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] && r[1] && r[2])
    .map(r => ({ piatto: r[0], ingrediente: r[1], qta_per_persona: Number(r[2]) || 0, unita: r[3] || '', categoria: r[4] || 'Varie' }));
}
function leggiDotazioni(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({ articolo: r[0], quantita: r[1], unita: r[2] || '', categoria: r[3] || 'Varie', note: r[4] }));
}
function daysBetween(d1, d2) {
  const p = s => { if (s instanceof Date) return s; const a = String(s).split('/'); return new Date(a[2], a[1]-1, a[0]); };
  return Math.max(0, Math.round((p(d2) - p(d1)) / 86400000));
}
function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
function formatQty(qty, unita) {
  if (unita === 'g' && qty >= 1000) return (qty/1000).toFixed(qty%1000 ? 1 : 0).replace(/\.0$/,'') + ' kg';
  if (unita === 'ml' && qty >= 1000) return (qty/1000).toFixed(qty%1000 ? 1 : 0).replace(/\.0$/,'') + ' litri';
  if (unita === 'litri') return Number(qty).toFixed(qty % 1 ? 1 : 0) + ' litri';
  return Math.ceil(qty) + (unita ? ' ' + unita : '');
}

// ---- WEB APP (lato sito) -----------------------------------
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = params.action || 'get';

  if (action === 'getList') return getListAction(ss, params.callback);
  if (action === 'set')     return setAction(ss, params.id, params.val, params.callback);
  if (action === 'reset')   return resetAction(ss, params.callback);
  return getStateAction(ss, params.callback);
}

function getListAction(ss, callback) {
  const spesaSheet = ss.getSheetByName('spesa');
  if (!spesaSheet || spesaSheet.getLastRow() < 2) return jsonpResponse(callback, []);

  // Stato spunte
  const state = {};
  const cambusaSheet = ss.getSheetByName('cambusa');
  if (cambusaSheet && cambusaSheet.getLastRow() > 0) {
    cambusaSheet.getDataRange().getValues().forEach(r => { if (r[0]) state[String(r[0])] = r[1] === true || r[1] === 'TRUE'; });
  }

  // Lista spesa raggruppata per categoria
  const catMap = {}, catOrder = [];
  spesaSheet.getDataRange().getValues().slice(1).forEach(r => {
    const [id, nome, qty, , categoria] = r;
    if (!id || !nome) return;
    if (!catMap[categoria]) { catMap[categoria] = []; catOrder.push(categoria); }
    catMap[categoria].push({ id: String(id), nome: String(nome), qty: String(qty || ''), checked: !!state[String(id)] });
  });

  return jsonpResponse(callback, catOrder.map(cat => ({ category: cat, items: catMap[cat] })));
}

function getStateAction(ss, callback) {
  const sheet = ss.getSheetByName('cambusa');
  const state = {};
  if (sheet && sheet.getLastRow() > 0) {
    sheet.getDataRange().getValues().forEach(r => { if (r[0]) state[String(r[0])] = r[1] === true || r[1] === 'TRUE'; });
  }
  return jsonpResponse(callback, state);
}

function setAction(ss, id, val, callback) {
  const sheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  const data = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
  let found = false;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.getRange(i+1,2).setValue(val==='true'); found=true; break; }
  }
  if (!found) sheet.appendRow([id, val==='true']);
  return jsonpResponse(callback, { ok: true });
}

function resetAction(ss, callback) {
  const sheet = ss.getSheetByName('cambusa');
  if (sheet && sheet.getLastRow() > 0) {
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) { if (data[i][0]) sheet.getRange(i+1,2).setValue(false); }
  }
  return jsonpResponse(callback, { ok: true });
}

function jsonpResponse(callback, data) {
  const json = JSON.stringify(data);
  const body = callback ? callback + '(' + json + ')' : json;
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
