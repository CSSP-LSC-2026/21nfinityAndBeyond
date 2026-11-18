/**
 * Shared name wall for 21nfinityAndBeyond.
 * Attach this script to the Google Sheet (Extensions → Apps Script), then deploy
 * as a Web app: Execute as you, access for anyone. Paste the deployed URL into
 * GOOGLE_APPS_SCRIPT_URL in app.js.
 */
const TAB_NAME = 'Explorers';
const HEADERS = ['Name', 'Joined at'];
const BLOCKED_WORDS = ['fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'dickhead', 'slut', 'whore'];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = /^[A-Za-z_$][\w.$]*$/.test(params.callback || '') ? params.callback : '';
  let result;
  try {
    const action = String(params.action || 'list');
    if (action === 'list') result = { ok: true, names: listNames_() };
    else if (action === 'add') result = addName_(params.name);
    else result = { ok: false, message: 'Unknown action.' };
  } catch (err) {
    result = { ok: false, message: 'The adventure wall is temporarily unavailable.' };
  }
  const json = JSON.stringify(result).replace(/</g, '\\u003c');
  const output = callback ? `${callback}(${json});` : json;
  return ContentService.createTextOutput(output).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Bind this script to a spreadsheet first.');
  let sheet = spreadsheet.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(TAB_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function listNames_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues()
    .map(row => String(row[0] || '').trim())
    .filter(Boolean)
    .map(name => ({ name }));
}

function addName_(rawName) {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, message: 'Please enter a name.' };
  if ([...name].length > 30) return { ok: false, message: 'Names must be 30 characters or fewer.' };
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (BLOCKED_WORDS.some(word => compact.includes(word.replace(/[^a-z0-9]/g, '')))) {
    return { ok: false, message: 'Please keep the board friendly for everyone.' };
  }

  // Serialize duplicate checks and writes so simultaneous submissions don't race.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const existing = listNames_();
    if (existing.some(entry => entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return { ok: true, duplicate: true, name };
    }
    sheet.appendRow([name, new Date()]);
    return { ok: true, duplicate: false, name };
  } finally {
    lock.releaseLock();
  }
}
