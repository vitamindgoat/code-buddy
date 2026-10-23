/* ============================================================
   viz.js — the code visualizer ("Step through")
   Plays back a recording of your program (sandbox.trace in app.js,
   trace() in runner.js) one line at a time:
     - the code, with an arrow on the line about to run and a faint mark
       on the line that just ran
     - every variable and its value; the ones that just changed flash
     - everything printed so far
     - one plain sentence saying what the last line did
   Controls: Back / Next, Play (auto-step), Start / End, a slider, and the
   arrow keys + Space.

     viz.open(code, inputs)
   ============================================================ */

const viz = (() => {
  const $ = (id) => document.getElementById(id);
  const root = $("viz");
  let rec = null, lines = [], i = 0, timer = null, lastFocus = null;

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const code = (t) => `<code>${esc(t)}</code>`;

  async function open(src, inputs = []) {
    if (!src.trim()) return;
    lastFocus = document.activeElement;
    lines = src.replace(/\s+$/, "").split("\n");
    root.hidden = false; root.classList.remove("show"); void root.offsetWidth; root.classList.add("show");
    $("viz-caption").innerHTML = "Recording your program…";
    $("viz-code").innerHTML = ""; $("viz-vars").innerHTML = ""; $("viz-out").textContent = "";
    setControls(false);
    if (window.sfx) sfx.pop();
    if (!sandbox.ready) {
      $("viz-caption").innerHTML = "<b>Python isn't ready yet.</b> Wait a moment and try again.";
      return;
    }
    rec = await sandbox.trace(src, inputs);
    if (root.hidden) return;
    if (!rec.steps.length) {
      $("viz-caption").innerHTML = `<b>Couldn't step through this.</b> ${esc(rec.error || "")}`;
      renderCode(-1, -1, rec.errorLine);
      return;
    }
    i = 0; setControls(true);
    $("viz-slider").max = rec.steps.length - 1;
    render();
    setTimeout(() => $("viz-next").focus(), 300);
    badges.earn("stepper");
  }
  function close() {
    if (root.hidden) return;
    stop(); root.hidden = true;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch {}
  }

  function setControls(on) {
    for (const id of ["viz-first", "viz-prev", "viz-play", "viz-next", "viz-last", "viz-slider"]) $(id).disabled = !on;
  }

  function renderCode(cur, prev, errLine) {
    $("viz-code").innerHTML = lines.map((l, k) => {
      const n = k + 1;
      const cls = [n === cur ? "cur" : "", n === prev && n !== cur ? "prev" : "", n === errLine ? "err" : ""].join(" ").trim();
      const mark = n === errLine ? "✕" : n === cur ? "➜" : n === prev ? "•" : "";
      return `<div class="viz-line ${cls}"><span class="viz-mark" aria-hidden="true">${mark}</span><span class="viz-num">${n}</span><span class="viz-src">${esc(l) || " "}</span></div>`;
    }).join("");
    const el = $("viz-code").querySelector(".cur, .err");
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  // Describe what happened between step i-1 and step i, in one sentence.
  function caption() {
    const s = rec.steps[i], p = rec.steps[i - 1];
    const last = i === rec.steps.length - 1;
    const parts = [];
    if (p) {
      const before = Object.fromEntries(p.fn === s.fn ? p.vars.map(([k, v]) => [k, v]) : []);
      const made = [], changed = [];
      for (const [k, v] of s.vars) {
        if (!(k in before)) made.push(`${code(k)} = ${code(v)}`);
        else if (before[k] !== v) changed.push(`${code(k)} from ${code(before[k])} to ${code(v)}`);
      }
      const printed = s.out.slice(p.out.length).replace(/\n$/, "");
      const did = [];
      if (made.length) did.push(`created ${made.join(", ")}`);
      if (changed.length) did.push(`changed ${changed.join(", ")}`);
      if (printed) did.push(`printed ${code(printed.split("\n").join(" ⏎ "))}`);
      const crashedHere = last && rec.error && p.line === rec.errorLine;
      if (p.line && !(crashedHere && !did.length)) parts.push(`<b>Line ${p.line}</b> ${did.length ? did.join(" and ") : "ran"}.`);
      if (s.fn !== p.fn && s.fn !== "<module>") parts.push(`Now inside ${code(s.fn + "()")}.`);
      if (s.line && p.line && s.line < p.line && s.fn === p.fn) parts.push(`Back up to line ${s.line}: the loop goes around again.`);
    } else {
      parts.push("Python starts at the top.");
    }
    if (!last && s.line) parts.push(`Line ${s.line} runs next.`);
    if (last) {
      if (rec.error) parts.push(`<b class="viz-bad">It crashed${rec.errorLine ? ` on line ${rec.errorLine}` : ""}:</b> ${code(rec.error)}`);
      else if (rec.limited) parts.push("<b>I stopped after 500 steps.</b> That's usually a loop that never ends.");
      else parts.push(`<b>Done!</b> That took ${rec.steps.length - 1} step${rec.steps.length === 2 ? "" : "s"}.`);
    }
    return parts.join(" ");
  }

  function render() {
    const s = rec.steps[i], p = rec.steps[i - 1];
    const last = i === rec.steps.length - 1;
    renderCode(s.line ?? -1, p ? p.line : -1, last ? rec.errorLine : null);
    const before = Object.fromEntries(p && p.fn === s.fn ? p.vars.map(([k, v]) => [k, v]) : []);
    $("viz-scope").textContent = s.fn === "<module>" ? "" : `inside ${s.fn}()`;
    $("viz-vars").innerHTML = s.vars.length
      ? s.vars.map(([k, v, t]) => `<tr class="${!p ? "" : !(k in before) ? "new" : before[k] !== v ? "changed" : ""}"><th scope="row">${esc(k)}</th><td><code>${esc(v)}</code></td><td><span class="viz-type">${esc(t)}</span></td></tr>`).join("")
      : '<tr><td class="viz-none" colspan="3">No variables yet</td></tr>';
    $("viz-out").textContent = s.out || "";
    $("viz-out").classList.toggle("empty", !s.out);
    $("viz-caption").innerHTML = caption();
    $("viz-count").textContent = `Step ${i + 1} of ${rec.steps.length}`;
    $("viz-slider").value = i;
    $("viz-prev").disabled = $("viz-first").disabled = i === 0;
    $("viz-next").disabled = $("viz-last").disabled = last;
    if (last) stop();
  }

  const go = (n) => { if (!rec) return; i = Math.max(0, Math.min(rec.steps.length - 1, n)); render(); };
  function play() {
    if (!rec) return;
    if (timer) return stop();
    if (i === rec.steps.length - 1) i = 0;
    $("viz-play").textContent = "⏸ Pause";
    timer = setInterval(() => { if (i >= rec.steps.length - 1) stop(); else go(i + 1); }, 750);
  }
  function stop() { clearInterval(timer); timer = null; $("viz-play").textContent = "▶ Play"; }

  $("viz-first").addEventListener("click", () => { stop(); go(0); });
  $("viz-prev").addEventListener("click", () => { stop(); go(i - 1); });
  $("viz-next").addEventListener("click", () => { stop(); go(i + 1); });
  $("viz-last").addEventListener("click", () => { stop(); go(Infinity); });
  $("viz-play").addEventListener("click", play);
  $("viz-slider").addEventListener("input", (e) => { stop(); go(+e.target.value); });
  $("viz-close").addEventListener("click", close);
  root.addEventListener("click", (e) => { if (e.target === root) close(); });
  document.addEventListener("keydown", (e) => {
    if (root.hidden) return;
    if (e.key === "Escape") { e.stopImmediatePropagation(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(i - 1); }
    else if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); play(); }
  }, true);

  return { open, close, get isOpen() { return !root.hidden; } };
})();
