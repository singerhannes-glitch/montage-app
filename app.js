/* Oberfläche der Montage-App */
let R = null;           // aktueller Bericht oder Punchliste
let TAB = 'bericht';    // bericht | punch | liste | settings
let saveTimer = null;

const $ = id => document.getElementById(id);

function el(tag, props, children) {
  const e = document.createElement(tag);
  Object.entries(props || {}).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  });
  (children || []).forEach(c => c && e.appendChild(c));
  return e;
}

function origLine(obj, key, redraw) {
  if (!obj.orig || obj.orig === obj[key]) return null;
  return el('div', { class: 'orig' }, [
    document.createTextNode('Original: ' + obj.orig + ' '),
    el('button', { class: 'ghost', text: '↩ zurücksetzen', onclick: () => { obj[key] = obj.orig; obj.orig = ''; touch(); redraw(); } })
  ]);
}

function msg(text, kind) {
  const m = $('msg');
  m.textContent = text || '';
  m.className = 'msg' + (kind ? ' ' + kind : '');
}

// ---------- Speichern im Browser ----------
function touch() {
  R.updated = Date.now();
  if (pendingShare) { pendingShare = null; $('btn-share').hidden = true; } // geaenderter Bericht: alte Dateien nicht mehr anbieten
  $('autosave').textContent = 'Änderungen …';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await Store.saveReport(R);
      await Store.setKv('last:' + R.type, R.id);
      $('autosave').textContent = 'Entwurf gespeichert';
    } catch (e) {
      $('autosave').textContent = 'Entwurf konnte nicht gespeichert werden';
    }
  }, 500);
}

// ---------- Tabs ----------
async function openTab(tab) {
  TAB = tab;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('view-editor').hidden = !(tab === 'bericht' || tab === 'punch');
  $('view-liste').hidden = tab !== 'liste';
  $('view-settings').hidden = tab !== 'settings';
  if (tab === 'bericht' || tab === 'punch') {
    if (!R || R.type !== tab) {
      if (R) { try { await Store.saveReport(R); } catch (e) { /* ignorieren */ } }
      let next = null;
      try {
        const lastId = await Store.getKv('last:' + tab);
        if (lastId) next = await Store.getReport(lastId);
      } catch (e) { /* Speicher nicht verfügbar: leer starten */ }
      R = next || prefilled(tab);
    }
    renderAll();
    if (R.datum && R.datum !== todayIso() && (R.taetigkeiten.length || R.hinweise.length || R.punkte.length || R.bilder.length)) {
      msg('Du bearbeitest den Eintrag vom ' + isoToDe(R.datum) + '. Für einen neuen Tag „Neu“ drücken (bei Montageberichten auch „Neuer Tag aus diesem“). Sonst entsteht beim Speichern eine weitere Datei mit „(2)“ im Namen.', '');
    }
  } else if (tab === 'liste') {
    renderList();
  } else {
    renderSettings();
  }
}

function prefilled(type) {
  const r = emptyReport(type);
  r.monteur = Settings.data.monteur || '';
  return r;
}

// Ueberschriften im Editor folgen der Berichtssprache (Texte, die du tippst, bleiben wie getippt; uebersetzt wird nur mit KI)
function applyLangLabels() {
  const L = LABELS[R.lang] || LABELS.de;
  document.querySelectorAll('[data-l]').forEach(h => { h.textContent = L[h.dataset.l]; });
  $('h-bilder').textContent = R.type === 'punch' ? L.p2 : L.s4;
  const p1 = document.querySelector('#part-punch h3'); if (p1) p1.textContent = L.p1;
}

// ---------- Editor zeichnen ----------
function renderAll() {
  const isPunch = R.type === 'punch';
  $('part-bericht').hidden = isPunch;
  $('part-punch').hidden = !isPunch;
  $('btn-copy').hidden = isPunch;
  $('lang').value = R.lang;
  applyLangLabels();
  renderProjectSelect();
  $('f-firma').value = R.firma;
  $('f-projekt').value = R.projekt;
  $('f-monteur').value = R.monteur;
  $('f-datum').value = R.datum;
  $('f-wetter').value = R.wetter;
  $('f-stand').value = R.stand;
  renderWetterOrig();
  const sig = Settings.data.signature;
  $('sig-img').hidden = !sig; $('sig-none').hidden = !!sig;
  if (sig) $('sig-img').src = sig;
  renderHm(); renderTeam();
  renderItems('taetigkeiten'); renderItems('geplant'); renderItems('hinweise'); renderItems('punkte');
  renderBilder();
  renderNotes();
}

function renderWetterOrig() {
  const box = $('wetter-orig');
  box.textContent = '';
  if (R.wetterOrig && R.wetterOrig !== R.wetter) {
    box.hidden = false;
    box.appendChild(el('div', { class: 'orig' }, [
      document.createTextNode('Original: ' + R.wetterOrig + ' '),
      el('button', { class: 'ghost', text: '↩ zurücksetzen', onclick: () => { R.wetter = R.wetterOrig; R.wetterOrig = ''; $('f-wetter').value = R.wetter; touch(); renderWetterOrig(); } })
    ]));
  } else box.hidden = true;
}

