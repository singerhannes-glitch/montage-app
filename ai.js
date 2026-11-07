/* KI-Anbindung: professionell formulieren und ggf. übersetzen. Optional, die App läuft auch ohne. */
const AI = (() => {
  const SYSTEM = `Du bist Lektor für Montageberichte einer Fördertechnik-Firma. Du bekommst Textzeilen eines Monteurs (Deutsch oder Englisch, oft Umgangssprache, Tippfehler, Dialekt) und gibst sie professionell, sachlich und sprachlich korrekt formuliert in der Zielsprache zurück.

Regeln, die immer gelten:
- Zahlen bleiben exakt wie eingegeben (Ziffern, Maße, Stückzahlen, Uhrzeiten, Nummern).
- Erfinde nichts. Ändere oder ergänze keine Namen, Firmen, Zahlen, Maße, Uhrzeiten, Orte, Ursachen oder Verantwortliche.
- Behalte Eigennamen, Projektnummern, Produktnamen und Abkürzungen unverändert (z. B. "LaunchCon", "Tunga Lyft", "Level 2", "Kettenzug").
- Kurz und knapp: eine Zeile bleibt eine Zeile, kein Fließtext, keine Ausrufezeichen, keine Wertung, keine Schuldzuweisung.
- Tätigkeiten und Bildtexte: Stichwortstil oder kurzer Satz. Hinweise: sachlicher Satz.
- Bei Wetter, Hilfsmitteln und Teamrollen nur kurze Begriffe, keine Sätze.
- Wenn die Zeile schon korrekt und professionell ist, gib sie nur mit korrigierter Rechtschreibung zurück.
- Fehlt eine wichtige Angabe (zum Beispiel wurde etwas gestoppt, aber nicht gesagt, wer informiert wurde), formuliere trotzdem nur aus dem Gegebenen und schreibe in "note" eine kurze Rückfrage in der Sprache des Monteurs (Deutsch). Sonst lass "note" leer.

Antworte NUR mit JSON, ohne Erklärung und ohne Codeblock, in diesem Format:
{"items":[{"id":"...","text":"...","note":""}]}
Jede Eingabe-ID kommt genau einmal vor.`;

  function collect(r) {
    const items = [];
    const add = (id, kind, text) => { if (text && text.trim()) items.push({ id, kind, text: text.trim() }); };
    add('wetter', 'Wetter', r.wetter);
    r.hilfsmittel.forEach((h, i) => add('hm:' + i, 'Montagehilfsmittel', h.text));
    r.team.forEach((t, i) => add('team:' + i, 'Teamrolle/Firma', t.rolle));
    r.taetigkeiten.forEach((t, i) => add('taet:' + i, 'Durchgeführte Tätigkeit', t.text));
    r.geplant.forEach((t, i) => add('gep:' + i, 'Geplante Arbeit', t.text));
    r.hinweise.forEach((t, i) => add('hin:' + i, 'Offener Punkt / technischer Hinweis', t.text));
    r.punkte.forEach((t, i) => add('pkt:' + i, 'Punchlisten-Punkt', t.text));
    r.bilder.forEach((t, i) => add('bild:' + i, 'Bildtext', t.caption));
    return items;
  }

  function target(r, id) {
    const [k, i] = id.split(':');
    const n = Number(i);
    switch (k) {
      case 'wetter': return { get: () => r.wetter, set: v => { r.wetter = v; }, obj: r, origKey: 'wetterOrig' };
      case 'hm': return { get: () => r.hilfsmittel[n].text, set: v => { r.hilfsmittel[n].text = v; }, obj: r.hilfsmittel[n] };
      case 'team': return { get: () => r.team[n].rolle, set: v => { r.team[n].rolle = v; }, obj: r.team[n] };
      case 'taet': return { get: () => r.taetigkeiten[n].text, set: v => { r.taetigkeiten[n].text = v; }, obj: r.taetigkeiten[n] };
      case 'gep': return { get: () => r.geplant[n].text, set: v => { r.geplant[n].text = v; }, obj: r.geplant[n] };
      case 'hin': return { get: () => r.hinweise[n].text, set: v => { r.hinweise[n].text = v; }, obj: r.hinweise[n] };
      case 'pkt': return { get: () => r.punkte[n].text, set: v => { r.punkte[n].text = v; }, obj: r.punkte[n] };
      case 'bild': return { get: () => r.bilder[n].caption, set: v => { r.bilder[n].caption = v; }, obj: r.bilder[n] };
      default: return null;
    }
  }

  function parseJson(text) {
    let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  async function call(system, user) {
    const key = (Settings.data.apiKey || '').trim();
    if (!key) throw new Error('Kein API-Schlüssel hinterlegt (Reiter Einstellungen).');
    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: Settings.data.model || 'claude-sonnet-5-5',
          max_tokens: 8000,
          system,
          messages: [{ role: 'user', content: user }]
        })
      });
    } catch (e) {
      throw new Error('Keine Verbindung zur KI. Internet oder Firmennetz prüfen. (' + e.message + ')');
    }
    if (!res.ok) {
      let msg = res.status + '';
      try { msg += ' ' + (await res.json()).error.message; } catch (e) { /* ignorieren */ }
      throw new Error('KI-Fehler: ' + msg);
    }
    const data = await res.json();
    return (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  }

  // Formuliert alle Freitexte des Berichts um. Gibt die Rückfragen zurück.
  async function polish(r) {
    const items = collect(r);
    if (!items.length) return { count: 0, notes: [], missing: 0 };
    const zielsprache = r.lang === 'en' ? 'Englisch (British, technisch)' : 'Deutsch (Österreich, Hochsprache, Schreibweise mit ß)';
    const results = [];
    for (let i = 0; i < items.length; i += 25) {
      const user = `Zielsprache: ${zielsprache}\n\nEingabe:\n` + JSON.stringify({ items: items.slice(i, i + 25) });
      const raw = await call(SYSTEM, user);
      let out;
      try { out = parseJson(raw); } catch (e) { throw new Error('Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.'); }
      (Array.isArray(out.items) ? out.items : []).forEach(x => { if (x && typeof x === 'object') results.push(x); });
    }
    const nums = s => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.')).sort().join('|');
    const sent = new Set(items.map(x => x.id));
    const done = new Set();
    const seen = new Set(results.map(x => String(x.id)));
    const missing = items.filter(x => !seen.has(x.id)).length;
    const notes = [];
    let count = 0;
    results.forEach(it => {
      const id = String(it.id);
      if (!sent.has(id) || done.has(id)) return;
      let t = null;
      try { t = target(r, id); if (t) t.get(); } catch (e) { t = null; }
      if (!t || typeof it.text !== 'string' || !it.text.trim()) return;
      done.add(id);
      const before = t.get();
      if (nums(before) !== nums(it.text)) notes.push({ id: it.id, note: 'Zahlen haben sich geändert, bitte prüfen.' });
      if (!t.obj.orig && !(t.origKey && r[t.origKey])) {
        if (t.origKey) r[t.origKey] = before; else t.obj.orig = before;
      }
      t.set(it.text.trim());
      count++;
      if (it.note && String(it.note).trim()) notes.push({ id: it.id, note: String(it.note).trim() });
    });
    r.notes = notes;
    return { count, notes, missing };
  }

  // Einfacher Test, ob die Verbindung und der Schlüssel funktionieren
  async function ping() {
    const raw = await call('Antworte nur mit dem Wort OK.', 'Test');
    return raw.trim();
  }

  return { polish, ping };
})();
