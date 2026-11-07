/* Englische Oberfläche. Gilt, wenn der aktuelle Bericht auf Englisch steht.
   Nur feste Beschriftungen und Meldungen der App. Was jemand selbst tippt, bleibt unverändert. */
const UI_EN = {
  // Tabs und Kopfleiste
  'Montagebericht': 'Installation report', 'Punchliste': 'Punch list', 'Gespeichert': 'Saved', 'Einstellungen': 'Settings',
  'Sprache des Berichts': 'Report language', 'Neu': 'New', 'Neuer Tag aus diesem': 'New day from this one',
  'Kopf, Hilfsmittel, Team und geplante Arbeiten übernehmen': 'Copy header, equipment, team and planned work',
  'Diktat-Sprache': 'Dictation language',
  // Kopf des Berichts
  'Gespeichertes Projekt wählen': 'Choose saved project', 'Projekt vergessen': 'Forget project',
  'Das gewählte Projekt aus der Liste entfernen': 'Remove the selected project from the list',
  'Neues Projekt: unten eintragen': 'New project: enter below',
  'Projekt wählen oder unten neu eintragen': 'Choose a project or enter a new one below',
  'Noch kein Projekt gespeichert, unten eintragen': 'No project saved yet, enter one below',
  'Firma und Projekt gibst du nur einmal ein. Danach wählst du das Projekt aus der Liste. Das Datum nehme ich aus deinen Fotos.':
    'Enter company and project only once. After that, pick the project from the list. The date is taken from your photos.',
  'Firma (Kunde)': 'Company (customer)', 'Projekt': 'Project', 'Monteur': 'Fitter', 'Datum': 'Date',
  'z. B. P2413 Liseberg': 'e.g. P2413 Liseberg', 'z. B. Sonne, 12 °C': 'e.g. sunny, 12 °C',
  'Montagehilfsmittel': 'Installation equipment', 'Einsatzteam': 'Team on site', '+ Zeile': '+ Row', 'Wetter': 'Weather',
  'Hilfsmittel': 'Equipment', 'Stk': 'Qty', 'Rolle / Firma': 'Role / company', 'Vorm.': 'Morning', 'Nachm.': 'Afternoon',
  'Zeile löschen': 'Delete row', 'Text …': 'Text …', 'Zuständig': 'Responsible',
  'offen': 'open', 'wichtig (rot)': 'important (red)',
  '↩ zurücksetzen': '↩ undo', '⚠ Rückfrage: ': '⚠ Query: ',
  '🎤 Diktat': '🎤 Dictate', '+ Punkt': '+ Item', 'Offene Punkte aus Berichten übernehmen': 'Import open points from reports',
  'Punkt Nr.': 'Item no.',
  // Bilder, Unterschrift
  '+ Bilder hinzufügen': '+ Add pictures', 'Bildtext …': 'Picture caption …', 'nach vorne': 'move up', 'nach hinten': 'move down', 'Bild löschen': 'Delete picture',
  'Stand (Datum)': 'Status (date)', 'Unterschrift': 'Signature', 'Noch keine hinterlegt (Einstellungen)': 'None saved yet (Settings)',
  // Aktionen
  '✨ Professionell formulieren': '✨ Polish wording', 'Vorschau (PDF)': 'Preview (PDF)',
  'Prüfen und speichern: Excel + PDF': 'Check and save: Excel + PDF',
  '📁 In Dateien sichern (Excel + PDF)': '📁 Save to Files (Excel + PDF)',
  'Vorschau': 'Preview', 'Jetzt speichern (Excel + PDF)': 'Save now (Excel + PDF)', 'Zurück': 'Back',
  'Bitte prüfen, dann speichern': 'Please check, then save',
  // Gespeichert
  'Gespeicherte Entwürfe': 'Saved drafts', 'Sicherung exportieren (JSON)': 'Export backup (JSON)', 'Sicherung importieren': 'Import backup',
  'Noch nichts gespeichert.': 'Nothing saved yet.', '(ohne Projekt)': '(no project)', 'Bericht': 'Report',
  'Öffnen': 'Open', 'Löschen': 'Delete', 'Übernehmen': 'Apply',
  'Änderungen …': 'Changes …', 'Entwurf gespeichert': 'Draft saved', 'Entwurf konnte nicht gespeichert werden': 'Draft could not be saved',
  // Einstellungen
  'Persönliches': 'Personal', 'Dein Name (Monteur)': 'Your name (fitter)', 'Firmenname im Kopf': 'Company name in header',
  'Logo und Unterschrift': 'Logo and signature', 'Logo auswählen': 'Choose logo', 'Logo entfernen': 'Remove logo',
  'Unterschrift als Bild': 'Signature as image', 'Unterschrift zeichnen': 'Draw signature', 'Unterschrift entfernen': 'Remove signature',
  'KI (professionell formulieren, Übersetzung)': 'AI (polish wording, translation)',
  'Der API-Schlüssel bleibt nur in diesem Browser gespeichert und wird nie in Berichte oder Dateien geschrieben. Nur auf deinem eigenen Laptop eintragen und im Anthropic-Konto ein Monatslimit setzen.':
    'The API key stays in this browser only and is never written into reports or files. Enter it only on your own device and set a monthly limit in the Anthropic account.',
  'API-Schlüssel': 'API key', 'Modell': 'Model', 'Verbindung testen': 'Test connection',
  'Speicherordner (z. B. OneDrive)': 'Save folder (e.g. OneDrive)', 'Ordner wählen': 'Choose folder',
  'Einstellungen speichern': 'Save settings', 'Gespeichert.': 'Saved.',
  'Fertige Berichte werden direkt in diesen Ordner geschrieben. Wähle am besten deinen OneDrive-Ordner für Montageberichte.':
    'Finished reports are written straight into this folder. Best choose your OneDrive folder for installation reports.',
  'Dieser Browser kann nicht direkt in einen Ordner speichern. Die Dateien landen im Download-Ordner (Edge oder Chrome am Laptop nehmen).':
    'This browser cannot save directly into a folder. Files go to the Downloads folder (on a laptop use Edge or Chrome).',
  // Meldungen
  'Bitte das Projekt eintragen (zum Beispiel „P2413 Liseberg“).': 'Please enter the project (for example “P2413 Liseberg”).',
  'Bitte ein Datum eintragen.': 'Please enter a date.',
  'Vorschau wird erstellt …': 'Creating preview …',
  'Excel und PDF werden erstellt …': 'Creating Excel and PDF …',
  'Zuerst oben ein Projekt aus der Liste wählen.': 'First choose a project from the list above.',
  'Projekt aus der Liste entfernt. Es wird erst wieder gemerkt, wenn du einen Bericht dazu speicherst.': 'Project removed from the list. It is remembered again only when you save a report for it.',
  'Neuen leeren Eintrag beginnen? Der aktuelle Entwurf bleibt unter „Gespeichert“.': 'Start a new empty entry? The current draft stays under “Saved”.',
  'Neuer Tag angelegt. Kopf, Hilfsmittel, Team und geplante Arbeiten sind übernommen.': 'New day created. Header, equipment, team and planned work were copied.',
  'Diesen Entwurf wirklich löschen?': 'Really delete this draft?',
  'Bericht wird auf Deutsch ausgegeben.': 'Report will be produced in German.',
  'Für die KI fehlt der API-Schlüssel (Reiter Einstellungen). Ohne KI kannst du trotzdem speichern.': 'The AI needs an API key (Settings tab). You can still save without AI.',
  'Keine neuen offenen Punkte zu diesem Projekt gefunden.': 'No new open points found for this project.',
  'Bitte zuerst das Projekt eintragen, damit ich die passenden Berichte finde.': 'Please enter the project first so I can find the matching reports.',
  'Teilen wird hier nicht unterstützt.': 'Sharing is not supported here.',
  'Die Zeichenfläche ist leer. Bitte zuerst unterschreiben.': 'The drawing area is empty. Please sign first.',
  'Nichts zu formulieren.': 'Nothing to polish.'
};

