/* ============================================================
   read.js — interactive reading lessons
   Cards you click through: a picture, a short explanation, and now and
   then a check question you must answer to continue. The voice reads
   each card out loud when it's on. A buddy sits beside the card.

     read.start(lesson, onDone)
   Renders into #read-card; app.js shows/hides that card.

   Visuals are drawn from data (no image files):
     bits     { value: "0101" }                     place-value boxes
     flow     { steps: [...] }                       a flowchart
     table    { head: [...], rows: [[...]] }         a table (truth tables, types)
     compare  { a: {title, lines}, b: {...} }        two panels side by side
     code     { code, output }                       a code sample + its output
     gates    { gate: "AND" | "OR" | "NOT" }         gate symbol + truth table
   ============================================================ */

const read = (() => {
  const card = document.getElementById("read-card");
  let lesson = null, index = 0, onDone = null, onCard = null, answered = false;

  // saved = { index } from a previous visit: reopen on that card
  function start(l, done, cardChange, saved) {
    lesson = l; index = 0; onDone = done; onCard = cardChange;
    if (saved && saved.index > 0) index = Math.min(saved.index, l.cards.length - 1);
    render();
  }

  function render() {
    answered = false;
    onCard && onCard(index);
    const c = lesson.cards[index];
    const last = index === lesson.cards.length - 1;
    card.innerHTML = `
      <div class="read-head">
        <span class="read-label">📖 Reading · ${escapeHtml(lesson.title)}</span>
        <div class="read-dots">${lesson.cards.map((_, i) => `<span class="${i < index ? "done" : i === index ? "on" : ""}"></span>`).join("")}</div>
      </div>
      <div class="read-body">
        <div class="read-visual">${c.visual ? visual(c.visual) : ""}</div>
        <div class="read-text">
          <div class="read-num">${index + 1} of ${lesson.cards.length}</div>
          <h2 class="read-title">${escapeHtml(c.title)}</h2>
          ${c.text.split("\n").map((p) => `<p>${rich(p)}</p>`).join("")}
          ${c.check ? `
            <div class="read-check">
              <div class="read-check-q">${escapeHtml(c.check.q)}</div>
              <div class="quiz-choices">${shuffle(c.check).map((ch, i) => `<button class="quiz-choice" data-i="${i}" type="button"><span class="quiz-letter">${"ABCD"[i]}</span><code>${escapeHtml(ch.text)}</code></button>`).join("")}</div>
              <div class="quiz-feedback" hidden></div>
            </div>` : ""}
        </div>
      </div>
      <div class="read-foot">
        <button class="btn btn-ghost read-prev" type="button" ${index === 0 ? "disabled" : ""}>◀ Back</button>
        <button class="btn btn-primary read-next" type="button" ${c.check ? "disabled" : ""}>${last ? "Finish ✓" : "Continue ▶"}</button>
      </div>
      <div class="read-buddy"><div id="read-buddy-host"></div></div>`;

    buddy.mount(card.querySelector("#read-buddy-host"), "idle");
    card.querySelector(".read-prev").addEventListener("click", () => { if (index > 0) { index--; render(); } });
    card.querySelector(".read-next").addEventListener("click", () => { index++; index < lesson.cards.length ? render() : finish(); });
    if (c.check) {
      const items = card._items;
      card.querySelectorAll(".quiz-choice").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i, items, c.check)));
    }
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
    sfx.pop();
    // read it out loud (labels and the check options aren't spoken)
    voice.stop();
    voice.speak(`${c.title}. ${c.text.replace(/[*`]/g, "")}${c.check ? ` ${c.check.q}` : ""}`);
  }

  function shuffle(check) {
    const items = check.choices.map((text, i) => ({ text, correct: i === check.answer }));
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    card._items = items;
    return items;
  }

  function choose(i, items, check) {
    if (answered) return;
    answered = true;
    const right = items[i].correct;
    const host = card.querySelector("#read-buddy-host");
    if (right) { sfx.success(); host.setAttribute("data-state", "happy"); }
    else { sfx.error(); host.setAttribute("data-state", "thinking"); }
    card.querySelectorAll(".quiz-choice").forEach((b, j) => {
      b.disabled = true;
      if (items[j].correct) b.classList.add("right"); else if (j === i) b.classList.add("wrong");
    });
    const fb = card.querySelector(".quiz-feedback");
    fb.hidden = false;
    fb.className = `quiz-feedback ${right ? "ok" : "bad"}`;
    fb.innerHTML = `<strong>${right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(check.explain)}`;
    card.querySelector(".read-next").disabled = false;
    voice.speak(check.explain);
  }

  function finish() {
    voice.stop();
    onDone && onDone();
  }

  // ---------- visuals ----------

  function visual(v) {
    switch (v.type) {
      case "bits": return bits(v);
      case "flow": return flow(v);
      case "table": return table(v);
      case "compare": return compare(v);
      case "code": return codeSample(v);
      case "gates": return gates(v);
      default: return "";
    }
  }

  function bits({ value, labels = true }) {
    const n = value.length;
    const places = Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
    const total = [...value].reduce((sum, b, i) => sum + (b === "1" ? places[i] : 0), 0);
    return `<div class="vis-bits">
      ${[...value].map((b, i) => `<div class="vis-bit ${b === "1" ? "on" : ""}">${labels ? `<div class="vis-place">${places[i]}</div>` : ""}<div class="vis-digit">${b}</div></div>`).join("")}
      ${labels && n > 1 ? `<div class="vis-sum">= ${[...value].map((b, i) => (b === "1" ? places[i] : null)).filter((x) => x !== null).join(" + ") || "0"} = <strong>${total}</strong></div>` : ""}
    </div>`;
  }

  function flow({ steps }) {
    return `<div class="vis-flow">${steps.map((s, i) => {
      const kind = /^(start|end)$/i.test(s) ? "pill" : /\?$/.test(s) ? "diamond" : "box";
      return `<div class="vis-flow-step ${kind}">${escapeHtml(s)}</div>${i < steps.length - 1 ? '<div class="vis-flow-arrow">↓</div>' : ""}`;
    }).join("")}</div>`;
  }

  function table({ head, rows }) {
    return `<table class="vis-table"><thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td class="${c === "True" || c === "✓" ? "t" : c === "False" || String(c).startsWith("✗") ? "f" : ""}">${escapeHtml(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function compare({ a, b }) {
    const panel = (p, cls) => `<div class="vis-panel ${cls}"><div class="vis-panel-title">${escapeHtml(p.title)}</div>${p.lines.map((l) => `<div class="vis-panel-line">${escapeHtml(l)}</div>`).join("")}</div>`;
    return `<div class="vis-compare">${panel(a, "a")}<div class="vis-vs">vs</div>${panel(b, "b")}</div>`;
  }

  function codeSample({ code, output }) {
    return `<div class="vis-code">
      <div class="vis-code-src">${code.split("\n").map((l, i) => `<div><span class="vis-ln">${i + 1}</span>${colorCode(l)}</div>`).join("")}</div>
      ${output !== null && output !== undefined ? `<div class="vis-code-out"><div class="vis-code-outlabel">Output</div><pre>${escapeHtml(output)}</pre></div>` : `<div class="vis-code-out mystery"><div class="vis-code-outlabel">Output</div><pre>?</pre></div>`}
    </div>`;
  }

  function gates({ gate }) {
    const rows = gate === "NOT"
      ? [["0", "1"], ["1", "0"]]
      : [["0", "0", gate === "AND" ? "0" : "0"], ["0", "1", gate === "AND" ? "0" : "1"], ["1", "0", gate === "AND" ? "0" : "1"], ["1", "1", "1"]];
    const head = gate === "NOT" ? ["In", "Out"] : ["A", "B", "Out"];
    const shape = gate === "AND"
      ? `<path d="M10 10 H40 A30 30 0 0 1 40 70 H10 Z"/>`
      : gate === "OR"
      ? `<path d="M8 10 Q30 40 8 70 Q45 70 72 40 Q45 10 8 10 Z"/>`
      : `<path d="M12 10 L68 40 L12 70 Z"/><circle cx="74" cy="40" r="5"/>`;
    return `<div class="vis-gate">
      <svg viewBox="0 0 110 80" class="vis-gate-svg"><line x1="0" y1="${gate === "NOT" ? 40 : 26}" x2="12" y2="${gate === "NOT" ? 40 : 26}"/>${gate === "NOT" ? "" : '<line x1="0" y1="54" x2="12" y2="54"/>'}${shape}<line x1="${gate === "NOT" ? 80 : 72}" y1="40" x2="100" y2="40"/><text x="40" y="45" text-anchor="middle">${gate}</text></svg>
      ${table({ head, rows: rows.map((r) => r.map((x) => (x === "1" ? "True" : "False"))) })}
    </div>`;
  }

  function colorCode(code) {
    return buddy.tokenize(code).map((t) => (t.cls ? `<span class="tok ${t.cls}">${escapeHtml(t.text)}</span>` : escapeHtml(t.text))).join("");
  }
  function rich(s) {
    return escapeHtml(s)
      .replace(/`([^`]+)`/g, (_, c) => `<code class="chip">${c}</code>`)
      .replace(/\*([^*]+)\*/g, (_, t) => `<span class="term term-blue">${t}</span>`);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { start };
})();
