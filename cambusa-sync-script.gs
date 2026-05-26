// ============================================================
// CAMBUSA PLANNER — Google Apps Script
// Menu giornaliero → lista spesa → cambusa.html
//
// COME USARE:
// 1. Apri il foglio → menu "🧭 Cambusa" → "⚙️ Setup (prima volta)"
// 2. Configura il tab "config" (persone, date già pre-compilate)
// 3. Compila il tab "menu": una riga per giorno, colonne Colazione/Pranzo/Cena
// 4. Compila "ricette": ingredienti per ogni piatto
// 5. Adatta "dotazioni" (acqua calcolata automaticamente)
// 6. "🛒 Calcola Spesa" → genera la lista → cambusa.html si aggiorna
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 Cambusa')
    .addItem('⚙️ Setup (prima volta)', 'setup')
    .addSeparator()
    .addItem('🛒 Calcola Spesa', 'calcolaSpesa')
    .addSeparator()
    .addItem('🔄 Riscrive Dotazioni (sovrascrive)', 'forzaDotazioni')
    .addToUi();
}

// ---- SETUP ------------------------------------------------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['config','menu','ricette','dotazioni','spesa','cambusa'].forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  setupConfig(ss.getSheetByName('config'));
  setupMenu(ss.getSheetByName('menu'), ss);
  setupRicette(ss.getSheetByName('ricette'));
  setupDotazioni(ss.getSheetByName('dotazioni'));
  SpreadsheetApp.getUi().alert(
    '✅ Setup completato!\n\n' +
    '1. Controlla "config" (persone, date)\n' +
    '2. Compila "menu" — giorni già generati, inserisci i piatti\n' +
    '3. Compila "ricette" — ingredienti per ogni piatto\n' +
    '4. Adatta "dotazioni" se necessario\n' +
    '5. Clicca "Calcola Spesa"\n\n' +
    'Per rigenerare il menu: svuota il tab "menu" e ripeti Setup.'
  );
}

function setupConfig(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 160);
  sheet.getRange('A1:B1').setValues([['chiave','valore']]).setFontWeight('bold');
  sheet.getRange('A2:B8').setValues([
    ['persone', 10],
    ['data_inizio', '29/05/2026'],
    ['data_fine', '02/06/2026'],
    ['check_in_ora', '17:00'],
    ['check_out_ora', '17:00'],
    ['acqua_litri_per_persona_giorno', 1.5],
    ['acqua_litri_per_giorno_cucina', 3],
  ]);
}

function setupMenu(sheet, ss) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  [80, 80, 220, 220, 220, 200].forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // Intestazioni
  const headers = [['Data', 'Giorno', 'Colazione ☕', 'Pranzo 🥗', 'Cena 🍝', 'Note']];
  sheet.getRange('A1:F1').setValues(headers).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);

  // Leggi config per date
  const config = leggiConfig((ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName('config'));
  if (!config['data_inizio'] || !config['data_fine']) return;

  const nomiGiorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const inizio = parseData(config['data_inizio']);
  const fine   = parseData(config['data_fine']);
  const checkIn  = config['check_in_ora']  || '';
  const checkOut = config['check_out_ora'] || '';

  const rows = [];
  let giorno = new Date(inizio);
  while (giorno <= fine) {
    const dataStr = Utilities.formatDate(giorno, 'Europe/Rome', 'dd/MM/yyyy');
    const nomeGiorno = nomiGiorni[giorno.getDay()];
    const isFirst = giorno.getTime() === inizio.getTime();
    const isLast  = giorno.getTime() === fine.getTime();
    const nota = isFirst ? 'Check-in ' + checkIn : isLast ? 'Check-out ' + checkOut : '';
    // Primo giorno: solo cena (arrivo ore 17). Ultimo: solo colazione+pranzo (partenza ore 17)
    rows.push([dataStr, nomeGiorno, isFirst ? '—' : '', isLast ? '—' : '', isLast ? '—' : '', nota]);
    giorno = new Date(giorno.getTime() + 86400000);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    // Colore alternato per leggibilità
    rows.forEach((_, i) => {
      if (i % 2 === 0) sheet.getRange(i + 2, 1, 1, 6).setBackground('#f4f8fc');
    });
    // Colore nota check-in/out
    sheet.getRange(2, 6).setFontColor('#888888').setFontStyle('italic');
    sheet.getRange(rows.length + 1, 6).setFontColor('#888888').setFontStyle('italic');
  }
}

