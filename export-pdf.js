/* PDF-Ausgabe im Look des bisherigen Montageberichts (jsPDF, Maße in mm, A4 hochkant) */
const imgDimCache = new Map();

function imgDims(dataUrl) {
  if (imgDimCache.has(dataUrl)) return Promise.resolve(imgDimCache.get(dataUrl));
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => {
      const d = { w: im.naturalWidth || 1, h: im.naturalHeight || 1 };
      imgDimCache.set(dataUrl, d);
      resolve(d);
    };
    im.onerror = () => resolve({ w: 1, h: 1 });
    im.src = dataUrl;
  });
}

function imgFormat(dataUrl) {
  return /^data:image\/png/i.test(dataUrl) ? 'PNG' : 'JPEG';
}

// Zeichen, die in den Standardschriften von PDF fehlen, durch einfache ersetzen
function pdfText(s) {
  return String(s == null ? '' : s)
    .replace(/€/g, 'EUR')
    .replace(/[^\x00-ÿ–—‘’“”„…]/g, ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/đ/g, 'd').replace(/Đ/g, 'D'))
    .replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”„]/g, '"')
    .replace(/…/g, '...').replace(/ /g, ' ').replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, '');
}

function rgb(hex) {
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

async function buildPdf(r, settings) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const L = LABELS[r.lang] || LABELS.de;
  const M = 15, W = 180, PAGE_H = 297, BOTTOM = 282;
  let y = 12;

  const fill = hex => doc.setFillColor(...rgb(hex));
  const ink = hex => doc.setTextColor(...rgb(hex));
  // Eine Schrift (Times) in einer Größe für den ganzen Bericht, nur fett oder normal
  const SIZE = 10, LH = 4.6;
  const font = style => { doc.setFont('times', style); doc.setFontSize(SIZE); };
  const ensure = h => { if (y + h > BOTTOM) { doc.addPage(); y = 15; } };

  function bar(title, rightText) {
    ensure(26);
    fill(COLORS.bar); doc.rect(M, y, W, 6, 'F');
    ink('000000'); font('bold', 10); doc.text(pdfText(title), M + 1, y + 4.3);
    if (rightText) doc.text(pdfText(rightText), M + W - 1, y + 4.3, { align: 'right' });
    y += 8;
  }

  function badge(x, yy, w, h, kind) {
    const c = COLORS[kind];
    fill(c.bg); doc.rect(x, yy, w, h, 'F');
    ink(c.fg); font('normal'); doc.text(pdfText(L[kind]), x + w / 2, yy + h - 1.1, { align: 'center' });
    ink('000000');
  }

  // ---------- Kopf ----------
  let logoBottom = y;
  if (settings.logo) {
    const d = await imgDims(settings.logo);
    const maxW = 58, maxH = 22;
    const k = Math.min(maxW / d.w, maxH / d.h);
    doc.addImage(settings.logo, imgFormat(settings.logo), M, y, d.w * k, d.h * k);
    logoBottom = y + d.h * k;
  } else {
    ink('1F4E79'); font('bolditalic'); doc.setFontSize(22); doc.text('CHAIRKIT', M, y + 10);
    logoBottom = y + 14;
  }
  ink('000000'); font('bold');
  doc.text(doc.splitTextToSize(pdfText(settings.firmaName || L.firmaName), 62), M, logoBottom + 4.5);

  fill(COLORS.bar); doc.rect(80, y + 1, 115, 6.5, 'F');
  font('bold'); doc.text(pdfText(r.type === 'punch' ? L.punch : L.bericht), 137.5, y + 5.6, { align: 'center' });

  let hy = y + 13;
  [[L.firma, r.firma], [L.projekt, r.projekt], [L.monteur, r.monteur]].forEach(([lab, val]) => {
    font('bold'); doc.text(lab, 80, hy);
    font('normal');
    const ls = doc.splitTextToSize(pdfText(val), 54);
    doc.text(ls.length ? ls : [''], 100, hy);
    hy += Math.max(ls.length, 1) * LH + 0.9;
  });
  font('bold'); doc.text(L.datum, 157, y + 13 + LH + 0.9);
  font('normal'); doc.text(isoToDe(r.datum), 170, y + 13 + LH + 0.9);

  y = Math.max(logoBottom + 9, hy + 2);

  // ---------- Tabellen (nur Bericht) ----------
  // text: Zeichenkette oder fertig umbrochene Zeilen; Höhe gibt der Aufrufer vor
  function cell(x, yy, w, h, text, o) {
    o = o || {};
    if (o.fill) { fill(o.fill); doc.rect(x, yy, w, h, 'FD'); } else doc.rect(x, yy, w, h, 'S');
    ink('000000'); font(o.bold ? 'bold' : 'normal');
    const lines = Array.isArray(text) ? text : doc.splitTextToSize(pdfText(text), w - 2);
    if (o.center) doc.text(lines, x + w / 2, yy + 3.6, { align: 'center' });
    else doc.text(lines, x + 1, yy + 3.6);
  }
  const wrapIn = (t, w) => { font('normal'); const a = doc.splitTextToSize(pdfText(t), w - 2); return a.length ? a : ['']; };

  if (r.type !== 'punch') {
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    const nRows = Math.max(4, r.hilfsmittel.length, r.team.length);
    const data = [];
    for (let i = 0; i < nRows; i++) {
      const h = r.hilfsmittel[i] || { text: '', stk: '' };
      const t = r.team[i] || { rolle: '', vm: '', nm: '' };
      const c = [wrapIn(h.text, 55), wrapIn(h.stk, 20), wrapIn(t.rolle, 50), wrapIn(t.vm, 21), wrapIn(t.nm, 21)];
      data.push({ c, hgt: Math.max(...c.map(x => x.length)) * LH + 1.4 });
    }
    const hdr = 6;
    const tx = 103;
    const drawHead = yy => {
      cell(M, yy, 55, hdr, L.hilfsmittel, { bold: true, fill: COLORS.caption, center: true });
      cell(M + 55, yy, 20, hdr, L.stk, { bold: true, fill: COLORS.caption, center: true });
      cell(tx, yy, 50, hdr, L.team, { bold: true, fill: COLORS.caption, center: true });
      cell(tx + 50, yy, 21, hdr, L.vm, { bold: true, fill: COLORS.caption, center: true });
      cell(tx + 71, yy, 21, hdr, L.nm, { bold: true, fill: COLORS.caption, center: true });
    };
    ensure(hdr + data[0].hgt + 20);
    drawHead(y);
    let ry = y + hdr;
    data.forEach(d => {
      if (ry + d.hgt > BOTTOM) { doc.addPage(); ry = 15; drawHead(ry); ry += hdr; }
      cell(M, ry, 55, d.hgt, d.c[0], { center: true });
      cell(M + 55, ry, 20, d.hgt, d.c[1], { center: true });
      cell(tx, ry, 50, d.hgt, d.c[2], { center: true });
      cell(tx + 50, ry, 21, d.hgt, d.c[3], { center: true });
      cell(tx + 71, ry, 21, d.hgt, d.c[4], { center: true });
      ry += d.hgt;
    });
    y = ry + 7;
    ensure(16);
    font('bold'); ink('000000'); doc.text(L.wetter + ':', M + 2, y);
    font('normal');
    const wl = doc.splitTextToSize(pdfText(r.wetter), 158);
    doc.text(wl.length ? wl : [''], M + 18, y);
    y += Math.max(wl.length, 1) * LH - LH + 4;
    doc.setLineWidth(0.5); doc.line(M, y, M + W, y);
    y += 6;
  }

  // ---------- Listen mit Status ----------
  function statusList(items, kindOf) {
    items.forEach(it => {
      font('normal', 9);
      const lines = doc.splitTextToSize(pdfText(it.text), 148);
      const h = Math.max(lines.length * LH, 4.8) + 1;
      ensure(h);
      ink('000000'); font('normal');
      doc.text(lines, M + 1, y + 3.6);
      badge(M + W - 28, y, 28, 4.8, kindOf(it));
      y += h;
    });
    y += 5;
  }

  function hinweisList(items) {
    items.forEach(it => {
      font('normal', 9);
      const lines = doc.splitTextToSize(pdfText(it.text), W - 3);
      const h = lines.length * LH + 1.2;
      ensure(h);
      if (it.wichtig) { fill(COLORS.alert); doc.rect(M, y - 0.5, W, h, 'F'); }
      ink(it.wichtig ? '7F0000' : '000000'); font('normal', 9);
      doc.text(lines, M + 1, y + 3.5);
      ink('000000');
      y += h + 1;
    });
    y += 4;
  }

  // ---------- Bilder ----------
  async function pictures(title) {
    if (r.bilder.length) {
      // Überschrift nicht allein am Seitenende lassen: Platz für das erste Bild mitrechnen
      const b0 = r.bilder[0];
      const d0 = b0.w && b0.h ? { w: b0.w, h: b0.h } : await imgDims(b0.data);
      font('normal');
      let cap0 = b0.caption || '';
      if (r.type === 'punch' && b0.nr) cap0 = `${L.punktBild} ${b0.nr}${cap0 ? ': ' + cap0 : ''}`;
      const capH0 = Math.max(doc.splitTextToSize(pdfText(cap0), W - 4).length, 1) * LH + 2.2;
      ensure(26 + capH0 + Math.min(100, 110 * d0.h / d0.w));
    }
    bar(title);
    if (!r.bilder.length) { y += 2; return; }
    const imgW = 110, imgH = 100;
    for (const b of r.bilder) {
      font('normal', 9);
      let cap = b.caption || '';
      if (r.type === 'punch' && b.nr) cap = `${L.punktBild} ${b.nr}${cap ? ': ' + cap : ''}`;
      const capLines = doc.splitTextToSize(pdfText(cap), W - 4);
      const capH = Math.max(capLines.length, 1) * LH + 2.2;
      const d = b.w && b.h ? { w: b.w, h: b.h } : await imgDims(b.data);
      const s = Math.min(imgW / d.w, imgH / d.h);
      const w = d.w * s, h = d.h * s;
      ensure(capH + h + 6);
      fill(COLORS.caption); doc.rect(M, y, W, capH, 'F');
      ink('000000'); font('normal', 9);
      doc.text(capLines, M + W / 2, y + 4.2, { align: 'center' });
      doc.addImage(b.data, imgFormat(b.data), M + (W - w) / 2, y + capH, w, h);
      y += capH + h + 5;
    }
  }

  // ---------- Abschluss mit Unterschrift ----------
  async function closing(title, dateIso) {
    ensure(40);
    bar(title, isoToDe(dateIso));
    y += 14;
    ink('000000'); doc.setLineWidth(0.3);
    doc.line(M, y, M + 52, y);
    font('normal');
    const mn = doc.splitTextToSize(pdfText(r.monteur), 52).slice(0, 2);
    doc.text(mn.length ? mn : [''], M, y + 3.6);
    doc.text(L.monteur, M, y + 3.6 + Math.max(mn.length, 1) * LH);
    const sx = M + W - 52;
    if (settings.signature) {
      const d = await imgDims(settings.signature);
      const k = Math.min(48 / d.w, 14 / d.h);
      const w = d.w * k, h = d.h * k;
      doc.addImage(settings.signature, imgFormat(settings.signature), sx + (52 - w) / 2, y - h - 0.5, w, h);
    }
    doc.line(sx, y, sx + 52, y);
    font('normal', 8.5); doc.text(L.unterschrift, sx, y + 3.8);
    y += 12;
  }

  if (r.type === 'punch') {
    bar(L.p1);
    const cols = [12, 108, 34, 26];
    const xs = [M, M + 12, M + 120, M + 154];
    const heads = [L.nr, L.beschr, L.zust, L.status];
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    ensure(14);
    heads.forEach((h, i) => cell(xs[i], y, cols[i], 6, h, { bold: true, fill: COLORS.caption, center: true }));
    y += 6;
    r.punkte.forEach((p, idx) => {
      font('normal', 9);
      const lines = doc.splitTextToSize(pdfText(p.text), cols[1] - 2);
      const zl = wrapIn(p.zustaendig || '', cols[2]);
      const h = Math.max(lines.length, zl.length) * LH + 1.6;
      if (y + h > BOTTOM) {
        doc.addPage(); y = 15;
        heads.forEach((hd, i) => cell(xs[i], y, cols[i], 6, hd, { bold: true, fill: COLORS.caption, center: true }));
        y += 6;
      }
      doc.setDrawColor(0); doc.setLineWidth(0.2);
      doc.rect(xs[0], y, cols[0], h, 'S');
      doc.rect(xs[1], y, cols[1], h, 'S');
      doc.rect(xs[2], y, cols[2], h, 'S');
      const c = COLORS[p.status === 'done' ? 'done' : 'open'];
      fill(c.bg); doc.rect(xs[3], y, cols[3], h, 'FD');
      ink('000000'); font('normal', 9);
      doc.text(String(idx + 1), xs[0] + cols[0] / 2, y + 3.8, { align: 'center' });
      doc.text(lines, xs[1] + 1, y + 3.8);
      doc.text(zl, xs[2] + 1, y + 3.8);
      ink(c.fg); doc.text(pdfText(L[p.status === 'done' ? 'done' : 'open']), xs[3] + cols[3] / 2, y + 3.8, { align: 'center' });
      ink('000000');
      y += h;
    });
    y += 6;
    await pictures(L.p2);
    await closing(L.p3, r.stand);
  } else {
    bar(L.s1);
    statusList(r.taetigkeiten, it => (it.status === 'done' ? 'done' : 'progress'));
    bar(L.s2);
    statusList(r.geplant, () => 'open');
    bar(L.s3);
    hinweisList(r.hinweise);
    await pictures(L.s4);
    await closing(L.s5, r.stand);
  }

  // Seitenzahlen
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    font('normal', 8); ink('666666');
    doc.text(`${L.seite} ${p} ${L.von} ${n}`, 105, PAGE_H - 8, { align: 'center' });
  }
  return doc;
}
