// ============================================================
// CAMBUSA SYNC — Google Apps Script
// Incolla questo codice in un progetto Apps Script collegato
// al Google Sheet che vuoi usare come backend della cambusa.
//
// ISTRUZIONI SETUP:
// 1. Vai su https://docs.google.com/spreadsheets/create
// 2. Rinomina il foglio in "cambusa" (tab in basso)
// 3. Vai su Estensioni → Apps Script
// 4. Incolla questo codice (sostituisce il codice esistente)
// 5. Salva (Ctrl+S)
// 6. Clic su "Distribuisci" → "Nuova distribuzione"
//    - Tipo: Applicazione web
//    - Esegui come: Me
//    - Chi ha accesso: Chiunque
// 7. Copia l'URL della distribuzione
// 8. Incollalo in cambusa.html alla riga: const SHEETS_URL = '...'
// ============================================================

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
}

function doGet(e) {
  const params = e.parameter || {};
  const sheet = getOrCreateSheet();

  if (params.action === 'set') {
    // Aggiorna o aggiunge una voce
    const data = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === params.id) {
        sheet.getRange(i + 1, 2).setValue(params.val === 'true');
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([params.id, params.val === 'true']);
    return jsonpResponse(params.callback, { ok: true });
  }

  if (params.action === 'reset') {
    // Azzera tutti i valori (mantiene le chiavi, imposta false)
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) sheet.getRange(i + 1, 2).setValue(false);
    }
    return jsonpResponse(params.callback, { ok: true });
  }

  // action === 'get' oppure default: restituisce stato completo
  const data = sheet.getDataRange().getValues();
  const state = {};
  data.forEach(function(row) {
    if (row[0]) state[row[0]] = row[1] === true || row[1] === 'TRUE';
  });
  return jsonpResponse(params.callback, state);
}

function jsonpResponse(callback, data) {
  const json = JSON.stringify(data);
  const body = callback ? callback + '(' + json + ')' : json;
  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