function setupRicette(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  [200, 200, 80, 80, 140].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.getRange('A1:E1').setValues([['Piatto','Ingrediente','Qtà/persona','Unità','Categoria']]).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);
  sheet.getRange('A2:E16').setValues([
    ['Pasta al pesto','Pasta',100,'g','Pasta/Cereali'],
    ['Pasta al pesto','Pesto',60,'g','Scatolame'],
    ['Pasta al pesto','Grana',20,'g','Freschi'],
    ['Colazione continentale','Latte',200,'ml','Freschi'],
    ['Colazione continentale','Caffè',10,'g','Bevande'],
    ['Colazione continentale','Biscotti',50,'g','Varie'],
    ['Colazione continentale','Brioche',1,'pz','Varie'],
    ['Insalata di tonno','Tonno',80,'g','Scatolame'],
    ['Insalata di tonno','Pomodorini',100,'g','Verdure'],
    ['Insalata di tonno','Rucola',30,'g','Verdure'],
    ['Insalata di tonno','Mais',40,'g','Scatolame'],
    ['Grigliate miste','Pollo/manzo',250,'g','Carne/Pesce'],
    ['Grigliate miste','Zucchine',100,'g','Verdure'],
    ['Grigliate miste','Patate',150,'g','Verdure'],
    ['','','','',''],
  ]);
}