function renderHm() {
  const box = $('t-hilfsmittel');
  box.textContent = '';
  R.hilfsmittel.forEach((h, i) => {
    const t = el('input', { placeholder: 'Hilfsmittel', value: h.text });
    t.addEventListener('input', () => { h.text = t.value; touch(); });
    const s = el('input', { placeholder: 'Stk', value: h.stk });
    s.addEventListener('input', () => { h.stk = s.value; touch(); });
    const x = el('button', { class: 'x', title: 'Zeile löschen', text: '×', onclick: () => { R.hilfsmittel.splice(i, 1); R.notes = []; touch(); renderHm(); renderNotes(); } });
    box.appendChild(el('div', { class: 'trow hm' }, [t, s, x]));
    const ol = origLine(h, 'text', renderHm);
    if (ol) box.appendChild(ol);
  });
}

function renderTeam() {
  const box = $('t-team');
  box.textContent = '';
  R.team.forEach((m, i) => {
    const t = el('input', { placeholder: 'Rolle / Firma', value: m.rolle });
    t.addEventListener('input', () => { m.rolle = t.value; touch(); });
    const v = el('input', { placeholder: 'Vorm.', value: m.vm });
    v.addEventListener('input', () => { m.vm = v.value; touch(); });
    const n = el('input', { placeholder: 'Nachm.', value: m.nm });
    n.addEventListener('input', () => { m.nm = n.value; touch(); });
    const x = el('button', { class: 'x', title: 'Zeile löschen', text: '×', onclick: () => { R.team.splice(i, 1); R.notes = []; touch(); renderTeam(); renderNotes(); } });
    box.appendChild(el('div', { class: 'trow team' }, [t, v, n, x]));
    const ol = origLine(m, 'rolle', renderTeam);
    if (ol) box.appendChild(ol);
  });
}

const ID_PREFIX = { taetigkeiten: 'taet', geplant: 'gep', hinweise: 'hin', punkte: 'pkt' };

function noteFor(listKey, i) {
  const id = ID_PREFIX[listKey] + ':' + i;
  const n = (R.notes || []).find(x => x.id === id);
  return n ? n.note : '';
}

function newItem(listKey) {
  switch (listKey) {
    case 'taetigkeiten': return { text: '', orig: '', status: 'progress' };
    case 'geplant': return { text: '', orig: '' };
    case 'hinweise': return { text: '', orig: '', wichtig: false };
    default: return { text: '', orig: '', zustaendig: '', status: 'open' };
  }
}

function renderItems(listKey) {
  const box = $('l-' + listKey);
  if (!box) return;
  box.textContent = '';
  R[listKey].forEach((it, i) => {
    const ta = el('textarea', { rows: '1', placeholder: 'Text …' });
    ta.value = it.text;
    const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    ta.addEventListener('input', () => { it.text = ta.value; grow(); touch(); });
    const line = el('div', { class: 'line' }, [ta]);
    const wrap = el('div', { class: 'item' + (listKey === 'punkte' ? ' punkt' : '') }, [line]);

    if (listKey === 'taetigkeiten' || listKey === 'punkte') {
      const sel = el('select', {}, []);
      const opts = listKey === 'taetigkeiten' ? ['progress', 'done'] : ['open', 'done'];
      opts.forEach(o => sel.appendChild(el('option', { value: o, text: LABELS.de[o] })));
      sel.value = it.status;
      const paint = () => { wrap.classList.remove('sel-done', 'sel-progress', 'sel-open'); wrap.classList.add('sel-' + sel.value); };
      sel.addEventListener('change', () => { it.status = sel.value; paint(); touch(); });
      paint();
      if (listKey === 'punkte') {
        const z = el('input', { placeholder: 'Zuständig', value: it.zustaendig || '' });
        z.addEventListener('input', () => { it.zustaendig = z.value; touch(); });
        line.appendChild(z);
      }
      line.appendChild(sel);
    } else if (listKey === 'geplant') {
      line.appendChild(el('span', { class: 'muted', text: 'offen' }));
    } else {
      const cb = el('input', { type: 'checkbox' });
      cb.checked = !!it.wichtig;
      cb.addEventListener('change', () => { it.wichtig = cb.checked; touch(); });
      line.appendChild(el('label', { class: 'check' }, [cb, document.createTextNode('wichtig (rot)')]));
    }
    line.appendChild(el('button', { class: 'x', title: 'Zeile löschen', text: '×', onclick: () => {
      R[listKey].splice(i, 1); R.notes = [];
      if (listKey === 'punkte') R.bilder.forEach(b => { const n = Number(b.nr) || 0; if (n === i + 1) b.nr = ''; else if (n > i + 1) b.nr = String(n - 1); });
      touch(); renderItems(listKey); renderNotes(); if (listKey === 'punkte') renderBilder();
    } }));

    if (it.orig && it.orig !== it.text) {
      const o = el('div', { class: 'orig' }, [
        document.createTextNode('Original: ' + it.orig + ' '),
        el('button', { class: 'ghost', text: '↩ zurücksetzen', onclick: () => { it.text = it.orig; it.orig = ''; touch(); renderItems(listKey); } })
      ]);
      wrap.appendChild(o);
    }
    const note = noteFor(listKey, i);
    if (note) wrap.appendChild(el('div', { class: 'note', text: '⚠ Rückfrage: ' + note }));
    box.appendChild(wrap);
    setTimeout(grow, 0);
  });
}

