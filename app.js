/* ============================================================
   app.js — the main page
   Glues everything together:
     1. CodeMirror editor (starts empty)
     2. Lesson panel: steps, progress, next/back, saved progress
     3. The buddy floats inside the editor, level with your line
     4. Run button -> sandbox worker -> output -> tutor reacts
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

const runBtn = document.getElementById("run-btn");
const resetBtn = document.getElementById("reset-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const voiceBtn = document.getElementById("voice-btn");
const outputEl = document.getElementById("output");
const statusEl = document.getElementById("status");
const stepsEl = document.getElementById("steps");
const editorWrap = document.querySelector(".editor-wrap");

// ---------- 3. Lesson panel + saved progress ----------

let lessonIndex = 0;
let progress = { completed: [], current: 0 };
try { progress = { ...progress, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") }; } catch {}

function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch {}
}

function renderLessonHeader() {
  const lesson = LESSONS[lessonIndex];
  document.getElementById("lesson-title").textContent = lesson.title;
  document.getElementById("lesson-intro").textContent = lesson.intro;
  document.getElementById("lesson-pill").textContent = `Lesson ${lessonIndex + 1} · ${lesson.title}`;
  document.getElementById("progress-label").textContent = `Lesson ${lessonIndex + 1} of ${LESSONS.length}`;
  document.getElementById("progress-fill").style.width = `${(progress.completed.length / LESSONS.length) * 100}%`;
  prevBtn.disabled = lessonIndex === 0;
  nextBtn.disabled = !progress.completed.includes(lesson.id) || lessonIndex === LESSONS.length - 1;
}

// The step list: a checkmark for done lines, a pointer for the current one
function renderSteps(stepIndex) {
  const lesson = LESSONS[lessonIndex];
  stepsEl.innerHTML = "";
  lesson.steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.className = i < stepIndex ? "done" : i === stepIndex ? "current" : "";
    li.innerHTML = `<span class="step-mark"></span><code>${escapeHtml(step.code.trim())}</code>`;
    li.title = "Click to hear this step again";
    // Clicking a step rewinds the buddy's instructions to it. Code is untouched.
    li.addEventListener("click", () => { tutor.review(i); editor.focus(); });
    stepsEl.appendChild(li);
  });
  if (stepIndex >= lesson.steps.length) {
    const li = document.createElement("li");
    li.className = "current run-step";
    li.innerHTML = `<span class="step-mark"></span><span>Press <strong>Run</strong></span>`;
    li.addEventListener("click", runCode);
    stepsEl.appendChild(li);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function openLesson(index) {
  lessonIndex = Math.max(0, Math.min(LESSONS.length - 1, index));
  progress.current = lessonIndex;
  saveProgress();
  clearOutput();
  clearErrorLine();
  renderLessonHeader();
  tutor.start(lessonIndex);
  // slide-in animation for the panel and a soft flash on the editor
  replayClass(document.querySelector(".lesson"), "swap-in");
  replayClass(document.querySelector(".editor-card"), "swap-in");
  nextBtn.classList.remove("shake");
  editor.focus();
}

// The first time someone opens the app: a quick spotlight tour
function firstVisitTour() {
  tour.run([
    { target: "#steps", title: "Your lesson", text: "Each row is one line of code you'll type. They turn green as you go.", place: "right" },
    { target: ".editor-wrap", title: "Type here", text: "The editor starts empty on purpose: you write every line yourself.", place: "left" },
    { target: "#buddy-float", title: "Meet your buddy", text: "He explains each piece as you type it. Click him if you're ever stuck.", place: "left" },
    { target: "#run-btn", title: "Run your code", text: "Press Run (or Ctrl+Enter) to see what your program does.", place: "bottom" },
    { target: "#voice-btn", title: "Want him to talk?", text: "Turn on Voice and he'll read everything out loud.", place: "bottom" },
  ], () => { progress.toured = true; saveProgress(); editor.focus(); });
}

// Remove-and-re-add a class so its CSS animation plays again
function replayClass(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// ---------- 4. Wire the tutor to the page ----------

let activeLineHandle = null;   // the softly highlighted "you are here" line

tutor.ui.getCode = () => editor.getValue();
tutor.ui.getCursorLine = () => editor.getCursor().line;
tutor.ui.setCode = (text) => editor.setValue(text);
tutor.ui.renderSteps = renderSteps;
tutor.ui.unlockNext = (lessonId) => {
  if (!progress.completed.includes(lessonId)) progress.completed.push(lessonId);
  saveProgress();
  renderLessonHeader();
  fx.confetti();
  replayClass(document.querySelector(".output-card"), "success-flash");
  if (nextBtn.disabled) return;
  if (progress.completed.length === 1) {
    // their very first finished lesson: a game-style spotlight on Next
    setTimeout(() => tour.run([{
      target: "#next-btn", place: "top", waitForClick: true,
      title: "Lesson complete! 🎉",
      text: "Click <strong>Next lesson</strong> to keep going.",
    }]), 1800);
  } else {
    nextBtn.classList.add("shake");
  }
};

// Ghost letters: gray text after the cursor showing what's left to type.
// CodeMirror "bookmarks" let us pin a widget at a position in the text.
let ghostMark = null;
tutor.ui.ghost = (lineNumber, text) => {
  if (ghostMark) { ghostMark.clear(); ghostMark = null; }
  if (lineNumber === undefined || !text) return;
  const span = document.createElement("span");
  span.className = "ghost";
  span.textContent = text;
  ghostMark = editor.setBookmark({ line: lineNumber, ch: editor.getLine(lineNumber).length }, { widget: span, insertLeft: true });
};

// Red underline on the wrong part of a line
let wrongMark = null;
tutor.ui.markWrong = (lineNumber, fromCh, toCh) => {
  if (wrongMark) { wrongMark.clear(); wrongMark = null; }
  if (lineNumber === undefined || fromCh === null || fromCh === undefined) return;
  wrongMark = editor.markText({ line: lineNumber, ch: fromCh }, { line: lineNumber, ch: Math.max(fromCh + 1, toCh) }, { className: "wrong-char" });
};
// A line was finished: flash it green and pop sparkles at its end
tutor.ui.onStepDone = (lineNumber) => {
  const handle = editor.addLineClass(lineNumber, "background", "done-line");
  setTimeout(() => editor.removeLineClass(handle, "background", "done-line"), 900);
  const end = editor.charCoords({ line: lineNumber, ch: editor.getLine(lineNumber).length }, "page");
  fx.burst(end.right + 10, (end.top + end.bottom) / 2 - window.scrollY);
};
// Point the buddy at a line: highlight it and float next to it
tutor.ui.markLine = (lineNumber) => {
  if (activeLineHandle) editor.removeLineClass(activeLineHandle, "background", "active-line");
  activeLineHandle = null;
  if (lineNumber !== null && lineNumber < editor.lineCount()) {
    activeLineHandle = editor.addLineClass(lineNumber, "background", "active-line");
    floatBuddyToLine(lineNumber);
  }
};

// ---------- 5. The floating buddy ----------

// Put the buddy level with a line of code. CodeMirror tells us where the
// line is on the page; we convert that to a position inside the editor box.
function floatBuddyToLine(lineNumber) {
  const coords = editor.charCoords({ line: lineNumber, ch: 0 }, "page");
  const box = editorWrap.getBoundingClientRect();
  const lineCenter = (coords.top + coords.bottom) / 2 - box.top;
  const floatEl = document.getElementById("buddy-float");
  const half = floatEl.offsetHeight / 2 || 60;
  const y = Math.max(8, Math.min(box.height - half * 2 - 8, lineCenter - half));
  buddy.floatTo(y);
}

// Follow the cursor wherever the learner goes
editor.on("cursorActivity", () => floatBuddyToLine(editor.getCursor().line));
editor.on("scroll", () => floatBuddyToLine(editor.getCursor().line));
editor.on("change", () => {
  clearErrorLine();
  tutor.onChange();
});

// ---------- 6. Running code safely ----------

let worker = null;          // the sandbox that runs Python
let pythonReady = false;    // true once Pyodide has loaded inside the worker
let timer = null;           // the countdown that catches infinite loops
let errorLineHandle = null; // the editor line we highlighted red, if any
let outputLines = [];       // everything the program printed this run

function startWorker() {
  pythonReady = false;
  runBtn.disabled = true;
  setStatus("running", "Loading Python…");

  // type: "module" lets runner.js use import(), which Pyodide needs.
  worker = new Worker(`runner.js?v=${BUILD}`, { type: "module" });

  worker.onmessage = (event) => {
    const { type, text, line } = event.data;

    if (type === "ready") {
      pythonReady = true;
      runBtn.disabled = false;
      setStatus("", "");
      document.querySelector(".editor-card").classList.remove("loading");
      if (!tutor.current.lesson) {
        openLesson(progress.current || 0);
        if (!progress.toured) firstVisitTour();
      }
    } else if (type === "log") {
      appendOutput(text);
    } else if (type === "error") {
      appendOutput(text, true);
    } else if (type === "exception") {
      appendOutput(text, true);
      markErrorLine(line);
      setStatus("bad", "Error");
      finishRun();
      buddy.set("pointing");
      replayClass(document.querySelector(".output-card"), "error-shake");
      buddy.say(line
        ? `Python stopped on line ${line}.\nThe red text says why:\n\`${text}\``
        : `Python stopped.\nThe red text says why:\n\`${text}\``);
    } else if (type === "done") {
      if (outputLines.length === 0) appendOutput("(your program ran, but it didn't print anything)");
      setStatus("ok", "Ran successfully");
      finishRun();
      tutor.onRun({ ok: true, output: outputLines.join("\n") });
    }
  };

  worker.onerror = (event) => {
    appendOutput(event.message || "Unknown error", true);
    setStatus("bad", "Error");
    if (pythonReady) finishRun();
  };
}

let running = false;        // true while a run is in flight (blocks double-runs)

function runCode() {
  if (!pythonReady || running) return;   // ignore a second click mid-run
  running = true;
  if (timer) { clearTimeout(timer); timer = null; }
  buddy.finishTyping();
  const code = editor.getValue();

  clearOutput();
  document.querySelector(".output-card").classList.add("is-running");
  clearErrorLine();
  setStatus("running", "Running…");
  buddy.set("thinking");
  buddy.say("Running your code…");
  runBtn.disabled = true;
  replayClass(runBtn, "pressed");

  worker.postMessage({ code });

  // Safety net: if we hear nothing for 3 seconds, assume an infinite loop.
  // The only way to stop a stuck worker is to kill it, so we do that and
  // start a fresh one (which means reloading Python).
  timer = setTimeout(() => {
    appendOutput("Stopped: your code ran for too long. Is there a loop that never ends?", true);
    setStatus("bad", "Timed out");
    buddy.set("thinking");
    buddy.say("Your program never finished, so I stopped it. Check your loops! Reloading Python…");
    worker.terminate();
    timer = null;
    running = false;
    document.querySelector(".output-card").classList.remove("is-running");
    startWorker();
  }, TIME_LIMIT_MS);
}

function finishRun() {
  if (timer) { clearTimeout(timer); timer = null; }
  running = false;
  runBtn.disabled = false;
  document.querySelector(".output-card").classList.remove("is-running");
}

// ---------- 7. Small helpers for the UI ----------

function clearOutput() {
  outputLines = [];
  outputEl.innerHTML = '<span class="output-hint">Press Run to see what your code does.</span>';
  setStatus("", "");
}

function appendOutput(text, isError = false) {
  if (outputLines.length === 0) outputEl.textContent = "";
  if (!isError) outputLines.push(text);
  const line = document.createElement("div");
  line.textContent = text;
  if (isError) line.classList.add("err");
  outputEl.appendChild(line);
}

function setStatus(kind, text) {
  statusEl.className = "status " + kind;
  statusEl.textContent = text;
}

function markErrorLine(line) {
  if (!line) return;
  errorLineHandle = editor.addLineClass(line - 1, "background", "error-line");
  floatBuddyToLine(line - 1);
}

function clearErrorLine() {
  if (errorLineHandle) {
    editor.removeLineClass(errorLineHandle, "background", "error-line");
    errorLineHandle = null;
  }
}

// ---------- 8. Clicking the buddy: stuck or got this ----------

const buddyMenu = document.getElementById("buddy-menu");
buddy.onClick(() => {
  if (tutor.current.complete) return;
  buddyMenu.hidden = !buddyMenu.hidden;
  buddy.set("thinking");
});
document.getElementById("stuck-btn").addEventListener("click", () => {
  buddyMenu.hidden = true;
  tutor.stuck();
  editor.focus();
});
document.getElementById("gotit-btn").addEventListener("click", () => {
  buddyMenu.hidden = true;
  tutor.gotThis();
  editor.focus();
});
editor.on("change", () => { buddyMenu.hidden = true; });

// ---------- 9. Buttons ----------

runBtn.addEventListener("click", runCode);
resetBtn.addEventListener("click", () => openLesson(lessonIndex));
prevBtn.addEventListener("click", () => openLesson(lessonIndex - 1));
nextBtn.addEventListener("click", () => { nextBtn.classList.remove("shake"); openLesson(lessonIndex + 1); });

const voicePick = document.getElementById("voice-pick");
function fillVoices() {
  const list = voice.voices();
  voicePick.innerHTML = list.map((v) => `<option value="${v.name}" ${voice.chosen && v.name === voice.chosen.name ? "selected" : ""}>${v.name.replace(/^Microsoft |^Google /, "")}</option>`).join("");
}
voiceBtn.addEventListener("click", () => {
  const on = voice.toggle();
  voiceBtn.textContent = on ? "🔊 Voice on" : "🔇 Voice off";
  voiceBtn.setAttribute("aria-pressed", String(on));
  voicePick.hidden = !on;
  if (on) { fillVoices(); voice.speak("Hi! I'm your coding buddy."); }
});
voicePick.addEventListener("change", () => { voice.choose(voicePick.value); voice.speak("How's this voice?"); });
if ("speechSynthesis" in window) window.speechSynthesis.addEventListener("voiceschanged", () => { if (!voicePick.hidden) fillVoices(); });

// Click ripple on every button
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (btn && !btn.disabled) fx.ripple(btn, e);
});

// Ctrl+Enter (or Cmd+Enter on Mac) runs the code
editor.setOption("extraKeys", { "Ctrl-Enter": runCode, "Cmd-Enter": runCode });

// ---------- 9. Go ----------

renderLessonHeader();
document.querySelector(".editor-card").classList.add("loading");
buddy.say("Give me a sec,\nI'm waking up Python…");
buddy.set("thinking");
startWorker(); // the lesson opens once Python is ready (see "ready" above)
window.addEventListener("resize", () => floatBuddyToLine(editor.getCursor().line));

// Dev helper: add ?debug to the URL to get buddy state buttons + "show all 5"
if (location.search.includes("debug")) {
  const bar = document.getElementById("buddy-debug");
  bar.hidden = false;
  for (const state of ["idle", "thinking", "happy", "pointing", "celebrate"]) {
    const b = document.createElement("button");
    b.textContent = state;
    b.onclick = () => buddy.set(state);
    bar.appendChild(b);
  }
  const all = document.createElement("button");
  all.textContent = "show all 5";
  all.onclick = () => {
    let strip = document.getElementById("buddy-strip");
    if (strip) { strip.remove(); return; }
    strip = document.createElement("div");
    strip.id = "buddy-strip";
    strip.className = "buddy-strip";
    for (const state of ["idle", "thinking", "happy", "pointing", "celebrate"]) {
      const cell = document.createElement("div");
      cell.className = "buddy-strip-cell";
      const copy = document.createElement("div");
      buddy.mount(copy, state);
      cell.appendChild(copy);
      cell.insertAdjacentHTML("beforeend", `<span>${state}</span>`);
      strip.appendChild(cell);
    }
    document.body.appendChild(strip);
    const replay = setInterval(() => {
      if (!document.body.contains(strip)) return clearInterval(replay);
      for (const host of strip.querySelectorAll('.buddy[data-state="happy"], .buddy[data-state="celebrate"]')) {
        const state = host.getAttribute("data-state");
        host.removeAttribute("data-state");
        void host.offsetWidth;
        host.setAttribute("data-state", state);
      }
    }, 3000);
  };
  bar.appendChild(all);
}
