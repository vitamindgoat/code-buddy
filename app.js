/* ============================================================
   app.js — the main page
   Glues everything together:
     1. CodeMirror editor (starts empty), ghost letters, red underlines
     2. Navigation: modules -> lessons -> stages (lesson, practice, quiz)
     3. Lesson panel, sidebar, progress, saved in localStorage
     4. The buddy floats inside the editor, level with your line
     5. Run button -> sandbox worker -> output -> tutor reacts
     6. Sounds, effects, banners, tours
   ============================================================ */

const BUILD = document.querySelector('meta[name="build"]').content; // cache-busting, see index.html
const TIME_LIMIT_MS = 3000; // if code runs longer than this, we stop it
const SAVE_KEY = "codebuddy.progress";

// ---------- 1. Editor ----------

const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: "python",
  lineNumbers: true,
  indentUnit: 4,     // Python's standard indent is 4 spaces
  tabSize: 4,
  indentWithTabs: false,
  lineWrapping: true,
  autofocus: true,
});

// ---------- 2. Elements ----------

const $ = (id) => document.getElementById(id);
const runBtn = $("run-btn"), resetBtn = $("reset-btn"), prevBtn = $("prev-btn"), nextBtn = $("next-btn");
const voicePick = $("set-voicepick");
const outputEl = $("output"), statusEl = $("status"), stepsEl = $("steps");
const editorWrap = document.querySelector(".editor-wrap");
const editorCard = document.querySelector(".editor-card"), outputCard = document.querySelector(".output-card");
const quizCard = $("quiz-card"), readCard = $("read-card"), stuckTag = $("stuck-tag"), runTag = $("run-tag"), doneEl = $("done");

// ---------- 3. Where we are: lesson index + stage ----------

// stage: "lesson" (guided) -> "practice" (on your own) -> for the last
// lesson of a module, "quiz" -> next module
let lessonIndex = 0;
let stage = "lesson";
let lastRunOutput = null;   // practice: what the last Run printed (null = not run yet)
// done: which stages are finished. work: everything in progress, keyed by
// stage (your code in each lesson/practice, which quiz question you're on,
// which reading card). scores: quiz results.
let progress = { done: {}, work: {}, scores: {}, lessonIndex: 0, stage: "lesson", toured: false, lessonsFinished: 0 };
try { progress = { ...progress, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") }; } catch {}
progress.work = progress.work || {}; progress.scores = progress.scores || {};

function saveProgress() {
  progress.lessonIndex = lessonIndex; progress.stage = stage;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch {}
}
// The key for what's on screen right now (lesson id + stage, or module + quiz)
const workKey = () => (stage === "quiz" ? `${module_().id}:quiz` : `${lesson().id}:${stage}`);
function saveWork(patch) {
  progress.work[workKey()] = { ...(progress.work[workKey()] || {}), ...patch };
  saveProgress();
}
let codeSaveTimer = null;
function saveCodeSoon() {
  clearTimeout(codeSaveTimer);
  codeSaveTimer = setTimeout(() => { if (stage === "lesson" || stage === "practice") saveWork({ code: editor.getValue(), hintsUsed: tutor.current.hintsUsed, ghostAsked: tutor.current.ghostAsked }); }, 300);
}

const lesson = () => LESSONS[lessonIndex];
const module_ = () => MODULES[lesson().moduleIndex];
const isLastInModule = () => lesson().lessonIndex === module_().lessons.length - 1;
const doneId = () => (stage === "lesson" ? lesson().id : stage === "practice" ? lesson().id + "-practice" : module_().id + "-quiz");
const isDone = (id) => !!progress.done[id];
const isReading = (l = lesson()) => l.type === "read";

// What the Next button leads to from the current stage.
// Coding lesson -> its practice -> next lesson (or the module quiz).
// Reading lesson -> next lesson (or the quiz). Quiz -> next module.
function nextTarget() {
  const afterLesson = () => {
    if (isLastInModule()) return { lessonIndex, stage: "quiz", label: "Module quiz ▶" };
    const n = LESSONS[lessonIndex + 1];
    return { lessonIndex: lessonIndex + 1, stage: "lesson", label: isReading(n) ? "Next: reading ▶" : "Next lesson ▶" };
  };
  if (stage === "lesson") return isReading() ? afterLesson() : { lessonIndex, stage: "practice", label: "Practice ▶" };
  if (stage === "practice") return afterLesson();
  if (lessonIndex + 1 < LESSONS.length) return { lessonIndex: lessonIndex + 1, stage: "lesson", label: "Next module ▶" };
  return null;
}
function prevTarget() {
  if (stage === "practice") return { lessonIndex, stage: "lesson" };
  const lastStageOf = (i) => (isReading(LESSONS[i]) ? "lesson" : "practice");
  if (stage === "quiz") return { lessonIndex, stage: lastStageOf(lessonIndex) };
  if (lessonIndex === 0) return null;
  return { lessonIndex: lessonIndex - 1, stage: lastStageOf(lessonIndex - 1) };
}

// ---------- 4. Lesson panel ----------

function renderHeader() {
  const l = lesson(), m = module_();
  const totalItems = LESSONS.length * 2 + MODULES.length;
  const doneCount = Object.keys(progress.done).length;
  $("progress-label").textContent = `Module ${l.moduleIndex + 1} · ${m.title}`;
  $("progress-fill").style.width = `${Math.min(100, (doneCount / totalItems) * 100)}%`;
  const kind = stage === "lesson" ? (isReading() ? "Reading" : "Lesson") : stage === "practice" ? "Practice" : "Quiz";
  $("stage-badge").textContent = kind;
  $("stage-badge").className = "stage-badge stage-" + (isReading() && stage === "lesson" ? "read" : stage);
  $("lesson-number").textContent = stage === "quiz" ? `Module ${l.moduleIndex + 1}` : l.number;
  $("lesson-title").textContent = stage === "quiz" ? `${m.title} quiz` : l.title;
  $("lesson-intro").innerHTML = stage === "practice" ? practiceGoalHtml(l.practice) : stage === "quiz" ? `${m.quiz.length} questions. No help from the buddy on this one!` : richText(l.intro);
  $("lesson-pill").textContent = stage === "quiz" ? `Quiz · Module ${l.moduleIndex + 1}` : `${kind} ${l.number} · ${l.title}`;

  // the expected output lives in the checklist now; this box only notes
  // what the user will type when the program asks
  $("practice-box").hidden = true;   // the goal block above covers inputs and output now

  prevBtn.disabled = !prevTarget();
  const nt = nextTarget();
  nextBtn.textContent = nt ? nt.label : "All done! 🎉";
  nextBtn.disabled = !nt || !isDone(doneId());
}

// *term* -> colored span, `code` -> chip (for the lesson panel)
// The practice goal always ends with the exact output to produce, so the
// learner never has to guess what "right" looks like.
function practiceGoalHtml(pr) {
  const inputs = pr.inputs ? `<div class="goal-inputs">When it asks, the user will type <code class="chip">${pr.inputs.map(escapeHtml).join("</code>, <code class=\"chip\">")}</code></div>` : "";
  return `${richText(pr.task)}${inputs}<div class="goal-out"><span class="goal-out-label">Your program should print</span><pre>${escapeHtml(pr.expectedOutput)}</pre></div>`;
}
function richText(s) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, (_, c) => `<code class="chip">${c}</code>`)
    .replace(/\*([^*]+)\*/g, (_, t) => `<span class="term term-blue">${t}</span>`);
}