function renderNotes() {
  const box = $('notes');
  box.textContent = '';
  (R.notes || []).forEach(n => {
    const m = /^(wetter|hm|team|bild):?(\d*)$/.exec(n.id);
    if (!m) return;
    const name = { wetter: 'Wetter', hm: 'Hilfsmittel Zeile ', team: 'Einsatzteam Zeile ', bild: 'Bild ' }[m[1]] + (m[2] !== '' ? Number(m[2]) + 1 : '');
    box.appendChild(el('div', { class: 'note', text: '⚠ ' + name + ': ' + n.note }));
  });
}

function renderBilder() {
  const box = $('l-bilder');
  box.textContent = '';
  R.bilder.forEach((b, i) => {
    const ta = el('textarea', { rows: '2', placeholder: 'Bildtext …' });
    ta.value = b.caption || '';
    ta.addEventListener('input', () => { b.caption = ta.value; touch(); });
    const bar = el('div', { class: 'bar' }, [
      el('button', { class: 'ghost', title: 'nach vorne', text: '←', onclick: () => { if (i > 0) { [R.bilder[i - 1], R.bilder[i]] = [R.bilder[i], R.bilder[i - 1]]; R.notes = []; touch(); renderBilder(); } } }),
      el('button', { class: 'ghost', title: 'nach hinten', text: '→', onclick: () => { if (i < R.bilder.length - 1) { [R.bilder[i + 1], R.bilder[i]] = [R.bilder[i], R.bilder[i + 1]]; R.notes = []; touch(); renderBilder(); } } })
    ]);
    if (R.type === 'punch') {
      const sel = el('select', {}, [el('option', { value: '', text: 'Punkt Nr.' })]);
      R.punkte.forEach((_, k) => sel.appendChild(el('option', { value: String(k + 1), text: 'Punkt ' + (k + 1) })));
      sel.value = b.nr || '';
      sel.addEventListener('change', () => { b.nr = sel.value; touch(); });
      bar.appendChild(sel);
    }
    bar.appendChild(el('button', { class: 'ghost', title: 'Bild löschen', text: '🗑', onclick: () => { R.bilder.splice(i, 1); R.notes = []; touch(); renderBilder(); renderNotes(); } }));
    const cap = el('div', { class: 'bild' }, [el('img', { src: b.data, alt: '' }), ta, bar]);
    const ol = origLine(b, 'caption', renderBilder);
    if (ol) cap.appendChild(ol);
    box.appendChild(cap);
  });
}

// ---------- Projekte (einmal eingeben, danach auswählen) ----------
let PROJEKTE = [];

async function loadProjects() {
  try { PROJEKTE = (await Store.getKv('projekte')) || []; } catch (e) { PROJEKTE = []; }
}

function renderProjectSelect() {
  const sel = $('p-select');
  sel.textContent = '';
  sel.appendChild(el('option', { value: '', text: PROJEKTE.length ? 'Projekt wählen oder unten neu eintragen' : 'Noch kein Projekt gespeichert, unten eintragen' }));
  PROJEKTE.forEach((p, i) => sel.appendChild(el('option', { value: String(i), text: p.projekt + (p.firma ? ' (' + p.firma + ')' : '') })));
  const key = (R ? R.projekt : '').trim().toLowerCase();
  const cur = key ? PROJEKTE.findIndex(p => p.projekt.trim().toLowerCase() === key) : -1;
  sel.value = cur >= 0 ? String(cur) : '';
}

// Aktuelles Projekt in der Liste merken (Firma, Hilfsmittel, Team)
async function rememberProject() {
  if (!R || !R.projekt.trim()) return;
  const key = R.projekt.trim().toLowerCase();
  const data = {
    projekt: R.projekt.trim(), firma: R.firma.trim(),
    hilfsmittel: R.hilfsmittel.filter(h => (h.text || '').trim() || (h.stk || '').trim()),
    team: R.team.filter(t => (t.rolle || '').trim())
  };
  const i = PROJEKTE.findIndex(p => p.projekt.trim().toLowerCase() === key);
  const isNew = i < 0;
  if (isNew) PROJEKTE.push(data);
  else {
    // Gespeicherte Listen nicht mit leeren überschreiben
    if (!data.hilfsmittel.length) data.hilfsmittel = PROJEKTE[i].hilfsmittel || [];
    if (!data.team.length) data.team = PROJEKTE[i].team || [];
    if (!data.firma) data.firma = PROJEKTE[i].firma || '';
    PROJEKTE[i] = data;
  }
  try { await Store.setKv('projekte', PROJEKTE); } catch (e) { /* ignorieren */ }
  if (isNew) renderProjectSelect();
}

function bindProjects() {
  $('p-select').addEventListener('change', () => {
    const v = $('p-select').value;
    if (v === '') return;
    const p = PROJEKTE[Number(v)];
    if (!p) return;
    R.projekt = p.projekt; R.firma = p.firma;
    const has = a => a.some(x => Object.values(x).some(t => String(t || '').trim()));
    const hasSaved = (p.hilfsmittel && p.hilfsmittel.length) || (p.team && p.team.length);
    if (hasSaved && (!has(R.hilfsmittel) && !has(R.team) || confirm('Hilfsmittel und Team von „' + p.projekt + '“ übernehmen? Die aktuellen Einträge werden ersetzt.'))) {
      if (p.hilfsmittel && p.hilfsmittel.length) R.hilfsmittel = JSON.parse(JSON.stringify(p.hilfsmittel));
      if (p.team && p.team.length) R.team = JSON.parse(JSON.stringify(p.team));
    }
    touch(); renderAll();
    msg('Projekt „' + p.projekt + '“ eingetragen.', 'ok');
  });
  $('p-del').addEventListener('click', async () => {
    const v = $('p-select').value;
    if (v === '') { msg('Zuerst oben ein Projekt aus der Liste wählen.', 'err'); return; }
    const p = PROJEKTE[Number(v)];
    if (!confirm('Projekt „' + p.projekt + '“ aus der Liste entfernen? Bereits gespeicherte Berichte bleiben erhalten.')) return;
    PROJEKTE.splice(Number(v), 1);
    try { await Store.setKv('projekte', PROJEKTE); } catch (e) { /* ignorieren */ }
    renderProjectSelect();
    msg('Projekt aus der Liste entfernt. Es wird erst wieder gemerkt, wenn du einen Bericht dazu speicherst.', 'ok');
  });
}

