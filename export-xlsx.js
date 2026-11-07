/* Excel-Ausgabe im Look des Montageberichts (ExcelJS). Zwei gleich breite Hälften: A-E und F-J. */
async function buildXlsx(r, settings) {
  const L = LABELS[r.lang] || LABELS.de;
  const wb = new ExcelJS.Workbook();
  wb.creator = r.monteur || 'Montage-App';
  const ws = wb.addWorksheet(r.type === 'punch' ? L.punch : L.bericht, {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 } },
    views: [{ showGridLines: false }]
  });
  const widths = [16, 16, 14, 8, 6, 12, 12, 12, 12, 12];
  ws.columns = widths.map(w => ({ width: w }));
  const colPx = i => Math.round(widths[i] * 7 + 5);
  const FONT = 'Times New Roman';
  const f = o => Object.assign({ name: FONT, size: 10 }, o || {});
  const solid = hex => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } });
  const thin = { style: 'thin', color: { argb: 'FF000000' } };
  const box = { top: thin, left: thin, bottom: thin, right: thin };
  let row = 1;

  function lines(text, charsPerLine) {
    return String(text || '').split('\n').reduce((n, p) => n + Math.max(1, Math.ceil(p.length / charsPerLine)), 0);
  }

  function put(a, b, rowNo, value, o) {
    o = o || {};
    if (a !== b) ws.mergeCells(rowNo, a, rowNo, b);
    const c = ws.getCell(rowNo, a);
    c.value = value;
    c.font = f({ bold: o.bold, color: o.color ? { argb: 'FF' + o.color } : undefined, size: o.size, italic: o.italic });
    c.alignment = { vertical: 'middle', horizontal: o.align || 'left', wrapText: true, indent: o.indent || 0 };
    if (o.fill) for (let i = a; i <= b; i++) ws.getCell(rowNo, i).fill = solid(o.fill);
    if (o.border) for (let i = a; i <= b; i++) ws.getCell(rowNo, i).border = box;
    return c;
  }

  function bar(title, right) {
    ws.getRow(row).height = 16;
    if (right) {
      put(1, 8, row, title, { bold: true, fill: COLORS.bar });
      put(9, 10, row, right, { bold: true, fill: COLORS.bar, align: 'right' });
    } else {
      put(1, 10, row, title, { bold: true, fill: COLORS.bar });
    }
    row += 1;
  }

  function status(rowNo, kind) {
    const c = COLORS[kind];
    const cell = ws.getCell(rowNo, 10);
    cell.value = L[kind];
    cell.font = f({ color: { argb: 'FF' + c.fg } });
    cell.fill = solid(c.bg);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  async function addImg(dataUrl, boxPx, rowNo, leftColIdx, leftOffsetPx, w0, h0) {
    const d = (w0 && h0) ? { w: w0, h: h0 } : await imgDims(dataUrl);
    const s = Math.min(boxPx.w / d.w, boxPx.h / d.h);
    const w = Math.round(d.w * s), h = Math.round(d.h * s);
    const x = leftOffsetPx + Math.round((boxPx.w - w) / 2);
    let acc = 0, col = leftColIdx;
    for (let i = 0; i < 10; i++) {
      if (x < acc + colPx(i) || i === 9) { col = i + (x - acc) / colPx(i); break; }
      acc += colPx(i);
    }
    const id = wb.addImage({ base64: dataUrl, extension: /^data:image\/png/i.test(dataUrl) ? 'png' : 'jpeg' });
    ws.addImage(id, { tl: { col, row: rowNo - 1 + 0.02 }, ext: { width: w, height: h }, editAs: 'oneCell' });
  }

  // ---------- Kopf ----------
  ws.getRow(1).height = 18;
  for (let i = 2; i <= 5; i++) ws.getRow(i).height = 15;
  ws.getRow(6).height = 16;
  if (settings.logo) {
    const d = await imgDims(settings.logo);
    const s = Math.min(200 / d.w, 70 / d.h);
    const id = wb.addImage({ base64: settings.logo, extension: /^data:image\/png/i.test(settings.logo) ? 'png' : 'jpeg' });
    ws.addImage(id, { tl: { col: 0.05, row: 0.1 }, ext: { width: Math.round(d.w * s), height: Math.round(d.h * s) } });
  } else {
    ws.mergeCells(2, 1, 3, 5);
    const lc = ws.getCell(2, 1);
    lc.value = 'CHAIRKIT';
    lc.font = f({ bold: true, italic: true, size: 24, color: { argb: 'FF1F4E79' } });
    lc.alignment = { vertical: 'middle', horizontal: 'left' };
  }
  put(1, 5, 6, settings.firmaName || L.firmaName, { bold: true });
  put(6, 10, 1, r.type === 'punch' ? L.punch : L.bericht, { bold: true, align: 'center', fill: COLORS.bar });
  const fld = (n, label, value) => {
    put(6, 6, n, label, { bold: true });
    put(7, 10, n, value);
    ws.getRow(n).height = Math.max(15, lines(value, 48) * 13.5 + 1.5);
  };
  fld(2, L.firma, r.firma);
  fld(3, L.projekt, r.projekt);
  fld(4, L.monteur, r.monteur);
  fld(5, L.datum, isoToDe(r.datum));
  row = 8;

  // ---------- Tabellen (nur Bericht) ----------
  if (r.type !== 'punch') {
    const n = Math.max(4, r.hilfsmittel.length, r.team.length);
    ws.getRow(row).height = 16;
    put(1, 3, row, L.hilfsmittel, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(4, 4, row, L.stk, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(6, 8, row, L.team, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(9, 9, row, L.vm, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(10, 10, row, L.nm, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    row += 1;
    for (let i = 0; i < n; i++) {
      const h = r.hilfsmittel[i] || { text: '', stk: '' };
      const t = r.team[i] || { rolle: '', vm: '', nm: '' };
      ws.getRow(row).height = Math.max(15, lines(h.text, 40) * 13.5 + 1.5, lines(t.rolle, 36) * 13.5 + 1.5, lines(h.stk, 7) * 13.5 + 1.5, lines(t.vm, 11) * 13.5 + 1.5, lines(t.nm, 11) * 13.5 + 1.5);
      put(1, 3, row, h.text, { border: true, align: 'center' });
      put(4, 4, row, h.stk, { border: true, align: 'center' });
      put(6, 8, row, t.rolle, { border: true, align: 'center' });
      put(9, 9, row, t.vm, { border: true, align: 'center' });
      put(10, 10, row, t.nm, { border: true, align: 'center' });
      row += 1;
    }
    row += 1;
    ws.getRow(row).height = 16;
    put(1, 1, row, L.wetter + ':', { bold: true, indent: 1 });
    put(2, 10, row, r.wetter, { indent: 0 });
    ws.getRow(row).height = Math.max(16, lines(r.wetter, 95) * 13.5 + 2);
    for (let i = 1; i <= 10; i++) ws.getCell(row, i).border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } };
    row += 2;
  }

  function statusRows(items, kindOf) {
    items.forEach(it => {
      ws.getRow(row).height = Math.max(15, lines(it.text, 100) * 13.5 + 2);
      put(1, 9, row, it.text, { indent: 1 });
      status(row, kindOf(it));
      row += 1;
    });
    row += 1;
  }

  function hinweisRows(items) {
    items.forEach(it => {
      ws.getRow(row).height = Math.max(15, lines(it.text, 110) * 13.5 + 2);
      put(1, 10, row, it.text, { indent: 1, fill: it.wichtig ? COLORS.alert : undefined, color: it.wichtig ? '7F0000' : undefined });
      row += 1;
    });
    row += 1;
  }

  async function pictures(title) {
    bar(title);
    const totalPx = widths.reduce((sum, _, j) => sum + colPx(j), 0);
    const boxW = 430, boxH = 340;
    for (const b of r.bilder) {
      let cap = b.caption || '';
      if (r.type === 'punch' && b.nr) cap = `${L.punktBild} ${b.nr}${cap ? ': ' + cap : ''}`;
      ws.getRow(row).height = lines(cap, 115) * 13.5 + 3;
      put(1, 10, row, cap, { fill: COLORS.caption, align: 'center' });
      row += 1;
      const d = (b.w && b.h) ? { w: b.w, h: b.h } : await imgDims(b.data);
      const k = Math.min(boxW / d.w, boxH / d.h);
      ws.getRow(row).height = Math.round(d.h * k) * 0.75 + 4;
      await addImg(b.data, { w: boxW, h: boxH }, row, 0, Math.round((totalPx - boxW) / 2), b.w, b.h);
      row += 2;
    }
  }

  async function closing(title, dateIso) {
    bar(title, isoToDe(dateIso));
    row += 1;
    ws.getRow(row).height = 42;
    if (settings.signature) {
      const d = await imgDims(settings.signature);
      const s = Math.min(170 / d.w, 52 / d.h);
      const id = wb.addImage({ base64: settings.signature, extension: /^data:image\/png/i.test(settings.signature) ? 'png' : 'jpeg' });
      ws.addImage(id, { tl: { col: 7.1, row: row - 1 + 0.05 }, ext: { width: Math.round(d.w * s), height: Math.round(d.h * s) }, editAs: 'oneCell' });
    }
    row += 1;
    for (let i = 1; i <= 3; i++) ws.getCell(row, i).border = { top: thin };
    for (let i = 8; i <= 10; i++) ws.getCell(row, i).border = { top: thin };
    put(1, 3, row, r.monteur, {});
    put(8, 10, row, L.unterschrift, {});
    row += 1;
    put(1, 3, row, L.monteur, {});
    row += 1;
  }

  if (r.type === 'punch') {
    bar(L.p1);
    ws.getRow(row).height = 16;
    put(1, 1, row, L.nr, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(2, 7, row, L.beschr, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(8, 9, row, L.zust, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    put(10, 10, row, L.status, { bold: true, fill: COLORS.caption, border: true, align: 'center' });
    row += 1;
    r.punkte.forEach((p, i) => {
      ws.getRow(row).height = Math.max(16, lines(p.text, 66) * 13.5 + 3, lines(p.zustaendig, 22) * 13.5 + 3);
      put(1, 1, row, i + 1, { border: true, align: 'center' });
      put(2, 7, row, p.text, { border: true });
      put(8, 9, row, p.zustaendig || '', { border: true });
      const kind = p.status === 'done' ? 'done' : 'open';
      status(row, kind);
      ws.getCell(row, 10).border = box;
      row += 1;
    });
    row += 1;
    await pictures(L.p2);
    await closing(L.p3, r.stand);
  } else {
    bar(L.s1);
    statusRows(r.taetigkeiten, it => (it.status === 'done' ? 'done' : 'progress'));
    bar(L.s2);
    statusRows(r.geplant, () => 'open');
    bar(L.s3);
    hinweisRows(r.hinweise);
    await pictures(L.s4);
    await closing(L.s5, r.stand);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