// The step list: a checkmark for done lines, a pointer for the current one.
// In practice mode the lines are hidden (that would be the answer!) and we
// show how many lines are right so far.
function renderSteps(stepIndex) {
  stepsEl.innerHTML = "";
  if (stage === "quiz") return;
  if (isReading()) {
    lesson().cards.forEach((c, i) => {
      const li = document.createElement("li");
      li.className = i < stepIndex ? "done" : i === stepIndex ? "current" : "";
      li.innerHTML = `<span class="step-mark"></span><span>${escapeHtml(c.title)}</span>`;
      stepsEl.appendChild(li);
    });
    return;
  }
  if (stage === "practice") {
    // Practice is graded on OUTPUT, not on matching one exact solution:
    // one row per expected output line, ticked after a Run prints it.
    const want = lesson().practice.expectedOutput.split("\n");
    const got = lastRunOutput === null ? null : lastRunOutput.split("\n");
    want.forEach((line, i) => {
      const li = document.createElement("li");
      const ok = got !== null && got[i] === line;
      const bad = got !== null && !ok;
      li.className = "out-row " + (ok ? "done" : bad ? "wrong" : "");
      li.innerHTML = `<span class="step-mark"></span><code>${escapeHtml(line)}</code>${bad ? `<span class="out-got">${got[i] === undefined ? "(missing)" : escapeHtml(got[i])}</span>` : ""}`;
      stepsEl.appendChild(li);
    });
    if (got !== null && got.length > want.length) {
      const li = document.createElement("li");
      li.className = "out-row wrong";
      li.innerHTML = `<span class="step-mark"></span><code>(nothing else)</code><span class="out-got">${escapeHtml(got.slice(want.length).join(" / "))}</span>`;
      stepsEl.appendChild(li);
    }
    const hint = document.createElement("div");
    hint.className = "out-hint";
    hint.textContent = got === null ? "Press Run to check each line of output." : "";
    stepsEl.appendChild(hint);
    return;
  }
  lesson().steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.className = i < stepIndex ? "done" : i === stepIndex ? "current" : "";
    li.innerHTML = `<span class="step-mark"></span><code>${colorCode((tutor.displayCode(i) || step.code).trim())}</code>`;
    li.title = "Click to hear this step again";
    li.addEventListener("click", () => { tutor.review(i); editor.focus(); });
    stepsEl.appendChild(li);
  });
  if (stepIndex >= lesson().steps.length) {
    const li = document.createElement("li");
    li.className = "current run-step";
    li.innerHTML = `<span class="step-mark"></span><span>Press <strong>Run</strong></span>`;
    li.addEventListener("click", runCode);
    stepsEl.appendChild(li);
  }
}

