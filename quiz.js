/* ============================================================
   quiz.js — end-of-module quizzes
   Two kinds of question:
     multiple choice   { q, choices, answer, explain }
                       choices are SHUFFLED every time, so the right
                       answer lands on a different letter each run
     code              { type: "code", q, expectedOutput, explain, inputs? }
                       a mini editor; Run shows the output, Submit scores it
   Instant feedback with an explanation, then a score card.
   No buddy help during a quiz.

     quiz.start(module, onDone, sandbox)   onDone({ score, total })
   ============================================================ */

const quiz = (() => {
  const card = document.getElementById("quiz-card");
  let questions = [], index = 0, score = 0, onDone = null, answered = false, sandbox = null, codeEditor = null, onSave = null;

  // saved = { index, score } from a previous visit: pick up at that question
  function start(module, done, sb, saved, save) {
    questions = module.quiz;
    index = 0; score = 0; onDone = done; sandbox = sb; onSave = save;
    if (saved && saved.index > 0) { index = Math.min(saved.index, questions.length); score = saved.score || 0; }
    card.dataset.title = module.title;
    index < questions.length ? render() : finish();
  }
  function saveState() { onSave && onSave({ index, score }); }

  // Fisher-Yates shuffle, with the correct answer's new position tracked
  function shuffled(q) {
    const items = q.choices.map((text, i) => ({ text, correct: i === q.answer }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function header() {
    return `
      <div class="quiz-head">
        <span class="quiz-label">Quiz · ${card.dataset.title}</span>
        <span class="quiz-count">${index + 1} / ${questions.length}</span>
      </div>
      <div class="quiz-progress"><div style="width:${(index / questions.length) * 100}%"></div></div>`;
  }

  function render() {
    answered = false;
    codeEditor = null;
    const q = questions[index];
    if (q.type === "code") return renderCode(q);

    const items = shuffled(q);
    card.innerHTML = `${header()}
      <h2 class="quiz-q">${escapeHtml(q.q).replace(/\n/g, "<br>")}</h2>
      <div class="quiz-choices">
        ${items.map((c, i) => `<button class="quiz-choice" data-i="${i}" type="button"><span class="quiz-letter">${"ABCD"[i]}</span><code>${escapeHtml(c.text)}</code></button>`).join("")}
      </div>
      <div class="quiz-feedback" hidden></div>
      <div class="quiz-actions"><button class="btn btn-primary quiz-next" type="button" hidden>Next ▶</button></div>`;
    card.querySelectorAll(".quiz-choice").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i, items)));
    wireNext();
  }

  function renderCode(q) {
    card.innerHTML = `${header()}
      <div class="quiz-kind">💻 Coding question</div>
      <h2 class="quiz-q">${escapeHtml(q.q).replace(/\n/g, "<br>")}</h2>
      ${q.inputs ? `<div class="quiz-inputs">The user types: <code>${escapeHtml(q.inputs.join(", "))}</code></div>` : ""}
      <div class="quiz-editor"><textarea id="quiz-code"></textarea></div>
      <div class="quiz-run-row">
        <button class="btn btn-ghost quiz-run" type="button">▶ Run</button>
        <button class="btn btn-primary quiz-submit" type="button">Submit answer</button>
      </div>
      <pre class="quiz-output" hidden></pre>
      <div class="quiz-feedback" hidden></div>
      <div class="quiz-actions"><button class="btn btn-primary quiz-next" type="button" hidden>Next ▶</button></div>`;
    codeEditor = CodeMirror.fromTextArea(card.querySelector("#quiz-code"), {
      mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, autofocus: true,
    });
    const out = card.querySelector(".quiz-output");
    const runIt = async () => {
      if (!sandbox || !sandbox.ready) return null;
      out.hidden = false; out.textContent = "Running…"; out.className = "quiz-output";
      sfx.run();
      const r = await sandbox.run(codeEditor.getValue(), q.inputs || []);
      out.textContent = r.ok ? (r.output || "(no output)") : (r.output ? r.output + "\n" : "") + r.error;
      out.className = "quiz-output" + (r.ok ? "" : " err");
      return r;
    };
    card.querySelector(".quiz-run").addEventListener("click", runIt);
    card.querySelector(".quiz-submit").addEventListener("click", async () => {
      if (answered) return;
      const r = await runIt();
      if (!r) return;
      answered = true;
      const right = r.ok && r.output.trim() === q.expectedOutput;
      if (right) { score++; sfx.success(); } else sfx.error();
      card.querySelector(".quiz-submit").disabled = true;
      card.querySelector(".quiz-run").disabled = true;
      codeEditor.setOption("readOnly", true);
      const fb = card.querySelector(".quiz-feedback");
      fb.hidden = false;
      fb.className = `quiz-feedback ${right ? "ok" : "bad"}`;
      fb.innerHTML = `<strong>${right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explain)}${right ? "" : `<br>Expected output:<pre class="quiz-expected">${escapeHtml(q.expectedOutput)}</pre>`}`;
      const next = card.querySelector(".quiz-next");
      next.hidden = false;
      next.textContent = index === questions.length - 1 ? "See my score ▶" : "Next ▶";
    });
    wireNext();
  }

  function wireNext() {
    card.querySelector(".quiz-next").addEventListener("click", () => { index++; saveState(); index < questions.length ? render() : finish(); });
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
  }

  function choose(i, items) {
    if (answered) return;
    answered = true;
    const q = questions[index];
    const right = items[i].correct;
    if (right) { score++; sfx.success(); } else sfx.error();
    card.querySelectorAll(".quiz-choice").forEach((b, j) => {
      b.disabled = true;
      if (items[j].correct) b.classList.add("right");
      else if (j === i) b.classList.add("wrong");
    });
    const fb = card.querySelector(".quiz-feedback");
    fb.hidden = false;
    fb.className = `quiz-feedback ${right ? "ok" : "bad"}`;
    fb.innerHTML = `<strong>${right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explain)}`;
    const next = card.querySelector(".quiz-next");
    next.hidden = false;
    next.textContent = index === questions.length - 1 ? "See my score ▶" : "Next ▶";
  }

  function finish() {
    const pct = Math.round((score / questions.length) * 100);
    const msg = pct === 100 ? "Perfect score!" : pct >= 70 ? "Nice work!" : "Good try. Review the lessons and come back.";
    card.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-buddy" id="quiz-buddy"></div>
        <div class="quiz-score">${score} / ${questions.length}</div>
        <div class="quiz-pct">${pct}%</div>
        <p>${msg}</p>
        <button class="btn btn-primary quiz-done" type="button">Continue ▶</button>
      </div>`;
    buddy.mount(card.querySelector("#quiz-buddy"), pct >= 70 ? "celebrate" : "thinking");
    if (pct >= 70) { fx.confetti(); sfx.levelUp(); }
    card.querySelector(".quiz-done").addEventListener("click", (e) => { e.currentTarget.disabled = true; onDone && onDone({ score, total: questions.length }); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { start };
})();