var DOTAZIONI_LIST = [
  // BASE — Cucina
  ['Sale grosso',         1,    'kg',        'Cucina',        ''],
  ['Sale fino',           1,    'conf.',      'Cucina',        ''],
  ['Olio',                1,    'bottiglia',  'Cucina',        ''],
  ['Zucchero',            1,    'busta',      'Cucina',        ''],
  ['Aglio',               1,    'testa',      'Cucina',        ''],
  // VERDURE
  ['Rucola/insalata mista',4,   'buste',      'Verdure',       ''],
  ['Pomodorini',           2,   'conf.',      'Verdure',       ''],
  ['Zucchine',             4,   'pz',         'Verdure',       ''],
  ['Cetrioli',             4,   'pz',         'Verdure',       ''],
  ['Avocado',              7,   'pz',         'Verdure',       ''],
  // FRUTTA
  ['Pesche',              10,   'pz',         'Frutta',        ''],
  ['Mele/banane',         10,   'pz',         'Frutta',        ''],
  ['Uva',                  2,   'grappoli',   'Frutta',        ''],
  ['Arance',               1,   'conf.',      'Frutta',        'q.b.'],
  ['Melone',               2,   'pz',         'Frutta',        ''],
  ['Limoni',               4,   'pz',         'Frutta',        ''],
  // COLAZIONE
  ['Latte LC',             2,   'litri',      'Colazione',     ''],
  ['Caffè',                1,   'conf.',      'Colazione',     ''],
  ['Biscotti',             2,   'pacchi',     'Colazione',     ''],
  ['Brioche/merendine',    2,   'pacchi',     'Colazione',     ''],
  // PASTA/CEREALI
  ['Pasta fredda',        1.5,  'kg',         'Pasta/Cereali', ''],
  ['Linguine',            1.5,  'kg',         'Pasta/Cereali', ''],
  ['Risotto',             1.5,  'kg',         'Pasta/Cereali', ''],
  ['Riso insalata',       1.5,  'kg',         'Pasta/Cereali', ''],
  ['Pan Bauletto',         2,   'pz',         'Pasta/Cereali', ''],
  ['Grissini',             3,   'pz',         'Pasta/Cereali', ''],
  // BEVANDE
  ['Acqua',               10,   'cartoni',    'Bevande',       ''],
  ['Coca/bibite',          1,   'conf.',      'Bevande',       'q.b.'],
  ['Succo di frutta',      3,   'brick',      'Bevande',       ''],
  ['Birra',               40,   'lattine',    'Bevande',       'Corona'],
  ['Vino bianco',          5,   'bottiglie',  'Bevande',       ''],
  ['Prosecco',             4,   'bottiglie',  'Bevande',       ''],
  ['Gin',                  1,   'bottiglia',  'Bevande',       'q.b.'],
  ['Tonica',               1,   'conf.',      'Bevande',       'q.b.'],
  // AFFETTATI
  ['Prosciutto crudo',     3,   'etti',       'Affettati',     ''],
  ['Bresaola',             2,   'etti',       'Affettati',     ''],
  ['Salame',               3,   'buste',      'Affettati',     ''],
  ['Salamino',             1,   'pz',         'Affettati',     ''],
  ['Mortadella',           3,   'etti',       'Affettati',     ''],
  // FRESCHI
  ['Formaggi misti',       1,   'conf.',      'Freschi',       'q.b.'],
  ['Grana',                1,   'busta',      'Freschi',       ''],
  ['Mozzarella',          12,   'pz',         'Freschi',       ''],
  ['Mozzarella ciliegini', 3,   'buste',      'Freschi',       ''],
  ['Uova',                25,   'pz',         'Freschi',       ''],
  // VARIE
  ['Taralli',              3,   'pacchi',     'Varie',         ''],
  ['Patatine',             5,   'conf.',      'Varie',         ''],
  ['Crostini',             2,   'conf.',      'Varie',         ''],
  ['Salatini freschi',     1,   'conf.',      'Varie',         ''],
  ['Zafferano',            1,   'bustine',    'Varie',         'per risotto'],
  ['Menta/erbe',           1,   'mazzetto',   'Varie',         'per frittata'],
  ['Basilico',             1,   'mazzetto',   'Varie',         'per risotto'],
  // SCATOLAME
  ['Tonno',               10,   'scatole',    'Scatolame',     ''],
  ['Mais',                 3,   'conf.',      'Scatolame',     ''],
  ['Piselli',              2,   'conf.',      'Scatolame',     ''],
  ['Condiriso',            1,   'conf.',      'Scatolame',     ''],
  ['Olive',                4,   'barattoli',  'Scatolame',     ''],
  // PULIZIE
  ['Bio per piatti',       1,   'conf.',      'Pulizie',       ''],
  ['Sgrassatore',          1,   'spray',      'Pulizie',       ''],
  ['Scottex/rotoloni',     1,   'rotolone',   'Pulizie',       ''],
  ['Carta igienica',      10,   'rotoli',     'Pulizie',       ''],
  ['Spugnette',            1,   'conf.',      'Pulizie',       ''],
  ['Stracci/strofinacci',  1,   'conf.',      'Pulizie',       ''],
  ['Sacchetti piccoli',   10,   'pz',         'Pulizie',       ''],
  ['Sacchetti grandi neri',10,  'pz',         'Pulizie',       ''],
  ['Carta argento',        1,   'rotolo',     'Pulizie',       ''],
  ['Bicchieri plastica',  80,   'pz',         'Pulizie',       ''],
  ['Piatti plastica',    100,   'pz',         'Pulizie',       ''],
];

function setupDotazioni(sheet) {
  if (sheet.getLastRow() > 1) return;
  _scriviDotazioni(sheet);
}