function colorCode(code) {
  return buddy.tokenize(code).map((t) => (t.cls ? `<span class="tok ${t.cls}">${escapeHtml(t.text)}</span>` : escapeHtml(t.text))).join("");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- 5. Opening a lesson / practice / quiz ----------

function open(target) {
  lessonIndex = Math.max(0, Math.min(LESSONS.length - 1, target.lessonIndex));
  stage = target.stage;
  lastRunOutput = null;
  saveProgress();
  clearOutput();
  clearErrorLine();
  nextBtn.classList.remove("pulse");
  closeSidebar();
  if (tour.active) tour.end();      // a spotlight from before doesn't follow us
  if (!doneEl.hidden) hideDone();

  const showQuiz = stage === "quiz";
  const showRead = !showQuiz && isReading();
  editorCard.hidden = showQuiz || showRead; outputCard.hidden = showQuiz || showRead;
  quizCard.hidden = !showQuiz; readCard.hidden = !showRead;
  runTag.hidden = true; runBtn.classList.remove("pulse");

  renderHeader();
  const saved = target.fresh ? null : progress.work[workKey()];
  if (target.fresh) { delete progress.work[workKey()]; saveProgress(); }
  if (showRead) { renderSteps(0); read.start(lesson(), () => finishStage(), (i) => { renderSteps(i); saveWork({ index: i }); }, saved); }
  else if (stage === "lesson") tutor.start(lesson(), saved);
  else if (stage === "practice") tutor.startPractice(lesson(), saved);
  else { renderSteps(0); quiz.start(module_(), (r) => { progress.scores[module_().id] = r; finishStage(); }, sandbox, saved, (st) => saveWork(st)); }

  replayClass(document.querySelector(".lesson"), "swap-in");
  replayClass(showQuiz ? quizCard : showRead ? readCard : editorCard, "swap-in");
  renderSidebar();
  if (!showQuiz) editor.focus();
  sfx.pop();
}

// Something was finished (output matched, or quiz done)
function finishStage() {
  const first = !progress.done[doneId()];
  progress.done[doneId()] = true;
  if (stage === "lesson" || stage === "practice") { clearTimeout(codeSaveTimer); saveWork({ code: editor.getValue(), hintsUsed: tutor.current.hintsUsed, ghostAsked: tutor.current.ghostAsked, finished: true }); }
  else delete progress.work[workKey()];
  if (stage === "lesson" && first) progress.lessonsFinished = (progress.lessonsFinished || 0) + 1;
  saveProgress();
  renderHeader();
  renderSidebar();
  runTag.hidden = true; runBtn.classList.remove("pulse");
  if (stage === "quiz") { const t = nextTarget(); if (t) open(t); return; }   // the score screen was the celebration
  fx.confetti(); sfx.levelUp(); if (!isReading()) replayClass(outputCard, "success-flash");
  showDone();
  if (!nextBtn.disabled) nextBtn.classList.add("pulse");
}

// The "complete!" card. One big button takes you to the next step; "Stay
// here" closes it (the Next button keeps pulsing so the way on is obvious).
function showDone() {
  const t = nextTarget();
  const what = stage === "practice" ? "Practice" : isReading() ? "Reading" : "Lesson";
  $("done-kicker").textContent = `${what} ${lesson().number} · ${lesson().title}`;
  $("done-title").textContent = stage === "practice" ? "You solved it!" : isReading() ? "Reading complete!" : "Lesson complete!";
  $("done-sub").textContent = !t ? "That was the last one. You finished everything!"
    : t.stage === "practice" ? "Up next: a practice. Same idea, but you write it without my help."
    : t.stage === "quiz" ? "Up next: the module quiz. Everything in it was covered in the lessons."
    : `Up next: ${LESSONS[t.lessonIndex].number} · ${LESSONS[t.lessonIndex].title}`;
  $("done-next").textContent = t ? t.label : "Back to the start";
  $("done-next").onclick = () => { hideDone(); open(t || { lessonIndex: 0, stage: "lesson" }); };
  buddy.mount($("done-buddy"), "celebrate");
  doneEl.hidden = false;
  replayClass(doneEl, "show");
  setTimeout(() => $("done-next").focus(), 400);
}
function hideDone() { doneEl.hidden = true; }
$("done-stay").addEventListener("click", hideDone);
doneEl.addEventListener("click", (e) => { if (e.target === doneEl) hideDone(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !doneEl.hidden) hideDone(); });

// Remove-and-re-add a class so its CSS animation plays again
function replayClass(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// ---------- 6. Sidebar ----------

const sidebar = $("sidebar"), backdrop = $("sidebar-backdrop");
function renderSidebar() {
  const list = $("sidebar-list");
  list.innerHTML = MODULES.map((m, mi) => `
    <div class="sb-module">
      <div class="sb-module-title"><span class="sb-num">${mi + 1}</span><span class="sb-mtitle">${m.title}</span><span class="sb-blurb">${m.blurb}</span></div>
      ${m.lessons.map((l, li) => {
        const idx = LESSONS.findIndex((x) => x.id === l.id);
        const cur = idx === lessonIndex && stage !== "quiz";
        const reading = l.type === "read";
        return `<button class="sb-lesson ${cur ? "current" : ""} ${reading ? "sb-read" : ""}" data-idx="${idx}" type="button">
          <span class="sb-lnum">${mi + 1}.${li + 1}</span>
          <span class="sb-ltitle">${reading ? "📖 " : ""}${l.title}</span>
          <span class="sb-marks">
            <span class="sb-mark ${isDone(l.id) ? "on" : ""}" title="${reading ? "Reading" : "Lesson"}">${reading ? "R" : "L"}</span>
            ${reading ? "" : `<span class="sb-mark ${isDone(l.id + "-practice") ? "on" : ""}" title="Practice">P</span>`}
          </span></button>`;
      }).join("")}
      <button class="sb-lesson sb-quiz ${lessonIndex === LESSONS.findIndex((x) => x.id === m.lessons[m.lessons.length - 1].id) && stage === "quiz" ? "current" : ""}" data-quiz="${mi}" type="button">
        <span class="sb-lnum">★</span><span class="sb-ltitle">Module ${mi + 1} quiz</span>
        <span class="sb-marks"><span class="sb-mark ${isDone(m.id + "-quiz") ? "on" : ""}">Q</span></span></button>
    </div>`).join("");
  list.querySelectorAll(".sb-lesson[data-idx]").forEach((b) => b.addEventListener("click", () => open({ lessonIndex: +b.dataset.idx, stage: "lesson" })));
  list.querySelectorAll(".sb-lesson[data-quiz]").forEach((b) => b.addEventListener("click", () => {
    const m = MODULES[+b.dataset.quiz];
    open({ lessonIndex: LESSONS.findIndex((x) => x.id === m.lessons[m.lessons.length - 1].id), stage: "quiz" });
  }));
}
function openSidebar() { sidebar.classList.add("open"); sidebar.setAttribute("aria-hidden", "false"); backdrop.hidden = false; sfx.pop(); }
function closeSidebar() { sidebar.classList.remove("open"); sidebar.setAttribute("aria-hidden", "true"); backdrop.hidden = true; }
$("menu-btn").addEventListener("click", () => (sidebar.classList.contains("open") ? closeSidebar() : openSidebar()));
$("sidebar-close").addEventListener("click", closeSidebar);
backdrop.addEventListener("click", closeSidebar);
// Reset asks first (an in-app dialog, same look as the completion card)
const confirmEl = $("confirm");
function askReset() {
  closeSidebar();
  confirmEl.hidden = false; replayClass(confirmEl, "show");
  setTimeout(() => $("confirm-no").focus(), 300);
  sfx.pop();
}
$("confirm-no").addEventListener("click", () => { confirmEl.hidden = true; });
confirmEl.addEventListener("click", (e) => { if (e.target === confirmEl) confirmEl.hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !confirmEl.hidden) confirmEl.hidden = true; });
$("confirm-yes").addEventListener("click", () => { confirmEl.hidden = true; resetAll(); });
$("reset-btn-all").addEventListener("click", askReset);
function resetAll() {
  progress = { done: {}, work: {}, scores: {}, lessonIndex: 0, stage: "lesson", toured: progress.toured, lessonsFinished: 0 };
  saveProgress(); open({ lessonIndex: 0, stage: "lesson", fresh: true });
  buddy.say("# Fresh start\nEverything is reset. Let's begin again from the top!", "happy");
}
$("redo-tour-btn").addEventListener("click", () => { closeSidebar(); firstVisitTour(); });
$("tour-btn").addEventListener("click", firstVisitTour);

// ---------- 7. Wire the tutor to the page ----------

let activeLineHandle = null;   // the softly highlighted "you are here" line

tutor.ui.getCode = () => editor.getValue();
tutor.ui.getCursorLine = () => editor.getCursor().line;
tutor.ui.setCode = (text) => editor.setValue(text);
tutor.ui.renderSteps = renderSteps;
tutor.ui.stuckTag = (show) => { stuckTag.hidden = !show; if (show) sfx.pop(); };
tutor.ui.onPartDone = () => sfx.tick();
tutor.ui.onMistake = () => sfx.error();
tutor.ui.onComplete = () => finishStage();
// Whole program typed: point them at Run
tutor.ui.onReadyToRun = () => { runTag.hidden = false; runBtn.classList.add("pulse"); sfx.pop(); };
tutor.ui.explainLength = () => settings.explain;
tutor.ui.ghostMode = () => settings.ghost;
tutor.ui.markLine = (lineNumber) => {
  if (activeLineHandle) editor.removeLineClass(activeLineHandle, "background", "active-line");
  activeLineHandle = null;
  if (lineNumber !== null && lineNumber !== undefined && lineNumber < editor.lineCount()) {
    activeLineHandle = editor.addLineClass(lineNumber, "background", "active-line");
    floatBuddyToLine(lineNumber);
  }
};
// A line was finished: flash it green and pop sparkles at its end
tutor.ui.onStepDone = (lineNumber) => {
  sfx.lineDone();
  const handle = editor.addLineClass(lineNumber, "background", "done-line");
  setTimeout(() => editor.removeLineClass(handle, "background", "done-line"), 900);
  const end = editor.charCoords({ line: lineNumber, ch: editor.getLine(lineNumber).length }, "page");
  fx.burst(end.right + 10, (end.top + end.bottom) / 2 - window.scrollY);
};

// Ghost letters: gray text showing what's left to type. It's an OVERLAY
// drawn on top of the editor at the spot where the next character goes,
// never part of the document, so it can't move the cursor, count as
// characters, or wrap the line. Typing just runs over it.
const ghostEl = document.createElement("div");
ghostEl.className = "ghost";
editor.getWrapperElement().appendChild(ghostEl);
let ghostState = null;   // { lineNumber, text }

tutor.ui.ghost = (lineNumber, text) => {
  ghostState = (lineNumber === undefined || !text) ? null : { lineNumber, text };
  renderGhost();
};
function renderGhost() {
  if (!ghostState || ghostState.lineNumber >= editor.lineCount()) { ghostEl.hidden = true; return; }
  const { lineNumber, text } = ghostState;
  const pos = editor.charCoords({ line: lineNumber, ch: editor.getLine(lineNumber).length }, "page");
  const box = editor.getWrapperElement().getBoundingClientRect();
  ghostEl.textContent = text;
  ghostEl.style.left = `${pos.left - box.left}px`;
  ghostEl.style.top = `${pos.top - box.top}px`;
  ghostEl.hidden = false;
}
// Keep it glued to the text: recompute on every keystroke and scroll
editor.on("change", () => { const g = tutor.ghostNow(); ghostState = g && g.text ? g : null; renderGhost(); });
editor.on("scroll", renderGhost);
editor.on("cursorActivity", renderGhost);

// Red underline on the wrong part of a line
let wrongMark = null;
tutor.ui.markWrong = (lineNumber, fromCh, toCh) => {
  if (wrongMark) { wrongMark.clear(); wrongMark = null; }
  if (lineNumber === undefined || fromCh === null || fromCh === undefined) return;
  wrongMark = editor.markText({ line: lineNumber, ch: fromCh }, { line: lineNumber, ch: Math.max(fromCh + 1, toCh) }, { className: "wrong-char" });
};

// ---------- 8. The floating buddy ----------

let lastFloatY = 8;
function floatBuddyToLine(lineNumber) {
  const coords = editor.charCoords({ line: lineNumber, ch: 0 }, "page");
  const box = editorWrap.getBoundingClientRect();
  const lineCenter = (coords.top + coords.bottom) / 2 - box.top;
  const floatEl = $("buddy-float");
  const half = floatEl.offsetHeight / 2 || 60;
  const y = Math.max(8, Math.min(box.height - half * 2 - 8, lineCenter - half));
  if (Math.abs(y - lastFloatY) > 30) {
    // a little sparkle trail when he glides a good distance
    const r = $("buddy").getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, 6);
  }
  lastFloatY = y;
  buddy.floatTo(y);
}
editor.on("cursorActivity", () => floatBuddyToLine(editor.getCursor().line));
editor.on("scroll", () => floatBuddyToLine(editor.getCursor().line));
editor.on("change", () => { clearErrorLine(); tutor.onChange(); saveCodeSoon(); });
buddy.onClick(() => { sfx.click(); tutor.hint(); editor.focus(); clearTimeout(codeSaveTimer); if (stage === "lesson" || stage === "practice") saveWork({ code: editor.getValue(), hintsUsed: tutor.current.hintsUsed, ghostAsked: tutor.current.ghostAsked }); });