// Meldungen mit Platzhaltern: [Muster, Ersatz]
const UI_PATTERNS = [
  [/^Du bearbeitest den Eintrag vom (.+)\. Für einen neuen Tag „Neu“ drücken \(bei Montageberichten auch „Neuer Tag aus diesem“\)\. Sonst entsteht beim Speichern eine weitere Datei mit „\(2\)“ im Namen\.$/,
    'You are editing the entry of $1. For a new day press “New” (for installation reports also “New day from this one”). Otherwise saving creates another file with “(2)” in its name.'],
  [/^Hilfsmittel und Team von „(.+)“ übernehmen\? Die aktuellen Einträge werden ersetzt\.$/, 'Copy equipment and team from “$1”? The current entries will be replaced.'],
  [/^Projekt „(.+)“ eingetragen\.$/, 'Project “$1” entered.'],
  [/^Projekt „(.+)“ aus der Liste entfernen\? Bereits gespeicherte Berichte bleiben erhalten\.$/, 'Remove project “$1” from the list? Reports already saved are kept.'],
  [/^Bild konnte nicht gelesen werden: (.+)$/, 'Picture could not be read: $1'],
  [/^Datum übernommen: (.+?)( \(Aufnahmedatum der Fotos\)| \(Dateidatum, die Fotos haben kein Aufnahmedatum\))\. Du kannst es oben ändern\.$/,
    (m, d, how) => 'Date taken over: ' + d + (/Aufnahmedatum der/.test(how) ? ' (date the photos were taken)' : ' (file date, the photos have no capture date)') + '. You can change it above.'],
  [/^Die neuen Fotos sind vom (.+)\. Das Datum des Berichts bleibt (.+)\. Ändere es oben, falls nötig\.$/, 'The new photos are from $1. The report date stays $2. Change it above if needed.'],
  [/^Vorschau fehlgeschlagen: (.+)$/, 'Preview failed: $1'],
  [/^Speichern fehlgeschlagen: (.+)$/, 'Saving failed: $1'],
  [/^Teilen fehlgeschlagen: (.+)$/, 'Sharing failed: $1'],
  [/^Import fehlgeschlagen: (.+)$/, 'Import failed: $1'],
  [/^Speichern nicht möglich: (.+)$/, 'Saving not possible: $1'],
  [/^Der Bericht ist auf Englisch eingestellt, deine Texte sind aber noch nicht übersetzt\. Trotzdem weiter zur Vorschau\? \(„Abbrechen“ und oben auf „Professionell formulieren“ drücken\.\)$/,
    'The report is set to English, but your texts are not translated. Continue to the preview anyway? (“Cancel” and press “Polish wording” above.)'],
  [/^Die Texte wurden noch nicht professionell formuliert\. Trotzdem weiter zur Vorschau\? \(„Abbrechen“ und oben auf „Professionell formulieren“ drücken\.\)$/,
    'The texts have not been polished yet. Continue to the preview anyway? (“Cancel” and press “Polish wording” above.)'],
  [/^Excel und PDF sind fertig \((.+)\)\. Tippe jetzt unten auf „In Dateien sichern“ und wähle im Menü „In Dateien sichern“\.( Hinweis: .*)?$/,
    (m, base, warn) => 'Excel and PDF are ready (' + base + '). Now tap “Save to Files” below and choose “Save to Files” in the menu.' + (warn ? ' Note: the draft itself could not be saved in the browser.' : '')],
  [/^Geteilt\. Wenn du „In Dateien sichern“ gewählt und einen Ordner bestätigt hast, liegen (.+) und (.+) dort\.$/, 'Shared. If you chose “Save to Files” and confirmed a folder, $1 and $2 are there.'],
  [/^Abgebrochen\. Tippe noch einmal auf „In Dateien sichern“, wenn du die Dateien speichern willst\.$/, 'Cancelled. Tap “Save to Files” again if you want to save the files.'],
  [/^Teilen wird hier nicht unterstützt\. Die Dateien wurden heruntergeladen: (.+) und (.+)\.$/, 'Sharing is not supported here. The files were downloaded: $1 and $2.'],
  [/^Gespeichert (.+): (.+) und (.+)\.( Hinweis: .*)?$/,
    (m, where, a, b, warn) => 'Saved ' + where.replace(/^im Ordner „(.+)“$/, 'in folder “$1”').replace(/^im Download-Ordner \((.*)\)$/, 'in the Downloads folder ($1)') + ': ' + a + ' and ' + b + '.' + (warn ? ' Note: the draft itself could not be saved in the browser.' : '')],
  [/^(\d+) Punkt\(e\) aus Berichten übernommen\.$/, '$1 item(s) imported from reports.'],
  [/^Punkt (\d+)$/, 'Item $1'],
  [/^Hilfsmittel Zeile (\d*)$/, 'Equipment row $1'], [/^Einsatzteam Zeile (\d*)$/, 'Team row $1']
];