// ---------- Datum aus Fotos (EXIF) ----------
async function exifDate(file) {
  try {
    const buf = await file.slice(0, 131072).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return null;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off), len = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
        const t = off + 10;
        const le = v.getUint16(t) === 0x4949;
        const g16 = o => v.getUint16(t + o, le), g32 = o => v.getUint32(t + o, le);
        const ifd = o => {
          const out = {}, n = g16(o);
          for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; out[g16(e)] = { cnt: g32(e + 4), val: g32(e + 8) }; }
          return out;
        };
        const i0 = ifd(g32(4));
        const ex = i0[0x8769] ? ifd(i0[0x8769].val) : {};
        const e = ex[0x9003] || ex[0x9004] || i0[0x0132];
        if (!e) return null;
        let s = '';
        for (let i = 0; i < Math.min(e.cnt, 19); i++) s += String.fromCharCode(v.getUint8(t + e.val + i));
        const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(s);
        return m && Number(m[1]) >= 2000 && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[3]) >= 1 && Number(m[3]) <= 31 ? m[1] + '-' + m[2] + '-' + m[3] : null;
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      off += 2 + len;
    }
  } catch (e) { /* kein EXIF lesbar */ }
  return null;
}

// Liefert { date, exif }: exif=true, wenn das Aufnahmedatum im Foto steht
async function photoDate(file) {
  const d = await exifDate(file);
  if (d) return { date: d, exif: true };
  if (file.lastModified) {
    const x = new Date(file.lastModified), p = n => String(n).padStart(2, '0');
    if (x.getFullYear() >= 2000) return { date: x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()), exif: false };
  }
  return null;
}

// Häufigstes Datum, bei Gleichstand das früheste
function pickDate(entries) {
  const list0 = entries.filter(Boolean);
  const withExif = list0.filter(e => e.exif);
  const used = withExif.length ? withExif : list0;
  const count = {};
  used.map(e => e.date).forEach(d => { count[d] = (count[d] || 0) + 1; });
  const list = Object.keys(count).sort((a, b) => count[b] - count[a] || (a < b ? -1 : 1));
  return list[0] || null;
}

// ---------- Eingabefelder ----------
function bindFields() {
  const map = { 'f-firma': 'firma', 'f-projekt': 'projekt', 'f-monteur': 'monteur', 'f-datum': 'datum', 'f-wetter': 'wetter', 'f-stand': 'stand' };
  Object.entries(map).forEach(([id, key]) => {
    $(id).addEventListener('input', () => { R[key] = $(id).value; touch(); });
  });
  $('lang').addEventListener('change', () => {
    R.lang = $('lang').value;
    R.polished = false;
    touch();
    applyLangLabels();
    const ki = !!(Settings.data.apiKey || '').trim();
    msg(R.lang === 'en'
      ? 'Überschriften und Beschriftungen im Bericht sind jetzt englisch. ' + (ki ? 'Deine Texte übersetzt „Professionell formulieren“.' : 'Deine eigenen Texte bleiben so, wie du sie getippt hast. Bitte gleich auf Englisch schreiben, übersetzen kann die App offline nicht.')
      : 'Bericht wird auf Deutsch ausgegeben.', '');
  });
  $('add-hm').addEventListener('click', () => { R.hilfsmittel.push({ text: '', stk: '' }); touch(); renderHm(); });
  $('add-team').addEventListener('click', () => { R.team.push({ rolle: '', vm: '', nm: '' }); touch(); renderTeam(); });
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.add;
    R[k].push(newItem(k)); touch(); renderItems(k);
    const last = $('l-' + k).querySelector('.item:last-child textarea');
    if (last) last.focus();
  }));
  document.querySelectorAll('[data-mic]').forEach(b => b.addEventListener('click', () => dictate(b.dataset.mic, b)));
  $('in-bilder').addEventListener('change', async ev => {
    const files = Array.from(ev.target.files || []);
    const target = R;
    const hadPics = target.bilder.length > 0;
    const dates = [];
    for (const f of files) {
      try {
        const pd = await photoDate(f);
        const img = await shrinkImage(f, 1600, 'image/jpeg', 0.82);
        target.bilder.push({ data: img.data, w: img.w, h: img.h, caption: '', orig: '', nr: '' });
        dates.push(pd);
      } catch (e) { msg('Bild konnte nicht gelesen werden: ' + f.name, 'err'); }
    }
    ev.target.value = '';
    const d = pickDate(dates);
    const fromExif = dates.some(e => e && e.exif);
    if (d && target === R) {
      if (!hadPics && R.datum !== d) {
        R.datum = d; R.stand = d;
        $('f-datum').value = d; $('f-stand').value = d;
        msg('Datum übernommen: ' + isoToDe(d) + (fromExif ? ' (Aufnahmedatum der Fotos)' : ' (Dateidatum, die Fotos haben kein Aufnahmedatum)') + '. Du kannst es oben ändern.', 'ok');
      } else if (hadPics && R.datum !== d) {
        msg('Die neuen Fotos sind vom ' + isoToDe(d) + '. Das Datum des Berichts bleibt ' + isoToDe(R.datum) + '. Ändere es oben, falls nötig.', '');
      }
    }
    if (target === R) { touch(); renderBilder(); }
    else { try { await Store.saveReport(target); } catch (e) { /* ignorieren */ } }
  });
  $('btn-new').addEventListener('click', async () => {
    if (!confirm('Neuen leeren Eintrag beginnen? Der aktuelle Entwurf bleibt unter „Gespeichert“.')) return;
    try { await Store.saveReport(R); } catch (e) { /* Speicher nicht verfügbar */ }
    R = prefilled(R.type);
    try { await Store.setKv('last:' + R.type, R.id); } catch (e) { /* ignorieren */ }
    msg('', ''); renderAll();
  });
  $('btn-copy').addEventListener('click', async () => {
    try { await Store.saveReport(R); } catch (e) { /* Speicher nicht verfügbar */ }
    const n = prefilled('bericht');
    n.lang = R.lang; n.firma = R.firma; n.projekt = R.projekt; n.monteur = R.monteur;
    n.hilfsmittel = JSON.parse(JSON.stringify(R.hilfsmittel));
    n.team = JSON.parse(JSON.stringify(R.team));
    n.geplant = JSON.parse(JSON.stringify(R.geplant));
    R = n;
    try { await Store.saveReport(R); await Store.setKv('last:bericht', R.id); } catch (e) { /* ignorieren */ }
    msg('Neuer Tag angelegt. Kopf, Hilfsmittel, Team und geplante Arbeiten sind übernommen.', 'ok');
    renderAll();
  });
  $('btn-import-punkte').addEventListener('click', importPunkte);
  $('btn-polish').addEventListener('click', polish);
  $('btn-preview').addEventListener('click', () => preview(false));
  $('btn-save').addEventListener('click', () => preview(true));
  $('modal-save').addEventListener('click', saveFiles);
  $('modal-close').addEventListener('click', () => { $('modal').hidden = true; $('modal-frame').src = 'about:blank'; if (lastPreviewUrl) { URL.revokeObjectURL(lastPreviewUrl); lastPreviewUrl = null; } });
}