function forzaDotazioni() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('dotazioni');
  if (!sheet) { SpreadsheetApp.getUi().alert('Tab "dotazioni" non trovato. Esegui prima il Setup.'); return; }
  _scriviDotazioni(sheet);
  SpreadsheetApp.getUi().alert('✅ Dotazioni riscritte — ' + DOTAZIONI_LIST.length + ' articoli.');
}

function _scriviDotazioni(sheet) {
  sheet.clearContents();
  [220, 80, 120, 140, 200].forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange('A1:E1').setValues([['Articolo','Quantità','Unità','Categoria','Note']]).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);
  sheet.getRange(2, 1, DOTAZIONI_LIST.length, 5).setValues(DOTAZIONI_LIST);
}

// ---- CALCOLA SPESA ----------------------------------------
function calcolaSpesa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config    = leggiConfig(ss.getSheetByName('config'));
  const menu      = leggiMenu(ss.getSheetByName('menu'));
  const ricette   = leggiRicette(ss.getSheetByName('ricette'));
  const dotazioni = leggiDotazioni(ss.getSheetByName('dotazioni'));

  const n_persone = Number(config['persone']) ||
    Object.entries(config).filter(([k]) => k.startsWith('persone_'))
      .reduce((s, [, v]) => s + (Number(v) || 0), 0);

  const giorni = daysBetween(config['data_inizio'], config['data_fine']);
  const acqua_pp   = Number(config['acqua_litri_per_persona_giorno']) || 1.5;
  const acqua_cuc  = Number(config['acqua_litri_per_giorno_cucina']) || 3;

  if (n_persone === 0) {
    SpreadsheetApp.getUi().alert('⚠️ Imposta "persone" nel tab config prima di calcolare.');
    return;
  }

  // Conteggio pasti
  const n_col  = menu.filter(m => m.pasto === 'Colazione').length;
  const n_pran = menu.filter(m => m.pasto === 'Pranzo').length;
  const n_cen  = menu.filter(m => m.pasto === 'Cena').length;

  // Ingredienti da menu × ricette × persone
  const ing = {};
  menu.forEach(row => {
    if (!row.piatto) return;
    ricette.filter(r => r.piatto === row.piatto).forEach(r => {
      const k = r.ingrediente + '__' + r.unita;
      if (!ing[k]) ing[k] = { nome: r.ingrediente, qty: 0, unita: r.unita, categoria: r.categoria };
      ing[k].qty += r.qta_per_persona * n_persone;
    });
  });

  // Acqua automatica
  ing['Acqua__litri'] = {
    nome: 'Acqua', categoria: 'Bevande', unita: 'litri',
    qty: acqua_pp * n_persone * giorni + acqua_cuc * giorni
  };

  // Ordine categorie
  const catOrder = ['Cucina','Verdure','Frutta','Pasta/Cereali','Carne/Pesce','Freschi','Scatolame','Colazione','Varie','Bevande','Pulizie'];
  const sortCat = (a, b) => {
    const ia = catOrder.indexOf(a.categoria) >= 0 ? catOrder.indexOf(a.categoria) : 99;
    const ib = catOrder.indexOf(b.categoria) >= 0 ? catOrder.indexOf(b.categoria) : 99;
    return ia - ib || a.nome.localeCompare(b.nome);
  };

  const rows = [];
  Object.values(ing).sort(sortCat).forEach(i => {
    rows.push([slugify(i.nome), i.nome, formatQty(i.qty, i.unita), i.unita, i.categoria, 'menu']);
  });
  dotazioni.sort(sortCat).forEach(d => {
    rows.push([slugify(d.articolo), d.articolo, d.quantita + (d.unita ? ' ' + d.unita : ''), d.unita, d.categoria, 'dotazione']);
  });

  // Scrivi tab spesa
  const spesaSheet = ss.getSheetByName('spesa') || ss.insertSheet('spesa');
  spesaSheet.clearContents();
  spesaSheet.getRange(1, 1, 1, 6).setValues([['ID','Articolo','Quantità','Unità','Categoria','Tipo']]).setFontWeight('bold').setBackground('#e8f0f7');
  if (rows.length > 0) spesaSheet.getRange(2, 1, rows.length, 6).setValues(rows);

  sincronizzaCambusa(ss, rows.map(r => r[0]));

  SpreadsheetApp.getUi().alert(
    '✅ Spesa calcolata!\n\n' +
    '👥 ' + n_persone + ' persone · 📅 ' + giorni + ' giorni\n' +
    '☕ ' + n_col + ' colazioni · 🥗 ' + n_pran + ' pranzi · 🍝 ' + n_cen + ' cene\n' +
    '📦 ' + rows.length + ' articoli in lista\n\n' +
    'La cambusa.html si aggiorna al prossimo accesso.'
  );
}