// Sprache der Oberfläche gilt für die ganze App und bleibt auf dem Gerät gemerkt
let UI_LANG = 'de';
try { if (localStorage.getItem('uiLang') === 'en') UI_LANG = 'en'; } catch (e) { /* ohne Speicher: Deutsch */ }
function setUiLang(l) {
  UI_LANG = l === 'en' ? 'en' : 'de';
  try { localStorage.setItem('uiLang', UI_LANG); } catch (e) { /* ignorieren */ }
}
function uiEn() { return UI_LANG === 'en'; }

function tr(s) {
  if (!uiEn() || typeof s !== 'string' || !s) return s;
  if (Object.prototype.hasOwnProperty.call(UI_EN, s)) return UI_EN[s];
  for (const [re, rep] of UI_PATTERNS) if (re.test(s)) return s.replace(re, rep);
  return s;
}

// Feste Texte im Dokument umschalten (Deutsch gemerkt, damit zurückgeschaltet werden kann)
const UI_ORIG = new WeakMap();
function applyUi() {
  const en = uiEn();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const tag = n.parentElement && n.parentElement.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') continue;
    const had = UI_ORIG.has(n);
    const orig = had ? UI_ORIG.get(n) : n.nodeValue;
    const key = orig.trim();
    if (!key) continue;
    if (en) {
      const t = Object.prototype.hasOwnProperty.call(UI_EN, key) ? UI_EN[key] : null;
      if (t != null) { UI_ORIG.set(n, orig); n.nodeValue = orig.replace(key, t); }
    } else if (had) { n.nodeValue = orig; UI_ORIG.delete(n); }
  }
  document.querySelectorAll('[placeholder],[title]').forEach(e => {
    ['placeholder', 'title'].forEach(a => {
      if (!e.hasAttribute(a)) return;
      const k = 'de' + a;
      const orig = e.dataset[k] !== undefined ? e.dataset[k] : e.getAttribute(a);
      if (en) {
        if (Object.prototype.hasOwnProperty.call(UI_EN, orig)) { e.dataset[k] = orig; e.setAttribute(a, UI_EN[orig]); }
      } else if (e.dataset[k] !== undefined) { e.setAttribute(a, orig); delete e.dataset[k]; }
    });
  });
  document.documentElement.lang = en ? 'en' : 'de';
}

// Abfragen und Hinweisfenster des Browsers ebenfalls übersetzen
(function () {
  const c = window.confirm.bind(window), a = window.alert.bind(window);
  window.confirm = s => c(tr(s));
  window.alert = s => a(tr(s));
})();
