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

     quiz.start(module, onDone, sandbox, saved, save)   onDone({ score, total })
   Questions come from module.quizBank (see lessons.js): a fresh draw per
   attempt, and a retake never repeats the previous attempt's questions.
   ============================================================ */

const quiz = (() => {
  const card = document.getElementById("quiz-card");
  let questions = [], index = 0, score = 0, onDone = null, sandbox = null, codeEditor = null, onSave = null;

  // Each attempt draws a fresh set from the module's bank: draw.mc choice
  // questions and draw.code coding questions, mixed so the coding ones are
  // spread out. The set is saved (as bank indexes) so coming back mid-quiz
  // shows the same questions; a retake draws a set with none of the
  // questions from the previous attempt.
  let bank = null, set = [], last = [], scratchKey = "", moduleTitle = "";
  const finish_ = () => window.finishScreen;   // finish.js loads after this file
  function pick(pool, n, avoid) {
    const fresh = shuffle(pool.filter((i) => !avoid.includes(i)));
    const extra = shuffle(pool.filter((i) => avoid.includes(i)));   // only if the bank runs short
    return fresh.concat(extra).slice(0, n);
  }
  function draw(avoid) {
    const mc = bank.questions.map((x, i) => (x.type === "code" ? null : i)).filter((i) => i !== null);
    const code = bank.questions.map((x, i) => (x.type === "code" ? i : null)).filter((i) => i !== null);
    const picked = pick(mc, bank.draw.mc, avoid);
    const codes = pick(code, bank.draw.code, avoid);
    // spread the coding questions through the list, never first
    const gap = (picked.length + 1) / (codes.length + 1);
    codes.forEach((c, k) => picked.splice(Math.min(picked.length, Math.round(gap * (k + 1)) + k), 0, c));
    return picked;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // saved = { index, score, finished, set, last } from a previous visit
  function start(module, done, sb, saved, save) {
    bank = module.quizBank;
    scratchKey = module.id;
    moduleTitle = module.title;
    index = 0; score = 0; onDone = done; sandbox = sb; onSave = save;
    last = (saved && saved.last) || [];
    set = (saved && saved.set && saved.set.length) ? saved.set : draw(last);
    questions = set.map((i) => bank.questions[i]);
    answers = (saved && saved.set && saved.set.length && saved.answers) || {};
    score = tally();
    if (saved && saved.set && saved.set.length && saved.index > 0) index = Math.min(saved.index, questions.length - 1);
    if (saved && saved.finished) { score = saved.score || 0; index = questions.length; }
    card.dataset.title = module.title;
    if (saved && saved.finished) return finish({ again: true });
    saveState();
    render();
  }
  function saveState(extra = {}) { onSave && onSave({ index, score, total: questions.length, set, last, answers, finished: false, ...extra }); }

  // One record per question, kept for the whole attempt (and saved), so
  // you can go back to an answered question and see it as you left it:
  //   choice: { order: [original choice indexes, as shown], picked, right }
  //   code:   { code, output, ok, right }
  let answers = {};
  const isAnswered = (i) => !!answers[i] && (answers[i].picked !== undefined || answers[i].code !== undefined);
  const answeredCount = () => questions.filter((_, i) => isAnswered(i)).length;
  const tally = () => questions.filter((_, i) => isAnswered(i) && answers[i].right).length;

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // the shown order of a question's choices is fixed on first view
  function orderFor(i) {
    if (!answers[i] || !answers[i].order) answers[i] = { ...(answers[i] || {}), order: shuffle(questions[i].choices.map((_, k) => k)) };
    return answers[i].order;
  }

  function header() {
    return `
      <div class="quiz-head">
        <span class="quiz-label">Quiz · ${card.dataset.title}</span>
        <span class="quiz-head-right"><button type="button" class="btn btn-ghost quiz-scratch" title="Open the scratch pad">✎ Scratch pad</button><span class="quiz-count">${index + 1} / ${questions.length}</span></span>
      </div>
      <div class="quiz-progress"><div style="width:${(answeredCount() / questions.length) * 100}%"></div></div>`;
  }
  // the numbered strip under the question: jump anywhere, see how each went
  function dots() {
    return `<div class="quiz-dots">${questions.map((qq, i) => {
      const a = isAnswered(i) ? (answers[i].right ? "right" : "wrong") : "";
      return `<button type="button" class="quiz-dot ${i === index ? "on" : ""} ${a}" data-go="${i}" aria-label="Question ${i + 1}" title="Question ${i + 1}">${i + 1}</button>`;
    }).join("")}</div>`;
  }

  function render() {
    codeEditor = null;
    const q = questions[index];
    if (q.type === "code") return renderCode(q);
    const order = orderFor(index);
    const a = answers[index];
    const done = isAnswered(index);
    card.innerHTML = `${header()}
      <h2 class="quiz-q">${escapeHtml(q.q).replace(/\n/g, "<br>")}</h2>
      <div class="quiz-choices">
        ${order.map((orig, i) => `<button class="quiz-choice ${done && orig === q.answer ? "right" : ""} ${done && i === a.picked && orig !== q.answer ? "wrong" : ""}" data-i="${i}" type="button" ${done ? "disabled" : ""}><span class="quiz-letter">${"ABCD"[i]}</span><code>${escapeHtml(q.choices[orig])}</code></button>`).join("")}
      </div>
      <div class="quiz-feedback ${done ? (a.right ? "ok" : "bad") : ""}" ${done ? "" : "hidden"}>${done ? `<strong>${a.right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explain)}` : ""}</div>
      ${nav(done)}`;
    card.querySelectorAll(".quiz-choice").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i)));
    wireNav();
  }

  function renderCode(q) {
    const a = answers[index];
    const done = isAnswered(index);
    card.innerHTML = `${header()}
      <div class="quiz-kind">💻 Coding question</div>
      <h2 class="quiz-q">${escapeHtml(q.q).replace(/\n/g, "<br>")}</h2>
      ${q.inputs ? `<div class="quiz-inputs">The user types: <code>${escapeHtml(q.inputs.join(", "))}</code></div>` : ""}
      <div class="quiz-editor"><textarea id="quiz-code"></textarea></div>
      <div class="quiz-run-row">
        <button class="btn btn-ghost quiz-run" type="button" ${done ? "disabled" : ""}>▶ Run</button>
        <button class="btn btn-primary quiz-submit" type="button" ${done ? "disabled" : ""}>Submit answer</button>
      </div>
      <pre class="quiz-output ${done && !a.ok ? "err" : ""}" ${done ? "" : "hidden"}>${done ? escapeHtml(a.output) : ""}</pre>
      <div class="quiz-feedback ${done ? (a.right ? "ok" : "bad") : ""}" ${done ? "" : "hidden"}>${done ? `<strong>${a.right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explain)}${a.right ? "" : `<br>Expected output:<pre class="quiz-expected">${escapeHtml(q.expectedOutput)}</pre>`}` : ""}</div>
      ${nav(done)}`;
    codeEditor = CodeMirror.fromTextArea(card.querySelector("#quiz-code"), {
      mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, autofocus: !done,
      // Tab = 4 spaces (a real tab mixed with spaces makes Python fail), Backspace un-indents a level
      extraKeys: {
        Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection(" ".repeat(4 - (c.getCursor().ch % 4)), "end")),
        "Shift-Tab": (c) => c.indentSelection("subtract"),
        Backspace: (c) => (typeof smartBackspace === "function" ? smartBackspace(c) : CodeMirror.Pass),
      },
    });
    codeEditor.getInputField().setAttribute("aria-label", "Quiz answer: type your Python here");
    if (a && a.code !== undefined) codeEditor.setValue(a.code);
    else if (a && a.draft) codeEditor.setValue(a.draft);
    if (done) codeEditor.setOption("readOnly", true);
    // keep unsubmitted code when they wander off to another question
    codeEditor.on("change", () => { if (!isAnswered(index)) { answers[index] = { ...(answers[index] || {}), draft: codeEditor.getValue() }; } });
    if (window.keybar) keybar.attach(codeEditor, () => card.querySelector(".quiz-run")?.click());
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
      if (isAnswered(index)) return;
      const r = await runIt();
      if (!r) return;
      const right = r.ok && r.output.trim() === q.expectedOutput;
      answers[index] = { code: codeEditor.getValue(), output: out.textContent, ok: r.ok, right };
      score = tally();
      if (right) sfx.success(); else sfx.error();
      saveState();
      render();   // redraws read-only with the feedback and the nav
    });
    wireNav();
  }

  // Back / Next under every question. Next is there once the question is
  // answered; on the last question it becomes "See my score" when
  // everything is answered, or jumps to the first unanswered one.
  function nav(done) {
    const left = index > 0;
    const allDone = answeredCount() === questions.length;
    const lastQ = index === questions.length - 1;
    const nextLabel = allDone ? (lastQ ? "See my score ▶" : "Next ▶") : lastQ ? "Next unanswered ▶" : "Next ▶";
    return `<div class="quiz-nav">${dots()}<div class="quiz-actions">
      <button class="btn btn-ghost quiz-back" type="button" ${left ? "" : "hidden"}>◀ Back</button>
      <button class="btn btn-primary quiz-next" type="button" ${done ? "" : "hidden"}>${nextLabel}</button>
    </div></div>`;
  }

  function wireNav() {
    card.querySelector(".quiz-back")?.addEventListener("click", () => go(index - 1));
    card.querySelector(".quiz-next")?.addEventListener("click", () => {
      const allDone = answeredCount() === questions.length;
      if (index === questions.length - 1) {
        if (allDone) return finish();
        const first = questions.findIndex((_, i) => !isAnswered(i));
        return go(first);
      }
      go(index + 1);
    });
    card.querySelectorAll(".quiz-dot").forEach((d) => d.addEventListener("click", () => go(+d.dataset.go)));
    card.querySelector(".quiz-scratch")?.addEventListener("click", () => scratch.toggle(scratchKey));
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
  }

  function go(i) {
    if (i < 0 || i >= questions.length || i === index) return;
    card.dataset.dir = i < index ? "prev" : "next";   // slide from the side you're heading to
    index = i;
    saveState();
    sfx.click();
    render();
  }

  function choose(i) {
    if (isAnswered(index)) return;
    const q = questions[index];
    const order = orderFor(index);
    const right = order[i] === q.answer;
    answers[index] = { order, picked: i, right };
    score = tally();
    if (right) sfx.success(); else sfx.error();
    saveState();
    // show the result in place (same order, so nothing jumps), then the nav
    card.querySelectorAll(".quiz-choice").forEach((b, j) => {
      b.disabled = true;
      if (order[j] === q.answer) b.classList.add("right");
      else if (j === i) b.classList.add("wrong");
    });
    const fb = card.querySelector(".quiz-feedback");
    fb.hidden = false;
    fb.className = `quiz-feedback ${right ? "ok" : "bad"}`;
    fb.innerHTML = `<strong>${right ? "Correct!" : "Not quite."}</strong> ${escapeHtml(q.explain)}`;
    card.querySelector(".quiz-nav").outerHTML = nav(true);
    card.querySelector(".quiz-progress div").style.width = `${(answeredCount() / questions.length) * 100}%`;
    wireNav();
  }

  // The score screen. It sticks: coming back to a finished quiz shows it
  // again (quietly, no second round of confetti) with the option to retake.
  function finish({ again = false } = {}) {
    const pct = Math.round((score / questions.length) * 100);
    const msg = pct === 100 ? "Perfect score!" : pct >= 70 ? "Nice work!" : "Good try. Review the lessons and come back.";
    if (!again) saveState({ finished: true });
    card.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-buddy" id="quiz-buddy"></div>
        <div class="quiz-kicker">${again ? "Your score" : "Quiz finished"}</div>
        <div class="quiz-score">${score} / ${questions.length}</div>
        <div class="quiz-pct">${pct}%</div>
        <p>${msg}</p>
        <div class="quiz-result-actions">
          <button class="btn btn-primary quiz-done" type="button">Continue ▶</button>
          <div class="quiz-result-row">
            <button class="btn btn-ghost quiz-share" type="button">⇪ Share score</button>
            <button class="btn btn-ghost quiz-retake" type="button">↺ Retake quiz</button>
          </div>
          <div class="quiz-share-note" aria-live="polite"></div>
        </div>
      </div>`;
    buddy.mount(card.querySelector("#quiz-buddy"), pct >= 70 ? (again ? "happy" : "celebrate") : "thinking");
    if (pct >= 70 && !again) { fx.confetti(pct === 100 ? 220 : 160, pct === 100 ? "stars" : undefined); pct === 100 ? sfx.fanfare() : sfx.levelUp(); }
    card.querySelector(".quiz-done").addEventListener("click", (e) => { e.currentTarget.disabled = true; onDone && onDone({ score, total: questions.length }); });
    card.querySelector(".quiz-retake").addEventListener("click", retake);
    card.querySelector(".quiz-share").addEventListener("click", async (e) => {
      const btn = e.currentTarget, note = card.querySelector(".quiz-share-note");
      btn.disabled = true; sfx.click();
      const r = await finish_().shareScore({ module: moduleTitle, score, total: questions.length, name: (typeof settings !== "undefined" && settings.name) || "" });
      btn.disabled = false;
      note.textContent = r === "downloaded+copied" ? "Saved the image and copied a message to paste with it." : r === "downloaded" ? "Saved the score card image." : r === "fail" ? "Couldn't make the image, sorry." : "";
    });
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
  }

  function retake() {
    last = set;                      // none of these again this time
    set = draw(last);
    questions = set.map((i) => bank.questions[i]);
    index = 0; score = 0; answers = {};
    scratch.clear(scratchKey);      // a clean pad for the new attempt
    saveState();
    sfx.pop();
    render();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { start };
})();