function sincronizzaCambusa(ss, ids) {
  const sheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  const existing = {};
  if (sheet.getLastRow() > 0) {
    sheet.getDataRange().getValues().forEach(r => { if (r[0]) existing[r[0]] = r[1] === true || r[1] === 'TRUE'; });
  }
  sheet.clearContents();
  if (ids.length > 0) sheet.getRange(1, 1, ids.length, 2).setValues(ids.map(id => [id, !!existing[id]]));
}

// ---- HELPERS -----------------------------------------------
function leggiConfig(sheet) {
  const cfg = {};
  if (!sheet || sheet.getLastRow() < 2) return cfg;
  sheet.getDataRange().getValues().slice(1).forEach(r => {
    if (r[0]) cfg[String(r[0])] = isNaN(r[1]) || r[1] === '' ? r[1] : Number(r[1]);
  });
  return cfg;
}

function leggiMenu(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const meals = [];
  sheet.getDataRange().getValues().slice(1).forEach(r => {
    const [data, giorno, colazione, pranzo, cena] = r;
    if (colazione && colazione !== '—') meals.push({ data, giorno, pasto: 'Colazione', piatto: String(colazione) });
    if (pranzo   && pranzo   !== '—') meals.push({ data, giorno, pasto: 'Pranzo',    piatto: String(pranzo) });
    if (cena     && cena     !== '—') meals.push({ data, giorno, pasto: 'Cena',      piatto: String(cena) });
  });
  return meals;
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

function parseData(s) {
  if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const p = String(s).split('/');
  if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  return new Date(s);
}

function daysBetween(d1, d2) {
  return Math.max(0, Math.round((parseData(d2) - parseData(d1)) / 86400000));
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatQty(qty, unita) {
  if (unita === 'g'  && qty >= 1000) return (qty / 1000).toFixed(qty % 1000 ? 1 : 0).replace(/\.0$/, '') + ' kg';
  if (unita === 'ml' && qty >= 1000) return (qty / 1000).toFixed(qty % 1000 ? 1 : 0).replace(/\.0$/, '') + ' litri';
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
  const state = {};
  const cambusaSheet = ss.getSheetByName('cambusa');
  if (cambusaSheet && cambusaSheet.getLastRow() > 0) {
    cambusaSheet.getDataRange().getValues().forEach(r => { if (r[0]) state[String(r[0])] = r[1] === true || r[1] === 'TRUE'; });
  }
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
    if (String(data[i][0]) === String(id)) { sheet.getRange(i + 1, 2).setValue(val === 'true'); found = true; break; }
  }
  if (!found) sheet.appendRow([id, val === 'true']);
  return jsonpResponse(callback, { ok: true });
}

function resetAction(ss, callback) {
  const sheet = ss.getSheetByName('cambusa');
  if (sheet && sheet.getLastRow() > 0) {
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) { if (data[i][0]) sheet.getRange(i + 1, 2).setValue(false); }
  }
  return jsonpResponse(callback, { ok: true });
}

function jsonpResponse(callback, data) {
  const json = JSON.stringify(data);
  const body = callback ? callback + '(' + json + ')' : json;
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