// ---------- Bilder verkleinern ----------
function shrinkImage(file, maxSide, type, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ data: c.toDataURL(type, quality), w, h });
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild nicht lesbar')); };
    im.src = url;
  });
}

// ---------- Diktat ----------
let recog = null;
function dictate(listKey, btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { msg('Diktat geht in diesem Browser nicht. Am Laptop Edge oder Chrome nehmen, am iPhone die Diktierfunktion der Tastatur.', 'err'); return; }
  if (recog) { recog.stop(); return; }
  recog = new SR();
  recog.lang = $('dict-lang').value || 'de-AT';
  recog.interimResults = false;
  recog.continuous = false;
  const old = btn.textContent;
  btn.textContent = '⏺ Ich höre … (nochmal drücken = Stopp)';
  recog.onresult = ev => {
    const text = Array.from(ev.results).map(r => r[0].transcript).join(' ').trim();
    if (text) {
      const it = newItem(listKey);
      it.text = text.charAt(0).toUpperCase() + text.slice(1);
      R[listKey].push(it);
      touch(); renderItems(listKey);
    }
  };
  recog.onerror = ev => {
    const t = { 'not-allowed': 'Das Mikrofon ist gesperrt. In Edge oben neben der Adresse das Mikrofon erlauben.', 'service-not-allowed': 'Das Mikrofon ist gesperrt. In Edge das Mikrofon erlauben.', 'network': 'Die Spracherkennung braucht Internet.', 'no-speech': 'Ich habe nichts gehört. Bitte noch einmal.', 'audio-capture': 'Kein Mikrofon gefunden.' };
    msg('Diktat: ' + (t[ev.error] || ev.error), 'err');
  };
  recog.onend = () => { btn.textContent = old; recog = null; };
  try { recog.start(); } catch (e) { recog = null; btn.textContent = old; }
}

// ---------- Punchliste aus Berichten ----------
async function importPunkte() {
  const key = s => (s || '').trim().toLowerCase();
  if (!R.projekt.trim()) { msg('Bitte zuerst das Projekt eintragen, damit ich die passenden Berichte finde.', 'err'); return; }
  const all = await Store.allReports();
  const have = new Set(R.punkte.map(p => key(p.text)));
  let added = 0;
  all.filter(x => x.type === 'bericht' && key(x.projekt) === key(R.projekt)).forEach(rep => {
    rep.hinweise.forEach(h => {
      if (h.text.trim() && !have.has(key(h.text))) {
        R.punkte.push({ text: h.text.trim(), orig: '', zustaendig: '', status: 'open' });
        have.add(key(h.text)); added++;
      }
    });
  });
  touch(); renderItems('punkte');
  msg(added ? added + ' Punkt(e) aus Berichten übernommen.' : 'Keine neuen offenen Punkte zu diesem Projekt gefunden.', added ? 'ok' : '');
}

