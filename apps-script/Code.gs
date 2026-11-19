/**
 * Shared name wall for 21nfinityAndBeyond.
 * Attach this script to the Google Sheet (Extensions → Apps Script), then deploy
 * as a Web app: Execute as you, access for anyone. Paste the deployed URL into
 * GOOGLE_APPS_SCRIPT_URL in app.js.
 */
const TAB_NAME = 'Explorers';
const HEADERS = ['Name', 'Joined at'];
// Leave blank when this is a script opened from the Sheet's Extensions menu.
// For a standalone Apps Script project, paste the Sheet ID from its URL here.
const SPREADSHEET_ID = '1RnUqoFjbQbjuppKmWtTzmUYt-rptyVSyJiX_EbEOIN4';
// Keep in sync with the client-side English + Filipino profanity / slur lists in app.js.
const WHOLE_WORD_BLOCKED = ['dick', 'fag', 'rape', 'coon'];
const BLOCKED_WORDS = [
  'fuck', 'fucking', 'fucker', 'fuckface', 'motherfucker', 'fck', 'fuk', 'fuq', 'phuck',
  'shit', 'shitty', 'bullshit', 'bullshitter', 'shithead', 'shitbag', 'shitfuck', 'shite', 'bitch', 'bitches', 'sonofabitch', 'bastard',
  'asshole', 'arsehole', 'asswipe', 'asshat', 'dumbass', 'jackass', 'cunt', 'dickhead', 'cock', 'cocksucker', 'pussy', 'whore', 'slut', 'twat', 'prick',
  'wanker', 'bollocks', 'tosser', 'fucktard', 'porn', 'pornhub', 'hentai', 'dildo', 'handjob', 'blowjob', 'rimjob', 'jerkoff', 'jackoff', 'masturbate', 'masturbation', 'cumshot', 'cumslut', 'jizz', 'orgasm', 'titties', 'boobs', 'boobies', 'ballsack', 'rapist', 'molest', 'pedophile', 'bestiality',
  'nigger', 'nigga', 'faggot', 'dyke', 'kike', 'chink', 'spic', 'wetback', 'tranny', 'retard', 'raghead',
  'putangina', 'putanginamo', 'putanginaka', 'potangina', 'potanginamo', 'tangina', 'tanginamo', 'tanginaka', 'tngina', 'tngn', 'amputa', 'ampota', 'pota', 'puta', 'pukinamo', 'pukinangina', 'pakingshet',
  'puki', 'puke', 'pekpek', 'kiki', 'tite', 'titi', 'etits', 'burat', 'kantot', 'kantutan', 'jakol', 'pokpok',
  'gago', 'gaga', 'gagi', 'bobo', 'tanga', 'ulol', 'kupal', 'tarantado', 'punyeta', 'pakshet', 'pakshit', 'pakyu',
  'leche', 'letse', 'lintik', 'hinayupak', 'buwisit', 'bwisit', 'yawa', 'buang', 'bilat', 'bayag', 'hayopka', 'siraulo', 'inutil', 'peste', 'pisti', 'yati', 'atay', 'amaw', 'pistingyawa'
];

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
    console.error('Adventure wall request failed:', err);
    result = { ok: false, message: 'The adventure wall is temporarily unavailable.' };
  }
  const json = JSON.stringify(result).replace(/</g, '\\u003c');
  const output = callback ? `${callback}(${json});` : json;
  return ContentService.createTextOutput(output).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active Sheet. Bind this script to a Sheet or set SPREADSHEET_ID.');
  }
  return spreadsheet;
}

function getSheet_() {
  const spreadsheet = getSpreadsheet_();
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

function moderationText_(value) {
  return String(value || '').toLocaleLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[4@]/g, 'a').replace(/[3]/g, 'e').replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o').replace(/[5$]/g, 's').replace(/[7+]/g, 't')
    .replace(/ph/g, 'f');
}
function normalizeForModeration_(value) {
  return moderationText_(value).replace(/[^a-z]/g, '');
}
function moderationPattern_(word) {
  return normalizeForModeration_(word).split('').map(letter => letter + '+').join('[^a-z]*');
}
function hasWholeWordBlock_(separated, word) {
  const pattern = moderationPattern_(word);
  return new RegExp('(?:^|[^a-z])' + pattern + '(?:$|[^a-z])').test(separated);
}
function hasBlockedWord_(separated, word) {
  return new RegExp(moderationPattern_(word)).test(separated);
}

function addName_(rawName) {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, message: 'Please enter a name.' };
  if ([...name].length > 30) return { ok: false, message: 'Names must be 30 characters or fewer.' };
  if (/[,;&/+]|\band\b/i.test(name)) return { ok: false, message: 'Please submit one explorer per entry.' };
  const separated = moderationText_(name);
  const wholeWordBlocked = WHOLE_WORD_BLOCKED.some(word => hasWholeWordBlock_(separated, word));
  if (wholeWordBlocked || BLOCKED_WORDS.some(word => hasBlockedWord_(separated, word))) {
    return { ok: false, message: 'Please choose a nickname without profanity or slurs.' };
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
