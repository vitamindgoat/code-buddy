/* ============================================================
   quiz.js — end-of-module quizzes
   Multiple choice, one question at a time, instant feedback with an
   explanation, then a score card. No buddy help during a quiz.

     quiz.start(module, onDone)   onDone({ score, total })
   The quiz renders into #quiz-card; app.js shows/hides that card.
   ============================================================ */

const quiz = (() => {
  const card = document.getElementById("quiz-card");
  let questions = [], index = 0, score = 0, onDone = null, answered = false;

  function start(module, done) {
    questions = module.quiz;
    index = 0; score = 0; onDone = done;
    card.dataset.title = module.title;
    render();
  }

  function render() {
    answered = false;
    const q = questions[index];
    card.innerHTML = `
      <div class="quiz-head">
        <span class="quiz-label">Quiz · ${card.dataset.title}</span>
        <span class="quiz-count">${index + 1} / ${questions.length}</span>
      </div>
      <div class="quiz-progress"><div style="width:${(index / questions.length) * 100}%"></div></div>
      <h2 class="quiz-q">${escapeHtml(q.q).replace(/\n/g, "<br>")}</h2>
      <div class="quiz-choices">
        ${q.choices.map((c, i) => `<button class="quiz-choice" data-i="${i}" type="button"><span class="quiz-letter">${"ABCD"[i]}</span><code>${escapeHtml(c)}</code></button>`).join("")}
      </div>
      <div class="quiz-feedback" hidden></div>
      <div class="quiz-actions"><button class="btn btn-primary quiz-next" type="button" hidden>Next ▶</button></div>`;
    card.querySelectorAll(".quiz-choice").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.i)));
    card.querySelector(".quiz-next").addEventListener("click", () => { index++; index < questions.length ? render() : finish(); });
    card.classList.remove("swap-in"); void card.offsetWidth; card.classList.add("swap-in");
  }

  function choose(i) {
    if (answered) return;
    answered = true;
    const q = questions[index];
    const right = i === q.answer;
    if (right) { score++; sfx.success(); } else sfx.error();
    card.querySelectorAll(".quiz-choice").forEach((b, j) => {
      b.disabled = true;
      if (j === q.answer) b.classList.add("right");
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
    card.querySelector(".quiz-done").addEventListener("click", () => onDone && onDone({ score, total: questions.length }));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { start };
})();