// ---------- 9. Running code safely ----------

// The sandbox: one worker running Python. sandbox.run(code, inputs, onLog)
// returns a promise with { ok, output, error, line, timeout }. The editor's
// Run button and the quiz's code questions both use it.
let worker = null, pythonReady = false, active = null, errorLineHandle = null, outputLines = [], running = false;

function startWorker() {
  pythonReady = false;
  runBtn.disabled = true;
  setStatus("running", "Loading Python…");
  worker = new Worker(`runner.js?v=${BUILD}`, { type: "module" });

  worker.onmessage = (event) => {
    const { type, text, line } = event.data;
    if (type === "ready") {
      pythonReady = true;
      runBtn.disabled = false;
      setStatus("", "");
      editorCard.classList.remove("loading");
      return;
    }
    if (!active) return;
    if (type === "log") { active.lines.push(text); active.onLog && active.onLog(text, false); }
    else if (type === "error") { active.onLog && active.onLog(text, true); }
    else if (type === "exception") { active.finish({ ok: false, error: text, line, output: active.lines.join("\n") }); }
    else if (type === "done") { active.finish({ ok: true, output: active.lines.join("\n") }); }
  };
  worker.onerror = (event) => {
    if (active) active.finish({ ok: false, error: event.message || "Unknown error", output: active.lines.join("\n") });
  };
}