// ---------- KI ----------
async function polish() {
  if (!Settings.data.apiKey) { msg('Für die KI fehlt der API-Schlüssel (Reiter Einstellungen). Ohne KI kannst du trotzdem speichern.', 'err'); return; }
  const b = $('btn-polish');
  b.disabled = true; msg('Die KI formuliert … (das dauert ein paar Sekunden)', '');
  try {
    const res = await AI.polish(R);
    R.polished = !res.missing;
    touch(); renderAll();
    msg(res.count ? `${res.count} Zeilen formuliert. Bitte kurz prüfen, das Original steht jeweils darunter.` + (res.missing ? ` ${res.missing} Zeile(n) hat die KI nicht zurückgegeben, sie bleiben unverändert.` : '') : 'Nichts zu formulieren.', res.count ? 'ok' : '');
  } catch (e) {
    msg(e.message, 'err');
  } finally { b.disabled = false; }
}

// ---------- Export ----------
function exportCopy() {
  const c = JSON.parse(JSON.stringify(R));
  c.hilfsmittel = c.hilfsmittel.filter(h => (h.text || '').trim() || (h.stk || '').trim());
  c.team = c.team.filter(t => (t.rolle || '').trim() || (t.vm || '').trim() || (t.nm || '').trim());
  ['taetigkeiten', 'geplant', 'hinweise'].forEach(k => { c[k] = c[k].filter(i => (i.text || '').trim()); });
  const keep = [];
  c.punkte.forEach((p, idx) => { if ((p.text || '').trim()) keep.push(idx + 1); });
  c.bilder.forEach(b => { const n = Number(b.nr) || 0; const pos = keep.indexOf(n); b.nr = pos >= 0 ? String(pos + 1) : ''; });
  c.punkte = c.punkte.filter(p => (p.text || '').trim());
  return c;
}

let lastPreviewUrl = null;

async function preview(forSave) {
  try {
    if (!R.projekt.trim() && forSave) { msg('Bitte das Projekt eintragen (zum Beispiel „P2413 Liseberg“).', 'err'); return; }
    if (!R.datum && forSave) { msg('Bitte ein Datum eintragen.', 'err'); return; }
    if (forSave && !R.polished && (Settings.data.apiKey || R.lang === 'en')) {
      const why = R.lang === 'en'
        ? 'Der Bericht ist auf Englisch eingestellt, deine Texte sind aber noch nicht übersetzt.'
        : 'Die Texte wurden noch nicht professionell formuliert.';
      if (!confirm(why + ' Trotzdem weiter zur Vorschau? („Abbrechen“ und oben auf „Professionell formulieren“ drücken.)')) return;
    }
    msg('Vorschau wird erstellt …', '');
    const doc = await buildPdf(exportCopy(), Settings.data);
    if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
    const url = URL.createObjectURL(doc.output('blob'));
    lastPreviewUrl = url;
    $('modal-frame').src = url;
    $('modal-title').textContent = forSave ? 'Bitte prüfen, dann speichern' : 'Vorschau';
    $('modal-save').hidden = !forSave;
    $('modal').hidden = false;
    msg('', '');
  } catch (e) { msg('Vorschau fehlgeschlagen: ' + e.message, 'err'); }
}

// Freien Dateinamen finden, ohne vorhandene Dateien zu überschreiben
async function freeName(dir, base) {
  const exists = async n => {
    try { await dir.getFileHandle(n); return true; }
    catch (e) { if (e && e.name === 'NotFoundError') return false; throw e; }
  };
  let name = base, k = 2;
  while ((await exists(name + '.xlsx')) || (await exists(name + '.pdf'))) { name = base + ' (' + k + ')'; k++; }
  return name;
}

// iPhone/iPad: Dateien ueber das Teilen-Menue in "Dateien" sichern (Excel und PDF zusammen in einem Schritt).
// Safari erlaubt das Teilen nur direkt nach einem Fingertipp, darum gibt es nach dem Erstellen einen eigenen Knopf.
let pendingShare = null;
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

async function shareFiles() {
  if (!pendingShare) return;
  const { xlsx, pdf, base } = pendingShare;
  const files = [
    new File([xlsx], base + '.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    new File([pdf], base + '.pdf', { type: 'application/pdf' })
  ];
  try {
    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share({ files, title: base });
      msg('Geteilt. Wenn du „In Dateien sichern“ gewählt und einen Ordner bestätigt hast, liegen ' + base + '.xlsx und ' + base + '.pdf dort.', 'ok');
    } else {
      downloadBlob(xlsx, base + '.xlsx');
      setTimeout(() => downloadBlob(pdf, base + '.pdf'), 400);
      msg('Teilen wird hier nicht unterstützt. Die Dateien wurden heruntergeladen: ' + base + '.xlsx und ' + base + '.pdf.', 'ok');
    }
  } catch (e) {
    if (e && e.name === 'AbortError') msg('Abgebrochen. Tippe noch einmal auf „In Dateien sichern“, wenn du die Dateien speichern willst.', '');
    else msg('Teilen fehlgeschlagen: ' + (e && e.message ? e.message : e), 'err');
  }
}

