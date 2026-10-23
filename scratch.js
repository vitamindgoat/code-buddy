/* ============================================================
   scratch.js — the quiz scratch pad
   A small floating window (a bottom sheet on phones) with a canvas to
   draw or work things out on, and a Notes tab for typing. Pen, eraser,
   clear. Drag it by its title bar, resize from the corner. What's on it
   is saved per quiz (strokes as points, so it survives a resize), and a
   retake starts with a clean pad.

     scratch.toggle(key)   open/close for this quiz (key = module id)
     scratch.hide()        close (leaving the quiz)
     scratch.clear(key)    wipe a quiz's pad (retake)
   ============================================================ */

const scratch = (() => {
  const win = document.getElementById("scratch");
  if (!win) return { toggle() {}, hide() {}, clear() {} };
  const canvas = win.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const notes = win.querySelector(".scratch-notes");
  const head = win.querySelector(".scratch-head");
  const STORE = "codebuddy.scratch";
  const phone = () => window.matchMedia("(max-width: 760px)").matches;

  let key = null, tool = "pen", tab = "draw";
  let strokes = [];          // [{ tool, w, pts: [[x, y], ...] }] in CSS pixels
  let current = null;
  let saveTimer = null;

  // ---------- storage ----------
  function load(k) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch {}
    return all[k] || { strokes: [], notes: "" };
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      let all = {};
      try { all = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch {}
      all[key] = { strokes, notes: notes.value };
      try { localStorage.setItem(STORE, JSON.stringify(all)); } catch {}
    }, 250);
  }
  function clear(k) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch {}
    delete all[k];
    try { localStorage.setItem(STORE, JSON.stringify(all)); } catch {}
    if (k === key) { strokes = []; notes.value = ""; redraw(); }
  }

  // ---------- window placement ----------
  function placeDefault() {
    if (phone()) { win.style.left = win.style.top = win.style.width = win.style.height = ""; return; }
    let pos = null;
    try { pos = JSON.parse(localStorage.getItem(STORE + ".pos") || "null"); } catch {}
    const w = Math.min(pos?.w || 380, window.innerWidth - 24), h = Math.min(pos?.h || 320, window.innerHeight - 24);
    const x = Math.max(12, Math.min(window.innerWidth - w - 12, pos?.x ?? window.innerWidth - w - 24));
    const y = Math.max(12, Math.min(window.innerHeight - h - 12, pos?.y ?? window.innerHeight - h - 24));
    Object.assign(win.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  }
  function savePos() {
    if (phone()) return;
    const r = win.getBoundingClientRect();
    try { localStorage.setItem(STORE + ".pos", JSON.stringify({ x: r.left, y: r.top, w: r.width, h: r.height })); } catch {}
  }

  // drag by the title bar (not its buttons)
  let drag = null;
  head.addEventListener("pointerdown", (e) => {
    if (phone() || e.target.closest("button")) return;
    const r = win.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = win.getBoundingClientRect();
    const x = Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - drag.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.dy));
    win.style.left = `${x}px`; win.style.top = `${y}px`;
  });
  head.addEventListener("pointerup", () => { if (drag) { drag = null; savePos(); } });

  // resize from the corner grip
  const grip = win.querySelector(".scratch-grip");
  let rs = null;
  grip.addEventListener("pointerdown", (e) => {
    if (phone()) return;
    const r = win.getBoundingClientRect();
    rs = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    grip.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  grip.addEventListener("pointermove", (e) => {
    if (!rs) return;
    win.style.width = `${Math.max(260, Math.min(window.innerWidth - 24, rs.w + e.clientX - rs.x))}px`;
    win.style.height = `${Math.max(220, Math.min(window.innerHeight - 24, rs.h + e.clientY - rs.y))}px`;
    fit();
  });
  grip.addEventListener("pointerup", () => { if (rs) { rs = null; savePos(); fit(); } });

  // ---------- canvas ----------
  // the canvas backs its CSS size at device resolution; strokes are kept in
  // CSS pixels so they redraw cleanly at any size
  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    redraw();
  }
  function redraw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) paint(s);
  }
  function paint(s, from = 0) {
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = s.w;
    if (s.tool === "eraser") ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#135ab6";
    const p = s.pts;
    ctx.beginPath();
    if (p.length === 1) { ctx.arc(p[0][0], p[0][1], s.w / 2, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; if (s.tool === "eraser") ctx.fillStyle = "#000"; ctx.fill(); ctx.restore(); return; }
    const start = Math.max(1, from);
    ctx.moveTo(p[start - 1][0], p[start - 1][1]);
    for (let i = start; i < p.length - 1; i++) {
      // midpoint curves keep the line smooth
      const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
      ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    const last = p[p.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
    ctx.restore();
  }
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    canvas.setPointerCapture(e.pointerId);
    current = { tool, w: tool === "eraser" ? 22 : 3, pts: [pos(e)] };
    strokes.push(current);
    paint(current);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!current) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) current.pts.push(pos(ev));
    paint(current, Math.max(1, current.pts.length - events.length - 1));
  });
  const end = () => { if (current) { current = null; save(); } };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  window.addEventListener("resize", () => { if (!win.hidden) { placeDefault(); fit(); } });

  // ---------- tools and tabs ----------
  win.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) { tool = b.dataset.tool; win.querySelectorAll("[data-tool]").forEach((x) => x.classList.toggle("on", x === b)); }
    else if (b.dataset.tab) { tab = b.dataset.tab; win.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("on", x === b)); win.dataset.tab = tab; if (tab === "draw") fit(); else notes.focus(); }
    else if (b.classList.contains("scratch-clear")) { if (tab === "draw") { strokes = []; redraw(); } else notes.value = ""; save(); if (window.sfx) sfx.pop(); }
    else if (b.classList.contains("scratch-close")) hide();
  });
  notes.addEventListener("input", save);

  // ---------- open / close ----------
  function show(k) {
    if (k !== key) {
      key = k;
      const d = load(k);
      strokes = d.strokes || []; notes.value = d.notes || "";
    }
    win.hidden = false;
    win.classList.toggle("sheet", phone());
    placeDefault();
    requestAnimationFrame(fit);
    if (window.sfx) sfx.pop();
  }
  function hide() { win.hidden = true; }
  function toggle(k) { if (win.hidden || k !== key) show(k); else hide(); }

  return { toggle, hide, clear, get open() { return !win.hidden; } };
})();