const sandbox = {
  run(code, inputs = [], onLog = null) {
    return new Promise((resolve) => {
      if (!pythonReady || active) return resolve({ ok: false, error: "Python is busy", output: "" });
      const job = { lines: [], onLog, finish: null, timer: null };
      job.finish = (result) => { clearTimeout(job.timer); active = null; resolve(result); };
      active = job;
      worker.postMessage({ code, inputs });
      // Safety net: if we hear nothing for 3 seconds, assume an infinite loop.
      // The only way to stop a stuck worker is to kill it, so we do that and
      // start a fresh one (which means reloading Python).
      job.timer = setTimeout(() => {
        const finish = job.finish;
        worker.terminate();
        startWorker();
        finish({ ok: false, timeout: true, error: "Stopped: your code ran for too long. Is there a loop that never ends?", output: job.lines.join("\n") });
      }, TIME_LIMIT_MS);
    });
  },
  get ready() { return pythonReady && !active; },
};

async function runCode() {
  if (!pythonReady || running || active || stage === "quiz") return;   // ignore a second click mid-run
  running = true;
  buddy.finishTyping();
  const code = editor.getValue();
  const inputs = stage === "practice" ? (lesson().practice.inputs || []) : (lesson().inputs || []);

  clearOutput();
  clearErrorLine();
  runTag.hidden = true; runBtn.classList.remove("pulse");
  outputCard.classList.add("is-running");
  setStatus("running", "Running…");
  buddy.set("thinking");
  buddy.say("# Running\nLet's see what it does…");
  runBtn.disabled = true;
  replayClass(runBtn, "pressed");
  sfx.run();

  const r = await sandbox.run(code, inputs, (text, isError) => appendOutput(text, isError));
  finishRun();
  if (r.timeout) {
    appendOutput(r.error, true);
    setStatus("bad", "Timed out");
    buddy.set("thinking");
    buddy.say("# Infinite loop!\nYour program never finished, so I stopped it. Check that something inside the loop changes each time. Give me a second to reload Python.");
  } else if (!r.ok) {
    appendOutput(r.error, true);
    markErrorLine(r.line);
    setStatus("bad", "Error");
    sfx.error();
    replayClass(outputCard, "error-shake");
    if (!tutor.onError({ error: r.error, line: r.line })) {
      buddy.say(`# Python stopped${r.line ? ` on line ${r.line}` : ""}\nHere's what it said:\n\`${r.error}\`\n# Tip\nRead the last line of an *error* first: it names the problem.`, "pointing");
    }
    if (stage === "lesson") saveWork({ cpIndex: tutor.current.cpIndex, awaitingRun: tutor.current.awaitingRun });
  } else {
    if (outputLines.length === 0) appendOutput("(your program ran, but it didn't print anything)");
    setStatus("ok", "Ran successfully");
    if (stage === "practice") { lastRunOutput = outputLines.join("\n"); renderSteps(0); }
    tutor.onRun({ ok: true, output: outputLines.join("\n") });
    // remember which checkpoints have been run, so coming back doesn't ask
    // for a Run that already happened
    if (stage === "lesson") saveWork({ cpIndex: tutor.current.cpIndex, awaitingRun: tutor.current.awaitingRun });
  }
}

