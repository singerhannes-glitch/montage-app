/* Beschriftungen für Berichte (Deutsch / Englisch) und gemeinsame Hilfsfunktionen */
const LABELS = {
  de: {
    bericht: 'Montagebericht', punch: 'Punchliste',
    firma: 'Firma', projekt: 'Projekt', monteur: 'Monteur', datum: 'Datum', wetter: 'Wetter',
    hilfsmittel: 'Montagehilfsmittel', stk: 'Stk', team: 'Einsatzteam', vm: 'Vormittag', nm: 'Nachmittag',
    s1: '1. Durchgeführte Tätigkeiten', s2: '2. Geplante Arbeiten', s3: '3. Offene Punkte / Technische Hinweise',
    s4: '4. Bilder', s5: '5. Stand',
    unterschrift: 'Unterschrift',
    done: 'erledigt', progress: 'in Arbeit', open: 'offen',
    p1: '1. Punkte', p2: '2. Bilder', p3: '3. Abnahme',
    nr: 'Nr.', beschr: 'Beschreibung', zust: 'Zuständig', status: 'Status',
    punktBild: 'Punkt', seite: 'Seite', von: 'von', firmaName: 'Chairkit Fördertechnik GmbH'
  },
  en: {
    bericht: 'Installation Report', punch: 'Punch list',
    firma: 'Company', projekt: 'Project', monteur: 'Fitter', datum: 'Date', wetter: 'Weather',
    hilfsmittel: 'Installation equipment', stk: 'Qty', team: 'Team on site', vm: 'Morning', nm: 'Afternoon',
    s1: '1. Work carried out', s2: '2. Planned work', s3: '3. Open points / technical notes',
    s4: '4. Pictures', s5: '5. Status',
    unterschrift: 'Signature',
    done: 'done', progress: 'in progress', open: 'open',
    p1: '1. Items', p2: '2. Pictures', p3: '3. Acceptance',
    nr: 'No.', beschr: 'Description', zust: 'Responsible', status: 'Status',
    punktBild: 'Item', seite: 'Page', von: 'of', firmaName: 'Chairkit Fördertechnik GmbH'
  }
};

// Farben wie im bisherigen Bericht (Hex ohne #)
const COLORS = {
  bar: 'BDD7EE', caption: 'D9D9D9',
  done: { bg: 'C6E0B4', fg: '548235' },
  progress: { bg: 'FFF2CC', fg: 'BF8F00' },
  open: { bg: 'FF7C80', fg: '7F0000' },
  alert: 'FF9999'
};

function isoToDe(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

function todayIso() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyReport(type) {
  return {
    id: newId(), type: type || 'bericht', lang: 'de',
    created: Date.now(), updated: Date.now(),
    firma: '', projekt: '', monteur: '', datum: todayIso(), wetter: '',
    hilfsmittel: [{ text: '', stk: '' }],
    team: [{ rolle: '', vm: '', nm: '' }],
    taetigkeiten: [], geplant: [], hinweise: [],
    punkte: [], bilder: [],
    stand: todayIso()
  };
}

// Ältere oder unvollständige Einträge auffüllen, damit nichts abstürzt
function normalizeReport(rep) {
  const n = Object.assign(emptyReport(rep && rep.type === 'punch' ? 'punch' : 'bericht'), rep || {});
  ['hilfsmittel', 'team', 'taetigkeiten', 'geplant', 'hinweise', 'punkte', 'bilder'].forEach(k => { if (!Array.isArray(n[k])) n[k] = []; });
  if (!n.notes) n.notes = [];
  return n;
}

// Dateiname: JJJJ-MM-TT Projekt (ohne verbotene Zeichen)
function reportFileBase(r) {
  const clean = s => (s || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  const art = r.type === 'punch' ? 'Punchliste' : 'Montagebericht';
  const proj = clean(r.projekt) || 'Projekt';
  return `${r.datum || todayIso()} ${proj} ${art}${r.lang === 'en' ? ' EN' : ''}`;
}
