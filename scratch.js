/* ============================================================
   scratch.js — the quiz scratch pad
   An infinite canvas in a small window: draw, zoom, pan, undo, like a
   real whiteboard app. A bottom sheet on phones.

     Tools      pen (3 sizes, 4 colors), highlighter, eraser, hand (pan)
     Viewport   wheel = zoom at the pointer, shift+wheel = pan, pinch and
                two-finger drag on touch, middle button / space+drag = pan,
                + - buttons, "fit" to drawing, 100%
     History    undo / redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y), clear (asks)
     Window     drag by the title bar, resize from the corner, minimize to
                a pill, maximize to the whole screen, smooth open / close
     Extras     grid toggle, export PNG, Notes tab, keyboard shortcuts
                (P pen, H hand, E eraser, L highlighter, G grid, N notes)

   Strokes live in world coordinates and are saved per quiz (key = the
   module id) together with the notes and the viewport; a retake starts
   with a clean pad.

     scratch.toggle(key)  scratch.hide()  scratch.clear(key)  scratch.open
   ============================================================ */

const scratch = (() => {
  const win = document.getElementById("scratch");
  if (!win) return { toggle() {}, hide() {}, clear() {}, get open() { return false; } };
  const $ = (sel) => win.querySelector(sel);
  const canvas = $("canvas"), ctx = canvas.getContext("2d");
  const notes = $(".scratch-notes"), head = $(".scratch-head"), grip = $(".scratch-grip");
  const zoomLabel = $(".scratch-zoom-val"), undoBtn = $('[data-act="undo"]'), redoBtn = $('[data-act="redo"]');
  const pill = document.getElementById("scratch-pill");
  const STORE = "codebuddy.scratch";
  const phone = () => window.matchMedia("(max-width: 760px)").matches;

  const COLORS = { ink: "#135ab6", green: "#17a673", red: "#e5484d", dark: "#1d2433" };
  const SIZES = { s: 2, m: 3.5, l: 7 };

  let key = null;
  let tool = "pen", color = "ink", size = "m", tab = "draw", grid = true;
  let strokes = [], redoStack = [], current = null;
  let view = { x: 0, y: 0, scale: 1 };       // world point shown at the canvas's top-left, and zoom
  let saveTimer = null, raf = 0;
  let state = "normal";                      // normal | min | max
  let restoreBox = null;

  // ---------- storage ----------
  const all = () => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; } };
  function load(k) { return all()[k] || { strokes: [], notes: "", view: { x: 0, y: 0, scale: 1 } }; }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const a = all(); a[k_()] = { strokes, notes: notes.value, view };
      try { localStorage.setItem(STORE, JSON.stringify(a)); } catch {}
    }, 250);
  }
  const k_ = () => key;
  function clear(k) {
    const a = all(); delete a[k];
    try { localStorage.setItem(STORE, JSON.stringify(a)); } catch {}
    if (k === key) { strokes = []; redoStack = []; notes.value = ""; view = { x: 0, y: 0, scale: 1 }; redraw(); }
  }
  function savePrefs() {
    try { localStorage.setItem(STORE + ".prefs", JSON.stringify({ tool, color, size, grid, box: restoreBox, state })); } catch {}
  }
  function loadPrefs() {
    let p = null; try { p = JSON.parse(localStorage.getItem(STORE + ".prefs") || "null"); } catch {}
    if (!p) return;
    if (p.tool && p.tool !== "hand") tool = p.tool;
    if (p.color) color = p.color; if (p.size) size = p.size; if (p.grid !== undefined) grid = p.grid;
    if (p.box) restoreBox = p.box;
    if (p.state === "max") state = "max";
  }

  // ---------- coordinates ----------
  const toWorld = (sx, sy) => [sx / view.scale + view.x, sy / view.scale + view.y];
  const canvasPoint = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  // ---------- drawing ----------
  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    redraw();
  }
  function scheduleRedraw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw(); }); }
  function redraw() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    if (grid) paintGrid(r.width, r.height);
    ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, -view.x * view.scale * dpr, -view.y * view.scale * dpr);
    for (const s of strokes) paint(s);
    zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
    undoBtn.disabled = !strokes.length; redoBtn.disabled = !redoStack.length;
  }
  function paintGrid(w, h) {
    // dots every 24 world units; thin out when zoomed far out
    let step = 24;
    while (step * view.scale < 14) step *= 2;
    const sx = ((-view.x % step) + step) % step * view.scale, sy = ((-view.y % step) + step) % step * view.scale;
    ctx.fillStyle = "rgba(19, 90, 182, 0.16)";
    const rad = Math.max(0.8, Math.min(1.6, view.scale));
    for (let x = sx; x < w; x += step * view.scale) for (let y = sy; y < h; y += step * view.scale) { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); }
  }
  function style(s) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = s.tool === "highlighter" ? 0.35 : 1;
    ctx.strokeStyle = ctx.fillStyle = COLORS[s.color] || COLORS.ink;
    ctx.lineWidth = s.w;
    if (s.tool === "highlighter") ctx.lineCap = "square";
  }
  function paint(s, from = 0) {
    ctx.save(); style(s);
    const p = s.pts;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
    ctx.beginPath();
    const start = Math.max(1, from);
    ctx.moveTo(p[start - 1][0], p[start - 1][1]);
    for (let i = start; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my); }
    const last = p[p.length - 1]; ctx.lineTo(last[0], last[1]);
    ctx.stroke(); ctx.restore();
  }
  // while a stroke is being drawn, only its newest segment is painted (fast)
  function paintTail(s, n) {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, -view.x * view.scale * dpr, -view.y * view.scale * dpr);
    paint(s, Math.max(1, s.pts.length - n - 1));
  }

  // ---------- pointers: draw, pan, pinch ----------
  const pointers = new Map();     // id -> [x, y] on the canvas
  let pan = null, pinch = null, spaceDown = false;
  canvas.addEventListener("pointerdown", (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    pointers.set(e.pointerId, canvasPoint(e));
    e.preventDefault();
    if (pointers.size === 2) {
      // second finger: stop drawing, start a pinch/pan
      if (current) { current.pts.length > 1 ? null : strokes.pop(); current = null; }
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], view: { ...view } };
      return;
    }
    const middle = e.button === 1, hand = tool === "hand" || spaceDown || middle;
    if (hand) { pan = { start: canvasPoint(e), view: { ...view } }; canvas.classList.add("grabbing"); return; }
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const [wx, wy] = toWorld(...canvasPoint(e));
    const w = tool === "eraser" ? 24 / view.scale : tool === "highlighter" ? 16 : SIZES[size];
    current = { tool, color: tool === "highlighter" ? color : color, w, pts: [[wx, wy]] };
    strokes.push(current); redoStack = [];
    paintTail(current, 1);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, canvasPoint(e));
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const scale = clampScale(pinch.view.scale * (dist / pinch.dist));
      // keep the world point under the original midpoint under the new midpoint
      const wx = pinch.mid[0] / pinch.view.scale + pinch.view.x, wy = pinch.mid[1] / pinch.view.scale + pinch.view.y;
      view = { scale, x: wx - mid[0] / scale, y: wy - mid[1] / scale };
      scheduleRedraw(); return;
    }
    if (pan) {
      const [x, y] = canvasPoint(e);
      view = { ...view, x: pan.view.x - (x - pan.start[0]) / view.scale, y: pan.view.y - (y - pan.start[1]) / view.scale };
      scheduleRedraw(); return;
    }
    if (!current) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) current.pts.push(toWorld(...canvasPoint(ev)));
    paintTail(current, events.length);
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (pinch && pointers.size < 2) { pinch = null; save(); }
    if (pan && pointers.size === 0) { pan = null; canvas.classList.remove("grabbing"); save(); }
    if (current && pointers.size === 0) { current = null; save(); redraw(); }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // wheel: zoom around the pointer; shift+wheel pans sideways; plain trackpad pan with ctrl=zoom
  const clampScale = (s) => Math.max(0.2, Math.min(6, s));
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [cx, cy] = canvasPoint(e);
    if (e.ctrlKey || !e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      zoomAt(cx, cy, clampScale(view.scale * factor));
    } else {
      const d = e.shiftKey ? e.deltaY : e.deltaX;
      view = { ...view, x: view.x + d / view.scale }; scheduleRedraw(); save();
    }
  }, { passive: false });
  function zoomAt(cx, cy, scale) {
    const [wx, wy] = toWorld(cx, cy);
    view = { scale, x: wx - cx / scale, y: wy - cy / scale };
    scheduleRedraw(); save();
  }
  function zoomBy(f) { const r = canvas.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, clampScale(view.scale * f)); }
  function bounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of strokes) if (s.tool !== "eraser") for (const [x, y] of s.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return x0 === Infinity ? null : { x0: x0 - 20, y0: y0 - 20, x1: x1 + 20, y1: y1 + 20 };
  }
  function fitToDrawing() {
    const b = bounds(); const r = canvas.getBoundingClientRect();
    if (!b) { view = { x: 0, y: 0, scale: 1 }; scheduleRedraw(); save(); return; }
    const scale = clampScale(Math.min(r.width / (b.x1 - b.x0), r.height / (b.y1 - b.y0)));
    view = { scale, x: b.x0 - (r.width / scale - (b.x1 - b.x0)) / 2, y: b.y0 - (r.height / scale - (b.y1 - b.y0)) / 2 };
    scheduleRedraw(); save();
  }

  // ---------- history ----------
  function undo() { if (!strokes.length) return; redoStack.push(strokes.pop()); redraw(); save(); }
  function redo() { if (!redoStack.length) return; strokes.push(redoStack.pop()); redraw(); save(); }

  // ---------- export ----------
  function exportPng() {
    const b = bounds();
    const off = document.createElement("canvas");
    const pad = 24, scale = 2;
    const w = b ? (b.x1 - b.x0) : 400, h = b ? (b.y1 - b.y0) : 300;
    off.width = (w + pad * 2) * scale; off.height = (h + pad * 2) * scale;
    const c = off.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, off.width, off.height);
    c.setTransform(scale, 0, 0, scale, (pad - (b ? b.x0 : 0)) * scale, (pad - (b ? b.y0 : 0)) * scale);
    const live = ctx; // reuse paint() with the offscreen context
    const prev = { ctx: live };
    for (const s of strokes) { c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over"; c.globalAlpha = s.tool === "highlighter" ? 0.35 : 1; c.strokeStyle = c.fillStyle = COLORS[s.color] || COLORS.ink; c.lineWidth = s.w; if (s.tool === "highlighter") c.lineCap = "square"; const p = s.pts; c.beginPath(); if (p.length === 1) { c.arc(p[0][0], p[0][1], s.w / 2, 0, Math.PI * 2); c.fill(); } else { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length - 1; i++) { c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2); } c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); c.stroke(); } c.restore(); }
    void prev;
    const a = document.createElement("a");
    a.href = off.toDataURL("image/png"); a.download = "codebuddy-scratch.png"; a.click();
    if (window.sfx) sfx.pop();
  }

  // ---------- toolbar ----------
  function syncToolbar() {
    win.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool));
    win.querySelectorAll("[data-color]").forEach((b) => b.classList.toggle("on", b.dataset.color === color));
    win.querySelectorAll("[data-size]").forEach((b) => b.classList.toggle("on", b.dataset.size === size));
    win.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    $('[data-act="grid"]').classList.toggle("on", grid);
    win.dataset.tab = tab; win.dataset.tool = tool;
    canvas.classList.toggle("hand", tool === "hand");
  }
  let clearArmed = null;
  win.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) tool = b.dataset.tool;
    else if (b.dataset.color) { color = b.dataset.color; if (tool === "eraser" || tool === "hand") tool = "pen"; }
    else if (b.dataset.size) { size = b.dataset.size; if (tool !== "pen") tool = "pen"; }
    else if (b.dataset.tab) { tab = b.dataset.tab; if (tab === "draw") requestAnimationFrame(fit); else notes.focus(); }
    else if (b.dataset.act) act(b.dataset.act, b);
    syncToolbar(); savePrefs();
  });
  function act(name, b) {
    switch (name) {
      case "undo": return undo();
      case "redo": return redo();
      case "zoom-in": return zoomBy(1.25);
      case "zoom-out": return zoomBy(0.8);
      case "zoom-fit": return fitToDrawing();
      case "zoom-100": { const r = canvas.getBoundingClientRect(); return zoomAt(r.width / 2, r.height / 2, 1); }
      case "grid": grid = !grid; return redraw();
      case "export": return exportPng();
      case "clear":
        if (tab === "notes") { notes.value = ""; save(); return; }
        if (clearArmed) { clearTimeout(clearArmed); clearArmed = null; b.textContent = "Clear"; b.classList.remove("armed"); strokes = []; redoStack = []; redraw(); save(); if (window.sfx) sfx.pop(); return; }
        b.textContent = "Clear all?"; b.classList.add("armed");
        clearArmed = setTimeout(() => { clearArmed = null; b.textContent = "Clear"; b.classList.remove("armed"); }, 2500);
        return;
      case "min": return minimize();
      case "max": return toggleMax();
      case "close": return hide();
    }
  }
  notes.addEventListener("input", save);

  // keyboard shortcuts while the pad is open and the notes box isn't focused
  document.addEventListener("keydown", (e) => {
    if (win.hidden || state === "min") return;
    const typing = document.activeElement === notes || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "") || document.activeElement?.closest?.(".CodeMirror");
    if ((e.ctrlKey || e.metaKey) && !typing) {
      if (e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomBy(1.25); return; }
      if (e.key === "-") { e.preventDefault(); zoomBy(0.8); return; }
      if (e.key === "0") { e.preventDefault(); act("zoom-100"); return; }
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === " ") { spaceDown = true; canvas.classList.add("hand"); e.preventDefault(); return; }
    const map = { p: () => (tool = "pen"), h: () => (tool = "hand"), e: () => (tool = "eraser"), l: () => (tool = "highlighter"), g: () => { grid = !grid; redraw(); }, n: () => { tab = tab === "notes" ? "draw" : "notes"; if (tab === "draw") requestAnimationFrame(fit); else notes.focus(); }, escape: () => hide() };
    if (map[k]) { map[k](); syncToolbar(); savePrefs(); }
  });
  document.addEventListener("keyup", (e) => { if (e.key === " ") { spaceDown = false; if (tool !== "hand") canvas.classList.remove("hand"); } });

  // ---------- window: place, drag, resize, minimize, maximize ----------
  function applyBox(b) { Object.assign(win.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` }); }
  function defaultBox() {
    const w = Math.min(restoreBox?.w || 470, window.innerWidth - 24), h = Math.min(restoreBox?.h || 400, window.innerHeight - 24);
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, restoreBox?.x ?? window.innerWidth - w - 24));
    const y = Math.max(12, Math.min(window.innerHeight - h - 12, restoreBox?.y ?? window.innerHeight - h - 24));
    return { x, y, w, h };
  }
  function place() {
    win.classList.toggle("sheet", phone());
    win.classList.toggle("max", state === "max");
    win.classList.toggle("min", state === "min");
    if (phone()) { win.style.left = win.style.top = win.style.width = win.style.height = ""; return; }
    if (state === "max") { win.style.left = win.style.top = win.style.width = win.style.height = ""; return; }
    applyBox(defaultBox());
  }
  function rememberBox() {
    if (phone() || state !== "normal") return;
    const r = win.getBoundingClientRect();
    restoreBox = { x: r.left, y: r.top, w: r.width, h: r.height }; savePrefs();
  }
  let drag = null;
  head.addEventListener("pointerdown", (e) => {
    if (phone() || state !== "normal" || e.target.closest("button")) return;
    const r = win.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { head.setPointerCapture(e.pointerId); } catch {} e.preventDefault();
  });
  head.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = win.getBoundingClientRect();
    win.style.left = `${Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - drag.dx))}px`;
    win.style.top = `${Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.dy))}px`;
  });
  head.addEventListener("pointerup", () => { if (drag) { drag = null; rememberBox(); } });
  head.addEventListener("dblclick", (e) => { if (!e.target.closest("button") && !phone()) toggleMax(); });
  let rs = null;
  grip.addEventListener("pointerdown", (e) => {
    if (phone() || state !== "normal") return;
    const r = win.getBoundingClientRect();
    rs = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    try { grip.setPointerCapture(e.pointerId); } catch {} e.preventDefault();
  });
  grip.addEventListener("pointermove", (e) => {
    if (!rs) return;
    win.style.width = `${Math.max(300, Math.min(window.innerWidth - 24, rs.w + e.clientX - rs.x))}px`;
    win.style.height = `${Math.max(240, Math.min(window.innerHeight - 24, rs.h + e.clientY - rs.y))}px`;
    fit();
  });
  grip.addEventListener("pointerup", () => { if (rs) { rs = null; rememberBox(); fit(); } });

  function minimize() {
    if (state === "normal") rememberBox();
    state = "min"; savePrefs();
    win.classList.add("minimizing");
    const done = () => { win.classList.remove("minimizing"); win.hidden = true; pill.hidden = false; pill.classList.add("in"); };
    win.addEventListener("animationend", done, { once: true });
    setTimeout(() => { if (!win.hidden && state === "min") done(); }, 320);
  }
  function restoreFromPill() { pill.hidden = true; pill.classList.remove("in"); state = "normal"; savePrefs(); show(key, true); }
  pill.addEventListener("click", restoreFromPill);
  function toggleMax() {
    if (state === "normal") rememberBox();
    state = state === "max" ? "normal" : "max"; savePrefs();
    place(); requestAnimationFrame(fit);
    if (window.sfx) sfx.pop();
  }
  window.addEventListener("resize", () => { if (!win.hidden) { place(); fit(); } });

  // ---------- open / close ----------
  function show(k, quiet = false) {
    if (k !== key) {
      key = k;
      const d = load(k);
      strokes = d.strokes || []; redoStack = []; notes.value = d.notes || ""; view = d.view || { x: 0, y: 0, scale: 1 };
    }
    if (state === "min") state = "normal";
    pill.hidden = true;
    win.hidden = false;
    win.classList.remove("closing");
    place(); syncToolbar();
    requestAnimationFrame(fit);
    if (!quiet && window.sfx) sfx.pop();
  }
  function hide() {
    if (win.hidden) { pill.hidden = true; return; }
    win.classList.add("closing");
    const done = () => { win.classList.remove("closing"); win.hidden = true; };
    win.addEventListener("animationend", done, { once: true });
    setTimeout(() => { if (win.classList.contains("closing")) done(); }, 260);
    pill.hidden = true;
  }
  function toggle(k) {
    if (!win.hidden && !win.classList.contains("closing") && k === key) return hide();
    if (state === "min" && k === key) return restoreFromPill();
    show(k);
  }

  loadPrefs();
  if (state === "min") state = "normal";   // never start minimised
  syncToolbar();

  return { toggle, hide, clear, get open() { return !win.hidden; } };
})();