function finishRun() {
  running = false;
  runBtn.disabled = !pythonReady;
  outputCard.classList.remove("is-running");
  if (stage !== "quiz") editor.focus();   // back to typing without an extra click
}

// ---------- 10. Small helpers for the UI ----------

function clearOutput() {
  outputLines = [];
  outputEl.innerHTML = '<span class="output-hint">Press Run to see what your code does.</span>';
  setStatus("", "");
}
function appendOutput(text, isError = false) {
  if (outputLines.length === 0 && !outputEl.querySelector(".err")) outputEl.textContent = "";
  if (!isError) outputLines.push(text);
  const line = document.createElement("div");
  line.textContent = text;
  line.className = isError ? "err out-line" : "out-line";
  line.style.animationDelay = `${Math.min(outputEl.children.length, 12) * 40}ms`;
  outputEl.appendChild(line);
}
function setStatus(kind, text) { statusEl.className = "status " + kind; statusEl.textContent = text; }
function markErrorLine(line) {
  if (!line) return;
  errorLineHandle = editor.addLineClass(line - 1, "background", "error-line");
  floatBuddyToLine(line - 1);
}
function clearErrorLine() {
  if (errorLineHandle) { editor.removeLineClass(errorLineHandle, "background", "error-line"); errorLineHandle = null; }
}