async function saveFiles() {
  const btn = $('modal-save');
  btn.disabled = true;
  $('modal').hidden = true; $('modal-frame').src = 'about:blank';
  msg('Excel und PDF werden erstellt …', '');
  try {
    // Ordner zuerst holen, solange der Klick noch frisch ist
    let dir = null, reason = '';
    if (Folder.supported()) {
      try {
        try { dir = await Folder.get(true); } catch (e) { dir = null; }
        if (!dir) dir = await Folder.choose();
      } catch (e) { dir = null; reason = e && e.name === 'AbortError' ? 'Kein Ordner gewählt' : 'Ordner nicht beschreibbar'; }
    } else reason = 'Dieser Browser kann nicht direkt in Ordner speichern';
    const c = exportCopy();
    const [xlsx, doc] = await Promise.all([buildXlsx(c, Settings.data), buildPdf(c, Settings.data)]);
    const pdf = doc.output('blob');
    let base = reportFileBase(c);
    let where = '';
    let xlsxDone = false, pdfDone = false;
    if (isIos()) {
      pendingShare = { xlsx, pdf, base };
      $('btn-share').hidden = false;
      let warn = '';
      try { await Store.saveReport(R); } catch (e) { warn = ' Hinweis: Der Entwurf selbst konnte im Browser nicht gespeichert werden.'; }
      try { await rememberProject(); } catch (e) { /* ignorieren */ }
      msg('Excel und PDF sind fertig (' + base + '). Tippe jetzt unten auf „In Dateien sichern“ und wähle im Menü „In Dateien sichern“.' + warn, warn ? 'err' : 'ok');
      return;
    }
    if (dir) {
      try {
        base = await freeName(dir, base);
        await Folder.writeFile(dir, base + '.xlsx', xlsx); xlsxDone = true;
        await Folder.writeFile(dir, base + '.pdf', pdf); pdfDone = true;
        where = 'im Ordner „' + dir.name + '“';
      } catch (e) {
        dir = null; reason = 'Schreiben im Ordner nicht möglich (ist die Datei in Excel offen?)';
      }
    }
    if (!dir) {
      if (!xlsxDone) downloadBlob(xlsx, base + '.xlsx');
      if (!pdfDone) setTimeout(() => downloadBlob(pdf, base + '.pdf'), 400);
      where = 'im Download-Ordner (' + reason + ')';
    }
    let warn = '';
    try { await Store.saveReport(R); } catch (e) { warn = ' Hinweis: Der Entwurf selbst konnte im Browser nicht gespeichert werden.'; }
    try { await rememberProject(); } catch (e) { /* ignorieren */ }
    msg('Gespeichert ' + where + ': ' + base + '.xlsx und ' + base + '.pdf.' + warn, warn ? 'err' : 'ok');
  } catch (e) {
    msg('Speichern fehlgeschlagen: ' + e.message, 'err');
  } finally { btn.disabled = false; }
}

// ---------- Gespeicherte Entwürfe ----------
async function renderList() {
  const box = $('list');
  box.textContent = '';
  const all = await Store.allReports();
  if (!all.length) box.appendChild(el('p', { class: 'muted', text: 'Noch nichts gespeichert.' }));
  all.forEach(rep => {
    const title = `${isoToDe(rep.datum)}  ${rep.projekt || '(ohne Projekt)'}`;
    box.appendChild(el('div', { class: 'list-row' }, [
      el('span', { class: 'tag', text: rep.type === 'punch' ? 'Punchliste' : 'Bericht' }),
      el('span', { class: 't', text: title + (rep.lang === 'en' ? '  (EN)' : '') }),
      el('button', { class: 'small ghost', text: 'Öffnen', onclick: async () => { R = rep; await Store.setKv('last:' + rep.type, rep.id); openTab(rep.type); } }),
      el('button', { class: 'small ghost', text: 'Löschen', onclick: async () => {
        if (!confirm('Diesen Entwurf wirklich löschen?')) return;
        await Store.deleteReport(rep.id);
        if (R && R.id === rep.id) R = null;
        renderList();
      } })
    ]));
  });
}

async function exportAll() {
  const all = await Store.allReports();
  const blob = new Blob([JSON.stringify({ app: 'montage-app', version: 1, reports: all, projekte: PROJEKTE })], { type: 'application/json' });
  downloadBlob(blob, 'Montage-App Sicherung ' + todayIso() + '.json');
}

async function importAll(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.reports)) throw new Error('Datei passt nicht');
    for (const rep of data.reports) { if (rep && rep.id && rep.type) await Store.saveReport(rep); }
    if (Array.isArray(data.projekte)) {
      data.projekte.forEach(p => { if (p && p.projekt && !PROJEKTE.some(x => x.projekt.trim().toLowerCase() === p.projekt.trim().toLowerCase())) PROJEKTE.push(p); });
      await Store.setKv('projekte', PROJEKTE);
    }
    renderList();
  } catch (e) { alert('Import fehlgeschlagen: ' + e.message); }
}

// ---------- Einstellungen ----------
// KI und Diktat gibt es nur mit API-Schluessel (nur Hannes). Die Kollegen-Version bleibt schlank und offline.
// Den Schluessel-Bereich zeigt die Seite nur mit "#ki" hinter der Adresse oder wenn schon ein Schluessel da ist.
function applyKiMode() {
  const has = !!(Settings.data.apiKey || '').trim();
  document.body.classList.toggle('ki', has);
  $('card-ki').hidden = !(has || location.hash === '#ki');
}

