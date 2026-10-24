/* ============================================================
   read.js — interactive reading lessons
   Cards you click through: a picture, a short explanation, and now and
   then a check question you must answer to continue. The voice reads
   each card out loud when it's on.

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
        <span class="read-label">Reading · ${escapeHtml(lesson.title)}</span>
        <button class="btn btn-ghost read-aloud" type="button" aria-pressed="false">${icon("volume_up")}<span>Read aloud</span></button>
        <div class="read-dots">${lesson.cards.map((_, i) => `<span class="${i < index ? "done" : i === index ? "on" : ""}"></span>`).join("")}</div>
      </div>
      <div class="read-body">
        <div class="read-visual">${c.visual ? visual(c.visual) : ""}</div>
        <div class="read-text">
          <div class="read-num">${index + 1} of ${lesson.cards.length}</div>
          <h2 class="read-title">${escapeHtml(c.title)}</h2>
          ${c.text.split("\n").map((p) => `<p>${rich(p)}</p>`).join("")}
          ${c.say && !c.checks ? `<div class="read-remember"><span class="read-remember-label">Remember</span>${escapeHtml(c.say)}</div>` : ""}
          ${c.checks ? `<div class="read-check" id="read-check"></div>` : ""}
        </div>
      </div>
      <div class="read-foot">
        <button class="btn btn-ghost read-prev" type="button" ${index === 0 ? "disabled" : ""}>Back</button>
        <button class="btn btn-primary read-next" type="button" ${c.checks ? "disabled" : ""}>${last ? "Finish" : "Continue"}</button>
      </div>`;

    card.querySelector(".read-prev").addEventListener("click", () => { if (index > 0) { index--; card.dataset.dir = "prev"; render(); } });
    card.querySelector(".read-next").addEventListener("click", (e) => { e.currentTarget.disabled = true; index++; card.dataset.dir = "next"; index < lesson.cards.length ? render() : finish(); });
    if (c.checks) { passed = false; askQuestion(c, pickQuestion(c)); }
    card.querySelector(".read-aloud").addEventListener("click", toggleAloud);
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
    sfx.pop();
    // Buddy stays quiet on readings (even with his voice on): the
    // "Read aloud" button reads the whole page when the learner wants it
    voice.stop();
  }

  // ---------- check questions ----------
  // Each check card has a pool of questions. One is asked per visit, never
  // the one from the last visit (remembered per card). A wrong answer shows
  // the explanation, then asks a different question before Continue
  // unlocks. Once passed, "Another question" offers more practice.
  const SEEN_KEY = "codebuddy.readSeen";
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch {}
  let passed = false, asked = [];
  const cardKey = () => `${lesson.id}:${index}`;

  function pickQuestion(c) {
    const pool = c.checks.map((q, i) => i);
    const last = seen[cardKey()];
    let avail = pool.filter((i) => !asked.includes(i) && i !== last);
    if (!avail.length) avail = pool.filter((i) => !asked.includes(i));
    if (!avail.length) { asked = []; avail = pool.filter((i) => i !== last); }
    const qi = avail[Math.floor(Math.random() * avail.length)];
    asked.push(qi);
    seen[cardKey()] = qi;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch {}
    return qi;
  }

  function askQuestion(c, qi, { extra = false } = {}) {
    // a question already on screen slides out first, then the new one rises in
    const box = card.querySelector("#read-check");
    if (box && box.children.length && !box.classList.contains("swap-out")) {
      box.classList.add("swap-out");
      setTimeout(() => { box.classList.remove("swap-out"); renderQuestion(c, qi, { extra }); }, 180);
      return;
    }
    renderQuestion(c, qi, { extra });
  }

  function renderQuestion(c, qi, { extra = false } = {}) {
    const q = c.checks[qi];
    const items = q.choices.map((text, i) => ({ text, correct: i === q.answer }));
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    const box = card.querySelector("#read-check");
    const [first, ...rest] = q.q.split("\n");
    box.innerHTML = `
      <div class="read-check-label">${extra ? "One more" : "Check"}</div>
      <div class="read-check-q">${escapeHtml(first)}</div>
      ${rest.length ? `<pre class="read-check-code">${colorCode(rest.join("\n"))}</pre>` : ""}
      <div class="quiz-choices">${items.map((ch, i) => `<button class="quiz-choice" data-i="${i}" type="button"><span class="quiz-letter">${"ABCD"[i]}</span><code>${escapeHtml(ch.text)}</code></button>`).join("")}</div>
      <div class="quiz-feedback" hidden></div>
      <div class="read-check-actions" hidden>
        <button class="btn btn-ghost read-more" type="button">Another question</button>
      </div>`;
    box.classList.remove("swap-in"); void box.offsetWidth; box.classList.add("swap-in");
    answered = false;
    box.querySelectorAll(".quiz-choice").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i, items, q, c)));
    box.querySelector(".read-more").addEventListener("click", () => askQuestion(c, pickQuestion(c), { extra: true }));
  }

  function choose(i, items, q, c) {
    if (answered) return;
    answered = true;
    const right = items[i].correct;
    if (right) sfx.success(); else sfx.error();
    const box = card.querySelector("#read-check");
    box.querySelectorAll(".quiz-choice").forEach((b, j) => {
      b.disabled = true;
      if (items[j].correct) b.classList.add("right"); else if (j === i) b.classList.add("wrong");
    });
    const fb = box.querySelector(".quiz-feedback");
    fb.hidden = false;
    fb.className = `quiz-feedback ${right ? "ok" : "bad"}`;
    if (right) {
      passed = true;
      fb.innerHTML = `<strong>Correct!</strong> ${escapeHtml(q.explain)}`;
      card.querySelector(".read-next").disabled = false;
      box.querySelector(".read-check-actions").hidden = false;
    } else {
      fb.innerHTML = `<strong>Not quite.</strong> ${escapeHtml(q.explain)}${passed ? "" : `<div class="read-retry">Let's try a different one.</div>`}`;
      if (passed) box.querySelector(".read-check-actions").hidden = false;
      else setTimeout(() => askQuestion(c, pickQuestion(c)), 3200);   // time to read the answer
    }
  }

  // ---------- "Read aloud": Buddy reads the whole page, word by word ----------
  function pageText() {
    const parts = [];
    const add = (el) => { if (el) { const t = el.textContent.replace(/\s+/g, " ").trim(); if (t) parts.push(/[.!?:]$/.test(t) ? t : t + "."); } };
    add(card.querySelector(".read-title"));
    card.querySelectorAll(".read-text > p").forEach(add);
    const rem = card.querySelector(".read-remember");
    if (rem) { const t = rem.cloneNode(true); t.querySelector(".read-remember-label")?.remove(); parts.push("Remember: " + t.textContent.trim()); }
    const q = card.querySelector(".read-check .read-check-q");
    add(q);
    card.querySelectorAll(".read-check .quiz-choice code").forEach((c2, i) => parts.push(`${"ABCD"[i]}: ${c2.textContent}.`));
    return parts.join(" ");
  }
  function setAloud(onNow) {
    const b = card.querySelector(".read-aloud"); if (!b) return;
    b.setAttribute("aria-pressed", String(onNow));
    b.classList.toggle("on", onNow);
    b.innerHTML = onNow ? `${icon("stop")}<span>Stop</span>` : `${icon("volume_up")}<span>Read aloud</span>`;
  }
  function toggleAloud() {
    if (card.querySelector(".read-aloud.on")) { voice.stop(); setAloud(false); return; }
    const ok = voice.speak(pageText(), { force: true, onEnd: () => setAloud(false) });
    if (ok !== false) setAloud(true);
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
      .replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong class="key">${t}</strong>`)
      .replace(/\*([^*]+)\*/g, (_, t) => `<span class="term term-blue">${t}</span>`);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { start };
})();