// ---------- 11. Buttons ----------

runBtn.addEventListener("click", runCode);
resetBtn.addEventListener("click", () => open({ lessonIndex, stage, fresh: true }));   // Start over: forget the saved code too
prevBtn.addEventListener("click", () => { const t = prevTarget(); if (t) open(t); });
nextBtn.addEventListener("click", () => { const t = nextTarget(); if (t) open(t); });

function fillVoices() {
  const list = voice.voices();
  voicePick.innerHTML = list.map((v) => `<option value="${v.name}" ${voice.chosen && v.name === voice.chosen.name ? "selected" : ""}>${v.name.replace(/^Microsoft |^Google /, "")}</option>`).join("");
}
function setVoice(on, { greet = true } = {}) {
  if (voice.on !== on) voice.toggle();
  $("set-voice").checked = on;
  $("set-voicepick-row").hidden = !on;
  if (on) { fillVoices(); if (greet) voice.speak("Hi! I'm your coding buddy."); }
}
if (voice.on) setVoice(true, { greet: false });   // remembered from last visit
if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", fillVoices);

// Click sound + ripple on every button
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn, .quiz-choice, .sb-lesson, .steps li");
  if (btn && !btn.disabled) { fx.ripple(btn, e); if (!btn.classList.contains("quiz-choice")) sfx.click(); }
});

// Ctrl+Enter (or Cmd+Enter on Mac) runs the code
editor.setOption("extraKeys", { "Ctrl-Enter": runCode, "Cmd-Enter": runCode });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSidebar(); });

// ---------- 12. Settings ----------

const SETTINGS_KEY = "codebuddy.settings";
let settings = { speed: 1, explain: "normal", ghost: "always", textSize: "m", motion: "on" };
try { settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch {}

function applySettings() {
  buddy.setSpeed(settings.speed);
  voice.setRate(settings.speed);
  document.documentElement.dataset.textSize = settings.textSize;
  document.body.classList.toggle("reduce-motion", settings.motion === "off");
  editor.refresh();
  renderGhost();
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}
function syncSettingsUI() {
  $("set-speed").value = settings.speed;
  paintSpeed();
  $("set-explain").value = settings.explain;
  $("set-ghost").value = settings.ghost;
  $("set-size").value = settings.textSize;
  $("set-motion").checked = settings.motion !== "off";
  $("set-sound").checked = sfx.on;
  $("set-voice").checked = voice.on;
  $("set-voicepick-row").hidden = !voice.on;
  fillVoices();
}
const settingsLayer = $("settings-layer"), settingsBackdrop = $("settings-backdrop");
let settingsClosing = null;
function openSettings() {
  if (settingsClosing) { clearTimeout(settingsClosing); settingsClosing = null; }
  settingsLayer.classList.remove("closing"); settingsBackdrop.classList.remove("closing");
  syncSettingsUI();
  settingsBackdrop.hidden = false; settingsLayer.hidden = false;
  sfx.pop();
}
function closeSettings() {
  if (settingsLayer.hidden || settingsClosing) return;
  // play the exit animation, then actually hide
  settingsLayer.classList.add("closing"); settingsBackdrop.classList.add("closing");
  settingsClosing = setTimeout(() => {
    settingsLayer.hidden = true; settingsBackdrop.hidden = true;
    settingsLayer.classList.remove("closing"); settingsBackdrop.classList.remove("closing");
    settingsClosing = null;
  }, 170);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !settingsLayer.hidden) closeSettings(); });
$("settings-btn").addEventListener("click", openSettings);
$("settings-close").addEventListener("click", closeSettings);
settingsBackdrop.addEventListener("click", closeSettings);
// Slider: the label and track fill update on every pixel of the drag (cheap);
// the heavier applySettings (editor refresh, storage) runs when you let go.
function paintSpeed() {
  const el = $("set-speed"), v = +el.value, min = +el.min, max = +el.max;
  $("set-speed-val").textContent = `${v.toFixed(2)}×`;
  el.style.setProperty("--fill", `${((v - min) / (max - min)) * 100}%`);
}
$("set-speed").addEventListener("input", (e) => { settings.speed = +e.target.value; paintSpeed(); });
$("set-speed").addEventListener("change", applySettings);
$("set-explain").addEventListener("change", (e) => { settings.explain = e.target.value; applySettings(); });
$("set-ghost").addEventListener("change", (e) => { settings.ghost = e.target.value; applySettings(); tutor.onChange(); });
$("set-size").addEventListener("change", (e) => { settings.textSize = e.target.value; applySettings(); });
$("set-motion").addEventListener("change", (e) => { settings.motion = e.target.checked ? "on" : "off"; applySettings(); });
$("set-sound").addEventListener("change", (e) => { if (sfx.on !== e.target.checked) sfx.toggle(); });
$("set-voice").addEventListener("change", (e) => setVoice(e.target.checked));
$("set-voicepick").addEventListener("change", (e) => { voice.choose(e.target.value); voice.speak("How's this voice?"); });
$("set-tour").addEventListener("click", () => { closeSettings(); firstVisitTour(); });
$("set-reset").addEventListener("click", () => { closeSettings(); askReset(); });
$("set-test").addEventListener("click", () => {
  // testing the voice means you want to hear it: switch it on if it's off
  if (!voice.on) setVoice(true, { greet: false });
  buddy.say("# Testing\nThis is how fast I talk. You can change it any time in the settings.", "happy");
});