function renderSettings() {
  applyKiMode();
  const s = Settings.data;
  $('s-monteur').value = s.monteur || '';
  $('s-firma').value = s.firmaName || '';
  $('s-key').value = s.apiKey || '';
  $('s-model').value = s.model || '';
  $('logo-img').hidden = !s.logo; if (s.logo) $('logo-img').src = s.logo;
  $('sig-prev').hidden = !s.signature; if (s.signature) $('sig-prev').src = s.signature;
  $('folder-info').textContent = Folder.supported()
    ? 'Fertige Berichte werden direkt in diesen Ordner geschrieben. Wähle am besten deinen OneDrive-Ordner für Montageberichte.'
    : 'Dieser Browser kann nicht direkt in einen Ordner speichern. Die Dateien landen im Download-Ordner (Edge oder Chrome am Laptop nehmen).';
  $('btn-folder').hidden = !Folder.supported();
  if (Folder.supported()) Store.getKv('folder').then(h => { if (h) $('folder-info').textContent += ' Aktuell: ' + h.name; });
}

function bindSettings() {
  $('btn-settings-save').addEventListener('click', async () => {
    const s = Settings.data;
    s.monteur = $('s-monteur').value.trim();
    s.firmaName = $('s-firma').value.trim() || 'Chairkit Fördertechnik GmbH';
    s.apiKey = $('s-key').value.trim();
    s.model = $('s-model').value.trim() || 'claude-sonnet-5-5';
    try { await Settings.save(); applyKiMode(); $('s-msg').textContent = 'Gespeichert.'; }
    catch (e) { $('s-msg').textContent = 'Speichern nicht möglich: ' + e.message; }
    setTimeout(() => { $('s-msg').textContent = ''; }, 3500);
  });
  $('s-logo').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    const png = /png/i.test(f.type);
    try {
      const img = await shrinkImage(f, 900, png ? 'image/png' : 'image/jpeg', 0.9);
      Settings.data.logo = img.data; await Settings.save(); renderSettings();
    } catch (e) { $('s-msg').textContent = 'Logo konnte nicht übernommen werden: ' + e.message; }
    ev.target.value = '';
  });
  $('logo-del').addEventListener('click', async () => { Settings.data.logo = ''; await Settings.save(); renderSettings(); });
  $('s-sig').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    const png = /png/i.test(f.type);
    try {
      const img = await shrinkImage(f, 700, png ? 'image/png' : 'image/jpeg', 0.9);
      Settings.data.signature = img.data; await Settings.save(); renderSettings();
    } catch (e) { $('s-msg').textContent = 'Unterschrift konnte nicht übernommen werden: ' + e.message; }
    ev.target.value = '';
  });
  $('sig-del').addEventListener('click', async () => { Settings.data.signature = ''; await Settings.save(); renderSettings(); });
  $('btn-folder').addEventListener('click', async () => {
    try { await Folder.choose(); renderSettings(); } catch (e) { /* abgebrochen */ }
  });
  $('btn-test-ai').addEventListener('click', async () => {
    Settings.data.apiKey = $('s-key').value.trim();
    Settings.data.model = $('s-model').value.trim() || 'claude-sonnet-5-5';
    $('ai-test').textContent = 'Teste …';
    try { const a = await AI.ping(); $('ai-test').textContent = 'Verbindung ok (' + a.slice(0, 20) + ')'; }
    catch (e) { $('ai-test').textContent = e.message; }
  });

  // Unterschrift zeichnen
  const cv = $('sig-canvas'), ctx = cv.getContext('2d');
  let drawing = false, last = null;
  const pos = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cv.width / r.width, y: (ev.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', ev => { drawing = true; last = pos(ev); cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', ev => {
    if (!drawing) return;
    const p = pos(ev);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  });
  const stop = () => { drawing = false; };
  cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
  $('sig-draw').addEventListener('click', () => { cv.hidden = false; $('sig-tools').hidden = false; ctx.clearRect(0, 0, cv.width, cv.height); });
  $('sig-clear').addEventListener('click', () => ctx.clearRect(0, 0, cv.width, cv.height));
  $('sig-ok').addEventListener('click', async () => {
    const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let drawn = false;
    for (let k = 3; k < px.length; k += 4) { if (px[k] > 0) { drawn = true; break; } }
    if (!drawn) { alert('Die Zeichenfläche ist leer. Bitte zuerst unterschreiben.'); return; }
    Settings.data.signature = cv.toDataURL('image/png');
    await Settings.save();
    cv.hidden = true; $('sig-tools').hidden = true; renderSettings();
  });
}

// ---------- Start ----------
async function init() {
  let storeOk = true;
  try {
    await Settings.load();
  } catch (e) {
    storeOk = false;
  }
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => openTab(b.dataset.tab)));
  $('btn-export-all').addEventListener('click', exportAll);
  $('btn-share').addEventListener('click', shareFiles);
  $('in-import').addEventListener('change', ev => { if (ev.target.files[0]) importAll(ev.target.files[0]); ev.target.value = ''; });
  await loadProjects();
  bindFields();
  bindProjects();
  bindSettings();
  applyKiMode();
  await openTab('bericht');
  if (!storeOk) msg('Der Speicher im Browser ist nicht verfügbar (privates Fenster?). Entwürfe und Einstellungen bleiben nicht erhalten. Excel und PDF kannst du trotzdem erzeugen.', 'err');
  if (!Settings.data.monteur && !Settings.data.logo) { /* erste Nutzung: Hinweis nur im Reiter Einstellungen */ }
}

window.addEventListener('beforeunload', () => { if (R) { try { Store.saveReport(R); } catch (e) { /* ignorieren */ } } });
init();