// ---------- 13. The tutorial ----------

function firstVisitTour() {
  closeSidebar();
  if (stage === "quiz") open({ lessonIndex, stage: "lesson" });
  tour.run([
    { target: "#menu-btn", title: "All the lessons", text: "This menu lists every module and lesson. Jump anywhere, see what you've finished.", place: "bottom" },
    { target: "#steps", title: "Your lesson", text: "Each row is one line of code you'll type. Click a row to hear it explained again.", place: "right" },
    { target: ".editor-wrap", title: "Type here", text: "<span class='ghost-demo'>Gray letters</span> show exactly what to type next. Type over them and they turn real. A red underline means a typo.", place: "left" },
    { target: "#buddy", title: "Meet your buddy", text: "He explains each piece as you type it. <strong>Click him</strong> whenever you're stuck. In practice you get 3 hints.", place: "left" },
    { target: "#run-btn", title: "Run your code", text: "Press Run (or Ctrl+Enter) to see what your program does.", place: "bottom" },
    { target: "#next-btn", title: "Reading → Coding → Practice → Quiz", text: "📖 Reading lessons teach the ideas (click through the cards). Coding lessons use them. Practice proves it. Each module ends with a quiz.", place: "top" },
    { target: "#settings-btn", title: "Settings", text: "Turn on his voice and pick one, set how fast he talks, sound effects, ghost letters, text size, and more.", place: "bottom" },
    { target: "#tour-btn", title: "See this again", text: "Click Tutorial any time to replay this walkthrough.", place: "bottom" },
  ], () => { progress.toured = true; saveProgress(); editor.focus(); });
}

// ---------- 14. Go ----------

// The logo: Buddy's own art peeking over a terminal, hands on its edge.
// Built from the idle/celebrate poses (assets/logo.svg) and inlined so CSS
// can swap the face and pump the arms. Hover and click both cheer.
fetch(`assets/logo.svg?v=${BUILD}`).then((r) => r.text()).then((svg) => {
  const el = $("brand-logo"); el.innerHTML = svg;
  const brand = document.querySelector(".brand");
  let party = null;
  const show = (pose) => el.setAttribute("data-pose", pose);
  show("idle");
  brand.addEventListener("mouseenter", () => { if (!party) show("celebrate"); });
  brand.addEventListener("mouseleave", () => { if (!party) show("idle"); });
  brand.addEventListener("click", () => {
    clearTimeout(party); show("celebrate"); sfx.pop();
    party = setTimeout(() => { party = null; show(brand.matches(":hover") ? "celebrate" : "idle"); }, 1400);
  });
}).catch(() => {});

applySettings();
renderHeader();
renderSidebar();
editorCard.classList.add("loading");
startWorker(); // Python loads in the background; Run stays disabled until it's ready
open({ lessonIndex: progress.lessonIndex || 0, stage: progress.stage || "lesson" });
if (!progress.toured) firstVisitTour();
window.addEventListener("resize", () => floatBuddyToLine(editor.getCursor().line));

// Dev helper: add ?debug to the URL to get buddy state buttons + "show all 5"
if (location.search.includes("debug")) {
  const bar = $("buddy-debug");
  bar.hidden = false;
  for (const state of ["idle", "thinking", "happy", "pointing", "celebrate"]) {
    const b = document.createElement("button"); b.textContent = state; b.onclick = () => buddy.set(state); bar.appendChild(b);
  }
  const all = document.createElement("button");
  all.textContent = "show all 5";
  all.onclick = () => {
    let strip = $("buddy-strip");
    if (strip) { strip.remove(); return; }
    strip = document.createElement("div"); strip.id = "buddy-strip"; strip.className = "buddy-strip";
    for (const state of ["idle", "thinking", "happy", "pointing", "celebrate"]) {
      const cell = document.createElement("div"); cell.className = "buddy-strip-cell";
      const copy = document.createElement("div"); buddy.mount(copy, state); cell.appendChild(copy);
      cell.insertAdjacentHTML("beforeend", `<span>${state}</span>`); strip.appendChild(cell);
    }
    document.body.appendChild(strip);
    const replay = setInterval(() => {
      if (!document.body.contains(strip)) return clearInterval(replay);
      for (const host of strip.querySelectorAll('.buddy[data-state="happy"], .buddy[data-state="celebrate"]')) {
        const state = host.getAttribute("data-state"); host.removeAttribute("data-state"); void host.offsetWidth; host.setAttribute("data-state", state);
      }
    }, 3000);
  };
  bar.appendChild(all);
}
